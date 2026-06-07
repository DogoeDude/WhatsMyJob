import type { Job } from '@/lib/jobs/types';
import { ALL_CATEGORY_ID, getCategoryById, jobMatchesCategory } from '@/lib/jobs/categories';
import { JOB_SOURCES_CATALOG } from '@/lib/jobs/sources-catalog';

export type JobListFilters = {
  search: string;
  sourceIds: string[];
  type: string;
  location: string;
  category: string;
};

export type SourceFacet = {
  id: string;
  name: string;
  website: string;
  count: number;
};

/** Default home browse — no keyword, source, type, location, or category filters. */
export function isDefaultJobBrowse(filters: JobListFilters): boolean {
  return (
    filters.search.trim() === '' &&
    filters.sourceIds.length === 0 &&
    filters.type === '' &&
    filters.location === '' &&
    (!filters.category || filters.category === ALL_CATEGORY_ID)
  );
}

export function parseJobFilters(searchParams: URLSearchParams): JobListFilters {
  const fromList = searchParams.get('sources')?.split(',').map((s) => s.trim()) ?? [];
  const sourceIds = [...searchParams.getAll('source'), ...fromList].filter(Boolean);

  const uniqueSources = [...new Set(sourceIds)].filter((id) =>
    JOB_SOURCES_CATALOG.some((s) => s.id === id)
  );

  return {
    search: searchParams.get('q') ?? '',
    sourceIds: uniqueSources,
    type: searchParams.get('type')?.trim() ?? '',
    location: searchParams.get('location')?.trim() ?? '',
    category: searchParams.get('category')?.trim() ?? ALL_CATEGORY_ID,
  };
}

export function applyJobFilters(jobs: Job[], filters: JobListFilters): Job[] {
  let result = jobs;

  if (filters.sourceIds.length > 0) {
    const set = new Set(filters.sourceIds);
    result = result.filter((j) => j.sourceId && set.has(j.sourceId));
  }

  if (filters.type) {
    const t = filters.type.toLowerCase();
    result = result.filter((j) => j.type.toLowerCase().includes(t));
  }

  if (filters.location) {
    const loc = filters.location.toLowerCase();
    result = result.filter((j) => j.location.toLowerCase().includes(loc));
  }

  if (filters.category && filters.category !== ALL_CATEGORY_ID) {
    result = result.filter((j) => jobMatchesCategory(j, filters.category));
  }

  const q = filters.search.trim().toLowerCase();
  if (q) {
    result = result.filter(
      (j) =>
        j.title.toLowerCase().includes(q) ||
        j.company.toLowerCase().includes(q) ||
        j.location.toLowerCase().includes(q) ||
        j.description.toLowerCase().includes(q)
    );
  }

  return result;
}

export function buildSourceFacets(jobs: Job[]): SourceFacet[] {
  const counts = new Map<string, number>();
  for (const job of jobs) {
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

/** Facets for chips: always include selected boards even if count is 0 after filtering. */
export function mergeSourceFacetsWithSelection(
  facets: SourceFacet[],
  selectedSourceIds: string[]
): SourceFacet[] {
  const byId = new Map(facets.map((f) => [f.id, f]));
  for (const id of selectedSourceIds) {
    if (!byId.has(id)) {
      const meta = JOB_SOURCES_CATALOG.find((s) => s.id === id);
      if (meta) {
        byId.set(id, {
          id: meta.id,
          name: meta.name,
          website: meta.website,
          count: 0,
        });
      }
    }
  }
  return [...byId.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function statsFromFilteredJobs(jobs: Job[]) {
  return {
    totalJobs: jobs.length,
    locationCount: new Set(jobs.map((j) => j.location)).size,
    companyCount: new Set(jobs.map((j) => j.company)).size,
  };
}
