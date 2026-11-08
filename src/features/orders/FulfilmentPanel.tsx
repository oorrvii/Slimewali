import type { ReactNode } from 'react'
import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Input, Textarea } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Toggle } from '@/components/ui/Toggle'
import {
  cancelOrder,
  markDelivered,
  markDispatched,
  markPaymentInstructionsSent,
  markRefunded,
  recordContact,
  startProcessing,
  verifyPayment,
} from '@/data/orders'
import { OrderStateError } from '@/data/errors'
import { formatPaise } from '@/domain/money'
import { validateDispatch, type Order } from '@/domain/order'

type Props = {
  order: Order
  actorUid: string
  onDone: (result: { tone: 'success' | 'error'; text: string }) => void
}

const CANCELLABLE = ['approved_awaiting_payment', 'payment_verified', 'processing']

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-[1.25rem] border-2 border-char bg-white p-5 sm:p-6">
      <h2 className="display-md mb-4">{title}</h2>
      {children}
    </section>
  )
}

export function FulfilmentPanel({ order, actorUid, onDone }: Props) {
  const [busy, setBusy] = useState(false)
  const [method, setMethod] = useState('phone')
  const [outcome, setOutcome] = useState('')
  const [paymentChecked, setPaymentChecked] = useState(false)
  const [reference, setReference] = useState('')
  const [dispatch, setDispatch] = useState({ courierName: '', trackingReference: '', trackingUrl: '' })
  const [dispatchErrors, setDispatchErrors] = useState<{ courierName?: string; trackingUrl?: string }>({})
  const [delivering, setDelivering] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelError, setCancelError] = useState('')
  const [returnStock, setReturnStock] = useState(true)
  const [refunding, setRefunding] = useState(false)

  async function run(action: () => Promise<void>, success: string) {
    setBusy(true)
    try {
      await action()
      onDone({ tone: 'success', text: success })
    } catch (error) {
      onDone({
        tone: 'error',
        text: error instanceof OrderStateError ? error.message : 'That did not work. Please try again.',
      })
    } finally {
      setBusy(false)
    }
  }

  const status = order.orderStatus
  const total = formatPaise(order.finalTotalPaise ?? order.totalPaise)
  const canCancel = CANCELLABLE.includes(status)
  const canRefund = status === 'cancelled' && order.paymentStatus === 'paid'
  const hasStockToReturn = order.stockDeducted && !order.stockReturned

  return (
    <div className="space-y-6">
      {status === 'approved_awaiting_payment' ? (
        <>
          <Card title="Contact and payment instructions">
            <p className="mb-4 max-w-2xl text-sm text-char-soft">
              Contact the customer yourself and share your payment QR or details outside this website. Use these
              buttons to keep a record of what you did. Nothing is sent automatically.
            </p>
            <div className="grid gap-4 sm:grid-cols-[12rem_1fr]">
              <Select label="How you contacted them" value={method} onChange={(event) => setMethod(event.target.value)}>
                <option value="phone">Phone call</option>
                <option value="email">Email</option>
                <option value="message">Message</option>
                <option value="other">Other</option>
              </Select>
              <Input
                label="What happened (optional)"
                value={outcome}
                maxLength={300}
                onChange={(event) => setOutcome(event.target.value)}
              />
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Button
                variant="outline"
                loading={busy}
                onClick={() =>
                  run(async () => {
                    await recordContact(order, { method, outcome, actorUid })
                    setOutcome('')
                  }, 'Contact recorded.')
                }
              >
                Record contact
              </Button>
              <Button
                variant="outline"
                loading={busy}
                disabled={order.contactStatus === 'payment_instructions_sent'}
                onClick={() => run(() => markPaymentInstructionsSent(order, actorUid), 'Recorded that payment instructions were sent.')}
              >
                {order.contactStatus === 'payment_instructions_sent'
                  ? 'Payment instructions marked as sent'
                  : 'I have sent the payment instructions'}
              </Button>
            </div>
          </Card>

          <Card title="Verify payment">
            <p className="mb-4 max-w-2xl text-sm text-char-soft">
              Only verify after you have checked your real business payment account. A screenshot from the
              customer is not proof.
            </p>
            <Toggle
              label={`I checked my payment account and ${total} has arrived for this order`}
              checked={paymentChecked}
              onChange={(event) => setPaymentChecked(event.target.checked)}
            />
            <div className="mt-4 max-w-md">
              <Input
                label="Payment reference (optional, only you see it)"
                value={reference}
                maxLength={100}
                onChange={(event) => setReference(event.target.value)}
              />
            </div>
            <div className="mt-4">
              <Button
                loading={busy}
                disabled={!paymentChecked}
                onClick={() => run(() => verifyPayment(order, { reference, actorUid }), 'Payment verified.')}
              >
                Mark payment verified
              </Button>
            </div>
          </Card>
        </>
      ) : null}

      {status === 'payment_verified' ? (
        <Card title="Prepare the order">
          <p className="mb-4 text-sm text-char-soft">Payment is verified. Start preparing the slime.</p>
          <Button loading={busy} onClick={() => run(() => startProcessing(order, actorUid), 'Order moved to processing.')}>
            Start processing
          </Button>
        </Card>
      ) : null}

      {status === 'processing' ? (
        <Card title="Dispatch the order">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Courier"
              value={dispatch.courierName}
              error={dispatchErrors.courierName}
              maxLength={100}
              onChange={(event) => setDispatch({ ...dispatch, courierName: event.target.value })}
            />
            <Input
              label="Tracking number (optional)"
              value={dispatch.trackingReference}
              maxLength={100}
              onChange={(event) => setDispatch({ ...dispatch, trackingReference: event.target.value })}
            />
            <div className="sm:col-span-2">
              <Input
                label="Tracking link (optional)"
                inputMode="url"
                hint="A full link starting with https://"
                value={dispatch.trackingUrl}
                error={dispatchErrors.trackingUrl}
                maxLength={500}
                onChange={(event) => setDispatch({ ...dispatch, trackingUrl: event.target.value })}
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              loading={busy}
              onClick={() => {
                const found = validateDispatch(dispatch)
                setDispatchErrors(found)
                if (Object.keys(found).length > 0) return
                run(() => markDispatched(order, { ...dispatch, actorUid }), 'Order marked as dispatched.')
              }}
            >
              Mark dispatched
            </Button>
          </div>
        </Card>
      ) : null}

      {status === 'dispatched' ? (
        <Card title="Delivery">
          <p className="mb-4 text-sm text-char-soft">Mark as delivered only once you know it arrived.</p>
          <Button loading={busy} onClick={() => setDelivering(true)}>
            Mark delivered
          </Button>
        </Card>
      ) : null}

      {canCancel ? (
        <Card title="Cancel this order">
          <p className="mb-4 max-w-2xl text-sm text-char-soft">
            Cancelling needs a reason, and the customer will see it. If payment was already received, handle
            the refund yourself and then record it here.
          </p>
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => {
              setCancelReason('')
              setCancelError('')
              setReturnStock(true)
              setCancelling(true)
            }}
          >
            Cancel order
          </Button>
        </Card>
      ) : null}

      {canRefund ? (
        <Card title="Refund">
          <p className="mb-4 max-w-2xl text-sm text-char-soft">
            This order was paid for and then cancelled. After you have sent the refund yourself, record it.
          </p>
          <Button variant="outline" disabled={busy} onClick={() => setRefunding(true)}>
            Record refund as completed
          </Button>
        </Card>
      ) : null}

      <ConfirmDialog
        open={delivering}
        title="Mark as delivered?"
        confirmLabel="Mark delivered"
        busy={busy}
        onConfirm={async () => {
          await run(() => markDelivered(order, actorUid), 'Order marked as delivered.')
          setDelivering(false)
        }}
        onCancel={() => setDelivering(false)}
      >
        <p>The customer will see that their order was delivered.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={refunding}
        title="Record refund?"
        confirmLabel="Record refund"
        busy={busy}
        onConfirm={async () => {
          await run(() => markRefunded(order, actorUid), 'Refund recorded.')
          setRefunding(false)
        }}
        onCancel={() => setRefunding(false)}
      >
        <p>Only confirm if you have already sent the money back. The customer will see this.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={cancelling}
        title="Cancel this order?"
        confirmLabel="Cancel order"
        danger
        busy={busy}
        onConfirm={async () => {
          if (!cancelReason.trim()) {
            setCancelError('Write a short reason. The customer will see it.')
            return
          }
          await run(
            () => cancelOrder(order, { reason: cancelReason, returnStock, actorUid }),
            'Order cancelled.',
          )
          setCancelling(false)
        }}
        onCancel={() => setCancelling(false)}
      >
        <div className="space-y-4">
          <Textarea
            label="Reason (shown to the customer)"
            rows={3}
            maxLength={500}
            value={cancelReason}
            error={cancelError}
            onChange={(event) => setCancelReason(event.target.value)}
          />
          {hasStockToReturn ? (
            <Toggle label="Put the items back in stock" checked={returnStock} onChange={(event) => setReturnStock(event.target.checked)} />
          ) : null}
        </div>
      </ConfirmDialog>
    </div>
  )
}
