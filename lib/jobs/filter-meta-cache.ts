import { unstable_cache } from 'next/cache';
import { isDatabaseConfigured } from '@/lib/prisma';
import type { JobListFilters } from '@/lib/jobs/filters';
import { mergeSourceFacetsWithSelection, type SourceFacet } from '@/lib/jobs/filters';
import { JOB_SOURCES_CATALOG } from '@/lib/jobs/sources-catalog';
import {
  countJobListings,
  getDistinctJobTypes,
  getSourceFacetsFromDb,
  getTopLocationsFromDb,
} from '@/lib/jobs/query';

export type JobsFilterMeta = {
  sources: SourceFacet[];
  types: string[];
  totalMatching: number;
  locationSuggestions: string[];
};

function mergeFacets(dbFacets: { sourceId: string; count: number }[]): SourceFacet[] {
  const counts = new Map<string, number>();
  for (const f of dbFacets) counts.set(f.sourceId, f.count);

  return JOB_SOURCES_CATALOG.map((meta) => ({
    id: meta.id,
    name: meta.name,
    website: meta.website,
    count: counts.get(meta.id) ?? 0,
  })).filter((f) => f.count > 0);
}

export function filtersCacheKey(filters: JobListFilters): string {
  return JSON.stringify({
    search: filters.search.trim(),
    sourceIds: [...filters.sourceIds].sort(),
    type: filters.type,
    location: filters.location,
    category: filters.category,
  });
}

async function loadJobsFilterMeta(filters: JobListFilters): Promise<JobsFilterMeta> {
  if (!isDatabaseConfigured()) {
    return {
      sources: [],
      types: [],
      totalMatching: 0,
      locationSuggestions: [],
    };
  }

  const [facets, types, totalMatching, locationSuggestions] = await Promise.all([
    getSourceFacetsFromDb(filters),
    getDistinctJobTypes(filters),
    countJobListings(filters),
    getTopLocationsFromDb(filters),
  ]);

  return {
    sources: mergeSourceFacetsWithSelection(mergeFacets(facets), filters.sourceIds),
    types,
    totalMatching,
    locationSuggestions,
  };
}

/** Cross-request cache for sidebar facets (invalidated on job sync). */
export function getJobsFilterMetaCached(filters: JobListFilters): Promise<JobsFilterMeta> {
  const key = filtersCacheKey(filters);
  return unstable_cache(() => loadJobsFilterMeta(filters), ['jobs-filter-meta', key], {
    revalidate: 60,
    tags: ['jobs-meta'],
  })();
}
