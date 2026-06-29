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

/** Neutral Win11-style recency chips — no saturated accent colors. */
export const jobRecencyBadgeClass: Record<JobRecencyVariant, string> = {
  latest: 'border-border bg-secondary text-foreground font-medium',
  new: 'border-border bg-muted text-foreground',
  recent: 'border-border bg-muted/80 text-muted-foreground',
  week: 'border-transparent bg-muted/60 text-muted-foreground',
  later: 'border-transparent bg-transparent text-muted-foreground',
};
