'use client';

import { MapPin, DollarSign, Clock, Heart, ArrowUpRight } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CompanyLogo } from '@/components/company-logo';
import type { Job } from '@/lib/jobs/types';

interface JobCardProps {
  job: Job;
  onJobSelect: () => void;
}

export function JobCard({ job, onJobSelect }: JobCardProps) {
  const [isSaved, setIsSaved] = useState(false);

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={onJobSelect}
      onKeyDown={(e) => e.key === 'Enter' && onJobSelect()}
      className={cn(
        'group relative flex cursor-pointer gap-4 overflow-hidden rounded-2xl border border-border/60 bg-card p-5 transition-all duration-200',
        'hover:border-primary/30 hover:shadow-[0_8px_24px_-8px_oklch(0.48_0.19_275/0.2)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'
      )}
    >
      <CompanyLogo company={job.company} logoUrl={job.logoUrl} size="md" />

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold leading-snug text-foreground transition-colors group-hover:text-primary sm:text-[17px]">
                {job.title}
              </h3>
              <span className="rounded-md bg-primary/10 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-primary">
                {job.type}
              </span>
            </div>
            <p className="text-sm font-medium text-muted-foreground">{job.company}</p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              setIsSaved(!isSaved);
            }}
            className={cn(
              'shrink-0 rounded-full opacity-70 transition-opacity group-hover:opacity-100',
              isSaved && 'bg-red-500/10 text-red-500 opacity-100 hover:bg-red-500/15'
            )}
            aria-label={isSaved ? 'Unsave job' : 'Save job'}
          >
            <Heart className={cn('h-4 w-4', isSaved && 'fill-current')} />
          </Button>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm">
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <MapPin className="h-3.5 w-3.5 shrink-0 text-primary/80" />
            {job.location}
          </span>
          <span className="inline-flex items-center gap-1.5 font-medium text-foreground/90">
            <DollarSign className="h-3.5 w-3.5 shrink-0 text-primary/80" />
            {job.salary}
          </span>
          {job.postedDate && (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <Clock className="h-3.5 w-3.5 shrink-0" />
              {job.postedDate}
            </span>
          )}
          {job.source && (
            <span className="text-xs text-muted-foreground">via {job.source}</span>
          )}
        </div>

        {job.tags && job.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {job.tags.slice(0, 4).map((tag, index) => (
              <span
                key={`${job.id}-tag-${index}`}
                className="rounded-md bg-muted/80 px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div className="hidden shrink-0 items-center self-center sm:flex">
        <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary opacity-0 transition-all group-hover:opacity-100">
          View
          <ArrowUpRight className="h-3.5 w-3.5" />
        </span>
      </div>
    </article>
  );
}
