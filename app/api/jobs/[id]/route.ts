import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';
import { isShortJobDescription, parseCompositeJobId } from '@/lib/jobs/description';
import { fetchJobDescription } from '@/lib/jobs/fetch-job-description';
import { guestDescriptionPreview } from '@/lib/jobs/guest-description-preview';
import { getJobListingByIdOrComposite } from '@/lib/jobs/query';
import { isDatabaseConfigured, prisma } from '@/lib/prisma';
import type { Job } from '@/lib/jobs/types';

export const dynamic = 'force-dynamic';

async function enrichDescription(job: Job): Promise<Job> {
  if (!isShortJobDescription(job.description)) return job;

  let sourceId = job.sourceId;
  let externalId = job.externalId;

  if ((!sourceId || !externalId) && isDatabaseConfigured()) {
    const row = await prisma.jobListing.findUnique({
      where: { id: job.id },
      select: { sourceId: true, externalId: true },
    });
    sourceId = row?.sourceId ?? sourceId;
    externalId = row?.externalId ?? externalId;
  }

  if (!sourceId || !externalId) {
    const parsed = parseCompositeJobId(job.id);
    sourceId = parsed?.sourceId ?? sourceId;
    externalId = parsed?.externalId ?? externalId;
  }

  if (!sourceId || !externalId) return job;

  const full = await fetchJobDescription(sourceId, externalId);
  if (!full || full.length <= job.description.trim().length) return job;
  return { ...job, description: full };
}

function applyGuestPreview(job: Job): Job {
  return {
    ...job,
    description: guestDescriptionPreview(job.description),
    requirements: [],
    benefits: [],
  };
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const session = await auth.api.getSession({ headers: await headers() });
    const isGuest = !session;
    let job = await getJobListingByIdOrComposite(id);

    if (job) {
      job = await enrichDescription(job);
      if (isGuest) job = applyGuestPreview(job);
      return NextResponse.json(
        { job, preview: isGuest },
        { headers: { 'Cache-Control': 'private, max-age=300' } }
      );
    }

    const parsed = parseCompositeJobId(id);
    if (parsed) {
      const description = await fetchJobDescription(parsed.sourceId, parsed.externalId);
      if (description) {
        const desc = isGuest ? guestDescriptionPreview(description) : description;
        return NextResponse.json(
          {
            job: { id, description: desc, sourceId: parsed.sourceId, externalId: parsed.externalId },
            preview: isGuest,
          },
          { headers: { 'Cache-Control': 'private, max-age=300' } }
        );
      }
    }

    return NextResponse.json({ error: 'Job not found' }, { status: 404 });
  } catch (err) {
    console.error('[GET /api/jobs/[id]]', err);
    const detail = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: 'Failed to load job', detail }, { status: 500 });
  }
}
