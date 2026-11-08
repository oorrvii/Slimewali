import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const siteArg = process.argv.slice(2).find((arg) => arg.startsWith('http'))
const projectArg = process.argv.slice(2).find((arg) => arg.startsWith('--project='))

function projectFromEnvFile() {
  for (const file of ['.env.production', '.env.local', '.env']) {
    if (!existsSync(file)) continue
    const match = readFileSync(file, 'utf8').match(/^VITE_FIREBASE_PROJECT_ID=(.+)$/m)
    if (match) return match[1].trim()
  }
  return ''
}

const projectId = projectArg ? projectArg.split('=')[1] : projectFromEnvFile()

if (!siteArg || !projectId) {
  console.error('Usage: npm run sitemap -- https://your-site.web.app [--project=your-project-id]')
  process.exit(1)
}

const site = siteArg.replace(/\/+$/, '')
const endpoint = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery`

async function query(collectionId, fieldPath, value) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      structuredQuery: {
        from: [{ collectionId }],
        where: { fieldFilter: { field: { fieldPath }, op: 'EQUAL', value } },
        limit: 1000,
      },
    }),
  })
  if (!response.ok) throw new Error(`Could not read ${collectionId} (${response.status})`)
  const rows = await response.json()
  return rows.filter((row) => row.document).map((row) => row.document)
}

const escapeXml = (text) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const paths = ['/', '/shop', '/contact']

const pages = await query('content', 'isPublished', { booleanValue: true })
for (const page of pages) {
  const id = page.name.split('/').pop()
  if (id !== 'contact') paths.push(`/${id}`)
}
for (const category of await query('categories', 'isActive', { booleanValue: true })) {
  const slug = category.fields?.slug?.stringValue
  if (slug) paths.push(`/category/${slug}`)
}
for (const product of await query('products', 'status', { stringValue: 'published' })) {
  const slug = product.fields?.slug?.stringValue
  if (slug) paths.push(`/product/${slug}`)
}

const body = paths.map((path) => `  <url><loc>${escapeXml(site + path)}</loc></url>`).join('\n')
writeFileSync('public/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`)
console.log(`Wrote public/sitemap.xml with ${paths.length} addresses. Now run npm run build.`)
