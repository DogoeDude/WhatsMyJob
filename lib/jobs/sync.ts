import { prisma } from '@/lib/prisma';
import { getActiveProviders, getProvider, jobProviders } from '@/lib/jobs/providers';
import type { NormalizedJobInput, SyncProviderResult } from '@/lib/jobs/types';

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

export async function ensureJobSources() {
  for (const provider of jobProviders) {
    const meta = SOURCE_META[provider.id];
    await prisma.jobSource.upsert({
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
  }
}

async function upsertJobs(sourceId: string, jobs: NormalizedJobInput[]) {
  let added = 0;
  let updated = 0;

  for (const job of jobs) {
    const existing = await prisma.jobListing.findUnique({
      where: {
        sourceId_externalId: { sourceId, externalId: job.externalId },
      },
      select: { id: true, logoUrl: true },
    });

    const logoUrl = job.logoUrl ?? existing?.logoUrl ?? null;

    const payload = {
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

    if (existing) {
      await prisma.jobListing.update({
        where: { id: existing.id },
        data: payload,
      });
      updated += 1;
    } else {
      await prisma.jobListing.create({
        data: {
          sourceId,
          externalId: job.externalId,
          ...payload,
        },
      });
      added += 1;
    }
  }

  return { added, updated, total: jobs.length };
}

export async function syncJobProvider(sourceId: string): Promise<SyncProviderResult> {
  const provider = getProvider(sourceId);
  if (!provider) {
    throw new Error(`Unknown provider: ${sourceId}`);
  }
  if (!provider.isConfigured()) {
    throw new Error(`${provider.name} is not configured (missing API keys).`);
  }

  await ensureJobSources();

  const jobs = await provider.fetchJobs();
  const { added, updated, total } = await upsertJobs(sourceId, jobs);

  await prisma.jobSource.update({
    where: { id: sourceId },
    data: {
      lastSyncAt: new Date(),
      lastStatus: 'success',
      lastError: null,
      jobCount: await prisma.jobListing.count({ where: { sourceId } }),
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

export async function syncAllJobProviders(): Promise<
  Record<string, SyncProviderResult & { error?: string }>
> {
  await ensureJobSources();
  const results: Record<string, SyncProviderResult & { error?: string }> = {};

  for (const provider of getActiveProviders()) {
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
  }

  return results;
}
