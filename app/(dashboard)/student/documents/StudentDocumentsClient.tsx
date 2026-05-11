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

export default function StudentDocumentsClient() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [student, setStudent] = useState<any>(null)
  const [documents, setDocuments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase, setSupabase] = useState<any>(null)

  // Dynamic import - safest way
  useEffect(() => {
    import('@/lib/supabase/client').then((mod) => {
      setSupabase(mod.supabase)
    })
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
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [supabase])

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

    if (studentData?.id) fetchDocuments(studentData.id)
  }, [searchParams, fetchDocuments, router])

  // handleFileUpload, getDocumentStatus, handleLogout functions...
  // (Paste the rest of your logic from previous versions)

  // For now, return a basic UI so we can test build
  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="student" onLogout={() => {
        localStorage.removeItem('ssim_student_session')
        router.push('/student-login')
      }} />
      
      <main className="flex-1 p-6">
        <h1 className="text-3xl font-bold text-white">Upload Documents</h1>
        <p className="text-green-400 mt-4">Page loaded successfully</p>
      </main>
    </div>
  )
}