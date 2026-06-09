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
  error?: { message?: string; code?: number };
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
  const locationByCountry: Record<string, string> = {
    ph: 'Philippines',
    us: 'United States',
    gb: 'United Kingdom',
    ca: 'Canada',
    au: 'Australia',
    sg: 'Singapore',
  };

  return countries.map((country) => ({
    country,
    query: `${baseQuery} in ${locationByCountry[country] ?? country.toUpperCase()}`,
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

  let postedAt: Date | null = null;
  if (job.job_posted_at_datetime_utc) {
    const parsed = new Date(job.job_posted_at_datetime_utc);
    postedAt = Number.isNaN(parsed.getTime()) ? null : parsed;
  }

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
    postedAt,
  };
}

function searchUrl(baseUrl: string, market: JSearchMarket): string {
  const params = new URLSearchParams({
    query: market.query,
    page: '1',
    num_pages: process.env.JSEARCH_NUM_PAGES?.trim() || '1',
    date_posted: process.env.JSEARCH_DATE_POSTED?.trim() || 'all',
    country: market.country,
  });

  if (process.env.JSEARCH_REMOTE_ONLY === 'true') {
    params.set('work_from_home', 'true');
  }

  return `${baseUrl}?${params}`;
}

async function fetchWithRetry(
  url: string,
  headers: Record<string, string>
): Promise<Response> {
  let res = await fetch(url, {
    next: { revalidate: 0 },
    headers: { Accept: 'application/json', ...headers },
  });

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    res = await fetch(url, {
      next: { revalidate: 0 },
      headers: { Accept: 'application/json', ...headers },
    });
  }

  return res;
}

async function fetchMarket(
  config: { url: string; headers: Record<string, string> },
  market: JSearchMarket
): Promise<NormalizedJobInput[]> {
  const urls = [searchUrl(config.url, market)];
  if (config.url.includes('openwebninja.com')) {
    urls.push(searchUrl(config.url.replace('/search', '/search-v2'), market));
  }

  let lastError = '';

  for (const url of urls) {
    const res = await fetchWithRetry(url, config.headers);
    const data = (await res.json()) as JSearchResponse;

    if (data.status === 'ERROR' || data.error) {
      lastError = data.error?.message ?? 'JSearch API error';
      if (res.status === 429 || data.error?.code === 429) {
        throw new Error(`JSearch rate limit (${market.country}) — try again in a few minutes`);
      }
      continue;
    }

    if (!res.ok) {
      lastError = `HTTP ${res.status}`;
      continue;
    }

    const jobs = (data.data ?? []).map((job) => mapJob(job, market.country));
    if (jobs.length > 0) return jobs;
    lastError = 'empty results';
  }

  throw new Error(lastError || `JSearch returned no jobs for ${market.country}`);
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

    const parsed = parseMarkets();
    const markets = parsed.length > 0 ? parsed : DEFAULT_MARKETS;
    const merged: NormalizedJobInput[] = [];
    const seen = new Set<string>();
    const marketErrors: string[] = [];

    for (let i = 0; i < markets.length; i++) {
      const market = markets[i];
      if (i > 0) {
        await new Promise((r) => setTimeout(r, 1500));
      }
      try {
        const jobs = await fetchMarket(config, market);
        for (const job of jobs) {
          const key = `${job.externalId}|${job.title.toLowerCase()}|${job.company.toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(job);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        marketErrors.push(`${market.country}: ${msg}`);
        console.warn(`[jsearch] ${market.country}: ${msg}`);
      }
    }

    if (merged.length === 0) {
      const detail = marketErrors.length > 0 ? ` (${marketErrors.join('; ')})` : '';
      throw new Error(`JSearch returned no jobs for configured markets${detail}`);
    }

    return merged;
  },
};
