import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { stripHtml } from '@/lib/jobs/utils';

type ArbeitnowJob = {
  slug: string;
  title: string;
  company_name: string;
  location?: string;
  remote: boolean;
  url: string;
  description: string;
  tags?: string[];
  job_types?: string[];
  created_at?: number;
};

export const arbeitnowProvider: JobProvider = {
  id: 'arbeitnow',
  name: 'Arbeitnow',
  isConfigured: () => true,
  async fetchJobs() {
    const res = await fetch('https://www.arbeitnow.com/api/job-board-api', {
      next: { revalidate: 0 },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Arbeitnow API error: ${res.status}`);
    }

    const data = (await res.json()) as { data?: ArbeitnowJob[] };
    const jobs = data.data ?? [];

    return jobs.map(
      (job): NormalizedJobInput => ({
        externalId: job.slug,
        title: job.title,
        company: job.company_name,
        location: job.remote
          ? job.location?.trim() || 'Remote'
          : job.location?.trim() || 'On-site',
        type: job.job_types?.[0] ?? (job.remote ? 'Remote' : 'Full-time'),
        description: stripHtml(job.description),
        tags: job.tags ?? [],
        applyUrl: job.url,
        postedAt: job.created_at ? new Date(job.created_at * 1000) : null,
      })
    );
  },
};
