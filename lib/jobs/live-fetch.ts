import { getActiveProviders } from '@/lib/jobs/providers';
import { getSourceMeta } from '@/lib/jobs/sources-catalog';
import type { Job, NormalizedJobInput } from '@/lib/jobs/types';
import { formatPostedDate, sortJobsByRecency } from '@/lib/jobs/utils';

const PROVIDER_TIMEOUT_MS = 8_000;

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
    postedAtMs: input.postedAt?.getTime() ?? 0,
    applyUrl: input.applyUrl,
    sourceId,
    externalId: input.externalId,
    source: sourceName,
    sourceWebsite: meta?.website,
    logoUrl: input.logoUrl,
  };
}

function dedupeJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  const out: Job[] = [];
  for (const job of jobs) {
    const key = `${job.sourceId ?? ''}|${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(job);
  }
  return out;
}

/** Mix boards on one page instead of one source filling the whole list. */
export function interleaveJobsBySource(jobs: Job[]): Job[] {
  const buckets = new Map<string, Job[]>();
  for (const job of jobs) {
    const id = job.sourceId ?? 'unknown';
    const list = buckets.get(id) ?? [];
    list.push(job);
    buckets.set(id, list);
  }

  const sourceIds = [...buckets.keys()];
  const out: Job[] = [];
  let index = 0;
  let remaining = jobs.length;

  while (remaining > 0) {
    let pushed = false;
    for (const sourceId of sourceIds) {
      const list = buckets.get(sourceId)!;
      if (index < list.length) {
        out.push(list[index]);
        remaining--;
        pushed = true;
      }
    }
    if (!pushed) break;
    index++;
  }

  return out;
}

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${ms / 1000}s`));
    }, ms);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/** Fetch from configured public APIs (no database). Returns partial results on slow boards. */
export async function fetchLiveJobs(limit = 300): Promise<{
  jobs: Job[];
  providerErrors: Record<string, string>;
}> {
  const providers = getActiveProviders();
  const providerErrors: Record<string, string> = {};
  const merged: Job[] = [];
  const target = Math.max(limit, 60);

  const results = await Promise.allSettled(
    providers.map(async (provider) => {
      const items = await withTimeout(
        provider.fetchJobs(),
        PROVIDER_TIMEOUT_MS,
        provider.name
      );
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

  const jobs = sortJobsByRecency(dedupeJobs(merged)).slice(0, target);
  return { jobs, providerErrors };
}
