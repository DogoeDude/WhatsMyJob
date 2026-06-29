'use client';

import { Sparkles, X } from 'lucide-react';
import type { SourceFacet } from '@/lib/jobs/filters';
import type { JobFilterState } from '@/components/job-filters';
import { cn } from '@/lib/utils';

type ActiveFiltersProps = {
  search: string;
  filters: JobFilterState;
  sources: SourceFacet[];
  onClearSearch: () => void;
  onChangeFilters: (next: JobFilterState) => void;
  onClearAll: () => void;
  variant?: 'bar' | 'sidebar';
};

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex max-w-full items-center gap-1 rounded-full bg-background/90 py-0.5 pr-1 pl-2.5 text-xs font-medium text-foreground shadow-sm ring-1 ring-border/70">
      <span className="truncate">{label}</span>
      <button
        type="button"
        onClick={onRemove}
        className="rounded-full p-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`Remove ${label}`}
      >
        <X className="h-3 w-3" />
      </button>
    </span>
  );
}

export function ActiveFilters({
  search,
  filters,
  sources,
  onClearSearch,
  onChangeFilters,
  onClearAll,
  variant = 'bar',
}: ActiveFiltersProps) {
  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));
  const hasSearch = search.trim().length > 0;
  const hasAny =
    hasSearch ||
    filters.sourceIds.length > 0 ||
    filters.type !== '' ||
    filters.location !== '';

  if (!hasAny) return null;

  const pills = (
    <>
      {hasSearch && <FilterPill label={search.trim()} onRemove={onClearSearch} />}
      {filters.sourceIds.map((id) => (
        <FilterPill
          key={id}
          label={sourceNames.get(id) ?? id}
          onRemove={() =>
            onChangeFilters({
              ...filters,
              sourceIds: filters.sourceIds.filter((s) => s !== id),
            })
          }
        />
      ))}
      {filters.type && (
        <FilterPill
          label={filters.type}
          onRemove={() => onChangeFilters({ ...filters, type: '' })}
        />
      )}
      {filters.location && (
        <FilterPill
          label={filters.location}
          onRemove={() => onChangeFilters({ ...filters, location: '' })}
        />
      )}
    </>
  );

  if (variant === 'sidebar') {
    return (
      <div className="mx-4 rounded-lg border border-border bg-secondary p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground">
            <Sparkles className="h-3.5 w-3.5" aria-hidden />
            Applied
          </span>
          <button
            type="button"
            onClick={onClearAll}
            className="rounded-md px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-background/60 hover:text-foreground"
          >
            Clear all
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">{pills}</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-2.5 sm:px-5">
      <span className="text-xs text-muted-foreground">Active:</span>
      {pills}
      <button
        type="button"
        onClick={onClearAll}
        className={cn(
          'ml-auto text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline'
        )}
      >
        Clear all
      </button>
    </div>
  );
}
