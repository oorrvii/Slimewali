export type SessionUser = {
  uid: string
  email: string
  displayName: string
  photoURL: string | null
}

export type AuthStatus = 'loading' | 'signed_out' | 'signed_in' | 'unconfigured'
