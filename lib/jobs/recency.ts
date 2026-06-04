export type JobRecencyVariant = 'latest' | 'new' | 'recent' | 'week' | 'later';

export type JobRecencyFlag = {
  label: string;
  variant: JobRecencyVariant;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** Age buckets for list badges (newest → older). */
export function getJobRecencyFlag(
  postedAtMs?: number,
  now = Date.now()
): JobRecencyFlag | null {
  if (!postedAtMs || postedAtMs <= 0 || Number.isNaN(postedAtMs)) {
    return null;
  }

  const ageMs = now - postedAtMs;
  if (ageMs < 0) {
    return { label: 'Latest', variant: 'latest' };
  }

  if (ageMs <= MS_PER_DAY) {
    return { label: 'Latest', variant: 'latest' };
  }
  if (ageMs <= 3 * MS_PER_DAY) {
    return { label: 'New', variant: 'new' };
  }
  if (ageMs <= 7 * MS_PER_DAY) {
    return { label: 'Recent', variant: 'recent' };
  }
  if (ageMs <= 14 * MS_PER_DAY) {
    return { label: 'This week', variant: 'week' };
  }

  return { label: 'Later', variant: 'later' };
}

export const jobRecencyBadgeClass: Record<JobRecencyVariant, string> = {
  latest:
    'border-emerald-500/45 bg-emerald-500/15 text-emerald-900 dark:text-emerald-300',
  new: 'border-sky-500/40 bg-sky-500/12 text-sky-900 dark:text-sky-300',
  recent: 'border-primary/35 bg-primary/10 text-primary',
  week: 'border-border bg-muted/60 text-muted-foreground',
  later: 'border-transparent bg-muted/40 text-muted-foreground',
};
