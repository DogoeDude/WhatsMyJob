'use client';

import { useEffect, useState } from 'react';
import { X, MapPin, DollarSign, Calendar, ExternalLink, Loader2 } from 'lucide-react';
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

export function JobDetailsModal({ isOpen, onClose, job }: JobDetailsModalProps) {
  const [details, setDetails] = useState<Job>(job);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    setDetails(job);
  }, [job]);

  useEffect(() => {
    if (!isOpen) return;
    if (job.description?.trim()) return;

    let cancelled = false;
    setLoadingDetails(true);

    (async () => {
      try {
        const res = await fetch(`/api/jobs/${job.id}`);
        const data = (await res.json()) as { job?: Job };
        if (!cancelled && res.ok && data.job) {
          setDetails(data.job);
        }
      } catch {
        /* keep preview */
      } finally {
        if (!cancelled) setLoadingDetails(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isOpen, job.id, job.description]);

  const display = details;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl flex-col gap-0 overflow-hidden rounded-lg border border-border bg-card p-0 sm:max-w-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="flex min-w-0 gap-3">
            <CompanyLogo company={display.company} logoUrl={display.logoUrl} size="lg" />
            <div className="min-w-0">
              <DialogTitle className="text-left text-lg font-semibold leading-snug">
                {display.title}
              </DialogTitle>
              <DialogDescription className="mt-1 text-left text-sm text-muted-foreground">
                {display.company}
                {display.source ? ` · ${display.source}` : ''}
              </DialogDescription>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <dl className="grid grid-cols-1 gap-3 border-b border-border px-5 py-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" /> Location
            </dt>
            <dd className="mt-0.5 font-medium">{display.location}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <DollarSign className="h-3 w-3" /> Salary
            </dt>
            <dd className="mt-0.5 font-medium">{display.salary}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" /> Posted
            </dt>
            <dd className="mt-0.5 font-medium">{display.postedDate}</dd>
          </div>
        </dl>

        {display.tags && display.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 border-b border-border px-5 py-3">
            {display.tags.map((tag, index) => (
              <span
                key={`${display.id}-tag-${index}`}
                className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
          <h3 className="mb-3 text-sm font-medium text-foreground">Description</h3>
          {loadingDetails ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading details…
            </div>
          ) : (
            <>
              <JobDescriptionContent description={display.description} />
              <JobDetailList title="Requirements" items={display.requirements} />
              <JobDetailList title="Benefits" items={display.benefits} />
            </>
          )}
        </div>

        <div className="border-t border-border px-5 py-4">
          {display.applyUrl ? (
            <Button asChild className="w-full">
              <Link href={display.applyUrl} target="_blank" rel="noopener noreferrer">
                Apply on {display.source ?? 'job board'}
                <ExternalLink className="h-4 w-4" />
              </Link>
            </Button>
          ) : (
            <Button className="w-full" disabled>
              No apply link
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
