'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Briefcase, LogOut, Menu, User } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import {
  SITE_NAV_LINKS,
  filterNavLinks,
  isNavActive,
  type NavLinkDef,
} from '@/lib/nav-links';
import {
  mobileBottomNavSpacerClass,
  siteHeaderInnerClass,
} from '@/lib/ui-classes';
import { cn } from '@/lib/utils';
import { useAppLoading } from '@/components/app-loading-provider';
import { authClient } from '@/lib/auth-client';
import { useAppSession } from '@/lib/use-app-session';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name?.trim() || email?.split('@')[0] || '?').trim();
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

function Brand() {
  return (
    <Link
      href="/"
      prefetch
      className="group flex min-w-0 items-center gap-2.5 rounded-md py-1 pr-1 transition-opacity hover:opacity-90 sm:gap-3"
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border bg-card text-foreground shadow-sm sm:h-10 sm:w-10">
        <Briefcase className="h-5 w-5 sm:h-[1.35rem] sm:w-[1.35rem]" aria-hidden />
      </span>
      <span className="flex min-w-0 flex-col leading-tight">
        <span className="truncate text-sm font-semibold tracking-tight text-foreground sm:text-base lg:text-lg">
          WhatsMyJob
        </span>
        <span className="hidden text-[11px] font-medium text-muted-foreground min-[400px]:block sm:text-xs">
          Find your next role
        </span>
      </span>
    </Link>
  );
}

/** Jobs & Applications — centered in the header on tablet/desktop. */
function HeaderCenterNav({
  links,
  pathname,
}: {
  links: NavLinkDef[];
  pathname: string;
}) {
  if (links.length === 0) return null;

  return (
    <nav
      className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-0.5 rounded-lg win-nav-track p-0.5 sm:flex"
      aria-label="Main navigation"
    >
      {links.map((link) => {
        const Icon = link.icon;
        const active = isNavActive(pathname, link.href);
        return (
          <Link
            key={link.href}
            href={link.href}
            prefetch
            className={cn(
              'inline-flex min-h-9 items-center gap-2 rounded-md px-4 py-1.5 text-sm font-normal transition-colors',
              active
                ? 'win-nav-pill-active font-medium text-foreground'
                : 'text-muted-foreground hover:bg-[var(--win-hover)] hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 shrink-0" aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function MobileBottomNav({
  links,
  pathname,
}: {
  links: NavLinkDef[];
  pathname: string;
}) {
  const primary = links.filter((l) => l.primary !== false);
  if (primary.length === 0) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-card/95 shadow-[var(--win-shadow-lg)] backdrop-blur-xl lg:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      aria-label="Mobile navigation"
    >
      <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-3 items-stretch px-2">
        {primary.map((link) => {
          const Icon = link.icon;
          const active = isNavActive(pathname, link.href);
          return (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              className={cn(
                'flex min-h-[44px] flex-col items-center justify-center gap-1 rounded-xl px-2 transition-colors active:scale-[0.98]',
                active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-md transition-colors',
                  active && 'bg-[var(--win-selected)]'
                )}
              >
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.25]')} aria-hidden />
              </span>
              <span className={cn('text-[11px] font-semibold', active && 'text-foreground')}>
                {link.shortLabel ?? link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function UserAccountMenu({
  links,
  pathname,
  displayName,
  email,
  isAdmin,
  onSignOut,
  signingOut,
}: {
  links: NavLinkDef[];
  pathname: string;
  displayName: string;
  email: string;
  isAdmin: boolean;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const initials = getInitials(displayName, email);
  const secondaryLinks = links.filter((l) => l.primary === false || l.requiresAdmin);
  const profileActive = isNavActive(pathname, '/profile');

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex min-h-11 max-w-[min(100%,14rem)] items-center gap-2 rounded-md border border-border bg-card py-1 pl-1 pr-3 transition-colors hover:bg-[var(--win-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50 sm:max-w-[16rem] sm:gap-2.5 sm:pr-3.5',
            profileActive && 'bg-[var(--win-selected)]'
          )}
          aria-label="Account menu"
        >
          <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
            <AvatarFallback className="bg-muted text-xs font-medium text-foreground">
              {initials}
            </AvatarFallback>
          </Avatar>
          <span className="min-w-0 truncate text-sm font-semibold text-foreground">
            {displayName}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 rounded-lg p-1.5">
        <DropdownMenuLabel className="font-normal">
          <p className="truncate text-sm font-medium">{displayName}</p>
          <p className="truncate text-xs font-normal text-muted-foreground">{email}</p>
          {isAdmin && (
            <p className="mt-1 text-xs font-medium text-muted-foreground">Administrator</p>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/profile" prefetch className="cursor-pointer gap-2">
            <User className="h-4 w-4" />
            View profile
            {profileActive && (
              <span className="ml-auto text-xs text-muted-foreground">Current</span>
            )}
          </Link>
        </DropdownMenuItem>
        {secondaryLinks.length > 0 && (
          <>
            <DropdownMenuSeparator />
            {secondaryLinks.map((link) => {
              const Icon = link.icon;
              return (
                <DropdownMenuItem key={link.href} asChild>
                  <Link href={link.href} prefetch className="cursor-pointer gap-2">
                    <Icon className="h-4 w-4" />
                    {link.label}
                    {isNavActive(pathname, link.href) && (
                      <span className="ml-auto text-xs text-muted-foreground">Current</span>
                    )}
                  </Link>
                </DropdownMenuItem>
              );
            })}
          </>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          className="cursor-pointer gap-2"
          disabled={signingOut}
          onSelect={(e) => {
            e.preventDefault();
            onSignOut();
          }}
        >
          {signingOut ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              Signing out…
            </>
          ) : (
            <>
              <LogOut className="h-4 w-4" />
              Sign out
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function GuestAuthActions({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        variant="ghost"
        size="default"
        className="hidden h-9 rounded-md px-4 text-sm font-normal sm:inline-flex"
      >
        <Link href="/register" prefetch onClick={onNavigate}>
          Register
        </Link>
      </Button>
      <Button asChild size="default" className="h-9 rounded-md px-4 text-sm font-normal">
        <Link href="/login" prefetch onClick={onNavigate}>
          Sign in
        </Link>
      </Button>
    </div>
  );
}

function MobileGuestSheet({
  open,
  onOpenChange,
  links,
  pathname,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  links: NavLinkDef[];
  pathname: string;
}) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-[min(100vw-2rem,22rem)] rounded-l-2xl p-0">
        <SheetHeader className="border-b border-border px-5 py-5 text-left">
          <SheetTitle className="text-lg">Menu</SheetTitle>
        </SheetHeader>
        <nav className="flex flex-col gap-1 p-3" aria-label="Mobile menu">
          {links.map((link) => {
            const Icon = link.icon;
            const active = isNavActive(pathname, link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                onClick={() => onOpenChange(false)}
                className={cn(
                  'flex min-h-11 items-center gap-3 rounded-md border-l-[3px] border-l-transparent px-4 text-base transition-colors',
                  active
                    ? 'win-list-selected font-medium'
                    : 'text-foreground hover:bg-[var(--win-hover)]'
                )}
              >
                <Icon className="h-5 w-5 shrink-0" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto grid gap-2 border-t border-border p-4">
          <Button asChild size="lg" className="h-11 rounded-md">
            <Link href="/login" prefetch onClick={() => onOpenChange(false)}>
              Sign in
            </Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="h-12 rounded-xl">
            <Link href="/register" prefetch onClick={() => onOpenChange(false)}>
              Create account
            </Link>
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [guestSheetOpen, setGuestSheetOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const { startLoading, stopLoading } = useAppLoading();
  const { data: session, isPending, refresh: refreshSession } = useAppSession();

  const role = (session?.user as { role?: string } | undefined)?.role ?? 'user';
  const isAdmin = role === 'admin';

  const navLinks = useMemo(
    () => filterNavLinks(SITE_NAV_LINKS, { session: !!session, isAdmin }),
    [session, isAdmin]
  );

  useEffect(() => {
    setGuestSheetOpen(false);
  }, [pathname]);

  const handleSignOut = async () => {
    if (signingOut) return;
    setSigningOut(true);
    startLoading('Signing out…');
    try {
      await authClient.signOut();
      await refreshSession();
      router.push('/');
      router.refresh();
    } finally {
      setSigningOut(false);
      stopLoading();
    }
  };

  const displayName = session?.user.name || session?.user.email?.split('@')[0] || 'Account';
  const email = session?.user.email ?? '';

  const centerNavLinks = navLinks.filter(
    (l) => l.href === '/' || l.href === '/analytics'
  );

  return (
    <>
      <header className="win-mica sticky top-0 z-50 w-full border-b-0">
        <div className={cn(siteHeaderInnerClass, 'relative')}>
          <Brand />

          {session && (
            <HeaderCenterNav links={centerNavLinks} pathname={pathname} />
          )}

          <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
            {isPending ? (
              <div
                className="flex h-9 items-center gap-2 rounded-md border border-border bg-secondary px-3 text-sm text-muted-foreground"
                aria-busy="true"
              >
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                Loading…
              </div>
            ) : session ? (
              <UserAccountMenu
                links={navLinks}
                pathname={pathname}
                displayName={displayName}
                email={email}
                isAdmin={isAdmin}
                onSignOut={handleSignOut}
                signingOut={signingOut}
              />
            ) : (
              <>
                <GuestAuthActions />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-9 w-9 rounded-md sm:hidden"
                  onClick={() => setGuestSheetOpen(true)}
                  aria-label="Open menu"
                >
                  <Menu className="h-5 w-5" />
                </Button>
                <MobileGuestSheet
                  open={guestSheetOpen}
                  onOpenChange={setGuestSheetOpen}
                  links={navLinks}
                  pathname={pathname}
                />
              </>
            )}
          </div>
        </div>
      </header>

      {session && (
        <>
          <MobileBottomNav links={navLinks} pathname={pathname} />
          <div className={mobileBottomNavSpacerClass} aria-hidden />
        </>
      )}
    </>
  );
}
