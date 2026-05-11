import { v4 as uuidv4 } from 'uuid'

export interface Student {
  id: string
  matric_number: string
  surname: string
  first_name: string
  other_names?: string
  email?: string
  phone?: string
  department: string
  level: number
  profile_picture_url?: string
  created_at: string
}

export interface Document {
  id: string
  student_id: string
  document_type: string
  file_url: string
  status: 'pending' | 'verified' | 'rejected'
  uploaded_at: string
}

export interface FeeReceipt {
  id: string
  student_id: string
  level: number
  payment_type: '70%' | '30%' | '100%'
  receipt_url: string
  status: 'pending' | 'verified' | 'rejected'
  uploaded_at: string
}

// Initial mock data
const mockStudents: Student[] = [
  {
    id: '1',
    matric_number: 'SSIM/2024/001',
    surname: 'DOE',
    first_name: 'John',
    other_names: 'Michael',
    email: 'john.doe@example.com',
    phone: '+234 801 234 5678',
    department: 'Computer Science',
    level: 100,
    created_at: new Date().toISOString()
  },
  {
    id: '2',
    matric_number: 'SSIM/2024/002',
    surname: 'SMITH',
    first_name: 'Jane',
    other_names: 'Alice',
    email: 'jane.smith@example.com',
    phone: '+234 802 345 6789',
    department: 'Engineering',
    level: 200,
    created_at: new Date().toISOString()
  },
  {
    id: '3',
    matric_number: 'SSIM/2024/003',
    surname: 'JOHNSON',
    first_name: 'Robert',
    department: 'Business Administration',
    level: 100,
    created_at: new Date().toISOString()
  }
]

const mockDocuments: Document[] = [
  {
    id: '1',
    student_id: '1',
    document_type: 'acceptance_fee',
    file_url: '/mock/acceptance.pdf',
    status: 'verified',
    uploaded_at: new Date().toISOString()
  },
  {
    id: '2',
    student_id: '1',
    document_type: 'admission_letter',
    file_url: '/mock/admission.pdf',
    status: 'verified',
    uploaded_at: new Date().toISOString()
  },
  {
    id: '3',
    student_id: '1',
    document_type: 'birth_cert',
    file_url: '/mock/birth.pdf',
    status: 'pending',
    uploaded_at: new Date().toISOString()
  }
]

const mockFeeReceipts: FeeReceipt[] = [
  {
    id: '1',
    student_id: '1',
    level: 100,
    payment_type: '70%',
    receipt_url: '/mock/fee70.pdf',
    status: 'verified',
    uploaded_at: new Date().toISOString()
  }
]

// Helper functions to simulate API calls
export const mockDataService = {
  // Students
  getStudents: async (): Promise<Student[]> => {
    return new Promise(resolve => setTimeout(() => resolve([...mockStudents]), 500))
  },
  
  getStudentById: async (id: string): Promise<Student | undefined> => {
    return new Promise(resolve => setTimeout(() => resolve(mockStudents.find(s => s.id === id)), 300))
  },
  
  addStudent: async (student: Omit<Student, 'id' | 'created_at'>): Promise<Student> => {
    const newStudent = {
      ...student,
      id: uuidv4(),
      created_at: new Date().toISOString()
    }
    mockStudents.push(newStudent)
    return new Promise(resolve => setTimeout(() => resolve(newStudent), 500))
  },
  
  updateStudent: async (id: string, updates: Partial<Student>): Promise<Student | undefined> => {
    const index = mockStudents.findIndex(s => s.id === id)
    if (index !== -1) {
      mockStudents[index] = { ...mockStudents[index], ...updates }
      return mockStudents[index]
    }
    return undefined
  },
  
  deleteStudent: async (id: string): Promise<boolean> => {
    const index = mockStudents.findIndex(s => s.id === id)
    if (index !== -1) {
      mockStudents.splice(index, 1)
      return true
    }
    return false
  },
  
  // Documents
  getDocumentsByStudent: async (studentId: string): Promise<Document[]> => {
    return new Promise(resolve => setTimeout(() => resolve(mockDocuments.filter(d => d.student_id === studentId)), 300))
  },
  
  uploadDocument: async (studentId: string, documentType: string, file: File): Promise<Document> => {
    const newDoc = {
      id: uuidv4(),
      student_id: studentId,
      document_type: documentType,
      file_url: URL.createObjectURL(file),
      status: 'pending' as const,
      uploaded_at: new Date().toISOString()
    }
    mockDocuments.push(newDoc)
    return new Promise(resolve => setTimeout(() => resolve(newDoc), 1000))
  },
  
  verifyDocument: async (docId: string, status: 'verified' | 'rejected'): Promise<void> => {
    const doc = mockDocuments.find(d => d.id === docId)
    if (doc) doc.status = status
    return new Promise(resolve => setTimeout(() => resolve(), 300))
  },
  
  // Fee Receipts
  getFeeReceiptsByStudent: async (studentId: string): Promise<FeeReceipt[]> => {
    return new Promise(resolve => setTimeout(() => resolve(mockFeeReceipts.filter(r => r.student_id === studentId)), 300))
  },
  
  uploadFeeReceipt: async (studentId: string, level: number, paymentType: string, file: File): Promise<FeeReceipt> => {
    const newReceipt = {
      id: uuidv4(),
      student_id: studentId,
      level,
      payment_type: paymentType as any,
      receipt_url: URL.createObjectURL(file),
      status: 'pending' as const,
      uploaded_at: new Date().toISOString()
    }
    mockFeeReceipts.push(newReceipt)
    return new Promise(resolve => setTimeout(() => resolve(newReceipt), 1000))
  },
  
  // Stats
  getStats: async () => {
    return new Promise(resolve => setTimeout(() => resolve({
      totalStudents: mockStudents.length,
      totalDocuments: mockDocuments.length,
      pendingVerifications: mockDocuments.filter(d => d.status === 'pending').length,
      verifiedDocuments: mockDocuments.filter(d => d.status === 'verified').length,
      completedProfiles: mockStudents.filter(s => mockDocuments.filter(d => d.student_id === s.id && d.status === 'verified').length >= 7).length
    }), 300))
  }
}