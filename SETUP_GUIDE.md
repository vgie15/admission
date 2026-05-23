# Setup Guide

## Prerequisites Installation

### 1. Install Python (Backend)
- Download from https://www.python.org/downloads/
- Ensure Python 3.8+ is installed
- Verify installation: `python --version`

### 2. Install Node.js (Frontend)
- Download from https://nodejs.org/
- Ensure Node 16+ is installed
- Verify installation: `node --version` and `npm --version`

### 3. Supabase Setup
- Create account at https://supabase.com
- Create a new project
- Get your credentials:
  - Project URL
  - Anon Key
  - Service Role Key

## Backend Setup Steps

### Step 1: Navigate to backend folder
```bash
cd backend
```

### Step 2: Create virtual environment
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### Step 3: Install dependencies
```bash
pip install -r requirements.txt
```

### Step 4: Setup environment variables
```bash
# Copy example file
cp .env.example .env

# Edit .env with your Supabase credentials
```

Example `.env`:
```
FLASK_ENV=development
FLASK_DEBUG=True
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_anon_key_here
SUPABASE_SERVICE_KEY=your_service_role_key_here
JWT_SECRET_KEY=your-very-secret-key-change-this
UPLOAD_FOLDER=./uploads
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png,doc,docx
FLASK_PORT=5000
```

### Step 5: Setup database
1. Go to Supabase dashboard
2. Click "SQL Editor" 
3. Click "New Query"
4. Copy and paste the entire contents of `database_schema.sql`
5. Click "Run"

Wait for it to complete - you should see tables created:
- students
- admins
- courses
- enrollments
- documents

### Step 6: Create admin user (optional but recommended)
In Supabase SQL Editor, run:
```sql
-- First, generate a hashed password using Python:
-- from werkzeug.security import generate_password_hash
-- hashed = generate_password_hash('admin123')
-- Copy the hashed value below

INSERT INTO admins (email, password, first_name, last_name) 
VALUES (
  'admin@test.com', 
  'pbkdf2:sha256:600000$...',  -- Use generated hash
  'Admin',
  'User'
);
```

Or use Python to generate hash:
```python
from werkzeug.security import generate_password_hash
password_hash = generate_password_hash('admin123')
print(password_hash)
```

### Step 7: Start backend server
```bash
python run.py
```

Expected output:
```
 * Running on http://127.0.0.1:5000
 * Debug mode: on
```

## Frontend Setup Steps

### Step 1: Navigate to frontend folder
```bash
cd frontend
```

### Step 2: Install dependencies
```bash
npm install
```

This will download and install all required packages from package.json

### Step 3: Setup environment variables
```bash
# Copy example file
cp .env.example .env

# Verify the API URL matches your backend
```

Example `.env`:
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Admission Management System
```

### Step 4: Start development server
```bash
npm run dev
```

Expected output:
```
VITE v5.0.8  ready in 234 ms

➜  Local:   http://localhost:3000/
➜  press h to show help
```

Browser should automatically open to http://localhost:3000

## Verify Installation

### Check Backend
```bash
curl http://localhost:5000/api/health
```

Should return:
```json
{"status": "healthy"}
```

### Check Frontend
- Navigate to http://localhost:3000 in browser
- Should see landing page with login/register buttons

## Troubleshooting

### Issue: "ModuleNotFoundError" in backend
**Solution**: Ensure virtual environment is activated and dependencies are installed
```bash
pip install -r requirements.txt
```

### Issue: "Cannot find module" in frontend
**Solution**: Ensure node_modules are installed
```bash
npm install
```

### Issue: CORS errors
**Solution**: Verify SUPABASE_URL is correct and backend is running on http://localhost:5000

### Issue: Supabase connection failed
**Solution**: 
- Verify SUPABASE_URL format (should be https://...)
- Check SUPABASE_KEY is correct
- Ensure database schema is created

### Issue: JWT errors on login
**Solution**: Ensure JWT_SECRET_KEY is set in .env and is consistent

### Issue: File upload fails
**Solution**: Ensure uploads folder exists and has write permissions
```bash
mkdir uploads
chmod 755 uploads
```

## Database Connection Test

### Python script to test Supabase connection
```python
from app.utils import get_supabase

try:
    supabase = get_supabase()
    # Test query
    response = supabase.table('students').select('*').limit(1).execute()
    print("Connection successful!")
    print(f"Found {len(response.data)} students")
except Exception as e:
    print(f"Connection failed: {e}")
```

## Next Steps

1. **Create test student account**
   - Go to http://localhost:3000
   - Click "Register as Student"
   - Fill in the form
   - Submit

2. **Test student features**
   - Login with created account
   - Edit profile
   - Upload document
   - Select course
   - Check status

3. **Test admin features**
   - Login with admin credentials (admin@test.com / admin123)
   - View dashboard
   - Check applicants
   - Review applications
   - Export data

## Production Deployment

### Build Frontend
```bash
cd frontend
npm run build
```

Creates optimized build in `dist/` folder

### Deploy Backend
See Flask deployment guides for:
- Gunicorn + Nginx
- Docker
- Heroku
- AWS

### Deploy Frontend
- Deploy `dist/` folder to:
  - Vercel
  - Netlify
  - GitHub Pages
  - AWS S3

## Need Help?

Check the main README.md for:
- API endpoint documentation
- Feature overview
- Project structure
- Environment variables
