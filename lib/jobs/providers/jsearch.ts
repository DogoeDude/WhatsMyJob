import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { sanitizeLogoUrl, stripHtml } from '@/lib/jobs/utils';

type JSearchJob = {
  job_id: string;
  job_title: string;
  employer_name: string;
  employer_logo?: string | null;
  job_city?: string;
  job_state?: string;
  job_country?: string;
  job_description?: string;
  job_apply_link?: string;
  job_google_link?: string;
  job_posted_at_datetime_utc?: string;
  job_employment_type?: string;
  job_min_salary?: number | null;
  job_max_salary?: number | null;
  job_salary_currency?: string;
  job_is_remote?: boolean;
  job_highlights?: {
    Qualifications?: string[];
    Responsibilities?: string[];
    Benefits?: string[];
  };
  job_benefits?: string[];
  job_required_skills?: string[];
};

type JSearchResponse = {
  status?: string;
  data?: JSearchJob[];
};

type JSearchMarket = {
  country: string;
  query: string;
};

const DEFAULT_MARKETS: JSearchMarket[] = [
  { country: 'ph', query: 'developer jobs in Philippines' },
  { country: 'us', query: 'developer jobs in United States' },
];

function getJSearchConfig(): { url: string; headers: Record<string, string> } | null {
  const directKey = process.env.JSEARCH_API_KEY?.trim();
  const rapidKey = process.env.RAPIDAPI_KEY?.trim();

  if (directKey) {
    return {
      url: 'https://api.openwebninja.com/jsearch/search',
      headers: { 'x-api-key': directKey },
    };
  }

  if (rapidKey) {
    return {
      url: 'https://jsearch.p.rapidapi.com/search',
      headers: {
        'x-rapidapi-key': rapidKey,
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
      },
    };
  }

  return null;
}

function parseMarkets(): JSearchMarket[] {
  const custom = process.env.JSEARCH_QUERIES?.trim();
  if (custom) {
    return custom.split(',').map((entry) => {
      const [query, country = 'us'] = entry.split('|').map((s) => s.trim());
      return { query, country };
    });
  }

  const countries = (process.env.JSEARCH_COUNTRIES?.trim() || 'ph,us')
    .split(',')
    .map((c) => c.trim().toLowerCase())
    .filter(Boolean);

  const baseQuery = process.env.JSEARCH_QUERY?.trim() || 'developer jobs';
  const labels: Record<string, string> = {
    ph: 'Philippines',
    us: 'United States',
    gb: 'United Kingdom',
    ca: 'Canada',
    au: 'Australia',
    sg: 'Singapore',
  };

  return countries.map((country) => ({
    country,
    query: `${baseQuery} in ${labels[country] ?? country.toUpperCase()}`,
  }));
}

function formatSalary(job: JSearchJob): string {
  const currency = job.job_salary_currency ?? 'USD';
  const symbol =
    currency === 'PHP' ? '₱' : currency === 'GBP' ? '£' : currency === 'EUR' ? '€' : '$';
  if (job.job_min_salary && job.job_max_salary) {
    return `${symbol}${Math.round(job.job_min_salary / 1000)}k – ${symbol}${Math.round(job.job_max_salary / 1000)}k`;
  }
  if (job.job_min_salary) return `From ${symbol}${Math.round(job.job_min_salary / 1000)}k`;
  return 'Not disclosed';
}

function formatLocation(job: JSearchJob): string {
  if (job.job_is_remote) return 'Remote';
  const parts = [job.job_city, job.job_state, job.job_country].filter(Boolean);
  return parts.join(', ') || 'Not specified';
}

function mapJob(job: JSearchJob, marketCountry: string): NormalizedJobInput {
  const highlights = job.job_highlights ?? {};
  const requirements = [
    ...(highlights.Qualifications ?? []),
    ...(highlights.Responsibilities ?? []),
  ];
  const benefits = [...(highlights.Benefits ?? []), ...(job.job_benefits ?? [])];

  return {
    externalId: `${marketCountry}-${job.job_id}`,
    title: job.job_title,
    company: job.employer_name,
    location: formatLocation(job),
    salary: formatSalary(job),
    type: job.job_employment_type?.trim() || (job.job_is_remote ? 'Remote' : 'Full-time'),
    description: stripHtml(job.job_description ?? ''),
    tags: job.job_required_skills ?? [],
    requirements,
    benefits,
    applyUrl: job.job_apply_link ?? job.job_google_link,
    logoUrl: sanitizeLogoUrl(job.employer_logo),
    postedAt: job.job_posted_at_datetime_utc
      ? new Date(job.job_posted_at_datetime_utc)
      : null,
  };
}

async function fetchMarket(
  config: { url: string; headers: Record<string, string> },
  market: JSearchMarket
): Promise<NormalizedJobInput[]> {
  const params = new URLSearchParams({
    query: market.query,
    page: '1',
    num_pages: process.env.JSEARCH_NUM_PAGES?.trim() || '1',
    date_posted: process.env.JSEARCH_DATE_POSTED?.trim() || 'month',
    country: market.country,
  });

  if (process.env.JSEARCH_REMOTE_ONLY === 'true') {
    params.set('work_from_home', 'true');
  }

  const res = await fetch(`${config.url}?${params}`, {
    next: { revalidate: 0 },
    headers: {
      Accept: 'application/json',
      ...config.headers,
    },
  });

  if (!res.ok) {
    throw new Error(`JSearch API error (${market.country}): ${res.status}`);
  }

  const data = (await res.json()) as JSearchResponse;
  return (data.data ?? []).map((job) => mapJob(job, market.country));
}

export const jsearchProvider: JobProvider = {
  id: 'jsearch',
  name: 'JSearch',
  isConfigured: () => Boolean(getJSearchConfig()),
  async fetchJobs() {
    const config = getJSearchConfig();
    if (!config) {
      throw new Error('JSearch API key not configured (JSEARCH_API_KEY or RAPIDAPI_KEY)');
    }

    const markets = parseMarkets();
    const merged: NormalizedJobInput[] = [];
    const seen = new Set<string>();

    for (const market of markets.length > 0 ? markets : DEFAULT_MARKETS) {
      try {
        const jobs = await fetchMarket(config, market);
        for (const job of jobs) {
          const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}|${job.location.toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(job);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[jsearch] ${market.country}: ${msg}`);
      }
    }

    if (merged.length === 0) {
      throw new Error('JSearch returned no jobs for configured markets');
    }

    return merged;
  },
};
