'use client';

import { MapPin, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CompanyLogo } from '@/components/company-logo';
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
        'group flex w-full cursor-pointer gap-3 text-left transition-colors',
        compact ? 'px-3 py-3.5 sm:px-4' : 'gap-4 px-4 py-4 sm:px-5',
        isSelected
          ? 'bg-primary/5 ring-1 ring-inset ring-primary/25'
          : 'hover:bg-muted/50',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset'
      )}
    >
      <CompanyLogo company={job.company} logoUrl={job.logoUrl} size={compact ? 'sm' : 'md'} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <h3 className="font-medium text-foreground group-hover:underline">
            {job.title}
          </h3>
          <span className="text-xs text-muted-foreground">{job.type}</span>
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{job.company}</p>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <MapPin className="h-3 w-3 shrink-0" aria-hidden />
            {job.location}
          </span>
          {job.salary && job.salary !== 'Not specified' && (
            <span>{job.salary}</span>
          )}
          {job.postedDate && (
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3 w-3 shrink-0" aria-hidden />
              {job.postedDate}
            </span>
          )}
          {job.source && <span>· {job.source}</span>}
        </div>
        {job.tags && job.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {job.tags.slice(0, 3).map((tag, index) => (
              <span
                key={`${job.id}-tag-${index}`}
                className="rounded bg-muted px-1.5 py-0.5 text-[11px] text-muted-foreground"
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
