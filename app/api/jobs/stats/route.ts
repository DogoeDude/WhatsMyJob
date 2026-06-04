import { NextResponse } from 'next/server';
import { getAppJobStats } from '@/lib/jobs/service';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const stats = await getAppJobStats();
    return NextResponse.json(stats);
  } catch (err) {
    console.error('[GET /api/jobs/stats]', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to load job stats', detail },
      { status: 500 }
    );
  }
}
