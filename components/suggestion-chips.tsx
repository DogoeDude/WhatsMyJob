'use client';

import { cn } from '@/lib/utils';
import type { FilterSuggestion } from '@/lib/jobs/filter-suggestions';
import { filterChipActiveClass, filterChipClass } from '@/lib/ui-classes';

type SuggestionChipsProps = {
  label: string;
  suggestions: FilterSuggestion[];
  activeValues?: { search?: string; location?: string; type?: string };
  onSelect: (suggestion: FilterSuggestion) => void;
  disabled?: boolean;
  className?: string;
  layout?: 'inline' | 'stacked';
  compact?: boolean;
  hideLabel?: boolean;
  maxItems?: number;
  /** Softer pills for the search hero */
  variant?: 'default' | 'search';
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
  compact = false,
  hideLabel = false,
  maxItems,
  variant = 'default',
}: SuggestionChipsProps) {
  const visible =
    maxItems != null && maxItems > 0 ? suggestions.slice(0, maxItems) : suggestions;
  if (visible.length === 0) return null;

  const stacked = layout === 'stacked';
  const searchVariant = variant === 'search';

  return (
    <div
      className={cn(
        stacked ? 'space-y-2' : compact ? 'space-y-2' : 'flex flex-wrap items-center gap-2',
        className
      )}
    >
      {!hideLabel && (
        <span
          className={cn(
            'text-xs font-medium text-muted-foreground',
            stacked && 'text-[11px] uppercase tracking-wider',
            searchVariant && 'font-normal normal-case tracking-normal text-muted-foreground/90'
          )}
        >
          {stacked || compact ? label : `${label}:`}
        </span>
      )}
      <div
        className={cn(
          'flex flex-wrap gap-1.5',
          stacked && 'w-full',
          compact && 'gap-1.5'
        )}
      >
        {visible.map((suggestion, index) => {
          const active = isActive(suggestion, activeValues);
          return (
            <button
              key={`${suggestion.kind}-${suggestion.label}-${index}`}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(suggestion)}
              className={cn(
                searchVariant
                  ? cn(
                      'rounded-lg px-2.5 py-1 text-xs font-medium transition-all',
                      active
                        ? 'bg-foreground text-background shadow-sm'
                        : 'bg-background/80 text-muted-foreground ring-1 ring-border/60 hover:bg-background hover:text-foreground'
                    )
                  : cn(filterChipClass, compact && 'px-2 py-1', active && filterChipActiveClass)
              )}
            >
              {suggestion.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
