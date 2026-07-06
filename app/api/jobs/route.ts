import { NextRequest, NextResponse } from 'next/server';
import { parseJobFilters } from '@/lib/jobs/filters';
import { resolveJobListLimit } from '@/lib/jobs/limits';
import { getJobsForApp } from '@/lib/jobs/service';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const filters = parseJobFilters(searchParams);
    const requested = Number(searchParams.get('limit'));
    const offset = Math.max(0, Number(searchParams.get('offset') ?? 0) || 0);
    const refresh = searchParams.get('refresh') === '1';
    const limit = resolveJobListLimit(
      filters.search,
      offset,
      Number.isNaN(requested) ? undefined : requested
    );

    const includeMeta = searchParams.get('meta') !== '0';
    const result = await getJobsForApp(filters, limit, offset, { refresh, includeMeta });

    return NextResponse.json(
      {
        jobs: result.jobs,
        stats: result.stats,
        totalMatching: result.totalMatching,
        hasMore: result.hasMore,
        offset: result.offset,
        sources: result.sources,
        types: result.types,
        locationSuggestions: result.locationSuggestions,
        filters: result.filters,
        mode: result.mode,
        message: result.message,
        providerErrors:
          'providerErrors' in result ? result.providerErrors : undefined,
      },
      {
        headers: {
          'Cache-Control': refresh
            ? 'no-store, max-age=0'
            : 'private, max-age=30, stale-while-revalidate=60',
        },
      }
    );
  } catch (err) {
    console.error('[GET /api/jobs]', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json(
      { error: 'Failed to load jobs', detail },
      { status: 500 }
    );
  }
}
