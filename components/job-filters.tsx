'use client';

import { cn } from '@/lib/utils';
import { dedupeStrings } from '@/lib/jobs/utils';
import type { SourceFacet } from '@/lib/jobs/filters';
import {
  mergeLocationSuggestions,
  POPULAR_TYPE_SUGGESTIONS,
  type FilterSuggestion,
} from '@/lib/jobs/filter-suggestions';
import { SuggestionChips } from '@/components/suggestion-chips';
import { selectSurfaceClass } from '@/lib/ui-classes';

export type JobFilterState = {
  sourceIds: string[];
  type: string;
  location: string;
};

type JobFiltersProps = {
  sources: SourceFacet[];
  types: string[];
  locationSuggestions?: string[];
  value: JobFilterState;
  onChange: (next: JobFilterState) => void;
  onSuggestionSelect?: (suggestion: FilterSuggestion) => void;
  disabled?: boolean;
  activeSearch?: string;
  variant?: 'bar' | 'sidebar';
};

export function JobFilters({
  sources,
  types,
  locationSuggestions = [],
  value,
  onChange,
  onSuggestionSelect,
  disabled,
  activeSearch = '',
  variant = 'bar',
}: JobFiltersProps) {
  const sidebar = variant === 'sidebar';
  const toggleSource = (id: string) => {
    const set = new Set(value.sourceIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    onChange({ ...value, sourceIds: [...set] });
  };

  const hasFilters =
    value.sourceIds.length > 0 || value.type !== '' || value.location !== '';

  const locationChips = mergeLocationSuggestions(locationSuggestions, value.location);

  const typeChips: FilterSuggestion[] = POPULAR_TYPE_SUGGESTIONS.filter(
    (s) => !value.type || s.label.toLowerCase() !== value.type.toLowerCase()
  );

  const uniqueTypes = dedupeStrings(
    types.filter((t): t is string => typeof t === 'string'),
    true
  );

  const handleSuggestion = (suggestion: FilterSuggestion) => {
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
      return;
    }
    if (suggestion.kind === 'location') {
      onChange({ ...value, location: suggestion.label });
    } else if (suggestion.kind === 'type') {
      onChange({ ...value, type: suggestion.label });
    }
  };

  return (
    <div
      className={cn(
        'space-y-4',
        sidebar ? 'pt-1' : 'border-b border-border px-4 py-4 sm:px-5'
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p
          className={cn(
            'font-medium text-foreground',
            sidebar ? 'text-xs uppercase tracking-wide text-muted-foreground' : 'text-sm'
          )}
        >
          Filters
        </p>
        {hasFilters && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ sourceIds: [], type: '', location: '' })}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
          >
            Reset
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled={disabled}
          onClick={() => onChange({ ...value, sourceIds: [] })}
          className={cn(
            'filter-chip',
            value.sourceIds.length === 0 && 'filter-chip-active'
          )}
        >
          All sources
        </button>
        {sources.map((source) => {
          const active = value.sourceIds.includes(source.id);
          return (
            <button
              key={source.id}
              type="button"
              disabled={disabled}
              onClick={() => toggleSource(source.id)}
              title={source.website}
              className={cn('filter-chip gap-1.5', active && 'filter-chip-active')}
            >
              {source.name}
              <span className="tabular-nums opacity-70">({source.count})</span>
            </button>
          );
        })}
      </div>

      <SuggestionChips
        label="Type"
        layout={sidebar ? 'stacked' : 'inline'}
        suggestions={typeChips}
        activeValues={{ type: value.type, search: activeSearch, location: value.location }}
        onSelect={handleSuggestion}
        disabled={disabled}
      />

      <div className={cn('grid gap-4', !sidebar && 'sm:grid-cols-2')}>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Job type</span>
          <select
            disabled={disabled}
            value={value.type}
            onChange={(e) => onChange({ ...value, type: e.target.value })}
            className={selectSurfaceClass}
          >
            <option value="">Any</option>
            {uniqueTypes.map((t, index) => (
              <option key={`job-type-${index}-${t}`} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Location</span>
          <input
            type="text"
            disabled={disabled}
            placeholder="Remote, Manila, USA…"
            value={value.location}
            onChange={(e) => onChange({ ...value, location: e.target.value })}
            className={selectSurfaceClass}
          />
        </label>
      </div>

      <SuggestionChips
        label="Location"
        layout={sidebar ? 'stacked' : 'inline'}
        suggestions={locationChips}
        activeValues={{ type: value.type, search: activeSearch, location: value.location }}
        onSelect={handleSuggestion}
        disabled={disabled}
      />
    </div>
  );
}
