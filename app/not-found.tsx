import Link from 'next/link';
import { MeshBackground } from '@/components/mesh-background';
import { FileQuestion } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function NotFound() {
  return (
    <div className="app-mesh relative flex min-h-screen flex-col items-center justify-center overflow-hidden p-6">
      <MeshBackground />
      <div className="page-fade-in surface-elevated relative max-w-md rounded-2xl p-10 text-center">
        <span className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/15">
          <FileQuestion className="h-7 w-7" />
        </span>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Page not found</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          The page you are looking for does not exist or may have been moved.
        </p>
        <Button asChild className="mt-8">
          <Link href="/">Back to jobs</Link>
        </Button>
      </div>
    </div>
  );
}
