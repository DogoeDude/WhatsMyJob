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
}: JobFiltersProps) {
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
    <div className="space-y-5 border-b border-border/60 px-5 py-5 sm:px-7">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="section-label mb-1.5">Filters</p>
          <p className="text-sm font-semibold text-foreground">Job boards & criteria</p>
        </div>
        {hasFilters && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ sourceIds: [], type: '', location: '' })}
            className="text-xs font-semibold text-primary hover:text-primary/80 disabled:opacity-50"
          >
            Reset filters
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
          All boards
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
              <span
                className={cn(
                  'rounded-full px-1.5 py-0.5 text-[10px] font-bold',
                  active ? 'bg-primary-foreground/20' : 'bg-muted text-muted-foreground'
                )}
              >
                {source.count}
              </span>
            </button>
          );
        })}
      </div>

      <SuggestionChips
        label="Popular types"
        suggestions={typeChips}
        activeValues={{ type: value.type, search: activeSearch, location: value.location }}
        onSelect={handleSuggestion}
        disabled={disabled}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Job type</span>
          <select
            disabled={disabled}
            value={value.type}
            onChange={(e) => onChange({ ...value, type: e.target.value })}
            className={selectSurfaceClass}
          >
            <option value="">Any type</option>
            {uniqueTypes.map((t, index) => (
              <option key={`job-type-${index}-${t}`} value={t}>
                {t}
              </option>
            ))}
          </select>
        </label>
        <label className="space-y-2">
          <span className="text-xs font-semibold text-muted-foreground">Location contains</span>
          <input
            type="text"
            disabled={disabled}
            placeholder="e.g. Remote, Manila, USA"
            value={value.location}
            onChange={(e) => onChange({ ...value, location: e.target.value })}
            className={selectSurfaceClass}
          />
        </label>
      </div>

      <SuggestionChips
        label="Locations"
        suggestions={locationChips}
        activeValues={{ type: value.type, search: activeSearch, location: value.location }}
        onSelect={handleSuggestion}
        disabled={disabled}
      />
    </div>
  );
}
