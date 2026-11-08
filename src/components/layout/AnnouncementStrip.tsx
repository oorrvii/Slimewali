import { Asterisk } from '@/components/graphics/shapes'

export function AnnouncementStrip({ text }: { text: string }) {
  if (!text) return null
  return (
    <div className="bg-char text-cream">
      <div className="container-page flex items-center justify-center gap-3 py-2 text-center text-sm font-semibold">
        <Asterisk className="size-3 shrink-0 text-lime" />
        <p>{text}</p>
        <Asterisk className="hidden size-3 shrink-0 text-orange sm:block" />
      </div>
    </div>
  )
}
