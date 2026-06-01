'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { JobCard } from '@/components/job-card';
import { JobDetailPanel } from '@/components/job-detail-panel';
import { type JobFilterState } from '@/components/job-filters';
import { JobSections } from '@/components/job-sections';
import { JobsPane, JobsPaneHeader } from '@/components/jobs-board-layout';
import { JobsSidebar } from '@/components/jobs-sidebar';
import { PageContent, PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { ALL_CATEGORY_ID } from '@/lib/jobs/categories';
import { PAGE_SIZE, SEARCH_JOB_LIMIT } from '@/lib/jobs/limits';
import {
  POPULAR_SEARCH_SUGGESTIONS,
  type FilterSuggestion,
} from '@/lib/jobs/filter-suggestions';
import type { SourceFacet } from '@/lib/jobs/filters';
import type { Job } from '@/lib/jobs/types';
import { Briefcase, SearchX, Loader2, SlidersHorizontal } from 'lucide-react';

type JobsResponse = {
  jobs: Job[];
  totalMatching?: number;
  hasMore?: boolean;
  offset?: number;
  sources?: SourceFacet[];
  types?: string[];
  locationSuggestions?: string[];
  mode?: 'database' | 'live';
  message?: string;
  error?: string;
  detail?: string;
};

const defaultFilters: JobFilterState = {
  sourceIds: [],
  type: '',
  location: '',
};

function mergeJobs(existing: Job[], incoming: Job[]): Job[] {
  const seen = new Set(existing.map((j) => j.id));
  const out = [...existing];
  for (const job of incoming) {
    if (seen.has(job.id)) continue;
    seen.add(job.id);
    out.push(job);
  }
  return out;
}

export function JobsHome() {
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [jobFilters, setJobFilters] = useState<JobFilterState>(defaultFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<JobFilterState>(defaultFilters);
  const [category, setCategory] = useState(ALL_CATEGORY_ID);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [totalMatching, setTotalMatching] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [sourceFacets, setSourceFacets] = useState<SourceFacet[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const jobsCountRef = useRef(0);
  jobsCountRef.current = jobs.length;
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedFilters(jobFilters), 300);
    return () => clearTimeout(t);
  }, [jobFilters]);

  const fetchJobs = useCallback(
    async (
      q: string,
      filters: JobFilterState,
      cat: string,
      offset: number,
      append: boolean,
      liveRefresh = false
    ) => {
      if (append) {
        setIsLoadingMore(true);
      } else if (jobsCountRef.current === 0) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      if (!append) {
        setError(null);
        if (!liveRefresh) setInfoMessage(null);
      }

      try {
        const params = new URLSearchParams();
        const trimmed = q.trim();
        if (trimmed) params.set('q', trimmed);
        const limit = trimmed ? SEARCH_JOB_LIMIT : PAGE_SIZE;
        params.set('limit', String(limit));
        params.set('offset', String(offset));
        if (cat && cat !== ALL_CATEGORY_ID) params.set('category', cat);
        if (filters.type) params.set('type', filters.type);
        if (filters.location) params.set('location', filters.location);
        for (const id of filters.sourceIds) params.append('source', id);
        if (liveRefresh) params.set('refresh', '1');

        const res = await fetch(`/api/jobs?${params}`, { cache: 'no-store' });
        const data = (await res.json()) as JobsResponse;
        if (!res.ok) {
          throw new Error(data.detail ?? data.error ?? 'Could not load jobs');
        }

        const incoming = data.jobs ?? [];
        setJobs((prev) => (append ? mergeJobs(prev, incoming) : incoming));
        setTotalMatching(data.totalMatching ?? incoming.length);
        setHasMore(Boolean(data.hasMore));
        setSourceFacets(data.sources ?? []);
        setJobTypes(
          Array.isArray(data.types)
            ? data.types.filter((t): t is string => typeof t === 'string')
            : []
        );
        setLocationSuggestions(data.locationSuggestions ?? []);
        if (!append) {
          setInfoMessage(
            data.message ??
              (data.mode === 'live' ? 'Showing live results from job board APIs.' : null)
          );
        }
      } catch (e) {
        if (!append) {
          setError(
            e instanceof Error ? e.message : 'Failed to load job listings. Please try again.'
          );
        }
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchJobs(debouncedQuery, debouncedFilters, category, 0, false);
  }, [debouncedQuery, debouncedFilters, category, fetchJobs]);

  useEffect(() => {
    setSelectedJob((current) => {
      if (jobs.length === 0) return null;
      if (current && jobs.some((j) => j.id === current.id)) return current;
      return jobs[0];
    });
  }, [jobs]);

  const loadMore = () => {
    if (!hasMore || isLoadingMore || isLoading) return;
    fetchJobs(debouncedQuery, debouncedFilters, category, jobs.length, true);
  };

  const handleFilterSuggestion = (suggestion: FilterSuggestion) => {
    if (suggestion.kind === 'search') {
      setSearchQuery(suggestion.label);
      return;
    }
    if (suggestion.kind === 'location') {
      setJobFilters((prev) => ({
        ...prev,
        location:
          prev.location.toLowerCase() === suggestion.label.toLowerCase()
            ? ''
            : suggestion.label,
      }));
      return;
    }
    if (suggestion.kind === 'type') {
      setJobFilters((prev) => ({
        ...prev,
        type:
          prev.type.toLowerCase() === suggestion.label.toLowerCase() ? '' : suggestion.label,
      }));
    }
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setJobFilters(defaultFilters);
    setCategory(ALL_CATEGORY_ID);
  };

  const hasBoardFilters =
    debouncedFilters.sourceIds.length > 0 ||
    debouncedFilters.type !== '' ||
    debouncedFilters.location !== '';

  const hasSearch = debouncedQuery.trim().length > 0;
  const showEmpty = !isLoading && !error && jobs.length === 0;
  const showSections = category === ALL_CATEGORY_ID && !hasSearch;

  const searchSuggestions = POPULAR_SEARCH_SUGGESTIONS.filter(
    (s) => s.label.toLowerCase() !== searchQuery.trim().toLowerCase()
  );

  const countLabel = () => {
    if (isLoading && jobs.length === 0) return null;
    const n = jobs.length;
    const total = totalMatching ?? n;
    if (hasMore) return `${n} of ${total}`;
    return String(n);
  };

  const sidebarProps = {
    searchQuery,
    onSearchChange: setSearchQuery,
    jobFilters,
    onFiltersChange: setJobFilters,
    category,
    onCategoryChange: setCategory,
    sourceFacets,
    jobTypes,
    locationSuggestions,
    searchSuggestions,
    onFilterSuggestion: handleFilterSuggestion,
    onClearAll: clearAllFilters,
    onRefresh: () => fetchJobs(debouncedQuery, debouncedFilters, category, 0, false, true),
    isLoading,
    jobsCount: jobs.length,
  };

  const listHeader = (
    <JobsPaneHeader>
      <span className="truncate text-xs font-medium text-foreground">
        {countLabel() != null ? (
          <>
            <span className="tabular-nums">{countLabel()}</span>
            <span className="text-muted-foreground"> listings</span>
          </>
        ) : (
          'Listings'
        )}
      </span>
      {selectedJob && (
        <span className="hidden max-w-[45%] truncate text-xs text-muted-foreground xl:inline">
          {selectedJob.title}
        </span>
      )}
    </JobsPaneHeader>
  );

  const listFooter = (
    <>
      {hasMore && (
        <div className="shrink-0 border-t border-border bg-muted/20 px-3 py-3 text-center">
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={loadMore}
            disabled={isLoadingMore || isLoading}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : (
              `Load more (${jobs.length} of ${totalMatching ?? '…'})`
            )}
          </Button>
        </div>
      )}
      {!hasMore && jobs.length > 0 && !isLoading && (
        <p className="shrink-0 border-t border-border py-2 text-center text-[11px] text-muted-foreground">
          End of list
        </p>
      )}
    </>
  );

  return (
    <PageShell appLayout>
      <PageContent wide fillViewport>
        <div
          className={`flex h-full min-h-0 flex-1 flex-col overflow-hidden border border-border bg-background ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}
        >
          <div className="flex shrink-0 items-center gap-2 border-b border-border bg-card px-3 py-2 lg:hidden">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="shrink-0"
              onClick={() => setMobileFiltersOpen((o) => !o)}
              aria-expanded={mobileFiltersOpen}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </Button>
            <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
              Jobs
            </span>
            {countLabel() != null && (
              <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                {countLabel()}
              </span>
            )}
          </div>

          {mobileFiltersOpen && (
            <JobsSidebar
              {...sidebarProps}
              className="max-h-[40dvh] shrink-0 lg:hidden"
            />
          )}

          {infoMessage && !error && (
            <p className="shrink-0 border-b border-border bg-primary/5 px-3 py-1.5 text-center text-xs text-muted-foreground">
              {infoMessage}
            </p>
          )}

          <div className="grid min-h-0 flex-1 overflow-hidden max-lg:grid-rows-[minmax(0,2fr)_minmax(0,3fr)] lg:grid-cols-[minmax(220px,16rem)_minmax(280px,1fr)_minmax(0,1.45fr)] xl:grid-cols-[minmax(240px,17rem)_minmax(300px,1fr)_minmax(0,1.55fr)]">
            <JobsSidebar
              {...sidebarProps}
              className="hidden h-full min-h-0 lg:flex"
            />

            {error ? (
              <div className="col-span-full flex min-h-0 flex-1 items-center justify-center p-8 text-sm text-destructive">
                {error}
              </div>
            ) : showEmpty ? (
              <div className="col-span-full flex min-h-0 flex-1 flex-col">
                <EmptyState
                  className="h-full flex-1"
                  icon={hasBoardFilters || hasSearch || category !== ALL_CATEGORY_ID ? SearchX : Briefcase}
                  title={
                    hasBoardFilters || hasSearch || category !== ALL_CATEGORY_ID
                      ? 'No matches'
                      : 'No jobs yet'
                  }
                  description={
                    hasBoardFilters || hasSearch || category !== ALL_CATEGORY_ID
                      ? 'Try a different search term, board, or category.'
                      : 'Sign in as admin and run a sync, or wait for the live API feed.'
                  }
                  action={
                    <Button
                      variant="outline"
                      onClick={
                        hasBoardFilters || hasSearch || category !== ALL_CATEGORY_ID
                          ? clearAllFilters
                          : () => fetchJobs('', defaultFilters, category, 0, false)
                      }
                    >
                      {hasBoardFilters || hasSearch || category !== ALL_CATEGORY_ID
                        ? 'Clear filters'
                        : 'Try again'}
                    </Button>
                  }
                />
              </div>
            ) : isLoading && jobs.length === 0 ? (
              <div className="col-span-full flex min-h-0 flex-1 items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading listings…
              </div>
            ) : (
              <>
                <JobsPane
                  className="h-full min-h-0 border-b border-border lg:border-b-0 lg:border-r"
                  header={listHeader}
                  footer={listFooter}
                >
                  {showSections ? (
                    <JobSections
                      jobs={jobs}
                      selectedJobId={selectedJob?.id}
                      onJobSelect={setSelectedJob}
                    />
                  ) : (
                    <ul className="divide-y divide-border">
                      {jobs.map((job) => (
                        <li key={job.id}>
                          <JobCard
                            job={job}
                            compact
                            isSelected={selectedJob?.id === job.id}
                            onJobSelect={() => setSelectedJob(job)}
                          />
                        </li>
                      ))}
                    </ul>
                  )}
                </JobsPane>

                <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden">
                  <JobDetailPanel job={selectedJob} className="h-full min-h-0 flex-1" />
                </div>
              </>
            )}
          </div>
        </div>
      </PageContent>
    </PageShell>
  );
}
