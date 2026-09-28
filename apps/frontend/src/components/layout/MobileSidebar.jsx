import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

import { Sidebar } from '@/components/layout/Sidebar'

export function MobileSidebar({ open, onClose }) {
  if (!open) return null

  return createPortal(
    <div className="fixed inset-0 z-50 flex lg:hidden">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} aria-hidden="true" />
      {/* Any link tapped inside the drawer navigates - close it so the
          new page isn't hidden behind the overlay. */}
      <div
        className="relative flex h-full max-w-[85vw]"
        onClick={(event) => {
          if (event.target.closest('a')) onClose?.()
        }}
      >
        <Sidebar />
        <button
          type="button"
          onClick={onClose}
          aria-label="Close navigation"
          className="absolute right-3 top-3 -mr-10 rounded-md bg-surface p-1.5 text-ink-muted"
        >
          <X className="size-4" />
        </button>
      </div>
    </div>,
    document.body,
  )
}
