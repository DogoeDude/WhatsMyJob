import { prisma } from '@/lib/prisma';
import type { JobListFilters } from '@/lib/jobs/filters';
import { ALL_CATEGORY_ID, getCategoryById } from '@/lib/jobs/categories';
import { dedupeStrings } from '@/lib/jobs/utils';
import { jobListingToJob } from '@/lib/jobs/serialize';
import type { Prisma } from '@prisma/client';

/** List view — includes logoUrl; skips heavy description text. */
const listListingSelect = {
  id: true,
  title: true,
  company: true,
  location: true,
  salary: true,
  type: true,
  tags: true,
  applyUrl: true,
  logoUrl: true,
  postedAt: true,
  source: { select: { id: true, name: true } },
} satisfies Prisma.JobListingSelect;

function categoryWhere(categoryId: string): Prisma.JobListingWhereInput | null {
  if (!categoryId || categoryId === ALL_CATEGORY_ID || categoryId === 'other') {
    return null;
  }
  const cat = getCategoryById(categoryId);
  if (!cat?.keywords.length) return null;

  return {
    OR: cat.keywords.flatMap((kw) => [
      { title: { contains: kw, mode: 'insensitive' as const } },
      { description: { contains: kw, mode: 'insensitive' as const } },
    ]),
  };
}

function buildWhere(filters: JobListFilters): Prisma.JobListingWhereInput {
  const q = filters.search.trim();
  const and: Prisma.JobListingWhereInput[] = [];

  if (q) {
    and.push({
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { company: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
      ],
    });
  }

  const catFilter = categoryWhere(filters.category);
  if (catFilter) and.push(catFilter);

  if (filters.sourceIds.length > 0) {
    and.push({ sourceId: { in: filters.sourceIds } });
  }

  if (filters.type) {
    and.push({ type: { contains: filters.type, mode: 'insensitive' } });
  }

  if (filters.location) {
    and.push({ location: { contains: filters.location, mode: 'insensitive' } });
  }

  return and.length > 0 ? { AND: and } : {};
}

function buildFacetWhere(filters: JobListFilters): Prisma.JobListingWhereInput {
  return buildWhere({ ...filters, sourceIds: [] });
}

export async function hasAnyJobListings(): Promise<boolean> {
  const row = await prisma.jobListing.findFirst({ select: { id: true } });
  return row !== null;
}

function rowToListJob(
  row: Prisma.JobListingGetPayload<{ select: typeof listListingSelect }>
) {
  return jobListingToJob({
    ...row,
    description: '',
    requirements: [],
    benefits: [],
  });
}

/** When browsing all boards, interleave sources so one API does not dominate the page. */
function shouldMixSources(filters: JobListFilters): boolean {
  return filters.sourceIds.length === 0 && !filters.search.trim();
}

async function searchJobListingsMixed(
  filters: JobListFilters,
  limit: number,
  offset: number
) {
  const baseWhere = buildWhere({ ...filters, sourceIds: [] });
  const sourceRows = await prisma.jobListing.groupBy({
    by: ['sourceId'],
    where: baseWhere,
    _count: { _all: true },
  });

  if (sourceRows.length === 0) return [];

  const perSource = Math.max(6, Math.ceil((limit + offset) / sourceRows.length) + 3);

  const batches = await Promise.all(
    sourceRows.map(({ sourceId }) =>
      prisma.jobListing.findMany({
        where: buildWhere({ ...filters, sourceIds: [sourceId] }),
        select: listListingSelect,
        orderBy: [{ postedAt: 'desc' }, { syncedAt: 'desc' }],
        take: perSource,
      })
    )
  );

  const interleaved: ReturnType<typeof rowToListJob>[] = [];
  let index = 0;
  let remaining = batches.reduce((n, b) => n + b.length, 0);

  while (remaining > 0) {
    let pushed = false;
    for (const batch of batches) {
      if (index < batch.length) {
        interleaved.push(rowToListJob(batch[index]));
        remaining--;
        pushed = true;
      }
    }
    if (!pushed) break;
    index++;
  }

  return interleaved.slice(offset, offset + limit);
}

export async function searchJobListings(filters: JobListFilters, limit = 150, offset = 0) {
  if (shouldMixSources(filters)) {
    return searchJobListingsMixed(filters, limit, offset);
  }

  const rows = await prisma.jobListing.findMany({
    where: buildWhere(filters),
    select: listListingSelect,
    orderBy: [{ postedAt: 'desc' }, { syncedAt: 'desc' }],
    skip: offset,
    take: limit,
  });

  return rows.map((row) => rowToListJob(row));
}

export async function getJobListingById(id: string) {
  const row = await prisma.jobListing.findUnique({
    where: { id },
    include: { source: { select: { id: true, name: true } } },
  });
  if (!row) return null;
  return jobListingToJob(row);
}

export async function getSourceFacetsFromDb(filters: JobListFilters) {
  const where = buildFacetWhere(filters);
  const groups = await prisma.jobListing.groupBy({
    by: ['sourceId'],
    where,
    _count: { _all: true },
  });
  return groups.map((g) => ({
    sourceId: g.sourceId,
    count: g._count._all,
  }));
}

export async function countJobListings(filters: JobListFilters) {
  return prisma.jobListing.count({ where: buildWhere(filters) });
}

export async function getDistinctJobTypes(filters: JobListFilters) {
  const where = buildFacetWhere(filters);
  const rows = await prisma.jobListing.findMany({
    where,
    select: { type: true },
    distinct: ['type'],
    take: 30,
  });
  return dedupeStrings(
    rows.map((r) => r.type).filter((t): t is string => typeof t === 'string'),
    true
  ).sort((a, b) => a.localeCompare(b));
}

export async function getTopLocationsFromDb(filters: JobListFilters, limit = 8) {
  const where = buildFacetWhere({ ...filters, location: '' });
  const groups = await prisma.jobListing.groupBy({
    by: ['location'],
    where,
    _count: { _all: true },
    orderBy: { _count: { location: 'desc' } },
    take: limit,
  });
  return groups.map((g) => g.location).filter(Boolean);
}

export async function getJobStats() {
  const [totalJobs, locations, companies, sources] = await Promise.all([
    prisma.jobListing.count(),
    prisma.jobListing.findMany({
      select: { location: true },
      distinct: ['location'],
    }),
    prisma.jobListing.findMany({
      select: { company: true },
      distinct: ['company'],
    }),
    prisma.jobSource.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { listings: true } },
        logs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
  ]);

  return {
    totalJobs,
    locationCount: locations.length,
    companyCount: companies.length,
    sources,
  };
}
