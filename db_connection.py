import psycopg2

def get_connection():
    return psycopg2.connect(
        dbname="resume_db",
        user="postgres",
        password="sql@@@",
        host="localhost",
        port="5432"
    )
