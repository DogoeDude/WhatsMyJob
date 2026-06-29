'use client';

import { JobCard } from '@/components/job-card';
import { groupJobsByCategory } from '@/lib/jobs/categories';
import type { Job } from '@/lib/jobs/types';

type JobSectionsProps = {
  jobs: Job[];
  selectedJobId?: string | null;
  onJobSelect: (job: Job) => void;
};

export function JobSections({ jobs, selectedJobId, onJobSelect }: JobSectionsProps) {
  const sections = groupJobsByCategory(jobs);

  if (sections.length === 0) return null;

  return (
    <div>
      {sections.map(({ category, jobs: sectionJobs }) => (
        <section key={category.id} id={`category-${category.id}`}>
          <div className="sticky top-0 z-[1] flex items-baseline justify-between gap-2 border-b border-border bg-secondary px-3 py-2 sm:px-4">
            <h2 className="text-sm font-semibold text-foreground">{category.label}</h2>
            <span className="text-xs text-muted-foreground">{sectionJobs.length}</span>
          </div>
          <ul className="divide-y divide-border">
            {sectionJobs.map((job) => (
              <li key={job.id}>
                <JobCard
                  job={job}
                  compact
                  isSelected={job.id === selectedJobId}
                  onJobSelect={() => onJobSelect(job)}
                />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
