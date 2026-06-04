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

const applicationListSelect = {
  id: true,
  jobListingId: true,
  title: true,
  company: true,
  location: true,
  applyUrl: true,
  source: true,
  status: true,
  hasReply: true,
  notes: true,
  appliedAt: true,
  updatedAt: true,
} as const;

export async function listUserApplications(userId: string): Promise<JobApplicationRecord[]> {
  const rows = await prisma.jobApplication.findMany({
    where: { userId },
    orderBy: [{ appliedAt: 'desc' }],
    select: applicationListSelect,
  });
  return rows.map(toRecord);
}

export async function getApplicationStats(userId: string): Promise<ApplicationStats> {
  const [total, byStatusRows, awaitingReply, inProcess, offers, rejected] = await Promise.all([
    prisma.jobApplication.count({ where: { userId } }),
    prisma.jobApplication.groupBy({
      by: ['status'],
      where: { userId },
      _count: { _all: true },
    }),
    prisma.jobApplication.count({
      where: {
        userId,
        hasReply: false,
        status: { notIn: ['rejected', 'offer', 'withdrawn'] },
      },
    }),
    prisma.jobApplication.count({
      where: { userId, status: { in: ['screening', 'interview'] } },
    }),
    prisma.jobApplication.count({ where: { userId, status: 'offer' } }),
    prisma.jobApplication.count({ where: { userId, status: 'rejected' } }),
  ]);

  return {
    total,
    awaitingReply,
    inProcess,
    offers,
    rejected,
    byStatus: byStatusRows.map((row) => ({
      status: row.status,
      count: row._count._all,
    })),
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
