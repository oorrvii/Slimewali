import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const PRIVATE_PREFIXES = ['/admin', '/account', '/cart', '/checkout', '/order-confirmation', '/sign-in']

export function RobotsMeta() {
  const { pathname } = useLocation()
  useEffect(() => {
    const isPrivate = PRIVATE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`))
    let tag = document.querySelector('meta[name="robots"]')
    if (isPrivate) {
      if (!tag) {
        tag = document.createElement('meta')
        tag.setAttribute('name', 'robots')
        document.head.appendChild(tag)
      }
      tag.setAttribute('content', 'noindex, nofollow')
    } else if (tag) {
      tag.remove()
    }
  }, [pathname])
  return null
}
