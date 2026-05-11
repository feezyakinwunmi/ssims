'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../../../components/ui/Sidebar'

interface Student {
  id: string
  matric_number: string
  surname: string
  first_name: string
  other_names: string
  department: string
  level: number
  email: string
  phone: string
  created_at: string
}

interface Document {
  id: string
  document_type: string
  file_url: string
  status: string
  uploaded_at: string
  verified_at: string
}

interface FeeReceipt {
  id: string
  level: number
  payment_type: string
  receipt_url: string
  status: string
  uploaded_at: string
  verified_at: string
}

const documentNames: Record<string, string> = {
  'acceptance_fee': 'Acceptance Fee Receipt',
  'admission_letter': 'Admission Letter',
  'birth_cert': 'Birth Certificate',
  'medical': 'Medical Certificate',
  'nin': 'NIN Slip',
  'lassra': 'LASSRA ID',
  'o_level': 'O-Level Result',
  'jamb': 'JAMB Result'
}

export default function StudentDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const studentId = params?.id as string
  
  const [loading, setLoading] = useState(true)
  const [student, setStudent] = useState<Student | null>(null)
  const [documents, setDocuments] = useState<Document[]>([])
  const [feeReceipts, setFeeReceipts] = useState<FeeReceipt[]>([])
  const [activeTab, setActiveTab] = useState('profile')
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    first_name: '',
    other_names: '',
    level: 100
  })

  useEffect(() => {
    checkAuth()
    fetchStudentData()
    fetchDocuments()
    fetchFeeReceipts()
  }, [studentId])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    }
  }

  const fetchStudentData = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('id', studentId)
        .single()

      if (error) throw error
      setStudent(data)
      setFormData({
        email: data.email || '',
        phone: data.phone || '',
        first_name: data.first_name || '',
        other_names: data.other_names || '',
        level: data.level || 100
      })
    } catch (error) {
      console.error('Error fetching student:', error)
    }
  }

  const fetchDocuments = async () => {
    try {
      const { data } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
        .order('uploaded_at', { ascending: false })
      
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    }
  }

  const fetchFeeReceipts = async () => {
    try {
      const { data } = await supabase
        .from('fee_receipts')
        .select('*')
        .eq('student_id', studentId)
        .order('uploaded_at', { ascending: false })
      
      setFeeReceipts(data || [])
    } catch (error) {
      console.error('Error fetching fee receipts:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStudent = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase
      .from('students')
      .update({
        email: formData.email,
        phone: formData.phone,
        first_name: formData.first_name,
        other_names: formData.other_names,
        level: formData.level
      })
      .eq('id', studentId)

    if (error) {
      alert('Error updating student: ' + error.message)
    } else {
      alert('Student updated successfully!')
      setEditing(false)
      fetchStudentData()
    }
    setLoading(false)
  }

  const handleVerifyDocument = async (docId: string, status: 'verified' | 'rejected') => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('student_documents')
      .update({ 
        status, 
        verified_by: user?.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', docId)

    if (error) {
      alert('Error updating document: ' + error.message)
    } else {
      fetchDocuments()
    }
  }

  const handleVerifyReceipt = async (receiptId: string, status: 'verified' | 'rejected') => {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase
      .from('fee_receipts')
      .update({ 
        status, 
        verified_by: user?.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', receiptId)

    if (error) {
      alert('Error updating receipt: ' + error.message)
    } else {
      fetchFeeReceipts()
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'verified':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Verified</span>
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>
      case 'rejected':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Rejected</span>
      default:
        return null
    }
  }

  const getDocumentName = (type: string) => {
    return documentNames[type] || type
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  if (!student) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <p className="text-red-400">Student not found</p>
          <button
            onClick={() => router.push('/admin/students')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
          >
            Back to Students
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="admin" onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">{student.surname} {student.first_name}</h1>
              <p className="text-gray-400 mt-1">{student.matric_number}</p>
            </div>
            <button
              onClick={() => router.push('/admin/students')}
              className="text-gray-400 hover:text-white transition"
            >
              ← Back to Students
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-700">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === 'profile' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('documents')}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === 'documents' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Documents ({documents.length})
            </button>
            <button
              onClick={() => setActiveTab('fee-receipts')}
              className={`px-4 py-2 text-sm font-medium transition ${
                activeTab === 'fee-receipts' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Fee Receipts ({feeReceipts.length})
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-gray-800/50 rounded-xl p-6">
              {editing ? (
                <form onSubmit={handleUpdateStudent} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Matric Number</label>
                      <input
                        type="text"
                        value={student.matric_number}
                        disabled
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Surname</label>
                      <input
                        type="text"
                        value={student.surname}
                        disabled
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">First Name</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Other Names</label>
                      <input
                        type="text"
                        value={formData.other_names}
                        onChange={(e) => setFormData({ ...formData, other_names: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Department</label>
                      <input
                        type="text"
                        value={student.department}
                        disabled
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-gray-400"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Level</label>
                      <select
                        value={formData.level}
                        onChange={(e) => setFormData({ ...formData, level: parseInt(e.target.value) })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      >
                        <option value={100}>100 Level</option>
                        <option value={200}>200 Level</option>
                        <option value={300}>300 Level</option>
                        <option value={400}>400 Level</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg">
                      Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditing(false)}
                      className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 bg-gray-700/30 rounded-lg">
                      <p className="text-sm text-gray-400">Matric Number</p>
                      <p className="text-white font-medium">{student.matric_number}</p>
                    </div>
                    <div className="p-3 bg-gray-700/30 rounded-lg">
                      <p className="text-sm text-gray-400">Full Name</p>
                      <p className="text-white font-medium">{student.surname} {student.first_name} {student.other_names}</p>
                    </div>
                    <div className="p-3 bg-gray-700/30 rounded-lg">
                      <p className="text-sm text-gray-400">Department</p>
                      <p className="text-white font-medium">{student.department}</p>
                    </div>
                    <div className="p-3 bg-gray-700/30 rounded-lg">
                      <p className="text-sm text-gray-400">Level</p>
                      <p className="text-white font-medium">{student.level}</p>
                    </div>
                    <div className="p-3 bg-gray-700/30 rounded-lg">
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="text-white font-medium">{student.email || 'Not provided'}</p>
                    </div>
                    <div className="p-3 bg-gray-700/30 rounded-lg">
                      <p className="text-sm text-gray-400">Phone</p>
                      <p className="text-white font-medium">{student.phone || 'Not provided'}</p>
                    </div>
                    <div className="p-3 bg-gray-700/30 rounded-lg">
                      <p className="text-sm text-gray-400">Registered On</p>
                      <p className="text-white font-medium">{new Date(student.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditing(true)}
                    className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
                  >
                    Edit Profile
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Student Documents</h2>
              {documents.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No documents uploaded yet</p>
              ) : (
                <div className="space-y-4">
                  {documents.map((doc) => (
                    <div key={doc.id} className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{getDocumentName(doc.document_type)}</p>
                        <p className="text-xs text-gray-400 mt-1">
                          Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(doc.status)}
                        <a
                          href={doc.file_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View
                        </a>
                        {doc.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'verified')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyDocument(doc.id, 'rejected')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Fee Receipts Tab */}
          {activeTab === 'fee-receipts' && (
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-4">Fee Receipts</h2>
              {feeReceipts.length === 0 ? (
                <p className="text-gray-400 text-center py-8">No fee receipts uploaded yet</p>
              ) : (
                <div className="space-y-4">
                  {feeReceipts.map((receipt) => (
                    <div key={receipt.id} className="flex justify-between items-center p-4 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="font-medium text-white">
                          {receipt.payment_type} - Level {receipt.level}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Uploaded: {new Date(receipt.uploaded_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(receipt.status)}
                        <a
                          href={receipt.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 text-sm"
                        >
                          View
                        </a>
                        {receipt.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleVerifyReceipt(receipt.id, 'verified')}
                              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleVerifyReceipt(receipt.id, 'rejected')}
                              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
                            >
                              Reject
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}