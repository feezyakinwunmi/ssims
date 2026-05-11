'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../../components/ui/Sidebar'

interface StudentWithProgress {
  id: string
  matric_number: string
  surname: string
  first_name: string
  department: string
  level: number
  email: string
  phone: string
  uploadedDocs: number
  verifiedDocs: number
  missingDocs: string[]
}

export default function IncompleteProfilesPage() {
  const router = useRouter()
  const [students, setStudents] = useState<StudentWithProgress[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    checkAuth()
    fetchIncompleteProfiles()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    }
  }

  const requiredDocuments = [
    'acceptance_fee',
    'admission_letter', 
    'birth_cert',
    'medical',
    'nin',
    'o_level',
    'jamb'
  ]

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

  const fetchIncompleteProfiles = async () => {
    try {
      // Get all students
      const { data: allStudents, error } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const studentsWithProgress: StudentWithProgress[] = []

      for (const student of allStudents || []) {
        // Get student's documents
        const { data: docs } = await supabase
          .from('student_documents')
          .select('document_type, status')
          .eq('student_id', student.id)

        const uploadedDocs = docs?.length || 0
        const verifiedDocs = docs?.filter(d => d.status === 'verified').length || 0
        const uploadedTypes = docs?.map(d => d.document_type) || []
        
        // Find missing documents
        const missingDocs = requiredDocuments.filter(doc => !uploadedTypes.includes(doc))

        // Only include students with incomplete profiles (less than 7 verified docs)
        if (verifiedDocs < 7) {
          studentsWithProgress.push({
            ...student,
            uploadedDocs,
            verifiedDocs,
            missingDocs
          })
        }
      }

      setStudents(studentsWithProgress)
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleNotifyStudent = async (student: StudentWithProgress) => {
    // In a real app, this would send an email/SMS
    alert(`Notification would be sent to ${student.email || student.matric_number} about missing documents:\n${student.missingDocs.map(d => getDocumentName(d)).join(', ')}`)
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const filteredStudents = students.filter(student =>
    student.matric_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.first_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="admin" onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-white">Incomplete Profiles</h1>
              <p className="text-gray-400 mt-1">Students missing required documents</p>
            </div>
            <div className="text-sm text-gray-400">
              Total: {students.length} students
            </div>
          </div>

          {/* Search */}
          <div className="mb-6">
            <input
              type="text"
              placeholder="Search by matric number or name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          {students.length === 0 ? (
            <div className="bg-gray-800/50 rounded-xl p-12 text-center">
              <div className="text-5xl mb-4">🎉</div>
              <p className="text-gray-400 text-lg">All profiles are complete!</p>
              <p className="text-gray-500 text-sm mt-2">Every student has submitted all required documents</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredStudents.map((student) => (
                <div key={student.id} className="bg-gray-800/50 rounded-xl p-6 hover:bg-gray-800/70 transition">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {student.surname} {student.first_name}
                      </h3>
                      <p className="text-sm text-gray-400">{student.matric_number}</p>
                      <p className="text-sm text-gray-400">{student.department} • Level {student.level}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-400">
                        Progress: {student.verifiedDocs}/7 verified
                      </div>
                      <div className="w-32 h-2 bg-gray-700 rounded-full mt-1 overflow-hidden">
                        <div 
                          className="h-full bg-yellow-500 rounded-full"
                          style={{ width: `${(student.verifiedDocs / 7) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-gray-400 mb-2">Missing Documents:</p>
                    <div className="flex flex-wrap gap-2">
                      {student.missingDocs.map((doc) => (
                        <span key={doc} className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">
                          {getDocumentName(doc)}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => router.push(`/admin/students/${student.id}`)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      View Profile
                    </button>
                    <button
                      onClick={() => handleNotifyStudent(student)}
                      className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      Send Reminder
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