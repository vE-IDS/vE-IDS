import type { ButtonHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'secondary'
type Size = 'sm' | 'md'

/** Minimal button with the small subset of variants/sizes the slice needs. */
export function Button({
  className,
  variant = 'default',
  size = 'md',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={cn(
        'inline-flex cursor-pointer items-center justify-center rounded font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
        size === 'sm' ? 'h-8 px-2 text-xs' : 'h-9 px-3 text-sm',
        variant === 'secondary' ? 'bg-secondary text-secondary-foreground hover:bg-gray' : 'bg-primary text-primary-foreground hover:opacity-90',
        className,
      )}
      {...props}
    />
  )
}
