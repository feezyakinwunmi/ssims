'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { supabase } from '@/lib/supabase/client'
import { motion, AnimatePresence } from 'framer-motion'

interface DocumentUploaderProps {
  studentId: string
  documentType: string
  onUploadComplete: () => void
  existingFile?: { url: string; status: string }
}

export default function DocumentUploader({ 
  studentId, 
  documentType, 
  onUploadComplete,
  existingFile 
}: DocumentUploaderProps) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0]
    if (!file) return

    // Validate file type
    const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg']
    if (!validTypes.includes(file.type)) {
      setError('Only PDF, JPEG, and PNG files are allowed')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    setUploading(true)
    setError(null)

    try {
      // Generate unique file name
      const fileExt = file.name.split('.').pop()
      const fileName = `${studentId}/${documentType}_${Date.now()}.${fileExt}`
      
      // Upload to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('student-documents')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        })

      if (uploadError) throw uploadError
      setProgress(100)

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student-documents')
        .getPublicUrl(fileName)

      // Save to database
      const { error: dbError } = await supabase
        .from('student_documents')
        .upsert({
          student_id: studentId,
          document_type: documentType,
          file_url: publicUrl,
          status: 'pending'
        }, {
          onConflict: 'student_id,document_type'
        })

      if (dbError) throw dbError

      onUploadComplete()
    } catch (err) {
      console.error('Upload error:', err)
      setError('Failed to upload document. Please try again.')
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [studentId, documentType, onUploadComplete])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png']
    },
    maxFiles: 1,
    disabled: uploading
  })

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'verified': return 'text-green-400 bg-green-500/10'
      case 'rejected': return 'text-red-400 bg-red-500/10'
      case 'pending': return 'text-yellow-400 bg-yellow-500/10'
      default: return 'text-gray-400 bg-gray-500/10'
    }
  }

  return (
    <div className="space-y-3">
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all duration-200
          ${isDragActive ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-blue-500/50'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input {...getInputProps()} />
        
        {uploading ? (
          <div className="space-y-3">
            <div className="text-blue-400 text-4xl mb-2">⏳</div>
            <p className="text-sm text-gray-400">Uploading... {Math.round(progress)}%</p>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            <div className="text-4xl mb-2">📄</div>
            <p className="text-sm text-gray-400">
              {isDragActive ? 'Drop your file here' : 'Drag & drop or click to upload'}
            </p>
            <p className="text-xs text-gray-500 mt-2">PDF, JPEG, PNG (Max 5MB)</p>
          </>
        )}
      </div>

      {existingFile && (
        <div className={`flex items-center justify-between p-3 rounded-lg ${getStatusColor(existingFile.status)}`}>
          <div className="flex items-center space-x-2">
            <span>📎</span>
            <span className="text-sm">Document uploaded</span>
          </div>
          <span className="text-xs font-semibold uppercase">
            {existingFile.status}
          </span>
        </div>
      )}

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-red-400 text-sm bg-red-500/10 p-2 rounded-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}