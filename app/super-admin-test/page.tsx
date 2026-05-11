'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

export default function SuperAdminTest() {
  const [session, setSession] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      console.log('1. Checking session...')
      const { data: { session } } = await supabase.auth.getSession()
      console.log('2. Session:', session)
      setSession(session)

      if (session) {
        console.log('3. Fetching role for user:', session.user.id)
        const { data: userRole, error } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', session.user.id)
          .single()
        
        console.log('4. Role data:', userRole)
        console.log('5. Role error:', error)
        
        if (userRole) {
          setRole(userRole.role)
        }
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <h1 className="text-3xl font-bold mb-4">Super Admin Test Page</h1>
      
      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-2">Session Info:</h2>
        <pre className="text-sm text-gray-300">
          {JSON.stringify(session, null, 2)}
        </pre>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg mb-4">
        <h2 className="text-xl font-semibold mb-2">Role:</h2>
        <p className="text-green-400 text-xl font-bold">{role || 'No role found'}</p>
      </div>

      <button 
        onClick={handleLogout}
        className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded"
      >
        Logout
      </button>
    </div>
  )
}