'use client';

import { cn } from '@/lib/utils';
import type { FilterSuggestion } from '@/lib/jobs/filter-suggestions';

type SuggestionChipsProps = {
  label: string;
  suggestions: FilterSuggestion[];
  activeValues?: { search?: string; location?: string; type?: string };
  onSelect: (suggestion: FilterSuggestion) => void;
  disabled?: boolean;
  className?: string;
  /** Stacked label above chips (sidebar layout). */
  layout?: 'inline' | 'stacked';
};

function isActive(suggestion: FilterSuggestion, active?: SuggestionChipsProps['activeValues']) {
  if (!active) return false;
  if (suggestion.kind === 'search')
    return active.search?.toLowerCase() === suggestion.label.toLowerCase();
  if (suggestion.kind === 'location')
    return active.location?.toLowerCase() === suggestion.label.toLowerCase();
  if (suggestion.kind === 'type')
    return active.type?.toLowerCase() === suggestion.label.toLowerCase();
  return false;
}

export function SuggestionChips({
  label,
  suggestions,
  activeValues,
  onSelect,
  disabled,
  className,
  layout = 'inline',
}: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;

  const stacked = layout === 'stacked';

  return (
    <div
      className={cn(
        stacked ? 'space-y-2' : 'flex flex-wrap items-center gap-2',
        className
      )}
    >
      <span
        className={cn(
          'text-xs font-medium text-muted-foreground',
          stacked && 'block uppercase tracking-wide'
        )}
      >
        {stacked ? label : `${label}:`}
      </span>
      <div className={cn('flex flex-wrap gap-1.5', stacked && 'w-full')}>
      {suggestions.map((suggestion, index) => {
        const active = isActive(suggestion, activeValues);
        return (
          <button
            key={`${suggestion.kind}-${suggestion.label}-${index}`}
            type="button"
            disabled={disabled}
            onClick={() => onSelect(suggestion)}
            className={cn('filter-chip text-xs disabled:opacity-50', active && 'filter-chip-active')}
          >
            {suggestion.label}
          </button>
        );
      })}
      </div>
    </div>
  );
}
