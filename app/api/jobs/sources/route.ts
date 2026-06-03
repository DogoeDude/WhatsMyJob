import { NextResponse } from 'next/server';
import { requireAdminApi } from '@/lib/api-auth';
import { ensureJobSources } from '@/lib/jobs/sync';
import { getJobStats } from '@/lib/jobs/query';
import { prisma } from '@/lib/prisma';
import { jobProviders } from '@/lib/jobs/providers';

export const dynamic = 'force-dynamic';

export async function GET() {
  const authResult = await requireAdminApi();
  if ('error' in authResult && authResult.error) return authResult.error;

  try {
    await ensureJobSources();

    const [sources, logs, stats] = await Promise.all([
      prisma.jobSource.findMany({ orderBy: { name: 'asc' } }),
      prisma.jobSyncLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { source: { select: { name: true } } },
      }),
      getJobStats(),
    ]);

    const configured = jobProviders.map((p) => ({
      id: p.id,
      name: p.name,
      configured: p.isConfigured(),
    }));

    return NextResponse.json({
      sources,
      logs,
      configured,
      stats: {
        totalJobs: stats.totalJobs,
        locationCount: stats.locationCount,
        companyCount: stats.companyCount,
      },
    });
  } catch (err) {
    console.error('[GET /api/jobs/sources]', err);
    return NextResponse.json({ error: 'Failed to load sources' }, { status: 500 });
  }
}
