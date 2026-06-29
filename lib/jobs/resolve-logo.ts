import { buildUiAvatarsUrl, companyInitials, getCompanyLogoColors } from '@/lib/jobs/logo-colors';

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

/** Always returns a URL that loads in `<img>` (favicon or generated avatar). */
export function fallbackLogoUrl(company: string): string {
  const name = company.trim() || 'Company';
  const domain = guessCompanyDomain(name);
  if (domain) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  }
  return buildUiAvatarsUrl(name);
}

/**
 * Pick the best logo URL for API responses.
 * Provider URLs are kept when present; otherwise use favicon/avatar (never empty).
 */
export function resolveJobLogoUrl(company: string, logoUrl?: string | null): string {
  const trimmed = logoUrl?.trim();
  if (trimmed) return trimmed;
  return fallbackLogoUrl(company);
}

/** Client img `src` candidates — provider URL first, then favicon, then avatar. */
export function buildLogoImgSources(logoUrl: string | null | undefined, company: string): string[] {
  const out: string[] = [];
  const trimmed = logoUrl?.trim();
  if (trimmed) out.push(trimmed);

  const domain = guessCompanyDomain(company);
  if (domain) {
    out.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`);
    out.push(`https://icons.duckduckgo.com/ip3/${domain}.ico`);
  }

  const name = company.trim() || 'Co';
  out.push(buildUiAvatarsUrl(name));

  return [...new Set(out)];
}
