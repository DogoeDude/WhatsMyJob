import { cache } from 'react';
import { unstable_cache } from 'next/cache';
import { getCachedSession } from '@/lib/auth-session';
import { getCatalogStaleCached, isCatalogStale } from '@/lib/jobs/catalog-freshness';
import { browseJobLimit } from '@/lib/jobs/browse-limit';
import { DEFAULT_JOB_LIST_FILTERS } from '@/lib/jobs/default-filters';
import { getJobsFilterMeta, getJobsForApp } from '@/lib/jobs/service';
import type { JobsHomeInitialData } from '@/lib/jobs/home-types';

async function loadHomeDataInner(hasSession: boolean): Promise<JobsHomeInitialData | undefined> {
  const limit = browseJobLimit(hasSession);
  const catalogStale = hasSession ? await getCatalogStaleCached() : await isCatalogStale();

  try {
    const [result, meta] = await Promise.all([
      getJobsForApp(DEFAULT_JOB_LIST_FILTERS, limit, 0, {
        includeMeta: false,
        catalogStale,
      }),
      getJobsFilterMeta(DEFAULT_JOB_LIST_FILTERS).catch((err) => {
        console.error('[Home] filter meta', err);
        return null;
      }),
    ]);

    return {
      jobs: result.jobs,
      totalMatching: meta?.totalMatching ?? result.totalMatching,
      hasMore: meta
        ? result.offset + result.jobs.length < (meta?.totalMatching ?? result.totalMatching)
        : result.hasMore,
      browseOffset: result.offset,
      sources:
        meta?.sources && meta.sources.length > 0
          ? meta.sources
          : (result.sources ?? []),
      types:
        meta?.types && meta.types.length > 0 ? meta.types : (result.types ?? []),
      locationSuggestions:
        meta?.locationSuggestions && meta.locationSuggestions.length > 0
          ? meta.locationSuggestions
          : (result.locationSuggestions ?? []),
      mode: result.mode,
      message: result.message,
      metaLoaded:
        meta !== null ||
        (result.sources?.length ?? 0) > 0 ||
        (result.types?.length ?? 0) > 0,
      catalogStale,
    };
  } catch (err) {
    console.error('[Home] initial jobs load', err);
    return undefined;
  }
}

/** Cross-request cache for signed-out home SSR (invalidated on job sync). */
const loadGuestHomeCached = unstable_cache(
  () => loadHomeDataInner(false),
  ['home-guest-initial-v1'],
  { revalidate: 45, tags: ['jobs-meta', 'home-guest'] }
);

/** One home-page data load per request (shared if layout also reads session). */
export const loadHomeInitialData = cache(async (): Promise<JobsHomeInitialData | undefined> => {
  const session = await getCachedSession();
  if (!session) {
    return loadGuestHomeCached();
  }
  return loadHomeDataInner(true);
});
