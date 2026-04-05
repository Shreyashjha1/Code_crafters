from __future__ import annotations

import io
import unittest
from pathlib import Path
from unittest.mock import patch

import app as backend_app


class FakeCursor:
    def __init__(self, *, fetchone_values=None, fetchall_values=None, rowcount: int = 1):
        self.fetchone_values = list(fetchone_values or [])
        self.fetchall_values = list(fetchall_values or [])
        self.rowcount = rowcount
        self.executed: list[tuple[str, tuple | None]] = []

    def execute(self, query: str, params=None) -> None:
        self.executed.append((query, params))

    def fetchone(self):
        if self.fetchone_values:
            return self.fetchone_values.pop(0)
        return None

    def fetchall(self):
        if self.fetchall_values:
            return self.fetchall_values.pop(0)
        return []

    def close(self) -> None:
        return None


class FakeConnection:
    def __init__(self, cursor: FakeCursor):
        self._cursor = cursor
        self.committed = False

    def cursor(self) -> FakeCursor:
        return self._cursor

    def commit(self) -> None:
        self.committed = True

    def close(self) -> None:
        return None


class ApiRouteTests(unittest.TestCase):
    def setUp(self) -> None:
        backend_app.app.config.update(TESTING=True)
        self.client = backend_app.app.test_client()

    def test_login_sets_session_and_returns_user(self) -> None:
        user = {
            "id": 7,
            "name": "Shreyash",
            "email": "user@example.com",
            "role": "jobseeker",
        }

        with patch.object(backend_app, "login_user", return_value=user):
            response = self.client.post(
                "/api/auth/login",
                json={"email": "user@example.com", "password": "secret123"},
            )

        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.get_json()["user"]["role"], "jobseeker")

        session_response = self.client.get("/api/auth/me")
        self.assertEqual(session_response.status_code, 200)
        self.assertTrue(session_response.get_json()["authenticated"])

    def test_recruiter_route_blocks_jobseekers(self) -> None:
        with self.client.session_transaction() as session:
            session["user"] = "Candidate"
            session["role"] = "jobseeker"

        response = self.client.get("/api/recruiter/jobs")

        self.assertEqual(response.status_code, 403)
        self.assertEqual(
            response.get_json()["error"], "You are not authorized for this action."
        )

    def test_upload_resume_rejects_unsupported_extension(self) -> None:
        with self.client.session_transaction() as session:
            session["user"] = "Candidate"
            session["role"] = "jobseeker"

        response = self.client.post(
            "/api/resumes/analyze",
            data={
                "job_id": "1",
                "resume": (io.BytesIO(b"legacy doc"), "resume.doc"),
            },
            content_type="multipart/form-data",
        )

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json()["error"],
            "Only PDF, DOCX, and TXT files are supported.",
        )

    def test_upload_resume_success_persists_resume_and_sets_session(self) -> None:
        cursor = FakeCursor(
            fetchone_values=[
                (1, "Acme", "Backend Developer", "Python, Flask", "Build APIs", None),
                (9, "Candidate", "Python, Flask", 80, None, "resume.txt"),
            ]
        )
        connection = FakeConnection(cursor)

        upload_dir = Path(__file__).resolve().parent / "_tmp_uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)

        try:
            with self.client.session_transaction() as session:
                session["user"] = "Candidate"
                session["role"] = "jobseeker"

            with (
                patch.object(backend_app, "UPLOAD_FOLDER", upload_dir),
                patch.object(backend_app, "get_connection", return_value=connection),
                patch.object(
                    backend_app,
                    "analyze_resume",
                    return_value={
                        "score": 80,
                        "matched": ["python", "flask"],
                        "missing": [],
                        "suggestions": [],
                    },
                ),
                patch.object(backend_app, "extract_text", return_value="python flask"),
            ):
                response = self.client.post(
                    "/api/resumes/analyze",
                    data={
                        "job_id": "1",
                        "resume": (io.BytesIO(b"Python Flask"), "resume.txt"),
                    },
                    content_type="multipart/form-data",
                )
        finally:
            for file_path in upload_dir.glob("*"):
                file_path.unlink(missing_ok=True)
            upload_dir.rmdir()

        payload = response.get_json()
        self.assertEqual(response.status_code, 200)
        self.assertEqual(payload["result"]["score"], 80)
        self.assertEqual(payload["resume"]["name"], "Candidate")

        with self.client.session_transaction() as session:
            self.assertEqual(session["job_id"], 1)
            self.assertEqual(session["score"], 80)
            self.assertIn("resume_filename", session)

    def test_apply_requires_resume_analysis_first(self) -> None:
        with self.client.session_transaction() as session:
            session["user"] = "Candidate"
            session["role"] = "jobseeker"

        response = self.client.post("/api/applications")

        self.assertEqual(response.status_code, 400)
        self.assertEqual(
            response.get_json()["error"],
            "Upload and analyze a resume before applying.",
        )

    def test_apply_succeeds_after_analysis_session_exists(self) -> None:
        cursor = FakeCursor(fetchone_values=[None])
        connection = FakeConnection(cursor)

        with self.client.session_transaction() as session:
            session["user"] = "Candidate"
            session["role"] = "jobseeker"
            session["job_id"] = 3
            session["resume_filename"] = "resume-abc123.txt"
            session["score"] = 82

        with patch.object(backend_app, "get_connection", return_value=connection):
            response = self.client.post("/api/applications")

        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.get_json()["message"], "Applied successfully.")


if __name__ == "__main__":
    unittest.main()
