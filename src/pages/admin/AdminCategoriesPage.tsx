import { useMemo, useState } from 'react'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Notice } from '@/components/ui/Notice'
import { Select } from '@/components/ui/Select'
import {
  activateCategory,
  deactivateCategory,
  deleteCategory,
  listAllCategories,
  type DeactivationChoice,
} from '@/data/categories'
import { CategoryNotEmptyError } from '@/data/errors'
import { imageUrl } from '@/data/media'
import { listProductsAdmin } from '@/data/products'
import type { Category } from '@/domain/catalogue'
import { CategoryForm } from '@/features/admin/CategoryForm'
import { EmptyState, LoadError, LoadingBlock, PageHeader } from '@/features/admin/AdminParts'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

type Editing = { mode: 'new' } | { mode: 'edit'; category: Category } | null

export function AdminCategoriesPage() {
  usePageTitle('Categories · Admin')
  const { user } = useAuth()
  const actorUid = user?.uid ?? ''
  const categories = useAsync(listAllCategories, [])
  const products = useAsync(listProductsAdmin, [])
  const [editing, setEditing] = useState<Editing>(null)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  const [deactivating, setDeactivating] = useState<Category | null>(null)
  const [choice, setChoice] = useState<'reassign' | 'unpublish'>('unpublish')
  const [reassignTo, setReassignTo] = useState('')
  const [deleting, setDeleting] = useState<Category | null>(null)
  const [busy, setBusy] = useState(false)

  const counts = useMemo(() => {
    const result = new Map<string, { total: number; published: number }>()
    for (const product of products.data ?? []) {
      const entry = result.get(product.categoryId) ?? { total: 0, published: 0 }
      entry.total += 1
      if (product.status === 'published') entry.published += 1
      result.set(product.categoryId, entry)
    }
    return result
  }, [products.data])

  const list = categories.data ?? []
  const otherActive = list.filter((item) => item.isActive && item.id !== deactivating?.id)

  function reload() {
    categories.reload()
    products.reload()
  }

  async function confirmDeactivate() {
    if (!deactivating) return
    const target = otherActive.find((item) => item.id === reassignTo)
    const selected: DeactivationChoice =
      choice === 'reassign' && target
        ? { type: 'reassign', toCategoryId: target.id, toCategoryName: target.name }
        : { type: 'unpublish' }
    setBusy(true)
    try {
      const changed = await deactivateCategory(deactivating.id, selected, actorUid)
      setMessage({
        tone: 'success',
        text: `${deactivating.name} is now inactive. ${changed} product${changed === 1 ? ' was' : 's were'} ${
          selected.type === 'reassign' ? 'moved' : 'unpublished'
        }.`,
      })
      setDeactivating(null)
      reload()
    } catch {
      setMessage({ tone: 'error', text: 'We could not deactivate this category. Try again.' })
    } finally {
      setBusy(false)
    }
  }

  async function confirmDelete() {
    if (!deleting) return
    setBusy(true)
    try {
      await deleteCategory(deleting)
      setMessage({ tone: 'success', text: `${deleting.name} was deleted.` })
      setDeleting(null)
      reload()
    } catch (caught) {
      setMessage({
        tone: 'error',
        text:
          caught instanceof CategoryNotEmptyError
            ? 'This category still has products. Move or remove them first.'
            : 'We could not delete this category. Try again.',
      })
      setDeleting(null)
    } finally {
      setBusy(false)
    }
  }

  async function activate(category: Category) {
    try {
      await activateCategory(category.id, actorUid)
      setMessage({ tone: 'success', text: `${category.name} is active again.` })
      reload()
    } catch {
      setMessage({ tone: 'error', text: 'We could not activate this category. Try again.' })
    }
  }

  const deactivatingCounts = deactivating ? counts.get(deactivating.id) : undefined
  const needsChoice = (deactivatingCounts?.total ?? 0) > 0

  return (
    <>
      <PageHeader
        title="Categories"
        subtitle="Create the slime types your shop is organised by. New categories appear on the storefront straight away."
        action={
          editing === null ? (
            <Button onClick={() => setEditing({ mode: 'new' })}>New category</Button>
          ) : undefined
        }
      />

      {message ? (
        <div className="mb-6">
          <Notice tone={message.tone}>{message.text}</Notice>
        </div>
      ) : null}

      {editing ? (
        <div className="mb-8">
          <CategoryForm
            key={editing.mode === 'edit' ? editing.category.id : 'new'}
            existing={editing.mode === 'edit' ? editing.category : null}
            actorUid={actorUid}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setMessage({ tone: 'success', text: 'Category saved.' })
              setEditing(null)
              reload()
            }}
          />
        </div>
      ) : null}

      {categories.loading ? <LoadingBlock label="Loading categories" /> : null}
      {categories.error ? <LoadError what="categories" onRetry={reload} /> : null}

      {!categories.loading && !categories.error && list.length === 0 ? (
        <EmptyState
          title="No categories yet"
          body="Add your first category, then you can start adding products to it."
          action={<Button onClick={() => setEditing({ mode: 'new' })}>Create a category</Button>}
        />
      ) : null}

      <ul className="grid gap-4 md:grid-cols-2">
        {list.map((category) => {
          const count = counts.get(category.id)
          return (
            <li
              key={category.id}
              className="flex gap-4 rounded-[1.25rem] border-2 border-char bg-white p-4"
            >
              <div
                style={{ backgroundColor: category.accentColor }}
                className="size-20 shrink-0 overflow-hidden rounded-xl border-2 border-char"
              >
                {category.imagePath ? (
                  <img src={imageUrl(category.imagePath, 'small')} alt="" className="size-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-xl font-bold leading-tight">{category.name}</h2>
                  <Badge tone={category.isActive ? 'lime' : 'char'}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
                <p className="mt-1 text-sm text-char-soft">
                  /{category.slug} · {count?.total ?? 0} product{(count?.total ?? 0) === 1 ? '' : 's'}
                  {count ? ` (${count.published} published)` : ''}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => setEditing({ mode: 'edit', category })}>
                    Edit
                  </Button>
                  {category.isActive ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setChoice('unpublish')
                        setReassignTo('')
                        setDeactivating(category)
                      }}
                    >
                      Deactivate
                    </Button>
                  ) : (
                    <Button size="sm" variant="ghost" onClick={() => void activate(category)}>
                      Activate
                    </Button>
                  )}
                  {(count?.total ?? 0) === 0 ? (
                    <Button size="sm" variant="ghost" onClick={() => setDeleting(category)}>
                      Delete
                    </Button>
                  ) : null}
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      <ConfirmDialog
        open={deactivating !== null}
        title={`Deactivate ${deactivating?.name ?? 'category'}?`}
        confirmLabel="Deactivate"
        danger
        busy={busy}
        confirmDisabled={choice === 'reassign' && !reassignTo}
        onConfirm={() => void confirmDeactivate()}
        onCancel={() => setDeactivating(null)}
      >
        {needsChoice ? (
          <>
            <p>
              This category has {deactivatingCounts?.total} product
              {deactivatingCounts?.total === 1 ? '' : 's'}. Customers must not find them through an
              inactive category, so choose what happens to them.
            </p>
            <fieldset className="space-y-2">
              <legend className="sr-only">What happens to the products</legend>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name="deactivate-choice"
                  checked={choice === 'unpublish'}
                  onChange={() => setChoice('unpublish')}
                  className="mt-1"
                />
                <span>Unpublish the {deactivatingCounts?.published ?? 0} published products (they become drafts)</span>
              </label>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  name="deactivate-choice"
                  checked={choice === 'reassign'}
                  onChange={() => setChoice('reassign')}
                  className="mt-1"
                />
                <span>Move all products to another category</span>
              </label>
            </fieldset>
            {choice === 'reassign' ? (
              <Select
                label="Move products to"
                value={reassignTo}
                onChange={(event) => setReassignTo(event.target.value)}
              >
                <option value="">Choose a category</option>
                {otherActive.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </Select>
            ) : null}
          </>
        ) : (
          <p>It has no products. It will be hidden from the shop. You can activate it again later.</p>
        )}
      </ConfirmDialog>

      <ConfirmDialog
        open={deleting !== null}
        title={`Delete ${deleting?.name ?? 'category'}?`}
        confirmLabel="Delete category"
        danger
        busy={busy}
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleting(null)}
      >
        <p>This permanently removes the category. This cannot be undone.</p>
      </ConfirmDialog>
    </>
  )
}
