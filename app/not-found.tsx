import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="mt-2 text-xl font-semibold text-foreground">Page not found</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        That URL does not exist.
      </p>
      <Button asChild className="mt-6" variant="outline">
        <Link href="/">Go to jobs</Link>
      </Button>
    </div>
  );
}
