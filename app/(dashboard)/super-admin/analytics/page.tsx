'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../../components/ui/Sidebar'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, LineElement, PointElement, Title, Tooltip, Legend)

export default function AnalyticsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    byDepartment: {} as Record<string, number>,
    byLevel: {} as Record<string, number>,
    documentStatus: { verified: 0, pending: 0, total: 0 }
  })

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      // Get all students
      const { data: students } = await supabase
        .from('students')
        .select('department, level')

      // Calculate by department
      const byDepartment: Record<string, number> = {}
      const byLevel: Record<string, number> = {}

      students?.forEach(student => {
        byDepartment[student.department] = (byDepartment[student.department] || 0) + 1
        byLevel[`Level ${student.level}`] = (byLevel[`Level ${student.level}`] || 0) + 1
      })

      // Get document stats
      const { data: documents } = await supabase
        .from('student_documents')
        .select('status')

      const verified = documents?.filter(d => d.status === 'verified').length || 0
      const pending = documents?.filter(d => d.status === 'pending').length || 0

      setStats({
        totalStudents: students?.length || 0,
        byDepartment,
        byLevel,
        documentStatus: { verified, pending, total: documents?.length || 0 }
      })
    } catch (error) {
      console.error('Error fetching analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  const departmentData = {
    labels: Object.keys(stats.byDepartment),
    datasets: [{
      label: 'Students by Department',
      data: Object.values(stats.byDepartment),
      backgroundColor: 'rgba(59, 130, 246, 0.5)',
      borderColor: 'rgb(59, 130, 246)',
      borderWidth: 1
    }]
  }

  const levelData = {
    labels: Object.keys(stats.byLevel),
    datasets: [{
      data: Object.values(stats.byLevel),
      backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
    }]
  }

  const documentData = {
    labels: ['Verified', 'Pending'],
    datasets: [{
      data: [stats.documentStatus.verified, stats.documentStatus.pending],
      backgroundColor: ['#10b981', '#f59e0b']
    }]
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
          <h1 className="text-3xl font-bold text-white mb-8">Analytics Dashboard</h1>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Department Distribution */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Students by Department</h3>
              <Bar data={departmentData} options={{ responsive: true }} />
            </div>

            {/* Level Distribution */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Students by Level</h3>
              <Doughnut data={levelData} options={{ responsive: true }} />
            </div>

            {/* Document Status */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Document Verification Status</h3>
              <Doughnut data={documentData} options={{ responsive: true }} />
              <div className="mt-4 text-center">
                <p className="text-gray-400">Total Documents: {stats.documentStatus.total}</p>
              </div>
            </div>

            {/* Summary Stats */}
            <div className="bg-gray-800/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-white">Summary</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg text-white">
                  <span>Total Students</span>
                  <span className="text-2xl font-bold text-blue-400">{stats.totalStudents}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg text-white">
                  <span>Total Departments</span>
                  <span className="text-2xl font-bold text-green-400">{Object.keys(stats.byDepartment).length}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg text-white">
                  <span>Documents Verified</span>
                  <span className="text-2xl font-bold text-green-400">{stats.documentStatus.verified}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg text-white">
                  <span>Documents Pending</span>
                  <span className="text-2xl font-bold text-yellow-400">{stats.documentStatus.pending}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}