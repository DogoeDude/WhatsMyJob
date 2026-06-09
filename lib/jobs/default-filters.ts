import { ALL_CATEGORY_ID } from '@/lib/jobs/categories';
import type { JobListFilters } from '@/lib/jobs/filters';

export const DEFAULT_JOB_LIST_FILTERS: JobListFilters = {
  search: '',
  sourceIds: [],
  type: '',
  location: '',
  category: ALL_CATEGORY_ID,
};

export function isDefaultBrowseFilters(filters: JobListFilters): boolean {
  return (
    filters.search.trim() === '' &&
    filters.category === ALL_CATEGORY_ID &&
    filters.sourceIds.length === 0 &&
    !filters.type &&
    !filters.location
  );
}
