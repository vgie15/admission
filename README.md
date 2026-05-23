# Admission Management System

A comprehensive online admission and enrollment management system built with React, Flask, and Supabase.

## Project Overview

This system provides a complete solution for managing student admissions with separate interfaces for students and administrators.

### Features

#### Student Side
- User registration and login
- Online registration form with profile encoding
- Document upload (birth certificate, grades, ID, etc.)
- Course selection and enrollment
- Application status tracking
- Profile information management

#### Admin Side
- Admin authentication
- Comprehensive analytics dashboard with:
  - KPI summary cards (Total Applicants, Approved, Pending, Rejected)
  - Enrollment trend line chart
  - Applicants per course bar chart
  - Gender distribution donut chart
  - Enrollment status pie chart
  - Approval rate per course bar chart
- Applicant list with search and filtering
- Student profile viewer
- Approve/Reject applications with notes
- Excel data export
- Course management

## Tech Stack

### Backend
- **Framework**: Flask 3.0.0
- **Database**: Supabase (PostgreSQL)
- **Authentication**: JWT (Flask-JWT-Extended)
- **File Upload**: Werkzeug
- **Data Export**: OpenPyXL

### Frontend
- **Framework**: React 18.2.0
- **Routing**: React Router 6.20.0
- **Styling**: Tailwind CSS 3.3.6
- **Charts**: Chart.js + react-chartjs-2
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Build Tool**: Vite

## Project Structure

```
admission/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── student.py
│   │   │   └── admin.py
│   │   ├── models/
│   │   ├── utils/
│   │   │   └── supabase_client.py
│   │   └── __init__.py
│   ├── requirements.txt
│   ├── run.py
│   ├── .env.example
│   └── uploads/
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   │   ├── LoginPage.tsx
    │   │   ├── StudentRegisterPage.tsx
    │   │   ├── StudentDashboard.tsx
    │   │   ├── StudentProfilePage.tsx
    │   │   ├── StudentDocumentsPage.tsx
    │   │   ├── StudentCoursesPage.tsx
    │   │   ├── AdminDashboard.tsx
    │   │   ├── AdminApplicantsPage.tsx
    │   │   └── AdminStudentProfilePage.tsx
    │   ├── contexts/
    │   │   └── AuthContext.tsx
    │   ├── services/
    │   │   └── api.ts
    │   ├── utils/
    │   ├── App.tsx
    │   ├── main.tsx
    │   └── index.css
    ├── package.json
    ├── vite.config.ts
    ├── tsconfig.json
    ├── tailwind.config.js
    ├── index.html
    └── .env.example
```

## Installation & Setup

### Prerequisites
- Python 3.8+
- Node.js 16+
- Supabase account

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
```

3. Activate the virtual environment:
```bash
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

4. Install dependencies:
```bash
pip install -r requirements.txt
```

5. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

6. Fill in your Supabase credentials in `.env`:
```
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_role_key
JWT_SECRET_KEY=your_secret_key
```

7. Run the database schema:
   - Go to Supabase dashboard
   - Open SQL Editor
   - Paste contents of `database_schema.sql`
   - Execute the SQL

8. Start the Flask server:
```bash
python run.py
```

The backend will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from `.env.example`:
```bash
cp .env.example .env
```

4. Update environment variables if needed:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

5. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Authentication
- `POST /api/auth/student-register` - Register new student
- `POST /api/auth/student-login` - Student login
- `POST /api/auth/admin-login` - Admin login
- `GET /api/auth/verify-token` - Verify JWT token

### Student Endpoints
- `GET /api/student/profile` - Get student profile
- `PUT /api/student/profile` - Update profile
- `POST /api/student/upload-document` - Upload document
- `GET /api/student/courses` - Get available courses
- `POST /api/student/course-selection` - Enroll in course
- `GET /api/student/application-status` - Get application status
- `GET /api/student/documents` - Get uploaded documents

### Admin Endpoints
- `GET /api/admin/dashboard-stats` - Get KPI stats
- `GET /api/admin/applicants` - List applicants with filters
- `GET /api/admin/student/<id>` - Get student profile
- `PUT /api/admin/approve-student/<id>` - Approve student
- `PUT /api/admin/reject-student/<id>` - Reject student
- `GET /api/admin/export-data` - Export data to Excel
- `GET /api/admin/analytics/*` - Get analytics data
- `GET /api/admin/courses` - Get all courses
- `POST /api/admin/courses` - Create course

## Usage

### Student Flow
1. Register new account
2. Complete profile information
3. Upload required documents
4. Select course
5. Track application status

### Admin Flow
1. Login to admin account
2. View dashboard with analytics
3. Review applicants list
4. View individual student profiles
5. Approve or reject applications
6. Export data to Excel

## Testing Credentials

### Admin Account (create this in Supabase)
- Email: `admin@test.com`
- Password: `admin123` (hash with werkzeug)

### Test Student
- Register via the application

## Environment Variables

### Backend (.env)
```
FLASK_ENV=development
FLASK_DEBUG=True
SUPABASE_URL=your_url
SUPABASE_KEY=your_key
SUPABASE_SERVICE_KEY=your_service_key
JWT_SECRET_KEY=your_secret
UPLOAD_FOLDER=./uploads
ALLOWED_EXTENSIONS=pdf,jpg,jpeg,png,doc,docx
FLASK_PORT=5000
```

### Frontend (.env)
```
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_NAME=Admission Management System
```

## Features Implemented

✅ Student registration and login
✅ Admin authentication
✅ Profile information encoding
✅ Document upload
✅ Course selection
✅ Application status tracking
✅ Admin dashboard with analytics
✅ Student applicant management
✅ Approval/Rejection system
✅ Data export to Excel
✅ Search and filtering
✅ Responsive UI design

## Future Enhancements

- Email notifications
- SMS notifications
- Payment integration
- Student portal improvements
- Advanced reporting
- Mobile application
- Multi-language support
- Integration with external APIs

## Troubleshooting

### Backend Issues
- Ensure Supabase credentials are correct
- Check database schema is properly created
- Verify JWT_SECRET_KEY is set
- Check file upload folder permissions

### Frontend Issues
- Clear browser cache if styles don't load
- Ensure API_BASE_URL matches backend URL
- Check browser console for error details
- Verify environment variables are loaded

## Support & Contributing

For issues and questions, please create an issue or contact the development team.

## License

This project is proprietary and confidential.
