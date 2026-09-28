import { forwardRef, useId } from 'react'
import { ChevronDown } from 'lucide-react'
import clsx from 'clsx'

export const Select = forwardRef(function Select(
  { label, hint, error, options = [], className, id, containerClassName, ...props },
  ref,
) {
  const generatedId = useId()
  const selectId = id || generatedId

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={selectId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}

      <div className="relative">
        <select
          ref={ref}
          id={selectId}
          className={clsx(
            'h-9 w-full appearance-none rounded-md border bg-surface px-3 pr-9 text-sm text-ink',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40',
            error ? 'border-status-failed' : 'border-border focus:border-accent',
            className,
          )}
          aria-invalid={Boolean(error)}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
      </div>

      {(error || hint) && (
        <p className={clsx('text-xs', error ? 'text-status-failed' : 'text-ink-muted')}>
          {error || hint}
        </p>
      )}
    </div>
  )
})
