'use client';

import { Briefcase, Globe2, Layers, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { dedupeStrings } from '@/lib/jobs/utils';
import type { SourceFacet } from '@/lib/jobs/filters';
import { POPULAR_TYPE_SUGGESTIONS, type FilterSuggestion } from '@/lib/jobs/filter-suggestions';
import { FilterSection } from '@/components/filter-section';
import { SuggestionChips } from '@/components/suggestion-chips';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  filterChipActiveClass,
  filterChipClass,
  filterPanelClass,
  filterSidebarInputClass,
  selectSurfaceClass,
} from '@/lib/ui-classes';

export type JobFilterState = {
  sourceIds: string[];
  type: string;
  location: string;
};

type JobFiltersProps = {
  sources: SourceFacet[];
  types: string[];
  value: JobFilterState;
  onChange: (next: JobFilterState) => void;
  onSuggestionSelect?: (suggestion: FilterSuggestion) => void;
  disabled?: boolean;
  activeSearch?: string;
  variant?: 'bar' | 'sidebar';
};

function SourceRow({
  label,
  count,
  checked,
  disabled,
  onCheckedChange,
}: {
  label: string;
  count?: number;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label
      className={cn(
        'flex cursor-pointer items-center gap-3 rounded-lg px-2 py-2 transition-colors',
        checked ? 'bg-primary/8' : 'hover:bg-muted/50',
        disabled && 'cursor-not-allowed opacity-50'
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange(v === true)}
      />
      <span className="min-w-0 flex-1 truncate text-sm text-foreground">{label}</span>
      {count != null && (
        <span className="shrink-0 rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
          {count}
        </span>
      )}
    </label>
  );
}

export function JobFilters({
  sources,
  types,
  value,
  onChange,
  onSuggestionSelect,
  disabled,
  activeSearch = '',
  variant = 'bar',
}: JobFiltersProps) {
  const sidebar = variant === 'sidebar';
  const toggleSource = (id: string, checked: boolean) => {
    const set = new Set(value.sourceIds);
    if (checked) set.add(id);
    else set.delete(id);
    onChange({ ...value, sourceIds: [...set] });
  };

  const hasFilters =
    value.sourceIds.length > 0 || value.type !== '' || value.location !== '';

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

  const resetFilters = () => onChange({ sourceIds: [], type: '', location: '' });

  const sourceListSidebar = (
    <ScrollArea className="h-[min(11rem,40vh)] pr-2">
      <div className="space-y-0.5">
        <SourceRow
          label="All job boards"
          checked={value.sourceIds.length === 0}
          disabled={disabled}
          onCheckedChange={(checked) => {
            if (checked) onChange({ ...value, sourceIds: [] });
          }}
        />
        {sources.map((source) => (
          <SourceRow
            key={source.id}
            label={source.name}
            count={source.count}
            checked={value.sourceIds.includes(source.id)}
            disabled={disabled}
            onCheckedChange={(checked) => toggleSource(source.id, checked)}
          />
        ))}
      </div>
    </ScrollArea>
  );

  const typeField = (
    <div className="space-y-3">
      {sidebar && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange({ ...value, type: '' })}
            className={cn(
              filterChipClass,
              !value.type && filterChipActiveClass
            )}
          >
            Any
          </button>
          {typeChips.map((suggestion, index) => {
            const active =
              value.type.toLowerCase() === suggestion.label.toLowerCase();
            return (
              <button
                key={`type-quick-${index}`}
                type="button"
                disabled={disabled}
                onClick={() => handleSuggestion(suggestion)}
                className={cn(filterChipClass, active && filterChipActiveClass)}
              >
                {suggestion.label}
              </button>
            );
          })}
        </div>
      )}
      <select
        disabled={disabled}
        value={value.type}
        onChange={(e) => onChange({ ...value, type: e.target.value })}
        className={cn(selectSurfaceClass, sidebar && 'rounded-xl bg-muted/30 ring-1 ring-border/50')}
        aria-label="Job type"
      >
        <option value="">All types from listings</option>
        {uniqueTypes.map((t, index) => (
          <option key={`job-type-${index}-${t}`} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );

  const locationField = (
    <div className="relative">
      <MapPin
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden
      />
      <input
        type="text"
        disabled={disabled}
        placeholder="Remote, city, country…"
        value={value.location}
        onChange={(e) => onChange({ ...value, location: e.target.value })}
        className={cn(filterSidebarInputClass, 'pl-9')}
        aria-label="Location filter"
      />
    </div>
  );

  if (sidebar) {
    const boardCount =
      value.sourceIds.length === 0 ? 'All' : String(value.sourceIds.length);

    return (
      <div className="space-y-5 px-4 pb-4">
        <FilterSection
          title="Job boards"
          icon={Layers}
          description="Choose which sources to include"
          action={
            hasFilters ? (
              <button
                type="button"
                disabled={disabled}
                onClick={resetFilters}
                className="shrink-0 text-[11px] font-medium text-muted-foreground hover:text-foreground"
              >
                Reset
              </button>
            ) : (
              <span className="rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-medium tabular-nums text-muted-foreground">
                {boardCount}
              </span>
            )
          }
        >
          <div className={filterPanelClass}>
            {sources.length === 0 ? (
              <p className="py-3 text-center text-xs text-muted-foreground">
                Job board list loads with listings…
              </p>
            ) : (
              sourceListSidebar
            )}
          </div>
        </FilterSection>

        <Separator className="opacity-50" />

        <FilterSection title="Job type" icon={Briefcase} description="Employment type">
          {typeField}
        </FilterSection>

        <FilterSection title="Location" icon={Globe2} description="Where you want to work">
          {locationField}
        </FilterSection>
      </div>
    );
  }

  const sourceListBar = (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange({ ...value, sourceIds: [] })}
        className={cn(filterChipClass, value.sourceIds.length === 0 && filterChipActiveClass)}
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
            onClick={() => toggleSource(source.id, !active)}
            title={source.website}
            className={cn(filterChipClass, 'gap-1.5', active && filterChipActiveClass)}
          >
            {source.name}
            <span className="tabular-nums opacity-70">({source.count})</span>
          </button>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-4 border-b border-border px-4 py-4 sm:px-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Filters</p>
        {hasFilters && (
          <button
            type="button"
            disabled={disabled}
            onClick={resetFilters}
            className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline disabled:opacity-50"
          >
            Reset
          </button>
        )}
      </div>
      {sourceListBar}
      <SuggestionChips
        label="Type"
        layout="inline"
        suggestions={typeChips}
        activeValues={{ type: value.type, search: activeSearch, location: value.location }}
        onSelect={handleSuggestion}
        disabled={disabled}
      />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Job type</span>
          {typeField}
        </label>
        <label className="space-y-1.5">
          <span className="text-xs font-medium text-muted-foreground">Location</span>
          {locationField}
        </label>
      </div>
    </div>
  );
}
