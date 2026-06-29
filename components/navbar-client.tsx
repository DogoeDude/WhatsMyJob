'use client';

import dynamic from 'next/dynamic';
import { siteHeaderInnerClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';

function NavbarSkeleton() {
  return (
    <>
      <header className="win-mica sticky top-0 z-50 w-full">
        <div className={siteHeaderInnerClass}>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 animate-pulse rounded-lg bg-muted sm:h-9 sm:w-9" />
            <div className="space-y-1.5">
              <div className="h-4 w-28 animate-pulse rounded-md bg-muted" />
              <div className="hidden h-3 w-20 animate-pulse rounded-md bg-muted min-[400px]:block" />
            </div>
          </div>
          <div className="h-9 w-9 animate-pulse rounded-md bg-muted" />
        </div>
      </header>
    </>
  );
}

export const Navbar = dynamic(
  () => import('./navbar').then((mod) => mod.Navbar),
  {
    ssr: false,
    loading: () => <NavbarSkeleton />,
  }
);
