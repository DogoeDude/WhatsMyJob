import { NextRequest, NextResponse } from 'next/server';
import { requireSessionApi } from '@/lib/api-auth';
import { getOrCreateUserProfile, updateResumeMeta } from '@/lib/profile/query';
import { deleteResumeFile, readResumeFile, saveResumeFile } from '@/lib/profile/resume-storage';

export const dynamic = 'force-dynamic';

export async function GET() {
  const auth = await requireSessionApi();
  if (auth.error) return auth.error;

  try {
    const [file, profile] = await Promise.all([
      readResumeFile(auth.session.user.id),
      getOrCreateUserProfile(auth.session.user.id),
    ]);
    if (!file || !profile.resume) {
      return NextResponse.json({ error: 'No resume on file' }, { status: 404 });
    }

    const downloadName = profile.resume.fileName;

    return new NextResponse(new Uint8Array(file.buffer), {
      headers: {
        'Content-Type': file.mime,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(downloadName)}"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('[GET /api/profile/resume]', err);
    return NextResponse.json({ error: 'Failed to load resume' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await requireSessionApi();
  if (auth.error) return auth.error;

  try {
    const form = await request.formData();
    const file = form.get('file');
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const meta = await saveResumeFile(
      auth.session.user.id,
      buffer,
      file.type,
      file.name
    );
    const profile = await updateResumeMeta(auth.session.user.id, meta);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('[POST /api/profile/resume]', err);
    const message = err instanceof Error ? err.message : 'Failed to upload resume';
    const status = message.includes('must be') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

export async function DELETE() {
  const auth = await requireSessionApi();
  if (auth.error) return auth.error;

  try {
    await deleteResumeFile(auth.session.user.id);
    const profile = await updateResumeMeta(auth.session.user.id, null);
    return NextResponse.json({ profile });
  } catch (err) {
    console.error('[DELETE /api/profile/resume]', err);
    return NextResponse.json({ error: 'Failed to remove resume' }, { status: 500 });
  }
}
