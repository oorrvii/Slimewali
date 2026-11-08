export const PAGE_DEFINITIONS = [
  { id: 'about', title: 'About us', path: '/about' },
  { id: 'contact', title: 'Contact', path: '/contact' },
  { id: 'faq', title: 'FAQ', path: '/faq' },
  { id: 'shipping', title: 'Shipping', path: '/shipping' },
  { id: 'returns', title: 'Returns and refunds', path: '/returns' },
  { id: 'privacy', title: 'Privacy policy', path: '/privacy' },
  { id: 'terms', title: 'Terms', path: '/terms' },
] as const

export type PageId = (typeof PAGE_DEFINITIONS)[number]['id']

export type FaqItem = { question: string; answer: string }

export type ContentPage = {
  id: PageId
  title: string
  body: string
  items: FaqItem[]
  isPublished: boolean
  updatedAtMs: number
}

export type PageInput = Pick<ContentPage, 'title' | 'body' | 'items' | 'isPublished'>

export function isPageId(value: string): value is PageId {
  return PAGE_DEFINITIONS.some((page) => page.id === value)
}

export function definitionOf(id: PageId) {
  return PAGE_DEFINITIONS.find((page) => page.id === id) ?? PAGE_DEFINITIONS[0]
}

export type Block =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'list'; items: string[] }

export function parseBody(body: string): Block[] {
  const blocks: Block[] = []
  let paragraph: string[] = []
  let list: string[] = []
  const flushParagraph = () => {
    if (paragraph.length > 0) blocks.push({ type: 'paragraph', text: paragraph.join(' ') })
    paragraph = []
  }
  const flushList = () => {
    if (list.length > 0) blocks.push({ type: 'list', items: list })
    list = []
  }
  for (const raw of body.replace(/\r\n/g, '\n').split('\n')) {
    const line = raw.trim()
    if (!line) {
      flushParagraph()
      flushList()
    } else if (line.startsWith('## ')) {
      flushParagraph()
      flushList()
      blocks.push({ type: 'heading', text: line.slice(3).trim() })
    } else if (line.startsWith('- ')) {
      flushParagraph()
      list.push(line.slice(2).trim())
    } else {
      flushList()
      paragraph.push(line)
    }
  }
  flushParagraph()
  flushList()
  return blocks
}

export type PageErrors = { title?: string; body?: string; items?: string }

export function validatePage(input: PageInput): PageErrors {
  const errors: PageErrors = {}
  if (!input.title.trim()) errors.title = 'Enter a title.'
  else if (input.title.trim().length > 100) errors.title = 'Keep the title under 100 characters.'
  if (input.body.length > 20000) errors.body = 'This is too long. Keep it under 20,000 characters.'
  if (input.items.length > 40) errors.items = 'You can add up to 40 questions.'
  if (input.items.some((item) => !item.question.trim() || !item.answer.trim())) {
    errors.items = 'Fill in both the question and the answer, or remove the empty one.'
  }
  if (input.items.some((item) => item.question.length > 200 || item.answer.length > 2000)) {
    errors.items = 'A question can be up to 200 characters and an answer up to 2,000.'
  }
  if (input.isPublished && !input.body.trim() && input.items.length === 0) {
    errors.body = 'Write something before publishing this page.'
  }
  return errors
}
