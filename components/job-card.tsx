'use client';

import { ChevronRight, MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyLogo } from '@/components/company-logo';
import { JobRecencyBadge } from '@/components/job-recency-badge';
import type { Job } from '@/lib/jobs/types';

interface JobCardProps {
  job: Job;
  onJobSelect: () => void;
  isSelected?: boolean;
  compact?: boolean;
}

export function JobCard({ job, onJobSelect, isSelected, compact }: JobCardProps) {
  return (
    <article
      role="button"
      tabIndex={0}
      aria-current={isSelected ? 'true' : undefined}
      onClick={onJobSelect}
      onKeyDown={(e) => e.key === 'Enter' && onJobSelect()}
      className={cn(
        'group mx-2 my-0.5 flex w-[calc(100%-1rem)] cursor-pointer gap-3 rounded-md border border-transparent border-l-[3px] border-l-transparent text-left transition-colors duration-100',
        compact
          ? 'min-h-[4.25rem] px-3 py-3 sm:px-4 max-lg:touch-manipulation'
          : 'gap-4 px-4 py-4 sm:px-5',
        isSelected ? 'win-list-selected' : 'win-list-hover',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-card'
      )}
    >
      <CompanyLogo company={job.company} logoUrl={job.logoUrl} size={compact ? 'sm' : 'md'} />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-1.5 gap-y-0.5">
              <h3 className="line-clamp-2 text-[15px] font-medium leading-snug text-foreground group-hover:underline lg:text-base">
                {job.title}
              </h3>
              <JobRecencyBadge postedAtMs={job.postedAtMs} />
            </div>
            <p className="mt-1 truncate text-sm text-muted-foreground">{job.company}</p>
          </div>
          {compact && (
            <ChevronRight
              className="mt-0.5 h-5 w-5 shrink-0 text-muted-foreground/70 lg:hidden"
              aria-hidden
            />
          )}
        </div>
        <div className="mt-2 flex flex-col gap-0.5 text-xs text-muted-foreground sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-3 sm:gap-y-1">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            <span className="truncate">{job.location}</span>
          </span>
          <span className="hidden items-center gap-2 sm:inline-flex">
            {job.type && <span>{job.type}</span>}
            {job.salary && job.salary !== 'Not specified' && <span>{job.salary}</span>}
            {job.postedDate && (
              <span className="inline-flex items-center gap-1">
                <Clock className="h-3 w-3 shrink-0" aria-hidden />
                {job.postedDate}
              </span>
            )}
          </span>
          <span className="text-muted-foreground/80 sm:hidden">
            {[job.type, job.postedDate].filter(Boolean).join(' · ')}
          </span>
        </div>
        {job.tags && job.tags.length > 0 && (
          <div className="mt-2 hidden flex-wrap gap-1 sm:flex">
            {job.tags.slice(0, 3).map((tag, index) => (
              <span
                key={`${job.id}-tag-${index}`}
                className="rounded-md bg-muted px-2 py-0.5 text-[11px] text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

    </article>
  );
}
