'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../../components/ui/Sidebar'

export default function VerificationsPage() {
  const router = useRouter()
  const [documents, setDocuments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPendingDocuments()
  }, [])

  const fetchPendingDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .select(`
          *,
          students (
            matric_number,
            surname,
            first_name,
            department
          )
        `)
        .eq('status', 'pending')
        .order('uploaded_at', { ascending: false })

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

    fetchPendingDocuments()
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const getDocumentName = (type: string) => {
    const names: Record<string, string> = {
      'acceptance_fee': 'Acceptance Fee',
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="super_admin" onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Document Verifications</h1>

          {documents.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-12 text-center">
              <p className="text-gray-400 text-lg">No pending verifications</p>
              <p className="text-gray-500 text-sm mt-2">All documents have been reviewed</p>
            </div>
          ) : (
            <div className="space-y-4">
              {documents.map((doc) => (
                <div key={doc.id} className="bg-gray-800/50 rounded-xl p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {doc.students?.surname} {doc.students?.first_name}
                      </h3>
                      <p className="text-sm text-gray-400">{doc.students?.matric_number}</p>
                      <p className="text-sm text-gray-400">{doc.students?.department}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">
                        Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="mb-4">
                    <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                      {getDocumentName(doc.document_type)}
                    </span>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => window.open(doc.file_url, '_blank')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      View Document
                    </button>
                    <button
                      onClick={() => handleVerify(doc.id, 'verified')}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerify(doc.id, 'rejected')}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}