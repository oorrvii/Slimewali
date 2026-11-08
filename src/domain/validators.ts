import { PALETTE_COLORS, type CategoryInput, type ProductInput } from './catalogue'
import { isValidSlug } from './slug'
import { MAX_PRICE_PAISE } from './money'

export type FieldErrors = Record<string, string>

const paletteValues: string[] = PALETTE_COLORS.map((color) => color.value)

export function validateCategory(input: CategoryInput): FieldErrors {
  const errors: FieldErrors = {}
  const name = input.name.trim()

  if (name.length === 0) errors.name = 'Enter a category name.'
  else if (name.length > 60) errors.name = 'Keep the name under 60 characters.'

  if (!isValidSlug(input.slug)) {
    errors.slug = 'Use lowercase letters, numbers and single hyphens only.'
  }
  if (input.description.length > 500) {
    errors.description = 'Keep the description under 500 characters.'
  }
  if (!paletteValues.includes(input.accentColor)) {
    errors.accentColor = 'Choose one of the palette colours.'
  }
  if (!Number.isInteger(input.sortOrder)) {
    errors.sortOrder = 'Sort order must be a whole number.'
  }
  return errors
}

function isPaise(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= MAX_PRICE_PAISE
}

export function validateProduct(input: ProductInput): FieldErrors {
  const errors: FieldErrors = {}
  const name = input.name.trim()

  if (name.length === 0) errors.name = 'Enter a product name.'
  else if (name.length > 120) errors.name = 'Keep the name under 120 characters.'

  if (!isValidSlug(input.slug)) {
    errors.slug = 'Use lowercase letters, numbers and single hyphens only.'
  }
  if (input.shortDescription.length > 200) {
    errors.shortDescription = 'Keep the short description under 200 characters.'
  }
  if (input.description.length > 5000) {
    errors.description = 'Keep the description under 5000 characters.'
  }
  if (input.careInstructions.length > 2000) {
    errors.careInstructions = 'Keep care instructions under 2000 characters.'
  }
  if (input.seoTitle.length > 70) errors.seoTitle = 'Keep the SEO title under 70 characters.'
  if (input.seoDescription.length > 160) {
    errors.seoDescription = 'Keep the SEO description under 160 characters.'
  }
  if (!input.categoryId) errors.categoryId = 'Choose a category.'
  if (!Number.isInteger(input.sortOrder)) errors.sortOrder = 'Sort order must be a whole number.'
  if (!Number.isInteger(input.lowStockThreshold) || input.lowStockThreshold < 0) {
    errors.lowStockThreshold = 'Enter zero or a positive whole number.'
  }
  if (input.tags.length > 20) errors.tags = 'Use at most 20 tags.'
  if (input.imagePaths.length > 12) errors.images = 'Use at most 12 images.'

  if (!input.hasVariants) {
    if (!isPaise(input.pricePaise) || input.pricePaise === 0) {
      errors.pricePaise = 'Enter a price greater than zero.'
    }
    if (!Number.isInteger(input.stockQuantity) || input.stockQuantity < 0) {
      errors.stockQuantity = 'Stock must be zero or a positive whole number.'
    }
  } else {
    if (input.variants.length === 0) {
      errors.variants = 'Add at least one variant, or turn variants off.'
    }
    if (input.variants.length > 20) errors.variants = 'Use at most 20 variants.'
    const labels = new Set<string>()
    const skus = new Set<string>()
    input.variants.forEach((variant, index) => {
      const label = variant.label.trim().toLowerCase()
      if (label.length === 0) errors[`variant-${index}-label`] = 'Enter a label.'
      else if (labels.has(label)) errors[`variant-${index}-label`] = 'Labels must be different.'
      labels.add(label)
      const sku = variant.sku.trim().toLowerCase()
      if (sku.length > 0) {
        if (skus.has(sku)) errors[`variant-${index}-sku`] = 'SKUs must be different.'
        skus.add(sku)
      }
      if (!isPaise(variant.pricePaise) || variant.pricePaise === 0) {
        errors[`variant-${index}-price`] = 'Enter a price greater than zero.'
      }
      if (!Number.isInteger(variant.stockQuantity) || variant.stockQuantity < 0) {
        errors[`variant-${index}-stock`] = 'Enter zero or more.'
      }
    })
  }

  if (!input.hasVariants && input.compareAtPricePaise !== null) {
    if (!isPaise(input.compareAtPricePaise) || input.compareAtPricePaise <= input.pricePaise) {
      errors.compareAtPricePaise = 'The original price must be higher than the selling price.'
    }
  }
  if (input.hasVariants) {
    input.variants.forEach((variant, index) => {
      if (variant.compareAtPaise !== null && (!isPaise(variant.compareAtPaise) || variant.compareAtPaise <= variant.pricePaise)) {
        errors[`variant-${index}-compare`] = 'The original price must be higher than the selling price.'
      }
    })
  }

  return errors
}

export function validateForPublish(input: ProductInput): FieldErrors {
  const errors = validateProduct(input)
  if (input.imagePaths.length === 0) errors.images = 'Add at least one image before publishing.'
  if (input.description.trim().length === 0) errors.description = 'Add a description before publishing.'
  return errors
}
