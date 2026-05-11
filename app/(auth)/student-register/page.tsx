'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase/client'

export default function StudentLoginPage() {
  const [matricNumber, setMatricNumber] = useState('')
  const [surname, setSurname] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Validate matric number format (11 digits)
    if (!/^\d{11}$/.test(matricNumber)) {
      setError('Invalid matric number format. Must be 11 digits.')
      setLoading(false)
      return
    }

    // Check if student exists with this matric number and surname
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, matric_number, surname, first_name, department, level')
      .eq('matric_number', matricNumber)
      .eq('surname', surname.toUpperCase())
      .single()

    if (studentError || !student) {
      setError('Invalid Matric Number or Surname. Please contact your Super Admin.')
      setLoading(false)
      return
    }

    // Store student session in localStorage (no auth user created)
    const studentSession = {
      id: student.id,
      matric_number: student.matric_number,
      surname: student.surname,
      first_name: student.first_name,
      department: student.department,
      level: student.level,
      role: 'student',
      loggedInAt: new Date().toISOString()
    }
    
    localStorage.setItem('ssim_student_session', JSON.stringify(studentSession))
    
    // Redirect to student dashboard
    router.push('/student')
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gray-800/50 backdrop-blur-xl p-8 rounded-2xl border border-blue-500/20 w-full max-w-md"
      >
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🎓</div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
            Student Portal
          </h1>
          <p className="text-gray-400 mt-2">Enter your matric number and surname to login</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Matric Number</label>
            <input
              type="text"
              value={matricNumber}
              onChange={(e) => setMatricNumber(e.target.value.replace(/\D/g, '').slice(0, 11))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white font-mono"
              placeholder="e.g., 19200291001"
              required
            />
            <p className="text-xs text-gray-500 mt-1">11-digit matriculation number</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Surname (as registered)</label>
            <input
              type="text"
              value={surname}
              onChange={(e) => setSurname(e.target.value.toUpperCase())}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500 text-white uppercase"
              placeholder="Enter your surname in UPPERCASE"
              required
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition disabled:opacity-50"
          >
            {loading ? 'Verifying...' : 'Login to Portal'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            Don't have an account?{' '}
            <a href="/contact-admin" className="text-blue-400 hover:text-blue-300">
              Contact Admin
            </a>
          </p>
        </div>
      </motion.div>
    </div>
  )
}