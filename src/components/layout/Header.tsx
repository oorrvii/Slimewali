import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { BagIcon, CloseIcon, MenuIcon, UserIcon } from '@/components/ui/icons'
import { useAuth } from '@/features/auth/AuthProvider'
import { useActiveCategories } from '@/features/catalogue/useActiveCategories'
import { useCart } from '@/features/cart/CartProvider'

const links = [
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <Link
      to="/"
      aria-label="Slimewali home"
      className={`inline-flex items-center gap-2 font-display text-2xl font-extrabold tracking-tight ${className}`}
    >
      <img src="/logo.png" alt="" width="44" height="44" className="size-11 shrink-0 object-contain" />
      <span>SLIMEWALI</span>
    </Link>
  )
}

export function Header() {
  const { count: cartCount } = useCart()
  const { status, isAdmin } = useAuth()
  const [open, setOpen] = useState(false)
  const { categories } = useActiveCategories()
  const categoryLinks = categories.slice(0, 4).map((category) => ({
    to: `/category/${category.slug}`,
    label: category.name,
  }))
  const baseLinks = [links[0], ...categoryLinks, ...links.slice(1)]
  const navLinks = isAdmin ? [...baseLinks, { to: '/admin', label: 'Admin' }] : baseLinks
  const accountTarget = status === 'signed_in' ? '/account' : '/sign-in'
  const accountLabel = status === 'signed_in' ? 'Your account' : 'Sign in'
  const toggleRef = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        toggleRef.current?.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="sticky top-0 z-40 border-b-2 border-char bg-cream/95 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Wordmark />

        <nav aria-label="Primary" className="hidden items-center gap-5 xl:gap-8 lg:flex">
          {navLinks.map((link) => (
            <NavLink key={link.to} to={link.to} className="nav-link">
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <Link
            to={accountTarget}
            aria-label={accountLabel}
            className="grid size-11 place-items-center rounded-xl hover:bg-char/10"
          >
            <UserIcon className="size-6" />
          </Link>
          <Link
            to="/cart"
            aria-label={`Cart, ${cartCount} items`}
            className="relative grid size-11 place-items-center rounded-xl hover:bg-char/10"
          >
            <BagIcon className="size-6" />
            {cartCount > 0 ? (
              <span className="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full border-2 border-char bg-orange px-1 text-[11px] font-extrabold leading-4 text-char">
                {cartCount}
              </span>
            ) : null}
          </Link>
          <button
            ref={toggleRef}
            type="button"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((value) => !value)}
            className="grid size-11 place-items-center rounded-xl hover:bg-char/10 lg:hidden"
          >
            {open ? <CloseIcon className="size-6" /> : <MenuIcon className="size-6" />}
          </button>
        </div>
      </div>

      <nav
        id="mobile-menu"
        aria-label="Mobile"
        hidden={!open}
        className="border-t-2 border-char bg-lime lg:hidden"
      >
        <ul className="container-page flex flex-col py-2">
          {navLinks.map((link) => (
            <li key={link.to}>
              <NavLink
                to={link.to}
                onClick={() => setOpen(false)}
                className="flex min-h-14 items-center border-b-2 border-char/15 font-display text-3xl font-extrabold tracking-tight last:border-b-0"
              >
                {link.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  )
}
