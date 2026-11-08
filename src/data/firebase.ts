import { initializeApp, type FirebaseApp } from 'firebase/app'
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check'
import { getAuth, connectAuthEmulator, type Auth } from 'firebase/auth'
import { getFirestore, connectFirestoreEmulator, type Firestore } from 'firebase/firestore'

const env = import.meta.env

const config = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
}

export const usingEmulators = env.VITE_USE_EMULATORS === 'true'

export const firebaseConfigured = Object.values(config).every(
  (value) => typeof value === 'string' && value.length > 0,
)

type Services = {
  app: FirebaseApp
  auth: Auth
  db: Firestore
}

function createServices(): Services | null {
  if (!firebaseConfigured) return null

  const app = initializeApp(config)
  const appCheckKey = env.VITE_APPCHECK_SITE_KEY
  if (appCheckKey && !usingEmulators) {
    try {
      if (env.DEV) {
        const scope = self as unknown as { FIREBASE_APPCHECK_DEBUG_TOKEN?: boolean }
        scope.FIREBASE_APPCHECK_DEBUG_TOKEN = true
      }
      initializeAppCheck(app, { provider: new ReCaptchaV3Provider(appCheckKey), isTokenAutoRefreshEnabled: true })
    } catch {
      console.warn('App Check could not start. Check VITE_APPCHECK_SITE_KEY.')
    }
  }
  const auth = getAuth(app)
  const db = getFirestore(app)

  if (env.VITE_USE_EMULATORS === 'true') {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    connectFirestoreEmulator(db, '127.0.0.1', 8080)
  }

  return { app, auth, db }
}

const services = createServices()

export function requireServices(): Services {
  if (!services) {
    throw new Error('Firebase is not configured')
  }
  return services
}
