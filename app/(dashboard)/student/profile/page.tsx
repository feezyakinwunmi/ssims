

'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../../components/ui/Sidebar'

export default function StudentProfilePage() {
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    first_name: '',
    other_names: ''
  })

  useEffect(() => {
    const session = localStorage.getItem('ssim_student_session')
    if (!session) {
      router.push('/student-login')
      return
    }
    const studentData = JSON.parse(session)
    setStudent(studentData)
    fetchStudentDetails(studentData.id)
  }, [])

  const fetchStudentDetails = async (studentId: string) => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single()
    
    if (data) {
      setFormData({
        email: data.email || '',
        phone: data.phone || '',
        first_name: data.first_name || '',
        other_names: data.other_names || ''
      })
    }
    setLoading(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setUpdating(true)

    const { error } = await supabase
      .from('students')
      .update({
        email: formData.email,
        phone: formData.phone,
        first_name: formData.first_name,
        other_names: formData.other_names
      })
      .eq('id', student.id)

    if (error) {
      alert('Error updating profile: ' + error.message)
    } else {
      alert('Profile updated successfully!')
      // Update local storage
      const updatedSession = { ...student, ...formData }
      localStorage.setItem('ssim_student_session', JSON.stringify(updatedSession))
    }
    setUpdating(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('ssim_student_session')
    router.push('/student-login')
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
      <Sidebar role="student" onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">My Profile</h1>
            <button
              onClick={() => router.push('/student')}
              className="text-gray-400 hover:text-white transition"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Student Info Card */}
          <div className="bg-gradient-to-br from-blue-600/20 to-blue-800/20 border border-blue-500/30 rounded-xl p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-400">Matric Number</p>
                <p className="text-lg font-semibold text-white">{student?.matric_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Surname</p>
                <p className="text-lg font-semibold text-white">{student?.surname}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Department</p>
                <p className="text-lg font-semibold text-white">{student?.department}</p>
              </div>
              <div>
                <p className="text-sm text-gray-400">Current Level</p>
                <p className="text-lg font-semibold text-white">{student?.level}</p>
              </div>
            </div>
          </div>

          {/* Edit Form */}
          <form onSubmit={handleUpdate} className="bg-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-4">Edit Profile Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  First Name
                </label>
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Other Names
                </label>
                <input
                  type="text"
                  value={formData.other_names}
                  onChange={(e) => setFormData({ ...formData, other_names: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="+234 XXX XXX XXXX"
                />
              </div>

              <button
                type="submit"
                disabled={updating}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}