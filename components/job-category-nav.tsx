'use client';

import { cn } from '@/lib/utils';
import { ALL_CATEGORY_ID, JOB_CATEGORIES } from '@/lib/jobs/categories';

type JobCategoryNavProps = {
  value: string;
  onChange: (categoryId: string) => void;
  disabled?: boolean;
};

export function JobCategoryNav({ value, onChange, disabled }: JobCategoryNavProps) {
  const items = [
    { id: ALL_CATEGORY_ID, label: 'All' },
    ...JOB_CATEGORIES.filter((c) => c.id !== 'other'),
  ];

  return (
    <div className="border-b border-border/60 px-5 py-4 sm:px-7">
      <p className="section-label mb-3">Browse by field</p>
      <div className="relative -mx-1">
        <div className="flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {items.map((item) => {
            const active = value === item.id;
            return (
              <button
                key={item.id}
                type="button"
                disabled={disabled}
                onClick={() => onChange(item.id)}
                className={cn(
                  'filter-chip shrink-0 px-4 py-2 text-sm',
                  active && 'filter-chip-active'
                )}
              >
                {item.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
