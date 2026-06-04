import { ALL_CATEGORY_ID } from '@/lib/jobs/categories';
import type { JobListFilters } from '@/lib/jobs/filters';

export function buildJobsSearchParams(
  q: string,
  filters: Pick<JobListFilters, 'sourceIds' | 'type' | 'location'>,
  category: string,
  offset: number,
  limit: number,
  options?: { reload?: boolean; metaOnly?: boolean; jobsOnly?: boolean }
): URLSearchParams {
  const params = new URLSearchParams();
  const trimmed = q.trim();
  if (trimmed) params.set('q', trimmed);
  params.set('limit', String(limit));
  params.set('offset', String(offset));
  if (category && category !== ALL_CATEGORY_ID) params.set('category', category);
  if (filters.type) params.set('type', filters.type);
  if (filters.location) params.set('location', filters.location);
  for (const id of filters.sourceIds) params.append('source', id);
  if (options?.reload) {
    params.set('refresh', '1');
    params.set('_', String(Date.now()));
  }
  if (options?.jobsOnly) params.set('meta', '0');
  if (options?.metaOnly) params.set('meta', '1');
  return params;
}
