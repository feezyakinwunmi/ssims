'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'
import Sidebar from '../../../components/ui/Sidebar'
import { motion } from 'framer-motion'

const paymentOptions = [
  { value: '70%', label: '70% Payment', description: 'First installment payment' },
  { value: '30%', label: '30% Payment', description: 'Second installment payment' },
  { value: '100%', label: '100% Payment', description: 'Full payment (one-time)' }
]

export default function StudentFeeReceiptsPage() {
  const router = useRouter()
  const [student, setStudent] = useState<any>(null)
  const [feeReceipts, setFeeReceipts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedLevel, setSelectedLevel] = useState(100)
  const [selectedPayment, setSelectedPayment] = useState('70%')

  useEffect(() => {
    const session = localStorage.getItem('ssim_student_session')
    if (!session) {
      router.push('/student-login')
      return
    }
    const studentData = JSON.parse(session)
    setStudent(studentData)
    setSelectedLevel(studentData.level)
    fetchFeeReceipts(studentData.id)
  }, [])

  const fetchFeeReceipts = async (studentId: string) => {
    const { data } = await supabase
      .from('fee_receipts')
      .select('*')
      .eq('student_id', studentId)
    
    setFeeReceipts(data || [])
    setLoading(false)
  }

  const handleFileUpload = async (file: File) => {
    if (!student) return

    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      alert('Only PDF, JPEG, and PNG files are allowed')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB')
      return
    }

    setUploading(true)

    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${student.id}/fee_${selectedLevel}_${selectedPayment}_${Date.now()}.${fileExt}`
      
      const { error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('student-documents')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('fee_receipts')
        .insert({
          student_id: student.id,
          level: selectedLevel,
          payment_type: selectedPayment,
          receipt_url: publicUrl,
          status: 'pending'
        })

      if (dbError) throw dbError

      alert('Fee receipt uploaded successfully! Waiting for verification.')
      fetchFeeReceipts(student.id)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed to upload receipt. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const getReceiptStatus = (level: number, paymentType: string) => {
    const receipt = feeReceipts.find(r => r.level === level && r.payment_type === paymentType)
    if (!receipt) return null
    return receipt
  }

  const checkCompletion = (level: number) => {
    const has70 = feeReceipts.some(r => r.level === level && r.payment_type === '70%' && r.status === 'verified')
    const has30 = feeReceipts.some(r => r.level === level && r.payment_type === '30%' && r.status === 'verified')
    const has100 = feeReceipts.some(r => r.level === level && r.payment_type === '100%' && r.status === 'verified')
    
    if (has100) return 'complete'
    if (has70 && has30) return 'complete'
    if (has70 || has30) return 'partial'
    return 'incomplete'
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

  const completion = checkCompletion(selectedLevel)

  return (
    <div className="flex min-h-screen bg-gray-900">
      <Sidebar role="student" onLogout={handleLogout} />
      
      <main className="flex-1 ml-0 md:ml-64 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-white">Fee Receipts</h1>
            <button
              onClick={() => router.push('/student')}
              className="text-gray-400 hover:text-white transition"
            >
              ← Back to Dashboard
            </button>
          </div>

          {/* Level Selector */}
          <div className="bg-gray-800/50 rounded-xl p-6 mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Academic Level
            </label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(parseInt(e.target.value))}
              className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white"
            >
              <option value={student?.level}>Current Level: {student?.level}</option>
              <option value={100}>100 Level</option>
              <option value={200}>200 Level</option>
              <option value={300}>300 Level</option>
              <option value={400}>400 Level</option>
            </select>
          </div>

          {/* Payment Status */}
          <div className={`p-4 rounded-lg mb-6 ${
            completion === 'complete' ? 'bg-green-500/20 border border-green-500/50' :
            completion === 'partial' ? 'bg-yellow-500/20 border border-yellow-500/50' :
            'bg-red-500/20 border border-red-500/50'
          }`}>
            <p className={`font-semibold ${
              completion === 'complete' ? 'text-green-400' :
              completion === 'partial' ? 'text-yellow-400' :
              'text-red-400'
            }`}>
              {completion === 'complete' ? '✓ Fee payment complete for this level' :
               completion === 'partial' ? '⚠️ Partial payment - Missing some receipts' :
               '❌ No receipts uploaded yet'}
            </p>
          </div>

          {/* Payment Options */}
          <div className="space-y-4">
            {paymentOptions.map((option) => {
              const receipt = getReceiptStatus(selectedLevel, option.value)
              return (
                <motion.div
                  key={option.value}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-gray-800/50 rounded-xl p-6"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{option.label}</h3>
                      <p className="text-sm text-gray-400">{option.description}</p>
                    </div>
                    {receipt && (
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        receipt.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                        receipt.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-red-500/20 text-red-400'
                      }`}>
                        {receipt.status === 'verified' ? '✓ Verified' :
                         receipt.status === 'pending' ? '⏳ Pending' :
                         '✗ Rejected'}
                      </span>
                    )}
                  </div>

                  {receipt && receipt.status !== 'rejected' && (
                    <div className="mb-3">
                      <a 
                        href={receipt.receipt_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:text-blue-300 text-sm"
                      >
                        View uploaded receipt →
                      </a>
                    </div>
                  )}

                  {selectedPayment === option.value && !receipt ? (
                    <div className="mt-4">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(e.target.files[0])
                          }
                        }}
                        className="hidden"
                        id={`receipt-${option.value}`}
                        disabled={uploading}
                      />
                      <label
                        htmlFor={`receipt-${option.value}`}
                        className={`inline-block bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition cursor-pointer ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {uploading && selectedPayment === option.value ? 'Uploading...' : '+ Upload Receipt'}
                      </label>
                    </div>
                  ) : !receipt && (
                    <button
                      onClick={() => setSelectedPayment(option.value)}
                      className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition"
                    >
                      Select to Upload
                    </button>
                  )}
                </motion.div>
              )
            })}
          </div>

          {/* Submitted Receipts Summary */}
          {feeReceipts.length > 0 && (
            <div className="bg-gray-800/50 rounded-xl p-6 mt-6">
              <h3 className="text-lg font-semibold text-white mb-4">Submitted Receipts</h3>
              <div className="space-y-2">
                {feeReceipts.map((receipt) => (
                  <div key={receipt.id} className="flex justify-between items-center p-3 bg-gray-700/30 rounded-lg">
                    <div>
                      <span className="font-medium text-white">{receipt.payment_type}</span>
                      <span className="text-xs text-gray-400 ml-2">Level {receipt.level}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      receipt.status === 'verified' ? 'bg-green-500/20 text-green-400' :
                      receipt.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {receipt.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}