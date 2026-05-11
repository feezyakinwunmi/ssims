'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Sidebar from '../../../components/ui/Sidebar'
import { motion } from 'framer-motion'

const documentTypes = [
  { id: 'acceptance_fee', name: 'Acceptance Fee Receipt', required: true, description: 'Upload your acceptance fee payment receipt' },
  { id: 'admission_letter', name: 'Admission Letter', required: true, description: 'Upload your official admission letter' },
  { id: 'birth_cert', name: 'Birth Certificate', required: true, description: 'Upload your birth certificate' },
  { id: 'medical', name: 'Medical Certificate', required: true, description: 'Upload your medical certificate/fitness report' },
  { id: 'nin', name: 'NIN Slip', required: true, description: 'Upload your National Identification Number slip' },
  { id: 'lassra', name: 'LASSRA ID', required: false, description: 'Lagos State Residents Registration Agency ID (if applicable)' },
  { id: 'o_level', name: 'O-Level Result', required: true, description: 'Upload your WAEC/NECO result' },
  { id: 'jamb', name: 'JAMB Result', required: true, description: 'Upload your JAMB result slip' },
]

export const dynamic = 'force-dynamic';

export default function StudentDocumentsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [student, setStudent] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  // Dynamic import Supabase (safe)
  useEffect(() => {
    import('@/lib/supabase/client').then((mod) => {
      setSupabase(mod.supabase)
    }).catch(console.error)
  }, [])

  const fetchDocuments = useCallback(async (studentId: string) => {
    if (!supabase) return

    try {
      const { data } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
      
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

  // Load student from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return

    const session = localStorage.getItem('ssim_student_session')
    if (!session) {
      router.push('/student-login')
      return
    }

    const studentData = JSON.parse(session)
    setStudent(studentData)

    const docType = searchParams.get('type')
    if (docType) setSelectedDoc(docType)

    if (studentData?.id) {
      fetchDocuments(studentData.id)
    }
  }, [searchParams, fetchDocuments, router])

  const handleFileUpload = async (documentType: string, file: File) => {
    if (!student || !supabase) {
      alert('System not ready. Please try again.')
      return
    }

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      alert('Only PDF, JPEG, and PNG files are allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${student.id}/${documentType}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('student-documents')
        .getPublicUrl(fileName)

      const existingDoc = documents.find(d => d.document_type === documentType)

      let dbError
      if (existingDoc) {
        const { error } = await supabase
          .from('student_documents')
          .update({
            file_url: publicUrl,
            status: 'pending',
            uploaded_at: new Date().toISOString()
          })
          .eq('id', existingDoc.id)
        dbError = error
      } else {
        const { error } = await supabase
          .from('student_documents')
          .insert({
            student_id: student.id,
            document_type: documentType,
            file_url: publicUrl,
            status: 'pending'
          })
        dbError = error
      }

      if (dbError) throw dbError

      alert('Document uploaded successfully!')
      await fetchDocuments(student.id)
      setSelectedDoc(null)
    } catch (err) {
      console.error(err)
      alert('Failed to upload document. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find(d => d.document_type === docType)
    if (!doc) return null
    return { status: doc.status, url: doc.file_url }
  }

  const handleLogout = () => {
    localStorage.removeItem('ssim_student_session')
    router.push('/student-login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading your documents...</p>
        </div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400">Session expired. Please login again.</p>
          <button
            onClick={() => router.push('/student-login')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Go to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="student" onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Upload Documents</h1>
            <button
              onClick={() => router.push('/student')}
              className="text-gray-400 hover:text-white transition"
            >
              ← Back to Dashboard
            </button>
          </div>

          <div className="space-y-4">
            {documentTypes.map((doc) => {
              const status = getDocumentStatus(doc.id)
              const isUploading = selectedDoc === doc.id && uploading
              const isSelected = selectedDoc === doc.id
              
              return (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/50 rounded-xl p-6"
                >
                  {/* Rest of your JSX remains the same */}
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {doc.name}
                        {doc.required && <span className="ml-2 text-xs text-red-400">Required</span>}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">{doc.description}</p>
                    </div>
                    {status && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        status.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                        status.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {status.status === 'verified' ? '✓ Verified' :
                         status.status === 'pending' ? '⏳ Pending Review' : '✗ Rejected'}
                      </span>
                    )}
                  </div>

                  {status && status.status !== 'rejected' && (
                    <div className="mb-3">
                      <a href={status.url} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 text-sm">
                        View uploaded file →
                      </a>
                    </div>
                  )}

                  {isSelected ? (
                    <div className="mt-4">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => e.target.files && handleFileUpload(doc.id, e.target.files[0])}
                        className="hidden"
                        id={`file-${doc.id}`}
                        disabled={uploading}
                      />
                      <div className="flex gap-3">
                        <label
                          htmlFor={`file-${doc.id}`}
                          className={`flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition text-center cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          {isUploading ? 'Uploading...' : 'Choose File'}
                        </label>
                        <button
                          onClick={() => setSelectedDoc(null)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setSelectedDoc(doc.id)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      {status ? 'Replace Document' : '+ Upload Document'}
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}