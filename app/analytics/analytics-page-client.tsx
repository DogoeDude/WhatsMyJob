'use client';

import dynamic from 'next/dynamic';

const AnalyticsView = dynamic(() => import('./analytics-view'), {
  ssr: false,
  loading: () => (
    <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
      Loading…
    </div>
  ),
});

export default function AnalyticsPageClient() {
  return <AnalyticsView />;
}
