import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, LinkButton } from '@/components/ui/Button'
import { Notice } from '@/components/ui/Notice'
import { Input, Textarea } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Select } from '@/components/ui/Select'
import { StoreMessage } from '@/components/product/StoreMessage'
import { listAddresses } from '@/data/addresses'
import { createOrder } from '@/data/orders'
import { notifyNewOrder } from '@/data/notify'
import { getPublishedProductsByIds } from '@/data/products'
import { resolveLines } from '@/domain/cart'
import { checkCartForOrder, generateOrderId, itemsFromResolved, itemsSubtotal } from '@/domain/order'
import { getProfile } from '@/data/users'
import {
  INSTAGRAM_ERROR,
  NOTE_MAX,
  normalizeInstagram,
  emptyAddressInput,
  validateAddress,
  type Address,
  type AddressErrors,
  type AddressInput,
} from '@/domain/address'
import { AddressFields } from '@/features/account/AddressFields'
import { useAuth } from '@/features/auth/AuthProvider'
import { useCart } from '@/features/cart/CartProvider'
import { SummaryLines, Totals } from '@/features/cart/OrderSummary'
import { useResolvedCart } from '@/features/cart/useResolvedCart'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

const NEW_ADDRESS = 'new'

function fromAddress(address: Address): AddressInput {
  return {
    fullName: address.fullName,
    phone: address.phone,
    line1: address.line1,
    line2: address.line2,
    landmark: address.landmark,
    city: address.city,
    state: address.state,
    pinCode: address.pinCode,
    isDefault: false,
  }
}

export function CheckoutPage() {
  usePageTitle('Checkout')
  const { user } = useAuth()
  const cart = useCart()
  const uid = user?.uid ?? ''
  const { loading, error, reload, resolved, subtotal, savings, payable } = useResolvedCart()
  const saved = useAsync(() => listAddresses(uid), [uid])
  const [choice, setChoice] = useState(NEW_ADDRESS)
  const [form, setForm] = useState<AddressInput>(() => ({
    ...emptyAddressInput(),
    fullName: user?.displayName ?? '',
  }))
  const [note, setNote] = useState('')
  const [instagram, setInstagram] = useState('')
  const [instagramError, setInstagramError] = useState('')
  const instagramTouched = useRef(false)
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<AddressErrors>({})
  const [consentError, setConsentError] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [blockers, setBlockers] = useState<string[]>([])
  const [submitError, setSubmitError] = useState(false)
  const orderIdRef = useRef(generateOrderId())
  const navigate = useNavigate()
  const [prefilled, setPrefilled] = useState(false)

  useEffect(() => {
    getProfile(uid)
      .then((profile) => {
        if (profile?.instagram && !instagramTouched.current) setInstagram(profile.instagram)
      })
      .catch(() => undefined)
  }, [uid])

  useEffect(() => {
    if (prefilled || !saved.data) return
    setPrefilled(true)
    const preferred = saved.data.find((item) => item.isDefault) ?? saved.data[0]
    if (preferred) {
      setChoice(preferred.id)
      setForm(fromAddress(preferred))
    }
  }, [saved.data, prefilled])

  function onChoose(value: string) {
    setChoice(value)
    setErrors({})
    if (value === NEW_ADDRESS) {
      setForm({ ...emptyAddressInput(), fullName: user?.displayName ?? '' })
      return
    }
    const address = saved.data?.find((item) => item.id === value)
    if (address) setForm(fromAddress(address))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    if (submitting) return
    const found = validateAddress(form)
    setErrors(found)
    setConsentError(!consent)
    setSubmitError(false)
    setBlockers([])
    const handle = normalizeInstagram(instagram)
    setInstagramError(handle === null ? INSTAGRAM_ERROR : handle === '' ? 'Enter your Instagram username.' : '')
    if (Object.keys(found).length > 0 || !consent || !handle) return

    setSubmitting(true)
    try {
      const ids = Array.from(new Set(cart.lines.map((line) => line.productId)))
      const products = await getPublishedProductsByIds(ids)
      const fresh = resolveLines(cart.lines, products)
      const check = checkCartForOrder(fresh)
      if (!check.ok) {
        setBlockers(check.reasons)
        reload()
        return
      }
      const orderItems = itemsFromResolved(fresh)
      await createOrder({
        orderId: orderIdRef.current,
        uid,
        email: user?.email ?? '',
        address: form,
        note,
        instagram: handle,
        items: orderItems,
      })
      void notifyNewOrder({
        orderNumber: orderIdRef.current,
        customerName: form.fullName.trim(),
        customerEmail: user?.email ?? '',
        customerPhone: form.phone,
        customerInstagram: handle,
        city: form.city.trim(),
        state: form.state,
        items: orderItems,
        subtotalPaise: itemsSubtotal(orderItems),
        origin: window.location.origin,
      })
      cart.clear()
      navigate(`/order-confirmation/${orderIdRef.current}`)
    } catch {
      setSubmitError(true)
    } finally {
      setSubmitting(false)
    }
  }

  if (cart.lines.length === 0) {
    return (
      <section className="container-page py-14">
        <h1 className="display-lg mb-8">Checkout</h1>
        <StoreMessage
          title="Your cart is empty"
          body="Add something to your cart before checking out."
          action={<LinkButton to="/shop">Browse all slimes</LinkButton>}
        />
      </section>
    )
  }

  if (error) {
    return (
      <section className="container-page py-14">
        <h1 className="display-lg mb-8">Checkout</h1>
        <StoreMessage
          title="We could not check your cart"
          body="Please check your connection and try again."
          action={<Button onClick={reload}>Try again</Button>}
        />
      </section>
    )
  }

  const unavailable = resolved.filter((item) => item.status === 'unavailable')

  return (
    <section className="container-page py-10 sm:py-14">
      <h1 className="display-lg mb-2">Checkout</h1>
      <p className="mb-8 max-w-2xl text-char-soft">
        You are sending us an order request. We review it, then contact you with payment details.
        You do not pay on this page.
      </p>

      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:gap-12">
        <form onSubmit={onSubmit} noValidate className="space-y-8">
          <div className="rounded-[1.25rem] border-2 border-char bg-white p-5 sm:p-6">
            <h2 className="display-md mb-5">Contact and shipping</h2>
            <div className="space-y-4">
              {saved.data && saved.data.length > 0 ? (
                <Select
                  label="Use a saved address"
                  value={choice}
                  onChange={(event) => onChoose(event.target.value)}
                >
                  {saved.data.map((address) => (
                    <option key={address.id} value={address.id}>
                      {address.fullName}, {address.line1}, {address.city}
                    </option>
                  ))}
                  <option value={NEW_ADDRESS}>Enter a different address</option>
                </Select>
              ) : null}
              <AddressFields
                value={form}
                errors={errors}
                onChange={setForm}
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="checkout-email" className="text-sm font-bold">
                    Email
                  </label>
                  <input
                    id="checkout-email"
                    value={user?.email ?? ''}
                    readOnly
                    className="min-h-12 w-full rounded-xl border-2 border-char bg-white px-4"
                  />
                  <p className="text-sm text-char-soft">We use this email to reach you about the order.</p>
                </div>
              </div>
              <Input
                label="Instagram username"
                hint="Required. We message you there about your order, for example slimewali.official"
                autoComplete="off"
                value={instagram}
                error={instagramError}
                onChange={(event) => {
                  instagramTouched.current = true
                  setInstagram(event.target.value)
                }}
              />
              <Textarea
                label="Note for us (optional)"
                value={note}
                maxLength={NOTE_MAX}
                hint={`${note.length} of ${NOTE_MAX} characters`}
                onChange={(event) => setNote(event.target.value)}
              />
            </div>
          </div>

          <div className="rounded-[1.25rem] border-2 border-char bg-white p-5 sm:p-6">
            <h2 className="display-md mb-3">How payment works</h2>
            <p className="text-sm text-char-soft">
              After you send this request we check it and confirm shipping. Only if we approve it do
              we send you payment details by message. Orders are prepaid, Cash on Delivery is not
              available, and we confirm serviceability for your PIN code.
            </p>
            <div className="mt-5">
              <Toggle
                label="I agree to the terms"
                hint="I have read the Terms, the Privacy policy and the Shipping and returns policy."
                checked={consent}
                aria-invalid={consentError && !consent ? true : undefined}
                onChange={(event) => {
                  setConsent(event.target.checked)
                  setConsentError(false)
                }}
              />
              <p className="mt-2 text-sm">
                <Link to="/terms" className="underline underline-offset-4">Terms</Link>
                {' · '}
                <Link to="/privacy" className="underline underline-offset-4">Privacy</Link>
                {' · '}
                <Link to="/shipping" className="underline underline-offset-4">Shipping</Link>
                {' · '}
                <Link to="/returns" className="underline underline-offset-4">Returns</Link>
              </p>
              {consentError && !consent ? (
                <p className="mt-2 text-sm font-semibold text-orange-ink">
                  Please agree to continue.
                </p>
              ) : null}
            </div>
          </div>

          {unavailable.length > 0 ? (
            <Notice
              tone="error"
              action={
                <Link to="/cart" className="underline underline-offset-4">
                  Fix in cart
                </Link>
              }
            >
              Some items in your cart are unavailable.
            </Notice>
          ) : null}

          {blockers.length > 0 ? (
            <Notice
              tone="error"
              action={
                <Link to="/cart" className="underline underline-offset-4">
                  Review cart
                </Link>
              }
            >
              {blockers.join(' ')}
            </Notice>
          ) : null}

          {submitError ? (
            <Notice tone="error">
              We could not send your order request. Nothing was charged. Please check your connection
              and try again.
            </Notice>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button type="submit" size="lg" loading={submitting} disabled={loading || payable.length === 0}>
              Submit order request
            </Button>
            <LinkButton to="/cart" variant="ghost" size="lg">
              Back to cart
            </LinkButton>
          </div>
        </form>

        <aside className="h-fit rounded-[1.25rem] border-2 border-char bg-white p-5 shadow-pop lg:sticky lg:top-24">
          <h2 className="display-md mb-3">Your order</h2>
          {loading ? (
            <div className="h-40 animate-pulse rounded-xl bg-char/10" role="status">
              <span className="sr-only">Checking prices and stock</span>
            </div>
          ) : (
            <>
              <SummaryLines lines={payable} />
              <div className="mt-4">
                <Totals subtotalPaise={subtotal} savingsPaise={savings} />
              </div>
            </>
          )}
        </aside>
      </div>
    </section>
  )
}
