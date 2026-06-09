import { adzunaProvider } from '@/lib/jobs/providers/adzuna';
import { arbeitnowProvider } from '@/lib/jobs/providers/arbeitnow';
import { careernestProvider } from '@/lib/jobs/providers/careernest';
import { jobicyProvider } from '@/lib/jobs/providers/jobicy';
import { jobsbaseProvider } from '@/lib/jobs/providers/jobsbase';
import { reedProvider } from '@/lib/jobs/providers/reed';
import { remoteJobsOrgProvider } from '@/lib/jobs/providers/remotejobs-org';
import { remoteokProvider } from '@/lib/jobs/providers/remoteok';
import { remotiveProvider } from '@/lib/jobs/providers/remotive';
import { workbeamProvider } from '@/lib/jobs/providers/workbeam';
import type { JobProvider } from '@/lib/jobs/types';

export const jobProviders: JobProvider[] = [
  remotiveProvider,
  arbeitnowProvider,
  jobicyProvider,
  remoteokProvider,
  remoteJobsOrgProvider,
  careernestProvider,
  workbeamProvider,
  jobsbaseProvider,
  reedProvider,
  adzunaProvider,
];

export function getProvider(id: string): JobProvider | undefined {
  return jobProviders.find((p) => p.id === id);
}

export function getActiveProviders(): JobProvider[] {
  return jobProviders.filter((p) => p.isConfigured());
}
