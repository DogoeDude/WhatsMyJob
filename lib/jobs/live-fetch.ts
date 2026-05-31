import { getActiveProviders } from '@/lib/jobs/providers';
import { getSourceMeta } from '@/lib/jobs/sources-catalog';
import type { Job, NormalizedJobInput } from '@/lib/jobs/types';
import { formatPostedDate } from '@/lib/jobs/utils';

function normalizedToJob(
  input: NormalizedJobInput,
  sourceId: string,
  sourceName: string
): Job {
  const meta = getSourceMeta(sourceId);
  return {
    id: `${sourceId}-${input.externalId}`,
    title: input.title,
    company: input.company,
    location: input.location,
    salary: input.salary ?? 'Not disclosed',
    type: input.type ?? 'Full-time',
    tags: input.tags ?? [],
    description: input.description,
    requirements: input.requirements ?? [],
    benefits: input.benefits ?? [],
    postedDate: formatPostedDate(input.postedAt),
    applyUrl: input.applyUrl,
    sourceId,
    source: sourceName,
    sourceWebsite: meta?.website,
    logoUrl: input.logoUrl,
  };
}

function dedupeJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  const out: Job[] = [];
  for (const job of jobs) {
    const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}

/** Fetch from all configured public APIs (no database). */
export async function fetchLiveJobs(limit = 300): Promise<{
  jobs: Job[];
  providerErrors: Record<string, string>;
}> {
  const providers = getActiveProviders();
  const providerErrors: Record<string, string> = {};
  const merged: Job[] = [];

  const results = await Promise.allSettled(
    providers.map(async (provider) => {
      const items = await provider.fetchJobs();
      return items.map((item) => normalizedToJob(item, provider.id, provider.name));
    })
  );

  results.forEach((result, i) => {
    const provider = providers[i];
    if (result.status === 'fulfilled') {
      merged.push(...result.value);
    } else {
      const msg =
        result.reason instanceof Error ? result.reason.message : 'Fetch failed';
      providerErrors[provider.id] = msg;
      console.warn(`[live-fetch] ${provider.id}:`, msg);
    }
  });

  const jobs = dedupeJobs(merged).slice(0, limit);
  return { jobs, providerErrors };
}
