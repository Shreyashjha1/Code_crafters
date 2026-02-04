from flask import Flask, render_template, request, redirect
import os
from AI_engine.resume_ai import analyze_resume
from db.db_connection import get_connection

app = Flask(__name__)

UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

@app.route("/")
def index():
    return render_template("upload.html")

@app.route("/upload", methods=["POST"])
def upload_resume():
    file = request.files["resume"]
    file_path = os.path.join(UPLOAD_FOLDER, file.filename)
    file.save(file_path)

    analyze_resume(file_path)  # AI + DB save
    return redirect("/dashboard")

@app.route("/dashboard")
def dashboard():
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("""
        SELECT name, skills, score, uploaded_at 
        FROM resumes 
        ORDER BY uploaded_at DESC
    """)
    data = cur.fetchall()
    cur.close()
    conn.close()

    return render_template("dashboard.html", data=data)

if __name__ == "__main__":
    app.run(debug=True)
