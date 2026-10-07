import { useEffect, useRef } from 'react'
import articleContent from '../data/articles.json'

type Article = {
  id: string
  title: string
  date: string
  summary: string
  body: string
  status: 'published' | 'coming-soon'
  badge?: string
  byline?: string
  dateline?: string
  weather?: string
}

const articles = articleContent.items as Article[]

export function ArticleReader({ articleId, onClose, onSelectArticle }: {
  articleId: string
  onClose: () => void
  onSelectArticle: (id: string) => void
}) {
  const dialogRef = useRef<HTMLElement>(null)
  const closeButtonRef = useRef<HTMLButtonElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const articleIndex = articles.findIndex((article) => article.id === articleId)
  const article = articles[articleIndex] ?? articles[0]

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus())

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        onSelectArticle(articles[(articleIndex - 1 + articles.length) % articles.length].id)
      } else if (event.key === 'ArrowRight') {
        event.preventDefault()
        onSelectArticle(articles[(articleIndex + 1) % articles.length].id)
      }
      if (event.key !== 'Tab' || !dialogRef.current) return

      const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>(
        'button:not(:disabled), a[href]',
      ))
      if (focusable.length === 0) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.cancelAnimationFrame(focusFrame)
      document.removeEventListener('keydown', handleKeyDown)
      if (previousFocusRef.current?.isConnected) previousFocusRef.current.focus()
    }
  }, [articleIndex, onClose, onSelectArticle])

  const selectRelativeArticle = (direction: -1 | 1) => {
    onSelectArticle(articles[(articleIndex + direction + articles.length) % articles.length].id)
  }

  return (
    <div className="newspaper-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
      <article ref={dialogRef} className="newspaper-reader" role="dialog" aria-modal="true" aria-labelledby="newspaper-article-title" tabIndex={-1}>
        <div className="newspaper-reader-topline">
          <span>{articleContent.masthead}</span>
          <span>EDITION {String(articleIndex + 1).padStart(2, '0')} / {article.date}</span>
          <button ref={closeButtonRef} type="button" className="newspaper-close" onClick={onClose} aria-label="Close newspaper">X</button>
        </div>

        {article.status === 'published' ? (
          <>
            <header className="newspaper-article-heading">
              <div className="newspaper-dateline"><span>{article.dateline}</span><span>{article.date}</span></div>
              <span className="newspaper-satire-badge">{article.badge}</span>
              <h1 id="newspaper-article-title">{article.title}</h1>
              <p className="newspaper-byline">{article.byline}</p>
            </header>
            <div className="newspaper-article-layout">
              <div className="newspaper-story">
                <p className="newspaper-summary">{article.summary}</p>
                <div className="newspaper-body">
                  {article.body.split(/\n\s*\n/).map((paragraph, index) => (
                    <p key={`${article.id}-${index}`}>{paragraph}</p>
                  ))}
                </div>
              </div>
              <aside className="newspaper-weather">
                <span>WEATHER DESK</span>
                <p>{article.weather}</p>
                <small>FORECAST: ENTIRELY FICTIONAL</small>
              </aside>
            </div>
          </>
        ) : (
          <div className="newspaper-coming-soon" role="status" aria-live="polite">
            <span>STILL BEING PRINTED</span>
            <h1 id="newspaper-article-title">{article.title}</h1>
            <p>{article.body}</p>
          </div>
        )}

        <nav className="newspaper-reader-navigation" aria-label="Newspaper navigation">
          <button type="button" onClick={() => selectRelativeArticle(-1)}>&larr; PREVIOUS</button>
          <span>{articleIndex + 1} / {articles.length}</span>
          <button type="button" onClick={() => selectRelativeArticle(1)}>NEXT &rarr;</button>
        </nav>
      </article>
    </div>
  )
}
