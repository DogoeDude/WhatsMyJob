import { buildUiAvatarsUrl, companyInitials, getCompanyLogoColors } from '@/lib/jobs/logo-colors';

/** Favicon / generated avatar URLs — not real employer logos. */
export function isPlaceholderLogoUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return (
    u.includes('google.com/s2/favicons') ||
    u.includes('duckduckgo.com/ip3/') ||
    u.includes('ui-avatars.com') ||
    u.includes('clearbit.com') ||
    u.endsWith('/favicon.ico')
  );
}

/** Best-effort company domain for favicon lookup. */
export function guessCompanyDomain(company: string): string | null {
  const clean = company
    .trim()
    .toLowerCase()
    .replace(/\s+(inc|llc|ltd|corp|co|gmbh|ohg|ag)\.?$/i, '')
    .replace(/[^a-z0-9]/g, '');
  if (clean.length < 2) return null;
  return `${clean}.com`;
}

/** Fallback image URL when a colored initials tile is not used (e.g. exports). */
export function fallbackLogoUrl(company: string): string {
  return buildUiAvatarsUrl(company);
}

/**
 * Keep only real provider logo URLs on job records.
 * Synthetic favicons/avatars are omitted so the UI can show colored initials.
 */
export function resolveJobLogoUrl(
  company: string,
  logoUrl?: string | null
): string | undefined {
  void company;
  const trimmed = logoUrl?.trim();
  if (!trimmed || isPlaceholderLogoUrl(trimmed)) return undefined;
  return trimmed;
}

/** Client img candidates — real provider URL only; initials handle the rest. */
export function buildLogoImgSources(logoUrl: string | null | undefined, company: string): string[] {
  void company;
  const trimmed = logoUrl?.trim();
  if (!trimmed || isPlaceholderLogoUrl(trimmed)) return [];
  return [trimmed];
}

export { companyInitials, getCompanyLogoColors };
