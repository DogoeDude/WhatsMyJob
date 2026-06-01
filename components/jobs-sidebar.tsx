'use client';

import { Loader2, RefreshCw, Search } from 'lucide-react';
import { ActiveFilters } from '@/components/active-filters';
import { JobCategoryNav } from '@/components/job-category-nav';
import { JobFilters, type JobFilterState } from '@/components/job-filters';
import { JobsPane, JobsPaneHeader } from '@/components/jobs-board-layout';
import { SuggestionChips } from '@/components/suggestion-chips';
import { Button } from '@/components/ui/button';
import { searchInputClass } from '@/lib/ui-classes';
import type { SourceFacet } from '@/lib/jobs/filters';
import type { FilterSuggestion } from '@/lib/jobs/filter-suggestions';
import { cn } from '@/lib/utils';

type JobsSidebarProps = {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  jobFilters: JobFilterState;
  onFiltersChange: (next: JobFilterState) => void;
  category: string;
  onCategoryChange: (id: string) => void;
  sourceFacets: SourceFacet[];
  jobTypes: string[];
  locationSuggestions: string[];
  searchSuggestions: FilterSuggestion[];
  onFilterSuggestion: (s: FilterSuggestion) => void;
  onClearAll: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  jobsCount: number;
  className?: string;
};

export function JobsSidebar({
  searchQuery,
  onSearchChange,
  jobFilters,
  onFiltersChange,
  category,
  onCategoryChange,
  sourceFacets,
  jobTypes,
  locationSuggestions,
  searchSuggestions,
  onFilterSuggestion,
  onClearAll,
  onRefresh,
  isLoading,
  jobsCount,
  className,
}: JobsSidebarProps) {
  const disabled = isLoading && jobsCount === 0;

  return (
    <JobsPane
      className={cn(
        'h-full border-b border-border bg-muted/15 lg:border-b-0 lg:border-r',
        className
      )}
      header={
        <JobsPaneHeader>
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Search & filters
          </span>
        </JobsPaneHeader>
      }
    >
      <div className="space-y-4 p-3">
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            placeholder="Title, company…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className={`w-full ${searchInputClass}`}
          />
        </div>
        <Button
          variant="outline"
          size="sm"
          className="w-full"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh listings
        </Button>

        <SuggestionChips
          label="Suggestions"
          layout="stacked"
          suggestions={searchSuggestions}
          activeValues={{
            search: searchQuery,
            location: jobFilters.location,
            type: jobFilters.type,
          }}
          onSelect={onFilterSuggestion}
          disabled={disabled}
        />

        <JobCategoryNav
          variant="sidebar"
          value={category}
          onChange={onCategoryChange}
          disabled={disabled}
        />

        <ActiveFilters
          variant="sidebar"
          search={searchQuery}
          filters={jobFilters}
          sources={sourceFacets}
          onClearSearch={() => onSearchChange('')}
          onChangeFilters={onFiltersChange}
          onClearAll={onClearAll}
        />

        <JobFilters
          variant="sidebar"
          sources={sourceFacets}
          types={jobTypes}
          locationSuggestions={locationSuggestions}
          value={jobFilters}
          onChange={onFiltersChange}
          onSuggestionSelect={onFilterSuggestion}
          activeSearch={searchQuery}
          disabled={disabled}
        />
      </div>
    </JobsPane>
  );
}
