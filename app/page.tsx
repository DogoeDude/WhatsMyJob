import { headers } from 'next/headers';
import { JobsHome, type JobsHomeInitialData } from '@/components/jobs-home';
import { auth } from '@/lib/auth';
import { browseJobLimit } from '@/lib/jobs/browse-limit';
import { DEFAULT_JOB_LIST_FILTERS } from '@/lib/jobs/default-filters';
import { getJobsForApp } from '@/lib/jobs/service';

export default async function Home() {
  let initialData: JobsHomeInitialData | undefined;

  const session = await auth.api.getSession({ headers: await headers() });
  const limit = browseJobLimit(!!session);

  try {
    const result = await getJobsForApp(DEFAULT_JOB_LIST_FILTERS, limit, 0, {
      includeMeta: false,
    });
    initialData = {
      jobs: result.jobs,
      totalMatching: result.totalMatching,
      hasMore: result.hasMore,
      sources: [],
      types: [],
      locationSuggestions: [],
      mode: result.mode,
      message: result.message,
    };
  } catch (err) {
    console.error('[Home] initial jobs load', err);
  }

  return <JobsHome initialData={initialData} />;
}
