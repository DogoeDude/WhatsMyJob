import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { envInt } from '@/lib/jobs/sync-config';
import { stripHtml } from '@/lib/jobs/utils';

type AdzunaJob = {
  id: string;
  title: string;
  company: { display_name: string };
  location: { display_name: string };
  description: string;
  redirect_url: string;
  created: string;
  salary_min?: number;
  salary_max?: number;
  contract_type?: string;
  category?: { label: string };
};

const CURRENCY: Record<string, string> = {
  us: '$',
  gb: '£',
  au: 'A$',
  ca: 'C$',
  sg: 'S$',
  in: '₹',
};

function parseCountries(): string[] {
  const list = process.env.ADZUNA_COUNTRIES?.trim() || process.env.ADZUNA_COUNTRY?.trim() || 'us';
  return [...new Set(list.split(',').map((c) => c.trim().toLowerCase()).filter(Boolean))];
}

function mapAdzunaJob(country: string, job: AdzunaJob): NormalizedJobInput {
  const symbol = CURRENCY[country] ?? '$';
  let salary = 'Not disclosed';
  if (job.salary_min && job.salary_max) {
    salary = `${symbol}${Math.round(job.salary_min / 1000)}k – ${symbol}${Math.round(job.salary_max / 1000)}k`;
  } else if (job.salary_min) {
    salary = `From ${symbol}${Math.round(job.salary_min / 1000)}k`;
  }

  return {
    externalId: `${country}-${job.id}`,
    title: job.title,
    company: job.company.display_name,
    location: job.location.display_name,
    salary,
    type: job.contract_type ?? 'Full-time',
    description: stripHtml(job.description),
    tags: job.category?.label ? [job.category.label] : [],
    applyUrl: job.redirect_url,
    postedAt: job.created ? new Date(job.created) : null,
  };
}

async function fetchCountry(
  country: string,
  appId: string,
  appKey: string
): Promise<NormalizedJobInput[]> {
  const pages = envInt('ADZUNA_PAGES', 3, 10);
  const perPage = envInt('ADZUNA_RESULTS_PER_PAGE', 50, 50);
  const what = process.env.ADZUNA_DEFAULT_WHAT?.trim() || 'developer';
  const where = process.env.ADZUNA_DEFAULT_WHERE?.trim();

  const all: NormalizedJobInput[] = [];

  for (let page = 1; page <= pages; page++) {
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: String(perPage),
      'content-type': 'application/json',
    });
    if (what) params.set('what', what);
    if (where) params.set('where', where);

    const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/${page}?${params}`;
    const res = await fetch(url, { next: { revalidate: 0 } });

    if (!res.ok) {
      throw new Error(`Adzuna API error (${country} page ${page}): ${res.status}`);
    }

    const data = (await res.json()) as { results?: AdzunaJob[] };
    const batch = (data.results ?? []).filter((job) => job?.title && job?.company?.display_name);
    if (batch.length === 0) break;

    all.push(...batch.map((job) => mapAdzunaJob(country, job)));
    if (batch.length < perPage) break;
  }

  return all;
}

export const adzunaProvider: JobProvider = {
  id: 'adzuna',
  name: 'Adzuna',
  isConfigured: () =>
    Boolean(process.env.ADZUNA_APP_ID?.trim() && process.env.ADZUNA_APP_KEY?.trim()),
  async fetchJobs() {
    const appId = process.env.ADZUNA_APP_ID?.trim();
    const appKey = process.env.ADZUNA_APP_KEY?.trim();

    if (!appId || !appKey) {
      throw new Error('Adzuna credentials not configured');
    }

    const countries = parseCountries();
    const merged: NormalizedJobInput[] = [];
    const seen = new Set<string>();

    const results = await Promise.allSettled(
      countries.map((country) => fetchCountry(country, appId, appKey))
    );

    for (let i = 0; i < results.length; i++) {
      const result = results[i];
      const country = countries[i];
      if (result.status === 'rejected') {
        const msg = result.reason instanceof Error ? result.reason.message : String(result.reason);
        console.warn(`[adzuna] ${country}: ${msg}`);
        continue;
      }
      for (const job of result.value) {
        const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}|${job.location.toLowerCase()}`;
        if (seen.has(key)) continue;
        seen.add(key);
        merged.push(job);
      }
    }

    if (merged.length === 0) {
      throw new Error('Adzuna returned no jobs for configured countries');
    }

    return merged;
  },
};
