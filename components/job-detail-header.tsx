'use client';

import {
  Building2,
  Briefcase,
  Calendar,
  DollarSign,
  MapPin,
} from 'lucide-react';
import { CompanyLogo } from '@/components/company-logo';
import type { Job } from '@/lib/jobs/types';
import { cn } from '@/lib/utils';

function isMeaningfulSalary(salary: string) {
  const s = salary.trim().toLowerCase();
  return s.length > 0 && !/^(not disclosed|not specified|n\/a|—|-)$/i.test(s);
}

function workplaceKind(location: string): string | null {
  const l = location.toLowerCase();
  if (/\bremote\b/.test(l)) return 'Remote';
  if (/\bhybrid\b/.test(l)) return 'Hybrid';
  if (/\bon-?site\b/.test(l)) return 'On-site';
  return null;
}

function MetaPill({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex max-w-full items-center gap-2 rounded-md border border-border/80 bg-background/90 px-2.5 py-1.5 text-xs shadow-sm',
        className
      )}
      title={`${label}: ${value}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <span className="min-w-0 truncate font-medium text-foreground">{value}</span>
    </span>
  );
}

type JobDetailHeaderProps = {
  job: Job;
  className?: string;
};

export function JobDetailHeader({ job, className }: JobDetailHeaderProps) {
  const workplace = workplaceKind(job.location);
  const showSalary = isMeaningfulSalary(job.salary);

  return (
    <header
      className={cn(
        'shrink-0 border-b border-border bg-gradient-to-b from-muted/40 via-card to-card px-4 py-4 sm:px-6 sm:py-5 lg:px-6',
        className
      )}
    >
      <div className="flex min-w-0 gap-4 sm:gap-5">
          <CompanyLogo
            company={job.company}
            logoUrl={job.logoUrl}
            size="lg"
            className="h-14 w-14 rounded-lg shadow-sm ring-1 ring-border/80 sm:h-16 sm:w-16"
          />
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              {workplace && (
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                  {workplace}
                </span>
              )}
              {job.type?.trim() && (
                <span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
                  {job.type}
                </span>
              )}
              {job.source?.trim() && (
                <span className="rounded-md border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                  {job.source}
                </span>
              )}
            </div>

            <h2 className="text-lg font-semibold leading-snug tracking-tight text-foreground sm:text-xl">
              {job.title}
            </h2>

            <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground sm:text-base">
              <Building2 className="h-4 w-4 shrink-0 opacity-70" aria-hidden />
              <span className="truncate font-medium text-foreground/90">{job.company}</span>
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {job.location?.trim() && (
                <MetaPill icon={MapPin} label="Location" value={job.location} />
              )}
              {showSalary && (
                <MetaPill
                  icon={DollarSign}
                  label="Salary"
                  value={job.salary}
                  className="border-primary/20 bg-primary/5"
                />
              )}
              {job.type?.trim() && (
                <MetaPill icon={Briefcase} label="Job type" value={job.type} className="sm:hidden" />
              )}
              {job.postedDate?.trim() && (
                <MetaPill icon={Calendar} label="Posted" value={job.postedDate} />
              )}
            </div>
          </div>
      </div>
    </header>
  );
}
