import { Suspense } from 'react';
import { JobsHome } from '@/components/jobs-home';

export const dynamic = 'force-dynamic';
import { JobsListLoading } from '@/components/jobs-list-skeleton';
import { PageContent, PageShell } from '@/components/page-shell';
import { loadHomeInitialData } from '@/lib/home-initial-data';

async function JobsHomeWithData() {
  const initialData = await loadHomeInitialData();
  return <JobsHome initialData={initialData} />;
}

function HomeLoadingFallback() {
  return (
    <PageShell appLayout>
      <PageContent wide fillViewport>
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden border border-border bg-background">
          <JobsListLoading count={8} />
        </div>
      </PageContent>
    </PageShell>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoadingFallback />}>
      <JobsHomeWithData />
    </Suspense>
  );
}
