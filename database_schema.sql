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

-- course_choices table
CREATE TABLE IF NOT EXISTS course_choices (
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
  document_type VARCHAR(100) NOT NULL, -- birth_certificate, form_137, good_moral, id_photo
  filename VARCHAR(255) NOT NULL,
  file_path TEXT,
  uploaded_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Application feedback table
CREATE TABLE IF NOT EXISTS application_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  template_key VARCHAR(100),
  created_by UUID,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_students_email ON students(email);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_course_choices_student_id ON course_choices(student_id);
CREATE INDEX IF NOT EXISTS idx_course_choices_course_id ON course_choices(course_id);
CREATE INDEX IF NOT EXISTS idx_documents_student_id ON documents(student_id);
CREATE INDEX IF NOT EXISTS idx_feedback_student_id ON application_feedback(student_id);
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);

-- Existing project upgrade helpers
ALTER TABLE students ADD COLUMN IF NOT EXISTS application_type VARCHAR(50);
ALTER TABLE students ADD COLUMN IF NOT EXISTS school_year VARCHAR(20);
ALTER TABLE students ADD COLUMN IF NOT EXISTS semester VARCHAR(50);
ALTER TABLE course_choices ADD COLUMN IF NOT EXISTS choice_rank INTEGER DEFAULT 1;
CREATE INDEX IF NOT EXISTS idx_course_choices_choice_rank ON course_choices(choice_rank);

-- Sample courses (optional - remove if not needed)
INSERT INTO courses (name, code, description) VALUES
  ('BS Civil Engineering', 'BSCE', 'Bachelor of Science in Civil Engineering'),
  ('BS Mechanical Engineering', 'BSME', 'Bachelor of Science in Mechanical Engineering'),
  ('BS Electrical Engineering', 'BSEE', 'Bachelor of Science in Electrical Engineering'),
  ('BS Computer Engineering', 'BSCPE', 'Bachelor of Science in Computer Engineering'),
  ('BS Architecture', 'BSARCH', 'Bachelor of Science in Architecture'),
  ('BS Information Technology', 'BSIT', 'Bachelor of Science in Information Technology'),
  ('Mathematics', 'MATH', 'Mathematics program'),
  ('BS Mathematics', 'BSMATH', 'Bachelor of Science in Mathematics'),
  ('AB English Language', 'ABEL', 'Bachelor of Arts in English Language'),
  ('Bachelor of Secondary Education (BSEd)', 'BSED', 'Bachelor of Secondary Education')
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  updated_at = NOW();

-- Sample applicant data for analytics demos across recent academic years.
-- These rows use admission-demo emails so rerunning this script will not duplicate applicants.
WITH sample_students (
  email, first_name, last_name, gender, phone, address, city, province, zip_code,
  strand, gpa, previous_school, application_type, school_year, semester, status,
  approved_at, created_at, first_course_code, second_course_code, first_status, second_status
) AS (
  VALUES
    ('demo.ana@psu-ucc.test', 'Ana', 'Reyes', 'Female', '09170000001', 'Rizal St.', 'Urdaneta City', 'Pangasinan', '2428', 'STEM', 91.50, 'Urdaneta City NHS', 'Incoming Freshmen', '2026-2027', 'First Semester', 'approved', '2026-05-10T09:00:00', '2026-05-01T09:00:00', 'BSIT', 'BSCE', 'enrolled', 'not_selected'),
    ('demo.marc@psu-ucc.test', 'Marc', 'Santos', 'Male', '09170000002', 'Bonifacio St.', 'Binalonan', 'Pangasinan', '2436', 'STEM', 88.25, 'Binalonan NHS', 'Incoming Freshmen', '2026-2027', 'First Semester', 'pending', NULL, '2026-05-03T10:00:00', 'BSCPE', 'BSIT', 'selected', 'selected'),
    ('demo.ella@psu-ucc.test', 'Ella', 'Cruz', 'Female', '09170000003', 'San Vicente', 'Urdaneta City', 'Pangasinan', '2428', 'ABM', 86.75, 'PSU Integrated School', 'Incoming Freshmen', '2026-2027', 'First Semester', 'approved', '2026-05-12T11:30:00', '2026-05-04T08:30:00', 'ABEL', 'BSED', 'enrolled', 'not_selected'),
    ('demo.john@psu-ucc.test', 'John', 'Garcia', 'Male', '09170000004', 'Poblacion', 'Asingan', 'Pangasinan', '2439', 'STEM', 84.00, 'Asingan NHS', 'Incoming Freshmen', '2026-2027', 'First Semester', 'rejected', NULL, '2026-05-05T14:00:00', 'BSME', 'BSEE', 'selected', 'selected'),
    ('demo.mika@psu-ucc.test', 'Mika', 'Lim', 'Female', '09170000005', 'Nancayasan', 'Urdaneta City', 'Pangasinan', '2428', 'STEM', 93.10, 'Urdaneta City NHS', 'Incoming Freshmen', '2025-2026', 'First Semester', 'approved', '2025-08-21T10:15:00', '2025-08-15T09:45:00', 'BSARCH', 'BSCE', 'enrolled', 'not_selected'),
    ('demo.carlo@psu-ucc.test', 'Carlo', 'Mendoza', 'Male', '09170000006', 'Manaoag Road', 'Manaoag', 'Pangasinan', '2430', 'STEM', 87.30, 'Manaoag NHS', 'Incoming Freshmen', '2025-2026', 'First Semester', 'approved', '2025-08-25T13:20:00', '2025-08-16T11:00:00', 'BSCE', 'BSCPE', 'enrolled', 'not_selected'),
    ('demo.iris@psu-ucc.test', 'Iris', 'Aquino', 'Female', '09170000007', 'Centro', 'Villasis', 'Pangasinan', '2427', 'HUMSS', 82.60, 'Villasis NHS', 'Incoming Freshmen', '2025-2026', 'Second Semester', 'pending', NULL, '2026-01-12T09:20:00', 'BSED', 'ABEL', 'selected', 'selected'),
    ('demo.nico@psu-ucc.test', 'Nico', 'Ramos', 'Male', '09170000008', 'MacArthur Hwy', 'Pozorrubio', 'Pangasinan', '2435', 'STEM', 85.90, 'Pozorrubio NHS', 'Incoming Freshmen', '2025-2026', 'Second Semester', 'approved', '2026-01-20T15:40:00', '2026-01-14T10:15:00', 'BSEE', 'BSME', 'enrolled', 'not_selected'),
    ('demo.lara@psu-ucc.test', 'Lara', 'Torres', 'Female', '09170000009', 'Bayaoas', 'Urdaneta City', 'Pangasinan', '2428', 'STEM', 90.20, 'Urdaneta City NHS', 'Incoming Freshmen', '2024-2025', 'First Semester', 'approved', '2024-08-19T08:10:00', '2024-08-10T08:00:00', 'BSMATH', 'MATH', 'enrolled', 'not_selected'),
    ('demo.paolo@psu-ucc.test', 'Paolo', 'Dela Cruz', 'Male', '09170000010', 'Poblacion', 'Sta. Barbara', 'Pangasinan', '2419', 'STEM', 79.80, 'Sta. Barbara NHS', 'Incoming Freshmen', '2024-2025', 'First Semester', 'rejected', NULL, '2024-08-11T13:30:00', 'BSCE', 'BSARCH', 'selected', 'selected'),
    ('demo.sofia@psu-ucc.test', 'Sofia', 'Fernandez', 'Female', '09170000011', 'San Pedro', 'Alcala', 'Pangasinan', '2425', 'ABM', 89.40, 'Alcala NHS', 'Incoming Freshmen', '2024-2025', 'Second Semester', 'approved', '2025-01-28T14:30:00', '2025-01-20T12:00:00', 'BSIT', 'BSCPE', 'enrolled', 'not_selected'),
    ('demo.renz@psu-ucc.test', 'Renz', 'Castillo', 'Male', '09170000012', 'San Jose', 'Rosales', 'Pangasinan', '2441', 'STEM', 83.55, 'Rosales NHS', 'Incoming Freshmen', '2024-2025', 'Second Semester', 'pending', NULL, '2025-01-22T09:10:00', 'BSME', 'BSEE', 'selected', 'selected')
),
upserted_students AS (
  INSERT INTO students (
    email, password, first_name, last_name, gender, phone, address, city, province, zip_code,
    strand, gpa, previous_school, application_type, school_year, semester, role, status,
    approved_at, created_at, updated_at
  )
  SELECT
    email,
    'scrypt:32768:8:1$VevSr1HKIRHruxRF$1b3eebfaf349d3f752677246936189bc026191509ae36700856b00424334b12a76233a4a84b437bbd049d415a6632c347060b6cef0130aeb9781435ca80a559d',
    first_name, last_name, gender, phone, address, city, province, zip_code,
    strand, gpa, previous_school, application_type, school_year, semester, 'student', status,
    approved_at::timestamp, created_at::timestamp, NOW()
  FROM sample_students
  ON CONFLICT (email) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    gender = EXCLUDED.gender,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    province = EXCLUDED.province,
    zip_code = EXCLUDED.zip_code,
    strand = EXCLUDED.strand,
    gpa = EXCLUDED.gpa,
    previous_school = EXCLUDED.previous_school,
    application_type = EXCLUDED.application_type,
    school_year = EXCLUDED.school_year,
    semester = EXCLUDED.semester,
    status = EXCLUDED.status,
    approved_at = EXCLUDED.approved_at,
    updated_at = NOW()
  RETURNING id, email
),
sample_choices AS (
  SELECT
    us.id AS student_id,
    c.id AS course_id,
    choice.choice_rank,
    choice.status,
    ss.created_at::timestamp AS selected_at
  FROM upserted_students us
  JOIN sample_students ss ON ss.email = us.email
  CROSS JOIN LATERAL (
    VALUES
      (ss.first_course_code, 1, ss.first_status),
      (ss.second_course_code, 2, ss.second_status)
  ) AS choice(course_code, choice_rank, status)
  JOIN courses c ON c.code = choice.course_code
)
INSERT INTO course_choices (student_id, course_id, choice_rank, status, selected_at, created_at, updated_at)
SELECT student_id, course_id, choice_rank, status, selected_at, selected_at, NOW()
FROM sample_choices
ON CONFLICT (student_id, course_id) DO UPDATE SET
  choice_rank = EXCLUDED.choice_rank,
  status = EXCLUDED.status,
  selected_at = EXCLUDED.selected_at,
  updated_at = NOW();
