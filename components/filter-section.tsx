'use client';

import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/lib/utils';

type FilterSectionProps = {
  title: string;
  description?: string;
  icon?: LucideIcon;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  /** Hide header when wrapped by accordion trigger */
  hideHeader?: boolean;
};

export function FilterSection({
  title,
  description,
  icon: Icon,
  action,
  children,
  className,
  hideHeader = false,
}: FilterSectionProps) {
  return (
    <section className={cn('space-y-3', className)}>
      {!hideHeader && (
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 items-start gap-2">
            {Icon && (
              <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-3.5 w-3.5" aria-hidden />
              </span>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-semibold tracking-tight text-foreground">{title}</h3>
              {description && (
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {description}
                </p>
              )}
            </div>
          </div>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
