export type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  tags: string[];
  description: string;
  requirements: string[];
  benefits: string[];
  postedDate: string;
  applyUrl?: string;
  /** Provider id, e.g. remotive, arbeitnow */
  sourceId?: string;
  /** Display name of the job board */
  source?: string;
  sourceWebsite?: string;
  /** Company logo URL when provided by the job board */
  logoUrl?: string;
};

export type NormalizedJobInput = {
  externalId: string;
  title: string;
  company: string;
  location: string;
  salary?: string;
  type?: string;
  description: string;
  tags?: string[];
  requirements?: string[];
  benefits?: string[];
  applyUrl?: string;
  postedAt?: Date | null;
  logoUrl?: string;
};

export type SyncProviderResult = {
  added: number;
  updated: number;
  total: number;
};

export type JobProvider = {
  id: string;
  name: string;
  isConfigured: () => boolean;
  fetchJobs: () => Promise<NormalizedJobInput[]>;
};
