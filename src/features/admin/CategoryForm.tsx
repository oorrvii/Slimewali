import { useRef, useState, type FormEvent } from 'react'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Toggle } from '@/components/ui/Toggle'
import { Notice } from '@/components/ui/Notice'
import { SlugTakenError } from '@/data/errors'
import { deleteStoredImages, imageUrl, uploadImage } from '@/data/media'
import { newCategoryId, saveCategory } from '@/data/categories'
import {
  PALETTE_COLORS,
  emptyCategoryInput,
  type Category,
  type CategoryInput,
} from '@/domain/catalogue'
import { slugify } from '@/domain/slug'
import { validateCategory, type FieldErrors } from '@/domain/validators'
import { useUnsavedWarning } from '@/hooks/useUnsavedWarning'
import { ImageRejectedError, processImage } from './imageProcessing'

function toInput(category: Category): CategoryInput {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description,
    imagePath: category.imagePath,
    accentColor: category.accentColor,
    sortOrder: category.sortOrder,
    isActive: category.isActive,
    showOnHome: category.showOnHome,
  }
}

export function CategoryForm({
  existing,
  actorUid,
  onSaved,
  onCancel,
}: {
  existing: Category | null
  actorUid: string
  onSaved: () => void
  onCancel: () => void
}) {
  const [form, setForm] = useState<CategoryInput>(existing ? toInput(existing) : emptyCategoryInput())
  const [slugEdited, setSlugEdited] = useState(existing !== null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [dirty, setDirty] = useState(false)
  const idRef = useRef(existing?.id ?? newCategoryId())
  const sessionUpload = useRef<string | null>(null)
  const fileRef = useRef<HTMLInputElement | null>(null)
  const originalImage = existing?.imagePath ?? null

  useUnsavedWarning(dirty)

  function patch(next: Partial<CategoryInput>) {
    setForm((current) => ({ ...current, ...next }))
    setDirty(true)
  }

  async function handleFile(file: File) {
    setUploading(true)
    setFormError(null)
    try {
      const processed = await processImage(file)
      const path = await uploadImage('categories', idRef.current, processed)
      if (sessionUpload.current) await deleteStoredImages([sessionUpload.current]).catch(() => undefined)
      sessionUpload.current = path
      patch({ imagePath: path })
    } catch (caught) {
      setFormError(
        caught instanceof ImageRejectedError ||
          (caught instanceof Error && caught.message.startsWith('Cloudinary'))
          ? caught.message
          : 'The image could not be uploaded. Try again.',
      )
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    const found = validateCategory(form)
    setErrors(found)
    if (Object.keys(found).length > 0) return

    setSaving(true)
    setFormError(null)
    try {
      await saveCategory(
        form,
        { id: idRef.current, previousSlug: existing ? existing.slug : null },
        actorUid,
      )
      if (originalImage && originalImage !== form.imagePath) {
        await deleteStoredImages([originalImage]).catch(() => undefined)
      }
      setDirty(false)
      onSaved()
    } catch (caught) {
      if (caught instanceof SlugTakenError) {
        setErrors({ slug: 'Another category already uses this slug.' })
      } else {
        setFormError('We could not save this category. Check your connection and try again.')
      }
    } finally {
      setSaving(false)
    }
  }

  async function cancel() {
    if (sessionUpload.current) await deleteStoredImages([sessionUpload.current]).catch(() => undefined)
    onCancel()
  }

  return (
    <form
      onSubmit={submit}
      noValidate
      className="rounded-[1.25rem] border-2 border-char bg-white p-5 shadow-pop sm:p-6"
    >
      <h2 className="display-md">{existing ? 'Edit category' : 'New category'}</h2>

      {formError ? (
        <div className="mt-4">
          <Notice tone="error">{formError}</Notice>
        </div>
      ) : null}

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <Input
          label="Name"
          value={form.name}
          maxLength={60}
          error={errors.name}
          onChange={(event) => {
            const name = event.target.value
            patch(slugEdited ? { name } : { name, slug: slugify(name) })
          }}
        />
        <Input
          label="Slug"
          hint="Used in the web address: /category/your-slug"
          value={form.slug}
          maxLength={60}
          error={errors.slug}
          onChange={(event) => {
            setSlugEdited(true)
            patch({ slug: event.target.value })
          }}
        />
        <div className="sm:col-span-2">
          <Textarea
            label="Description"
            rows={3}
            value={form.description}
            maxLength={500}
            error={errors.description}
            onChange={(event) => patch({ description: event.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <p className="text-sm font-bold">Accent colour</p>
          <div className="mt-2 flex flex-wrap gap-3" role="radiogroup" aria-label="Accent colour">
            {PALETTE_COLORS.map((color) => (
              <label key={color.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="accent"
                  value={color.value}
                  checked={form.accentColor === color.value}
                  onChange={() => patch({ accentColor: color.value })}
                  className="peer sr-only"
                />
                <span
                  style={{ backgroundColor: color.value }}
                  className="flex min-h-11 items-center rounded-xl border-2 border-char px-4 text-sm font-bold text-char peer-checked:shadow-pop-sm peer-checked:outline-3 peer-checked:outline-offset-2 peer-checked:outline-char peer-focus-visible:outline-3 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-char"
                >
                  <span className={color.value === '#343A35' ? 'text-cream' : ''}>{color.label}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        <div className="sm:col-span-2">
          <p className="text-sm font-bold">Cover image</p>
          <div className="mt-2 flex flex-wrap items-center gap-4">
            <div
              style={{ backgroundColor: form.accentColor }}
              className="grid size-28 place-items-center overflow-hidden rounded-xl border-2 border-char"
            >
              {form.imagePath ? (
                <img src={imageUrl(form.imagePath, 'small')} alt="Category cover preview" className="size-full object-cover" />
              ) : (
                <span className="px-2 text-center text-xs font-bold">No image</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                className="sr-only"
                id="category-image"
                onChange={(event) => {
                  const file = event.target.files?.[0]
                  if (file) void handleFile(file)
                }}
              />
              <Button variant="outline" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
                {form.imagePath ? 'Replace image' : 'Choose image'}
              </Button>
              {form.imagePath ? (
                <Button variant="ghost" size="sm" onClick={() => patch({ imagePath: null })}>
                  Remove image
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <Input
          label="Sort order"
          hint="Lower numbers appear first."
          inputMode="numeric"
          value={String(form.sortOrder)}
          error={errors.sortOrder}
          onChange={(event) => {
            const parsed = Number(event.target.value)
            patch({ sortOrder: Number.isFinite(parsed) ? Math.trunc(parsed) : 0 })
          }}
        />
        <div className="space-y-4 self-end">
          <Toggle
            label="Active"
            hint="Inactive categories are hidden from the shop."
            checked={form.isActive}
            onChange={(event) => patch({ isActive: event.target.checked })}
            disabled={existing !== null && existing.isActive}
          />
          <Toggle
            label="Show on the home page"
            checked={form.showOnHome}
            onChange={(event) => patch({ showOnHome: event.target.checked })}
          />
        </div>
      </div>

      <div className="mt-8 flex flex-wrap justify-end gap-3">
        <Button variant="ghost" onClick={() => void cancel()} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" loading={saving} disabled={uploading}>
          {existing ? 'Save changes' : 'Create category'}
        </Button>
      </div>
    </form>
  )
}
