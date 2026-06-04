export const PREFERRED_WORK_OPTIONS = [
  { value: 'any', label: 'Any arrangement' },
  { value: 'remote', label: 'Remote only' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
] as const;

export const PREFERRED_TYPE_OPTIONS = [
  'Full-time',
  'Part-time',
  'Contract',
  'Freelance',
  'Internship',
] as const;

export type PreferredWork = (typeof PREFERRED_WORK_OPTIONS)[number]['value'];

export type ResumeMeta = {
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  updatedAt: string;
} | null;

export type UserProfileDto = {
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: string;
  memberSince: string;
  hasPassword: boolean;
  headline: string;
  phone: string;
  location: string;
  contactEmail: string;
  bio: string;
  coverLetter: string;
  linkedInUrl: string;
  portfolioUrl: string;
  githubUrl: string;
  resume: ResumeMeta;
  preferredWork: PreferredWork;
  preferredTypes: string[];
  skills: string[];
  openToWork: boolean;
  yearsExperience: number | null;
  applicationCount: number;
};

export type UpdateProfileInput = {
  name?: string;
  headline?: string;
  phone?: string;
  location?: string;
  contactEmail?: string;
  bio?: string;
  coverLetter?: string;
  linkedInUrl?: string;
  portfolioUrl?: string;
  githubUrl?: string;
  preferredWork?: string;
  preferredTypes?: string[];
  skills?: string[];
  openToWork?: boolean;
  yearsExperience?: number | null;
};
