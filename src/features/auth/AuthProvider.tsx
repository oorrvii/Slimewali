import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { firebaseConfigured } from '@/data/firebase'
import { AuthFlowError, signInWithGoogle, signOutUser, subscribeToAuth } from '@/data/auth'
import type { AuthStatus, SessionUser } from '@/domain/user'

type AuthValue = {
  status: AuthStatus
  user: SessionUser | null
  isAdmin: boolean
  error: string | null
  signIn: () => Promise<void>
  signOut: () => Promise<void>
  clearError: () => void
}

const AuthContext = createContext<AuthValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>(firebaseConfigured ? 'loading' : 'unconfigured')
  const [user, setUser] = useState<SessionUser | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!firebaseConfigured) return
    return subscribeToAuth((nextUser, admin) => {
      setUser(nextUser)
      setIsAdmin(admin)
      setStatus(nextUser ? 'signed_in' : 'signed_out')
    })
  }, [])

  const signIn = useCallback(async () => {
    setError(null)
    try {
      await signInWithGoogle()
    } catch (caught) {
      if (caught instanceof AuthFlowError) {
        if (!caught.silent) setError(caught.message)
        return
      }
      setError('We could not sign you in. Please try again.')
    }
  }, [])

  const signOut = useCallback(async () => {
    setError(null)
    try {
      await signOutUser()
    } catch {
      setError('We could not sign you out. Please try again.')
    }
  }, [])

  const clearError = useCallback(() => setError(null), [])

  const value = useMemo<AuthValue>(
    () => ({ status, user, isAdmin, error, signIn, signOut, clearError }),
    [status, user, isAdmin, error, signIn, signOut, clearError],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthValue {
  const value = useContext(AuthContext)
  if (!value) {
    throw new Error('useAuth must be used inside AuthProvider')
  }
  return value
}
