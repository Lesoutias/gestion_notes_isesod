import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '../../lib/cn'

export function Modal({ open, onClose, title, children, className, size = 'md' }) {
  useEffect(() => {
    if (!open) return
    function onKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, onClose])

  if (!open) return null

  const sizes = {
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative w-full rounded-2xl border border-white/10 bg-warm-100 shadow-soft',
          sizes[size],
          className,
        )}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 id="modal-title" className="font-display text-lg font-semibold text-ink-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-400 transition-colors hover:bg-white/5 hover:text-ink-700"
            aria-label="Fermer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
