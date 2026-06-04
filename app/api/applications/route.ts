import { NextRequest, NextResponse } from 'next/server';
import { requireSessionApi } from '@/lib/api-auth';
import { createApplication, listUserApplications } from '@/lib/applications/query';

export async function GET() {
  const auth = await requireSessionApi();
  if (auth.error) return auth.error;

  try {
    const applications = await listUserApplications(auth.session.user.id);
    return NextResponse.json({ applications });
  } catch (err) {
    console.error('[GET /api/applications]', err);
    return NextResponse.json({ error: 'Failed to load applications' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSessionApi();
  if (auth.error) return auth.error;

  try {
    const body = (await request.json()) as {
      jobListingId?: string;
      title?: string;
      company?: string;
      location?: string;
      applyUrl?: string;
      source?: string;
    };

    if (!body.title?.trim() || !body.company?.trim()) {
      return NextResponse.json(
        { error: 'title and company are required' },
        { status: 400 }
      );
    }

    const application = await createApplication(auth.session.user.id, {
      jobListingId: body.jobListingId,
      title: body.title,
      company: body.company,
      location: body.location,
      applyUrl: body.applyUrl,
      source: body.source,
    });

    return NextResponse.json({ application }, { status: 201 });
  } catch (err) {
    console.error('[POST /api/applications]', err);
    return NextResponse.json({ error: 'Failed to save application' }, { status: 500 });
  }
}
