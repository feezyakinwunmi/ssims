'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../components/ui/Sidebar'
import StatsCard from '../../components/ui/StatsCard'
import StudentTable from '../../components/admin/StudentTable'
import { motion } from 'framer-motion'

export default function AdminDashboard() {
  const [students, setStudents] = useState<any[]>([])
  const [stats, setStats] = useState({
    total: 0,
    pendingVerifications: 0,
    incompleteProfiles: 0,
    completeProfiles: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStudents()
    fetchStats()
  }, [])

  const fetchStudents = async () => {
    const { data } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false })
    
    setStudents(data || [])
    setLoading(false)
  }

  const fetchStats = async () => {
    // Get total students
    const { count: total } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
    
    // Get pending verifications
    const { count: pending } = await supabase
      .from('student_documents')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')
    
    // Get incomplete profiles (students with less than 7 verified docs)
    const { data: allStudents } = await supabase
      .from('students')
      .select('id')
    
    let incomplete = 0
    let complete = 0
    
    for (const student of allStudents || []) {
      const { data: docs } = await supabase
        .from('student_documents')
        .select('status')
        .eq('student_id', student.id)
        .eq('status', 'verified')
      
      if ((docs?.length || 0) >= 7) {
        complete++
      } else {
        incomplete++
      }
    }
    
    setStats({
      total: total || 0,
      pendingVerifications: pending || 0,
      incompleteProfiles: incomplete,
      completeProfiles: complete
    })
  }

  const handleEditStudent = (student: any) => {
    // Open edit modal or navigate to edit page
    console.log('Edit student:', student)
  }

  const handleDeleteStudent = async (id: string) => {
    if (confirm('Are you sure you want to delete this student?')) {
      await supabase.from('students').delete().eq('id', id)
      fetchStudents()
      fetchStats()
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-900 items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="admin" />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-white mb-2">Admin Dashboard</h1>
            <p className="text-gray-400">Manage students, verify documents, and track progress</p>
          </motion.div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatsCard title="Total Students" value={stats.total} icon="👨‍🎓" color="blue" />
            <StatsCard title="Pending Verifications" value={stats.pendingVerifications} icon="⏳" color="yellow" />
            <StatsCard title="Complete Profiles" value={stats.completeProfiles} icon="✅" color="green" />
            <StatsCard title="Incomplete Profiles" value={stats.incompleteProfiles} icon="⚠️" color="red" />
          </div>

          {/* Quick Actions */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-8">
            <h2 className="text-xl font-bold mb-4 text-white">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                + Add New Student
              </button>
              <button className="bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                View Pending Verifications
              </button>
              <button className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-6 rounded-lg transition">
                View Incomplete Profiles
              </button>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 text-white">All Students</h2>
            <StudentTable
              students={students}
              onEdit={handleEditStudent}
              onDelete={handleDeleteStudent}
              role="admin"
            />
          </div>
        </div>
      </main>
    </div>
  )
}