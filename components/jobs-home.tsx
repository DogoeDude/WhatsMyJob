'use client';

import { useCallback, useEffect, useState } from 'react';
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
  const [isLoadingMore, setIsLoadingMore] = useState(false);
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
      if (append) setIsLoadingMore(true);
      else {
        setIsLoading(true);
        setError(null);
        setInfoMessage(null);
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
          setInfoMessage(data.message ?? (data.mode === 'live' ? 'Live feed from job board APIs' : null));
        }
      } catch (e) {
        if (!append) {
          setError(
            e instanceof Error ? e.message : 'Failed to load job listings. Please try again.'
          );
        }
      } finally {
        setIsLoading(false);
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

  const rolesSubtitle = () => {
    if (isLoading && jobs.length === 0) return 'Loading listings…';
    const n = jobs.length;
    const total = totalMatching ?? n;
    if (hasMore) return `Showing ${n} of ${total} roles`;
    return `${n} ${n === 1 ? 'role' : 'roles'} loaded`;
  };

  return (
    <PageShell>
      <PageContent className="py-6 sm:py-8">
        <section className="surface-elevated overflow-hidden rounded-2xl">
          <div className="flex flex-wrap items-end justify-between gap-3 border-b border-border/60 bg-gradient-to-r from-muted/30 to-primary/[0.03] px-5 py-5 sm:px-7">
            <div>
              <p className="section-label mb-1">Job discovery</p>
              <h1 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
                Find your next role
              </h1>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{rolesSubtitle()}</p>
          </div>

          <div className="space-y-4 border-b border-border/60 px-5 py-4 sm:px-7">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-primary/70" />
                <input
                  type="search"
                  placeholder="Search jobs, companies, locations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full text-foreground ${searchInputClass}`}
                />
              </div>
              <Button
                size="lg"
                variant="outline"
                className="shrink-0 rounded-xl border-border/60 bg-background/80 shadow-sm"
                onClick={() =>
                  fetchJobs(debouncedQuery, debouncedFilters, category, 0, false, true)
                }
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <RefreshCw className="h-5 w-5" />
                )}
                Refresh
              </Button>
            </div>
            <SuggestionChips
              label="Try searching"
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
            <p className="border-b border-primary/15 bg-primary/[0.04] px-5 py-3 text-center text-sm text-muted-foreground">
              {infoMessage}
            </p>
          )}

          {error && (
            <div className="px-6 py-8 text-center text-sm text-destructive">{error}</div>
          )}

          {showEmpty && !hasBoardFilters && !hasSearch && (
            <EmptyState
              icon={Briefcase}
              title="No jobs available"
              description="Sync jobs from Admin, or wait for live APIs to respond."
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
              title="No matching jobs"
              description="Try another category, job board, or search term."
              action={
                <Button variant="outline" onClick={clearAllFilters}>
                  Clear filters
                </Button>
              }
            />
          )}

          {!error && !showEmpty && isLoading && jobs.length === 0 && (
            <div className="flex items-center justify-center gap-2 px-6 py-16 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading jobs…
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
            <div className="space-y-3 p-4 sm:p-6">
              {jobs.map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  onJobSelect={() => {
                    setSelectedJob(job);
                    setIsModalOpen(true);
                  }}
                />
              ))}
            </div>
          )}

          {jobs.length > 0 && hasMore && (
            <div className="border-t border-border/60 bg-gradient-to-b from-muted/10 to-muted/30 px-5 py-8 text-center sm:px-7">
              <Button
                variant="default"
                size="lg"
                onClick={loadMore}
                disabled={isLoadingMore || isLoading}
                className="min-w-[220px] rounded-xl shadow-md shadow-primary/15"
              >
                {isLoadingMore ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading…
                  </>
                ) : (
                  `Load more (${jobs.length} of ${totalMatching ?? '…'})`
                )}
              </Button>
            </div>
          )}

          {jobs.length > 0 && !hasMore && !isLoading && (
            <p className="border-t border-border/60 py-4 text-center text-sm text-muted-foreground">
              All matching roles loaded
            </p>
          )}
        </section>
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
