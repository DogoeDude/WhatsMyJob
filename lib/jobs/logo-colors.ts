/** Stable, distinct tile colors for company initials (Win11-style soft accents). */
const LOGO_COLOR_PALETTE = [
  { bg: '#c7d9f0', fg: '#1e3a5f' },
  { bg: '#d9cce8', fg: '#3d2d5c' },
  { bg: '#c5e6d8', fg: '#1a4d38' },
  { bg: '#f5dcc4', fg: '#6b3d12' },
  { bg: '#f0c9d4', fg: '#6b2244' },
  { bg: '#d4ddf0', fg: '#2a3d66' },
  { bg: '#ebe3c8', fg: '#5c4a18' },
  { bg: '#c8e0e0', fg: '#1f4a4a' },
  { bg: '#e0d4ec', fg: '#44335a' },
  { bg: '#d8d8d8', fg: '#2b2b2b' },
  { bg: '#f0d4c4', fg: '#5c3018' },
  { bg: '#cce0f0', fg: '#1a4466' },
] as const;

function hashCompanyName(company: string): number {
  const key = company.trim().toLowerCase() || 'company';
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export function getCompanyLogoColors(company: string): { bg: string; fg: string } {
  return LOGO_COLOR_PALETTE[hashCompanyName(company) % LOGO_COLOR_PALETTE.length];
}

/** One or two initials from a company name. */
export function companyInitials(company: string): string {
  const words = company
    .trim()
    .split(/\s+/)
    .map((w) => w.replace(/[^a-zA-Z0-9]/g, ''))
    .filter((w) => w.length > 0);

  if (words.length === 0) return '?';
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function buildUiAvatarsUrl(company: string, size = 128): string {
  const name = company.trim() || 'Company';
  const { bg, fg } = getCompanyLogoColors(name);
  const params = new URLSearchParams({
    name,
    size: String(size),
    background: bg.replace('#', ''),
    color: fg.replace('#', ''),
    bold: 'true',
  });
  return `https://ui-avatars.com/api/?${params}`;
}
