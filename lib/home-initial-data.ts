import { cache } from 'react';
import { getCachedSession } from '@/lib/auth-session';
import { browseJobLimit } from '@/lib/jobs/browse-limit';
import { DEFAULT_JOB_LIST_FILTERS } from '@/lib/jobs/default-filters';
import { getJobsFilterMeta, getJobsForApp } from '@/lib/jobs/service';
import type { JobsHomeInitialData } from '@/lib/jobs/home-types';

/** One home-page data load per request (shared if layout also reads session). */
export const loadHomeInitialData = cache(async (): Promise<JobsHomeInitialData | undefined> => {
  const session = await getCachedSession();
  const limit = browseJobLimit(!!session);

  try {
    const [result, meta] = await Promise.all([
      getJobsForApp(DEFAULT_JOB_LIST_FILTERS, limit, 0, { includeMeta: false }),
      getJobsFilterMeta(DEFAULT_JOB_LIST_FILTERS).catch((err) => {
        console.error('[Home] filter meta', err);
        return null;
      }),
    ]);

    return {
      jobs: result.jobs,
      totalMatching: meta?.totalMatching ?? result.totalMatching,
      hasMore: meta
        ? result.jobs.length < meta.totalMatching
        : result.hasMore,
      sources: meta?.sources ?? [],
      types: meta?.types ?? [],
      locationSuggestions: meta?.locationSuggestions ?? [],
      mode: result.mode,
      message: result.message,
      metaLoaded: meta !== null,
    };
  } catch (err) {
    console.error('[Home] initial jobs load', err);
    return undefined;
  }
});
