'use client';

import { cn } from '@/lib/utils';
import { ALL_CATEGORY_ID, JOB_CATEGORIES } from '@/lib/jobs/categories';
import { getCategoryIcon } from '@/lib/jobs/category-icons';
import { HorizontalScrollRow } from '@/components/horizontal-scroll-row';
import { filterChipActiveClass, filterChipClass } from '@/lib/ui-classes';

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
    { id: ALL_CATEGORY_ID, label: 'All jobs' },
    ...JOB_CATEGORIES.filter((c) => c.id !== 'other'),
  ];

  const buttons = items.map((item) => {
    const active = value === item.id;
    const Icon = variant === 'sidebar' ? getCategoryIcon(item.id) : null;
    return (
      <button
        key={item.id}
        type="button"
        disabled={disabled}
        onClick={() => onChange(item.id)}
        className={cn(
          'flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all',
          variant === 'sidebar'
            ? active
              ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
              : 'bg-muted/40 text-muted-foreground ring-1 ring-border/50 hover:bg-muted hover:text-foreground'
            : cn(filterChipClass, active && filterChipActiveClass)
        )}
        role="tab"
        aria-selected={active}
      >
        {Icon && <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden />}
        {item.label}
      </button>
    );
  });

  if (variant === 'sidebar') {
    return (
      <div role="tablist" aria-label="Job categories">
        <HorizontalScrollRow>{buttons}</HorizontalScrollRow>
      </div>
    );
  }

  return (
    <div className="border-b border-border px-4 py-3 sm:px-5">
      <div className="flex gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:thin]">{buttons}</div>
    </div>
  );
}
