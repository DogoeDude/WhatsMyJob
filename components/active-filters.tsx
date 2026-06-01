'use client';

import { X } from 'lucide-react';
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
};

function FilterPill({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-border bg-muted px-2 py-1 text-xs text-foreground">
      {label}
      <button
        type="button"
        onClick={onRemove}
        className="rounded p-0.5 hover:bg-background"
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
}: ActiveFiltersProps) {
  const sourceNames = new Map(sources.map((s) => [s.id, s.name]));
  const hasSearch = search.trim().length > 0;
  const hasAny =
    hasSearch ||
    filters.sourceIds.length > 0 ||
    filters.type !== '' ||
    filters.location !== '';

  if (!hasAny) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-border bg-muted/20 px-4 py-2.5 sm:px-5">
      <span className="text-xs text-muted-foreground">Active:</span>
      {hasSearch && (
        <FilterPill label={`"${search.trim()}"`} onRemove={onClearSearch} />
      )}
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
