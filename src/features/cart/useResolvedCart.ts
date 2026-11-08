import { useMemo } from 'react'
import { getPublishedProductsByIds } from '@/data/products'
import { resolveLines, savingsPaise, subtotalPaise, type ResolvedLine } from '@/domain/cart'
import { useAsync } from '@/hooks/useAsync'
import { useCart } from './CartProvider'

export function useResolvedCart(): {
  loading: boolean
  error: boolean
  reload: () => void
  resolved: ResolvedLine[]
  subtotal: number
  savings: number
  payable: ResolvedLine[]
} {
  const { lines } = useCart()
  const ids = useMemo(() => Array.from(new Set(lines.map((line) => line.productId))).sort().join(','), [lines])
  const products = useAsync(
    () => (ids ? getPublishedProductsByIds(ids.split(',')) : Promise.resolve(new Map())),
    [ids],
  )
  const resolved = useMemo(
    () => (products.data ? resolveLines(lines, products.data) : []),
    [lines, products.data],
  )
  return {
    loading: products.loading,
    error: products.error,
    reload: products.reload,
    resolved,
    subtotal: subtotalPaise(resolved),
    savings: savingsPaise(resolved),
    payable: resolved.filter((item) => item.status === 'ok'),
  }
}
