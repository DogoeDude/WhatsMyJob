import { LoadingSpinner } from '@/components/loading-indicator';

export default function RootLoading() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center bg-background">
      <LoadingSpinner label="Loading page…" size="lg" />
    </div>
  );
}
