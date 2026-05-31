'use client';

import { JobCard } from '@/components/job-card';
import { groupJobsByCategory } from '@/lib/jobs/categories';
import type { Job } from '@/lib/jobs/types';

type JobSectionsProps = {
  jobs: Job[];
  onJobSelect: (job: Job) => void;
};

export function JobSections({ jobs, onJobSelect }: JobSectionsProps) {
  const sections = groupJobsByCategory(jobs);

  if (sections.length === 0) return null;

  return (
    <div className="space-y-12 p-4 sm:p-6">
      {sections.map(({ category, jobs: sectionJobs }) => (
        <section key={category.id} id={`category-${category.id}`} className="relative pl-4">
          <div
            className="absolute bottom-0 left-0 top-0 w-1 rounded-full bg-gradient-to-b from-primary/60 via-primary/30 to-transparent"
            aria-hidden
          />
          <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold tracking-tight text-foreground sm:text-xl">
              {category.label}
            </h2>
            <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
              {sectionJobs.length} {sectionJobs.length === 1 ? 'role' : 'roles'}
            </span>
          </div>
          <div className="space-y-3">
            {sectionJobs.map((job) => (
              <JobCard key={job.id} job={job} onJobSelect={() => onJobSelect(job)} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
