import { mergeSourceFacetsWithSelection, type SourceFacet } from '@/lib/jobs/filters';
import type { Job } from '@/lib/jobs/types';
import { getActiveProviders } from '@/lib/jobs/providers';
import { JOB_SOURCES_CATALOG } from '@/lib/jobs/sources-catalog';

function countsFromJobs(jobs: Job[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    if (!job.sourceId) continue;
    counts.set(job.sourceId, (counts.get(job.sourceId) ?? 0) + 1);
  }
  return counts;
}

function countsFromDbFacets(facets: { sourceId: string; count: number }[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const f of facets) counts.set(f.sourceId, f.count);
  return counts;
}

/** All configured boards for the sidebar — includes zero-count sources. */
export function buildActiveSourceFacets(
  counts: Map<string, number>,
  selectedSourceIds: string[] = []
): SourceFacet[] {
  const facets: SourceFacet[] = getActiveProviders().map((provider) => {
    const meta = JOB_SOURCES_CATALOG.find((s) => s.id === provider.id);
    return {
      id: provider.id,
      name: meta?.name ?? provider.name,
      website: meta?.website ?? '',
      count: counts.get(provider.id) ?? 0,
    };
  });

  return mergeSourceFacetsWithSelection(facets, selectedSourceIds).sort(
    (a, b) => b.count - a.count || a.name.localeCompare(b.name)
  );
}

export function buildActiveSourceFacetsFromJobs(
  jobs: Job[],
  selectedSourceIds: string[] = []
): SourceFacet[] {
  return buildActiveSourceFacets(countsFromJobs(jobs), selectedSourceIds);
}

export function buildActiveSourceFacetsFromDb(
  dbFacets: { sourceId: string; count: number }[],
  selectedSourceIds: string[] = []
): SourceFacet[] {
  return buildActiveSourceFacets(countsFromDbFacets(dbFacets), selectedSourceIds);
}
