import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { sanitizeLogoUrl, stripHtml } from '@/lib/jobs/utils';

type RemoteOkJob = {
  id?: string;
  slug?: string;
  position?: string;
  company?: string;
  company_logo?: string;
  logo?: string;
  location?: string;
  tags?: string[];
  description?: string;
  date?: string;
  url?: string;
};

export const remoteokProvider: JobProvider = {
  id: 'remoteok',
  name: 'RemoteOK',
  isConfigured: () => true,
  async fetchJobs() {
    const res = await fetch('https://remoteok.com/api', {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'WhatsMyJob/1.0 (job aggregator)',
      },
      cache: 'no-store',
    });

    if (!res.ok) throw new Error(`RemoteOK API error: ${res.status}`);

    const data = (await res.json()) as RemoteOkJob[];
    if (!Array.isArray(data)) return [];

    return data
      .filter((job) => job.id && job.position && job.company)
      .map(
        (job): NormalizedJobInput => ({
          externalId: String(job.id),
          title: job.position!,
          company: job.company!,
          location: job.location?.trim() || 'Remote',
          type: 'Remote',
          description: stripHtml(job.description ?? ''),
          tags: Array.isArray(job.tags) ? job.tags.filter((t) => typeof t === 'string') : [],
          applyUrl: job.url ?? `https://remoteok.com/remote-jobs/${job.slug}`,
          logoUrl: sanitizeLogoUrl(job.company_logo ?? job.logo),
          postedAt: job.date ? new Date(job.date) : null,
        })
      );
  },
};
