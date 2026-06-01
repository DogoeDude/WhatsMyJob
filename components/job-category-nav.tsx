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
