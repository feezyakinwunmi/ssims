'use client'

import { useState } from 'react'
import DocumentUploader from '../ui/DocumentUploader'

interface Document {
  id: string
  name: string
  required: boolean
}

interface DocumentListProps {
  documents: Document[]
  uploadedDocs: any[]
  studentId: string
  onUpload: () => void
}

export default function DocumentList({ documents, uploadedDocs, studentId, onUpload }: DocumentListProps) {
  const getDocumentStatus = (docId: string) => {
    const doc = uploadedDocs.find(d => d.document_type === docId)
    if (!doc) return { uploaded: false, status: null }
    return { uploaded: true, status: doc.status }
  }

  return (
    <div className="bg-gray-800/50 rounded-xl p-6 backdrop-blur">
      <h2 className="text-xl font-bold mb-4">Required Documents</h2>
      <div className="space-y-6">
        {documents.map((doc) => {
          const { uploaded, status } = getDocumentStatus(doc.id)
          return (
            <div key={doc.id} className="border-b border-gray-700 last:border-0 pb-4 last:pb-0">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-semibold">{doc.name}</h3>
                  {doc.required && (
                    <span className="text-xs text-red-400">Required</span>
                  )}
                </div>
                {uploaded && (
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    status === 'verified' ? 'bg-green-500/20 text-green-400' :
                    status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {status === 'verified' ? '✓ Verified' :
                     status === 'pending' ? '⏳ Pending' :
                     '✗ Rejected'}
                  </span>
                )}
              </div>
              <DocumentUploader
                studentId={studentId}
                documentType={doc.id}
                onUploadComplete={onUpload}
                existingFile={uploaded ? { url: '', status } : undefined}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}