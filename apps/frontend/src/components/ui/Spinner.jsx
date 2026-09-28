import clsx from 'clsx'

const SIZES = {
  sm: 'size-3.5 border-[1.5px]',
  md: 'size-5 border-2',
  lg: 'size-7 border-2',
}

export function Spinner({ size = 'md', className }) {
  return (
    <span
      role="status"
      aria-label="Loading"
      className={clsx(
        'inline-block animate-spin rounded-full border-current border-t-transparent text-accent',
        SIZES[size],
        className,
      )}
    />
  )
}
