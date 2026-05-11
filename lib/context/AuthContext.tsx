'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface User {
  id: string
  email: string
  role: 'super_admin' | 'admin' | 'student'
  name?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (email: string, password: string) => Promise<boolean>
  logout: () => void
  isSuperAdmin: boolean
  isAdmin: boolean
  isStudent: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Mock users for testing
const MOCK_USERS = {
  'superadmin@ssim.com': {
    id: '1',
    email: 'superadmin@ssim.com',
    password: 'admin123',
    role: 'super_admin' as const,
    name: 'Super Admin'
  },
  'admin@ssim.com': {
    id: '2',
    email: 'admin@ssim.com',
    password: 'admin123',
    role: 'admin' as const,
    name: 'Admin User'
  },
  'student@ssim.com': {
    id: '3',
    email: 'student@ssim.com',
    password: 'student123',
    role: 'student' as const,
    name: 'John Doe'
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check localStorage for saved session
    const savedUser = localStorage.getItem('ssim_user')
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser)
        setUser(parsedUser)
      } catch (error) {
        console.error('Failed to parse user from localStorage', error)
        localStorage.removeItem('ssim_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (email: string, password: string): Promise<boolean> => {
    setLoading(true)
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500))
    
    const mockUser = MOCK_USERS[email as keyof typeof MOCK_USERS]
    
    if (mockUser && mockUser.password === password) {
      const { password, ...userWithoutPassword } = mockUser
      setUser(userWithoutPassword)
      localStorage.setItem('ssim_user', JSON.stringify(userWithoutPassword))
      setLoading(false)
      return true
    }
    
    setLoading(false)
    return false
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('ssim_user')
    // Force a hard reload to clear any state
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      logout,
      isSuperAdmin: user?.role === 'super_admin',
      isAdmin: user?.role === 'admin',
      isStudent: user?.role === 'student'
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}