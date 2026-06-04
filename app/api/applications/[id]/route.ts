import { NextRequest, NextResponse } from 'next/server';
import { requireSessionApi } from '@/lib/api-auth';
import { updateApplication } from '@/lib/applications/query';
import { isApplicationStatus } from '@/lib/applications/statuses';

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: NextRequest, context: RouteContext) {
  const auth = await requireSessionApi();
  if (auth.error) return auth.error;

  const { id } = await context.params;

  try {
    const body = (await request.json()) as {
      status?: string;
      hasReply?: boolean;
      notes?: string | null;
    };

    if (body.status !== undefined && !isApplicationStatus(body.status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const application = await updateApplication(auth.session.user.id, id, {
      status: body.status,
      hasReply: body.hasReply,
      notes: body.notes,
    });

    if (!application) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (err) {
    console.error('[PATCH /api/applications/[id]]', err);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
