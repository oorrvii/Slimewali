import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { getProfile, updateProfile } from '@/data/users'
import { INSTAGRAM_ERROR, normalizeInstagram, normalizePhone } from '@/domain/address'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

export function AccountProfilePage() {
  usePageTitle('Profile')
  const { user } = useAuth()
  const uid = user?.uid ?? ''
  const profile = useAsync(() => getProfile(uid), [uid])
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [instagram, setInstagram] = useState('')
  const [errors, setErrors] = useState<{ name?: string; phone?: string; instagram?: string }>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (profile.data) {
      setName(profile.data.displayName)
      setPhone(profile.data.phone)
      setInstagram(profile.data.instagram)
    }
  }, [profile.data])

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const found: { name?: string; phone?: string; instagram?: string } = {}
    if (!name.trim()) found.name = 'Enter your name.'
    else if (name.trim().length > 100) found.name = 'Keep the name under 100 characters.'
    const normalized = phone.trim() ? normalizePhone(phone) : ''
    if (phone.trim() && !normalized) {
      found.phone = 'Enter a valid 10-digit Indian mobile number, with or without +91.'
    }
    const handle = normalizeInstagram(instagram)
    if (handle === null) found.instagram = INSTAGRAM_ERROR
    setErrors(found)
    if (Object.keys(found).length > 0) return
    setSaving(true)
    setMessage(null)
    try {
      await updateProfile(uid, { displayName: name.trim(), phone: normalized ?? '', instagram: handle ?? '' })
      setPhone(normalized ?? '')
      setInstagram(handle ?? '')
      setMessage({ tone: 'success', text: 'Profile saved.' })
    } catch {
      setMessage({ tone: 'error', text: 'We could not save your profile. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <p className="eyebrow">Profile</p>
      <h1 className="display-lg mt-2">Your profile</h1>

      {profile.loading ? (
        <div className="mt-8 h-64 max-w-xl animate-pulse rounded-[1.25rem] bg-char/10" role="status">
          <span className="sr-only">Loading profile</span>
        </div>
      ) : profile.error || !profile.data ? (
        <div className="mt-8 max-w-xl">
          <Notice
            tone="error"
            action={
              <button type="button" onClick={profile.reload} className="underline underline-offset-4">
                Try again
              </button>
            }
          >
            We could not load your profile.
          </Notice>
        </div>
      ) : (
        <form
          onSubmit={onSubmit}
          noValidate
          className="mt-8 max-w-xl space-y-5 rounded-[1.25rem] border-2 border-char bg-white p-5 sm:p-6"
        >
          {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
          <Input
            label="Name"
            autoComplete="name"
            value={name}
            error={errors.name}
            maxLength={100}
            onChange={(event) => setName(event.target.value)}
          />
          <Input
            label="Email"
            value={profile.data.email}
            readOnly
            hint="Your email comes from your Google account and cannot be changed here."
          />
          <Input
            label="Mobile number (optional)"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            hint="10 digits, with or without +91"
            value={phone}
            error={errors.phone}
            onChange={(event) => setPhone(event.target.value)}
          />
          <Input
            label="Instagram username"
            hint="So we can reach you there about your orders if needed."
            autoComplete="off"
            value={instagram}
            error={errors.instagram}
            onChange={(event) => setInstagram(event.target.value)}
          />
          <Button type="submit" loading={saving}>
            Save profile
          </Button>
        </form>
      )}
    </div>
  )
}
