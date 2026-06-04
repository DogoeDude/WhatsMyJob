import { headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getAuthenticatedHomePath } from '@/lib/auth-redirect';

export async function requireAuth(callbackPath: string) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

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
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function redirectIfAuthenticated() {
  try {
    const session = await getOptionalSession();
    if (session) {
      const role = (session.user as { role?: string }).role ?? 'user';
      redirect(getAuthenticatedHomePath(role));
    }
  } catch (err) {
    console.error('[redirectIfAuthenticated]', err);
  }
}
