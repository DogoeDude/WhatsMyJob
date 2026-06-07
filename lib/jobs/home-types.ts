import type { SourceFacet } from '@/lib/jobs/filters';
import type { Job } from '@/lib/jobs/types';

export type JobsHomeInitialData = {
  jobs: Job[];
  totalMatching: number;
  hasMore: boolean;
  /** DB/live slice start — used for load-more pagination after a random browse window. */
  browseOffset: number;
  sources: SourceFacet[];
  types: string[];
  locationSuggestions: string[];
  mode?: 'database' | 'live';
  message?: string;
  /** SSR already loaded sidebar facets — skip immediate client refetch. */
  metaLoaded?: boolean;
};
