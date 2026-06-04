import { prisma } from '@/lib/prisma';
import { isPersistedJobId } from '@/lib/jobs/constants';
import { fetchLiveJobs } from '@/lib/jobs/live-fetch';
import { resolveJobLogoUrl } from '@/lib/jobs/resolve-logo';
import type { Job } from '@/lib/jobs/types';

const DB_CACHE_TTL_MS = 10 * 60 * 1000;
const LIVE_CACHE_TTL_MS = 15 * 60 * 1000;

type LogoCache = {
  at: number;
  byCompanySource: Map<string, string>;
  byTitleCompany: Map<string, string>;
  byCompany: Map<string, string>;
};

let dbLogoCache: LogoCache | null = null;
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

async function buildLogoCacheFromDb(): Promise<LogoCache> {
  if (dbLogoCache && Date.now() - dbLogoCache.at < DB_CACHE_TTL_MS) {
    return dbLogoCache;
  }

  const rows = await prisma.jobListing.findMany({
    where: { logoUrl: { not: null } },
    select: { sourceId: true, company: true, title: true, logoUrl: true },
    orderBy: { syncedAt: 'desc' },
    take: 8000,
  });

  const cache = emptyCache();
  for (const row of rows) {
    if (!row.logoUrl) continue;
    const job: Job = {
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
    };
    ingestJobsIntoCache([job], cache);
  }

  dbLogoCache = cache;
  return cache;
}

/** Start live logo map in parallel with the DB job query. */
export function primeLiveLogoCache(): Promise<LogoCache> {
  return buildLogoCacheFromLive();
}

/** Cached live API logos — used when DB rows are missing logoUrl. */
async function buildLogoCacheFromLive(): Promise<LogoCache> {
  if (liveLogoCache && Date.now() - liveLogoCache.at < LIVE_CACHE_TTL_MS) {
    return liveLogoCache;
  }

  const cache = emptyCache();
  const { jobs } = await fetchLiveJobs(600);
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
  liveCacheReady?: Promise<LogoCache>;
};

/**
 * Fill missing logos from DB + live maps, then ensure every job has a display URL.
 */
export async function enrichJobsWithLogos(
  jobs: Job[],
  options?: EnrichLogosOptions
): Promise<Job[]> {
  if (jobs.length === 0) return jobs;

  let result = jobs;

  try {
    const dbCache = await buildLogoCacheFromDb();
    result = applyLogoCache(result, dbCache);
  } catch (err) {
    console.warn('[enrichJobsWithLogos] db cache', err);
  }

  if (result.some((j) => !j.logoUrl)) {
    try {
      const liveCache = options?.liveCacheReady
        ? await options.liveCacheReady
        : await buildLogoCacheFromLive();
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
  dbLogoCache = null;
  liveLogoCache = null;
}
