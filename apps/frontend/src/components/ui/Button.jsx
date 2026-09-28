import { forwardRef } from 'react'
import clsx from 'clsx'

import { Spinner } from '@/components/ui/Spinner'

const VARIANTS = {
  primary:
    'bg-accent text-[#04141a] hover:bg-accent-strong disabled:hover:bg-accent border border-transparent font-semibold',
  secondary:
    'bg-surface text-ink border border-border hover:border-border-strong hover:bg-surface-hover',
  ghost: 'bg-transparent text-ink-muted hover:text-ink hover:bg-surface border border-transparent',
  danger:
    'bg-status-failed-soft text-status-failed border border-status-failed/30 hover:bg-status-failed/20',
}

const SIZES = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-3.5 text-sm gap-2',
  lg: 'h-10 px-4 text-sm gap-2',
}

export const Button = forwardRef(function Button(
  {
    as: Component = 'button',
    variant = 'secondary',
    size = 'md',
    icon: Icon,
    iconPosition = 'left',
    isLoading = false,
    className,
    children,
    disabled,
    ...props
  },
  ref,
) {
  return (
    <Component
      ref={ref}
      disabled={disabled || isLoading}
      className={clsx(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-base',
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Spinner size="sm" className={variant === 'primary' ? 'text-[#04141a]' : undefined} />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="size-4 shrink-0" />
      )}
      {children && <span>{children}</span>}
      {!isLoading && Icon && iconPosition === 'right' && <Icon className="size-4 shrink-0" />}
    </Component>
  )
})
