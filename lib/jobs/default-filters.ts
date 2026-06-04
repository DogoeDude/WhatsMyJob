import { ALL_CATEGORY_ID } from '@/lib/jobs/categories';
import type { JobListFilters } from '@/lib/jobs/filters';

export const DEFAULT_JOB_LIST_FILTERS: JobListFilters = {
  search: '',
  sourceIds: [],
  type: '',
  location: '',
  category: ALL_CATEGORY_ID,
};
