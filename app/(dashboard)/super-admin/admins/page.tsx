'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../../components/ui/Sidebar'

export default function AdminsPage() {
  const router = useRouter()
  const [admins, setAdmins] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAdmins()
  }, [])

  const fetchAdmins = async () => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('*, auth.users!inner(email)')
        .eq('role', 'admin')

      if (error) throw error
      setAdmins(data || [])
    } catch (error) {
      console.error('Error fetching admins:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (userId: string) => {
    if (confirm('Are you sure you want to remove this admin?')) {
      await supabase.from('user_roles').delete().eq('user_id', userId)
      fetchAdmins()
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

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="super_admin" onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Manage Admins</h1>
            <button
              onClick={() => router.push('/super-admin/admins/add')}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
            >
              + Add New Admin
            </button>
          </div>

          <div className="bg-gray-800/50 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {admins.map((admin) => (
                  <tr key={admin.user_id} className="hover:bg-gray-800/50">
                    <td className="px-6 py-4 text-sm text-gray-300">{admin.users?.email || 'Unknown'}</td>
                    <td className="px-6 py-4 text-sm text-gray-300">
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs">Admin</span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button onClick={() => handleDelete(admin.user_id)} className="text-red-400 hover:text-red-300">
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}