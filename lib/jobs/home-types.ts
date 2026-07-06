import type { SourceFacet } from '@/lib/jobs/filters';
import type { Job } from '@/lib/jobs/types';

export type JobsHomeInitialData = {
  jobs: Job[];
  totalMatching: number;
  hasMore: boolean;
  /** DB slice start — used for load-more pagination. */
  browseOffset: number;
  sources: SourceFacet[];
  types: string[];
  locationSuggestions: string[];
  mode?: 'database' | 'live';
  message?: string;
  /** SSR already loaded sidebar facets — skip immediate client refetch. */
  metaLoaded?: boolean;
  /** Saved catalog is older than the stale threshold — background sync may be running. */
  catalogStale?: boolean;
};
