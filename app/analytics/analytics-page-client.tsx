'use client';

import dynamic from 'next/dynamic';

const AnalyticsView = dynamic(() => import('./analytics-view'), {
  ssr: false,
  loading: () => (
    <div className="app-mesh flex min-h-screen items-center justify-center">
      <p className="text-muted-foreground">Loading analytics…</p>
    </div>
  ),
});

export default function AnalyticsPageClient() {
  return <AnalyticsView />;
}
