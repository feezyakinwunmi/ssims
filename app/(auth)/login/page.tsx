'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

export default function SimpleLogin() {
  const [email, setEmail] = useState('superdami@gmail.com')
  const [password, setPassword] = useState('superdami12$')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    console.log('Attempting login with:', email)

    try {
      // Sign in
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (signInError) {
        console.error('Sign in error:', signInError)
        setError('Login failed: ' + signInError.message)
        setLoading(false)
        return
      }

      console.log('Signed in successfully:', data.user)

      // Get role
      const { data: roleData, error: roleError } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', data.user.id)
        .maybeSingle()

      console.log('Role data:', roleData)
      console.log('Role error:', roleError)

      if (roleError || !roleData) {
        setError('User role not found. Please contact super admin.')
        setLoading(false)
        return
      }

      // Store user info in localStorage
      localStorage.setItem('ssim_admin', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        role: roleData.role
      }))

      // Redirect using window.location
      if (roleData.role === 'super_admin') {
        console.log('Redirecting to super admin dashboard')
        window.location.href = '/super-admin'
      } else if (roleData.role === 'admin') {
        console.log('Redirecting to admin dashboard')
        window.location.href = '/admin'
      } else {
        setError('Invalid role. Admin access only.')
        setLoading(false)
      }
    } catch (err) {
      console.error('Login error:', err)
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl border border-blue-500/20 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Admin Portal
          </h1>
          <p className="text-gray-400 mt-2">Secure Information Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white transition"
              placeholder="admin@ssim.edu"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white transition"
              placeholder="••••••••"
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Logging in...
              </span>
            ) : (
              'Login to Dashboard'
            )}
          </button>
          
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-3 bg-red-500/20 border border-red-500/50 text-red-400 rounded-lg text-sm"
            >
              {error}
            </motion.div>
          )}
        </form>

       

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-500">
            Student?{' '}
            <a href="/student-login" className="text-blue-400 hover:text-blue-300 transition">
              Login here
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}