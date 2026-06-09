import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { stripHtml } from '@/lib/jobs/utils';

type WorkbeamJob = {
  slug: string;
  title: string;
  company: string;
  location?: string;
  remote?: boolean;
  remoteScope?: string;
  category?: string;
  seniority?: string;
  employmentType?: string | null;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  applyUrl?: string;
  postedAt?: string;
};

type WorkbeamResponse = {
  jobs?: WorkbeamJob[];
  count?: number;
};

function formatSalary(job: WorkbeamJob): string {
  const currency = job.salaryCurrency ?? 'USD';
  const symbol = currency === 'USD' ? '$' : currency;
  if (job.salaryMin && job.salaryMax) {
    return `${symbol}${Math.round(job.salaryMin / 1000)}k–${Math.round(job.salaryMax / 1000)}k`;
  }
  if (job.salaryMin) return `From ${symbol}${Math.round(job.salaryMin / 1000)}k`;
  return 'Not disclosed';
}

function mapJob(job: WorkbeamJob): NormalizedJobInput {
  const tags = [job.category, job.seniority, job.remoteScope].filter(
    (t): t is string => typeof t === 'string' && t.length > 0
  );

  let postedAt: Date | null = null;
  if (job.postedAt) {
    const parsed = new Date(job.postedAt);
    postedAt = Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return {
    externalId: job.slug,
    title: job.title,
    company: job.company,
    location: job.remote ? `Remote${job.location ? ` · ${job.location}` : ''}` : job.location ?? 'Remote',
    salary: formatSalary(job),
    type: job.employmentType?.replace(/_/g, ' ') || (job.remote ? 'Remote' : 'Full-time'),
    description: '',
    tags,
    applyUrl: job.applyUrl,
    postedAt,
  };
}

/** Free public API — tech jobs from company career pages (no API key). */
export const workbeamProvider: JobProvider = {
  id: 'workbeam',
  name: 'Workbeam',
  isConfigured: () => true,
  async fetchJobs() {
    const query = process.env.WORKBEAM_QUERY?.trim() || 'developer';
    const limit = process.env.WORKBEAM_LIMIT?.trim() || '100';
    const params = new URLSearchParams({ q: query, limit, page: '1' });

    const remote = process.env.WORKBEAM_REMOTE?.trim();
    if (remote) params.set('remote', remote);

    const category = process.env.WORKBEAM_CATEGORY?.trim();
    if (category) params.set('category', category);

    const res = await fetch(`https://workbeamhq.com/api/v1/jobs?${params}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Workbeam API error: ${res.status}`);

    const data = (await res.json()) as WorkbeamResponse;
    const jobs = data.jobs ?? [];
    if (jobs.length === 0) throw new Error('Workbeam returned no jobs');

    return jobs.map(mapJob);
  },
};
