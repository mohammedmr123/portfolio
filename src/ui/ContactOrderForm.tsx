import { useEffect, useRef, useState } from 'react'
import type { FormEvent, KeyboardEvent as ReactKeyboardEvent } from 'react'
import contactContent from '../data/contact.json'
import profile from '../data/profile.json'

type FormStatus = 'idle' | 'loading' | 'success' | 'fallback' | 'error'

export function ContactOrderForm({ onClose, onOrderSent }: { onClose: () => void; onOrderSent: () => void }) {
  const dialogRef = useRef<HTMLElement>(null)
  const previousFocusRef = useRef<HTMLElement | null>(null)
  const [status, setStatus] = useState<FormStatus>('idle')
  const [form, setForm] = useState({ name: '', email: '', message: '', spice: 'mild', website: '' })
  const [validationMessage, setValidationMessage] = useState('')
  const [rateLimitMessage, setRateLimitMessage] = useState('')

  useEffect(() => {
    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const dialog = dialogRef.current
    const focusFirstField = window.requestAnimationFrame(() => {
      dialog?.querySelector<HTMLInputElement>('input[name="name"]')?.focus()
    })

    const handleKeyDown = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onClose()
        return
      }
      if (event.key !== 'Tab' || !dialog) return

      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(
        'a[href], button:not(:disabled), input:not(:disabled):not([tabindex="-1"]), textarea:not(:disabled), select:not(:disabled)',
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
      window.cancelAnimationFrame(focusFirstField)
      document.removeEventListener('keydown', handleKeyDown)
      previousFocusRef.current?.focus()
    }
  }, [onClose])

  const emailAddress = profile.socials.find((social) => social.id === 'email')?.url.replace(/^mailto:/, '') ?? ''
  const selectedSpice = contactContent.ticket.spiceLevels.find(({ id }) => id === form.spice) ?? contactContent.ticket.spiceLevels[0]
  const emailSubject = `Portfolio message from ${form.name.trim() || 'a visitor'}`
  const emailBody = [
    `Name: ${form.name.trim()}`,
    `Email: ${form.email.trim()}`,
    `Spice level: ${selectedSpice.label} - ${selectedSpice.meaning}`,
    '',
    form.message.trim(),
  ].join('\n')
  const mailtoUrl = `mailto:${emailAddress}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`

  const updateField = (field: 'name' | 'email' | 'message' | 'spice' | 'website', value: string) => {
    setForm((previous) => ({ ...previous, [field]: value }))
    setValidationMessage('')
    setRateLimitMessage('')
  }

  const submitOrder = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setValidationMessage('')
    setRateLimitMessage('')

    if (form.website.trim()) {
      setStatus('fallback')
      return
    }
    if (form.message.trim().length === 0) {
      setValidationMessage(contactContent.ticket.messageRequired)
      return
    }
    if (form.message.trim().length > contactContent.ticket.messageLimit) {
      setValidationMessage(contactContent.ticket.messageTooLong.replace('{limit}', String(contactContent.ticket.messageLimit)))
      return
    }

    const now = Date.now()
    const rateLimitKey = 'marzaq-contact-last-submit'
    try {
      const lastSubmit = Number(window.sessionStorage.getItem(rateLimitKey) ?? 0)
      const elapsed = now - lastSubmit
      if (lastSubmit > 0 && elapsed < contactContent.ticket.rateLimitMs) {
        const seconds = Math.ceil((contactContent.ticket.rateLimitMs - elapsed) / 1000)
        setRateLimitMessage(contactContent.ticket.rateLimit.replace('{seconds}', String(seconds)))
        setStatus('error')
        return
      }
      window.sessionStorage.setItem(rateLimitKey, String(now))
    } catch {
      // Continue if browser storage is unavailable.
    }

    const endpoint = import.meta.env.VITE_FORM_ENDPOINT?.trim()
    if (!endpoint) {
      setStatus('fallback')
      return
    }

    setStatus('loading')
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          _replyto: form.email.trim(),
          _subject: emailSubject,
          message: `[Spice level: ${selectedSpice.label} - ${selectedSpice.meaning}]\n\n${form.message.trim()}`,
        }),
      })
      if (!response.ok) throw new Error('Contact endpoint rejected the order')
      setStatus('success')
      onOrderSent()
    } catch {
      setStatus('fallback')
    }
  }

  const handleBackdropKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape') onClose()
  }

  return (
    <div className="contact-overlay" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }} onKeyDown={handleBackdropKeyDown}>
      <section ref={dialogRef} className="contact-ticket" role="dialog" aria-modal="true" aria-labelledby="contact-ticket-title" tabIndex={-1}>
        <div className="contact-ticket-topline">
          <span>{contactContent.ticket.eyebrow}</span>
          <button className="contact-ticket-close" type="button" onClick={onClose} aria-label="Close contact order">X</button>
        </div>
        <div className="contact-ticket-heading">
          <span aria-hidden="true">NO. 001</span>
          <h2 id="contact-ticket-title">{contactContent.ticket.title}</h2>
          <p>{contactContent.ticket.intro}</p>
        </div>

        {status === 'success' ? (
          <div className="contact-result contact-result-success" role="status" aria-live="polite">
            <span className="contact-result-stamp">RECEIVED</span>
            <p>{contactContent.ticket.success}</p>
            <button type="button" className="contact-submit" onClick={onClose}>{contactContent.ticket.back}</button>
          </div>
        ) : (
          <form className="contact-order-form" onSubmit={submitOrder}>
            <label>
              <span>{contactContent.ticket.nameLabel}</span>
              <input autoFocus autoComplete="name" name="name" maxLength={100} required value={form.name} placeholder={contactContent.ticket.namePlaceholder} onChange={(event) => updateField('name', event.target.value)} />
            </label>
            <label>
              <span>{contactContent.ticket.emailLabel}</span>
              <input autoComplete="email" name="email" type="email" maxLength={254} required value={form.email} placeholder={contactContent.ticket.emailPlaceholder} onChange={(event) => updateField('email', event.target.value)} />
            </label>
            <label>
              <span>{contactContent.ticket.messageLabel}<small>{form.message.trim().length}/{contactContent.ticket.messageLimit}</small></span>
              <textarea name="message" required maxLength={contactContent.ticket.messageLimit} rows={4} value={form.message} placeholder={contactContent.ticket.messagePlaceholder} onChange={(event) => updateField('message', event.target.value)} />
            </label>
            <label>
              <span>{contactContent.ticket.spiceLabel}</span>
              <select name="spice" value={form.spice} onChange={(event) => updateField('spice', event.target.value)}>
                {contactContent.ticket.spiceLevels.map((level) => (
                  <option key={level.id} value={level.id}>{level.label} - {level.meaning}</option>
                ))}
              </select>
            </label>
            <label className="contact-honeypot" aria-hidden="true">
              <span>{contactContent.ticket.honeypotLabel}</span>
              <input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(event) => updateField('website', event.target.value)} />
            </label>
            {(validationMessage || rateLimitMessage) && <p className="contact-form-error" role="alert">{validationMessage || rateLimitMessage}</p>}
            {status === 'fallback' && (
              <div className="contact-result contact-result-fallback" role="status" aria-live="polite">
                <p>{contactContent.ticket.fallback}</p>
                <a className="contact-submit contact-mailto-fallback" href={mailtoUrl}>{contactContent.ticket.mailtoLabel}</a>
              </div>
            )}
            <div className="contact-ticket-actions">
              <button className="contact-ticket-back" type="button" onClick={onClose}>&larr; {contactContent.ticket.back}</button>
              <button className="contact-submit" type="submit" disabled={status === 'loading'}>
                {status === 'loading' ? contactContent.ticket.loading : contactContent.ticket.submit}
              </button>
            </div>
          </form>
        )}
        <div className="contact-ticket-footer"><span>THANK YOU FOR SUPPORTING LOCAL NOODLES</span><span>FES / MM</span></div>
      </section>
    </div>
  )
}