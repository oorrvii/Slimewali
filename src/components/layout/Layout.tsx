import { Outlet, ScrollRestoration } from 'react-router-dom'
import { AnnouncementStrip } from './AnnouncementStrip'
import { Header } from './Header'
import { SaleStrip } from './SaleStrip'
import { Footer } from './Footer'
import { RobotsMeta } from './RobotsMeta'
import { useSettings } from '@/features/settings/SettingsProvider'

export function Layout() {
  const { settings } = useSettings()
  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-xl focus:border-2 focus:border-char focus:bg-lime focus:px-4 focus:py-2 focus:font-bold"
      >
        Skip to content
      </a>
      <AnnouncementStrip text={settings.announcementActive ? settings.announcementText : ''} />
      <RobotsMeta />
      <SaleStrip />
      <Header />
      <main id="main">
        <Outlet />
      </main>
      <Footer />
      <ScrollRestoration />
    </>
  )
}
