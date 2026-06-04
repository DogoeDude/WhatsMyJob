'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthPromptDialog } from '@/components/auth-prompt-dialog';
import { JobDetailPanelLazy } from '@/components/job-detail-panel-lazy';
import { JobsFlatVirtualList } from '@/components/jobs-flat-virtual-list';
import { buildJobsSearchParams } from '@/lib/jobs/build-search-params';
import { type JobFilterState } from '@/components/job-filters';
import { JobSections } from '@/components/job-sections';
import { JobsPane, JobsPaneHeader } from '@/components/jobs-board-layout';
import { JobsResizableLayout } from '@/components/jobs-resizable-layout';
import { JobsSidebar } from '@/components/jobs-sidebar';
import { PageContent, PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/empty-state';
import { useAppSession } from '@/lib/use-app-session';
import { ALL_CATEGORY_ID } from '@/lib/jobs/categories';
import { browseJobLimit } from '@/lib/jobs/browse-limit';
import { GUEST_JOB_LIMIT } from '@/lib/jobs/limits';
import type { FilterSuggestion } from '@/lib/jobs/filter-suggestions';
import type { SourceFacet } from '@/lib/jobs/filters';
import { cn } from '@/lib/utils';
import type { Job } from '@/lib/jobs/types';
import { JobsListLoading } from '@/components/jobs-list-skeleton';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Briefcase, ChevronDown, SearchX, Loader2, SlidersHorizontal } from 'lucide-react';

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
  providerErrors?: Record<string, string>;
  error?: string;
  detail?: string;
};

function formatProviderErrors(errors: Record<string, string> | undefined): string | null {
  if (!errors) return null;
  const failed = Object.keys(errors);
  if (failed.length === 0) return null;
  return `${failed.length} job board${failed.length === 1 ? '' : 's'} could not be reached.`;
}

export type JobsHomeInitialData = {
  jobs: Job[];
  totalMatching: number;
  hasMore: boolean;
  sources: SourceFacet[];
  types: string[];
  locationSuggestions: string[];
  mode?: 'database' | 'live';
  message?: string;
};

const defaultFilters: JobFilterState = {
  sourceIds: [],
  type: '',
  location: '',
};

function filtersEqual(a: JobFilterState, b: JobFilterState): boolean {
  return (
    a.type === b.type &&
    a.location === b.location &&
    a.sourceIds.length === b.sourceIds.length &&
    a.sourceIds.every((id, i) => id === b.sourceIds[i])
  );
}

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

export function JobsHome({ initialData }: { initialData?: JobsHomeInitialData }) {
  const [searchInput, setSearchInput] = useState('');
  /** Applied keyword — updated only when user clicks Search or presses Enter. */
  const [searchQuery, setSearchQuery] = useState('');
  const [jobFilters, setJobFilters] = useState<JobFilterState>(defaultFilters);
  const [debouncedFilters, setDebouncedFilters] = useState<JobFilterState>(defaultFilters);
  const [category, setCategory] = useState(ALL_CATEGORY_ID);
  const [jobs, setJobs] = useState<Job[]>(initialData?.jobs ?? []);
  const [totalMatching, setTotalMatching] = useState<number | null>(
    initialData?.totalMatching ?? null
  );
  const [hasMore, setHasMore] = useState(initialData?.hasMore ?? false);
  const [sourceFacets, setSourceFacets] = useState<SourceFacet[]>(initialData?.sources ?? []);
  const [jobTypes, setJobTypes] = useState<string[]>(initialData?.types ?? []);
  const [locationSuggestions, setLocationSuggestions] = useState<string[]>(
    initialData?.locationSuggestions ?? []
  );
  const [selectedJob, setSelectedJob] = useState<Job | null>(initialData?.jobs[0] ?? null);
  const [isLoading, setIsLoading] = useState(!initialData);
  const [isListUpdating, setIsListUpdating] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const jobsCountRef = useRef(0);
  jobsCountRef.current = jobs.length;
  const fetchSeqRef = useRef(0);
  const refreshInFlightRef = useRef(false);
  const abortRef = useRef<AbortController | null>(null);
  const [listVersion, setListVersion] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(initialData?.message ?? null);
  /** Skip one automatic DB fetch when SSR already hydrated the list. */
  const skipInitialBrowseRef = useRef(!!initialData);
  /** After a manual refresh, block browse effect from replacing live results with DB. */
  const liveListLockRef = useRef(false);
  const fetchJobsRef = useRef<
    (
      q: string,
      filters: JobFilterState,
      cat: string,
      offset: number,
      append: boolean,
      reload?: boolean
    ) => Promise<void>
  >(() => Promise.resolve());
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');
  const [authPromptOpen, setAuthPromptOpen] = useState(false);
  const { data: session, isPending: sessionPending } = useAppSession();
  const isGuest = !sessionPending && !session;

  const applySearch = useCallback(() => {
    const trimmed = searchInput.trim();
    setSearchInput(trimmed);
    setSearchQuery(trimmed);
  }, [searchInput]);

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
      reload = false
    ) => {
      if (append && !session) return;

      const seq = ++fetchSeqRef.current;

      if (reload && !append) {
        refreshInFlightRef.current = true;
        setJobs([]);
        setSelectedJob(null);
        setTotalMatching(null);
      } else if (!append) {
        refreshInFlightRef.current = false;
      }

      if (!append) {
        abortRef.current?.abort();
        abortRef.current = new AbortController();
      }

      if (append) {
        setIsLoadingMore(true);
      } else if (reload) {
        setIsLoading(true);
        setIsListUpdating(false);
        setIsRefreshing(true);
      } else if (jobsCountRef.current === 0) {
        setIsLoading(true);
        setIsListUpdating(false);
        setIsRefreshing(false);
      } else {
        setIsLoading(false);
        setIsListUpdating(true);
        setIsRefreshing(false);
      }
      if (!append) {
        setError(null);
        if (!reload) setInfoMessage(null);
      }

      try {
        const trimmed = q.trim();
        const limit = browseJobLimit(!!session, trimmed);
        const params = buildJobsSearchParams(q, filters, cat, offset, limit, {
          reload,
          jobsOnly: !append && !reload,
        });

        const res = await fetch(`/api/jobs?${params}`, {
          cache: reload ? 'no-store' : 'default',
          signal: abortRef.current?.signal,
        });
        const data = (await res.json()) as JobsResponse;
        if (!res.ok) {
          throw new Error(data.detail ?? data.error ?? 'Could not load jobs');
        }

        if (seq !== fetchSeqRef.current) return;
        if (!reload && refreshInFlightRef.current) return;

        const incoming = data.jobs ?? [];
        setJobs((prev) => (append ? mergeJobs(prev, incoming) : incoming));
        const total = data.totalMatching ?? incoming.length;
        setTotalMatching(total);
        if (!session && !append) {
          setHasMore(total > incoming.length || incoming.length >= GUEST_JOB_LIMIT);
        } else {
          setHasMore(Boolean(data.hasMore));
        }
        if (!append) {
          setListVersion((v) => v + 1);
          const providerNote = formatProviderErrors(data.providerErrors);
          const baseMessage =
            data.message ??
            (reload
              ? data.mode === 'live'
                ? 'Fetched latest jobs from job board APIs.'
                : 'Listings updated.'
              : data.mode === 'live'
                ? 'Showing live results from job board APIs.'
                : null);
          setInfoMessage(
            providerNote && baseMessage
              ? `${baseMessage} ${providerNote}`
              : providerNote ?? baseMessage
          );
          if (reload) {
            if (incoming.length > 0) {
              liveListLockRef.current = true;
              setSelectedJob(incoming[0]);
              setMobileView('list');
            }
          }
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        if (seq !== fetchSeqRef.current) return;
        if (!append) {
          setError(
            e instanceof Error ? e.message : 'Failed to load job listings. Please try again.'
          );
        }
      } finally {
        if (seq !== fetchSeqRef.current) return;
        setIsLoading(false);
        setIsListUpdating(false);
        setIsRefreshing(false);
        setIsLoadingMore(false);
        if (reload) refreshInFlightRef.current = false;
      }
    },
    [session]
  );

  fetchJobsRef.current = fetchJobs;

  const fetchJobMeta = useCallback(
    async (q: string, filters: JobFilterState, cat: string, bustCache = false) => {
      try {
        const limit = browseJobLimit(!!session, q.trim());
        const params = buildJobsSearchParams(q, filters, cat, 0, limit);
        const res = await fetch(`/api/jobs/meta?${params}`, {
          cache: bustCache ? 'no-store' : 'default',
        });
        const data = (await res.json()) as {
          sources?: SourceFacet[];
          types?: string[];
          locationSuggestions?: string[];
          totalMatching?: number;
        };
        if (!res.ok) return;
        setSourceFacets(data.sources ?? []);
        setJobTypes(
          Array.isArray(data.types)
            ? data.types.filter((t): t is string => typeof t === 'string')
            : []
        );
        setLocationSuggestions(data.locationSuggestions ?? []);
        if (typeof data.totalMatching === 'number') {
          setTotalMatching(data.totalMatching);
          setHasMore((prev) => {
            const count = jobsCountRef.current;
            return count < data.totalMatching!;
          });
        }
      } catch {
        /* filters still usable without facets */
      }
    },
    [session]
  );

  useEffect(() => {
    if (sessionPending) return;
    void fetchJobMeta(searchQuery, debouncedFilters, category);
  }, [searchQuery, debouncedFilters, category, sessionPending, fetchJobMeta]);

  const sessionUserId = session?.user?.id ?? null;
  const prevBrowseKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const key = `${searchQuery}|${category}|${debouncedFilters.sourceIds.join(',')}|${debouncedFilters.type}|${debouncedFilters.location}`;
    if (prevBrowseKeyRef.current === null) {
      prevBrowseKeyRef.current = key;
      return;
    }
    if (prevBrowseKeyRef.current === key) return;
    prevBrowseKeyRef.current = key;
    liveListLockRef.current = false;
  }, [searchQuery, debouncedFilters, category]);

  useEffect(() => {
    if (sessionPending) return;
    if (refreshInFlightRef.current) return;

    const isDefaultBrowse =
      searchQuery === '' &&
      category === ALL_CATEGORY_ID &&
      filtersEqual(debouncedFilters, defaultFilters);

    if (skipInitialBrowseRef.current && isDefaultBrowse) {
      skipInitialBrowseRef.current = false;
      return;
    }

    if (liveListLockRef.current && isDefaultBrowse) {
      return;
    }

    void fetchJobsRef.current(searchQuery, debouncedFilters, category, 0, false);
  }, [searchQuery, debouncedFilters, category, sessionUserId, sessionPending]);

  useEffect(() => {
    setSelectedJob((current) => {
      if (jobs.length === 0) return null;
      if (current && jobs.some((j) => j.id === current.id)) return current;
      return jobs[0] ?? null;
    });
  }, [jobs]);

  useEffect(() => {
    setMobileView('list');
  }, [searchQuery, debouncedFilters, category]);

  const selectJob = (job: Job) => {
    setSelectedJob(job);
    setMobileView('detail');
  };

  const loadMore = () => {
    if (isGuest) {
      setAuthPromptOpen(true);
      return;
    }
    if (!hasMore || isLoadingMore || isLoading) return;
    fetchJobs(searchQuery, debouncedFilters, category, jobs.length, true);
  };

  const showListFooter = isGuest
    ? jobs.length > 0 && hasMore
    : hasMore;

  const handleFilterSuggestion = (suggestion: FilterSuggestion) => {
    if (suggestion.kind === 'search') {
      setSearchInput(suggestion.label);
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
    setSearchInput('');
    setSearchQuery('');
    setJobFilters(defaultFilters);
    setCategory(ALL_CATEGORY_ID);
  };

  const hasBoardFilters =
    debouncedFilters.sourceIds.length > 0 ||
    debouncedFilters.type !== '' ||
    debouncedFilters.location !== '';

  const hasSearch = searchQuery.trim().length > 0;
  const searchPending = searchInput.trim() !== searchQuery.trim();
  const showEmpty = !isLoading && !isListUpdating && !error && jobs.length === 0;
  const showFullSkeleton = isLoading && jobs.length === 0;
  const showSections = category === ALL_CATEGORY_ID && !hasSearch;

  const countLabel = () => {
    if (isLoading && jobs.length === 0) return null;
    const n = jobs.length;
    const total = totalMatching ?? n;
    if (hasMore) return `${n} of ${total}`;
    return String(n);
  };

  const sidebarProps = {
    searchInput,
    onSearchInputChange: setSearchInput,
    onSearchSubmit: applySearch,
    onClearSearch: () => {
      setSearchInput('');
      setSearchQuery('');
    },
    searchPending,
    appliedSearch: searchQuery,
    jobFilters,
    onFiltersChange: setJobFilters,
    category,
    onCategoryChange: setCategory,
    sourceFacets,
    jobTypes,
    onFilterSuggestion: handleFilterSuggestion,
    onClearAll: clearAllFilters,
    onRefresh: () => {
      liveListLockRef.current = false;
      void fetchJobs(searchQuery, debouncedFilters, category, 0, false, true);
      void fetchJobMeta(searchQuery, debouncedFilters, category, true);
    },
    isLoading,
    isRefreshing,
    jobsCount: jobs.length,
  };

  const listHeader = (
    <JobsPaneHeader>
      <span className="flex min-w-0 items-center gap-2 truncate text-xs font-medium text-foreground">
        {isListUpdating && (
          <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-primary" aria-hidden />
        )}
        {countLabel() != null ? (
          <>
            <span className="tabular-nums">{countLabel()}</span>
            <span className="text-muted-foreground"> listings</span>
          </>
        ) : (
          'Listings'
        )}
      </span>
      {selectedJob && !isListUpdating && (
        <span className="hidden max-w-[45%] truncate text-xs text-muted-foreground xl:inline">
          {selectedJob.title}
        </span>
      )}
    </JobsPaneHeader>
  );

  const listFooter = (
    <>
      {showListFooter && (
        <div className="shrink-0 border-t border-border bg-muted/20 px-3 py-3 text-center">
          {isGuest && (totalMatching ?? 0) > jobs.length && (
            <p className="mb-2 text-xs text-muted-foreground">
              {(totalMatching ?? 0) - jobs.length} more jobs available
            </p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={loadMore}
            disabled={!isGuest && (isLoadingMore || isLoading || isListUpdating)}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading…
              </>
            ) : isGuest ? (
              <>
                <ChevronDown className="h-4 w-4" />
                Show more jobs
              </>
            ) : (
              `Load more (${jobs.length} of ${totalMatching ?? '…'})`
            )}
          </Button>
        </div>
      )}
      {!showListFooter && jobs.length > 0 && !isLoading && !isListUpdating && (
        <p className="shrink-0 border-t border-border py-2 text-center text-[11px] text-muted-foreground">
          End of list
        </p>
      )}
    </>
  );

  return (
    <PageShell appLayout>
      <PageContent wide fillViewport>
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border border-border bg-background">
          {mobileView === 'list' && (
            <div className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-3 py-2.5 lg:hidden">
              <Button
                type="button"
                variant="outline"
                size="default"
                className="h-10 shrink-0 gap-2 px-3"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </Button>
              <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                {countLabel() != null ? (
                  <>
                    <span className="tabular-nums">{countLabel()}</span> jobs
                  </>
                ) : (
                  'Job listings'
                )}
              </span>
            </div>
          )}

          <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
            <SheetContent side="left" className="flex w-[min(100%,20rem)] flex-col gap-0 p-0 sm:max-w-sm">
              <SheetHeader className="shrink-0 border-b border-border px-4 py-4 text-left">
                <SheetTitle>Search & filters</SheetTitle>
              </SheetHeader>
              <JobsSidebar {...sidebarProps} embedded className="min-h-0 flex-1" />
            </SheetContent>
          </Sheet>

          {infoMessage && !error && (
            <p className="shrink-0 border-b border-border bg-primary/5 px-3 py-1.5 text-center text-xs text-muted-foreground">
              {infoMessage}
            </p>
          )}

          {/* Mobile: list or detail (filters in sheet) */}
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:hidden">
            {error ? (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-destructive">
                {error}
              </div>
            ) : showEmpty ? (
              <EmptyState
                className="flex-1"
                icon={
                  hasBoardFilters || hasSearch || category !== ALL_CATEGORY_ID
                    ? SearchX
                    : Briefcase
                }
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
            ) : showFullSkeleton ? (
              <JobsListLoading />
            ) : mobileView === 'list' ? (
              <JobsPane
                className="relative min-h-0 flex-1"
                header={listHeader}
                footer={listFooter}
              >
                {isListUpdating && (
                  <div
                    className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-primary/20"
                    aria-hidden
                  >
                    <div className="h-full w-1/3 animate-pulse bg-primary" />
                  </div>
                )}
                {showSections ? (
                  <JobSections
                    key={listVersion}
                    jobs={jobs}
                    selectedJobId={selectedJob?.id}
                    onJobSelect={selectJob}
                  />
                ) : (
                  <JobsFlatVirtualList
                    key={listVersion}
                    jobs={jobs}
                    selectedJobId={selectedJob?.id}
                    onJobSelect={selectJob}
                    freezeLayout={isListUpdating}
                  />
                )}
              </JobsPane>
            ) : (
              <JobDetailPanelLazy
                job={selectedJob}
                className="min-h-0 flex-1"
                onBack={() => setMobileView('list')}
              />
            )}
          </div>

          {/* Desktop: drag handles between filters, list, and detail */}
          <div className="hidden min-h-0 flex-1 overflow-hidden lg:flex">
            {error ? (
              <div className="flex flex-1 items-center justify-center p-8 text-sm text-destructive">
                {error}
              </div>
            ) : showEmpty ? (
              <div className="flex min-h-0 flex-1">
                <JobsSidebar {...sidebarProps} resizable className="h-full w-full" />
                <div className="flex min-w-0 flex-1 flex-col border-l border-border">
                  <EmptyState
                    className="flex-1"
                    icon={
                      hasBoardFilters || hasSearch || category !== ALL_CATEGORY_ID
                        ? SearchX
                        : Briefcase
                    }
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
              </div>
            ) : showFullSkeleton ? (
              <div className="flex h-full min-h-0 w-full">
                <JobsSidebar {...sidebarProps} resizable className="h-full w-[18%] min-w-[12rem] max-w-[18rem] shrink-0" />
                <div className="min-h-0 min-w-0 flex-1">
                  <JobsListLoading />
                </div>
              </div>
            ) : (
              <JobsResizableLayout
                filters={<JobsSidebar {...sidebarProps} resizable className="h-full w-full" />}
                list={
                  <JobsPane className="relative h-full" header={listHeader} footer={listFooter}>
                    {isListUpdating && (
                      <div
                        className="pointer-events-none absolute inset-x-0 top-0 z-10 h-0.5 bg-primary/20"
                        aria-hidden
                      >
                        <div className="h-full w-1/3 animate-pulse bg-primary" />
                      </div>
                    )}
                    {showSections ? (
                      <JobSections
                        key={listVersion}
                        jobs={jobs}
                        selectedJobId={selectedJob?.id}
                        onJobSelect={selectJob}
                      />
                    ) : (
                      <JobsFlatVirtualList
                        key={listVersion}
                        jobs={jobs}
                        selectedJobId={selectedJob?.id}
                        onJobSelect={selectJob}
                        freezeLayout={isListUpdating}
                      />
                    )}
                  </JobsPane>
                }
                detail={
                  <JobDetailPanelLazy
                    job={selectedJob}
                    className="h-full min-h-0 flex-1"
                    onBack={() => setMobileView('list')}
                  />
                }
              />
            )}
          </div>
        </div>
      </PageContent>
      <AuthPromptDialog open={authPromptOpen} onOpenChange={setAuthPromptOpen} />
    </PageShell>
  );
}
