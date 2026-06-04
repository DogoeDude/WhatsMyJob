import { prisma } from '@/lib/prisma';
import { isApplicationStatus, type ApplicationStatusId } from '@/lib/applications/statuses';
import type { ApplicationStats, JobApplicationRecord } from '@/lib/applications/types';

function toRecord(row: {
  id: string;
  jobListingId: string | null;
  title: string;
  company: string;
  location: string;
  applyUrl: string | null;
  source: string | null;
  status: string;
  hasReply: boolean;
  notes: string | null;
  appliedAt: Date;
  updatedAt: Date;
}): JobApplicationRecord {
  const status = isApplicationStatus(row.status) ? row.status : 'applied';
  return {
    id: row.id,
    jobListingId: row.jobListingId,
    title: row.title,
    company: row.company,
    location: row.location,
    applyUrl: row.applyUrl,
    source: row.source,
    status,
    hasReply: row.hasReply,
    notes: row.notes,
    appliedAt: row.appliedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function listUserApplications(userId: string): Promise<JobApplicationRecord[]> {
  const rows = await prisma.jobApplication.findMany({
    where: { userId },
    orderBy: [{ appliedAt: 'desc' }],
  });
  return rows.map(toRecord);
}

export async function getApplicationStats(userId: string): Promise<ApplicationStats> {
  const rows = await prisma.jobApplication.findMany({
    where: { userId },
    select: { status: true, hasReply: true },
  });

  const byStatus = new Map<string, number>();
  let awaitingReply = 0;
  let inProcess = 0;
  let offers = 0;
  let rejected = 0;

  for (const row of rows) {
    byStatus.set(row.status, (byStatus.get(row.status) ?? 0) + 1);
    if (!row.hasReply && !['rejected', 'offer', 'withdrawn'].includes(row.status)) {
      awaitingReply++;
    }
    if (row.status === 'screening' || row.status === 'interview') {
      inProcess++;
    }
    if (row.status === 'offer') offers++;
    if (row.status === 'rejected') rejected++;
  }

  return {
    total: rows.length,
    awaitingReply,
    inProcess,
    offers,
    rejected,
    byStatus: [...byStatus.entries()].map(([status, count]) => ({ status, count })),
  };
}

export type CreateApplicationInput = {
  jobListingId?: string | null;
  title: string;
  company: string;
  location?: string;
  applyUrl?: string | null;
  source?: string | null;
};

export async function createApplication(userId: string, input: CreateApplicationInput) {
  const jobListingId = input.jobListingId?.trim() || null;

  if (jobListingId) {
    const existing = await prisma.jobApplication.findUnique({
      where: { userId_jobListingId: { userId, jobListingId } },
    });
    if (existing) {
      return toRecord(existing);
    }
  }

  const row = await prisma.jobApplication.create({
    data: {
      userId,
      jobListingId,
      title: input.title.trim(),
      company: input.company.trim(),
      location: input.location?.trim() ?? '',
      applyUrl: input.applyUrl?.trim() || null,
      source: input.source?.trim() || null,
      status: 'applied',
      hasReply: false,
    },
  });

  return toRecord(row);
}

export type UpdateApplicationInput = {
  status?: ApplicationStatusId;
  hasReply?: boolean;
  notes?: string | null;
};

export async function updateApplication(
  userId: string,
  id: string,
  input: UpdateApplicationInput
) {
  const existing = await prisma.jobApplication.findFirst({
    where: { id, userId },
  });
  if (!existing) return null;

  const row = await prisma.jobApplication.update({
    where: { id },
    data: {
      ...(input.status !== undefined ? { status: input.status } : {}),
      ...(input.hasReply !== undefined ? { hasReply: input.hasReply } : {}),
      ...(input.notes !== undefined ? { notes: input.notes } : {}),
    },
  });

  return toRecord(row);
}
