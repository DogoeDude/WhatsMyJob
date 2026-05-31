import { prisma } from '@/lib/prisma';
import {
  applyJobFilters,
  buildSourceFacets,
  mergeSourceFacetsWithSelection,
  statsFromFilteredJobs,
  type JobListFilters,
  type SourceFacet,
} from '@/lib/jobs/filters';
import { enrichJobsWithLogos, clearLogoCache } from '@/lib/jobs/enrich-logos';
import { fetchLiveJobs } from '@/lib/jobs/live-fetch';
import { getTopLocationsFromJobs } from '@/lib/jobs/filter-suggestions';
import { dedupeStrings } from '@/lib/jobs/utils';
import {
  countJobListings,
  getDistinctJobTypes,
  getJobStats,
  getSourceFacetsFromDb,
  getTopLocationsFromDb,
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
    const totalInDb = await prisma.jobListing.count();
    if (totalInDb > 0) {
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

  const { jobs } = await fetchLiveJobs(500);
  return {
    totalJobs: jobs.length,
    locationCount: new Set(jobs.map((j) => j.location)).size,
    companyCount: new Set(jobs.map((j) => j.company)).size,
    mode: 'live' as const,
  };
}

export async function getJobsForApp(
  filters: JobListFilters,
  limit: number,
  offset = 0,
  options?: { forceLive?: boolean }
) {
  const forceLive = options?.forceLive ?? false;

  if (!forceLive) {
    try {
      const totalInDb = await prisma.jobListing.count();

      if (totalInDb > 0) {
      const [jobs, facets, types, totalMatching, locationSuggestions] = await Promise.all([
        searchJobListings(filters, limit, offset),
        getSourceFacetsFromDb(filters),
        getDistinctJobTypes(filters),
        countJobListings(filters),
        getTopLocationsFromDb(filters),
      ]);

      const enrichedJobs = await enrichJobsWithLogos(jobs);

      const sources = mergeSourceFacetsWithSelection(
        mergeFacets(facets, []),
        filters.sourceIds
      );

      return {
        jobs: enrichedJobs,
        stats: statsFromFilteredJobs(enrichedJobs),
        totalMatching,
        hasMore: offset + enrichedJobs.length < totalMatching,
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
  const livePoolSize =
    filters.sourceIds.length > 0 || hasNonSourceFilters ? 800 : 500;
  const { jobs: livePool, providerErrors } = await fetchLiveJobs(livePoolSize);
  const facetBase = applyJobFilters(livePool, { ...filters, sourceIds: [] });
  const sources = mergeSourceFacetsWithSelection(
    buildSourceFacets(facetBase),
    filters.sourceIds
  );
  const filtered = applyJobFilters(livePool, filters);
  const totalMatching = filtered.length;
  const jobs = filtered.slice(offset, offset + limit);
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
  } else if (options?.forceLive) {
    message = 'Refreshed from live job board APIs.';
  } else {
    try {
      const n = await prisma.jobListing.count();
      if (n === 0) {
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
