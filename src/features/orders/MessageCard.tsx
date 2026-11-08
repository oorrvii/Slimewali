import { useEffect, useState } from 'react'
import { Button, buttonClasses } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Textarea } from '@/components/ui/Input'
import type { Order } from '@/domain/order'
import {
  MESSAGE_KINDS,
  buildMessage,
  defaultKindFor,
  hasUnfilledPlaceholder,
  messageLinks,
  type MessageKind,
} from '@/domain/messages'
import { useSettings } from '@/features/settings/SettingsProvider'

export function MessageCard({ order }: { order: Order }) {
  const { settings } = useSettings()
  const [kind, setKind] = useState<MessageKind>(defaultKindFor(order.orderStatus))
  const [text, setText] = useState(() => buildMessage(defaultKindFor(order.orderStatus), order, settings))
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    const next = defaultKindFor(order.orderStatus)
    setKind(next)
    setText(buildMessage(next, order, settings))
  }, [order.orderStatus, order.courierName, order.trackingReference, order.trackingUrl, order.finalTotalPaise, order.id])

  function pick(next: MessageKind) {
    setKind(next)
    setText(buildMessage(next, order, settings))
    setCopied(false)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  const links = messageLinks(order, text)
  const blocked = hasUnfilledPlaceholder(text)
  const linkClass = buttonClasses({ variant: 'outline', size: 'sm' })

  return (
    <section className="mt-6 rounded-[1.25rem] border-2 border-char bg-white p-5 sm:p-6" aria-labelledby="message-title">
      <h2 id="message-title" className="display-md">
        Message the customer
      </h2>
      <p className="mt-1 max-w-2xl text-sm text-char-soft">
        Nothing is sent automatically. Pick a message, edit it, then copy it or open it in WhatsApp or email. Add your payment
        details yourself, they are never stored on the website.
      </p>
      <div className="mt-5 space-y-4">
        <Select label="Message" value={kind} onChange={(event) => pick(event.target.value as MessageKind)}>
          {MESSAGE_KINDS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </Select>
        <Textarea
          label="Text"
          rows={9}
          value={text}
          onChange={(event) => {
            setText(event.target.value)
            setCopied(false)
          }}
        />
        {blocked ? (
          <p className="text-sm font-semibold text-orange-ink">Replace the bracketed payment line before sending.</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" onClick={copy}>
            {copied ? 'Copied' : 'Copy message'}
          </Button>
          {links.whatsapp ? (
            <a className={linkClass} href={links.whatsapp} target="_blank" rel="noreferrer">
              Open in WhatsApp
            </a>
          ) : null}
          {links.email ? (
            <a className={linkClass} href={links.email}>
              Open in email
            </a>
          ) : null}
          {links.instagram ? (
            <a className={linkClass} href={links.instagram} target="_blank" rel="noreferrer">
              Open Instagram profile
            </a>
          ) : null}
        </div>
        {links.instagram ? (
          <p className="text-sm text-char-soft">Instagram cannot be pre-filled. Copy the message, then paste it in the chat.</p>
        ) : null}
      </div>
    </section>
  )
}