from __future__ import annotations
import os
from pathlib import Path
from functools import wraps

from flask import Flask, render_template, request, redirect, session, jsonify,flash
from flask_cors import CORS
from flask_session import Session
from werkzeug.utils import secure_filename
import psycopg2
from dotenv import load_dotenv
from flask import send_from_directory
from flask import send_file
from flask import send_from_directory, send_file
from pathlib import Path
from io import BytesIO
from zipfile import ZipFile
from datetime import datetime
from pathlib import Path
# Folders
BASE_DIR = Path(__file__).parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
BACKUP_FOLDER = BASE_DIR / "backup"
UPLOAD_FOLDER.mkdir(exist_ok=True)
BACKUP_FOLDER.mkdir(exist_ok=True)

from dotenv import load_dotenv
from pathlib import Path

env_path = Path(__file__).resolve().parent / ".env"
load_dotenv(dotenv_path=env_path)

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("FLASK_SECRET_KEY", "secret")
app.config["SESSION_TYPE"] = "filesystem"
Session(app)
CORS(app)

BASE_DIR = Path(__file__).resolve().parent
UPLOAD_FOLDER = BASE_DIR / "uploads"
UPLOAD_FOLDER.mkdir(exist_ok=True)

# 🔹 DB
def get_connection():
    return psycopg2.connect(
        dbname=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD"),
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT")
    )

# 🔹 AI Engine
from backend.AI_engine.resume_ai import analyze_resume

# 🔹 Auth decorator
def login_required(role=None):
    def wrapper(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if "user" not in session:
                return redirect("/")
            if role and session.get("role") != role:
                return "Unauthorized", 403
            return f(*args, **kwargs)
        return decorated
    return wrapper

# ================= AUTH =================
@app.route("/login", methods=["GET", "POST"])
@app.route("/", methods=["GET"])
def login():
    if request.method == "POST":
        username = request.form["email"]
        password = request.form["password"]

        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "SELECT username, role FROM users WHERE username=%s AND password=%s",
            (username, password)
        )
        user = cur.fetchone()
        cur.close()
        conn.close()

        if user:
            session["user"] = user[0]
            session["role"] = user[1]

            if user[1] == "recruiter":
                return redirect("/dashboard")
            else:
                return redirect("/upload_resume")

        flash("❌ Invalid credentials", "error")
        return redirect("/login")

    return render_template("login.html")


@app.route("/signup", methods=["GET","POST"])
def signup():
    if request.method == "POST":
        username = request.form["email"]
        password = request.form["password"]
        role = request.form["role"]

        conn = get_connection()
        cur = conn.cursor()

        
        cur.execute("SELECT * FROM users WHERE username=%s", (username,))
        existing_user = cur.fetchone()

        if existing_user:
            cur.close()
            conn.close()
            flash("⚠ Email already registered", "error")
            return redirect("/signup")

       
        cur.execute(
            "INSERT INTO users (username, password, role) VALUES (%s, %s, %s)",
            (username, password, role)
        )
        conn.commit()
        cur.close()
        conn.close()

        return redirect("/")

    return render_template("signup.html")


# ================= RECRUITER =================
@app.route("/dashboard")
@login_required(role="recruiter")
def dashboard():
    conn = get_connection()
    cur = conn.cursor()
    
    cur.execute("SELECT id, name, skills, score, uploaded_at FROM resumes ORDER BY uploaded_at DESC")
    data = cur.fetchall()
    cur.close()
    conn.close()
    
    formatted_data = []
    for row in data:
        app_id, name, resume_file, score, created_at = row
        formatted_data.append((app_id, name, resume_file, score, created_at))
    
    deleted_count = len(session.get("deleted_resumes", []))
    
    return render_template("dashboard.html", data=formatted_data, deleted_count=deleted_count)


@app.route("/post_job", methods=["GET", "POST"])
@login_required(role="recruiter")
def post_job():
    if request.method == "POST":
        company = request.form["company"]
        role_name = request.form["role"]
        skills = request.form["skills"]
        description = request.form["description"]
        expiry_date = request.form["expiry_date"]

        # 🔹 Save job in DB
        conn = get_connection()
        cur = conn.cursor()
        cur.execute(
            "INSERT INTO jobs (company, role, skills, description, expiry_date) VALUES (%s, %s, %s, %s, %s) RETURNING id",
            (company, role_name, skills, description, expiry_date)
        )
        job_id = cur.fetchone()[0]
        conn.commit()

        # 🔹 Fetch resumes WITH ID (IMPORTANT FIX)
        skill_list = [s.strip().lower() for s in skills.split(",")]

        cur.execute("SELECT id, name, skills, score FROM resumes")
        resumes = cur.fetchall()

        matched_resumes = []
        for res_id, name, resume_skills, score in resumes:
            resume_skill_set = set([s.strip().lower() for s in resume_skills.split(",") if s])
            matched = resume_skill_set.intersection(skill_list)
            matched_count = len(matched)

            matched_resumes.append({
                "id": res_id,  # ✅ THIS IS THE MAIN FIX
                "name": name,
                "matched_skills": list(matched),
                "matched_count": matched_count,
                "total_score": score
            })

        # 🔹 Sort and pick top 5
        matched_resumes.sort(
            key=lambda x: (x["matched_count"], x["total_score"]),
            reverse=True
        )
        top_5_resumes = matched_resumes[:5]

        cur.close()
        conn.close()

        return render_template(
            "post_job_result.html",
            job={"company": company, "role": role_name, "skills": skills},
            top_resumes=top_5_resumes
        )

    return render_template("post_job.html")


@app.route("/all_applications")
@login_required(role="recruiter")
def all_applications():
    conn = get_connection()
    cur = conn.cursor()

    # 🔥 CORRECT JOIN (resume name match)
    cur.execute("""
        SELECT 
            a.name,          -- applicant name
            a.resume,        -- resume filename
            a.score,
            j.role,          -- job role
            r.skills         -- extracted skills
        FROM applications a
        LEFT JOIN jobs j ON a.job_id = j.id
        LEFT JOIN resumes r ON a.resume = r.name
        ORDER BY a.score DESC
    """)

    data = cur.fetchall()

    cur.close()
    conn.close()

    return render_template("all_applications.html", data=data)

# ================= JOB SEEKER =================
@app.route("/upload_resume", methods=["GET", "POST"])
@login_required(role="jobseeker")
def upload():
    if request.method == "POST":
        file = request.files.get("resume")

        if not file:
            flash("⚠ No file selected", "error")
            return redirect(request.url)

        filename = secure_filename(file.filename)
        save_path = UPLOAD_FOLDER / filename
        file.save(save_path)

        job_skills = request.form.get("job_skills", "")
        job_id = request.form.get("job_id")

        # Analyze resume
        result = analyze_resume(str(save_path), job_skills)
        score = result.get("score", 0)
        matched_skills = ", ".join(result.get("matched", []))

        # Save in DB
        conn = get_connection()
        cur = conn.cursor()

        cur.execute(
            """
            INSERT INTO resumes (name, skills, score, uploaded_at, file_path)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (
                filename,
                matched_skills or job_skills,
                score,
                datetime.now(),
                str(save_path)
            )
        )

        conn.commit()
        cur.close()
        conn.close()

        # ✅ FIXED HERE (comma added)
        return render_template(
            "match_result.html",
            score=score,
            matched=result.get("matched", []),
            missing=result.get("missing", []),
            suggestions=result.get("suggestions", []),
            job_id=job_id,
            filename=filename   # ✅ NOW WORKS
        )

    # GET request
    conn = get_connection()
    cur = conn.cursor()
    cur.execute("SELECT * FROM jobs ORDER BY expiry_date ASC")
    jobs = cur.fetchall()
    cur.close()
    conn.close()

    return render_template("upload.html", jobs=jobs)

@app.route("/match_result")
@login_required(role="jobseeker")
def match_result():
    return render_template("match_result.html")


# ================= CHATBOT =================





from groq import Groq
# Initialize Groq client
groq_client = Groq(api_key="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")

@app.route("/chatbot", methods=["POST"])
def chatbot():
    try:
        data = request.get_json()
        print("RAW DATA:", data)

        user_message = data.get("message", "")
        print("USER MESSAGE:", user_message)

        if not user_message:
            return jsonify({"response": "⚠️ Empty message received"})

        chat_completion = groq_client.chat.completions.create(
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_message}
            ],
            model="llama-3.3-70b-versatile",
        )

        response = chat_completion.choices[0].message.content
        print("AI RESPONSE:", response)

        return jsonify({"response": response})

    except Exception as e:
        print("🔥 FULL ERROR:", str(e))
        return jsonify({"response": f"❌ Error: {str(e)}"})
# ================= LOGOUT =================
@app.route("/logout")
def logout():
    session.clear()
    return redirect("/")


@app.route("/apply_job", methods=["POST"])
@login_required(role="jobseeker")
def apply_job():
    username = session.get("user")

    score = request.form.get("score")
    job_id = request.form.get("job_id")
    resume_name = request.form.get("resume_name")  # ✅ FIX

    print("SCORE:", score)
    print("JOB ID:", job_id)
    print("RESUME:", resume_name)

    # ❌ Prevent crash
    if not score or not job_id or not resume_name:
        return "Error: Missing data", 400

    try:
        score = int(score)
        job_id = int(job_id)
    except:
        return "Error: Invalid data", 400

    conn = get_connection()
    cur = conn.cursor()

    cur.execute(
        "INSERT INTO applications (name, resume, score, job_id) VALUES (%s, %s, %s, %s)",
        (username, resume_name, score, job_id)
    )

    conn.commit()
    cur.close()
    conn.close()

    flash("✅ Applied successfully!", "success")
    return redirect("/upload_resume")   

@app.route("/delete_application/<filename>")
@login_required(role="recruiter")
def delete_application(filename):
    conn = get_connection()
    cur = conn.cursor()

    # 🔥 delete from DB first
    cur.execute("DELETE FROM applications WHERE resume=%s", (filename,))
    conn.commit()

    cur.close()
    conn.close()

    # 🔥 delete file
    file_path = UPLOAD_FOLDER / filename

    if file_path.exists():
        file_path.unlink()
        flash(f"✅ Deleted: {filename}", "success")
    else:
        flash(f"⚠ File not found: {filename}", "error")

    return redirect("/all_applications")

from flask import send_from_directory

@app.route("/download_application_resume/<filename>")
@login_required(role="recruiter")
def download_application_resume(filename):
    file_path = UPLOAD_FOLDER / filename

    print("Downloading:", file_path)  # DEBUG

    if file_path.exists():
        return send_file(file_path, as_attachment=True)
    else:
        flash(f"⚠ File not found: {filename}", "error")

    return redirect("/all_applications")

# Delete resume by ID
from pathlib import Path
from shutil import move
from flask import session, flash, redirect



# ---------------- DELETE ROUTE ----------------
@app.route("/delete_resume/<int:app_id>")
@login_required(role="recruiter")
def delete_resume(app_id):
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT name FROM resumes WHERE id=%s", (app_id,))
    result = cur.fetchone()
    if result:
        filename = result[0]
        resume_path = UPLOAD_FOLDER / filename

        if resume_path.exists():
            backup_path = BACKUP_FOLDER / filename
            move(str(resume_path), str(backup_path))
            # Store relative filename for undo
            deleted_list = session.get("deleted_resumes", [])
            deleted_list.append(filename)
            session["deleted_resumes"] = deleted_list
            flash(f"✅ Resume deleted successfully: {filename}", "success")
        else:
            flash(f"⚠ File not found: {resume_path}", "error")

        cur.execute("DELETE FROM resumes WHERE id=%s", (app_id,))
        conn.commit()
    else:
        flash("⚠ Resume not found in DB", "error")

    cur.close()
    conn.close()
    return redirect("/dashboard")


# ---------------- UNDO ROUTE ----------------
@app.route("/undo_delete")
@login_required(role="recruiter")
def undo_delete():
    deleted_list = session.get("deleted_resumes", [])

    if deleted_list:
        last_filename = deleted_list.pop()
        session["deleted_resumes"] = deleted_list

        backup_path = BACKUP_FOLDER / last_filename
        restore_path = UPLOAD_FOLDER / last_filename

        if backup_path.exists():
            move(str(backup_path), str(restore_path))
            # Re-insert in DB (minimal info)
            conn = get_connection()
            cur = conn.cursor()
            cur.execute(
                "INSERT INTO resumes (name, skills, score, uploaded_at, file_path) VALUES (%s, %s, %s, %s, %s)",
                (last_filename, "", 0, datetime.now(), str(restore_path))
            )
            conn.commit()
            cur.close()
            conn.close()

            flash(f"✅ Last deleted resume restored: {last_filename}", "success")
        else:
            flash(f"⚠ Undo failed. Backup missing: {last_filename}", "error")
    else:
        flash("⚠ No recently deleted resume to undo.", "error")

    return redirect("/dashboard")

@app.route("/download_resume/<int:app_id>")
@login_required(role="recruiter")
def download_resume(app_id):
    conn = get_connection()
    cur = conn.cursor()

    # 🔥 CHANGE HERE (use file_path instead of name)
    cur.execute("SELECT file_path FROM resumes WHERE id=%s", (app_id,))
    result = cur.fetchone()

    cur.close()
    conn.close()

    if result:
        file_path = Path(result[0])  # full path already saved

        print("Downloading:", file_path)  # DEBUG

        if file_path.exists():
            return send_file(file_path, as_attachment=True)
        else:
            flash(f"⚠ File not found: {file_path}", "error")
    else:
        flash(f"⚠ Resume not found for ID: {app_id}", "error")

    return redirect("/dashboard")


# Download all resumes as ZIP
@app.route("/download_all_resumes")
@login_required(role="recruiter")
def download_all_resumes():
    buffer = BytesIO()
    with ZipFile(buffer, 'w') as zip_file:
        for file in UPLOAD_FOLDER.iterdir():
            zip_file.write(file, arcname=file.name)
    buffer.seek(0)
    now = datetime.now().strftime("%Y%m%d%H%M%S")
    return send_file(buffer, as_attachment=True, download_name=f"all_resumes_{now}.zip")

# ================= RUN =================
if __name__ == "__main__":
    app.run(debug=True)

# ================= VERCEL HANDLER =================
#from vercel_wsgi import handle_wsgi

def handler(request, context):
    """Vercel serverless handler"""
    #return handle_wsgi(app, request, context)