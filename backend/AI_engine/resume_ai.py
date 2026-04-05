import re
from PyPDF2 import PdfReader
import docx

# 🔴 EXTRACT TEXT FROM ANY FILE
def extract_text(file_path):
    file_path = str(file_path)   
    text = ""

    # 🔵 PDF
    if file_path.endswith(".pdf"):
        try:
            reader = PdfReader(file_path)
            for page in reader.pages:
                text += page.extract_text() or ""
        except Exception as e:
            print("PDF read error:", e)

    # 🔵 DOCX
    elif file_path.endswith(".docx"):
        try:
            doc = docx.Document(file_path)
            for para in doc.paragraphs:
                text += para.text + " "
        except Exception as e:
            print("DOCX read error:", e)

    # 🔵 TXT (fallback)
    else:
        try:
            with open(file_path, "r", errors="ignore") as f:
                text = f.read()
        except Exception as e:
            print("TXT read error:", e)

    return text.lower()


# 🔴 MAIN FUNCTION
def analyze_resume(file_path, job_skills):
    file_path = str(file_path)   

    text = extract_text(file_path)

    # 🔴 CLEAN TEXT
    text = re.sub(r'[^a-zA-Z0-9\s]', ' ', text)
    text = " ".join(text.split())

    # 🔴 DEBUG (optional)
    print("TEXT SAMPLE:", text[:200])
    print("JOB SKILLS:", job_skills)

    # 🔴 JOB SKILLS LIST
    job_list = [s.strip().lower() for s in job_skills.split(",") if s.strip()]

    matched = []
    missing = []

    # 🔴 MATCHING (supports multi-word skills)
    for skill in job_list:
        if skill in text:
            matched.append(skill)
        else:
            missing.append(skill)

    # 🔴 SCORE CALCULATION
    score = int((len(matched) / len(job_list)) * 100) if job_list else 0

    return {
        "score": score,
        "matched": matched,
        "missing": missing,
        "suggestions": [f"Add '{s}' to improve your resume" for s in missing]
    }