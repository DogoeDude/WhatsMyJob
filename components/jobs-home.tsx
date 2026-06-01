'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { ActiveFilters } from '@/components/active-filters';
import { JobCard } from '@/components/job-card';
import { JobCategoryNav } from '@/components/job-category-nav';
import { JobDetailsModal } from '@/components/job-details-modal';
import { JobFilters, type JobFilterState } from '@/components/job-filters';
import { JobSections } from '@/components/job-sections';
import { PageContent, PageShell } from '@/components/page-shell';
import { SuggestionChips } from '@/components/suggestion-chips';
import { Button } from '@/components/ui/button';
import { searchInputClass } from '@/lib/ui-classes';
import { EmptyState } from '@/components/empty-state';
import { ALL_CATEGORY_ID } from '@/lib/jobs/categories';
import { PAGE_SIZE, SEARCH_JOB_LIMIT } from '@/lib/jobs/limits';
import {
  POPULAR_SEARCH_SUGGESTIONS,
  type FilterSuggestion,
} from '@/lib/jobs/filter-suggestions';
import type { SourceFacet } from '@/lib/jobs/filters';
import type { Job } from '@/lib/jobs/types';
import { Search, Briefcase, SearchX, Loader2, RefreshCw } from 'lucide-react';

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
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const jobsCountRef = useRef(0);
  jobsCountRef.current = jobs.length;
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

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

  return (
    <PageShell>
      <PageContent className="py-6 sm:py-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            Jobs
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Search listings synced from Remotive, Arbeitnow, Jobicy, and other public APIs.
            {countLabel() != null && (
              <span className="text-foreground"> · {countLabel()} shown</span>
            )}
          </p>
        </header>

        <div
          className={`rounded-lg border border-border bg-card ${isRefreshing ? 'opacity-70 transition-opacity' : ''}`}
        >
          <div className="space-y-4 border-b border-border p-4 sm:p-5">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <input
                  type="search"
                  placeholder="Title, company, location…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full ${searchInputClass}`}
                />
              </div>
              <Button
                variant="outline"
                className="shrink-0"
                onClick={() =>
                  fetchJobs(debouncedQuery, debouncedFilters, category, 0, false, true)
                }
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Refresh
              </Button>
            </div>
            <SuggestionChips
              label="Suggestions"
              suggestions={searchSuggestions}
              activeValues={{
                search: searchQuery,
                location: jobFilters.location,
                type: jobFilters.type,
              }}
              onSelect={handleFilterSuggestion}
              disabled={isLoading}
            />
          </div>

          <JobCategoryNav
            value={category}
            onChange={setCategory}
            disabled={isLoading && jobs.length === 0}
          />

          <ActiveFilters
            search={searchQuery}
            filters={jobFilters}
            sources={sourceFacets}
            onClearSearch={() => setSearchQuery('')}
            onChangeFilters={setJobFilters}
            onClearAll={clearAllFilters}
          />

          <JobFilters
            sources={sourceFacets}
            types={jobTypes}
            locationSuggestions={locationSuggestions}
            value={jobFilters}
            onChange={setJobFilters}
            onSuggestionSelect={handleFilterSuggestion}
            activeSearch={searchQuery}
            disabled={isLoading && jobs.length === 0}
          />

          {infoMessage && !error && (
            <p className="border-b border-border bg-muted/40 px-4 py-2.5 text-center text-sm text-muted-foreground sm:px-5">
              {infoMessage}
            </p>
          )}

          {error && (
            <div className="px-5 py-8 text-center text-sm text-destructive">{error}</div>
          )}

          {showEmpty && !hasBoardFilters && !hasSearch && (
            <EmptyState
              icon={Briefcase}
              title="No jobs yet"
              description="Sign in as admin and run a sync, or wait for the live API feed."
              action={
                <Button
                  variant="outline"
                  onClick={() => fetchJobs('', defaultFilters, category, 0, false)}
                >
                  Try again
                </Button>
              }
            />
          )}

          {showEmpty && (hasBoardFilters || hasSearch || category !== ALL_CATEGORY_ID) && (
            <EmptyState
              icon={SearchX}
              title="No matches"
              description="Try a different search term, board, or category."
              action={
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear filters
                </Button>
              }
            />
          )}

          {!error && !showEmpty && isLoading && jobs.length === 0 && (
            <div className="flex items-center justify-center gap-2 px-5 py-16 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading…
            </div>
          )}

          {jobs.length > 0 && showSections && (
            <JobSections
              jobs={jobs}
              onJobSelect={(job) => {
                setSelectedJob(job);
                setIsModalOpen(true);
              }}
            />
          )}

          {jobs.length > 0 && !showSections && (
            <ul className="divide-y divide-border">
              {jobs.map((job) => (
                <li key={job.id}>
                  <JobCard
                    job={job}
                    onJobSelect={() => {
                      setSelectedJob(job);
                      setIsModalOpen(true);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}

          {jobs.length > 0 && hasMore && (
            <div className="border-t border-border px-5 py-6 text-center">
              <Button
                variant="outline"
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

          {jobs.length > 0 && !hasMore && !isLoading && (
            <p className="border-t border-border py-3 text-center text-xs text-muted-foreground">
              End of results
            </p>
          )}
        </div>
      </PageContent>

      {selectedJob && (
        <JobDetailsModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          job={selectedJob}
        />
      )}
    </PageShell>
  );
}
