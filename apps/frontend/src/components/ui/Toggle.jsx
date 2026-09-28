import { useId } from 'react'
import clsx from 'clsx'

export function Toggle({ checked, onChange, label, description, disabled, id }) {
  const generatedId = useId()
  const toggleId = id || generatedId

  return (
    <div className="flex items-center justify-between gap-4">
      {(label || description) && (
        <label htmlFor={toggleId} className="flex flex-col cursor-pointer">
          {label && <span className="text-sm text-ink">{label}</span>}
          {description && <span className="text-xs text-ink-muted">{description}</span>}
        </label>
      )}

      <button
        id={toggleId}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange?.(!checked)}
        className={clsx(
          'relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          checked ? 'bg-accent' : 'bg-surface-active',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        <span
          className={clsx(
            'inline-block size-3.5 transform rounded-full bg-[#04141a] transition-transform',
            checked ? 'translate-x-[19px]' : 'translate-x-[3px]',
          )}
        />
      </button>
    </div>
  )
}
