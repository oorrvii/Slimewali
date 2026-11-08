import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from 'firebase/auth'
import { requireServices } from './firebase'
import { ensureUserProfile } from './users'
import type { SessionUser } from '@/domain/user'

function toSessionUser(user: User): SessionUser {
  return {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? '',
    photoURL: user.photoURL,
  }
}

export function subscribeToAuth(
  onChange: (user: SessionUser | null, isAdmin: boolean) => void,
): () => void {
  const { auth } = requireServices()

  return onAuthStateChanged(auth, async (firebaseUser) => {
    if (!firebaseUser) {
      onChange(null, false)
      return
    }

    const session = toSessionUser(firebaseUser)

    try {
      await ensureUserProfile(session)
    } catch {
      console.error('Could not create the user profile document')
    }

    try {
      const token = await firebaseUser.getIdTokenResult()
      onChange(session, token.claims.admin === true)
    } catch {
      onChange(session, false)
    }
  })
}

export class AuthFlowError extends Error {
  readonly silent: boolean

  constructor(message: string, silent = false) {
    super(message)
    this.silent = silent
  }
}

export async function signInWithGoogle(): Promise<void> {
  const { auth } = requireServices()
  const provider = new GoogleAuthProvider()
  provider.setCustomParameters({ prompt: 'select_account' })

  try {
    await signInWithPopup(auth, provider)
  } catch (error) {
    const code = (error as { code?: string }).code

    if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
      throw new AuthFlowError('Sign-in was cancelled.', true)
    }
    if (code === 'auth/popup-blocked') {
      await signInWithRedirect(auth, provider)
      return
    }
    if (code === 'auth/network-request-failed') {
      throw new AuthFlowError('Network problem. Check your connection and try again.')
    }
    if (code === 'auth/unauthorized-domain') {
      throw new AuthFlowError('This website address is not yet approved for sign-in.')
    }
    throw new AuthFlowError('We could not sign you in. Please try again.')
  }
}

export async function signOutUser(): Promise<void> {
  const { auth } = requireServices()
  await signOut(auth)
}

export async function refreshAdminClaim(): Promise<boolean> {
  const { auth } = requireServices()
  const current = auth.currentUser
  if (!current) return false
  const token = await current.getIdTokenResult(true)
  return token.claims.admin === true
}
