import { forwardRef, useId } from 'react'
import { Check } from 'lucide-react'
import clsx from 'clsx'

export const Checkbox = forwardRef(function Checkbox(
  { label, description, className, id, ...props },
  ref,
) {
  const generatedId = useId()
  const checkboxId = id || generatedId

  return (
    <label htmlFor={checkboxId} className={clsx('flex items-start gap-2.5 cursor-pointer', className)}>
      <span className="relative mt-0.5 flex size-4 shrink-0 items-center justify-center">
        <input
          ref={ref}
          id={checkboxId}
          type="checkbox"
          className="peer size-4 shrink-0 cursor-pointer appearance-none rounded border border-border-strong bg-surface checked:border-accent checked:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          {...props}
        />
        <Check className="pointer-events-none absolute size-3 text-[#04141a] opacity-0 peer-checked:opacity-100" />
      </span>
      {(label || description) && (
        <span className="flex flex-col">
          {label && <span className="text-sm text-ink">{label}</span>}
          {description && <span className="text-xs text-ink-muted">{description}</span>}
        </span>
      )}
    </label>
  )
})
