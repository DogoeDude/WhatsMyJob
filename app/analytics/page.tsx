import { requireAuth } from '@/lib/auth-guards';
import { ApplicationsDashboard } from '@/components/applications-dashboard';
import { PageContent, PageShell } from '@/components/page-shell';
import { Button } from '@/components/ui/button';
import {
  getApplicationStats,
  listUserApplications,
} from '@/lib/applications/query';

export default async function AnalyticsPage() {
  const session = await requireAuth('/analytics');
  const userId = session.user.id;

  try {
    const [applications, stats] = await Promise.all([
      listUserApplications(userId),
      getApplicationStats(userId),
    ]);

    return <ApplicationsDashboard applications={applications} stats={stats} />;
  } catch (err) {
    console.error('[AnalyticsPage]', err);
    return (
      <PageShell>
        <PageContent className="max-w-lg">
          <h1 className="text-xl font-semibold text-foreground">My applications</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Application tracking needs a database update. From the project folder, run:
          </p>
          <pre className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-xs">
            npm run db:push
          </pre>
          <Button className="mt-4" asChild>
            <a href="/">Back to jobs</a>
          </Button>
        </PageContent>
      </PageShell>
    );
  }
}
