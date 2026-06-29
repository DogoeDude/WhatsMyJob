import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { fetchJobDescription } from '@/lib/jobs/fetch-job-description';
import { mapWithConcurrency } from '@/lib/jobs/scrape/extract';
import { envEnabled, envInt } from '@/lib/jobs/sync-config';
import { stripHtml } from '@/lib/jobs/utils';

type JobsBaseJob = {
  id: string;
  title: string;
  company: string;
  display_location?: string;
  country?: string;
  type?: string;
  workplace?: string;
  seniority_level?: string;
  salary_min?: number | null;
  salary_max?: number | null;
  salary_period?: string | null;
  currency?: string | null;
  skills?: string[];
  job_url?: string;
  posted_at?: string;
};

type JobsBaseResponse = {
  jobs?: JobsBaseJob[];
  has_more?: boolean;
  next_cursor?: string | null;
};

function formatSalary(job: JobsBaseJob): string {
  const currency = job.currency ?? 'USD';
  if (job.salary_min && job.salary_max) {
    return `${currency} ${Math.round(job.salary_min / 1000)}k–${Math.round(job.salary_max / 1000)}k`;
  }
  if (job.salary_min) return `From ${currency} ${Math.round(job.salary_min / 1000)}k`;
  return 'Not disclosed';
}

function mapJob(job: JobsBaseJob): NormalizedJobInput {
  const tags = [
    job.workplace,
    job.seniority_level,
    ...(Array.isArray(job.skills) ? job.skills.slice(0, 8) : []),
  ].filter((t): t is string => typeof t === 'string' && t.length > 0);

  let postedAt: Date | null = null;
  if (job.posted_at) {
    const parsed = new Date(job.posted_at);
    postedAt = Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return {
    externalId: job.id,
    title: job.title,
    company: job.company,
    location: job.display_location?.trim() || job.country || 'Remote',
    salary: formatSalary(job),
    type: job.type?.replace(/-/g, ' ') || job.workplace || 'Full-time',
    description: '',
    tags,
    applyUrl: job.job_url,
    postedAt,
  };
}

async function fetchCountryJobs(
  country: string,
  query: string,
  maxPages: number
): Promise<NormalizedJobInput[]> {
  const out: NormalizedJobInput[] = [];
  let cursor: string | null | undefined;

  for (let page = 0; page < maxPages; page++) {
    const params = new URLSearchParams({
      q: query,
      country,
      limit: '50',
      sort: 'posted_at',
    });
    if (cursor) params.set('cursor', cursor);

    const res = await fetch(`https://jobsbase.io/api/v1/jobs?${params}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) {
      throw new Error(`Jobs Base API error (${country}): ${res.status}`);
    }

    const data = (await res.json()) as JobsBaseResponse;
    const batch = data.jobs ?? [];
    out.push(...batch.map(mapJob));

    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }

  return out;
}

/** Free public API — builder/tech roles (no API key). */
export const jobsbaseProvider: JobProvider = {
  id: 'jobsbase',
  name: 'Jobs Base',
  isConfigured: () => true,
  async fetchJobs() {
    const query = process.env.JOBSBASE_QUERY?.trim() || 'developer';
    const countries = (process.env.JOBSBASE_COUNTRIES?.trim() || 'US,GB,SG,CA,AU,DE')
      .split(',')
      .map((c) => c.trim().toUpperCase())
      .filter(Boolean);
    const maxPages = envInt('JOBSBASE_PAGES', 4, 10);

    const batches = await Promise.all(
      countries.map((country) => fetchCountryJobs(country, query, maxPages))
    );

    const merged: NormalizedJobInput[] = [];
    const seen = new Set<string>();
    for (const batch of batches) {
      for (const job of batch) {
        if (seen.has(job.externalId)) continue;
        seen.add(job.externalId);
        merged.push(job);
      }
    }

    if (merged.length === 0) {
      throw new Error('Jobs Base returned no jobs for configured countries');
    }

    if (!envEnabled('JOBSBASE_FETCH_DESCRIPTIONS', true)) {
      return merged;
    }

    return mapWithConcurrency(merged, 5, async (job) => {
      const description = await fetchJobDescription('jobsbase', job.externalId);
      return description ? { ...job, description: stripHtml(description) } : job;
    });
  },
};
