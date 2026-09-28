import { forwardRef, useId } from 'react'
import clsx from 'clsx'

export const Input = forwardRef(function Input(
  { label, hint, error, icon: Icon, className, id, containerClassName, ...props },
  ref,
) {
  const generatedId = useId()
  const inputId = id || generatedId

  return (
    <div className={clsx('flex flex-col gap-1.5', containerClassName)}>
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-ink">
          {label}
        </label>
      )}

      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        )}
        <input
          ref={ref}
          id={inputId}
          className={clsx(
            'h-9 w-full rounded-md border bg-surface px-3 text-sm text-ink placeholder:text-ink-faint',
            'transition-colors focus:outline-none focus:ring-2 focus:ring-accent/40',
            error ? 'border-status-failed' : 'border-border focus:border-accent',
            Icon && 'pl-9',
            className,
          )}
          aria-invalid={Boolean(error)}
          aria-describedby={error || hint ? `${inputId}-note` : undefined}
          {...props}
        />
      </div>

      {(error || hint) && (
        <p
          id={`${inputId}-note`}
          className={clsx('text-xs', error ? 'text-status-failed' : 'text-ink-muted')}
        >
          {error || hint}
        </p>
      )}
    </div>
  )
})
