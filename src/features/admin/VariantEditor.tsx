import { useState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { paiseToInput, parseRupeesToPaise } from '@/domain/money'
import type { Variant } from '@/domain/catalogue'
import type { FieldErrors } from '@/domain/validators'

export function VariantEditor({
  variants,
  onChange,
  errors,
}: {
  variants: Variant[]
  onChange: (next: Variant[]) => void
  errors: FieldErrors
}) {
  const [priceTexts, setPriceTexts] = useState<string[]>(() =>
    variants.map((variant) => paiseToInput(variant.pricePaise)),
  )
  const [compareTexts, setCompareTexts] = useState<string[]>(() =>
    variants.map((variant) => (variant.compareAtPaise ? paiseToInput(variant.compareAtPaise) : '')),
  )

  function update(index: number, patch: Partial<Variant>) {
    onChange(variants.map((variant, position) => (position === index ? { ...variant, ...patch } : variant)))
  }

  function add() {
    setPriceTexts((current) => [...current, ''])
    setCompareTexts((current) => [...current, ''])
    onChange([
      ...variants,
      { id: crypto.randomUUID(), label: '', sku: '', pricePaise: 0, compareAtPaise: null, stockQuantity: 0, isActive: true },
    ])
  }

  function remove(index: number) {
    setPriceTexts((current) => current.filter((_, position) => position !== index))
    setCompareTexts((current) => current.filter((_, position) => position !== index))
    onChange(variants.filter((_, position) => position !== index))
  }

  return (
    <div className="space-y-4">
      {errors.variants ? (
        <p role="alert" className="text-sm font-semibold text-orange-ink">
          {errors.variants}
        </p>
      ) : null}
      {variants.map((variant, index) => (
        <fieldset
          key={variant.id}
          className="rounded-[1.25rem] border-2 border-char bg-white p-4"
        >
          <legend className="px-2 text-sm font-bold">Variant {index + 1}</legend>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Label"
              placeholder="For example, 100 g jar"
              value={variant.label}
              maxLength={60}
              error={errors[`variant-${index}-label`]}
              onChange={(event) => update(index, { label: event.target.value })}
            />
            <Input
              label="SKU (optional)"
              value={variant.sku}
              maxLength={40}
              error={errors[`variant-${index}-sku`]}
              onChange={(event) => update(index, { sku: event.target.value })}
            />
            <Input
              label="Price (₹)"
              inputMode="decimal"
              value={priceTexts[index] ?? ''}
              error={errors[`variant-${index}-price`]}
              onChange={(event) => {
                const text = event.target.value
                setPriceTexts((current) => current.map((item, position) => (position === index ? text : item)))
                update(index, { pricePaise: parseRupeesToPaise(text) ?? 0 })
              }}
            />
            <Input
              label="Original price (₹), optional"
              hint="Fill this to show a discount. Use the earlier price you really charged."
              inputMode="decimal"
              value={compareTexts[index] ?? ''}
              error={errors[`variant-${index}-compare`]}
              onChange={(event) => {
                const text = event.target.value
                setCompareTexts((current) => current.map((item, position) => (position === index ? text : item)))
                update(index, { compareAtPaise: text.trim() === '' ? null : (parseRupeesToPaise(text) ?? 0) })
              }}
            />
            <Input
              label="Stock"
              inputMode="numeric"
              value={String(variant.stockQuantity)}
              error={errors[`variant-${index}-stock`]}
              onChange={(event) => {
                const parsed = Number(event.target.value.replace(/\D/g, ''))
                update(index, { stockQuantity: Number.isFinite(parsed) ? parsed : 0 })
              }}
            />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <Toggle
              label="Available to customers"
              checked={variant.isActive}
              onChange={(event) => update(index, { isActive: event.target.checked })}
            />
            <Button size="sm" variant="ghost" onClick={() => remove(index)}>
              Remove variant
            </Button>
          </div>
        </fieldset>
      ))}
      <Button variant="outline" onClick={add}>
        Add a variant
      </Button>
    </div>
  )
}
