import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring/60 focus-visible:ring-offset-2 focus-visible:ring-offset-background active:scale-[0.98] aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        default:
          'bg-primary text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/92 hover:shadow-lg hover:shadow-primary/30 dark:shadow-primary/20',
        destructive:
          'bg-destructive text-white shadow-md shadow-destructive/20 hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:bg-destructive/85',
        outline:
          'border border-border/70 bg-card/90 text-foreground shadow-sm hover:border-accent/35 hover:bg-accent/5 hover:text-accent dark:bg-card/50 dark:hover:bg-accent/10',
        secondary:
          'border border-border/50 bg-secondary/80 text-secondary-foreground shadow-sm hover:bg-secondary hover:border-border',
        ghost:
          'text-muted-foreground hover:bg-muted/80 hover:text-foreground',
        link: 'text-primary font-medium underline-offset-4 shadow-none hover:underline active:scale-100',
      },
      size: {
        default: 'h-10 px-4 py-2 has-[>svg]:px-3.5',
        sm: 'h-9 gap-1.5 rounded-lg px-3.5 text-[13px] has-[>svg]:px-3',
        lg: 'h-11 rounded-xl px-6 text-base has-[>svg]:px-5',
        icon: 'size-10 rounded-xl',
        'icon-sm': 'size-9 rounded-lg',
        'icon-lg': 'size-11 rounded-xl',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
