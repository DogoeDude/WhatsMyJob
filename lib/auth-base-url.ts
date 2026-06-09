function originFromUrl(raw: string | undefined): string | null {
  const trimmed = raw?.trim();
  if (!trimmed) return null;
  try {
    return new URL(trimmed).origin;
  } catch {
    return null;
  }
}

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

/**
 * Origins allowed for sign-in/register.
 * Vercel serves the same app on the project alias AND per-deployment URLs — both must be trusted.
 */
export function resolveTrustedOrigins(): string[] {
  const origins = new Set<string>(['http://localhost:3000', 'https://*.vercel.app']);

  const baseOrigin = originFromUrl(resolveAuthBaseURL());
  if (baseOrigin) origins.add(baseOrigin);

  for (const key of ['BETTER_AUTH_URL', 'NEXT_PUBLIC_APP_URL'] as const) {
    const origin = originFromUrl(process.env[key]);
    if (origin) origins.add(origin);
  }

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    origins.add(`https://${vercelUrl.replace(/\/$/, '')}`);
  }

  const extra = process.env.BETTER_AUTH_TRUSTED_ORIGINS?.trim();
  if (extra) {
    for (const part of extra.split(',')) {
      const item = part.trim();
      if (item) origins.add(item);
    }
  }

  return [...origins];
}
