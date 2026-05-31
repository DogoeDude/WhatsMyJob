import type { Job } from '@/lib/jobs/types';

export type FilterSuggestion =
  | { kind: 'search'; label: string }
  | { kind: 'location'; label: string }
  | { kind: 'type'; label: string };

export const POPULAR_SEARCH_SUGGESTIONS: FilterSuggestion[] = [
  { kind: 'search', label: 'React' },
  { kind: 'search', label: 'Python' },
  { kind: 'search', label: 'Designer' },
  { kind: 'search', label: 'Engineer' },
  { kind: 'search', label: 'Product Manager' },
  { kind: 'search', label: 'DevOps' },
];

export const POPULAR_LOCATION_SUGGESTIONS: FilterSuggestion[] = [
  { kind: 'location', label: 'Philippines' },
  { kind: 'location', label: 'Manila' },
  { kind: 'location', label: 'Remote' },
  { kind: 'location', label: 'USA' },
  { kind: 'location', label: 'Europe' },
  { kind: 'location', label: 'UK' },
];

export const POPULAR_TYPE_SUGGESTIONS: FilterSuggestion[] = [
  { kind: 'type', label: 'Full-time' },
  { kind: 'type', label: 'Contract' },
  { kind: 'type', label: 'Part-time' },
];

export function getTopLocationsFromJobs(jobs: Job[], limit = 8): string[] {
  const counts = new Map<string, number>();
  for (const job of jobs) {
    const loc = job.location.trim();
    if (!loc) continue;
    counts.set(loc, (counts.get(loc) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([loc]) => loc);
}

export function mergeLocationSuggestions(
  fromData: string[],
  selectedLocation: string
): FilterSuggestion[] {
  const seen = new Set<string>();
  const out: FilterSuggestion[] = [];

  const add = (label: string) => {
    const key = label.toLowerCase();
    if (seen.has(key) || label === selectedLocation) return;
    seen.add(key);
    out.push({ kind: 'location', label });
  };

  for (const loc of fromData) add(loc);
  for (const s of POPULAR_LOCATION_SUGGESTIONS) add(s.label);
  return out.slice(0, 8);
}
