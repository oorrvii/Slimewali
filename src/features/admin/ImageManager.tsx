import { useRef, useState, type MutableRefObject } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Notice } from '@/components/ui/Notice'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { deleteStoredImages, imageUrl, uploadImage } from '@/data/media'
import { ImageRejectedError, processImage } from './imageProcessing'

export type ImageState = {
  paths: string[]
  alts: string[]
  cover: string | null
}

type Upload = { id: string; name: string; progress: number }

export function ImageManager({
  productId,
  value,
  onChange,
  sessionUploads,
  onRemovePersisted,
  error,
}: {
  productId: string
  value: ImageState
  onChange: (next: ImageState) => void
  sessionUploads: MutableRefObject<Set<string>>
  onRemovePersisted: (path: string) => void
  error?: string
}) {
  const inputRef = useRef<HTMLInputElement | null>(null)
  const [uploads, setUploads] = useState<Upload[]>([])
  const [messages, setMessages] = useState<string[]>([])
  const [pendingRemove, setPendingRemove] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const latest = useRef(value)
  latest.current = value

  const room = 12 - value.paths.length - uploads.length

  async function handleFiles(fileList: FileList | File[]) {
    const files = Array.from(fileList)
    if (files.length === 0) return
    const accepted = files.slice(0, Math.max(0, room))
    const next: string[] = []
    if (files.length > accepted.length) next.push('A product can have up to 12 images.')

    await Promise.all(
      accepted.map(async (file) => {
        const id = crypto.randomUUID()
        setUploads((current) => [...current, { id, name: file.name, progress: 0 }])
        try {
          const processed = await processImage(file)
          const path = await uploadImage('products', productId, processed, (fraction) =>
            setUploads((current) =>
              current.map((item) => (item.id === id ? { ...item, progress: fraction } : item)),
            ),
          )
          sessionUploads.current.add(path)
          const base = latest.current
          const updated: ImageState = {
            paths: [...base.paths, path],
            alts: [...base.alts, ''],
            cover: base.cover ?? path,
          }
          latest.current = updated
          onChange(updated)
        } catch (caught) {
          next.push(
            caught instanceof ImageRejectedError
              ? caught.message
              : caught instanceof Error && caught.message.startsWith('Cloudinary')
                ? `${file.name}: ${caught.message}`
                : `${file.name}: the upload failed. Try again.`,
          )
        } finally {
          setUploads((current) => current.filter((item) => item.id !== id))
        }
      }),
    )
    setMessages(next)
    if (inputRef.current) inputRef.current.value = ''
  }

  function move(index: number, delta: number) {
    const target = index + delta
    if (target < 0 || target >= value.paths.length) return
    const paths = [...value.paths]
    const alts = [...value.alts]
    ;[paths[index], paths[target]] = [paths[target], paths[index]]
    ;[alts[index], alts[target]] = [alts[target], alts[index]]
    onChange({ ...value, paths, alts })
  }

  function setAlt(index: number, text: string) {
    const alts = [...value.alts]
    alts[index] = text
    onChange({ ...value, alts })
  }

  async function confirmRemove() {
    const path = pendingRemove
    if (!path) return
    const index = value.paths.indexOf(path)
    const paths = value.paths.filter((item) => item !== path)
    const alts = value.alts.filter((_, position) => position !== index)
    const cover = value.cover === path ? (paths[0] ?? null) : value.cover
    onChange({ paths, alts, cover })
    setPendingRemove(null)

    if (sessionUploads.current.has(path)) {
      sessionUploads.current.delete(path)
      try {
        await deleteStoredImages([path])
      } catch {
        setMessages(['The image was removed but its file could not be deleted yet.'])
      }
    } else {
      onRemovePersisted(path)
    }
  }

  return (
    <div>
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault()
          setDragging(false)
          void handleFiles(event.dataTransfer.files)
        }}
        className={`rounded-[1.25rem] border-2 border-dashed border-char p-6 text-center ${
          dragging ? 'bg-lime' : 'bg-white/60'
        }`}
      >
        <p className="font-bold">Drag images here, or choose files</p>
        <p className="mt-1 text-sm text-char-soft">
          JPEG, PNG, WebP or AVIF up to 15 MB each. Images are resized and compressed for you.
        </p>
        <input
          ref={inputRef}
          id="product-images"
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp,image/avif"
          className="sr-only"
          onChange={(event) => event.target.files && void handleFiles(event.target.files)}
        />
        <Button
          className="mt-4"
          variant="outline"
          size="sm"
          disabled={room <= 0}
          onClick={() => inputRef.current?.click()}
        >
          Choose images
        </Button>
      </div>

      {error ? (
        <p role="alert" className="mt-2 text-sm font-semibold text-orange-ink">
          {error}
        </p>
      ) : null}

      <div className="mt-4 space-y-2" aria-live="polite">
        {messages.map((message) => (
          <Notice key={message} tone="error">
            {message}
          </Notice>
        ))}
        {uploads.map((upload) => (
          <div key={upload.id} className="rounded-xl border-2 border-char bg-white p-3 text-sm">
            <p className="truncate font-semibold">Uploading {upload.name}</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-char/10">
              <div
                className="h-full bg-lime transition-[width]"
                style={{ width: `${Math.round(upload.progress * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      {value.paths.length > 0 ? (
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {value.paths.map((path, index) => (
            <li key={path} className="rounded-[1.25rem] border-2 border-char bg-white p-3">
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border-2 border-char bg-cream">
                <img
                  src={imageUrl(path, 'small')}
                  alt={value.alts[index] || 'Product image preview'}
                  className="size-full object-cover"
                />
                {value.cover === path ? (
                  <Badge tone="lime" className="absolute left-2 top-2">
                    Cover
                  </Badge>
                ) : null}
              </div>
              <div className="mt-3">
                <Input
                  label="Alt text"
                  hint="Describe what the photo shows."
                  value={value.alts[index] ?? ''}
                  maxLength={200}
                  onChange={(event) => setAlt(index, event.target.value)}
                />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`Move image ${index + 1} earlier`}
                  disabled={index === 0}
                  onClick={() => move(index, -1)}
                >
                  Earlier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  aria-label={`Move image ${index + 1} later`}
                  disabled={index === value.paths.length - 1}
                  onClick={() => move(index, 1)}
                >
                  Later
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={value.cover === path}
                  onClick={() => onChange({ ...value, cover: path })}
                >
                  Set as cover
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setPendingRemove(path)}>
                  Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <ConfirmDialog
        open={pendingRemove !== null}
        title="Remove this image?"
        confirmLabel="Remove image"
        danger
        onConfirm={() => void confirmRemove()}
        onCancel={() => setPendingRemove(null)}
      >
        <p>The image is removed from this product when you save. This cannot be undone.</p>
      </ConfirmDialog>
    </div>
  )
}
