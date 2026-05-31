import { fetchLiveJobs } from '@/lib/jobs/live-fetch';
import type { Job } from '@/lib/jobs/types';

const CACHE_TTL_MS = 5 * 60 * 1000;

type LogoCache = {
  at: number;
  byCompanySource: Map<string, string>;
  byTitleCompany: Map<string, string>;
};

let logoCache: LogoCache | null = null;

function jobMatchKey(sourceId: string | undefined, company: string, title?: string) {
  const c = company.trim().toLowerCase();
  const s = sourceId ?? '';
  if (title) return `${s}|${c}|${title.trim().toLowerCase()}`;
  return `${s}|${c}`;
}

async function buildLogoCache(): Promise<LogoCache> {
  if (logoCache && Date.now() - logoCache.at < CACHE_TTL_MS) {
    return logoCache;
  }

  const { jobs } = await fetchLiveJobs(800);
  const byCompanySource = new Map<string, string>();
  const byTitleCompany = new Map<string, string>();

  for (const job of jobs) {
    if (!job.logoUrl) continue;
    const companyKey = jobMatchKey(job.sourceId, job.company);
    if (!byCompanySource.has(companyKey)) {
      byCompanySource.set(companyKey, job.logoUrl);
    }
    byTitleCompany.set(jobMatchKey(job.sourceId, job.company, job.title), job.logoUrl);
  }

  logoCache = { at: Date.now(), byCompanySource, byTitleCompany };
  return logoCache;
}

/** Fill missing logoUrl on jobs using a cached live-API logo map. */
export async function enrichJobsWithLogos(jobs: Job[]): Promise<Job[]> {
  if (jobs.length === 0 || jobs.every((j) => j.logoUrl)) return jobs;

  try {
    const cache = await buildLogoCache();
    return jobs.map((job) => {
      if (job.logoUrl) return job;
      const exact = cache.byTitleCompany.get(
        jobMatchKey(job.sourceId, job.company, job.title)
      );
      if (exact) return { ...job, logoUrl: exact };
      const company = cache.byCompanySource.get(jobMatchKey(job.sourceId, job.company));
      if (company) return { ...job, logoUrl: company };
      return job;
    });
  } catch (err) {
    console.warn('[enrichJobsWithLogos]', err);
    return jobs;
  }
}

export function clearLogoCache() {
  logoCache = null;
}
