import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { User, Session } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  session: Session | null
  role: 'super_admin' | 'admin' | 'student' | null
  loading: boolean
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    loading: true
  })

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        fetchUserRole(session.user).then(role => {
          setState({
            user: session.user,
            session: session,
            role: role,
            loading: false
          })
        })
      } else {
        setState(prev => ({ ...prev, loading: false }))
      }
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (session) {
        const role = await fetchUserRole(session.user)
        setState({
          user: session.user,
          session: session,
          role: role,
          loading: false
        })
      } else {
        setState({
          user: null,
          session: null,
          role: null,
          loading: false
        })
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchUserRole = async (user: User): Promise<'super_admin' | 'admin' | 'student' | null> => {
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .single()
    
    if (error || !data) return null
    return data.role as 'super_admin' | 'admin' | 'student'
  }

  const signOut = async () => {
    await supabase.auth.signOut()
  }

  return {
    ...state,
    signOut,
    isAuthenticated: !!state.user,
    isSuperAdmin: state.role === 'super_admin',
    isAdmin: state.role === 'admin',
    isStudent: state.role === 'student'
  }
}