import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useAuth } from './useAuth'

interface RolePermissions {
  canViewAllStudents: boolean
  canEditStudents: boolean
  canDeleteStudents: boolean
  canAddStudents: boolean
  canVerifyDocuments: boolean
  canManageAdmins: boolean
  canViewAnalytics: boolean
  canEditOwnProfile: boolean
}

export function useRole() {
  const { role, user } = useAuth()
  const [permissions, setPermissions] = useState<RolePermissions>({
    canViewAllStudents: false,
    canEditStudents: false,
    canDeleteStudents: false,
    canAddStudents: false,
    canVerifyDocuments: false,
    canManageAdmins: false,
    canViewAnalytics: false,
    canEditOwnProfile: false
  })

  useEffect(() => {
    switch (role) {
      case 'super_admin':
        setPermissions({
          canViewAllStudents: true,
          canEditStudents: true,
          canDeleteStudents: true,
          canAddStudents: true,
          canVerifyDocuments: true,
          canManageAdmins: true,
          canViewAnalytics: true,
          canEditOwnProfile: true
        })
        break
      case 'admin':
        setPermissions({
          canViewAllStudents: true,
          canEditStudents: true,
          canDeleteStudents: false,
          canAddStudents: true,
          canVerifyDocuments: true,
          canManageAdmins: false,
          canViewAnalytics: false,
          canEditOwnProfile: true
        })
        break
      case 'student':
        setPermissions({
          canViewAllStudents: false,
          canEditStudents: false,
          canDeleteStudents: false,
          canAddStudents: false,
          canVerifyDocuments: false,
          canManageAdmins: false,
          canViewAnalytics: false,
          canEditOwnProfile: true
        })
        break
      default:
        setPermissions({
          canViewAllStudents: false,
          canEditStudents: false,
          canDeleteStudents: false,
          canAddStudents: false,
          canVerifyDocuments: false,
          canManageAdmins: false,
          canViewAnalytics: false,
          canEditOwnProfile: false
        })
    }
  }, [role])

  return { role, permissions }
}