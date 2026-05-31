'use client';

import dynamic from 'next/dynamic';

import { pageContainerClass } from '@/lib/ui-classes';

function NavbarSkeleton() {
  return (
    <header className="nav-glass sticky top-0 z-50">
      <div className={`${pageContainerClass} flex h-[4.25rem] items-center gap-4`}>
        <div className="h-10 w-10 shrink-0 animate-pulse rounded-xl bg-muted" />
        <div className="hidden h-4 w-28 animate-pulse rounded bg-muted sm:block" />
        <div className="ml-auto h-9 w-24 animate-pulse rounded-full bg-muted" />
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
