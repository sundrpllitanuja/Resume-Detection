"""
Resume Fraud Detection System - Backend API
Flask + ML + JWT Auth for detecting fraudulent resumes
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_bcrypt import Bcrypt
import sqlite3
import jwt
import datetime
import os
import json
import re
from functools import wraps
import numpy as np
import warnings
warnings.filterwarnings('ignore')

try:
    import pdfplumber
except ImportError:
    pdfplumber = None

try:
    from pypdf import PdfReader as PyPdfReader
except ImportError:
    PyPdfReader = None

try:
    from PyPDF2 import PdfReader
except ImportError:
    PdfReader = None

app = Flask(__name__)
CORS(app)
bcrypt = Bcrypt(app)

# ── Config ─────────────────────────────────────────────────────────────────────
SECRET_KEY = "frauddetect-hr-secret-key-change-in-production-2024"
DB_PATH = os.path.join(os.path.dirname(__file__), "fraud_detection.db")


# ── JWT Helpers ────────────────────────────────────────────────────────────────
def create_jwt(user_id, username, email, role="hr"):
    payload = {
        "user_id": user_id,
        "username": username,
        "email": email,
        "role": role,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=8),
    }
    return jwt.encode(payload, SECRET_KEY, algorithm="HS256")


def verify_jwt(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
    except Exception:
        return None


def require_hr(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth = request.headers.get("Authorization", "")
        token = auth.replace("Bearer ", "").strip()
        payload = verify_jwt(token)
        if not payload:
            return jsonify({"error": "Unauthorized – please log in"}), 401
        request.hr_user = payload
        return f(*args, **kwargs)
    return decorated


# ── DB ─────────────────────────────────────────────────────────────────────────
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    conn = get_db()
    c = conn.cursor()

    # HR users table
    c.execute("""
        CREATE TABLE IF NOT EXISTS hr_users (
            id       INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT    NOT NULL,
            email    TEXT    UNIQUE NOT NULL,
            password TEXT    NOT NULL,
            role     TEXT    NOT NULL DEFAULT 'hr',
            created_at TEXT  DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Fraud analyses table
    c.execute("""
        CREATE TABLE IF NOT EXISTS fraud_analysis (
            id             INTEGER PRIMARY KEY AUTOINCREMENT,
            candidate_name TEXT,
            email          TEXT,
            phone          TEXT,
            resume_text    TEXT,
            fraud_score    REAL,
            is_fraudulent  INTEGER,
            red_flags      TEXT,
            model_used     TEXT,
            analyzed_by    INTEGER REFERENCES hr_users(id),
            created_at     TEXT DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()

    # ── Migration: add columns that may be missing from older DB versions ──────
    existing_cols = {row[1] for row in c.execute("PRAGMA table_info(fraud_analysis)")}
    if "analyzed_by" not in existing_cols:
        c.execute("ALTER TABLE fraud_analysis ADD COLUMN analyzed_by INTEGER REFERENCES hr_users(id)")
        conn.commit()
        print("✅  Migration: added 'analyzed_by' column to fraud_analysis")

    # Seed default HR accounts
    defaults = [
        ("HR Admin",   "hr.admin@company.com",   "Admin@HR2024",   "admin"),
        ("HR Manager", "hr.manager@company.com",  "Manager@HR2024", "hr"),
    ]
    for username, email, password, role in defaults:
        c.execute("SELECT id FROM hr_users WHERE email = ?", (email,))
        if not c.fetchone():
            hashed = bcrypt.generate_password_hash(password).decode("utf-8")
            c.execute(
                "INSERT INTO hr_users (username, email, password, role) VALUES (?, ?, ?, ?)",
                (username, email, hashed, role),
            )

    conn.commit()

    # Seed resume examples if empty
    c.execute("SELECT COUNT(*) FROM fraud_analysis")
    if c.fetchone()[0] == 0:
        _seed_resumes(conn)

    conn.close()


def _seed_resumes(conn):
    legit = [
        ("JOHN SMITH", "john.smith@company.com", "(555) 123-4567",
         "JOHN SMITH\nEmail: john.smith@company.com | Phone: (555) 123-4567\n\n"
         "EXPERIENCE:\nSenior Software Engineer at TechCorp (2020-Present)\n"
         "- Developed Python/Django REST APIs\n- Led team of 3 engineers\n"
         "- Improved system performance by 40%\n\n"
         "Education: BS Computer Science, State University 2018", 0),
        ("SARAH JONES", "sarah.j@gmail.com", "(555) 234-5678",
         "SARAH JONES\nContact: sarah.j@gmail.com | (555) 234-5678\n\n"
         "EXPERIENCE:\nData Scientist at DataFlow Inc (2019-Present)\n"
         "- Built machine learning models using TensorFlow\n"
         "- Deployed 15+ models to production\n- Expertise in Python, R, SQL\n\n"
         "Education: MS Data Science, Tech Institute 2019", 0),
        ("MICHAEL CHEN", "m.chen@outlook.com", "(555) 345-6789",
         "MICHAEL CHEN\nEmail: m.chen@outlook.com | (555) 345-6789\n\n"
         "EXPERIENCE:\nDevOps Engineer at CloudSystems (2018-Present)\n"
         "- Managed AWS infrastructure for 200+ services\n"
         "- Containerized apps with Docker/Kubernetes\n"
         "- CI/CD pipeline automation with Jenkins\n\n"
         "Education: BS Information Technology, University 2016", 0),
        ("EMMA WILSON", "emma.w@company.com", "(555) 456-7890",
         "EMMA WILSON\nContact: emma.w@company.com | (555) 456-7890\n\n"
         "EXPERIENCE:\nFull Stack Developer at WebDev Solutions (2019-Present)\n"
         "- React.js frontend development\n- Node.js backend services\n"
         "- PostgreSQL database design\n\n"
         "Education: Bootcamp Certificate 2019, BS Math 2010", 0),
    ]
    fraud = [
        ("Suspicious Candidate 1", "sus1@test.com", "(555) 200-6000", "ABC", 1),
        ("Suspicious Candidate 2", "sus2@test.com", "(555) 201-6001",
         "EXPERIENCED PROFESSIONAL\n" + "EXPERT " * 20 + "in everything\nContact: xyz@mail.com", 1),
        ("Suspicious Candidate 3", "sus3@test.com", "(555) 202-6002",
         "NAME: ???\nWorked at [REDACTED] doing [REDACTED]\nNo contact info available", 1),
        ("Suspicious Candidate 4", "sus4@test.com", "(555) 203-6003",
         "CANDIDATE\nAll-Star Employee\nEducation: Self-taught expert\n999999999999999999\nEmail: work@job.job", 1),
    ]
    c = conn.cursor()
    for name, email, phone, text, is_fraud in legit + fraud:
        score = _calculate_fraud_score(text, name, email, phone)
        flags = _extract_red_flags(text)
        c.execute(
            "INSERT INTO fraud_analysis (candidate_name,email,phone,resume_text,fraud_score,is_fraudulent,red_flags,model_used) "
            "VALUES (?,?,?,?,?,?,?,?)",
            (name, email, phone, text, score, is_fraud, json.dumps(flags), "seed_data"),
        )
    conn.commit()


# ── Fraud detection logic ──────────────────────────────────────────────────────
def _extract_red_flags(text):
    flags = []
    low = text.lower()
    if len(text) < 200:
        flags.append("Suspiciously short resume")
    if text.count("*") > 10:
        flags.append("Excessive special characters")
    if re.search(r"\b\d{10,}\b", text):
        flags.append("Unusual number sequences")
    if low.count("expert") > 3 or low.count("master") > 3:
        flags.append("Over-inflated claims")
    lines = [l for l in text.split("\n") if l.strip()]
    if len(lines) != len(set(lines)):
        flags.append("Duplicate content detected")
    if "redacted" in low or "???" in text:
        flags.append("Hidden/redacted information")
    years = re.findall(r"\b(19|20)\d{2}\b", text)
    if len(years) > 15:
        flags.append("Inconsistent date patterns")
    return flags


def _calculate_fraud_score(text, name, email, phone):
    score = 0
    # Text length quality
    score += min(20, len(text) / 50)
    # Email
    if email and "@" in email:
        domain = email.split("@")[1].lower()
        common = {"gmail.com", "yahoo.com", "outlook.com", "company.com"}
        score += 5 if domain in common else 10
    # Phone
    if phone and len(re.sub(r"\D", "", phone)) >= 10:
        score += 10
    # Name
    if name and len(name.split()) >= 2:
        score += 15
    # Technical skills
    skills = len(re.findall(
        r"\b(python|java|react|aws|docker|kubernetes|machine learning|sql|typescript|node)\b",
        text.lower()
    ))
    score += min(20, skills * 3)
    # Vocabulary richness
    words = text.split()
    if len(words) > 30:
        score += min(10, len(set(words)) / max(len(words), 1) * 20)
    # Penalise red flags
    score -= len(_extract_red_flags(text)) * 5
    return round(max(0, min(100, score)), 2)


def _extract_text_from_pdf(file_obj):
    text = ""
    if pdfplumber:
        try:
            file_obj.seek(0)
            with pdfplumber.open(file_obj) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        text += t + "\n"
            if text.strip():
                return text.strip()
        except Exception:
            pass
    if PyPdfReader:
        try:
            file_obj.seek(0)
            pdf = PyPdfReader(file_obj)
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
            if text.strip():
                return text.strip()
        except Exception:
            pass
    if PdfReader:
        try:
            file_obj.seek(0)
            pdf = PdfReader(file_obj)
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"
            if text.strip():
                return text.strip()
        except Exception:
            pass
    raise ValueError("Could not extract text from PDF. Install pdfplumber: pip install pdfplumber")


# ── Auth routes ────────────────────────────────────────────────────────────────
@app.route("/api/auth/login", methods=["POST"])
def login():
    data = request.get_json() or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, username, email, password, role FROM hr_users WHERE LOWER(email) = ?", (email,))
    user = c.fetchone()
    conn.close()

    if not user:
        return jsonify({"error": "No account found with that email"}), 404

    if not bcrypt.check_password_hash(user["password"], password):
        return jsonify({"error": "Incorrect password"}), 401

    token = create_jwt(user["id"], user["username"], user["email"], user["role"])
    return jsonify({
        "success": True,
        "message": f"Welcome back, {user['username']}!",
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "email": user["email"],
            "role": user["role"],
        },
    })


@app.route("/api/auth/signup", methods=["POST"])
def signup():
    data = request.get_json() or {}
    username = data.get("username", "").strip()
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    if not username or not email or not password:
        return jsonify({"error": "All fields are required"}), 400
    if len(password) < 6:
        return jsonify({"error": "Password must be at least 6 characters"}), 400
    if not re.match(r"[^@]+@[^@]+\.[^@]+", email):
        return jsonify({"error": "Invalid email address"}), 400

    hashed = bcrypt.generate_password_hash(password).decode("utf-8")
    conn = get_db()
    c = conn.cursor()
    try:
        c.execute(
            "INSERT INTO hr_users (username, email, password, role) VALUES (?, ?, ?, 'hr')",
            (username, email, hashed),
        )
        conn.commit()
        user_id = c.lastrowid
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "An account with that email already exists"}), 409
    conn.close()

    token = create_jwt(user_id, username, email, "hr")
    return jsonify({
        "success": True,
        "message": "Account created successfully!",
        "token": token,
        "user": {"id": user_id, "username": username, "email": email, "role": "hr"},
    }), 201


@app.route("/api/auth/me", methods=["GET"])
@require_hr
def me():
    return jsonify({"success": True, "user": request.hr_user})


# ── Resume analysis routes ─────────────────────────────────────────────────────
@app.route("/api/analyze-resume", methods=["POST"])
@require_hr
def analyze_resume():
    try:
        resume_text = ""
        candidate_name = ""
        email = ""
        phone = ""

        if "file" in request.files:
            file = request.files["file"]
            if not file.filename.endswith(".pdf"):
                return jsonify({"success": False, "error": "Only PDF files supported"}), 400
            resume_text = _extract_text_from_pdf(file)
            candidate_name = request.form.get("candidate_name", "Unknown")
            email = request.form.get("email", "")
            phone = request.form.get("phone", "")
        else:
            data = request.get_json() or {}
            resume_text = data.get("resume_text", "")
            candidate_name = data.get("candidate_name", "")
            email = data.get("email", "")
            phone = data.get("phone", "")

        if not resume_text.strip():
            return jsonify({"success": False, "error": "No resume content provided"}), 400

        fraud_score = _calculate_fraud_score(resume_text, candidate_name, email, phone)
        red_flags = _extract_red_flags(resume_text)
        is_fraudulent = 1 if fraud_score < 40 else 0

        conn = get_db()
        c = conn.cursor()
        c.execute(
            "INSERT INTO fraud_analysis (candidate_name,email,phone,resume_text,fraud_score,is_fraudulent,red_flags,model_used,analyzed_by) "
            "VALUES (?,?,?,?,?,?,?,?,?)",
            (candidate_name, email, phone, resume_text, fraud_score, is_fraudulent,
             json.dumps(red_flags), "ensemble_v1", request.hr_user.get("user_id")),
        )
        conn.commit()
        analysis_id = c.lastrowid
        conn.close()

        risk = "HIGH" if fraud_score < 40 else "MEDIUM" if fraud_score < 65 else "LOW"
        return jsonify({
            "success": True,
            "analysis_id": analysis_id,
            "fraud_score": fraud_score,
            "is_fraudulent": is_fraudulent == 1,
            "risk_level": risk,
            "red_flags": red_flags,
            "confidence": round(min(100, abs(fraud_score - 50) * 2), 1),
        })

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500


@app.route("/api/analyses", methods=["GET"])
@require_hr
def get_analyses():
    conn = get_db()
    c = conn.cursor()
    c.execute("""
        SELECT fa.*, hu.username as analyzed_by_name
        FROM fraud_analysis fa
        LEFT JOIN hr_users hu ON fa.analyzed_by = hu.id
        ORDER BY fa.created_at DESC
    """)
    rows = [dict(r) for r in c.fetchall()]
    conn.close()
    for r in rows:
        if r.get("red_flags"):
            try:
                r["red_flags"] = json.loads(r["red_flags"])
            except Exception:
                r["red_flags"] = []
    return jsonify({"success": True, "analyses": rows})


@app.route("/api/fraud-statistics", methods=["GET"])
@require_hr
def get_statistics():
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT COUNT(*) as total FROM fraud_analysis")
    total = c.fetchone()["total"]
    c.execute("SELECT COUNT(*) as cnt FROM fraud_analysis WHERE is_fraudulent = 1")
    fraudulent = c.fetchone()["cnt"]
    c.execute("SELECT AVG(fraud_score) as avg FROM fraud_analysis")
    avg_score = c.fetchone()["avg"] or 0
    conn.close()
    return jsonify({
        "success": True,
        "statistics": {
            "total_analyzed": total,
            "fraudulent_detected": fraudulent,
            "legitimate": total - fraudulent,
            "detection_rate": round(fraudulent / total * 100 if total else 0, 1),
            "average_fraud_score": round(avg_score, 1),
        },
    })


@app.route("/api/hr-users", methods=["GET"])
@require_hr
def get_hr_users():
    """Admin-only: list all HR accounts"""
    if request.hr_user.get("role") != "admin":
        return jsonify({"error": "Admin access required"}), 403
    conn = get_db()
    c = conn.cursor()
    c.execute("SELECT id, username, email, role, created_at FROM hr_users ORDER BY created_at DESC")
    users = [dict(r) for r in c.fetchall()]
    conn.close()
    return jsonify({"success": True, "users": users})


@app.route("/api/health", methods=["GET"])
def health():
    return jsonify({"status": "healthy", "service": "Resume Fraud Detection API", "version": "2.0"})


if __name__ == "__main__":
    init_db()
    print("✅  Database initialised")
    print("✅  Pre-created HR accounts ready")
    print("🚀  Starting server on http://localhost:5000")
    app.run(debug=True, port=5000)