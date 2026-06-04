import { NextRequest, NextResponse } from 'next/server';
import { parseJobFilters } from '@/lib/jobs/filters';
import { getJobsFilterMeta } from '@/lib/jobs/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const filters = parseJobFilters(request.nextUrl.searchParams);
    const meta = await getJobsFilterMeta(filters);

    return NextResponse.json(meta, {
      headers: {
        'Cache-Control': 'private, max-age=60, stale-while-revalidate=120',
      },
    });
  } catch (err) {
    console.error('[GET /api/jobs/meta]', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to load filter metadata', detail },
      { status: 500 }
    );
  }
}
