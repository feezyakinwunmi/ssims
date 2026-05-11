'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Sidebar from '../../../../components/ui/Sidebar'
import { motion } from 'framer-motion'

export default function AddStudentPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    matric_number: '',
    surname: '',
    first_name: '',
    other_names: '',
    email: '',
    phone: '',
    department: '',
    level: '100'
  })

  const departments = [
    'Computer Science',
    'Engineering',
    'Business Administration',
    'Law',
    'Medicine',
    'Social Sciences',
    'Arts & Humanities'
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { data, error } = await supabase
      .from('students')
      .insert([{
        ...formData,
        level: parseInt(formData.level)
      }])
      .select()

    if (error) {
      alert('Error adding student: ' + error.message)
    } else {
      alert('Student added successfully!')
      router.push('/super-admin/students')
    }

    setLoading(false)
  }

  return (
    <div className="flex min-h-screen bg-gray-900 text-white">
      <Sidebar role="super_admin" />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="text-3xl font-bold text-white mb-2">Add New Student</h1>
            <p className="text-gray-400 mb-8">Enter student details to register them in the system</p>

            <form onSubmit={handleSubmit} className="bg-gray-800/50 rounded-xl p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Matric Number *</label>
                  <input
                    type="text"
                    required
                    value={formData.matric_number}
                    onChange={(e) => setFormData({ ...formData, matric_number: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="e.g., SSIM/2024/001"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Surname *</label>
                  <input
                    type="text"
                    required
                    value={formData.surname}
                    onChange={(e) => setFormData({ ...formData, surname: e.target.value.toUpperCase() })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Surname"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">First Name</label>
                  <input
                    type="text"
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="First Name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Other Names</label>
                  <input
                    type="text"
                    value={formData.other_names}
                    onChange={(e) => setFormData({ ...formData, other_names: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="Other Names (optional)"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="student@example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                    placeholder="+234 XXX XXX XXXX"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Department *</label>
                  <select
                    required
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-white">Level *</label>
                  <select
                    required
                    value={formData.level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value })}
                    className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
                  >
                    <option value="100">100 Level</option>
                    <option value="200">200 Level</option>
                    <option value="300">300 Level</option>
                    <option value="400">400 Level</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Adding Student...' : 'Add Student'}
                </button>
                <button
                  type="button"
                  onClick={() => router.back()}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </main>
    </div>
  )
}