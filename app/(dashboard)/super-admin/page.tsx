'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../components/ui/Sidebar'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, ChartData } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

export default function SuperAdminDashboard() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [authChecking, setAuthChecking] = useState(true)
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalAdmins: 0,
    completedProfiles: 0,
    pendingVerifications: 0,
    verifiedDocuments: 0,
    totalDocuments: 0
  })
  const [recentStudents, setRecentStudents] = useState<any[]>([])
  const [chartData, setChartData] = useState<ChartData<'line'>>({ labels: [], datasets: [] })

  // Check authentication first
  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        router.push('/login')
        return
      }

      // Check if user has super_admin role
      const { data: userRole } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', session.user.id)
        .single()

      if (userRole?.role !== 'super_admin') {
        router.push('/login')
        return
      }

      setAuthChecking(false)
      // Fetch data after auth is confirmed
      fetchStats()
      fetchChartData()
      fetchRecentStudents()
    } catch (error) {
      console.error('Auth check error:', error)
      router.push('/login')
    }
  }

  const fetchStats = async () => {
    try {
      // Total students
      const { count: totalStudents } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
      
      // Total admins
      const { count: totalAdmins } = await supabase
        .from('user_roles')
        .select('*', { count: 'exact', head: true })
        .eq('role', 'admin')
      
      // Completed profiles (students with all required docs)
      const { data: students } = await supabase
        .from('students')
        .select('id')
      
      let completedCount = 0
      if (students) {
        for (const student of students) {
          const { count: docCount } = await supabase
            .from('student_documents')
            .select('*', { count: 'exact', head: true })
            .eq('student_id', student.id)
            .eq('status', 'verified')
          
          if (docCount && docCount >= 7) completedCount++
        }
      }
      
      // Pending verifications
      const { count: pendingVerifications } = await supabase
        .from('student_documents')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')
      
      setStats({
        totalStudents: totalStudents || 0,
        totalAdmins: totalAdmins || 0,
        completedProfiles: completedCount,
        pendingVerifications: pendingVerifications || 0,
        verifiedDocuments: 0,
        totalDocuments: 0
      })
      
      setLoading(false)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setLoading(false)
    }
  }

  const fetchChartData = async () => {
    try {
      const { data: registrations } = await supabase
        .from('students')
        .select('created_at')
      
      const monthlyData = new Array(12).fill(0)
      registrations?.forEach(reg => {
        const month = new Date(reg.created_at).getMonth()
        monthlyData[month]++
      })
      
      setChartData({
        labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        datasets: [
          {
            label: 'Student Registrations',
            data: monthlyData,
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      })
    } catch (error) {
      console.error('Error fetching chart data:', error)
    }
  }

  const fetchRecentStudents = async () => {
    try {
      const { data } = await supabase
        .from('students')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10)
      
      setRecentStudents(data || [])
    } catch (error) {
      console.error('Error fetching recent students:', error)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/login')
  }

  // Show loading state while checking auth
  if (authChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Verifying access...</p>
        </div>
      </div>
    )
  }

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-900 text-white">
        <Sidebar role="super_admin" onLogout={handleLogout} />
        <main className="flex-1 ml-0 md:ml-64 p-6">
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-4 text-gray-400">Loading dashboard...</p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="super_admin" onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-white mb-8">Super Admin Dashboard</h1>
          
          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold">{stats.totalStudents}</div>
              <div className="text-sm opacity-90">Total Students</div>
            </div>
            
            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold">{stats.totalAdmins}</div>
              <div className="text-sm opacity-90">Total Admins</div>
            </div>
            
            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold">{stats.completedProfiles}</div>
              <div className="text-sm opacity-90">Completed Profiles</div>
            </div>
            
            <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold">{stats.pendingVerifications}</div>
              <div className="text-sm opacity-90">Pending Verifications</div>
            </div>
            
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-xl p-6 text-white">
              <div className="text-3xl font-bold">
                {((stats.completedProfiles / stats.totalStudents) * 100 || 0).toFixed(0)}%
              </div>
              <div className="text-sm opacity-90">Completion Rate</div>
            </div>
          </div>
          
          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur">
              <h3 className="text-lg text-white font-semibold mb-4">Student Registrations (2024)</h3>
              {chartData.labels && chartData.labels.length > 0 ? (
                <Line data={chartData} options={{ responsive: true }} />
              ) : (
                <p className="text-gray-400 text-center py-8">No registration data available</p>
              )}
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur">
              <h3 className="text-lg text-white font-semibold mb-4">Recent Student Additions</h3>
              <div className="space-y-3">
                {recentStudents.length > 0 ? (
                  recentStudents.map((student: any) => (
                    <div key={student.id} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                      <div>
                        <p className="font-medium text-white">{student.surname} {student.first_name}</p>
                        <p className="text-sm text-gray-400">{student.matric_number}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(student.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 text-center py-8">No students found</p>
                )}
              </div>
            </div>
          </div>
          
          {/* Quick Actions */}
          <div className="bg-gray-800/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a 
                href="/super-admin/students/add"
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
              >
                + Add New Student
              </a>
              <a 
                href="/super-admin/admins/add"
                className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
              >
                + Add New Admin
              </a>
              <a 
                href="/super-admin/verifications"
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-lg transition text-center"
              >
                View All Verifications
              </a>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}