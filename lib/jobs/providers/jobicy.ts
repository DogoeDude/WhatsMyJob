import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { sanitizeLogoUrl, stripHtml } from '@/lib/jobs/utils';

type JobicyJob = {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  jobType?: string;
  jobGeo?: string;
  jobDescription?: string;
  pubDate?: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  salaryCurrency?: string;
  tags?: string[];
};

export const jobicyProvider: JobProvider = {
  id: 'jobicy',
  name: 'Jobicy',
  isConfigured: () => true,
  async fetchJobs() {
    const res = await fetch('https://jobicy.com/api/v2/remote-jobs?count=50', {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Jobicy API error: ${res.status}`);

    const data = (await res.json()) as { jobs?: JobicyJob[] };
    const jobs = data.jobs ?? [];

    return jobs.map((job): NormalizedJobInput => {
      let salary = 'Not disclosed';
      if (job.annualSalaryMin && job.annualSalaryMax && job.salaryCurrency) {
        salary = `${job.salaryCurrency} ${Math.round(job.annualSalaryMin / 1000)}k–${Math.round(job.annualSalaryMax / 1000)}k`;
      }

      return {
        externalId: String(job.id),
        title: job.jobTitle,
        company: job.companyName,
        location: job.jobGeo?.trim() || 'Remote',
        salary,
        type: job.jobType ?? 'Remote',
        description: stripHtml(job.jobDescription ?? ''),
        tags: job.tags ?? [],
        applyUrl: job.url,
        logoUrl: sanitizeLogoUrl(job.companyLogo),
        postedAt: job.pubDate ? new Date(job.pubDate) : null,
      };
    });
  },
};
