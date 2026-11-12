import { brand } from '@/config/brand'
import { useEffect, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import { getSettings, saveSettings } from '@/data/settings'
import { paiseToInput, parseRupeesToPaise } from '@/domain/money'
import {
  DEFAULT_SETTINGS,
  validateSettings,
  type SettingsErrors,
  type ShippingMode,
  type StoreSettings,
} from '@/domain/settings'
import { LoadError, LoadingBlock, PageHeader } from '@/features/admin/AdminParts'
import { useAuth } from '@/features/auth/AuthProvider'
import { useSettings } from '@/features/settings/SettingsProvider'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-[1.25rem] border-2 border-char bg-white p-5 sm:p-6">
      <h2 className="display-md">{title}</h2>
      {hint ? <p className="mt-1 max-w-2xl text-sm text-char-soft">{hint}</p> : null}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  )
}

export function AdminSettingsPage() {
  usePageTitle('Settings · Admin')
  const { user } = useAuth()
  const { refresh } = useSettings()
  const loaded = useAsync(getSettings, [])
  const [form, setForm] = useState<StoreSettings>(DEFAULT_SETTINGS)
  const [flat, setFlat] = useState('')
  const [threshold, setThreshold] = useState('')
  const [amountErrors, setAmountErrors] = useState<{ flat?: string; threshold?: string }>({})
  const [errors, setErrors] = useState<SettingsErrors>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (loaded.data) {
      setForm(loaded.data)
      setFlat(paiseToInput(loaded.data.flatShippingPaise))
      setThreshold(loaded.data.freeShippingThresholdPaise ? paiseToInput(loaded.data.freeShippingThresholdPaise) : '')
    }
  }, [loaded.data])

  function set<K extends keyof StoreSettings>(key: K, value: StoreSettings[K]) {
    setForm((current) => ({ ...current, [key]: value }))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const flatPaise = flat.trim() === '' ? 0 : parseRupeesToPaise(flat)
    const thresholdPaise = threshold.trim() === '' ? 0 : parseRupeesToPaise(threshold)
    const amounts: { flat?: string; threshold?: string } = {}
    if (flatPaise === null) amounts.flat = 'Enter a valid amount in rupees.'
    if (thresholdPaise === null) amounts.threshold = 'Enter a valid amount in rupees.'
    setAmountErrors(amounts)
    const next = { ...form, flatShippingPaise: flatPaise ?? 0, freeShippingThresholdPaise: thresholdPaise ?? 0 }
    const found = validateSettings(next)
    setErrors(found)
    if (Object.keys(amounts).length > 0 || Object.keys(found).length > 0) {
      setMessage({ tone: 'error', text: 'Please fix the highlighted fields.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await saveSettings(next, user?.uid ?? '')
      await refresh()
      setMessage({ tone: 'success', text: 'Settings saved. The shop now shows these changes.' })
    } catch {
      setMessage({ tone: 'error', text: 'We could not save the settings. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loaded.loading) return <LoadingBlock label="Loading settings" />
  if (loaded.error) return <LoadError what="the settings" onRetry={loaded.reload} />

  return (
    <div>
      <PageHeader
        title="Settings"
        subtitle="Shop name, contact details, shipping and the text on the home page. Everything here is public."
      />
      <form onSubmit={onSubmit} noValidate className="space-y-6">
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}

        <Section title="Shop" hint="The strip at the top of every page.">
          <Input label="Shop name" value={form.storeName} error={errors.storeName} maxLength={60} onChange={(e) => set('storeName', e.target.value)} />
          <div className="sm:col-span-2">
            <Toggle label="Show the announcement strip" checked={form.announcementActive} onChange={(e) => set('announcementActive', e.target.checked)} />
          </div>
          <div className="sm:col-span-2">
            <Input label="Announcement text" value={form.announcementText} error={errors.announcementText} maxLength={160} onChange={(e) => set('announcementText', e.target.value)} />
          </div>
        </Section>

        <Section title="Sale banner" hint="A bright banner at the top of every page and on the home page. Product discounts themselves come from the original price you set on each product or variant.">
          <div className="sm:col-span-2">
            <Toggle label="Show the sale banner" checked={form.saleActive} onChange={(e) => set('saleActive', e.target.checked)} />
          </div>
          <Input label="Sale title" hint="For example, Diwali sale, up to 30% off" value={form.saleTitle} error={errors.saleTitle} maxLength={60} onChange={(e) => set('saleTitle', e.target.value)} />
          <Input label="Last day of the sale (optional)" type="date" hint="The banner hides itself after this day." value={form.saleEndsOn} error={errors.saleEndsOn} onChange={(e) => set('saleEndsOn', e.target.value)} />
          <div className="sm:col-span-2">
            <Input label="Sale text (optional)" value={form.saleText} error={errors.saleText} maxLength={160} onChange={(e) => set('saleText', e.target.value)} />
          </div>
        </Section>

        <Section title="Contact" hint="Shown in the footer and on the Contact page. Leave a field empty to hide it. Do not put payment details here, this is public.">
          <Input label="Support email" type="email" value={form.supportEmail} error={errors.supportEmail} onChange={(e) => set('supportEmail', e.target.value)} />
          <Input label="Phone" type="tel" value={form.supportPhone} error={errors.supportPhone} maxLength={20} onChange={(e) => set('supportPhone', e.target.value)} />
          <Input label="WhatsApp number" type="tel" hint="10-digit Indian mobile number" value={form.whatsappNumber} error={errors.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} />
          <Input label="Shop Instagram" hint={`Username only, for example ${brand.instagramExample}`} value={form.instagramHandle} error={errors.instagramHandle} onChange={(e) => set('instagramHandle', e.target.value)} />
        </Section>

        <Section title="Shipping" hint="Shipping is always confirmed by you when you approve an order. These settings only decide what the shop says and what is pre-filled for you.">
          <div className="sm:col-span-2">
            <Select label="How shipping is charged" value={form.shippingMode} onChange={(e) => set('shippingMode', e.target.value as ShippingMode)}>
              <option value="manual">I decide for each order</option>
              <option value="flat">One flat rate</option>
              <option value="threshold">Flat rate, free above an order amount</option>
            </Select>
          </div>
          {form.shippingMode !== 'manual' ? (
            <Input label="Flat rate (₹)" inputMode="decimal" hint="Use 0 for free shipping" value={flat} error={amountErrors.flat ?? errors.flatShippingPaise} onChange={(e) => setFlat(e.target.value)} />
          ) : null}
          {form.shippingMode === 'threshold' ? (
            <Input label="Free shipping from (₹)" inputMode="decimal" value={threshold} error={amountErrors.threshold ?? errors.freeShippingThresholdPaise} onChange={(e) => setThreshold(e.target.value)} />
          ) : null}
          <div className="sm:col-span-2">
            <Textarea label="Shipping note (optional)" rows={3} hint="Shown with the totals in the cart and checkout, for example delivery time." value={form.shippingNote} error={errors.shippingNote} maxLength={300} onChange={(e) => set('shippingNote', e.target.value)} />
          </div>
        </Section>

        <Section title="Home page" hint="The words in the big banner, and the purple panel.">
          <div className="sm:col-span-2">
            <Input label="Small line above the headline" value={form.heroEyebrow} error={errors.heroEyebrow} maxLength={60} onChange={(e) => set('heroEyebrow', e.target.value)} />
          </div>
          <Input label="Headline word 1" value={form.heroLine1} error={errors.heroLine1} maxLength={20} onChange={(e) => set('heroLine1', e.target.value)} />
          <Input label="Headline word 2 (underlined)" value={form.heroLine2} error={errors.heroLine2} maxLength={20} onChange={(e) => set('heroLine2', e.target.value)} />
          <Input label="Headline word 3" value={form.heroLine3} error={errors.heroLine3} maxLength={20} onChange={(e) => set('heroLine3', e.target.value)} />
          <div className="sm:col-span-2">
            <Textarea label="Banner text" rows={3} value={form.heroSubheading} error={errors.heroSubheading} maxLength={240} onChange={(e) => set('heroSubheading', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Input label="Purple panel title" value={form.textureTitle} error={errors.textureTitle} maxLength={80} onChange={(e) => set('textureTitle', e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Textarea label="Purple panel text" rows={3} value={form.textureBody} error={errors.textureBody} maxLength={240} onChange={(e) => set('textureBody', e.target.value)} />
          </div>
        </Section>

        <Button type="submit" loading={saving}>
          Save settings
        </Button>
      </form>
    </div>
  )
}