'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Menu,
  X,
  Briefcase,
  BarChart3,
  Shield,
  LogOut,
  ChevronRight,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { pageContainerClass } from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { authClient } from '@/lib/auth-client';
import { Button } from '@/components/ui/button';

const allNavLinks = [
  { href: '/', label: 'Jobs', icon: Briefcase, requiresAuth: false, requiresAdmin: false },
  { href: '/analytics', label: 'Analytics', icon: BarChart3, requiresAuth: true, requiresAdmin: false },
  { href: '/admin', label: 'Admin', icon: Shield, requiresAuth: true, requiresAdmin: true },
] as const;

function UserAvatar({ name, email }: { name?: string | null; email?: string | null }) {
  const initial = (name?.trim() || email?.trim() || '?').charAt(0).toUpperCase();
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 text-sm font-bold text-primary-foreground shadow-sm">
      {initial}
    </span>
  );
}

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
    <header className="nav-glass sticky top-0 z-50">
      <div className={pageContainerClass}>
        <div className="flex h-[4.25rem] items-center gap-3 md:gap-4">
          {/* Brand */}
          <Link
            href="/"
            className="group flex min-w-0 shrink-0 items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-card ring-1 ring-border/60 shadow-sm transition-all group-hover:ring-accent/30 group-hover:shadow-md">
              <img src="/job.svg" alt="" width={22} height={22} className="h-[22px] w-[22px]" />
            </div>
            <div className="hidden min-w-0 sm:block">
              <span className="block text-base font-bold leading-none tracking-tight text-foreground">
                WhatsMyJob
              </span>
              <span className="mt-1 block text-xs text-muted-foreground">
                Find your next role
              </span>
            </div>
          </Link>

          {/* Desktop nav — centered pill */}
          <nav
            className="hidden flex-1 justify-center md:flex"
            aria-label="Main"
          >
            <div className="flex items-center gap-0.5 rounded-full border border-border/60 bg-muted/40 p-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-all lg:px-4',
                      active
                        ? 'bg-card text-primary shadow-sm ring-1 ring-primary/20'
                        : 'text-muted-foreground hover:bg-card/60 hover:text-foreground'
                    )}
                  >
                    <Icon className={cn('h-4 w-4 shrink-0', active && 'text-primary')} />
                    {link.label}
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* Desktop auth */}
          <div className="ml-auto flex shrink-0 items-center justify-end gap-2">
            <div className="hidden md:flex md:items-center md:gap-3">
              {isPending ? (
                <div className="h-9 w-24 animate-pulse rounded-full bg-muted" />
              ) : session ? (
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-card/80 py-1 pl-1 pr-2 shadow-sm">
                  <UserAvatar name={session.user.name} email={session.user.email} />
                  <div className="hidden min-w-0 max-w-[120px] lg:block">
                    <p className="truncate text-sm font-medium leading-tight text-foreground">
                      {session.user.name || 'Member'}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {isAdmin ? 'Administrator' : 'Member'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={handleSignOut}
                    className="ml-0.5 rounded-full"
                    aria-label="Sign out"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button asChild size="sm" className="rounded-full px-5">
                  <Link href="/login">
                    Sign in
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </Button>
              )}
            </div>

            <Button
              type="button"
              variant="outline"
              size="icon"
              className="rounded-full md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div
        className={cn(
          'overflow-hidden border-t border-border/50 bg-card/95 backdrop-blur-xl transition-all duration-300 md:hidden',
          mobileMenuOpen ? 'max-h-[85vh] opacity-100' : 'max-h-0 opacity-0 border-t-transparent'
        )}
      >
        <div className={`${pageContainerClass} space-y-4 py-4`}>
          {session && (
            <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/30 p-3">
              <UserAvatar name={session.user.name} email={session.user.email} />
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium text-foreground">
                  {session.user.name || 'Member'}
                </p>
                <p className="truncate text-sm text-muted-foreground">{session.user.email}</p>
              </div>
              <span
                className={cn(
                  'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold',
                  isAdmin ? 'bg-foreground/10 text-foreground' : 'bg-primary/10 text-primary'
                )}
              >
                {isAdmin ? 'Admin' : 'Member'}
              </span>
            </div>
          )}

          <nav className="space-y-1" aria-label="Mobile">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const active = isActive(link.href);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-colors',
                    active
                      ? 'bg-primary/10 text-primary'
                      : 'text-foreground hover:bg-muted/50'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                  {active && <ChevronRight className="ml-auto h-4 w-4" />}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-border/50 pt-3">
            {session ? (
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={handleSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </Button>
            ) : (
              <Button asChild size="lg" className="w-full">
                <Link href="/login" onClick={() => setMobileMenuOpen(false)}>
                  Sign in
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
