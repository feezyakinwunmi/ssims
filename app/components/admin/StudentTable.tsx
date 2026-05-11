'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

interface Student {
  id: string
  matric_number: string
  surname: string
  first_name: string
  department: string
  level: number
  created_at: string
}

interface StudentTableProps {
  students: Student[]
  onEdit: (student: Student) => void
  onDelete: (id: string) => void
  role: 'admin' | 'super_admin'
}

export default function StudentTable({ students, onEdit, onDelete, role }: StudentTableProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterLevel, setFilterLevel] = useState<string>('all')

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.matric_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.first_name?.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesLevel = filterLevel === 'all' || student.level.toString() === filterLevel
    
    return matchesSearch && matchesLevel
  })

  const getCompletionStatus = async (studentId: string) => {
    const { data } = await supabase
      .from('student_documents')
      .select('status')
      .eq('student_id', studentId)
    
    const totalDocs = 7 // Required documents
    const uploaded = data?.length || 0
    const verified = data?.filter(d => d.status === 'verified').length || 0
    
    if (verified === totalDocs) return { status: 'complete', color: 'text-green-400' }
    if (uploaded > 0) return { status: 'partial', color: 'text-yellow-400' }
    return { status: 'incomplete', color: 'text-red-400' }
  }

  return (
    <div className="space-y-4 text-white">
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <input
          type="text"
          placeholder="Search by matric number or name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
        />
        
        <select
          value={filterLevel}
          onChange={(e) => setFilterLevel(e.target.value)}
          className="px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:border-blue-500"
        >
          <option value="all">All Levels</option>
          <option value="100">100 Level</option>
          <option value="200">200 Level</option>
          <option value="300">300 Level</option>
          <option value="400">400 Level</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Matric No.</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Department</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Level</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {filteredStudents.map((student, index) => (
              <motion.tr
                key={student.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="hover:bg-gray-800/30 transition"
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-mono">{student.matric_number}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {student.surname} {student.first_name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{student.department}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">{student.level}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <CompletionBadge studentId={student.id} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                  <button
                    onClick={() => onEdit(student)}
                    className="text-blue-400 hover:text-blue-300 transition"
                  >
                    Edit
                  </button>
                  {role === 'super_admin' && (
                    <button
                      onClick={() => onDelete(student.id)}
                      className="text-red-400 hover:text-red-300 transition"
                    >
                      Delete
                    </button>
                  )}
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredStudents.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          No students found
        </div>
      )}
    </div>
  )
}

// Helper component for completion badge
function CompletionBadge({ studentId }: { studentId: string }) {
  const [status, setStatus] = useState<{ status: string; color: string }>({ status: 'loading', color: '' })
  
  useEffect(() => {
    const fetchStatus = async () => {
      const { data } = await supabase
        .from('student_documents')
        .select('status')
        .eq('student_id', studentId)
      
      const totalDocs = 7
      const uploaded = data?.length || 0
      const verified = data?.filter(d => d.status === 'verified').length || 0
      
      if (verified === totalDocs) setStatus({ status: 'Complete', color: 'text-green-400' })
      else if (uploaded > 0) setStatus({ status: 'Partial', color: 'text-yellow-400' })
      else setStatus({ status: 'Incomplete', color: 'text-red-400' })
    }
    
    fetchStatus()
  }, [studentId])
  
  return <span className={status.color}>{status.status}</span>
}