import type { Job } from '@/lib/jobs/types';
import { getSourceMeta } from '@/lib/jobs/sources-catalog';
import { formatPostedDate, parseJsonStringArray } from '@/lib/jobs/utils';

type DbJob = {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  description: string;
  requirements: unknown;
  benefits: unknown;
  tags: unknown;
  applyUrl: string | null;
  logoUrl: string | null;
  postedAt: Date | null;
  source: { id: string; name: string };
};

export function jobListingToJob(row: DbJob): Job {
  const meta = getSourceMeta(row.source.id);
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    location: row.location,
    salary: row.salary,
    type: row.type,
    tags: parseJsonStringArray(row.tags),
    description: row.description,
    requirements: parseJsonStringArray(row.requirements),
    benefits: parseJsonStringArray(row.benefits),
    postedDate: formatPostedDate(row.postedAt),
    postedAtMs: row.postedAt?.getTime() ?? 0,
    applyUrl: row.applyUrl ?? undefined,
    logoUrl: row.logoUrl ?? undefined,
    sourceId: row.source.id,
    externalId: row.externalId,
    source: row.source.name,
    sourceWebsite: meta?.website,
  };
}
