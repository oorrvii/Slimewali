import { useEffect } from 'react'

const BRAND = 'Slimewali'

export function usePageTitle(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} · ${BRAND}` : BRAND
    if (description !== undefined) {
      const tag = document.querySelector('meta[name="description"]')
      if (tag) tag.setAttribute('content', description)
    }
  }, [title, description])
}
