import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';

export async function getApiSession() {
  return auth.api.getSession({ headers: await headers() });
}

export async function requireSessionApi() {
  const session = await getApiSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { session };
}

export async function requireAdminApi() {
  const session = await getApiSession();
  if (!session) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const role = (session.user as { role?: string }).role ?? 'user';
  if (role !== 'admin') {
    return { error: NextResponse.json({ error: 'Forbidden' }, { status: 403 }) };
  }

  return { session };
}
