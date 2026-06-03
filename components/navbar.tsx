'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { pageContainerClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

const allNavLinks = [
  { href: '/', label: 'Jobs', requiresAuth: false, requiresAdmin: false },
  { href: '/analytics', label: 'Stats', requiresAuth: true, requiresAdmin: false },
  { href: '/admin', label: 'Admin', requiresAuth: true, requiresAdmin: true },
] as const;

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { data: session, isPending } = authClient.useSession();

  const role = (session?.user as { role?: string } | undefined)?.role ?? 'user';
  const isAdmin = role === 'admin';

  const navLinks = allNavLinks.filter((link) => {
    if (!link.requiresAuth) return true;
    if (!session) return false;
    if (link.requiresAdmin) return isAdmin;
    return true;
  });

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleSignOut = async () => {
    await authClient.signOut();
    setMobileMenuOpen(false);
    router.push('/');
    router.refresh();
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-background/80">
      <div className={pageContainerClass}>
        <div className="flex h-[3.25rem] items-center justify-between gap-4 sm:h-14">
          <Link
            href="/"
            className="group flex items-center gap-2.5 rounded-md py-1 pr-2 transition-colors hover:bg-muted/50"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-md border border-border bg-card shadow-sm">
              <img src="/job.svg" alt="" width={20} height={20} className="h-5 w-5" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="text-sm font-semibold text-foreground sm:text-[15px]">
                WhatsMyJob
              </span>
              <span className="mt-0.5 hidden text-[10px] font-medium text-muted-foreground sm:block">
                Remote job search
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'relative rounded-md px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-muted text-foreground'
                      : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
                    active &&
                      'after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <div className="hidden md:flex md:items-center md:gap-3">
              {isPending ? (
                <div className="h-9 w-20 animate-pulse rounded-md bg-muted" />
              ) : session ? (
                <>
                  <span className="max-w-[140px] truncate text-sm text-muted-foreground">
                    {session.user.name || session.user.email}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleSignOut}
                  >
                    <LogOut className="h-4 w-4" />
                    Sign out
                  </Button>
                </>
              ) : (
                <Button asChild size="sm" variant="default">
                  <Link href="/login">Sign in</Link>
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      <div
        className={cn(
          'border-t border-border bg-background md:hidden',
          mobileMenuOpen ? 'block' : 'hidden'
        )}
      >
        <div className={`${pageContainerClass} space-y-1 py-3`}>
          {session && (
            <p className="px-3 py-2 text-sm text-muted-foreground">
              {session.user.email}
              {isAdmin ? ' · Admin' : ''}
            </p>
          )}
          <nav className="space-y-0.5" aria-label="Mobile">
            {navLinks.map((link) => {
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'block rounded-md px-3 py-2.5 text-sm font-medium',
                    active ? 'bg-muted text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <div className="border-t border-border pt-2">
            {session ? (
              <Button variant="outline" size="sm" className="w-full" onClick={handleSignOut}>
                Sign out
              </Button>
            ) : (
              <Button asChild size="sm" className="w-full">
                <Link href="/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
