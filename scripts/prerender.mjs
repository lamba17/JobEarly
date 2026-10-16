// Build step: turn the public pages into real HTML so search engines (and link previews) see actual
// content instead of an empty <div id="root">. Runs after `vite build`.
//
// Safety first: this must never be able to break a deploy or the site.
//  - dist/200.html (the plain app shell, used for every non-prerendered URL) is written FIRST.
//  - Every later step is wrapped: if anything fails we log a warning and the site simply stays a
//    normal client-rendered app.
import fs from 'node:fs'
import path from 'node:path'
import { execSync } from 'node:child_process'
import { pathToFileURL } from 'node:url'

const root = process.cwd()
const dist = path.join(root, 'dist')
const indexPath = path.join(dist, 'index.html')
const SHELL_MARK = '<div id="root"></div>'

const esc = s => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
const setTag = (html, re, tag) => (re.test(html) ? html.replace(re, tag) : html.replace('</head>', `    ${tag}\n  </head>`))

async function main() {
  if (!fs.existsSync(indexPath)) { console.warn('[prerender] dist/index.html not found, skipping'); return }
  const template = fs.readFileSync(indexPath, 'utf8')
  if (!template.includes(SHELL_MARK)) { console.warn('[prerender] dist/index.html is already prerendered, skipping'); return }

  // 1) The plain SPA shell, used by vercel.json for every URL that has no prerendered file.
  fs.writeFileSync(path.join(dist, '200.html'), template)

  // 2) Build the server bundle and load it.
  try {
    execSync('npx vite build --ssr src/entry-server.tsx --outDir dist-ssr', { stdio: 'inherit', cwd: root })
  } catch (e) {
    console.warn('[prerender] SSR build failed; the site stays client-rendered.', e.message)
    return
  }
  let mod
  try {
    mod = await import(pathToFileURL(path.join(root, 'dist-ssr', 'entry-server.js')).href)
  } catch (e) {
    console.warn('[prerender] could not load the SSR bundle; the site stays client-rendered.', e.message)
    return
  }
  const { render, SEO_ROUTES, SITE_URL, OG_IMAGE, homeJsonLd } = mod
  const urlFor = p => (p === '/' ? `${SITE_URL}/` : `${SITE_URL}${p}`)

  // 3) One static HTML file per public page.
  let ok = 0
  for (const r of SEO_ROUTES) {
    try {
      const body = render(r.path)
      const url = urlFor(r.path)
      let html = template.replace(SHELL_MARK, `<div id="root">${body}</div>`)
      html = setTag(html, /<title>[\s\S]*?<\/title>/, `<title>${esc(r.title)}</title>`)
      html = setTag(html, /<meta name="description"[^>]*>/, `<meta name="description" content="${esc(r.description)}" />`)
      html = setTag(html, /<link rel="canonical"[^>]*>/, `<link rel="canonical" href="${url}" />`)
      html = setTag(html, /<meta property="og:url"[^>]*>/, `<meta property="og:url" content="${url}" />`)
      html = setTag(html, /<meta property="og:title"[^>]*>/, `<meta property="og:title" content="${esc(r.title)}" />`)
      html = setTag(html, /<meta property="og:description"[^>]*>/, `<meta property="og:description" content="${esc(r.description)}" />`)
      html = setTag(html, /<meta name="twitter:title"[^>]*>/, `<meta name="twitter:title" content="${esc(r.title)}" />`)
      html = setTag(html, /<meta name="twitter:description"[^>]*>/, `<meta name="twitter:description" content="${esc(r.description)}" />`)
      html = setTag(html, /<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${OG_IMAGE}" />`)
      if (r.path === '/') {
        const json = JSON.stringify(homeJsonLd()).replace(/</g, '\\u003c')
        html = html.replace('</head>', `    <script type="application/ld+json">${json}</script>\n  </head>`)
      }
      const out = r.path === '/' ? indexPath : path.join(dist, r.path.slice(1), 'index.html')
      fs.mkdirSync(path.dirname(out), { recursive: true })
      fs.writeFileSync(out, html)
      ok++
    } catch (e) {
      console.warn(`[prerender] ${r.path} failed (left client-rendered):`, e.message)
    }
  }

  // 4) sitemap.xml, always in step with the page list above.
  try {
    const today = new Date().toISOString().slice(0, 10)
    const urls = SEO_ROUTES.map(r => `  <url>\n    <loc>${urlFor(r.path)}</loc>\n    <lastmod>${today}</lastmod>\n    <priority>${r.priority.toFixed(1)}</priority>\n  </url>`).join('\n')
    fs.writeFileSync(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`)
  } catch (e) {
    console.warn('[prerender] sitemap failed:', e.message)
  }

  console.log(`[prerender] ${ok}/${SEO_ROUTES.length} pages prerendered`)
}

main()
  .catch(e => console.warn('[prerender] unexpected error; the site stays client-rendered.', e))
  // The Supabase client opens a timer when it loads; don't let it keep the build process alive.
  .finally(() => process.exit(0))
