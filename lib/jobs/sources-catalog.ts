/** Job board / aggregator sources (API providers). */
export type JobSourceMeta = {
  id: string;
  name: string;
  website: string;
  description: string;
};

export const JOB_SOURCES_CATALOG: JobSourceMeta[] = [
  {
    id: 'remotive',
    name: 'Remotive',
    website: 'https://remotive.com',
    description: 'Remote tech jobs',
  },
  {
    id: 'arbeitnow',
    name: 'Arbeitnow',
    website: 'https://www.arbeitnow.com',
    description: 'Europe & remote roles',
  },
  {
    id: 'jobicy',
    name: 'Jobicy',
    website: 'https://jobicy.com',
    description: 'Remote job board',
  },
  {
    id: 'remoteok',
    name: 'RemoteOK',
    website: 'https://remoteok.com',
    description: 'Remote-only listings',
  },
  {
    id: 'remotejobs',
    name: 'RemoteJobs.org',
    website: 'https://remotejobs.org',
    description: 'Remote job aggregator',
  },
  {
    id: 'careernest',
    name: 'Career Nest',
    website: 'https://careernest.cloud',
    description: 'Global job feed',
  },
  {
    id: 'workbeam',
    name: 'Workbeam',
    website: 'https://workbeamhq.com',
    description: 'Free tech jobs API (no key)',
  },
  {
    id: 'jobsbase',
    name: 'Jobs Base',
    website: 'https://jobsbase.io',
    description: 'Free builder/tech jobs API (no key)',
  },
  {
    id: 'reed',
    name: 'Reed.co.uk',
    website: 'https://www.reed.co.uk',
    description: 'UK job board',
  },
  {
    id: 'adzuna',
    name: 'Adzuna',
    website: 'https://www.adzuna.com',
    description: 'US / UK job search API',
  },
];

export function getSourceMeta(sourceId: string): JobSourceMeta | undefined {
  return JOB_SOURCES_CATALOG.find((s) => s.id === sourceId);
}

export function getSourceDisplayName(sourceId: string, fallback?: string): string {
  return getSourceMeta(sourceId)?.name ?? fallback ?? sourceId;
}
