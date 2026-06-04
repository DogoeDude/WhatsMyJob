import type { ApplicationStatusId } from '@/lib/applications/statuses';

export type JobApplicationRecord = {
  id: string;
  jobListingId: string | null;
  title: string;
  company: string;
  location: string;
  applyUrl: string | null;
  source: string | null;
  status: ApplicationStatusId;
  hasReply: boolean;
  notes: string | null;
  appliedAt: string;
  updatedAt: string;
};

export type ApplicationStats = {
  total: number;
  awaitingReply: number;
  inProcess: number;
  offers: number;
  rejected: number;
  byStatus: { status: string; count: number }[];
};
