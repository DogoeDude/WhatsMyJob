import { NextRequest, NextResponse } from 'next/server';
import { syncJobsCatalog } from '@/lib/jobs/catalog-sync';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

/** Scheduled catalog sync (Vercel Cron or external scheduler). */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'CRON_SECRET is not configured' }, { status: 503 });
  }

  const auth = request.headers.get('authorization');
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await syncJobsCatalog({ force: true });
    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error('[GET /api/cron/sync-jobs]', err);
    const message = err instanceof Error ? err.message : 'Cron sync failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
