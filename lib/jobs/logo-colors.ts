/** Stable accent colors for company initials when logos are missing. */
const LOGO_COLOR_PALETTE = [
  { bg: '#6366f1', fg: '#ffffff' },
  { bg: '#0ea5e9', fg: '#ffffff' },
  { bg: '#14b8a6', fg: '#ffffff' },
  { bg: '#22c55e', fg: '#ffffff' },
  { bg: '#f59e0b', fg: '#1f2937' },
  { bg: '#f97316', fg: '#ffffff' },
  { bg: '#ef4444', fg: '#ffffff' },
  { bg: '#ec4899', fg: '#ffffff' },
  { bg: '#a855f7', fg: '#ffffff' },
  { bg: '#64748b', fg: '#ffffff' },
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
