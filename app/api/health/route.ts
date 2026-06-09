import { NextResponse } from 'next/server';
import { resolveAuthBaseURL } from '@/lib/auth-base-url';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/** Quick deploy check — visit /api/health on Vercel to see what is misconfigured. */
export async function GET() {
  const checks = {
    databaseUrlSet: Boolean(process.env.DATABASE_URL?.trim()),
    authSecretSet: Boolean(process.env.BETTER_AUTH_SECRET?.trim()),
    resolvedAuthBaseUrl: resolveAuthBaseURL(),
    vercelUrl: process.env.VERCEL_URL ?? null,
    database: 'unknown' as string,
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    checks.database = 'ok';
  } catch (err) {
    checks.database = err instanceof Error ? err.message : 'connection failed';
  }

  const ok =
    checks.databaseUrlSet && checks.authSecretSet && checks.database === 'ok';

  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
