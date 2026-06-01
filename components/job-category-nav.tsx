'use client';

import { cn } from '@/lib/utils';
import { ALL_CATEGORY_ID, JOB_CATEGORIES } from '@/lib/jobs/categories';

type JobCategoryNavProps = {
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
  variant?: 'horizontal' | 'sidebar';
};

export function JobCategoryNav({
  value,
  onChange,
  disabled,
  variant = 'horizontal',
}: JobCategoryNavProps) {
  const items = [
    { id: ALL_CATEGORY_ID, label: 'All' },
    ...JOB_CATEGORIES.filter((c) => c.id !== 'other'),
  ];

  if (variant === 'sidebar') {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Category
        </p>
        <div className="flex flex-col gap-1">
          {items.map((item) => {
            const active = value === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(item.id)}
                className={cn(
                  'w-full rounded-md border border-transparent px-3 py-2 text-left text-sm font-medium transition-colors',
                  active
                    ? 'border-border bg-card text-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="border-b border-border px-4 py-3 sm:px-5">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">
        {items.map((item) => {
          const active = value === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onChange(item.id)}
              className={cn(
                'filter-chip shrink-0',
                active && 'filter-chip-active'
              )}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
