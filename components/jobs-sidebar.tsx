'use client';

import { memo } from 'react';
import { Loader2, RefreshCw, Search, SlidersHorizontal } from 'lucide-react';
import { ActiveFilters } from '@/components/active-filters';
import { JobCategoryNav } from '@/components/job-category-nav';
import { JobFilters, type JobFilterState } from '@/components/job-filters';
import { JobsPane, JobsPaneHeader } from '@/components/jobs-board-layout';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { filterSidebarSearchClass } from '@/lib/ui-classes';
import type { SourceFacet } from '@/lib/jobs/filters';
import type { FilterSuggestion } from '@/lib/jobs/filter-suggestions';
import { cn } from '@/lib/utils';

type JobsSidebarProps = {
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onSearchSubmit: () => void;
  onClearSearch: () => void;
  searchPending?: boolean;
  appliedSearch: string;
  jobFilters: JobFilterState;
  onFiltersChange: (next: JobFilterState) => void;
  category: string;
  onCategoryChange: (id: string) => void;
  sourceFacets: SourceFacet[];
  jobTypes: string[];
  onFilterSuggestion: (s: FilterSuggestion) => void;
  onClearAll: () => void;
  onRefresh: () => void;
  isLoading: boolean;
  isRefreshing?: boolean;
  boardsLoading?: boolean;
  jobsCount: number;
  className?: string;
  embedded?: boolean;
  /** Inside a resizable panel — fill height, no outer border. */
  resizable?: boolean;
};

export const JobsSidebar = memo(function JobsSidebar({
  searchInput,
  onSearchInputChange,
  onSearchSubmit,
  onClearSearch,
  searchPending = false,
  appliedSearch,
  jobFilters,
  onFiltersChange,
  category,
  onCategoryChange,
  sourceFacets,
  jobTypes,
  onFilterSuggestion,
  onClearAll,
  onRefresh,
  isLoading,
  isRefreshing = false,
  boardsLoading = false,
  jobsCount,
  className,
  embedded = false,
  resizable = false,
}: JobsSidebarProps) {
  const disabled = isLoading && jobsCount === 0;

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSearchSubmit();
    }
  };

  const content = (
    <div className={cn('pb-6', embedded && 'min-h-0')}>
      <div className="space-y-4 px-4 pt-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search roles, companies, skills…"
                value={searchInput}
                onChange={(e) => onSearchInputChange(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                className={filterSidebarSearchClass}
                aria-label="Search jobs"
              />
            </div>
            <Button
              type="button"
              size="icon"
              className="size-9 shrink-0"
              onClick={onSearchSubmit}
              disabled={disabled}
              aria-label="Search jobs"
            >
              <Search className="h-4 w-4" />
            </Button>
          </div>
          {searchPending && (
            <p className="text-[11px] text-muted-foreground">
              Press Search or Enter to run your query
            </p>
          )}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-foreground">Category</p>
          <JobCategoryNav
            variant="sidebar"
            value={category}
            onChange={onCategoryChange}
            disabled={disabled}
          />
        </div>

        <Button
          variant="secondary"
          size="sm"
          className="h-10 w-full rounded-md font-normal"
          onClick={onRefresh}
          disabled={isLoading || isRefreshing}
        >
          {isLoading || isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
          Refresh from job boards
        </Button>
      </div>

      <ActiveFilters
        variant="sidebar"
        search={appliedSearch}
        filters={jobFilters}
        sources={sourceFacets}
        onClearSearch={onClearSearch}
        onChangeFilters={onFiltersChange}
        onClearAll={onClearAll}
      />

      <div className="my-4 px-4">
        <Separator className="opacity-60" />
      </div>

      <JobFilters
        variant="sidebar"
        sources={sourceFacets}
        types={jobTypes}
        value={jobFilters}
        onChange={onFiltersChange}
        onSuggestionSelect={onFilterSuggestion}
        activeSearch={appliedSearch}
        disabled={disabled}
        boardsLoading={boardsLoading}
      />
    </div>
  );

  if (embedded) {
    return (
      <div
        className={cn(
          'min-h-0 overflow-y-auto bg-secondary',
          className
        )}
      >
        {content}
      </div>
    );
  }

  return (
    <JobsPane
      scrollRegion="filters"
      className={cn(
        'h-full min-h-0 bg-secondary',
        resizable
          ? 'border-0'
          : 'border-b border-border lg:border-b-0 lg:border-r',
        className
      )}
      header={
        <JobsPaneHeader className="border-b border-border bg-secondary px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card text-foreground">
              <SlidersHorizontal className="h-4 w-4" aria-hidden />
            </div>
            <div>
              <p className="text-sm font-semibold leading-none text-foreground">Find jobs</p>
              <p className="mt-1 text-xs text-muted-foreground">Search & narrow results</p>
            </div>
          </div>
        </JobsPaneHeader>
      }
    >
      {content}
    </JobsPane>
  );
});
