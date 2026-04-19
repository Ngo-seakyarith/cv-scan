import os
import json
from datetime import datetime, timedelta
from flask import Flask, render_template, request, redirect, url_for, flash, jsonify, send_file
from flask_jwt_extended import JWTManager, jwt_required, create_access_token, get_jwt_identity, get_jwt
from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import pandas as pd
from io import BytesIO
import tempfile
import fitz  # PyMuPDF
import docx
import google.generativeai as genai
from dotenv import load_dotenv
import re

# Load environment variables
load_dotenv()

app = Flask(__name__, template_folder='app/templates', static_folder='app/static')
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key-here')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://username:password@localhost/cv_scanner')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024  # 16MB max file size

# JWT Configuration - MUST be set before JWTManager initialization
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-string')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
app.config['JWT_TOKEN_LOCATION'] = ['cookies']
app.config['JWT_COOKIE_SECURE'] = False  # Set to True in production with HTTPS
app.config['JWT_COOKIE_CSRF_PROTECT'] = False  # Disable CSRF for simplicity
app.config['JWT_ACCESS_COOKIE_PATH'] = '/'
app.config['JWT_COOKIE_SAMESITE'] = 'Lax'

# Initialize extensions
db = SQLAlchemy(app)
jwt = JWTManager(app)

# Configure Gemini AI
genai.configure(api_key=os.getenv('GOOGLE_AI_API_KEY'))

# Allowed file extensions
ALLOWED_EXTENSIONS = {'pdf', 'docx'}

# Blacklist for JWT tokens
blacklisted_tokens = set()

@jwt.token_in_blocklist_loader
def check_if_token_revoked(jwt_header, jwt_payload):
    return jwt_payload['jti'] in blacklisted_tokens

# JWT Error handlers
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    print("JWT Error: Token expired")
    flash('Your session has expired. Please log in again.')
    return redirect(url_for('login'))

@jwt.invalid_token_loader
def invalid_token_callback(error):
    print(f"JWT Error: Invalid token - {error}")
    flash('Invalid token. Please log in again.')
    return redirect(url_for('login'))

@jwt.unauthorized_loader
def missing_token_callback(error):
    print(f"JWT Error: Missing token - {error}")
    flash('Please log in to access this page.')
    return redirect(url_for('login'))

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    is_admin = db.Column(db.Boolean, default=False)

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Candidate(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    email = db.Column(db.String(200))
    phone = db.Column(db.String(50))
    date_of_birth = db.Column(db.Date)
    skills = db.Column(db.JSON)  # Array of skills
    experience = db.Column(db.JSON)  # Experience details as JSON
    education = db.Column(db.JSON)  # Education details as JSON
    years_of_experience = db.Column(db.Float, default=0.0)
    original_filename = db.Column(db.String(200))
    upload_date = db.Column(db.DateTime, default=datetime.utcnow)
    extracted_text = db.Column(db.Text)

# Text extraction functions
def extract_text_from_pdf(file_path):
    try:
        doc = fitz.open(file_path)
        text = ""
        for page in doc:
            text += page.get_text()
        doc.close()
        return text
    except Exception as e:
        print(f"Error extracting PDF: {e}")
        return ""

def extract_text_from_docx(file_path):
    try:
        doc = docx.Document(file_path)
        text = ""
        for paragraph in doc.paragraphs:
            text += paragraph.text + "\n"
        return text
    except Exception as e:
        print(f"Error extracting DOCX: {e}")
        return ""

def extract_cv_data_with_ai(text):
    """Extract structured data from CV text using Gemini AI"""
    try:
        model = genai.GenerativeModel('gemini-2.5-flash-lite-preview-06-17')
        
        prompt = f"""
        Extract the following information from this CV text and return it as a JSON object:
        
        {{
            "name": "Full name of the candidate",
            "email": "Email address",
            "phone": "Phone number",
            "date_of_birth": "Date of birth in YYYY-MM-DD format or null",
            "skills": ["array", "of", "skills", "technologies", "programming languages"],
            "experience": [
                {{
                    "position": "Job title",
                    "company": "Company name",
                    "duration": "Duration (e.g., '2020-2023')",
                    "description": "Brief description"
                }}
            ],
            "education": [
                {{
                    "degree": "Degree name",
                    "institution": "Institution name",
                    "year": "Graduation year",
                    "field": "Field of study"
                }}
            ],
            "years_of_experience": 0.0
        }}
        
        Calculate years_of_experience as a float based on the work experience mentioned.
        If any field is not found, use null or empty array as appropriate.
        Make sure to return valid JSON only.
        
        CV Text:
        {text}
        """
        
        response = model.generate_content(prompt)
        response_text = response.text.strip()
        
        # Clean up the response to extract JSON
        if response_text.startswith('```json'):
            response_text = response_text[7:]
        if response_text.endswith('```'):
            response_text = response_text[:-3]
        
        data = json.loads(response_text)
        return data
    
    except Exception as e:
        print(f"Error with AI extraction: {e}")
        # Return basic structure if AI fails
        return {
            "name": "Unknown",
            "email": None,
            "phone": None,
            "date_of_birth": None,
            "skills": [],
            "experience": [],
            "education": [],
            "years_of_experience": 0.0
        }

# Routes
@app.route('/')
def index():
    # Check if user has valid JWT token in cookies
    if request.cookies.get('access_token_cookie'):
        try:
            # Try to verify the token
            from flask_jwt_extended import decode_token
            token = request.cookies.get('access_token_cookie')
            decode_token(token)
            return redirect(url_for('dashboard'))
        except:
            # Token is invalid, continue to show index page
            pass
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            # Convert user.id to string for JWT (Flask-JWT-Extended requires string identity)
            access_token = create_access_token(identity=str(user.id))
            response = redirect(url_for('dashboard'))
            # Use Flask-JWT-Extended's built-in cookie setting
            from flask_jwt_extended import set_access_cookies
            set_access_cookies(response, access_token)
            return response
        flash('Invalid username or password')
    
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        
        if User.query.filter_by(username=username).first():
            flash('Username already exists')
            return render_template('register.html')
        
        if User.query.filter_by(email=email).first():
            flash('Email already exists')
            return render_template('register.html')
        
        user = User(username=username, email=email)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        
        flash('Registration successful')
        return redirect(url_for('login'))
    
    return render_template('register.html')

@app.route('/logout')
@jwt_required()
def logout():
    token = get_jwt()
    jti = token['jti']
    blacklisted_tokens.add(jti)
    response = redirect(url_for('index'))
    # Use Flask-JWT-Extended's built-in cookie clearing
    from flask_jwt_extended import unset_jwt_cookies
    unset_jwt_cookies(response)
    return response

@app.route('/dashboard')
@jwt_required()
def dashboard():
    # Convert JWT identity back to integer for database query
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    candidates = Candidate.query.all()
    return render_template('dashboard.html', candidates=candidates, current_user=user)

@app.route('/upload', methods=['GET', 'POST'])
@jwt_required()
def upload_cv():
    if request.method == 'POST':
        if 'file' not in request.files:
            flash('No file selected')
            return redirect(request.url)
        
        file = request.files['file']
        if file.filename == '':
            flash('No file selected')
            return redirect(request.url)
        
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
            file.save(file_path)
            
            # Extract text based on file type
            if filename.lower().endswith('.pdf'):
                text = extract_text_from_pdf(file_path)
            elif filename.lower().endswith('.docx'):
                text = extract_text_from_docx(file_path)
            else:
                flash('Unsupported file type')
                return redirect(request.url)
            
            # Extract structured data using AI
            cv_data = extract_cv_data_with_ai(text)
            
            # Parse date of birth
            dob = None
            if cv_data.get('date_of_birth'):
                try:
                    dob = datetime.strptime(cv_data['date_of_birth'], '%Y-%m-%d').date()
                except:
                    dob = None
            
            # Create candidate record
            candidate = Candidate(
                name=cv_data.get('name', 'Unknown'),
                email=cv_data.get('email'),
                phone=cv_data.get('phone'),
                date_of_birth=dob,
                skills=cv_data.get('skills', []),
                experience=cv_data.get('experience', []),
                education=cv_data.get('education', []),
                years_of_experience=cv_data.get('years_of_experience', 0.0),
                original_filename=filename,
                extracted_text=text
            )
            
            db.session.add(candidate)
            db.session.commit()
            
            # Clean up uploaded file
            os.remove(file_path)
            
            flash('CV uploaded and processed successfully!')
            return redirect(url_for('dashboard'))
        
        flash('Invalid file type. Please upload PDF or DOCX files only.')
    
    return render_template('upload.html')

@app.route('/search')
@jwt_required()
def search():
    skills_filter = request.args.get('skills', '').strip()
    min_experience = request.args.get('min_experience', type=float)
    
    if skills_filter:
        # Get all candidates first for fuzzy matching
        all_candidates = Candidate.query.all()
        
        # Fuzzy search implementation
        from difflib import SequenceMatcher
        
        search_skills = [skill.strip().lower() for skill in skills_filter.split(',') if skill.strip()]
        matched_candidates = []
        
        for candidate in all_candidates:
            candidate_skills = candidate.skills if candidate.skills else []
            candidate_match = False
            
            for search_skill in search_skills:
                for candidate_skill in candidate_skills:
                    # Fuzzy match with threshold 0.6 (60% similarity)
                    similarity = SequenceMatcher(None, search_skill, candidate_skill.lower()).ratio()
                    if similarity >= 0.6:
                        candidate_match = True
                        break
                if candidate_match:
                    break
            
            # Check experience filter
            if candidate_match:
                if min_experience is None or candidate.years_of_experience >= min_experience:
                    matched_candidates.append(candidate)
        
        candidates = matched_candidates
    else:
        # No skill filter, just apply experience filter
        query = Candidate.query
        if min_experience:
            query = query.filter(Candidate.years_of_experience >= min_experience)
        candidates = query.all()
    
    return render_template('search_results.html', candidates=candidates, 
                         skills_filter=skills_filter, min_experience=min_experience)

@app.route('/export')
@jwt_required()
def export_candidates():
    skills_filter = request.args.get('skills', '').strip()
    min_experience = request.args.get('min_experience', type=float)
    
    if skills_filter:
        # Use same fuzzy search logic as search route
        from difflib import SequenceMatcher
        
        all_candidates = Candidate.query.all()
        search_skills = [skill.strip().lower() for skill in skills_filter.split(',') if skill.strip()]
        matched_candidates = []
        
        for candidate in all_candidates:
            candidate_skills = candidate.skills if candidate.skills else []
            candidate_match = False
            
            for search_skill in search_skills:
                for candidate_skill in candidate_skills:
                    # Fuzzy match with threshold 0.6 (60% similarity)
                    similarity = SequenceMatcher(None, search_skill, candidate_skill.lower()).ratio()
                    if similarity >= 0.6:
                        candidate_match = True
                        break
                if candidate_match:
                    break
            
            # Check experience filter
            if candidate_match:
                if min_experience is None or candidate.years_of_experience >= min_experience:
                    matched_candidates.append(candidate)
        
        candidates = matched_candidates
    else:
        # No skill filter, just apply experience filter
        query = Candidate.query
        if min_experience:
            query = query.filter(Candidate.years_of_experience >= min_experience)
        candidates = query.all()
      # Create Excel file
    data = []
    for candidate in candidates:
        # Format education properly
        education_text = ""
        if candidate.education:
            if isinstance(candidate.education, list):
                education_parts = []
                for edu in candidate.education:
                    if isinstance(edu, dict):
                        edu_str = f"{edu.get('degree', '')} at {edu.get('institution', '')}"
                        if edu.get('year'):
                            edu_str += f" ({edu.get('year')})"
                        education_parts.append(edu_str.strip())
                    else:
                        education_parts.append(str(edu))
                education_text = "; ".join(education_parts)
            else:
                education_text = str(candidate.education)
        
        # Format experience properly
        experience_text = ""
        if candidate.experience:
            if isinstance(candidate.experience, list):
                experience_text = "; ".join([str(exp) for exp in candidate.experience])
            else:
                experience_text = str(candidate.experience)
        
        data.append({
            'Name': candidate.name,
            'Email': candidate.email,
            'Phone': candidate.phone,
            'Date of Birth': candidate.date_of_birth.strftime('%Y-%m-%d') if candidate.date_of_birth else '',
            'Skills': ', '.join(candidate.skills) if candidate.skills else '',
            'Years of Experience': candidate.years_of_experience,
            'Experience Details': experience_text,
            'Education': education_text,
            'Upload Date': candidate.upload_date.strftime('%Y-%m-%d %H:%M:%S')
        })
    
    df = pd.DataFrame(data)
    
    # Create Excel file in memory
    output = BytesIO()
    with pd.ExcelWriter(output, engine='openpyxl') as writer:
        df.to_excel(writer, sheet_name='Candidates', index=False)
    
    output.seek(0)
    
    return send_file(
        output,
        as_attachment=True,
        download_name=f'candidates_export_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx',
        mimetype='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    )

@app.route('/candidate/<int:id>')
@jwt_required()
def view_candidate(id):
    candidate = Candidate.query.get_or_404(id)
    return render_template('candidate_detail.html', candidate=candidate)

@app.route('/delete_candidate/<int:id>')
@jwt_required()
def delete_candidate(id):
    candidate = Candidate.query.get_or_404(id)
    db.session.delete(candidate)
    db.session.commit()
    flash('Candidate deleted successfully')
    return redirect(url_for('dashboard'))

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
        
        # Create admin user if it doesn't exist
        if not User.query.filter_by(username='admin').first():
            admin = User(username='admin', email='admin@cvscanner.com', is_admin=True)
            admin.set_password('admin123')
            db.session.add(admin)
            db.session.commit()
            print("Admin user created: username=admin, password=admin123")
    
    app.run(debug=True)
