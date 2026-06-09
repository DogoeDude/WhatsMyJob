import { prisma } from '@/lib/prisma';

const DEFAULT_STALE_HOURS = 6;

export function catalogStaleThresholdMs(): number {
  const hours = Number(process.env.CATALOG_STALE_HOURS?.trim() || DEFAULT_STALE_HOURS);
  if (!Number.isFinite(hours) || hours <= 0) return DEFAULT_STALE_HOURS * 60 * 60 * 1000;
  return hours * 60 * 60 * 1000;
}

/** Latest successful sync across enabled sources. */
export async function getCatalogLastSyncAt(): Promise<Date | null> {
  const row = await prisma.jobSource.aggregate({
    where: { enabled: true, lastSyncAt: { not: null } },
    _max: { lastSyncAt: true },
  });
  return row._max.lastSyncAt;
}

export async function isCatalogStale(now = Date.now()): Promise<boolean> {
  const lastSync = await getCatalogLastSyncAt();
  if (!lastSync) return true;
  return now - lastSync.getTime() > catalogStaleThresholdMs();
}
