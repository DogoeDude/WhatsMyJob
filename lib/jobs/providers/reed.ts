import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { stripHtml } from '@/lib/jobs/utils';

type ReedJob = {
  jobId: number;
  jobTitle: string;
  employerName: string;
  locationName?: string;
  minimumSalary?: number | null;
  maximumSalary?: number | null;
  currency?: string;
  expirationDate?: string;
  date?: string;
  jobDescription?: string;
  jobUrl?: string;
  externalUrl?: string;
};

type ReedSearchResponse = {
  results?: ReedJob[];
  totalResults?: number;
};

function reedAuthHeader(apiKey: string): string {
  return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
}

function formatSalary(job: ReedJob): string {
  const symbol = job.currency === 'GBP' ? '£' : '$';
  if (job.minimumSalary && job.maximumSalary) {
    return `${symbol}${Math.round(job.minimumSalary / 1000)}k – ${symbol}${Math.round(job.maximumSalary / 1000)}k`;
  }
  if (job.minimumSalary) return `From ${symbol}${Math.round(job.minimumSalary / 1000)}k`;
  return 'Not disclosed';
}

export const reedProvider: JobProvider = {
  id: 'reed',
  name: 'Reed.co.uk',
  isConfigured: () => Boolean(process.env.REED_API_KEY?.trim()),
  async fetchJobs() {
    const apiKey = process.env.REED_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('Reed API key not configured');
    }

    const params = new URLSearchParams({
      keywords: process.env.REED_KEYWORDS?.trim() || 'developer',
      resultsToTake: process.env.REED_RESULTS?.trim() || '50',
      resultsToSkip: '0',
    });

    const location = process.env.REED_LOCATION?.trim();
    if (location) params.set('locationName', location);

    const res = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
      next: { revalidate: 0 },
      headers: {
        Accept: 'application/json',
        Authorization: reedAuthHeader(apiKey),
      },
    });

    if (!res.ok) {
      throw new Error(`Reed API error: ${res.status}`);
    }

    const data = (await res.json()) as ReedSearchResponse;
    const jobs = data.results ?? [];

    return jobs.map(
      (job): NormalizedJobInput => ({
        externalId: String(job.jobId),
        title: job.jobTitle,
        company: job.employerName,
        location: job.locationName?.trim() || 'United Kingdom',
        salary: formatSalary(job),
        type: 'Full-time',
        description: stripHtml(job.jobDescription ?? ''),
        applyUrl: job.externalUrl ?? job.jobUrl,
        postedAt: job.date ? new Date(job.date) : null,
      })
    );
  },
};
