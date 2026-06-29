import { cleanScrapedText, extractMosaicProviderData } from '@/lib/jobs/scrape/extract';
import { scrapeFetch } from '@/lib/jobs/scrape/http';
import { envEnabled, envInt, envStr } from '@/lib/jobs/sync-config';
import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';

type IndeedJobCard = {
  jobkey?: string;
  title?: string;
  company?: string;
  formattedLocation?: string;
  snippet?: string;
  salarySnippet?: { text?: string };
  jobLocationCity?: string;
  jobLocationState?: string;
  displayTitle?: string;
  companyRating?: number;
  urgentlyHiring?: boolean;
  taxoAttributes?: string[];
};

type IndeedMosaicPayload = {
  metaData?: { mosaicProviderJobCardsModel?: { results?: IndeedJobCard[] } };
};

function indeedDomain(): string {
  return envStr('INDEED_DOMAIN', 'www.indeed.com').replace(/^https?:\/\//, '').replace(/\/$/, '');
}

function parseIndeedSearchHtml(html: string, domain: string): NormalizedJobInput[] {
  if (html.includes('Security Check') || html.includes('bot-detection')) {
    throw new Error(
      'Indeed blocked this server (403). Set SCRAPE_PROXY_URL to a residential proxy, or disable INDEED_ENABLED.'
    );
  }

  const payload = extractMosaicProviderData(html, 'mosaic-provider-jobcards') as
    | IndeedMosaicPayload
    | null;
  const results = payload?.metaData?.mosaicProviderJobCardsModel?.results ?? [];
  if (results.length === 0) {
    throw new Error('Indeed returned no parseable job cards for the current query.');
  }

  return results
    .filter((card) => card.jobkey)
    .map((card) => {
      const title = cleanScrapedText(card.displayTitle || card.title);
      const company = cleanScrapedText(card.company) || 'Unknown company';
      const location =
        cleanScrapedText(card.formattedLocation) ||
        [card.jobLocationCity, card.jobLocationState].filter(Boolean).join(', ') ||
        'Remote';

      return {
        externalId: card.jobkey!,
        title: title || 'Untitled role',
        company,
        location,
        salary: cleanScrapedText(card.salarySnippet?.text) || 'Not disclosed',
        type: 'Full-time',
        description: cleanScrapedText(card.snippet) || title || 'See Indeed for details.',
        tags: card.taxoAttributes ?? [],
        applyUrl: `https://${domain}/viewjob?jk=${card.jobkey}`,
      };
    });
}

export const indeedProvider: JobProvider = {
  id: 'indeed',
  name: 'Indeed',
  isConfigured: () => envEnabled('INDEED_ENABLED', true),
  async fetchJobs() {
    const query = envStr('INDEED_QUERY', 'developer');
    const location = envStr('INDEED_LOCATION', 'remote');
    const maxJobs = envInt('INDEED_MAX', 25, 50);
    const domain = indeedDomain();

    const params = new URLSearchParams({
      q: query,
      l: location,
      sort: 'date',
      fromage: '14',
    });

    const res = await scrapeFetch(`https://${domain}/jobs?${params}`, {
      headers: { Accept: 'text/html,application/xhtml+xml' },
    });

    if (res.status === 403) {
      throw new Error(
        'Indeed blocked this server (403). Set SCRAPE_PROXY_URL to a residential proxy, or set INDEED_ENABLED=false.'
      );
    }

    if (!res.ok) {
      throw new Error(`Indeed search error: ${res.status}`);
    }

    const html = await res.text();
    const jobs = parseIndeedSearchHtml(html, domain);
    return jobs.slice(0, maxJobs);
  },
};
