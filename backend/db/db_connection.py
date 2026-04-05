from __future__ import annotations

import os

import psycopg2


def get_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME", "resume_db"),
        user=os.getenv("DB_USER", "postgres"),
        password=os.getenv("DB_PASSWORD", ""),
        host=os.getenv("DB_HOST", "localhost"),
        port=os.getenv("DB_PORT", "5432"),
    )
