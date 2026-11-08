import { Link } from 'react-router-dom'
import { isSaleLive } from '@/domain/settings'
import { useSettings } from '@/features/settings/SettingsProvider'

export function SaleStrip() {
  const { settings } = useSettings()
  if (!isSaleLive(settings)) return null
  return (
    <div className="border-b-2 border-char bg-orange text-char">
      <div className="container-page py-2 text-center text-sm font-extrabold">
        <Link to="/shop?sale=1" className="underline-offset-4 hover:underline">
          {settings.saleTitle}
          {settings.saleText ? <span className="font-semibold"> · {settings.saleText}</span> : null} · Shop the sale
        </Link>
      </div>
    </div>
  )
}
