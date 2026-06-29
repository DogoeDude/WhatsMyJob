import { LoadingSpinner } from '@/components/loading-indicator';
import { PageContent, PageShell } from '@/components/page-shell';
import { Skeleton } from '@/components/ui/skeleton';

type PageLoadingShellProps = {
  title?: string;
  wide?: boolean;
};

export function PageLoadingShell({ title = 'Loading…', wide = false }: PageLoadingShellProps) {
  return (
    <PageShell>
      <PageContent className={wide ? 'max-w-6xl' : 'max-w-4xl'}>
        <div className="mb-6 flex justify-center sm:justify-start">
          <LoadingSpinner label={title} size="md" />
        </div>
        <div className="mb-8 space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-md" />
          {title && (
            <p className="sr-only" role="status">
              {title}
            </p>
          )}
        </div>
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-48 w-full rounded-lg" />
          <Skeleton className="h-40 w-full rounded-lg" />
        </div>
      </PageContent>
    </PageShell>
  );
}
