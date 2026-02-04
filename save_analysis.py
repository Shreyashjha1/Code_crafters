import psycopg2
import os
from db.db_connection import get_connection

def save_analysis(file_path, skills):
    filename = os.path.basename(file_path)
    score = len(skills.split(",")) * 10 if skills else 0

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        INSERT INTO resumes (name, skills, score)
        VALUES (%s, %s, %s)
    """, (filename, skills, score))

    conn.commit()
    cur.close()
    conn.close()
