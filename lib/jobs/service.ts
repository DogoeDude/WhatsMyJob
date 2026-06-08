import { cache } from 'react';
import {
  applyJobFilters,
  buildSourceFacets,
  mergeSourceFacetsWithSelection,
  statsFromFilteredJobs,
  type JobListFilters,
  type SourceFacet,
} from '@/lib/jobs/filters';
import { getJobsFilterMetaCached } from '@/lib/jobs/filter-meta-cache';
import { enrichJobsWithLogos, clearLogoCache } from '@/lib/jobs/enrich-logos';
import { fetchLiveJobs, interleaveJobsBySource } from '@/lib/jobs/live-fetch';
import { getTopLocationsFromJobs } from '@/lib/jobs/filter-suggestions';
import { dedupeStrings, sortJobsByRecency } from '@/lib/jobs/utils';
import {
  getJobStats,
  hasAnyJobListings,
  searchJobListings,
} from '@/lib/jobs/query';

export async function getAppJobStats() {
  try {
    if (await hasAnyJobListings()) {
      const stats = await getJobStats();
      return {
        totalJobs: stats.totalJobs,
        locationCount: stats.locationCount,
        companyCount: stats.companyCount,
        mode: 'database' as const,
      };
    }
  } catch (err) {
    console.error('[getAppJobStats] database unavailable:', err);
  }

  const { jobs } = await fetchLiveJobs(200);
  return {
    totalJobs: jobs.length,
    locationCount: new Set(jobs.map((j) => j.location)).size,
    companyCount: new Set(jobs.map((j) => j.company)).size,
    mode: 'live' as const,
  };
}

export type GetJobsOptions = {
  /** User clicked Refresh — fetch live APIs, newest first (stable). */
  refresh?: boolean;
  /** Force live APIs (alias for refresh). */
  forceLive?: boolean;
  /** When false, skip facets/count queries (faster list paint). */
  includeMeta?: boolean;
};

export const getJobsFilterMeta = cache(async function getJobsFilterMeta(filters: JobListFilters) {
  return getJobsFilterMetaCached(filters);
});

export async function getJobsForApp(
  filters: JobListFilters,
  limit: number,
  offset = 0,
  options?: GetJobsOptions
) {
  const refresh = options?.refresh ?? options?.forceLive ?? false;
  const includeMeta = options?.includeMeta ?? true;

  if (!refresh) {
    try {
      if (await hasAnyJobListings()) {
        const { jobs, skip } = await searchJobListings(filters, limit, offset);
        const enrichedJobs = await enrichJobsWithLogos(jobs);

        let sources: SourceFacet[] = [];
        let types: string[] = [];
        let locationSuggestions: string[] = [];
        let totalMatching = enrichedJobs.length;
        let hasMore = enrichedJobs.length >= limit;

        if (includeMeta) {
          const meta = await getJobsFilterMeta(filters);
          sources = meta.sources;
          types = meta.types;
          locationSuggestions = meta.locationSuggestions;
          totalMatching = meta.totalMatching;
          hasMore = skip + enrichedJobs.length < totalMatching;
        } else {
          hasMore = enrichedJobs.length >= limit;
        }

        return {
          jobs: enrichedJobs,
          stats: statsFromFilteredJobs(enrichedJobs),
          totalMatching,
          hasMore,
          offset: skip,
          sources,
          types,
          locationSuggestions,
          filters,
          mode: 'database' as const,
        };
      }
    } catch (err) {
      console.error('[getJobsForApp] database unavailable:', err);
    }
  } else {
    clearLogoCache();
  }

  const hasNonSourceFilters =
    filters.search.trim().length > 0 ||
    filters.type !== '' ||
    filters.location !== '';
  const livePoolSize = refresh
    ? Math.min(120, Math.max(limit * 3, 50))
    : filters.sourceIds.length > 0 || hasNonSourceFilters
      ? 200
      : 150;
  const { jobs: livePool, providerErrors } = await fetchLiveJobs(livePoolSize);
  const facetBase = applyJobFilters(livePool, { ...filters, sourceIds: [] });
  const sources = mergeSourceFacetsWithSelection(
    buildSourceFacets(facetBase),
    filters.sourceIds
  );
  const filtered = applyJobFilters(livePool, filters);
  const mixed = refresh
    ? sortJobsByRecency(filtered)
    : filters.sourceIds.length === 0 && !filters.search.trim()
      ? interleaveJobsBySource(filtered)
      : sortJobsByRecency(filtered);
  const totalMatching = mixed.length;
  const sliceStart = offset;
  const page = mixed.slice(sliceStart, sliceStart + limit);
  let jobs = await enrichJobsWithLogos(page, { allowLiveCache: refresh });

  if (refresh && jobs.length === 0) {
    try {
      if (await hasAnyJobListings()) {
        const { jobs: dbJobs, skip } = await searchJobListings(filters, limit, offset);
        jobs = await enrichJobsWithLogos(dbJobs);
        let dbSources: SourceFacet[] = sources;
        let dbTypes: string[] = [];
        let dbLocations: string[] = [];
        let dbTotal = jobs.length;
        let dbHasMore = jobs.length >= limit;

        if (includeMeta) {
          const meta = await getJobsFilterMeta(filters);
          dbSources = meta.sources;
          dbTypes = meta.types;
          dbLocations = meta.locationSuggestions;
          dbTotal = meta.totalMatching;
          dbHasMore = skip + jobs.length < dbTotal;
        }

        const failedBoards = Object.keys(providerErrors).length;
        return {
          jobs,
          stats: statsFromFilteredJobs(jobs),
          totalMatching: dbTotal,
          hasMore: dbHasMore,
          offset: skip,
          sources: dbSources,
          types: dbTypes,
          locationSuggestions: dbLocations,
          filters,
          mode: 'database' as const,
          providerErrors,
          message:
            failedBoards > 0
              ? 'Live job boards returned nothing (some APIs failed or are rate-limited). Showing saved jobs from your database.'
              : 'Live job boards returned nothing. Showing saved jobs from your database.',
        };
      }
    } catch (err) {
      console.error('[getJobsForApp] refresh database fallback:', err);
    }
  }
  const types = dedupeStrings(
    facetBase.map((j) => j.type).filter((t): t is string => typeof t === 'string'),
    true
  )
    .sort((a, b) => a.localeCompare(b))
    .slice(0, 30);
  const locationSuggestions = getTopLocationsFromJobs(facetBase);

  let message: string | undefined;
  if (jobs.length === 0) {
    message = 'No jobs match your filters. Try another source or clear filters.';
  } else if (refresh) {
    message = 'Fetched latest jobs from job board APIs (newest first).';
  } else {
    try {
      if (!(await hasAnyJobListings())) {
        message = 'Showing live listings from job board APIs.';
      }
    } catch {
      message =
        'Live listings (database unavailable). Run npm run db:generate with the dev server stopped.';
    }
  }

  return {
    jobs,
    stats: statsFromFilteredJobs(jobs),
    totalMatching,
    hasMore: sliceStart + jobs.length < totalMatching,
    offset: sliceStart,
    sources,
    types,
    locationSuggestions,
    filters,
    mode: 'live' as const,
    providerErrors,
    message,
  };
}
