from __future__ import annotations

try:
    from backend.db.db_connection import get_connection
except ModuleNotFoundError:
    from ..db.db_connection import get_connection

from werkzeug.security import check_password_hash, generate_password_hash

VALID_ROLES = {"jobseeker", "recruiter"}


def register_user(name: str, email: str, password: str, role: str) -> dict[str, str | int]:
    if not name:
        raise ValueError("Name is required.")
    if not email:
        raise ValueError("Email is required.")
    if not password or len(password) < 6:
        raise ValueError("Password must be at least 6 characters long.")
    if role not in VALID_ROLES:
        raise ValueError("Role must be either jobseeker or recruiter.")

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id FROM login WHERE email = %s", (email,))
    if cur.fetchone():
        cur.close()
        conn.close()
        raise ValueError("An account with this email already exists.")

    hashed_password = generate_password_hash(password)
    cur.execute(
        """
        INSERT INTO login (name, email, password, role)
        VALUES (%s, %s, %s, %s)
        RETURNING id, name, email, role
        """,
        (name, email, hashed_password, role),
    )
    user = cur.fetchone()

    conn.commit()
    cur.close()
    conn.close()

    return {
        "id": user[0],
        "name": user[1],
        "email": user[2],
        "role": user[3],
    }


def login_user(email: str, password: str) -> dict[str, str | int] | None:
    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        """
        SELECT id, name, email, password, role
        FROM login
        WHERE email = %s
        """,
        (email,),
    )
    user = cur.fetchone()

    cur.close()
    conn.close()

    if user and check_password_hash(user[3], password):
        return {
            "id": user[0],
            "name": user[1],
            "email": user[2],
            "role": user[4],
        }

    return None
