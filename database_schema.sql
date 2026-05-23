-- Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  gender VARCHAR(50),
  date_of_birth DATE,
  phone VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  province VARCHAR(100),
  zip_code VARCHAR(20),
  strand VARCHAR(100),
  gpa DECIMAL(4,2),
  previous_school VARCHAR(255),
  application_type VARCHAR(50),
  school_year VARCHAR(20),
  semester VARCHAR(50),
  role VARCHAR(20) DEFAULT 'student',
  status VARCHAR(20) DEFAULT 'pending', -- pending, approved, rejected
  approved_at TIMESTAMP,
  approved_by UUID,
  rejected_at TIMESTAMP,
  rejected_by UUID,
  admin_notes TEXT,
  rejection_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Admins table
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Courses table
CREATE TABLE IF NOT EXISTS courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Enrollments table
CREATE TABLE IF NOT EXISTS enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  choice_rank INTEGER DEFAULT 1,
  status VARCHAR(20) DEFAULT 'selected', -- selected, enrolled, not_selected, dropped, completed
  selected_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

-- Documents table
CREATE TABLE IF NOT EXISTS documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  document_type VARCHAR(100) NOT NULL, -- birth_certificate, high_school_diploma, etc.
  filename VARCHAR(255) NOT NULL,
  file_path TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_enrollments_student_id ON enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_course_id ON enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_documents_student_id ON documents(student_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Existing project upgrade helpers
ALTER TABLE students ADD COLUMN IF NOT EXISTS application_type VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_year VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
ALTER TABLE enrollments ADD COLUMN IF NOT EXISTS choice_rank INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_enrollments_choice_rank ON enrollments(choice_rank);

-- Sample courses (optional - remove if not needed)
INSERT INTO courses (name, code, description) VALUES
  ('Bachelor of Science in Information Technology', 'BSIT', 'A 4-year program focusing on IT'),
  ('Bachelor of Science in Business Administration', 'BSBA', 'A 4-year program in business'),
  ('Bachelor of Science in Engineering', 'BSE', 'A 4-year program in engineering')
ON CONFLICT (code) DO NOTHING;
