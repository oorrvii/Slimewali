import { useEffect, useState } from 'react'
import { listActiveCategories } from '@/data/categories'
import type { Category } from '@/domain/catalogue'

let cached: Category[] | null = null
let inflight: Promise<Category[]> | null = null

function load(): Promise<Category[]> {
  if (cached) return Promise.resolve(cached)
  if (!inflight) {
    inflight = listActiveCategories()
      .then((result) => {
        cached = result
        return result
      })
      .finally(() => {
        inflight = null
      })
  }
  return inflight
}

export function useActiveCategories(): { categories: Category[]; loading: boolean; failed: boolean } {
  const [categories, setCategories] = useState<Category[]>(cached ?? [])
  const [loading, setLoading] = useState(cached === null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cancelled = false
    load()
      .then((result) => {
        if (!cancelled) {
          setCategories(result)
          setLoading(false)
        }
      })
      .catch(() => {
        if (!cancelled) {
          setFailed(true)
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { categories, loading, failed }
}
