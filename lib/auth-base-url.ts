/** Resolve app origin for Better Auth (works on Vercel without manual URL updates). */
export function resolveAuthBaseURL(): string {
  const explicit = process.env.BETTER_AUTH_URL?.trim();
  if (explicit && !explicit.includes('localhost')) {
    return explicit.replace(/\/$/, '');
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl && !appUrl.includes('localhost')) {
    return appUrl.replace(/\/$/, '');
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, '')}`;
  }

  return (explicit || appUrl || 'http://localhost:3000').replace(/\/$/, '');
}
