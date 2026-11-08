import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input, Textarea } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import {
  approveOrder,
  getOrderAdmin,
  listEventsAdmin,
  rejectOrder,
  saveOrderNotes,
} from '@/data/orders'
import { getProductAdmin } from '@/data/products'
import { ApprovalBlockedError, OrderStateError } from '@/data/errors'
import { formatPaise, paiseToInput, parseRupeesToPaise } from '@/domain/money'
import { checkLineForApproval, validateApproval } from '@/domain/order'
import { contactStatusLabel } from '@/domain/status'
import { suggestShippingPaise } from '@/domain/settings'
import { useSettings } from '@/features/settings/SettingsProvider'
import { LoadError, LoadingBlock } from '@/features/admin/AdminParts'
import { MessageCard } from '@/features/orders/MessageCard'
import { FulfilmentPanel } from '@/features/orders/FulfilmentPanel'
import { useAuth } from '@/features/auth/AuthProvider'
import {
  AddressBlock,
  OrderItemsList,
  OrderStatusBadge,
  PaymentBadge,
  Timeline,
  formatDateTime,
} from '@/features/orders/OrderParts'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

type Message = { tone: 'success' | 'error'; text: string }

export function AdminOrderDetailPage() {
  const { id = '' } = useParams()
  const { user } = useAuth()
  const actorUid = user?.uid ?? ''
  const order = useAsync(() => getOrderAdmin(id), [id])
  const events = useAsync(() => listEventsAdmin(id), [id])
  usePageTitle(order.data ? `Order ${order.data.orderNumber}` : 'Order')

  const data = order.data
  const productIds = useMemo(
    () => (data ? Array.from(new Set(data.items.map((item) => item.productId))) : []),
    [data],
  )
  const live = useAsync(
    async () => {
      const entries = await Promise.all(
        productIds.map(async (productId) => [productId, await getProductAdmin(productId)] as const),
      )
      return new Map(entries)
    },
    [productIds.join(',')],
  )

  const [shipping, setShipping] = useState('')
  const [finalTotal, setFinalTotal] = useState('')
  const [totalTouched, setTotalTouched] = useState(false)
  const [reason, setReason] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [adminNote, setAdminNote] = useState('')
  const [errors, setErrors] = useState<{ shipping?: string; total?: string; reason?: string }>({})
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<Message | null>(null)
  const [blocked, setBlocked] = useState<string[]>([])
  const [rejecting, setRejecting] = useState(false)
  const [rejectNote, setRejectNote] = useState('')
  const [rejectError, setRejectError] = useState('')

  useEffect(() => {
    if (!data) return
    setCustomerNote(data.customerVisibleNote)
    setAdminNote(data.adminNote)
  }, [data])

  const checks = useMemo(() => {
    if (!data || !live.data) return []
    return data.items.map((item) => {
      const product = live.data?.get(item.productId) ?? null
      return checkLineForApproval(
        item,
        product
          ? {
              status: product.status,
              hasVariants: product.hasVariants,
              pricePaise: product.pricePaise,
              stockQuantity: product.stockQuantity,
              variants: product.variants,
            }
          : null,
      )
    })
  }, [data, live.data])

  const liveSubtotal = useMemo(() => {
    if (!data || checks.length === 0) return null
    if (checks.some((check) => check.livePaise === null)) return null
    return data.items.reduce((sum, item, index) => sum + (checks[index].livePaise ?? 0) * item.quantity, 0)
  }, [data, checks])

  const shippingPaise = shipping.trim() === '' ? null : parseRupeesToPaise(shipping)
  const baseSubtotal = liveSubtotal ?? data?.subtotalPaise ?? 0

  const { settings } = useSettings()
  const shippingPrefilled = useRef(false)
  useEffect(() => {
    if (!data || shippingPrefilled.current || data.orderStatus !== 'pending_review') return
    if (checks.length === 0) return
    const suggestion = suggestShippingPaise(settings, baseSubtotal)
    if (suggestion !== null) {
      shippingPrefilled.current = true
      setShipping(paiseToInput(suggestion))
    }
  }, [data, settings, checks.length, baseSubtotal])

  useEffect(() => {
    if (totalTouched) return
    setFinalTotal(shippingPaise === null ? '' : paiseToInput(baseSubtotal + shippingPaise))
  }, [shippingPaise, baseSubtotal, totalTouched])

  if (order.loading) return <LoadingBlock label="Loading order" />
  if (order.error) return <LoadError what="the order" onRetry={order.reload} />
  if (!data) {
    return (
      <div>
        <p className="text-char-soft">That order does not exist.</p>
        <Link to="/admin/orders" className="mt-3 inline-block font-semibold underline underline-offset-4">
          Back to orders
        </Link>
      </div>
    )
  }

  const pending = data.orderStatus === 'pending_review'
  const lineIssues = checks.some((check) => check.issue !== null)
  const priceDiffers = checks.some((check, index) => check.livePaise !== null && check.livePaise !== data.items[index].unitPaise)

  async function onApprove() {
    if (!data) return
    const finalPaise = finalTotal.trim() === '' ? null : parseRupeesToPaise(finalTotal)
    const found = validateApproval({
      shippingPaise: shipping.trim() !== '' && shippingPaise === null ? null : shippingPaise,
      finalTotalPaise: finalPaise,
      subtotalPaise: data.subtotalPaise,
      reason,
    })
    if (shipping.trim() !== '' && shippingPaise === null) found.shipping = 'Enter a valid amount in rupees.'
    if (finalTotal.trim() !== '' && finalPaise === null) found.total = 'Enter a valid amount in rupees.'
    setErrors(found)
    if (Object.keys(found).length > 0 || shippingPaise === null || finalPaise === null) return

    setBusy(true)
    setMessage(null)
    setBlocked([])
    try {
      await approveOrder(data, {
        shippingPaise,
        finalTotalPaise: finalPaise,
        reason,
        customerVisibleNote: customerNote,
        actorUid,
      })
      setMessage({ tone: 'success', text: 'Order approved and stock updated.' })
      order.reload()
      events.reload()
      live.reload()
    } catch (error) {
      if (error instanceof ApprovalBlockedError) setBlocked(error.issues)
      else if (error instanceof OrderStateError) setMessage({ tone: 'error', text: error.message })
      else setMessage({ tone: 'error', text: 'We could not approve the order. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function onReject() {
    if (!data) return
    if (!rejectNote.trim()) {
      setRejectError('Write a short note the customer will see.')
      return
    }
    setBusy(true)
    try {
      await rejectOrder(data, { customerVisibleNote: rejectNote, internalNote: adminNote, actorUid })
      setRejecting(false)
      setMessage({ tone: 'success', text: 'Order request rejected.' })
      order.reload()
      events.reload()
    } catch (error) {
      setRejecting(false)
      setMessage({
        tone: 'error',
        text: error instanceof OrderStateError ? error.message : 'We could not reject the order. Please try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  async function onSaveNotes() {
    if (!data) return
    setBusy(true)
    setMessage(null)
    try {
      await saveOrderNotes(data, { adminNote, customerVisibleNote: customerNote, actorUid })
      setMessage({ tone: 'success', text: 'Notes saved.' })
      order.reload()
      events.reload()
    } catch {
      setMessage({ tone: 'error', text: 'We could not save the notes. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  return (
    <div>
      <Link to="/admin/orders" className="text-sm font-semibold underline underline-offset-4">
        All orders
      </Link>
      <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="eyebrow">Order</p>
          <h1 className="display-lg mt-2">{data.orderNumber}</h1>
          <p className="mt-2 text-sm text-char-soft">Placed {formatDateTime(data.createdAtMs)}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <OrderStatusBadge status={data.orderStatus} />
          <PaymentBadge status={data.paymentStatus} />
        </div>
      </div>

      {message ? (
        <div className="mt-6">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      <div className="mt-8 grid gap-6 xl:grid-cols-2">
        <section className="rounded-[1.25rem] border-2 border-char bg-white p-5">
          <h2 className="display-md mb-3">Items</h2>
          <OrderItemsList items={data.items} />
          {pending ? (
            <div className="mt-4 space-y-2 text-sm">
              {live.loading ? <p className="text-char-soft">Checking live prices and stock</p> : null}
              {checks.map((check, index) =>
                check.issue ? (
                  <p key={index} className="font-semibold text-orange-ink">
                    {data.items[index].name}: {check.issue}
                  </p>
                ) : null,
              )}
              {priceDiffers ? (
                <p className="font-semibold text-orange-ink">
                  Some prices in the catalogue differ from what the customer was shown. Live items total:{' '}
                  {liveSubtotal !== null ? formatPaise(liveSubtotal) : 'not available'}.
                </p>
              ) : null}
              {!live.loading && !lineIssues && !priceDiffers && checks.length > 0 ? (
                <p className="text-char-soft">Prices and stock match the catalogue.</p>
              ) : null}
            </div>
          ) : null}
          <dl className="mt-4 space-y-1 text-sm">
            <div className="flex justify-between">
              <dt>Items total (customer)</dt>
              <dd className="font-bold">{formatPaise(data.subtotalPaise)}</dd>
            </div>
            {data.shippingPaise !== null ? (
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd className="font-bold">{formatPaise(data.shippingPaise)}</dd>
              </div>
            ) : null}
            {data.finalTotalPaise !== null ? (
              <div className="flex justify-between font-display text-lg font-extrabold">
                <dt>Final total</dt>
                <dd>{formatPaise(data.finalTotalPaise)}</dd>
              </div>
            ) : null}
            {data.courierName ? (
              <p className="text-char-soft">
                Courier: {data.courierName}
                {data.trackingReference ? ` · ${data.trackingReference}` : ''}
              </p>
            ) : null}
            {data.cancelReason ? <p className="text-char-soft">Cancelled: {data.cancelReason}</p> : null}
            {data.totalChangeReason ? (
              <p className="text-char-soft">Reason for different total: {data.totalChangeReason}</p>
            ) : null}
          </dl>
        </section>

        <section className="rounded-[1.25rem] border-2 border-char bg-white p-5">
          <h2 className="display-md mb-3">Customer</h2>
          <p className="text-sm">
            <span className="font-bold">{data.customerName}</span>
            <br />
            <a href={`mailto:${data.customerEmail}`} className="underline underline-offset-4">
              {data.customerEmail}
            </a>
            <br />
            <a href={`tel:${data.customerPhone}`} className="underline underline-offset-4">
              {data.customerPhone}
            </a>
            {data.customerInstagram ? (
              <>
                <br />
                <a
                  href={`https://instagram.com/${data.customerInstagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline underline-offset-4"
                >
                  @{data.customerInstagram}
                </a>
              </>
            ) : null}
          </p>
          <h3 className="mt-5 font-display text-lg font-bold">Shipping address</h3>
          <div className="mt-1">
            <AddressBlock address={data.shippingAddress} />
          </div>
          {data.note ? (
            <p className="mt-4 text-sm">
              <span className="font-bold">Customer note: </span>
              <span className="text-char-soft">{data.note}</span>
            </p>
          ) : null}
          <p className="mt-4 text-sm text-char-soft">Contact status: {contactStatusLabel[data.contactStatus]}</p>
        </section>
      </div>

      {pending ? (
        <section className="mt-6 rounded-[1.25rem] border-2 border-char bg-white p-5 sm:p-6">
          <h2 className="display-md mb-2">Review this request</h2>
          <p className="mb-5 max-w-2xl text-sm text-char-soft">
            Approving checks stock again, takes the items out of stock, and marks the order as awaiting
            payment. Payment details are sent to the customer by you, outside this website.
          </p>

          {blocked.length > 0 ? (
            <div className="mb-5">
              <Notice tone="error">Cannot approve yet: {blocked.join(' ')}</Notice>
            </div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Shipping charge (₹)"
              inputMode="decimal"
              hint={settings.shippingMode === 'manual' ? 'Use 0 for free shipping.' : 'Filled from your shipping settings. You can change it.'}
              value={shipping}
              error={errors.shipping}
              onChange={(event) => setShipping(event.target.value)}
            />
            <Input
              label="Final total (₹)"
              inputMode="decimal"
              hint={`Items ${formatPaise(liveSubtotal ?? data.subtotalPaise)} plus shipping, unless you change it.`}
              value={finalTotal}
              error={errors.total}
              onChange={(event) => {
                setTotalTouched(true)
                setFinalTotal(event.target.value)
              }}
            />
          </div>
          <div className="mt-4">
            <Textarea
              label="Reason if the final total differs from items plus shipping"
              rows={2}
              maxLength={500}
              value={reason}
              error={errors.reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Textarea
              label="Note for the customer (optional)"
              hint="Shown on their order page."
              rows={3}
              maxLength={1000}
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
            />
            <Textarea
              label="Internal note (optional)"
              hint="Only you can see this."
              rows={3}
              maxLength={2000}
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
            />
          </div>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button onClick={onApprove} loading={busy} disabled={live.loading || lineIssues}>
              Approve order
            </Button>
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => {
                setRejectNote('')
                setRejectError('')
                setRejecting(true)
              }}
            >
              Reject request
            </Button>
          </div>
          {lineIssues ? (
            <p className="mt-3 text-sm font-semibold text-orange-ink">
              Fix the item problems above (for example, adjust stock in Inventory) or reject the request.
            </p>
          ) : null}
        </section>
      ) : (
        <>
        <div className="mt-6">
          <FulfilmentPanel
            order={data}
            actorUid={actorUid}
            onDone={(result) => {
              setMessage(result)
              order.reload()
              events.reload()
              live.reload()
            }}
          />
        </div>
        <section className="mt-6 rounded-[1.25rem] border-2 border-char bg-white p-5 sm:p-6">
          <h2 className="display-md mb-4">Notes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Textarea
              label="Note for the customer"
              hint="Shown on their order page."
              rows={3}
              maxLength={1000}
              value={customerNote}
              onChange={(event) => setCustomerNote(event.target.value)}
            />
            <Textarea
              label="Internal note"
              hint="Only you can see this."
              rows={3}
              maxLength={2000}
              value={adminNote}
              onChange={(event) => setAdminNote(event.target.value)}
            />
          </div>
          <div className="mt-4">
            <Button onClick={onSaveNotes} loading={busy}>
              Save notes
            </Button>
          </div>
        </section>
        </>
      )}

      <section className="mt-6 rounded-[1.25rem] border-2 border-char bg-white p-5 sm:p-6">
        <h2 className="display-md mb-4">History</h2>
        <Timeline order={data} events={events.data ?? []} showInternal />
      </section>

      <MessageCard order={data} />

      <ConfirmDialog
        open={rejecting}
        title="Reject this request?"
        confirmLabel="Reject request"
        danger
        busy={busy}
        onConfirm={onReject}
        onCancel={() => setRejecting(false)}
      >
        <p>The customer will see your note. Stock is not changed.</p>
        <Textarea
          label="Note for the customer"
          rows={3}
          maxLength={1000}
          value={rejectNote}
          error={rejectError}
          onChange={(event) => setRejectNote(event.target.value)}
        />
      </ConfirmDialog>
    </div>
  )
}
