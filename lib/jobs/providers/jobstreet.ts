import { scrapeFetch } from '@/lib/jobs/scrape/http';
import { envEnabled, envInt, envStr } from '@/lib/jobs/sync-config';
import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';

type SeekSearchJob = {
  id: string;
  title: string;
  companyName?: string;
  teaser?: string;
  salaryLabel?: string;
  listingDate?: string;
  workTypes?: string[];
  locations?: Array<{ label?: string }>;
  workArrangements?: { data?: Array<{ label?: { text?: string } }> };
  classifications?: Array<{
    classification?: { description?: string };
    subclassification?: { description?: string };
  }>;
};

type SeekSearchResponse = {
  data?: SeekSearchJob[];
};

const SITE_ORIGINS: Record<string, { origin: string; jobBaseUrl: string }> = {
  'PH-Main': {
    origin: 'https://www.jobstreet.com.ph',
    jobBaseUrl: 'https://www.jobstreet.com.ph/job',
  },
  'SG-Main': {
    origin: 'https://www.jobstreet.com.sg',
    jobBaseUrl: 'https://www.jobstreet.com.sg/job',
  },
  'AU-Main': {
    origin: 'https://www.seek.com.au',
    jobBaseUrl: 'https://www.seek.com.au/job',
  },
};

function siteConfig(siteKey: string) {
  return (
    SITE_ORIGINS[siteKey] ?? {
      origin: 'https://www.jobstreet.com.ph',
      jobBaseUrl: 'https://www.jobstreet.com.ph/job',
    }
  );
}

function mapSeekJob(job: SeekSearchJob, jobBaseUrl: string): NormalizedJobInput {
  const location =
    job.locations?.map((entry) => entry.label).filter(Boolean).join(' · ') || 'Philippines';
  const arrangement = job.workArrangements?.data?.[0]?.label?.text;
  const tags = [
    job.classifications?.[0]?.subclassification?.description,
    job.classifications?.[0]?.classification?.description,
    arrangement,
  ].filter((tag): tag is string => Boolean(tag));

  return {
    externalId: job.id,
    title: job.title,
    company: job.companyName?.trim() || 'Unknown company',
    location,
    salary: job.salaryLabel?.trim() || 'Not disclosed',
    type: job.workTypes?.[0] ?? 'Full-time',
    description: job.teaser?.trim() || job.title,
    tags,
    applyUrl: `${jobBaseUrl}/${job.id}`,
    postedAt: job.listingDate ? new Date(job.listingDate) : null,
  };
}

export const jobstreetProvider: JobProvider = {
  id: 'jobstreet',
  name: 'Jobstreet',
  isConfigured: () => envEnabled('JOBSTREET_ENABLED', true),
  async fetchJobs() {
    const siteKey = envStr('JOBSTREET_SITE_KEY', 'PH-Main');
    const where = envStr('JOBSTREET_WHERE', 'Philippines');
    const keywords = envStr('JOBSTREET_KEYWORDS', 'developer');
    const pages = envInt('JOBSTREET_PAGES', 3, 10);
    const pageSize = envInt('JOBSTREET_PAGE_SIZE', 20, 30);
    const { origin, jobBaseUrl } = siteConfig(siteKey);

    const jobs: NormalizedJobInput[] = [];
    const seen = new Set<string>();

    for (let page = 1; page <= pages; page++) {
      const params = new URLSearchParams({
        siteKey,
        where,
        keywords,
        pageSize: String(pageSize),
        page: String(page),
      });

      const res = await scrapeFetch(
        `https://jobsearch-api.cloud.seek.com.au/v5/search?${params}`,
        {
          headers: {
            Accept: 'application/json',
            Origin: origin,
            Referer: `${origin}/`,
          },
        }
      );

      if (!res.ok) {
        throw new Error(`Jobstreet search API error: ${res.status}`);
      }

      const json = (await res.json()) as SeekSearchResponse;
      const batch = json.data ?? [];
      if (batch.length === 0) break;

      for (const item of batch) {
        if (!item.id || seen.has(item.id)) continue;
        seen.add(item.id);
        jobs.push(mapSeekJob(item, jobBaseUrl));
      }
    }

    if (jobs.length === 0) {
      throw new Error('Jobstreet returned no jobs for the current keywords/location.');
    }

    return jobs;
  },
};
