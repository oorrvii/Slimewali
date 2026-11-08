import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  CART_STORAGE_KEY,
  addLine,
  cartCount,
  parseStoredCart,
  removeLine,
  setLineQuantity,
  type CartLine,
} from '@/domain/cart'

type CartContextValue = {
  lines: CartLine[]
  count: number
  add: (line: CartLine, maxQuantity?: number) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

function readStored(): CartLine[] {
  try {
    return parseStoredCart(window.localStorage.getItem(CART_STORAGE_KEY))
  } catch {
    return []
  }
}

function writeStored(lines: CartLine[]) {
  try {
    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(lines))
  } catch {
    return
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(readStored)

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key === CART_STORAGE_KEY) setLines(readStored())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const update = useCallback((change: (current: CartLine[]) => CartLine[]) => {
    setLines((current) => {
      const next = change(current)
      writeStored(next)
      return next
    })
  }, [])

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: cartCount(lines),
      add: (line, maxQuantity) => update((current) => addLine(current, line, maxQuantity)),
      setQuantity: (key, quantity) => update((current) => setLineQuantity(current, key, quantity)),
      remove: (key) => update((current) => removeLine(current, key)),
      clear: () => update(() => []),
    }),
    [lines, update],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext)
  if (!context) throw new Error('useCart must be used inside CartProvider')
  return context
}
