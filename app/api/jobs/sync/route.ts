import { NextRequest, NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { invalidateJobsCaches, syncAllJobProviders, syncJobProvider } from '@/lib/jobs/sync';
import { getActiveProviders } from '@/lib/jobs/providers';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const authResult = await requireAdminApi();
  if ('error' in authResult && authResult.error) return authResult.error;

  try {
    const body = await request.json().catch(() => ({}));
    const sourceId =
      typeof body?.sourceId === 'string' ? body.sourceId.trim() : undefined;

    if (sourceId) {
      const result = await syncJobProvider(sourceId);
      invalidateJobsCaches();
      return NextResponse.json({ ok: true, results: { [sourceId]: result } });
    }

    const active = getActiveProviders();
    if (active.length === 0) {
      return NextResponse.json(
        {
          error:
            'No job sources are configured. Remotive and Arbeitnow work without keys; add Adzuna keys to .env.local for more listings.',
        },
        { status: 400 }
      );
    }

    const results = await syncAllJobProviders();
    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error('[POST /api/jobs/sync]', err);
    const message = err instanceof Error ? err.message : 'Sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
