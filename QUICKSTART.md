# Quick Start Guide

## 5-Minute Setup

### 1. Backend (Terminal 1)
```bash
cd backend
python -m venv venv
venv\Scripts\activate  # or: source venv/bin/activate on Mac/Linux
pip install -r requirements.txt

# Copy .env file and fill in Supabase credentials
cp .env.example .env

# Start server
python run.py
```

### 2. Frontend (Terminal 2)
```bash
cd frontend
npm install

# Copy .env file (default settings should work)
cp .env.example .env

# Start dev server
npm run dev
```

## Access Points

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Supabase Dashboard**: https://supabase.com

## Default Credentials

### Admin (create via Supabase)
- Email: `admin@test.com`
- Password: `admin123` (hash with werkzeug)

### Student
- Create via registration page

## Key Routes

### Student
- Register: `/register`
- Dashboard: `/student/dashboard`
- Profile: `/student/profile`
- Documents: `/student/documents`
- Courses: `/student/courses`

### Admin
- Dashboard: `/admin/dashboard`
- Applicants: `/admin/applicants`
- Courses: `/admin/courses`

## Database Setup

1. Go to Supabase dashboard
2. Open SQL Editor
3. Paste contents of `database_schema.sql`
4. Run query
5. Done!

## Common Commands

### Backend
```bash
# Activate virtual environment
venv\Scripts\activate

# Install packages
pip install -r requirements.txt

# Run server
python run.py

# Deactivate virtual environment
deactivate
```

### Frontend
```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## First Steps After Setup

1. **Create test student**
   - Go to http://localhost:3000/register
   - Fill registration form
   - Submit

2. **Login and test**
   - Go to http://localhost:3000/login
   - Enter student credentials
   - Upload document
   - Select course

3. **Test admin**
   - Go to http://localhost:3000/admin/login
   - Use admin credentials
   - View dashboard
   - Review applicant
   - Approve/Reject

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Backend won't start | Check Python version, install requirements |
| Frontend won't start | Run `npm install`, check Node version |
| Supabase error | Verify .env credentials |
| Database error | Run database_schema.sql in Supabase |
| CORS error | Ensure backend URL in frontend .env |

## Need More Help?

- See SETUP_GUIDE.md for detailed instructions
- See README.md for feature overview
- See API documentation in routes files

## Next: Production

When ready to deploy:
1. Build frontend: `npm run build` in frontend folder
2. Deploy `dist/` folder to hosting (Vercel, Netlify, etc.)
3. Deploy backend (Flask app) to server (Heroku, AWS, etc.)
4. Update environment URLs in production .env files
