import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { sanitizeLogoUrl, stripHtml } from '@/lib/jobs/utils';

type RemotiveJob = {
  id: number;
  title: string;
  company_name: string;
  company_logo?: string;
  candidate_required_location?: string;
  job_type?: string;
  salary?: string;
  url: string;
  publication_date: string;
  description: string;
  tags?: string[];
};

export const remotiveProvider: JobProvider = {
  id: 'remotive',
  name: 'Remotive',
  isConfigured: () => true,
  async fetchJobs() {
    const res = await fetch('https://remotive.com/api/remote-jobs', {
      next: { revalidate: 0 },
      headers: { Accept: 'application/json' },
    });

    if (!res.ok) {
      throw new Error(`Remotive API error: ${res.status}`);
    }

    const data = (await res.json()) as { jobs?: RemotiveJob[] };
    const jobs = data.jobs ?? [];

    return jobs.map(
      (job): NormalizedJobInput => ({
        externalId: String(job.id),
        title: job.title,
        company: job.company_name,
        location: job.candidate_required_location?.trim() || 'Remote',
        salary: job.salary?.trim() || 'Not disclosed',
        type: job.job_type?.trim() || 'Remote',
        description: stripHtml(job.description),
        tags: job.tags ?? [],
        applyUrl: job.url,
        logoUrl: sanitizeLogoUrl(job.company_logo),
        postedAt: job.publication_date ? new Date(job.publication_date) : null,
      })
    );
  },
};
