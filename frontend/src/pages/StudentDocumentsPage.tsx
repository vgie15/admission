import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { studentService } from '../services/api';
import { AlertCircle, CheckCircle, Eye, FileText, Upload, XCircle } from 'lucide-react';
import PortalHeader from '../components/PortalHeader';

const documentTypes = [
  { key: 'birth_certificate', label: 'Birth Certificate / PSA' },
  { key: 'form_137', label: 'Form 137 / Report Card' },
  { key: 'good_moral', label: 'Certificate of Good Moral' },
  { key: 'id_photo', label: '2x2 ID Photo' },
];

const StudentDocumentsPage = () => {
  const navigate = useNavigate();
  const [documents, setDocuments] = useState<any[]>([]);
  const [feedback, setFeedback] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingType, setUploadingType] = useState('');
  const [error, setError] = useState<string>('');
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File | null>>({});
  const [previewDocument, setPreviewDocument] = useState<any>(null);
  const [newFilePreview, setNewFilePreview] = useState<{ documentType: string; url: string; filename: string; isImage: boolean } | null>(null);

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      const [documentsRes, feedbackRes] = await Promise.all([
        studentService.getDocuments(),
        studentService.getFeedback(),
      ]);
      setDocuments(documentsRes.data || []);
      setFeedback(feedbackRes.data || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
      setError('Failed to load documents.');
    } finally {
      setLoading(false);
    }
  };

  const documentsByType = useMemo(() => {
    return documentTypes.reduce<Record<string, any>>((map, type) => {
      map[type.key] = documents
        .filter((doc) => doc.document_type === type.key)
        .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0];
      return map;
    }, {});
  }, [documents]);

  const handleFileSelect = (documentType: string, file: File | null) => {
    setSelectedFiles((prev) => ({ ...prev, [documentType]: file }));
    setError('');
    if (file) {
      const url = URL.createObjectURL(file);
      setNewFilePreview({
        documentType,
        url,
        filename: file.name,
        isImage: /\.(png|jpe?g)$/i.test(file.name),
      });
    }
  };

  const handleUpload = async (documentType: string) => {
    const file = selectedFiles[documentType];
    if (!file) {
      setError('Please select a file first.');
      return;
    }

    setUploadingType(documentType);
    setError('');

    try {
      await studentService.uploadDocument(file, documentType);
      setSelectedFiles((prev) => ({ ...prev, [documentType]: null }));
      setNewFilePreview(null);
      await loadDocuments();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Upload failed');
    } finally {
      setUploadingType('');
    }
  };

  const getDocumentUrl = (documentId: string) => {
    const token = localStorage.getItem('token');
    const url = studentService.getDocumentViewUrl(documentId);
    return token ? `${url}?token=${encodeURIComponent(token)}` : url;
  };

  const openDocument = (document: any) => {
    setPreviewDocument({ ...document, url: getDocumentUrl(document.id) });
  };

  const isImageDocument = (filename = '') => /\.(png|jpe?g)$/i.test(filename);
  const isPdfDocument = (filename = '') => /\.pdf$/i.test(filename);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalHeader
        title="Documents"
        subtitle="View, replace, and review your admission requirements"
        backLabel="Back to Dashboard"
        onBack={() => navigate('/student/dashboard')}
      />

      <main className="mx-auto w-full max-w-7xl px-4 py-5 sm:px-6 sm:py-8">
        {error && (
          <div className="mb-6 flex gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {feedback.length > 0 && (
          <div className="mb-6 rounded-lg border border-blue-200 bg-blue-50 p-4 text-blue-900">
            <p className="font-semibold">Feedback from Admissions</p>
            <div className="mt-2 space-y-2">
              {feedback.slice(0, 3).map((item) => (
                <p key={item.id} className="text-sm">{item.message}</p>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-4">
          {documentTypes.map((type) => {
            const document = documentsByType[type.key];
            const selectedFile = selectedFiles[type.key];

            return (
              <div key={type.key} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`rounded-xl p-3 ${document ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-500'}`}>
                      <FileText className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{type.label}</h3>
                      {document ? (
                        <>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full border border-green-200 bg-green-50 px-2 py-1 text-xs font-semibold text-green-700">
                              <CheckCircle className="h-3 w-3" />
                              Uploaded
                            </span>
                            <span className="break-all text-sm text-gray-600">{document.filename}</span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500">
                            Uploaded on {new Date(document.uploaded_at).toLocaleDateString()}
                          </p>
                        </>
                      ) : (
                        <p className="mt-1 text-sm text-gray-500">No file uploaded yet.</p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 ml-auto">
                    {document && (
                      <button
                        type="button"
                        onClick={() => openDocument(document)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-4 py-2 font-semibold text-blue-700 hover:bg-blue-100"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                    )}
                    <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 font-semibold text-gray-700 hover:bg-gray-50">
                      <Upload className="h-4 w-4" />
                      {document ? 'Choose File' : 'Upload Document'}
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="sr-only"
                        onChange={(event) => handleFileSelect(type.key, event.target.files?.[0] || null)}
                      />
                    </label>
                    {selectedFile && (
                      <span className="text-xs text-gray-500 break-all max-w-[180px] truncate">{selectedFile.name}</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Accepted formats: PDF, JPG, JPEG, PNG. Maximum size: 5MB per file.
        </div>
      </main>

      {newFilePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Preview New File</h3>
                <p className="text-sm text-gray-500 break-all">{newFilePreview.filename}</p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setNewFilePreview(null);
                  setSelectedFiles((prev) => ({ ...prev, [newFilePreview.documentType]: null }));
                }}
                className="rounded-full p-1 text-gray-500 hover:bg-gray-100 hover:text-gray-800"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-gray-100 p-4">
              {newFilePreview.isImage ? (
                <img
                  src={newFilePreview.url}
                  alt={newFilePreview.filename}
                  className="mx-auto max-h-[55vh] max-w-full rounded-lg bg-white object-contain shadow"
                />
              ) : (
                <iframe
                  src={newFilePreview.url}
                  title={newFilePreview.filename}
                  className="h-[55vh] w-full rounded-lg bg-white"
                />
              )}
            </div>
            <div className="border-t border-gray-200 px-5 py-4">
              <button
                type="button"
                onClick={() => handleUpload(newFilePreview.documentType)}
                disabled={uploadingType === newFilePreview.documentType}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white hover:bg-blue-700 disabled:bg-gray-400"
              >
                <Upload className="h-4 w-4" />
                {uploadingType === newFilePreview.documentType ? 'Uploading...' : 'Replace Document'}
              </button>
            </div>
          </div>
        </div>
      )}

      {previewDocument && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/70 px-4 py-6">
          <div className="flex max-h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{previewDocument.filename}</h3>
                <p className="text-sm text-gray-500">Document preview</p>
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
                <iframe src={previewDocument.url} title={previewDocument.filename} className="h-[70vh] w-full rounded-lg bg-white" />
              )}
              {!isImageDocument(previewDocument.filename) && !isPdfDocument(previewDocument.filename) && (
                <div className="flex min-h-[320px] flex-col items-center justify-center rounded-lg bg-white p-8 text-center">
                  <p className="font-semibold text-gray-900">Preview is not available for this file type.</p>
                  <a href={previewDocument.url} target="_blank" rel="noreferrer" className="mt-4 rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white hover:bg-blue-700">
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

export default StudentDocumentsPage;
