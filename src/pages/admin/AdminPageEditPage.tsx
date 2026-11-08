import { useEffect, useState, type FormEvent } from 'react'
import { Link, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Input, Textarea } from '@/components/ui/Input'
import { Notice } from '@/components/ui/Notice'
import { Toggle } from '@/components/ui/Toggle'
import { getPageAdmin, savePage } from '@/data/content'
import {
  definitionOf,
  isPageId,
  validatePage,
  type FaqItem,
  type PageErrors,
  type PageId,
} from '@/domain/content'
import { LoadError, LoadingBlock, PageHeader } from '@/features/admin/AdminParts'
import { useAuth } from '@/features/auth/AuthProvider'
import { useAsync } from '@/hooks/useAsync'
import { usePageTitle } from '@/hooks/usePageTitle'

function Editor({ id }: { id: PageId }) {
  const definition = definitionOf(id)
  const { user } = useAuth()
  const loaded = useAsync(() => getPageAdmin(id), [id])
  const [title, setTitle] = useState<string>(definition.title)
  const [body, setBody] = useState('')
  const [items, setItems] = useState<FaqItem[]>([])
  const [published, setPublished] = useState(false)
  const [errors, setErrors] = useState<PageErrors>({})
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ tone: 'success' | 'error'; text: string } | null>(null)
  usePageTitle(`${definition.title} · Admin`)

  useEffect(() => {
    if (loaded.data) {
      setTitle(loaded.data.title)
      setBody(loaded.data.body)
      setItems(loaded.data.items)
      setPublished(loaded.data.isPublished)
    }
  }, [loaded.data])

  function updateItem(index: number, patch: Partial<FaqItem>) {
    setItems((current) => current.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault()
    const input = { title, body, items, isPublished: published }
    const found = validatePage(input)
    setErrors(found)
    if (Object.keys(found).length > 0) {
      setMessage({ tone: 'error', text: 'Please fix the highlighted fields.' })
      return
    }
    setSaving(true)
    setMessage(null)
    try {
      await savePage(id, input, user?.uid ?? '')
      setMessage({
        tone: 'success',
        text: published ? 'Saved and published. It is live on the shop.' : 'Saved as a draft. It is not shown on the shop.',
      })
    } catch {
      setMessage({ tone: 'error', text: 'We could not save this page. Please try again.' })
    } finally {
      setSaving(false)
    }
  }

  if (loaded.loading) return <LoadingBlock label="Loading page" />
  if (loaded.error) return <LoadError what="the page" onRetry={loaded.reload} />

  return (
    <div>
      <Link to="/admin/pages" className="text-sm font-semibold underline underline-offset-4">
        All pages
      </Link>
      <div className="mt-3">
        <PageHeader title={definition.title} subtitle={`Shown at ${definition.path} when published.`} />
      </div>
      <form onSubmit={onSubmit} noValidate className="max-w-3xl space-y-6">
        {message ? <Notice tone={message.tone}>{message.text}</Notice> : null}
        <Input label="Title" value={title} error={errors.title} maxLength={100} onChange={(e) => setTitle(e.target.value)} />
        <Textarea
          label="Text"
          rows={14}
          value={body}
          error={errors.body}
          hint="Leave a blank line between paragraphs. Start a line with ## for a heading, or with - for a bullet point. Plain text only."
          onChange={(e) => setBody(e.target.value)}
        />

        {id === 'faq' ? (
          <section className="space-y-4">
            <h2 className="display-md">Questions and answers</h2>
            {items.map((item, index) => (
              <div key={index} className="space-y-3 rounded-[1.25rem] border-2 border-char bg-white p-4">
                <Input label={`Question ${index + 1}`} value={item.question} maxLength={200} onChange={(e) => updateItem(index, { question: e.target.value })} />
                <Textarea label="Answer" rows={3} value={item.answer} maxLength={2000} onChange={(e) => updateItem(index, { answer: e.target.value })} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={index === 0} onClick={() => setItems((c) => { const n = [...c]; [n[index - 1], n[index]] = [n[index], n[index - 1]]; return n })}>
                    Move up
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={index === items.length - 1} onClick={() => setItems((c) => { const n = [...c]; [n[index + 1], n[index]] = [n[index], n[index + 1]]; return n })}>
                    Move down
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={() => setItems((c) => c.filter((_, i) => i !== index))}>
                    Remove
                  </Button>
                </div>
              </div>
            ))}
            {errors.items ? <p className="text-sm font-semibold text-orange-ink">{errors.items}</p> : null}
            <Button type="button" variant="outline" onClick={() => setItems((c) => [...c, { question: '', answer: '' }])}>
              Add a question
            </Button>
          </section>
        ) : null}

        <Toggle label="Published" hint="Turn this on to show the page on the shop. Off keeps it as a draft." checked={published} onChange={(e) => setPublished(e.target.checked)} />
        <Button type="submit" loading={saving}>
          Save page
        </Button>
      </form>
    </div>
  )
}

export function AdminPageEditPage() {
  const { id = '' } = useParams()
  if (!isPageId(id)) {
    return (
      <div>
        <p className="text-char-soft">That page does not exist.</p>
        <Link to="/admin/pages" className="mt-3 inline-block font-semibold underline underline-offset-4">
          Back to pages
        </Link>
      </div>
    )
  }
  return <Editor key={id} id={id} />
}