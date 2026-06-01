import { NextRequest, NextResponse } from 'next/server';
import { getJobListingById } from '@/lib/jobs/query';

export const dynamic = 'force-dynamic';

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const job = await getJobListingById(id);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }
    return NextResponse.json(
      { job },
      { headers: { 'Cache-Control': 'private, max-age=300' } }
    );
  } catch (err) {
    console.error('[GET /api/jobs/[id]]', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load job', detail }, { status: 500 });
  }
}
