import type { Job } from '@/lib/jobs/types';

export type JobCategory = {
  id: string;
  label: string;
  keywords: string[];
};

/** Browse sections — order matters for grouping (first match wins). */
export const JOB_CATEGORIES: JobCategory[] = [
  {
    id: 'it',
    label: 'IT & Tech',
    keywords: [
      'developer',
      'engineer',
      'software',
      'devops',
      'data scientist',
      'programmer',
      'frontend',
      'backend',
      'full stack',
      'fullstack',
      'cloud',
      'cyber',
      'technical',
      'web developer',
      'mobile',
      'java',
      'python',
      'react',
      'node',
      'IT ',
      'systems',
      'network',
      'qa ',
      'quality assurance',
      'machine learning',
      'AI ',
    ],
  },
  {
    id: 'business',
    label: 'Business',
    keywords: [
      'business',
      'operations',
      'project manager',
      'consultant',
      'analyst',
      'strategy',
      'management',
      'executive',
      'administrator',
      'coordinator',
      'director',
      'supervisor',
      'account manager',
    ],
  },
  {
    id: 'design',
    label: 'Design & Creative',
    keywords: [
      'design',
      'designer',
      'creative',
      'UX',
      'UI ',
      'graphic',
      'illustrator',
      'art director',
      'brand',
      'visual',
    ],
  },
  {
    id: 'marketing',
    label: 'Marketing',
    keywords: [
      'marketing',
      'SEO',
      'content',
      'social media',
      'copywriter',
      'growth',
      'digital marketing',
      'communications',
      'PR ',
    ],
  },
  {
    id: 'finance',
    label: 'Finance',
    keywords: [
      'finance',
      'accounting',
      'accountant',
      'financial',
      'audit',
      'bookkeeper',
      'payroll',
      'investment',
      'banking',
    ],
  },
  {
    id: 'healthcare',
    label: 'Healthcare',
    keywords: [
      'health',
      'nurse',
      'medical',
      'clinical',
      'pharmacy',
      'doctor',
      'physician',
      'caregiver',
      'hospital',
    ],
  },
  {
    id: 'hr',
    label: 'HR & Admin',
    keywords: [
      'human resources',
      ' HR ',
      'recruiter',
      'recruitment',
      'talent',
      'people operations',
      'office admin',
      'receptionist',
      'secretary',
    ],
  },
  {
    id: 'sales',
    label: 'Sales',
    keywords: ['sales', 'business development', 'BDR', 'SDR', 'account executive', 'retail'],
  },
  {
    id: 'other',
    label: 'Other',
    keywords: [],
  },
];

export const ALL_CATEGORY_ID = 'all';

export function getCategoryById(id: string): JobCategory | undefined {
  return JOB_CATEGORIES.find((c) => c.id === id);
}

function jobHaystack(job: Job): string {
  return `${job.title} ${job.description} ${job.tags.join(' ')}`.toLowerCase();
}

export function jobMatchesCategoryKeywords(job: Job, category: JobCategory): boolean {
  if (category.keywords.length === 0) return false;
  const haystack = jobHaystack(job);
  return category.keywords.some((kw) => haystack.includes(kw.toLowerCase()));
}

/** Primary section for a job (first matching category, else other). */
export function inferJobCategoryId(job: Job): string {
  for (const cat of JOB_CATEGORIES) {
    if (cat.id === 'other') continue;
    if (jobMatchesCategoryKeywords(job, cat)) return cat.id;
  }
  return 'other';
}

export function jobMatchesCategory(job: Job, categoryId: string): boolean {
  if (!categoryId || categoryId === ALL_CATEGORY_ID) return true;
  if (categoryId === 'other') return inferJobCategoryId(job) === 'other';
  const cat = getCategoryById(categoryId);
  return cat ? jobMatchesCategoryKeywords(job, cat) : true;
}

export function groupJobsByCategory(jobs: Job[]): { category: JobCategory; jobs: Job[] }[] {
  const buckets = new Map<string, Job[]>();
  for (const cat of JOB_CATEGORIES) {
    buckets.set(cat.id, []);
  }

  for (const job of jobs) {
    const id = inferJobCategoryId(job);
    buckets.get(id)?.push(job);
  }

  return JOB_CATEGORIES.map((category) => ({
    category,
    jobs: buckets.get(category.id) ?? [],
  })).filter((section) => section.jobs.length > 0);
}
