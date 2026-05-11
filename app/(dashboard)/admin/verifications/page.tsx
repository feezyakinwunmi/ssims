'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../../components/ui/Sidebar'

export default function AdminVerificationsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    checkAuth()
    fetchDocuments()
  }, [filter])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    }
  }

  const fetchDocuments = async () => {
    try {
      let query = supabase
        .from('student_documents')
        .select(`
          *,
          students (
            id,
            matric_number,
            surname,
            first_name,
            department,
            level
          )
        `)
        .order('uploaded_at', { ascending: false })

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) throw error
      setDocuments(data || [])
    } catch (error) {
      console.error('Error fetching documents:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleVerify = async (docId: string, status: 'verified' | 'rejected') => {
    const { data: { user } } = await supabase.auth.getUser()
    
    await supabase
      .from('student_documents')
      .update({ 
        status, 
        verified_by: user?.id,
        verified_at: new Date().toISOString()
      })
      .eq('id', docId)

    fetchDocuments()
  }

  const getDocumentName = (type: string) => {
    const names: Record<string, string> = {
      'acceptance_fee': 'Acceptance Fee Receipt',
      'admission_letter': 'Admission Letter',
      'birth_cert': 'Birth Certificate',
      'medical': 'Medical Certificate',
      'nin': 'NIN Slip',
      'lassra': 'LASSRA ID',
      'o_level': 'O-Level Result',
      'jamb': 'JAMB Result'
    }
    return names[type] || type
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

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  const pendingCount = documents.filter(d => d.status === 'pending').length

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="admin" onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Document Verifications</h1>
            <div className="text-sm text-gray-400">
              Pending: {pendingCount}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-700">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 text-sm font-medium transition ${
                filter === 'all' 
                  ? 'text-blue-400 border-b-2 border-blue-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              All Documents
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-2 text-sm font-medium transition ${
                filter === 'pending' 
                  ? 'text-yellow-400 border-b-2 border-yellow-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Pending
            </button>
            <button
              onClick={() => setFilter('verified')}
              className={`px-4 py-2 text-sm font-medium transition ${
                filter === 'verified' 
                  ? 'text-green-400 border-b-2 border-green-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Verified
            </button>
            <button
              onClick={() => setFilter('rejected')}
              className={`px-4 py-2 text-sm font-medium transition ${
                filter === 'rejected' 
                  ? 'text-red-400 border-b-2 border-red-400' 
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Rejected
            </button>
          </div>

          {documents.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-lg">No documents found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-gray-800/50 rounded-xl p-6 hover:bg-gray-800/70 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {doc.students?.surname} {doc.students?.first_name}
                      </h3>
                      <p className="text-sm text-gray-400">{doc.students?.matric_number}</p>
                      <p className="text-sm text-gray-400">{doc.students?.department} • Level {doc.students?.level}</p>
                    </div>
                    <div className="text-right">
                      {getStatusBadge(doc.status)}
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="text-gray-300">Document: </span>
                    <span className="text-white font-medium">{getDocumentName(doc.document_type)}</span>
                  </div>

                  {doc.status === 'pending' && (
                    <div className="flex gap-3">
                      <button
                        onClick={() => window.open(doc.file_url, '_blank')}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        📄 View Document
                      </button>
                      <button
                        onClick={() => handleVerify(doc.id, 'verified')}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => handleVerify(doc.id, 'rejected')}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition"
                      >
                        ✗ Reject
                      </button>
                    </div>
                  )}

                  {doc.status !== 'pending' && doc.verified_at && (
                    <div className="text-sm text-gray-500 mt-2">
                      Reviewed on {new Date(doc.verified_at).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}