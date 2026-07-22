import { forwardRef } from 'react'
import type { InputHTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

/** Minimal styled text input. */
export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return (
      <input
        ref={ref}
        className={cn(
          'flex w-full rounded border border-gray bg-black px-2 py-1 text-sm text-white placeholder:text-muted-foreground focus:border-primary focus:outline-none',
          className,
        )}
        {...props}
      />
    )
  },
)
