import { prisma } from '@/lib/prisma';
import { isPersistedJobId } from '@/lib/jobs/constants';
import { fetchLiveJobs } from '@/lib/jobs/live-fetch';
import { resolveJobLogoUrl } from '@/lib/jobs/resolve-logo';
import type { Job } from '@/lib/jobs/types';

const LIVE_CACHE_TTL_MS = 15 * 60 * 1000;

type LogoCache = {
  at: number;
  byCompanySource: Map<string, string>;
  byTitleCompany: Map<string, string>;
  byCompany: Map<string, string>;
};

let liveLogoCache: LogoCache | null = null;

function jobMatchKey(sourceId: string | undefined, company: string, title?: string) {
  const c = company.trim().toLowerCase();
  const s = sourceId ?? '';
  if (title) return `${s}|${c}|${title.trim().toLowerCase()}`;
  return `${s}|${c}`;
}

function companyKey(company: string) {
  return company.trim().toLowerCase();
}

function ingestJobsIntoCache(jobs: Job[], target: LogoCache) {
  for (const job of jobs) {
    if (!job.logoUrl) continue;
    const ck = companyKey(job.company);
    if (!target.byCompany.has(ck)) {
      target.byCompany.set(ck, job.logoUrl);
    }
    const srcKey = jobMatchKey(job.sourceId, job.company);
    if (!target.byCompanySource.has(srcKey)) {
      target.byCompanySource.set(srcKey, job.logoUrl);
    }
    target.byTitleCompany.set(jobMatchKey(job.sourceId, job.company, job.title), job.logoUrl);
  }
}

function emptyCache(): LogoCache {
  return {
    at: Date.now(),
    byCompanySource: new Map(),
    byTitleCompany: new Map(),
    byCompany: new Map(),
  };
}

/** Scoped logo lookup for companies on the current page only. */
async function buildLogoCacheForJobs(jobs: Job[]): Promise<LogoCache> {
  const companies = [
    ...new Set(jobs.map((j) => j.company.trim()).filter((c) => c.length > 0)),
  ];
  if (companies.length === 0) return emptyCache();

  const rows = await prisma.jobListing.findMany({
    where: {
      logoUrl: { not: null },
      company: { in: companies },
    },
    select: { sourceId: true, company: true, title: true, logoUrl: true },
    orderBy: { syncedAt: 'desc' },
    take: Math.min(companies.length * 4, 200),
  });

  const cache = emptyCache();
  for (const row of rows) {
    if (!row.logoUrl) continue;
    ingestJobsIntoCache(
      [
        {
          id: '',
          title: row.title,
          company: row.company,
          location: '',
          salary: '',
          type: '',
          tags: [],
          description: '',
          requirements: [],
          benefits: [],
          postedDate: '',
          logoUrl: row.logoUrl,
          sourceId: row.sourceId,
        },
      ],
      cache
    );
  }
  return cache;
}

/** Cached live API logos — used when DB rows are missing logoUrl. */
async function buildLogoCacheFromLive(): Promise<LogoCache> {
  if (liveLogoCache && Date.now() - liveLogoCache.at < LIVE_CACHE_TTL_MS) {
    return liveLogoCache;
  }

  const cache = emptyCache();
  const { jobs } = await fetchLiveJobs(200);
  ingestJobsIntoCache(jobs, cache);
  liveLogoCache = cache;
  return cache;
}

function applyLogoCache(jobs: Job[], cache: LogoCache): Job[] {
  return jobs.map((job) => {
    if (job.logoUrl) return job;
    const exact = cache.byTitleCompany.get(
      jobMatchKey(job.sourceId, job.company, job.title)
    );
    if (exact) return { ...job, logoUrl: exact };
    const bySource = cache.byCompanySource.get(jobMatchKey(job.sourceId, job.company));
    if (bySource) return { ...job, logoUrl: bySource };
    const byCo = cache.byCompany.get(companyKey(job.company));
    if (byCo) return { ...job, logoUrl: byCo };
    return job;
  });
}

export type EnrichLogosOptions = {
  /** Only for manual live refresh — never on normal list loads. */
  allowLiveCache?: boolean;
};

/**
 * Fill missing logos from a small DB lookup, then favicon/avatar fallback.
 * Avoids fetching hundreds of jobs from external APIs on every page view.
 */
export async function enrichJobsWithLogos(
  jobs: Job[],
  options?: EnrichLogosOptions
): Promise<Job[]> {
  if (jobs.length === 0) return jobs;

  let result = jobs;

  if (result.some((j) => !j.logoUrl)) {
    try {
      const cache = await buildLogoCacheForJobs(result);
      result = applyLogoCache(result, cache);
    } catch (err) {
      console.warn('[enrichJobsWithLogos] scoped db cache', err);
    }
  }

  if (options?.allowLiveCache && result.some((j) => !j.logoUrl)) {
    try {
      const liveCache = await buildLogoCacheFromLive();
      result = applyLogoCache(result, liveCache);
    } catch (err) {
      console.warn('[enrichJobsWithLogos] live cache', err);
    }
  }

  void backfillLogosToDatabase(
    result.filter(
      (j) =>
        isPersistedJobId(j.id) &&
        j.logoUrl &&
        !j.logoUrl.includes('ui-avatars.com') &&
        !j.logoUrl.includes('google.com/s2/favicons')
    )
  );

  return result.map((job) => ({
    ...job,
    logoUrl: resolveJobLogoUrl(job.company, job.logoUrl),
  }));
}

/** Save discovered logos on synced rows so the next load can skip the live API pass. */
async function backfillLogosToDatabase(jobs: Job[]) {
  const updates = jobs.filter((j) => j.logoUrl && isPersistedJobId(j.id));
  if (updates.length === 0) return;

  await prisma.$transaction(
    updates.map((job) =>
      prisma.jobListing.updateMany({
        where: { id: job.id, logoUrl: null },
        data: { logoUrl: job.logoUrl! },
      })
    )
  );
}

export function clearLogoCache() {
  liveLogoCache = null;
}
