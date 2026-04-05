import unittest
from pathlib import Path

from AI_engine.resume_ai import analyze_resume


class AnalyzeResumeTests(unittest.TestCase):
    def test_matches_and_missing_are_reported(self) -> None:
        temp_dir = Path(__file__).resolve().parent / "_tmp"
        temp_dir.mkdir(parents=True, exist_ok=True)
        resume_file = temp_dir / "resume.txt"

        try:
            resume_file.write_text("Python Flask SQL Docker", encoding="utf-8")
            result = analyze_resume(str(resume_file), "Python, React, SQL")
        finally:
            if resume_file.exists():
                resume_file.unlink()
            if temp_dir.exists():
                temp_dir.rmdir()

        self.assertEqual(result["score"], 66)
        self.assertIn("python", result["matched"])
        self.assertIn("sql", result["matched"])
        self.assertIn("react", result["missing"])
