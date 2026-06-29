import { cleanScrapedText, mapWithConcurrency } from '@/lib/jobs/scrape/extract';
import { extractLinkedInDescriptionHtml } from '@/lib/jobs/fetch-job-description';
import { scrapeText } from '@/lib/jobs/scrape/http';
import { envEnabled, envInt, envStr } from '@/lib/jobs/sync-config';
import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';

type LinkedInSearchCard = {
  id: string;
  title: string;
  company: string;
  location: string;
  applyUrl: string;
};

function parseLinkedInSearchHtml(html: string): LinkedInSearchCard[] {
  const cards: LinkedInSearchCard[] = [];
  const blocks = html.split(/<li\b/i).slice(1);

  for (const block of blocks) {
    const id = block.match(/data-entity-urn="urn:li:jobPosting:(\d+)"/)?.[1];
    if (!id) continue;

    const title = cleanScrapedText(
      block.match(/base-search-card__title[^>]*>\s*([\s\S]*?)\s*<\/h3>/i)?.[1]
    );
    const company = cleanScrapedText(
      block.match(/hidden-nested-link[^>]*>\s*([\s\S]*?)\s*<\/a>/i)?.[1]
    );
    const location = cleanScrapedText(
      block.match(/job-search-card__location[^>]*>\s*([\s\S]*?)\s*<\/span>/i)?.[1]
    );
    const href = block.match(/base-card__full-link[^>]*href="([^"]+)"/i)?.[1];

    if (!title) continue;

    cards.push({
      id,
      title,
      company: company || 'Unknown company',
      location: location || 'Remote',
      applyUrl: href
        ? decodeURIComponent(href.replace(/&amp;/g, '&'))
        : `https://www.linkedin.com/jobs/view/${id}/`,
    });
  }

  return cards;
}

async function fetchLinkedInDescription(jobId: string): Promise<string> {
  const html = await scrapeText(
    `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${jobId}`,
    { headers: { Accept: 'text/html' } }
  );
  return extractLinkedInDescriptionHtml(html) || 'See the full listing on LinkedIn for details.';
}

async function fetchLinkedInSearchPage(
  keywords: string,
  location: string,
  start: number,
  count: number
): Promise<LinkedInSearchCard[]> {
  const params = new URLSearchParams({
    keywords,
    location,
    start: String(start),
    count: String(count),
  });
  const html = await scrapeText(
    `https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search?${params}`,
    { headers: { Accept: 'text/html' } }
  );
  return parseLinkedInSearchHtml(html);
}

export const linkedinProvider: JobProvider = {
  id: 'linkedin',
  name: 'LinkedIn',
  isConfigured: () => envEnabled('LINKEDIN_ENABLED', true),
  async fetchJobs() {
    const keywords = envStr('LINKEDIN_KEYWORDS', 'developer');
    const location = envStr('LINKEDIN_LOCATION', 'Philippines');
    const maxJobs = envInt('LINKEDIN_MAX', 30, 100);
    const pageSize = envInt('LINKEDIN_PAGE_SIZE', 10, 25);
    const fetchDescriptions = envEnabled('LINKEDIN_FETCH_DESCRIPTIONS', true);

    const cards: LinkedInSearchCard[] = [];
    const seen = new Set<string>();

    for (let start = 0; cards.length < maxJobs; start += pageSize) {
      const page = await fetchLinkedInSearchPage(keywords, location, start, pageSize);
      if (page.length === 0) break;

      for (const card of page) {
        if (seen.has(card.id)) continue;
        seen.add(card.id);
        cards.push(card);
        if (cards.length >= maxJobs) break;
      }

      if (page.length < pageSize) break;
    }

    if (cards.length === 0) {
      throw new Error('LinkedIn returned no jobs for the current keywords/location.');
    }

    const jobs = await mapWithConcurrency(cards, 4, async (card) => {
      const description = fetchDescriptions
        ? await fetchLinkedInDescription(card.id).catch(() => card.title)
        : card.title;

      const job: NormalizedJobInput = {
        externalId: card.id,
        title: card.title,
        company: card.company,
        location: card.location,
        type: 'Full-time',
        description,
        applyUrl: card.applyUrl,
        tags: ['linkedin'],
      };
      return job;
    });

    return jobs;
  },
};
