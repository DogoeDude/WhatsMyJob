import { redirect } from 'next/navigation';
import { getAuthenticatedHomePath } from '@/lib/auth-redirect';
import { getCachedSession } from '@/lib/auth-session';

export async function requireAuth(callbackPath: string) {
  const session = await getCachedSession();

  if (!session) {
    redirect(`/login?callbackUrl=${encodeURIComponent(callbackPath)}`);
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth('/admin');
  const role = (session.user as { role?: string }).role ?? 'user';

  if (role !== 'admin') {
    redirect('/');
  }

  return session;
}

export async function getOptionalSession() {
  return getCachedSession();
}

export async function redirectIfAuthenticated() {
  const session = await getOptionalSession();
  if (session) {
    const role = (session.user as { role?: string }).role ?? 'user';
    redirect(getAuthenticatedHomePath(role));
  }
}
