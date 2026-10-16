import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { SEO_BY_PATH, DEFAULT_TITLE, canonicalUrl } from '../../seo/routes'

function setMeta(selector: string, create: () => HTMLElement, attr: 'content' | 'href', value: string) {
  let el = document.head.querySelector<HTMLElement>(selector)
  if (!el) { el = create(); document.head.appendChild(el) }
  el.setAttribute(attr, value)
}

const metaByName = (name: string, value: string) =>
  setMeta(`meta[name="${name}"]`, () => { const m = document.createElement('meta'); m.setAttribute('name', name); return m }, 'content', value)
const metaByProperty = (property: string, value: string) =>
  setMeta(`meta[property="${property}"]`, () => { const m = document.createElement('meta'); m.setAttribute('property', property); return m }, 'content', value)

/**
 * Keeps the tab title, description, canonical link and robots tag in step with the current page when
 * people (or Google's renderer) navigate inside the app. The first load of each public page already
 * has the right tags baked into its prerendered HTML; this covers in-app navigation.
 */
export default function RouteSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = SEO_BY_PATH[pathname.replace(/(.)\/$/, '$1')]

    if (!seo) {
      // Signed-in app, sign-in, password reset, unknown URLs: keep them out of search results.
      document.title = DEFAULT_TITLE
      metaByName('robots', 'noindex, nofollow')
      return
    }

    document.title = seo.title
    metaByName('robots', 'index, follow')
    metaByName('description', seo.description)
    setMeta('link[rel="canonical"]', () => { const l = document.createElement('link'); l.setAttribute('rel', 'canonical'); return l }, 'href', canonicalUrl(seo.path))
    metaByProperty('og:title', seo.title)
    metaByProperty('og:description', seo.description)
    metaByProperty('og:url', canonicalUrl(seo.path))
    metaByName('twitter:title', seo.title)
    metaByName('twitter:description', seo.description)
  }, [pathname])

  return null
}
