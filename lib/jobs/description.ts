import { JOB_SOURCES_CATALOG } from '@/lib/jobs/sources-catalog';
import { isShortJobDescription, SHORT_DESCRIPTION_MAX } from '@/lib/jobs/description-limits';

export { isShortJobDescription, SHORT_DESCRIPTION_MAX };

const SOURCE_IDS = JOB_SOURCES_CATALOG.map((s) => s.id).sort((a, b) => b.length - a.length);

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
