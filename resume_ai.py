import fitz  
import docx
import spacy
import os
from db.save_analysis import save_analysis


nlp = spacy.load("en_core_web_sm")

def extract_text(file_path):
    text = ""
    if file_path.endswith(".pdf"):
        pdf = fitz.open(file_path)
        for page in pdf:
            text += page.get_text()
    elif file_path.endswith(".docx"):
        doc = docx.Document(file_path)
        for para in doc.paragraphs:
            text += para.text + "\n"
    return text


def extract_skills(text):
    skills_list = [
        "python", "java", "c++", "sql", "machine learning",
        "data science", "flask", "django", "html", "css",
        "javascript", "react", "postgresql"
    ]
    text = text.lower()
    found_skills = [skill for skill in skills_list if skill in text]
    return ", ".join(found_skills)


def analyze_resume(file_path):
    text = extract_text(file_path)
    skills = extract_skills(text)

    
    save_analysis(file_path, skills)

    return {
        "file": os.path.basename(file_path),
        "skills": skills,
        "score": len(skills.split(",")) * 10
    }
