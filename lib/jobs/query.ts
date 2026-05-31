import { prisma } from '@/lib/prisma';
import type { JobListFilters } from '@/lib/jobs/filters';
import { ALL_CATEGORY_ID, getCategoryById } from '@/lib/jobs/categories';
import { dedupeStrings } from '@/lib/jobs/utils';
import { jobListingToJob } from '@/lib/jobs/serialize';
import type { Prisma } from '@prisma/client';

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

/** Where clause for facets (search/type/location, no source filter). */
function buildFacetWhere(filters: JobListFilters): Prisma.JobListingWhereInput {
  return buildWhere({ ...filters, sourceIds: [] });
}

export async function searchJobListings(filters: JobListFilters, limit = 150, offset = 0) {
  const rows = await prisma.jobListing.findMany({
    where: buildWhere(filters),
    include: { source: { select: { id: true, name: true } } },
    orderBy: [{ postedAt: 'desc' }, { syncedAt: 'desc' }],
    skip: offset,
    take: limit,
  });

  return rows.map(jobListingToJob);
}

/** Count jobs per source for filter chips (respects search/type/location, not source). */
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

/** Top locations for filter suggestions (respects search/type, not source/location filter). */
export async function getTopLocationsFromDb(filters: JobListFilters, limit = 8) {
  const where = buildFacetWhere({ ...filters, location: '' });
  const groups = await prisma.jobListing.groupBy({
    by: ['location'],
    where,
    _count: { _all: true },
  });
  return groups
    .sort((a, b) => b._count._all - a._count._all)
    .slice(0, limit)
    .map((g) => g.location)
    .filter(Boolean);
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
