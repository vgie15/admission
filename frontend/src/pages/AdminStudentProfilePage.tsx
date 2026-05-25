import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../services/api';
import { Check, X, AlertCircle, Eye, XCircle, MessageSquare } from 'lucide-react';
import PortalHeader from '../components/PortalHeader';

const AdminStudentProfilePage = () => {
  const { studentId } = useParams<{ studentId: string }>();
  const navigate = useNavigate();
  const [student, setStudent] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [courseChoices, setCourseChoices] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionReason, setActionReason] = useState('');
  const [feedbackMessage, setFeedbackMessage] = useState('');
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [approvedChoiceId, setApprovedChoiceId] = useState('');
  const [error, setError] = useState<string>('');
  const [previewDocument, setPreviewDocument] = useState<any>(null);

  useEffect(() => {
    if (studentId) {
      loadStudentProfile();
    }
  }, [studentId]);

  const loadStudentProfile = async () => {
    try {
      const response = await adminService.getStudentProfile(studentId!);
      setStudent(response.data.student);
      setDocuments(response.data.documents);
      setCourseChoices(response.data.course_choices || []);
      setFeedback(response.data.feedback || []);
    } catch (err) {
      console.error('Failed to load student:', err);
      setError('Failed to load student profile');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!studentId) return;
    if (!approvedChoiceId) {
      setError('Select which course choice to approve.');
      return;
    }
    setActionLoading(true);
    try {
      await adminService.approveStudent(studentId, actionReason, approvedChoiceId);
      await loadStudentProfile();
      setActionReason('');
      setApprovedChoiceId('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to approve student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!studentId) return;
    setActionLoading(true);
    try {
      await adminService.rejectStudent(studentId, actionReason);
      await loadStudentProfile();
      setActionReason('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reject student');
    } finally {
      setActionLoading(false);
    }
  };

  const handleTemplateClick = (template: { key: string; message: string }, allTemplates: { key: string; message: string }[]) => {
    const isSelected = selectedTemplates.includes(template.key);
    const updated = isSelected
      ? selectedTemplates.filter((k) => k !== template.key)
      : [...selectedTemplates, template.key];
    setSelectedTemplates(updated);
    // Build combined message from all selected templates in order
    const combined = allTemplates
      .filter((t) => updated.includes(t.key))
      .map((t) => t.message)
      .join('\n');
    setFeedbackMessage(combined);
  };

  const handleSendFeedback = async () => {
    if (!studentId) return;
    if (!feedbackMessage.trim()) {
      setError('Feedback message is required.');
      return;
    }

    setActionLoading(true);
    try {
      await adminService.sendFeedback(studentId, feedbackMessage.trim(), selectedTemplates.join(',') || undefined);
      await loadStudentProfile();
      setFeedbackMessage('');
      setSelectedTemplates([]);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send feedback');
    } finally {
      setActionLoading(false);
    }
  };

  const getDocumentUrl = (documentId: string) => {
    const token = localStorage.getItem('token');
    const url = adminService.getDocumentViewUrl(documentId);
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  };

  const openDocument = (document: any) => {
    setPreviewDocument({
      ...document,
      url: getDocumentUrl(document.id),
    });
  };

  const isImageDocument = (filename = '') => /\.(png|jpe?g)$/i.test(filename);
  const isPdfDocument = (filename = '') => /\.pdf$/i.test(filename);

  const formatDocumentType = (type = '') => {
    return type.replace(/_/g, ' ');
  };

  const documentFeedbackMessages: Record<string, string> = {
    birth_certificate: 'Please upload a new Birth Certificate / PSA.',
    form_137: 'Please upload a new Form 137 / Report Card.',
    good_moral: 'Please upload a new Certificate of Good Moral.',
    id_photo: 'Please upload a clearer 2x2 ID photo.',
  };

  const sortedChoices = [...courseChoices].sort((a, b) => (a.choice_rank || 1) - (b.choice_rank || 1));
  const approvedChoice = sortedChoices.find((course_choice) => course_choice.status === 'enrolled');
  const feedbackTemplates = [
    ...documents
      .filter((document) => documentFeedbackMessages[document.document_type])
      .map((document) => ({
        key: `document_${document.document_type}`,
        message: documentFeedbackMessages[document.document_type],
      })),
    { key: 'review_profile', message: 'Please review and update your profile information.' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student profile...</p>
        </div>
      </div>
    );
  }

  if (!student) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Student not found.</p>
          <button
            onClick={() => navigate('/admin/applicants')}
            className="mt-4 text-blue-600 hover:text-blue-700 font-semibold"
          >
            Go back to applicants
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'rejected':
        return 'bg-red-50 border-red-200 text-red-800';
      default:
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        title="Student Profile"
        subtitle="Review applicant details, requirements, and course choices"
        backLabel="Back to Applicants"
        onBack={() => navigate('/admin/applicants')}
      />

      {/* Main Content */}
      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Student Information */}
        <div className="w-full bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-semibold text-gray-900">
                    {student.first_name} {student.middle_name ? `${student.middle_name} ` : ''}{student.last_name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Email</p>
                  <p className="font-semibold text-gray-900">{student.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Phone</p>
                  <p className="font-semibold text-gray-900">{student.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-semibold text-gray-900">{student.date_of_birth || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-semibold text-gray-900">{student.gender || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Address</p>
                  <p className="font-semibold text-gray-900">{student.address || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">City / Municipality</p>
                  <p className="font-semibold text-gray-900">{student.city || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Province</p>
                  <p className="font-semibold text-gray-900">{student.province || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Zip Code</p>
                  <p className="font-semibold text-gray-900">{student.zip_code || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Academic Information</h3>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-gray-600">Strand</p>
                  <p className="font-semibold text-gray-900">{student.strand || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">GPA</p>
                  <p className="font-semibold text-gray-900">{student.gpa || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Previous School</p>
                  <p className="font-semibold text-gray-900">{student.previous_school || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Application Type</p>
                  <p className="font-semibold text-gray-900">{student.application_type || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">School Year / Semester</p>
                  <p className="font-semibold text-gray-900">
                    {student.school_year || 'N/A'} {student.semester ? `- ${student.semester}` : ''}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Application Status</p>
                  <span className={`inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(student.status)}`}>
                    {student.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Course Choices */}
        <div className="w-full bg-white rounded-lg shadow p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Course Choices</h3>
          {sortedChoices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sortedChoices.map((course_choice) => (
                <div
                  key={course_choice.id}
                  className={`rounded-lg border p-4 ${
                    course_choice.status === 'enrolled'
                      ? 'border-green-200 bg-green-50'
                      : course_choice.status === 'not_selected'
                        ? 'border-gray-200 bg-gray-50 opacity-75'
                        : 'border-transparent bg-gray-50'
                  }`}
                >
                  <p className="text-sm text-gray-600">
                    {course_choice.choice_rank === 2 ? 'Second Choice' : 'First Choice'}
                  </p>
                  <p className="font-semibold text-gray-900">
                    {course_choice.courses?.name || 'N/A'}
                  </p>
                  {course_choice.courses?.code && (
                    <p className="text-sm text-gray-500">{course_choice.courses.code}</p>
                  )}
                  <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    {course_choice.status === 'enrolled'
                      ? 'Approved Choice'
                      : course_choice.status === 'not_selected'
                        ? 'Not Selected'
                        : 'Pending Selection'}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No course choices recorded.</p>
          )}
        </div>

        {/* Manual Review */}
        <div className="w-full bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Manual Requirements Review</h3>
              <p className="text-sm text-gray-600 mt-1">
                Manually check the uploaded requirements below, then accept, decline, or send feedback.
              </p>
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(student.status)}`}>
              {student.status === 'approved' ? 'Accepted' : student.status === 'rejected' ? 'Declined' : 'Pending'}
            </span>
          </div>

          {documents.length > 0 ? (
            <div className="space-y-2">
              {documents.map((doc) => (
                <div key={doc.id} className="flex flex-col gap-3 p-3 bg-gray-50 rounded-lg sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-gray-900 capitalize">
                      {doc.document_type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-gray-600">{doc.filename}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => openDocument(doc)}
                      className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View
                    </button>
                    <span className="text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-1">
                      Uploaded
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800">
              No requirements have been uploaded yet.
            </div>
          )}
        </div>

        {/* Action Section */}
        {student.status === 'pending' && (
          <div className="w-full bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Application Decision</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Approve Course Choice</label>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {sortedChoices.map((course_choice) => (
                    <label
                      key={course_choice.id}
                      className={`flex cursor-pointer items-start gap-3 rounded-lg border p-4 ${
                        approvedChoiceId === course_choice.id
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="approved_choice_id"
                        value={course_choice.id}
                        checked={approvedChoiceId === course_choice.id}
                        onChange={(e) => setApprovedChoiceId(e.target.value)}
                        className="mt-1"
                      />
                      <span>
                        <span className="block text-sm text-gray-600">
                          {course_choice.choice_rank === 2 ? 'Second Choice' : 'First Choice'}
                        </span>
                        <span className="block font-semibold text-gray-900">
                          {course_choice.courses?.name || 'N/A'}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes/Reason</label>
                <textarea
                  value={actionReason}
                  onChange={(e) => setActionReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows={3}
                  placeholder="Add notes, missing requirements, or reason for decision..."
                />
              </div>

              <div className="flex gap-4">
                <button
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 transition font-semibold"
                >
                  <Check className="w-4 h-4" />
                  {actionLoading ? 'Processing...' : 'Accept'}
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading}
                  className="flex items-center justify-center gap-2 flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 transition font-semibold"
                >
                  <X className="w-4 h-4" />
                  {actionLoading ? 'Processing...' : 'Decline'}
                </button>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h4 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                  <MessageSquare className="h-4 w-4 text-blue-600" />
                  Send Feedback
                </h4>
                <p className="mb-2 text-xs text-gray-500">Select one or more feedback items (can choose multiple):</p>
                <div className="mb-3 flex flex-wrap gap-2">
                  {feedbackTemplates.map((template) => {
                    const isSelected = selectedTemplates.includes(template.key);
                    return (
                      <button
                        key={template.key}
                        type="button"
                        onClick={() => handleTemplateClick(template, feedbackTemplates)}
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold flex items-center gap-1.5 ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded border ${isSelected ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}`}>
                          {isSelected && (
                            <svg viewBox="0 0 10 10" className="h-2.5 w-2.5 text-white" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="1.5,5 4,7.5 8.5,2.5" />
                            </svg>
                          )}
                        </span>
                        {template.message}
                      </button>
                    );
                  })}
                </div>
                <textarea
                  value={feedbackMessage}
                  onChange={(e) => setFeedbackMessage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Write feedback for the student without accepting or declining..."
                />
                <button
                  type="button"
                  onClick={handleSendFeedback}
                  disabled={actionLoading || !feedbackMessage.trim()}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 disabled:bg-gray-400"
                >
                  <MessageSquare className="h-4 w-4" />
                  {actionLoading ? 'Sending...' : 'Send Feedback'}
                </button>
              </div>
            </div>
          </div>
        )}

        {feedback.length > 0 && (
          <div className="mt-6 rounded-lg bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold text-gray-900">Feedback Sent</h3>
            <div className="space-y-3">
              {feedback.map((item) => (
                <div key={item.id} className="rounded-lg border border-blue-100 bg-blue-50 p-3">
                  <p className="text-sm text-blue-900">{item.message}</p>
                  <p className="mt-1 text-xs text-blue-700">
                    {new Date(item.created_at).toLocaleString()} - {item.is_read ? 'Read' : 'Unread'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {student.status !== 'pending' && (
          <div className={`rounded-lg shadow p-6 border ${getStatusColor(student.status)}`}>
            <h3 className="text-lg font-semibold mb-2">
              Application {student.status === 'approved' ? 'Accepted' : 'Declined'}
            </h3>
            {student.status === 'approved' && (
              <p>
                {student.admin_notes || 'The student has been accepted for admission.'}
                {approvedChoice?.courses?.name && (
                  <span className="block mt-2 font-semibold">Approved Choice: {approvedChoice.courses.name}</span>
                )}
              </p>
            )}
            {student.status === 'rejected' && (
              <p>{student.rejection_reason || 'The student application has been declined.'}</p>
            )}
          </div>
        )}
      </main>

      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                  {formatDocumentType(previewDocument.document_type)}
                </h3>
                <p className="text-sm text-gray-500 break-all">{previewDocument.filename}</p>
              </div>
              <button
                type="button"
                onClick={() => setPreviewDocument(null)}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                aria-label="Close document preview"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="min-h-0 flex-1 overflow-auto rounded-b-xl bg-gray-100 p-4">
              {isImageDocument(previewDocument.filename) && (
                <img
                  src={previewDocument.url}
                  alt={previewDocument.filename}
                  className="mx-auto max-h-[70vh] max-w-full rounded-lg bg-white object-contain shadow"
                />
              )}

              {isPdfDocument(previewDocument.filename) && (
                <iframe
                  src={previewDocument.url}
                  title={previewDocument.filename}
                  className="h-[70vh] w-full rounded-lg bg-white"
                />
              )}

              {!isImageDocument(previewDocument.filename) && !isPdfDocument(previewDocument.filename) && (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg bg-white p-8 text-center">
                  <p className="text-lg font-semibold text-gray-900">Preview is not available for this file type.</p>
                  <p className="mt-2 text-sm text-gray-500">You can still open or download the uploaded requirement.</p>
                  <a
                    href={previewDocument.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700"
                  >
                    Open File
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminStudentProfilePage;
