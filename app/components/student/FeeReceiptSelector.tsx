'use client'

import { useState } from 'react'
import DocumentUploader from '../ui/DocumentUploader'

interface FeeReceipt {
  id: string
  level: number
  payment_type: string
  receipt_url: string
  status: string
}

interface FeeReceiptSelectorProps {
  studentId: string
  currentLevel: number
  uploadedReceipts: FeeReceipt[]
  onUpload: () => void
}

const paymentOptions = [
  { value: '70%', label: '70% Payment', description: 'First installment' },
  { value: '30%', label: '30% Payment', description: 'Second installment' },
  { value: '100%', label: '100% Payment', description: 'Full payment' }
]

export default function FeeReceiptSelector({ studentId, currentLevel, uploadedReceipts, onUpload }: FeeReceiptSelectorProps) {
  const [selectedPayment, setSelectedPayment] = useState<string>('70%')

  const getReceiptStatus = (paymentType: string) => {
    const receipt = uploadedReceipts.find(r => r.payment_type === paymentType && r.level === currentLevel)
    if (!receipt) return null
    return receipt.status
  }

  const checkCompletion = () => {
    const has70 = uploadedReceipts.some(r => r.payment_type === '70%' && r.level === currentLevel && r.status === 'verified')
    const has30 = uploadedReceipts.some(r => r.payment_type === '30%' && r.level === currentLevel && r.status === 'verified')
    const has100 = uploadedReceipts.some(r => r.payment_type === '100%' && r.level === currentLevel && r.status === 'verified')
    
    if (has100) return 'complete'
    if (has70 && has30) return 'complete'
    if (has70 || has30) return 'partial'
    return 'incomplete'
  }

  const completion = checkCompletion()

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur">
      <h2 className="text-xl font-bold mb-4">Tuition Fee Receipts</h2>
      
      <div className="mb-4 p-3 bg-gray-700/30 rounded-lg">
        <p className="text-sm text-gray-400">Current Level</p>
        <p className="text-2xl font-bold">{currentLevel} Level</p>
      </div>

      <div className="mb-6">
        <div className={`p-3 rounded-lg mb-4 ${
          completion === 'complete' ? 'bg-green-500/20 text-green-400' :
          completion === 'partial' ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          <p className="font-semibold">
            {completion === 'complete' ? '✓ Fee payment complete for this level' :
             completion === 'partial' ? '⚠️ Partial payment - Missing some receipts' :
             '❌ No receipts uploaded yet'}
          </p>
        </div>

        <label className="block text-sm font-medium mb-2">Select Payment Type</label>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {paymentOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setSelectedPayment(option.value)}
              className={`p-3 rounded-lg text-center transition-all ${
                selectedPayment === option.value
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <div className="font-bold">{option.value}</div>
              <div className="text-xs opacity-75">{option.description}</div>
            </button>
          ))}
        </div>

        <DocumentUploader
          studentId={studentId}
          documentType={`fee_${currentLevel}_${selectedPayment}`}
          onUploadComplete={onUpload}
          existingFile={getReceiptStatus(selectedPayment) ? { url: '', status: getReceiptStatus(selectedPayment)! } : undefined}
        />
      </div>

      {/* Uploaded Receipts Summary */}
      {uploadedReceipts.length > 0 && (
        <div className="mt-6">
          <h3 className="font-semibold mb-3">Uploaded Receipts</h3>
          <div className="space-y-2">
            {uploadedReceipts.map((receipt) => (
              <div key={receipt.id} className="flex justify-between items-center p-2 bg-gray-700/30 rounded-lg">
                <div>
                  <span className="font-medium">{receipt.payment_type}</span>
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
  )
}