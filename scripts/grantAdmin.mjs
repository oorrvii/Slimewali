import { initializeApp, applicationDefault } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const args = process.argv.slice(2)
const email = args.find((arg) => !arg.startsWith('--'))
const revoke = args.includes('--revoke')
const projectFlag = args.find((arg) => arg.startsWith('--project='))
const projectId = projectFlag ? projectFlag.split('=')[1] : process.env.GCLOUD_PROJECT

if (!email || !projectId) {
  console.error('Usage: npm run grant-admin -- owner@example.com --project=your-project-id [--revoke]')
  process.exit(1)
}

const usingEmulator = Boolean(process.env.FIREBASE_AUTH_EMULATOR_HOST)

if (!usingEmulator && !process.env.GOOGLE_APPLICATION_CREDENTIALS) {
  console.error('Set GOOGLE_APPLICATION_CREDENTIALS to the path of your service account key file first.')
  process.exit(1)
}

initializeApp({
  projectId,
  ...(usingEmulator ? {} : { credential: applicationDefault() }),
})

const auth = getAuth()

try {
  const user = await auth.getUserByEmail(email)
  const existing = user.customClaims ?? {}
  const next = { ...existing }

  if (revoke) {
    delete next.admin
  } else {
    next.admin = true
  }

  await auth.setCustomUserClaims(user.uid, next)
  console.log(revoke ? 'Admin access removed.' : 'Admin access granted.')
  console.log('The person must sign out and sign in again for the change to take effect.')
} catch (error) {
  if (error?.code === 'auth/user-not-found') {
    console.error('No account with that email. Sign in to the website with Google once first, then run this again.')
  } else {
    console.error('Could not update the account.')
    console.error(error?.code, error?.message)
  }
  process.exit(1)
}
