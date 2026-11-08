import { useEffect, useState } from 'react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { CloseIcon, MenuIcon } from '@/components/ui/icons'

const items = [
  { to: '/account', label: 'Overview', end: true },
  { to: '/account/orders', label: 'My orders', end: false },
  { to: '/account/addresses', label: 'Addresses', end: false },
  { to: '/account/profile', label: 'Profile', end: false },
  { to: '/account/help', label: 'Help and contact', end: false },
]

export function AccountLayout() {
  const [open, setOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [location.pathname])

  return (
    <div className="container-page grid gap-6 py-6 lg:grid-cols-[14rem_1fr] lg:gap-10 lg:py-10">
      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="flex items-center justify-between lg:hidden">
          <p className="eyebrow">Your account</p>
          <button
            type="button"
            aria-expanded={open}
            aria-controls="account-nav"
            onClick={() => setOpen((value) => !value)}
            className="inline-flex min-h-11 items-center gap-2 rounded-xl border-2 border-char bg-white px-4 font-bold shadow-pop-sm"
          >
            {open ? <CloseIcon className="size-5" /> : <MenuIcon className="size-5" />}
            Menu
          </button>
        </div>
        <nav
          id="account-nav"
          aria-label="Account"
          className={`${open ? 'block' : 'hidden'} mt-3 rounded-[1.25rem] border-2 border-char bg-white p-3 lg:mt-0 lg:block`}
        >
          <p className="eyebrow mb-3 hidden px-4 pt-2 lg:block">Your account</p>
          <ul className="flex flex-col gap-1">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `flex min-h-11 items-center rounded-xl border-2 px-4 font-bold ${
                      isActive
                        ? 'border-char bg-lime shadow-pop-sm'
                        : 'border-transparent hover:bg-char/10'
                    }`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="min-w-0">
        <Outlet />
      </div>
    </div>
  )
}
