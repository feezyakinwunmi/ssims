'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../../components/ui/Sidebar'

interface Student {
  id: string
  matric_number: string
  surname: string
  first_name: string
  department: string
  level: number
  email: string
  phone: string
  created_at: string
}

export default function AdminStudentsPage() {
  const router = useRouter()
  const [students, setStudents] = useState<Student[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState('all')

  useEffect(() => {
    checkAuth()
    fetchStudents()
  }, [])

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      router.push('/login')
    }
  }

  const fetchStudents = async () => {
    try {
      let query = supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })

      if (selectedLevel !== 'all') {
        query = query.eq('level', parseInt(selectedLevel))
      }

      const { data, error } = await query

      if (error) throw error
      setStudents(data || [])
    } catch (error) {
      console.error('Error fetching students:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStudents()
  }, [selectedLevel])

  const filteredStudents = students.filter(student =>
    student.matric_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.first_name.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const getCompletionStatus = async (studentId: string) => {
    const { count } = await supabase
      .from('student_documents')
      .select('*', { count: 'exact', head: true })
      .eq('student_id', studentId)
      .eq('status', 'verified')
    
    return (count || 0) >= 7 ? 'Complete' : 'Incomplete'
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

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="admin" onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">All Students</h1>
            <div className="text-sm text-gray-400">Total: {students.length} students</div>
          </div>

          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <input
              type="text"
              placeholder="Search by matric number, surname, or first name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="all">All Levels</option>
              <option value="100">100 Level</option>
              <option value="200">200 Level</option>
              <option value="300">300 Level</option>
              <option value="400">400 Level</option>
            </select>
          </div>

          {/* Students Table */}
          <div className="bg-gray-800/50 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-800">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Matric No.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Level</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {filteredStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-gray-800/50 transition">
                      <td className="px-6 py-4 text-sm font-mono text-gray-300">{student.matric_number}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{student.surname} {student.first_name}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{student.department}</td>
                      <td className="px-6 py-4 text-sm text-gray-300">{student.level}</td>
                      <td className="px-6 py-4 text-sm">
                        <StudentStatus studentId={student.id} />
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <button
                          onClick={() => router.push(`/admin/students/${student.id}`)}
                          className="text-blue-400 hover:text-blue-300 transition"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredStudents.length === 0 && (
            <div className="text-center py-12 text-gray-400">
              No students found
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

// Component to show student status
function StudentStatus({ studentId }: { studentId: string }) {
  const [status, setStatus] = useState<'loading' | 'Complete' | 'Incomplete'>('loading')

  useEffect(() => {
    const getStatus = async () => {
      const { count } = await supabase
        .from('student_documents')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', studentId)
        .eq('status', 'verified')
      
      setStatus((count || 0) >= 7 ? 'Complete' : 'Incomplete')
    }
    getStatus()
  }, [studentId])

  if (status === 'loading') return <span className="text-gray-500">...</span>
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${
      status === 'Complete' 
        ? 'bg-green-500/20 text-green-400' 
        : 'bg-red-500/20 text-red-400'
    }`}>
      {status}
    </span>
  )
}