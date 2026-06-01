'use client';

import dynamic from 'next/dynamic';
import { pageContainerClass } from '@/lib/ui-classes';

function NavbarSkeleton() {
  return (
    <header className="border-b border-border bg-background">
      <div className={`${pageContainerClass} flex h-14 items-center justify-between`}>
        <div className="h-5 w-32 animate-pulse rounded bg-muted" />
        <div className="h-8 w-16 animate-pulse rounded bg-muted" />
      </div>
    </header>
  );
}

export const Navbar = dynamic(
  () => import('./navbar').then((mod) => mod.Navbar),
  {
    ssr: false,
    loading: () => <NavbarSkeleton />,
  }
);
