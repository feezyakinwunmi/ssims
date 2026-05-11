'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

interface SidebarProps {
  role: 'super_admin' | 'admin' | 'student'
  onLogout?: () => void
}

const menuItems = {
  super_admin: [
    { name: 'Dashboard', icon: '📊', href: '/super-admin' },
    { name: 'Students', icon: '👨‍🎓', href: '/super-admin/students' },
    { name: 'Add Student', icon: '➕', href: '/super-admin/students/add' },
    { name: 'Admins', icon: '👑', href: '/super-admin/admins' },
    { name: 'Analytics', icon: '📈', href: '/super-admin/analytics' },
    { name: 'Verifications', icon: '✓', href: '/super-admin/verifications' },
  ],
  admin: [
    { name: 'Dashboard', icon: '📊', href: '/admin' },
    { name: 'All Students', icon: '👨‍🎓', href: '/admin/students' },
    { name: 'Pending Verifications', icon: '⏳', href: '/admin/verifications' },
    { name: 'Incomplete Profiles', icon: '⚠️', href: '/admin/incomplete' },
  ],
  student: [
    { name: 'Dashboard', icon: '🏠', href: '/student' },
    { name: 'My Documents', icon: '📄', href: '/student/documents' },
    { name: 'Fee Receipts', icon: '💳', href: '/student/fee-receipts' },
    { name: 'Profile', icon: '👤', href: '/student/profile' },
  ]
}

export default function Sidebar({ role, onLogout }: SidebarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  const handleLogout = () => {
    if (role === 'student' && onLogout) {
      onLogout()
    } else {
      // For admin/superadmin, clear auth
      localStorage.removeItem('ssim_user')
      window.location.href = '/login'
    }
  }

  const toggleSidebar = () => setIsOpen(!isOpen)

  const SidebarContent = () => (
    <div className="h-full bg-gradient-to-b from-gray-900 to-black border-r border-gray-800 flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
          SSIM
        </h1>
        <p className="text-xs text-gray-500 mt-1">Secure Information Management</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems[role].map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              pathname === item.href
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30'
                : 'text-gray-400 hover:bg-gray-800 hover:text-white'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleLogout}
          className="flex items-center space-x-3 px-4 py-3 rounded-lg w-full text-gray-400 hover:bg-red-600/20 hover:text-red-400 transition"
        >
          <span className="text-xl">🚪</span>
          <span className="font-medium">Logout</span>
        </button>
      </div>
    </div>
  )

  return (
    <>
      <button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden bg-gray-800 p-2 rounded-lg"
      >
        <span className="text-2xl">☰</span>
      </button>

      <div className="hidden md:block fixed w-64 h-full">
        <SidebarContent />
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={toggleSidebar}
              className="fixed inset-0 bg-black/50 z-40 md:hidden"
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 w-64 h-full z-50 md:hidden"
            >
              <SidebarContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}