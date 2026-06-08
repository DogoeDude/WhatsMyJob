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

let hasJobsCache: { at: number; value: boolean } | null = null;
const HAS_JOBS_TTL_MS = 30_000;

export async function hasAnyJobListings(): Promise<boolean> {
  if (hasJobsCache && Date.now() - hasJobsCache.at < HAS_JOBS_TTL_MS) {
    return hasJobsCache.value;
  }
  const row = await prisma.jobListing.findFirst({ select: { id: true } });
  const value = row !== null;
  hasJobsCache = { at: Date.now(), value };
  return value;
}

export function invalidateHasJobsCache() {
  hasJobsCache = null;
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

export async function searchJobListings(
  filters: JobListFilters,
  limit = 150,
  offset = 0
) {
  const rows = await prisma.jobListing.findMany({
    where: buildWhere(filters),
    select: listListingSelect,
    orderBy: [{ postedAt: 'desc' }, { syncedAt: 'desc' }],
    skip: offset,
    take: limit,
  });

  return { jobs: rows.map((row) => rowToListJob(row)), skip: offset };
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
  const [totalJobs, distinctCounts, sources] = await Promise.all([
    prisma.jobListing.count(),
    prisma.$queryRaw<[{ location_count: bigint; company_count: bigint }]>`
      SELECT
        COUNT(DISTINCT location)::bigint AS location_count,
        COUNT(DISTINCT company)::bigint AS company_count
      FROM job_listing
    `,
    prisma.jobSource.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { listings: true } },
        logs: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
    }),
  ]);

  const row = distinctCounts[0];
  return {
    totalJobs,
    locationCount: Number(row?.location_count ?? 0),
    companyCount: Number(row?.company_count ?? 0),
    sources,
  };
}
