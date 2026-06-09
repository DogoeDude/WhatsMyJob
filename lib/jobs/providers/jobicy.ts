import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { envInt } from '@/lib/jobs/sync-config';
import { sanitizeLogoUrl, stripHtml } from '@/lib/jobs/utils';

type JobicyJob = {
  id: number;
  url: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  /** API returns an array, e.g. ["Full-Time"] */
  jobType?: string | string[];
  jobGeo?: string;
  jobDescription?: string;
  pubDate?: string;
  annualSalaryMin?: number;
  annualSalaryMax?: number;
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  salaryPeriod?: string;
  tags?: string[];
  jobIndustry?: string[];
};

function formatJobType(jobType: string | string[] | undefined): string {
  if (Array.isArray(jobType)) {
    return jobType.find((t) => typeof t === 'string' && t.trim())?.trim() || 'Remote';
  }
  return jobType?.trim() || 'Remote';
}

function formatSalary(job: JobicyJob): string {
  const min = job.salaryMin ?? job.annualSalaryMin;
  const max = job.salaryMax ?? job.annualSalaryMax;
  const currency = job.salaryCurrency?.trim();

  if (min && max && currency) {
    const period = job.salaryPeriod === 'yearly' ? '/yr' : '';
    return `${currency} ${Math.round(min / 1000)}k–${Math.round(max / 1000)}k${period}`;
  }
  if (min && currency) {
    return `From ${currency} ${Math.round(min / 1000)}k`;
  }
  return 'Not disclosed';
}

function mapJob(job: JobicyJob): NormalizedJobInput {
  const tags = [
    ...(Array.isArray(job.jobIndustry) ? job.jobIndustry : []),
    ...(Array.isArray(job.tags) ? job.tags : []),
  ].filter((tag): tag is string => typeof tag === 'string' && tag.trim().length > 0);

  let postedAt: Date | null = null;
  if (job.pubDate) {
    const parsed = new Date(job.pubDate);
    postedAt = Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return {
    externalId: String(job.id),
    title: job.jobTitle?.trim() || 'Untitled role',
    company: job.companyName?.trim() || 'Unknown company',
    location: job.jobGeo?.trim() || 'Remote',
    salary: formatSalary(job),
    type: formatJobType(job.jobType),
    description: stripHtml(job.jobDescription ?? ''),
    tags,
    applyUrl: job.url,
    logoUrl: sanitizeLogoUrl(job.companyLogo),
    postedAt,
  };
}

export const jobicyProvider: JobProvider = {
  id: 'jobicy',
  name: 'Jobicy',
  isConfigured: () => true,
  async fetchJobs() {
    const count = envInt('JOBICY_COUNT', 100, 150);
    const res = await fetch(`https://jobicy.com/api/v2/remote-jobs?count=${count}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`Jobicy API error: ${res.status}`);

    const data = (await res.json()) as { jobs?: JobicyJob[] };
    const jobs = data.jobs ?? [];

    if (jobs.length === 0) {
      throw new Error('Jobicy returned no jobs');
    }

    return jobs.map(mapJob);
  },
};
