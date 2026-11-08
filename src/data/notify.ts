import { buildAlertParams, type AlertInput } from '@/domain/notify'

const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID as string | undefined
const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID as string | undefined
const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY as string | undefined

export const orderAlertsConfigured = Boolean(serviceId && templateId && publicKey)

function report(message: string, detail?: unknown) {
  if (import.meta.env.DEV) console.warn(`[order alert] ${message}`, detail ?? '')
}

export async function notifyNewOrder(input: AlertInput): Promise<void> {
  if (!serviceId || !templateId || !publicKey) {
    report('Not sent: VITE_EMAILJS_SERVICE_ID, VITE_EMAILJS_TEMPLATE_ID or VITE_EMAILJS_PUBLIC_KEY is missing. Check .env.local and restart npm run dev.')
    return
  }
  try {
    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: buildAlertParams(input),
      }),
    })
    if (!response.ok) report(`EmailJS refused the request (${response.status}).`, await response.text())
  } catch (error) {
    report('The request could not reach EmailJS. An ad blocker or privacy extension may be blocking it.', error)
  }
}
