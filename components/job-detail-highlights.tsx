'use client';

import {
  MapPin,
  DollarSign,
  Calendar,
  Briefcase,
  Building2,
  Globe,
  Tag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Job } from '@/lib/jobs/types';

type HighlightItem = {
  icon: typeof MapPin;
  label: string;
  value: string;
  emphasize?: boolean;
};

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

function HighlightCard({
  icon: Icon,
  label,
  value,
  emphasize,
}: HighlightItem) {
  return (
    <div
      className={cn(
        'flex gap-3 rounded-lg border p-3',
        emphasize
          ? 'border-primary/20 bg-primary/5'
          : 'border-border bg-muted/30'
      )}
    >
      <span
        className={cn(
          'flex h-9 w-9 shrink-0 items-center justify-center rounded-md',
          emphasize ? 'bg-primary/10 text-primary' : 'bg-background text-muted-foreground'
        )}
      >
        <Icon className="h-4 w-4" aria-hidden />
      </span>
      <div className="min-w-0">
        <p className="text-xs font-medium text-muted-foreground">{label}</p>
        <p className="mt-0.5 text-sm font-semibold leading-snug text-foreground">{value}</p>
      </div>
    </div>
  );
}

type JobDetailHighlightsProps = {
  job: Job;
  className?: string;
};

export function JobDetailHighlights({ job, className }: JobDetailHighlightsProps) {
  const workplace = workplaceKind(job.location);
  const items: HighlightItem[] = [
    {
      icon: MapPin,
      label: 'Location',
      value: job.location,
      emphasize: Boolean(workplace),
    },
  ];

  if (isMeaningfulSalary(job.salary)) {
    items.push({
      icon: DollarSign,
      label: 'Salary',
      value: job.salary,
      emphasize: true,
    });
  }

  if (job.type?.trim()) {
    items.push({
      icon: Briefcase,
      label: 'Job type',
      value: job.type,
    });
  }

  if (job.postedDate?.trim()) {
    items.push({
      icon: Calendar,
      label: 'Posted',
      value: job.postedDate,
    });
  }

  if (workplace) {
    items.push({
      icon: Globe,
      label: 'Workplace',
      value: workplace,
      emphasize: workplace === 'Remote',
    });
  }

  if (job.company?.trim()) {
    items.push({
      icon: Building2,
      label: 'Company',
      value: job.company,
    });
  }

  if (job.source?.trim()) {
    items.push({
      icon: Tag,
      label: 'Source',
      value: job.source,
    });
  }

  return (
    <div className={cn('grid gap-3 sm:grid-cols-2 xl:grid-cols-3', className)}>
      {items.map((item) => (
        <HighlightCard key={item.label} {...item} />
      ))}
    </div>
  );
}
