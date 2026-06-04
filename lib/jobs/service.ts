import { cache } from 'react';
import {
  applyJobFilters,
  buildSourceFacets,
  mergeSourceFacetsWithSelection,
  statsFromFilteredJobs,
  type JobListFilters,
  type SourceFacet,
} from '@/lib/jobs/filters';
import { enrichJobsWithLogos, clearLogoCache } from '@/lib/jobs/enrich-logos';
import { fetchLiveJobs, interleaveJobsBySource } from '@/lib/jobs/live-fetch';
import { getTopLocationsFromJobs } from '@/lib/jobs/filter-suggestions';
import { dedupeStrings, sortJobsByRecency } from '@/lib/jobs/utils';
import {
  countJobListings,
  getDistinctJobTypes,
  getJobStats,
  getSourceFacetsFromDb,
  getTopLocationsFromDb,
  hasAnyJobListings,
  searchJobListings,
} from '@/lib/jobs/query';
import { JOB_SOURCES_CATALOG } from '@/lib/jobs/sources-catalog';
import type { Job } from '@/lib/jobs/types';

function mergeFacets(
  dbFacets: { sourceId: string; count: number }[],
  liveJobs: Job[]
): SourceFacet[] {
  const counts = new Map<string, number>();
  for (const f of dbFacets) counts.set(f.sourceId, f.count);
  for (const job of liveJobs) {
    if (!job.sourceId) continue;
    counts.set(job.sourceId, (counts.get(job.sourceId) ?? 0) + 1);
  }

  return JOB_SOURCES_CATALOG.map((meta) => ({
    id: meta.id,
    name: meta.name,
    website: meta.website,
    count: counts.get(meta.id) ?? 0,
  })).filter((f) => f.count > 0);
}

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
  const [facets, types, totalMatching, locationSuggestions] = await Promise.all([
    getSourceFacetsFromDb(filters),
    getDistinctJobTypes(filters),
    countJobListings(filters),
    getTopLocationsFromDb(filters),
  ]);

  return {
    sources: mergeSourceFacetsWithSelection(mergeFacets(facets, []), filters.sourceIds),
    types,
    totalMatching,
    locationSuggestions,
  };
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
        const jobs = await searchJobListings(filters, limit, offset);
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
          hasMore = offset + enrichedJobs.length < totalMatching;
        }

        return {
          jobs: enrichedJobs,
          stats: statsFromFilteredJobs(enrichedJobs),
          totalMatching,
          hasMore,
          offset,
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
    ? Math.min(150, Math.max(limit * 4, 60))
    : filters.sourceIds.length > 0 || hasNonSourceFilters
      ? 400
      : 250;
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
  const page = mixed.slice(offset, offset + limit);
  let jobs = await enrichJobsWithLogos(page, { allowLiveCache: refresh });

  if (refresh && jobs.length === 0) {
    try {
      if (await hasAnyJobListings()) {
        const dbJobs = await searchJobListings(filters, limit, offset);
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
          dbHasMore = offset + jobs.length < dbTotal;
        }

        const failedBoards = Object.keys(providerErrors).length;
        return {
          jobs,
          stats: statsFromFilteredJobs(jobs),
          totalMatching: dbTotal,
          hasMore: dbHasMore,
          offset,
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
        message =
          'Live listings from job board APIs. Admin → Sync all sources saves them to your database.';
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
    hasMore: offset + jobs.length < totalMatching,
    offset,
    sources,
    types,
    locationSuggestions,
    filters,
    mode: 'live' as const,
    providerErrors,
    message,
  };
}
