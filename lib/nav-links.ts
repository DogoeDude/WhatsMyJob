import type { LucideIcon } from 'lucide-react';
import {
  ClipboardList,
  LayoutGrid,
  Shield,
  User,
} from 'lucide-react';

export type NavLinkDef = {
  href: string;
  label: string;
  shortLabel?: string;
  icon: LucideIcon;
  requiresAuth: boolean;
  requiresAdmin: boolean;
  /** Shown in mobile bottom bar (primary routes only). */
  primary?: boolean;
};

export const SITE_NAV_LINKS: NavLinkDef[] = [
  {
    href: '/',
    label: 'Jobs',
    shortLabel: 'Jobs',
    icon: LayoutGrid,
    requiresAuth: false,
    requiresAdmin: false,
    primary: true,
  },
  {
    href: '/profile',
    label: 'Profile',
    shortLabel: 'Profile',
    icon: User,
    requiresAuth: true,
    requiresAdmin: false,
    primary: true,
  },
  {
    href: '/analytics',
    label: 'Applications',
    shortLabel: 'Apps',
    icon: ClipboardList,
    requiresAuth: true,
    requiresAdmin: false,
    primary: true,
  },
  {
    href: '/admin',
    label: 'Admin',
    shortLabel: 'Admin',
    icon: Shield,
    requiresAuth: true,
    requiresAdmin: true,
    primary: false,
  },
];

export function filterNavLinks(
  links: NavLinkDef[],
  opts: { session: boolean; isAdmin: boolean }
): NavLinkDef[] {
  return links.filter((link) => {
    if (!link.requiresAuth) return true;
    if (!opts.session) return false;
    if (link.requiresAdmin) return opts.isAdmin;
    return true;
  });
}

export function isNavActive(pathname: string, href: string): boolean {
  return href === '/' ? pathname === '/' : pathname.startsWith(href);
}
