import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { stripHtml } from '@/lib/jobs/utils';

type CareerNestJob = {
  id: number;
  title: string;
  company: string;
  location?: string;
  job_type?: string;
  category?: string;
  description?: string;
  salary?: string | null;
  posted_at?: string;
  apply_url?: string;
  job_url?: string;
};

export const careernestProvider: JobProvider = {
  id: 'careernest',
  name: 'Career Nest',
  isConfigured: () => true,
  async fetchJobs() {
    const all: NormalizedJobInput[] = [];
    const maxPages = 5;

    for (let page = 1; page <= maxPages; page++) {
      const res = await fetch(
        `https://careernest.cloud/api/feed?limit=50&page=${page}`,
        { headers: { Accept: 'application/json' }, cache: 'no-store' }
      );

      if (!res.ok) throw new Error(`Career Nest API error: ${res.status}`);

      const data = (await res.json()) as { jobs?: CareerNestJob[] };
      const batch = data.jobs ?? [];
      if (batch.length === 0) break;

      for (const job of batch) {
        all.push({
          externalId: String(job.id),
          title: job.title,
          company: job.company || 'Unknown',
          location: job.location?.trim() || 'Remote',
          salary: job.salary?.trim() || 'Not disclosed',
          type: job.job_type ?? 'Full-time',
          description: stripHtml(job.description ?? ''),
          tags: job.category ? [job.category] : [],
          applyUrl: job.apply_url ?? job.job_url,
          postedAt: job.posted_at ? new Date(job.posted_at) : null,
        });
      }

      if (batch.length < 50) break;
    }

    return all;
  },
};
