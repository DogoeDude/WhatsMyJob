import { formatDistanceToNow } from 'date-fns';
import type { Job } from '@/lib/jobs/types';

export function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function formatPostedDate(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) return 'Recently';
  return formatDistanceToNow(date, { addSuffix: true });
}

export function parseJsonStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === 'string');
}

/** Newest first — stable refresh ordering (no round-robin flip-flop). */
export function sortJobsByRecency(jobs: Job[]): Job[] {
  return [...jobs].sort((a, b) => (b.postedAtMs ?? 0) - (a.postedAtMs ?? 0));
}

export function dedupeStrings(values: unknown[], caseInsensitive = false): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of values) {
    if (raw == null) continue;
    const v = (typeof raw === 'string' ? raw : String(raw)).trim();
    if (!v) continue;
    const key = caseInsensitive ? v.toLowerCase() : v;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
  }
  return out;
}

/** Normalize a logo URL from provider payloads; returns undefined if missing or invalid. */
export function sanitizeLogoUrl(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return undefined;
    return url.href;
  } catch {
    return undefined;
  }
}
