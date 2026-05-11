

'use client'



import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../components/ui/Sidebar'

interface StudentData {
  id: string
  matric_number: string
  surname: string
  first_name: string
  other_names: string
  department: string
  level: number
  email: string
  phone: string
  profile_picture_url: string
}

interface Document {
  id: string
  document_type: string
  file_url: string
  status: string
  uploaded_at: string
}

interface FeeReceipt {
  id: string
  level: number
  payment_type: string
  receipt_url: string
  status: string
  uploaded_at: string
}

const requiredDocuments = [
  { id: 'acceptance_fee', name: 'Acceptance Fee Receipt', required: true },
  { id: 'admission_letter', name: 'Admission Letter', required: true },
  { id: 'birth_cert', name: 'Birth Certificate', required: true },
  { id: 'medical', name: 'Medical Certificate', required: true },
  { id: 'nin', name: 'NIN Slip', required: true },
  { id: 'lassra', name: 'LASSRA ID (Lagosians only)', required: false },
  { id: 'o_level', name: 'O-Level Result', required: true },
  { id: 'jamb', name: 'JAMB Result', required: true },
]

export default function StudentDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<StudentData | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [feeReceipts, setFeeReceipts] = useState<FeeReceipt[]>([])
  const [stats, setStats] = useState({ uploaded: 0, verified: 0, pending: 0 })

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = () => {
    const session = localStorage.getItem('ssim_student_session')
    if (!session) {
      router.push('/student-login')
      return
    }

    const studentData = JSON.parse(session)
    setStudent(studentData)
    fetchData(studentData.id)
  }

  const fetchData = async (studentId: string) => {
    try {
      // Fetch documents
      const { data: docs } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
      
      setDocuments(docs || [])

      // Fetch fee receipts
      const { data: fees } = await supabase
        .from('fee_receipts')
        .select('*')
        .eq('student_id', studentId)
      
      setFeeReceipts(fees || [])

      // Calculate stats
      const required = requiredDocuments.filter(d => d.required).length
      const uploaded = docs?.length || 0
      const verified = docs?.filter(d => d.status === 'verified').length || 0
      const pending = docs?.filter(d => d.status === 'pending').length || 0
      
      setStats({ uploaded, verified, pending })
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('ssim_student_session')
    router.push('/student-login')
  }

  const getDocumentStatus = (docType: string) => {
    const doc = documents.find(d => d.document_type === docType)
    if (!doc) return null
    return { status: doc.status, id: doc.id }
  }

  const completionPercentage = (stats.uploaded / requiredDocuments.filter(d => d.required).length) * 100

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!student) return null

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="student" onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white">
              Welcome, {student.first_name || student.surname}
            </h1>
            <p className="text-gray-400 mt-1">
              {student.matric_number} • {student.department} • Level {student.level}
            </p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6">
              <div className="text-2xl mb-2">📊</div>
              <div className="text-2xl font-bold text-white">{completionPercentage.toFixed(0)}%</div>
              <div className="text-gray-400 text-sm">Profile Complete</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-600/20 to-green-800/20 border border-green-500/30 rounded-xl p-6">
              <div className="text-2xl mb-2">✅</div>
              <div className="text-2xl font-bold text-white">{stats.verified}/{requiredDocuments.filter(d => d.required).length}</div>
              <div className="text-gray-400 text-sm">Verified Documents</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-600/20 to-yellow-800/20 border border-yellow-500/30 rounded-xl p-6">
              <div className="text-2xl mb-2">⏳</div>
              <div className="text-2xl font-bold text-white">{stats.pending}</div>
              <div className="text-gray-400 text-sm">Pending Verification</div>
            </div>

            <div className="bg-gradient-to-br from-purple-600/20 to-purple-800/20 border border-purple-500/30 rounded-xl p-6">
              <div className="text-2xl mb-2">💳</div>
              <div className="text-2xl font-bold text-white">{feeReceipts.length}</div>
              <div className="text-gray-400 text-sm">Fee Receipts</div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-semibold text-white mb-3">Document Submission Progress</h3>
            <div className="w-full bg-gray-700 rounded-full h-3">
              <div 
                className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${completionPercentage}%` }}
              />
            </div>
            <p className="text-sm text-gray-400 mt-2">
              {stats.uploaded} of {requiredDocuments.filter(d => d.required).length} required documents uploaded
            </p>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <button
              onClick={() => router.push('/student/documents')}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
            >
              📄 Upload Documents
            </button>
            <button
              onClick={() => router.push('/student/fee-receipts')}
              className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
            >
              💳 Manage Fee Receipts
            </button>
          </div>

          {/* Documents List */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Required Documents</h2>
            <div className="space-y-4">
              {requiredDocuments.map((doc) => {
                const docStatus = getDocumentStatus(doc.id)
                return (
                  <div key={doc.id} className="border-b border-gray-700 last:border-0 pb-4 last:pb-0">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="font-semibold text-white">{doc.name}</h3>
                        {doc.required && (
                          <span className="text-xs text-red-400">Required</span>
                        )}
                      </div>
                      {docStatus ? (
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          docStatus.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                          docStatus.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                          'bg-red-500/20 text-red-400'
                        }`}>
                          {docStatus.status === 'verified' ? '✓ Verified' :
                           docStatus.status === 'pending' ? '⏳ Pending' :
                           '✗ Rejected'}
                        </span>
                      ) : (
                        <button 
                          onClick={() => router.push(`/student/documents?type=${doc.id}`)}
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          + Upload
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}