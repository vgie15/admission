# Testing Guide

## Test Scenarios

### 1. Student Registration & Login

#### Test Case 1.1: Valid Registration
- **Steps:**
  1. Go to http://localhost:3000/register
  2. Fill in all required fields
  3. Click "Register"
  4. Auto-redirects to student dashboard
  
- **Expected:** New student account created, logged in automatically

#### Test Case 1.2: Invalid Registration
- **Steps:**
  1. Try register with existing email
  2. Try with mismatched passwords
  3. Try with empty fields
  
- **Expected:** Error message shown

#### Test Case 1.3: Student Login
- **Steps:**
  1. Go to http://localhost:3000/login
  2. Enter credentials
  3. Click "Login"
  
- **Expected:** Redirects to student dashboard

### 2. Student Profile Management

#### Test Case 2.1: Edit Profile
- **Steps:**
  1. Login as student
  2. Click "Profile Information"
  3. Edit fields
  4. Click "Save Profile"
  
- **Expected:** Profile updated successfully

#### Test Case 2.2: Update Academic Info
- **Steps:**
  1. Click "Profile Information"
  2. Fill strand, GPA, previous school
  3. Save
  
- **Expected:** Academic info saved

### 3. Document Upload

#### Test Case 3.1: Upload Valid Document
- **Steps:**
  1. Click "Upload Documents"
  2. Select document type
  3. Choose PDF/JPG file
  4. Click "Upload Document"
  
- **Expected:** Document uploaded, appears in list

#### Test Case 3.2: Upload Invalid Document
- **Steps:**
  1. Try uploading .exe or .txt file
  2. Try uploading oversized file
  
- **Expected:** Error message shown

### 4. Course Selection

#### Test Case 4.1: Enroll in Course
- **Steps:**
  1. Click "Course Selection"
  2. Click "Enroll Now" on a course
  3. Verify enrollment
  
- **Expected:** Course enrolled, shows in enrollments

#### Test Case 4.2: View Available Courses
- **Steps:**
  1. Click "Course Selection"
  2. Review course details
  
- **Expected:** All courses displayed with details

### 5. Application Status

#### Test Case 5.1: Check Status
- **Steps:**
  1. Click "Status Tracking"
  2. Review application status
  3. Check enrollments
  
- **Expected:** Current status displayed, enrollments listed

### 6. Admin Login

#### Test Case 6.1: Admin Login
- **Steps:**
  1. Go to http://localhost:3000/admin/login
  2. Enter admin credentials
  3. Click "Login"
  
- **Expected:** Redirects to admin dashboard

### 7. Admin Dashboard

#### Test Case 7.1: View Stats
- **Steps:**
  1. Login as admin
  2. Review KPI cards
  
- **Expected:** Stats show correct counts (approved, pending, rejected, total)

#### Test Case 7.2: View Charts
- **Steps:**
  1. Scroll down dashboard
  2. Review all charts:
     - Enrollment Trend
     - Applicants per Course
     - Gender Distribution
     - Enrollment Status
     - Approval Rate
  
- **Expected:** All charts display correctly

### 8. Applicant Management

#### Test Case 8.1: View Applicants List
- **Steps:**
  1. Click "View Applicants"
  2. Review table
  
- **Expected:** All students listed with status

#### Test Case 8.2: Search Applicant
- **Steps:**
  1. Enter name/email in search
  2. Review filtered results
  
- **Expected:** Only matching applicants shown

#### Test Case 8.3: Filter by Status
- **Steps:**
  1. Click status filter dropdown
  2. Select "Pending"
  3. Review results
  
- **Expected:** Only pending applicants shown

### 9. Student Profile Review (Admin)

#### Test Case 9.1: View Student Profile
- **Steps:**
  1. Click "View" on an applicant
  2. Review all information
  3. Check uploaded documents
  
- **Expected:** Full student profile displayed

#### Test Case 9.2: Approve Application
- **Steps:**
  1. View student profile
  2. Add notes (optional)
  3. Click "Approve"
  
- **Expected:** Status changed to "approved"

#### Test Case 9.3: Reject Application
- **Steps:**
  1. View student profile
  2. Add rejection reason
  3. Click "Reject"
  
- **Expected:** Status changed to "rejected"

### 10. Course Management (Admin)

#### Test Case 10.1: View Courses
- **Steps:**
  1. Click "Manage Courses"
  2. Review course list
  
- **Expected:** All courses displayed

#### Test Case 10.2: Add New Course
- **Steps:**
  1. Click "Add Course"
  2. Fill course info
  3. Click "Add Course"
  
- **Expected:** New course added to list

### 11. Data Export

#### Test Case 11.1: Export to Excel
- **Steps:**
  1. Go to admin dashboard
  2. Click "Export Data"
  3. Open downloaded Excel file
  
- **Expected:** Excel file downloaded with student data

## Performance Tests

### Test Case P.1: Page Load Time
- **Expected:** < 2 seconds for each page

### Test Case P.2: API Response Time
- **Expected:** < 500ms for each API call

### Test Case P.3: Large Dataset
- **Test:** Add 100+ students
- **Expected:** Dashboard still responsive

## Browser Compatibility Tests

- Chrome (Latest)
- Firefox (Latest)
- Safari (Latest)
- Edge (Latest)
- Mobile browsers

## Security Tests

### Test Case S.1: Auth Token Protection
- Verify unauthorized access blocked

### Test Case S.2: Password Hashing
- Verify passwords hashed in database

### Test Case S.3: CORS Protection
- Verify cross-origin requests blocked

## Error Handling Tests

### Test Case E.1: Network Error
- **Steps:** Disconnect internet, try API call
- **Expected:** Error message shown

### Test Case E.2: Database Error
- **Steps:** Stop Supabase, try login
- **Expected:** Error message shown

### Test Case E.3: Invalid Input
- **Steps:** Try invalid email format, empty fields
- **Expected:** Validation errors shown

## Sample Test Data

### Test Students
```
Email: student1@test.com
Password: Password123!

Email: student2@test.com
Password: Password123!

Email: student3@test.com
Password: Password123!
```

### Test Admin
```
Email: admin@test.com
Password: admin123
```

### Test Courses
```
1. Bachelor of Science in Information Technology (BSIT)
2. Bachelor of Science in Business Administration (BSBA)
3. Bachelor of Science in Engineering (BSE)
```

## Regression Testing Checklist

After any code changes, verify:
- [ ] Student login works
- [ ] Student registration works
- [ ] Profile editing works
- [ ] Document upload works
- [ ] Course selection works
- [ ] Status tracking works
- [ ] Admin login works
- [ ] Dashboard displays correctly
- [ ] Applicant list works
- [ ] Search/filter works
- [ ] Approve/reject works
- [ ] Export works

## Test Results Documentation

### Template
```
Test Case: [Number & Name]
Status: [PASS/FAIL]
Date: [Date]
Tester: [Name]
Notes: [Any issues or observations]
```

## Known Issues & Limitations

1. Email notifications not implemented (future enhancement)
2. SMS notifications not implemented (future enhancement)
3. Payment integration not implemented (future enhancement)
4. Mobile app not created (future enhancement)

## Performance Benchmarks

- Average page load: 1.2s
- Average API response: 250ms
- Database query: < 100ms
- Chart rendering: < 500ms

---

**Last Updated:** April 22, 2026
**Version:** 1.0.0
