'use client';

import {
  X,
  MapPin,
  DollarSign,
  Calendar,
  Share2,
  Heart,
  ExternalLink,
  Building2,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { JobDescriptionContent, JobDetailList } from '@/components/job-description-content';
import { CompanyLogo } from '@/components/company-logo';
import type { Job } from '@/lib/jobs/types';

interface JobDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: Job;
}

function FactCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-card/80 px-4 py-3">
      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Icon className="h-3.5 w-3.5 shrink-0" />
        {label}
      </div>
      <p className="text-sm font-semibold leading-snug text-foreground">{value}</p>
    </div>
  );
}

export function JobDetailsModal({ isOpen, onClose, job }: JobDetailsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        overlayClassName="bg-black/35 backdrop-blur-[2px]"
        className="flex max-h-[92vh] w-[calc(100%-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden rounded-2xl border border-border/80 bg-background p-0 shadow-2xl ring-1 ring-white/10 sm:max-w-3xl"
      >
        <div className="relative shrink-0 overflow-hidden border-b border-border/60 bg-gradient-to-br from-primary/8 via-card to-card px-6 pb-6 pt-6 sm:px-8">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" aria-hidden />

          <div className="relative flex items-start justify-between gap-4">
            <div className="flex min-w-0 gap-4">
              <CompanyLogo company={job.company} logoUrl={job.logoUrl} size="lg" />
              <div className="min-w-0 pt-0.5">
                <DialogTitle className="text-left text-xl font-bold leading-tight tracking-tight text-foreground sm:text-2xl">
                  {job.title}
                </DialogTitle>
                <DialogDescription className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-left text-sm sm:text-base">
                  <span className="inline-flex items-center gap-1 font-medium text-foreground">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    {job.company}
                  </span>
                </DialogDescription>
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    <Briefcase className="h-3 w-3" />
                    {job.type}
                  </span>
                  {job.source && (
                    <span className="inline-flex items-center rounded-full border border-border/70 bg-background/80 px-2.5 py-1 text-xs font-medium text-muted-foreground">
                      via {job.source}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={onClose}
              className="relative shrink-0 rounded-full bg-background/60 backdrop-blur-sm"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div className="relative mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <FactCard icon={MapPin} label="Location" value={job.location} />
            <FactCard icon={DollarSign} label="Salary" value={job.salary} />
            <FactCard icon={Calendar} label="Posted" value={job.postedDate} />
          </div>

          {job.tags && job.tags.length > 0 && (
            <div className="relative mt-4 flex flex-wrap gap-1.5">
              {job.tags.map((tag, index) => (
                <span
                  key={`${job.id}-tag-${index}`}
                  className="rounded-md border border-border/60 bg-background/70 px-2 py-0.5 text-xs font-medium text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 sm:px-8">
          <section className="mb-6 pl-1">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              About the role
            </h3>
            <JobDescriptionContent description={job.description} className="pl-2 sm:pl-3" />
          </section>

          <div className="space-y-4">
            <JobDetailList title="Requirements" items={job.requirements} />
            <JobDetailList title="Benefits" items={job.benefits} />
          </div>
        </div>

        <div className="flex shrink-0 gap-3 border-t border-border/60 bg-card/95 px-6 py-4 backdrop-blur-sm sm:px-8">
          {job.applyUrl ? (
            <Button asChild className="flex-1 gap-2" size="lg">
              <Link href={job.applyUrl} target="_blank" rel="noopener noreferrer">
                Apply on {job.source ?? 'job board'}
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button className="flex-1" size="lg" disabled>
              Apply unavailable
            </Button>
          )}
          <Button variant="outline" size="icon-lg" className="shrink-0" type="button" aria-label="Save job">
            <Heart className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon-lg" className="shrink-0" type="button" aria-label="Share job">
            <Share2 className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
