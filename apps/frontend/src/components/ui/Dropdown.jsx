import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import clsx from 'clsx'

// A small, dependency-free dropdown: trigger renders whatever is
// passed in, the menu is portaled and positioned under the trigger so
// it never gets clipped by an ancestor's overflow-hidden (tables,
// scroll containers, etc - exactly where this gets used most).
export function Dropdown({ trigger, children, align = 'right', className }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState(null)
  const triggerRef = useRef(null)
  const menuRef = useRef(null)

  const close = () => setOpen(false)

  useEffect(() => {
    if (!open) return undefined

    const updatePosition = () => {
      const rect = triggerRef.current?.getBoundingClientRect()
      if (!rect) return
      setCoords({
        top: rect.bottom + window.scrollY + 6,
        left: align === 'right' ? rect.right + window.scrollX : rect.left + window.scrollX,
      })
    }

    updatePosition()

    const handleClickOutside = (event) => {
      if (
        !triggerRef.current?.contains(event.target) &&
        !menuRef.current?.contains(event.target)
      ) {
        close()
      }
    }

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') close()
    }

    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, align])

  return (
    <>
      <div ref={triggerRef} onClick={() => setOpen((current) => !current)}>
        {trigger}
      </div>

      {open &&
        coords &&
        createPortal(
          <div
            ref={menuRef}
            style={{
              position: 'absolute',
              top: coords.top,
              left: align === 'right' ? coords.left : coords.left,
              transform: align === 'right' ? 'translateX(-100%)' : undefined,
            }}
            className={clsx(
              'z-50 min-w-[180px] rounded-md border border-border bg-surface py-1 shadow-panel',
              className,
            )}
          >
            {typeof children === 'function' ? children({ close }) : children}
          </div>,
          document.body,
        )}
    </>
  )
}

export function DropdownItem({ icon: Icon, children, className, danger, ...props }) {
  return (
    <button
      type="button"
      className={clsx(
        'flex w-full items-center gap-2 px-3 py-2 text-left text-sm transition-colors',
        danger ? 'text-status-failed hover:bg-status-failed-soft' : 'text-ink hover:bg-surface-hover',
        className,
      )}
      {...props}
    >
      {Icon && <Icon className="size-4 shrink-0" />}
      {children}
    </button>
  )
}
