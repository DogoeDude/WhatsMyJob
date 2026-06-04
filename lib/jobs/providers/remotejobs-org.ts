import type { JobProvider, NormalizedJobInput } from '@/lib/jobs/types';
import { sanitizeLogoUrl, stripHtml } from '@/lib/jobs/utils';

type RemoteJobsOrgItem = {
  id: string;
  title: string;
  url: string;
  apply_url?: string;
  company?: { name?: string; logo_url?: string };
  location?: string;
  job_type?: string;
  description?: string;
  published_at?: string;
};

export const remoteJobsOrgProvider: JobProvider = {
  id: 'remotejobs',
  name: 'RemoteJobs.org',
  isConfigured: () => true,
  async fetchJobs() {
    const all: NormalizedJobInput[] = [];

    for (let offset = 0; offset < 150; offset += 50) {
      const res = await fetch(
        `https://remotejobs.org/api/v1/jobs?limit=50&offset=${offset}`,
        { headers: { Accept: 'application/json' }, cache: 'no-store' }
      );

      if (!res.ok) throw new Error(`RemoteJobs.org API error: ${res.status}`);

      const data = (await res.json()) as { data?: RemoteJobsOrgItem[] };
      const batch = data.data ?? [];
      if (batch.length === 0) break;

      for (const job of batch) {
        all.push({
          externalId: job.id,
          title: job.title,
          company: job.company?.name ?? 'Unknown',
          location: job.location?.trim() || 'Remote',
          type: job.job_type ?? 'Remote',
          description: stripHtml(job.description ?? ''),
          applyUrl: job.apply_url ?? job.url,
          logoUrl: sanitizeLogoUrl(job.company?.logo_url),
          postedAt: job.published_at ? new Date(job.published_at) : null,
        });
      }

      if (batch.length < 50) break;
    }

    return all;
  },
};
