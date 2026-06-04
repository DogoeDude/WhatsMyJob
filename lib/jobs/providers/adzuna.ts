import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
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

async function fetchCountry(
  country: string,
  appId: string,
  appKey: string
): Promise<NormalizedJobInput[]> {
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: '50',
    'content-type': 'application/json',
  });

  const what = process.env.ADZUNA_DEFAULT_WHAT?.trim() || 'developer';
  if (what) params.set('what', what);

  const where = process.env.ADZUNA_DEFAULT_WHERE?.trim();
  if (where) params.set('where', where);

  const url = `https://api.adzuna.com/v1/api/jobs/${country}/search/1?${params}`;
  const res = await fetch(url, { next: { revalidate: 0 } });

  if (!res.ok) {
    throw new Error(`Adzuna API error (${country}): ${res.status}`);
  }

  const data = (await res.json()) as { results?: AdzunaJob[] };
  const symbol = CURRENCY[country] ?? '$';

  return (data.results ?? [])
    .filter((job) => job?.title && job?.company?.display_name)
    .map((job): NormalizedJobInput => {
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
  });
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

    for (const country of countries) {
      try {
        const jobs = await fetchCountry(country, appId, appKey);
        for (const job of jobs) {
          const key = `${job.title.toLowerCase()}|${job.company.toLowerCase()}|${job.location.toLowerCase()}`;
          if (seen.has(key)) continue;
          seen.add(key);
          merged.push(job);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[adzuna] ${country}: ${msg}`);
      }
    }

    if (merged.length === 0) {
      throw new Error('Adzuna returned no jobs for configured countries');
    }

    return merged;
  },
};
