import { NextRequest, NextResponse } from 'next/server';
import { requireSessionApi } from '@/lib/api-auth';
import { getOrCreateUserProfile, updateUserProfile } from '@/lib/profile/query';
import type { UpdateProfileInput } from '@/lib/profile/types';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireSessionApi();
  if (auth.error) return auth.error;

  try {
    const profile = await getOrCreateUserProfile(auth.session.user.id);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('[GET /api/profile]', err);
    return NextResponse.json({ error: 'Failed to load profile' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const auth = await requireSessionApi();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as UpdateProfileInput;
    const profile = await updateUserProfile(auth.session.user.id, body);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('[PATCH /api/profile]', err);
    const message = err instanceof Error ? err.message : 'Failed to update profile';
    const status = message === 'Name is required' ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
