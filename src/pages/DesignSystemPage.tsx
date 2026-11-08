import { useState, type ReactNode } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { ProductCard } from '@/components/product/ProductCard'
import { Hero } from '@/components/home/Hero'
import { Asterisk, Blob, Ring, Spark, Squiggle, Starburst, Sticker } from '@/components/graphics/shapes'
import { formatPaise } from '@/domain/money'
import {
  orderStatusLabel,
  orderStatusTone,
  paymentStatusLabel,
  type OrderStatus,
} from '@/domain/status'
import { sampleProducts } from '@/preview/sampleData'

const swatches = [
  { name: 'Muted lime', hex: '#D5E66D', bg: 'bg-lime', note: 'Charcoal text 8.5:1' },
  { name: 'Soft lavender', hex: '#A99BEA', bg: 'bg-lavender', note: 'Charcoal text 4.8:1' },
  { name: 'Warm orange', hex: '#E98B62', bg: 'bg-orange', note: 'Charcoal text 4.6:1' },
  { name: 'Warm cream', hex: '#F2EBDD', bg: 'bg-cream', note: 'Charcoal text 9.8:1' },
  { name: 'Deep charcoal', hex: '#343A35', bg: 'bg-char', note: 'Cream text 9.8:1', light: true },
  { name: 'White', hex: '#FFFFFF', bg: 'bg-white', note: 'Charcoal text 11.7:1' },
]

const inkSwatches = [
  { name: 'Orange ink', hex: '#A8461F', bg: 'bg-orange-ink', note: 'On cream 5.0:1 — small text only' },
  { name: 'Lavender ink', hex: '#5B49B8', bg: 'bg-lavender-ink', note: 'On cream 5.7:1 — small text only' },
  { name: 'Charcoal soft', hex: '#5A615B', bg: 'bg-char-soft', note: 'On cream 5.4:1 — secondary text' },
]

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="border-t-2 border-char py-12">
      <h2 className="display-md mb-8">{title}</h2>
      {children}
    </section>
  )
}

export function DesignSystemPage() {
  const [loading, setLoading] = useState(false)

  const startLoading = () => {
    setLoading(true)
    window.setTimeout(() => setLoading(false), 1600)
  }

  return (
    <>
      <div className="container-page pt-12">
        <Badge tone="lavender">Phase 1 sign-off</Badge>
        <h1 className="display-lg mt-4">Design system preview</h1>
        <p className="mt-4 max-w-xl text-char-soft">
          Temporary page for visual review. It uses sample content only and will be removed before
          launch.
        </p>

        <Section id="palette" title="Palette">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {swatches.map((swatch) => (
              <div key={swatch.hex}>
                <div
                  className={`${swatch.bg} h-24 rounded-xl border-2 border-char ${swatch.light ? 'text-cream' : 'text-char'}`}
                />
                <p className="mt-2 text-sm font-bold">{swatch.name}</p>
                <p className="text-sm text-char-soft">{swatch.hex}</p>
                <p className="text-xs text-char-soft">{swatch.note}</p>
              </div>
            ))}
          </div>
          <p className="eyebrow mt-10">Text-safe ink variants</p>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {inkSwatches.map((swatch) => (
              <div key={swatch.hex} className="flex items-center gap-3">
                <div className={`${swatch.bg} size-12 shrink-0 rounded-xl border-2 border-char`} />
                <div>
                  <p className="text-sm font-bold">
                    {swatch.name} · {swatch.hex}
                  </p>
                  <p className="text-xs text-char-soft">{swatch.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section id="type" title="Typography">
          <p className="eyebrow text-char-soft">Display — Bricolage Grotesque</p>
          <p className="display-xl mt-2">Squish</p>
          <p className="display-lg mt-6">Section heading style</p>
          <p className="display-md mt-6">Card and subsection heading</p>
          <p className="eyebrow mt-8 text-char-soft">Body — DM Sans</p>
          <p className="mt-2 max-w-xl text-lg">
            Body copy stays calm and readable. Product descriptions, checkout text and dashboards
            all use this face at comfortable sizes and line heights.
          </p>
          <p className="mt-3 max-w-xl text-sm text-char-soft">
            Secondary text sits in soft charcoal and still meets contrast on cream and white.
          </p>
        </Section>

        <Section id="buttons" title="Buttons">
          <div className="flex flex-wrap items-center gap-4">
            <Button>Add to cart</Button>
            <Button variant="dark">Submit order request</Button>
            <Button variant="accent">Shop slimes</Button>
            <Button variant="outline">Continue shopping</Button>
            <Button variant="ghost">Cancel</Button>
          </div>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
            <Button loading={loading} onClick={startLoading}>
              {loading ? 'Saving' : 'Try loading state'}
            </Button>
          </div>
        </Section>

        <Section id="forms" title="Inputs">
          <div className="grid max-w-3xl gap-6 sm:grid-cols-2">
            <Input label="Full name" placeholder="Your name" autoComplete="name" />
            <Input
              label="Mobile number"
              placeholder="+91 98765 43210"
              hint="Indian mobile number, +91 optional"
              inputMode="tel"
            />
            <Input label="PIN code" defaultValue="12345" error="Enter a valid 6-digit PIN code" />
            <Input label="City" placeholder="City" />
            <div className="sm:col-span-2">
              <Textarea label="Order note (optional)" placeholder="Anything we should know?" />
            </div>
          </div>
        </Section>

        <Section id="badges" title="Badges and order status labels">
          <div className="flex flex-wrap gap-3">
            <Badge tone="lime">New</Badge>
            <Badge tone="lavender">Featured</Badge>
            <Badge tone="orange">Low stock</Badge>
            <Badge tone="char">Out of stock</Badge>
            <Badge tone="outline">Outline</Badge>
          </div>
          <p className="eyebrow mt-8 text-char-soft">Customer-facing order statuses</p>
          <div className="mt-4 flex flex-wrap gap-3">
            {(Object.keys(orderStatusLabel) as OrderStatus[]).map((status) => (
              <Badge key={status} tone={orderStatusTone[status]}>
                {orderStatusLabel[status]}
              </Badge>
            ))}
          </div>
          <p className="mt-4 text-sm text-char-soft">
            Payment line example: {paymentStatusLabel.not_requested}. Order total example:{' '}
            {formatPaise(129700)}.
          </p>
        </Section>

        <Section id="cards" title="Cards and graphic vocabulary">
          <div className="grid gap-4 md:grid-cols-3">
            <Card pop>
              <h3 className="display-md">White card</h3>
              <p className="mt-2 text-char-soft">Clean surface for content and forms.</p>
            </Card>
            <Card tone="lime" pop>
              <h3 className="display-md">Lime card</h3>
              <p className="mt-2">Brand energy in a controlled block.</p>
            </Card>
            <Card tone="char">
              <h3 className="display-md">Charcoal card</h3>
              <p className="mt-2 text-cream/80">Anchors the page and adds contrast.</p>
            </Card>
          </div>
          <div className="mt-10 flex flex-wrap items-center gap-8">
            <Blob variant={1} outline className="size-24 text-lavender" />
            <Blob variant={2} outline className="size-24 text-lime" />
            <Blob variant={3} outline className="size-24 text-orange" />
            <Starburst outline className="size-24 text-lime" />
            <Spark outline className="size-16 text-orange" />
            <Asterisk className="size-14 text-char" />
            <Ring className="size-16 text-char" />
            <Squiggle className="h-6 w-28 text-lavender-ink" />
            <Sticker tone="lime" rotate={-5}>
              Handmade
            </Sticker>
            <Sticker tone="orange" rotate={4}>
              Small batch
            </Sticker>
          </div>
          <p className="mt-4 text-sm text-char-soft">
            Stamps like “Handmade” and “Small batch” are placeholders until the owner confirms they
            are accurate for each product.
          </p>
        </Section>

        <Section id="products" title="Product cards (sample content)">
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {sampleProducts.map((product) => (
              <ProductCard key={product.slug} product={product} />
            ))}
          </div>
        </Section>
      </div>

      <section id="hero" className="mt-4 border-t-2 border-char">
        <div className="container-page pt-12">
          <h2 className="display-md">Hero composition</h2>
          <p className="mt-2 max-w-xl text-char-soft">
            Headline copy is provisional. The dashed panel marks where a real product photo will go.
          </p>
        </div>
        <Hero />
      </section>

      <div className="container-page">
        <Section id="mobile" title="Mobile preview">
          <p className="mb-8 max-w-xl text-char-soft">
            A live 390px-wide view of the home layout, so the real mobile breakpoints are applied.
          </p>
          <div className="mx-auto w-[414px] max-w-full rounded-[2.5rem] border-2 border-char bg-char p-3 shadow-pop-lg">
            <iframe
              title="Mobile preview of the home layout"
              src="/"
              className="block h-[780px] w-full rounded-[2rem] border-0 bg-cream"
            />
          </div>
        </Section>
      </div>
    </>
  )
}
