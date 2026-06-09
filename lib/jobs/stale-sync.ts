import { after } from 'next/server';
import { isCatalogStale } from '@/lib/jobs/catalog-freshness';
import { syncAllJobProviders } from '@/lib/jobs/sync';

let syncInFlight = false;

/** Kick off a background catalog sync when listings are older than the stale threshold. */
export function scheduleCatalogSyncIfStale(): void {
  after(async () => {
    if (syncInFlight) return;
    try {
      if (!(await isCatalogStale())) return;
      syncInFlight = true;
      await syncAllJobProviders();
    } catch (err) {
      console.error('[scheduleCatalogSyncIfStale]', err);
    } finally {
      syncInFlight = false;
    }
  });
}
