import type { NormalizedJobInput } from '@/lib/jobs/types';

function asString(value: unknown, fallback: string, max: number): string {
  if (Array.isArray(value)) {
    return asString(value[0], fallback, max);
  }
  const text = String(value ?? '').trim();
  return (text || fallback).slice(0, max);
}

function stringList(values: unknown[] | undefined, maxItems: number, maxLen: number): string[] {
  if (!values?.length) return [];
  return values
    .filter((v): v is string => typeof v === 'string')
    .map((v) => v.trim())
    .filter(Boolean)
    .slice(0, maxItems)
    .map((v) => v.slice(0, maxLen));
}

/** Coerce provider payloads into safe Prisma row shapes. */
export function sanitizeJobInput(job: NormalizedJobInput): NormalizedJobInput {
  let postedAt = job.postedAt ?? null;
  if (postedAt instanceof Date && Number.isNaN(postedAt.getTime())) {
    postedAt = null;
  }

  return {
    ...job,
    externalId: String(job.externalId).slice(0, 200),
    title: asString(job.title, 'Untitled role', 500),
    company: asString(job.company, 'Unknown company', 300),
    location: asString(job.location, 'Remote', 300),
    salary: asString(job.salary, 'Not disclosed', 200),
    type: asString(job.type, 'Full-time', 120),
    description: String(job.description ?? '').slice(0, 150_000),
    tags: stringList(job.tags as unknown[] | undefined, 50, 120),
    requirements: stringList(job.requirements, 100, 2000),
    benefits: stringList(job.benefits, 100, 2000),
    applyUrl: job.applyUrl?.trim().slice(0, 2000) || undefined,
    logoUrl: job.logoUrl?.trim().slice(0, 2000) || undefined,
    postedAt,
  };
}
