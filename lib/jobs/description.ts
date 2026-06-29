import { jobProviders } from '@/lib/jobs/providers';

/** Descriptions shorter than this are treated as teasers/snippets. */
export const SHORT_DESCRIPTION_MAX = 280;

const SOURCE_IDS = jobProviders.map((p) => p.id).sort((a, b) => b.length - a.length);

export function isShortJobDescription(description: string | null | undefined): boolean {
  const text = description?.trim() ?? '';
  return text.length < SHORT_DESCRIPTION_MAX;
}

export function parseCompositeJobId(id: string): { sourceId: string; externalId: string } | null {
  for (const sourceId of SOURCE_IDS) {
    const prefix = `${sourceId}-`;
    if (id.startsWith(prefix)) {
      return { sourceId, externalId: id.slice(prefix.length) };
    }
  }
  return null;
}

export function resolveJobSourceKeys(job: {
  id: string;
  sourceId?: string;
  externalId?: string;
}): { sourceId: string; externalId: string } | null {
  if (job.sourceId && job.externalId) {
    return { sourceId: job.sourceId, externalId: job.externalId };
  }
  return parseCompositeJobId(job.id);
}
