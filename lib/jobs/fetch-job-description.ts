import { cleanScrapedText } from '@/lib/jobs/scrape/extract';
import { scrapeText } from '@/lib/jobs/scrape/http';
import { stripHtml } from '@/lib/jobs/utils';

export function extractLinkedInDescriptionHtml(html: string): string {
  const start = html.indexOf('show-more-less-html__markup');
  if (start === -1) return '';

  const openTagEnd = html.indexOf('>', start);
  if (openTagEnd === -1) return '';

  const contentStart = openTagEnd + 1;
  const buttonIdx = html.indexOf('show-more-less-html__button', contentStart);
  const raw = html.slice(contentStart, buttonIdx === -1 ? undefined : buttonIdx);
  return cleanScrapedText(raw);
}

async function fetchLinkedInDescription(externalId: string): Promise<string | null> {
  const html = await scrapeText(
    `https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/${externalId}`,
    { headers: { Accept: 'text/html' } }
  );
  const description = extractLinkedInDescriptionHtml(html);
  return description || null;
}

async function fetchJobsbaseDescription(externalId: string): Promise<string | null> {
  const res = await fetch(`https://jobsbase.io/api/v1/jobs/${encodeURIComponent(externalId)}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { job?: { description?: string }; description?: string };
  const raw = data.job?.description ?? data.description;
  if (!raw?.trim()) return null;
  return stripHtml(raw);
}

/** Load a full description from the source board when sync only stored a teaser. */
export async function fetchJobDescription(
  sourceId: string,
  externalId: string
): Promise<string | null> {
  try {
    switch (sourceId) {
      case 'linkedin':
        return fetchLinkedInDescription(externalId);
      case 'jobsbase':
        return fetchJobsbaseDescription(externalId);
      default:
        return null;
    }
  } catch (err) {
    console.warn(`[fetchJobDescription] ${sourceId}:${externalId}`, err);
    return null;
  }
}
