import { prisma } from '@/lib/prisma';
import { revalidateTag } from 'next/cache';
import { invalidateHasJobsCache } from '@/lib/jobs/query';
import { clearLogoCache } from '@/lib/jobs/enrich-logos';
import { getActiveProviders, getProvider, jobProviders } from '@/lib/jobs/providers';
import { sanitizeJobInput } from '@/lib/jobs/sanitize-job-input';
import type { NormalizedJobInput, SyncProviderResult } from '@/lib/jobs/types';
import type { Prisma } from '@prisma/client';

const SOURCE_META: Record<string, { name: string; kind: 'api' | 'api_key' }> = {
  remotive: { name: 'Remotive', kind: 'api' },
  arbeitnow: { name: 'Arbeitnow', kind: 'api' },
  jobicy: { name: 'Jobicy', kind: 'api' },
  remoteok: { name: 'RemoteOK', kind: 'api' },
  remotejobs: { name: 'RemoteJobs.org', kind: 'api' },
  careernest: { name: 'Career Nest', kind: 'api' },
  jsearch: { name: 'JSearch', kind: 'api_key' },
  reed: { name: 'Reed.co.uk', kind: 'api_key' },
  adzuna: { name: 'Adzuna', kind: 'api_key' },
};

const UPSERT_BATCH = 40;
const SYNC_CONCURRENCY = 3;

/** Invalidate list + sidebar caches after job data changes. */
export function invalidateJobsCaches() {
  clearLogoCache();
  invalidateHasJobsCache();
  revalidateTag('jobs-meta', { expire: 0 });
}

export async function ensureJobSources() {
  await prisma.$transaction(
    jobProviders.map((provider) => {
      const meta = SOURCE_META[provider.id];
      return prisma.jobSource.upsert({
        where: { id: provider.id },
        create: {
          id: provider.id,
          name: meta?.name ?? provider.name,
          kind: meta?.kind ?? 'api',
          enabled: provider.isConfigured(),
        },
        update: {
          name: meta?.name ?? provider.name,
          enabled: provider.isConfigured(),
        },
      });
    })
  );
}

function jobPayload(job: NormalizedJobInput, logoUrl: string | null) {
  return {
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary ?? 'Not disclosed',
    type: job.type ?? 'Full-time',
    description: job.description,
    requirements: job.requirements ?? [],
    benefits: job.benefits ?? [],
    tags: job.tags ?? [],
    applyUrl: job.applyUrl ?? null,
    logoUrl,
    postedAt: job.postedAt ?? null,
    syncedAt: new Date(),
  };
}

async function upsertJobs(sourceId: string, jobs: NormalizedJobInput[]) {
  if (jobs.length === 0) return { added: 0, updated: 0, total: 0 };

  const safeJobs = jobs.map(sanitizeJobInput);
  let added = 0;
  let updated = 0;

  for (let offset = 0; offset < safeJobs.length; offset += UPSERT_BATCH) {
    const chunk = safeJobs.slice(offset, offset + UPSERT_BATCH);
    const externalIds = chunk.map((j) => j.externalId);

    const existing = await prisma.jobListing.findMany({
      where: { sourceId, externalId: { in: externalIds } },
      select: { id: true, externalId: true, logoUrl: true },
    });
    const existingByExternal = new Map(existing.map((row) => [row.externalId, row]));

    const creates: Prisma.JobListingCreateManyInput[] = [];
    const updates: { id: string; data: ReturnType<typeof jobPayload> }[] = [];

    for (const job of chunk) {
      const row = existingByExternal.get(job.externalId);
      const logoUrl = job.logoUrl || row?.logoUrl || null;
      const payload = jobPayload(job, logoUrl);

      if (row) {
        updates.push({ id: row.id, data: payload });
      } else {
        creates.push({
          sourceId,
          externalId: job.externalId,
          ...payload,
        });
      }
    }

    if (creates.length > 0) {
      const result = await prisma.jobListing.createMany({
        data: creates,
        skipDuplicates: true,
      });
      added += result.count;
    }

    if (updates.length > 0) {
      await prisma.$transaction(
        updates.map(({ id, data }) => prisma.jobListing.update({ where: { id }, data }))
      );
      updated += updates.length;
    }
  }

  return { added, updated, total: safeJobs.length };
}

export async function syncJobProvider(sourceId: string): Promise<SyncProviderResult> {
  const provider = getProvider(sourceId);
  if (!provider) {
    throw new Error(`Unknown provider: ${sourceId}`);
  }
  if (!provider.isConfigured()) {
    throw new Error(`${provider.name} is not configured (missing API keys).`);
  }

  const jobs = await provider.fetchJobs();
  const { added, updated, total } = await upsertJobs(sourceId, jobs);

  const jobCount = await prisma.jobListing.count({ where: { sourceId } });

  await prisma.jobSource.update({
    where: { id: sourceId },
    data: {
      lastSyncAt: new Date(),
      lastStatus: 'success',
      lastError: null,
      jobCount,
    },
  });

  await prisma.jobSyncLog.create({
    data: {
      sourceId,
      status: 'success',
      jobsAdded: added,
      jobsUpdated: updated,
    },
  });

  return { added, updated, total };
}

async function runProvidersInParallel<T>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<void>
) {
  const queue = [...items];
  const workers = Array.from({ length: Math.min(concurrency, queue.length) }, async () => {
    while (queue.length > 0) {
      const item = queue.shift();
      if (item === undefined) break;
      await fn(item);
    }
  });
  await Promise.all(workers);
}

export async function syncAllJobProviders(): Promise<
  Record<string, SyncProviderResult & { error?: string }>
> {
  await ensureJobSources();
  const results: Record<string, SyncProviderResult & { error?: string }> = {};
  const providers = getActiveProviders();

  await runProvidersInParallel(providers, SYNC_CONCURRENCY, async (provider) => {
    try {
      results[provider.id] = await syncJobProvider(provider.id);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      results[provider.id] = { added: 0, updated: 0, total: 0, error: message };

      await prisma.jobSource.update({
        where: { id: provider.id },
        data: {
          lastSyncAt: new Date(),
          lastStatus: 'error',
          lastError: message,
        },
      });

      await prisma.jobSyncLog.create({
        data: {
          sourceId: provider.id,
          status: 'error',
          error: message,
        },
      });
    }
  });

  invalidateJobsCaches();
  return results;
}
