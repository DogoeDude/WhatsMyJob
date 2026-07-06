import { prisma, isDatabaseConfigured } from '@/lib/prisma';
import type { JobListFilters } from '@/lib/jobs/filters';
import { ALL_CATEGORY_ID, getCategoryById } from '@/lib/jobs/categories';
import { dedupeStrings } from '@/lib/jobs/utils';
import { jobListingToJob } from '@/lib/jobs/serialize';
import { listDescriptionSnippet, LIST_DESCRIPTION_SNIPPET_CHARS } from '@/lib/jobs/guest-description-preview';
import { parseCompositeJobId } from '@/lib/jobs/description';
import type { Prisma } from '@prisma/client';
import { Prisma as PrismaRuntime } from '@prisma/client';

/** List view — omits full description text (fetched as a short snippet separately). */
const listListingSelect = {
  id: true,
  externalId: true,
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

const SNIPPET_SQL_CHARS = LIST_DESCRIPTION_SNIPPET_CHARS + 48;

async function fetchDescriptionSnippets(ids: string[]): Promise<Map<string, string>> {
  if (ids.length === 0) return new Map();

  const rows = await prisma.$queryRaw<Array<{ id: string; snippet: string | null }>>`
    SELECT id, LEFT(description, ${SNIPPET_SQL_CHARS}) AS snippet
    FROM job_listing
    WHERE id IN (${PrismaRuntime.join(ids)})
  `;

  const map = new Map<string, string>();
  for (const row of rows) {
    map.set(row.id, listDescriptionSnippet(row.snippet ?? ''));
  }
  return map;
}

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
  if (!isDatabaseConfigured()) return false;

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
  row: Prisma.JobListingGetPayload<{ select: typeof listListingSelect }>,
  description: string
) {
  return jobListingToJob({
    ...row,
    description,
    requirements: [],
    benefits: [],
  });
}

export async function searchJobListings(
  filters: JobListFilters,
  limit = 150,
  offset = 0
) {
  if (!isDatabaseConfigured()) {
    return { jobs: [], skip: offset };
  }

  const rows = await prisma.jobListing.findMany({
    where: buildWhere(filters),
    select: listListingSelect,
    orderBy: [
      { postedAt: { sort: 'desc', nulls: 'last' } },
      { syncedAt: 'desc' },
      { createdAt: 'desc' },
    ],
    skip: offset,
    take: limit,
  });

  const snippets = await fetchDescriptionSnippets(rows.map((row) => row.id));

  return {
    jobs: rows.map((row) => rowToListJob(row, snippets.get(row.id) ?? '')),
    skip: offset,
  };
}

export async function getJobListingById(id: string) {
  if (!isDatabaseConfigured()) return null;

  const row = await prisma.jobListing.findUnique({
    where: { id },
    include: { source: { select: { id: true, name: true } } },
  });
  if (!row) return null;
  return jobListingToJob(row);
}

/** Resolve DB jobs by UUID or live-style composite id (`source-externalId`). */
export async function getJobListingByIdOrComposite(id: string) {
  const direct = await getJobListingById(id);
  if (direct) return direct;

  const parsed = parseCompositeJobId(id);
  if (!parsed || !isDatabaseConfigured()) return null;

  const row = await prisma.jobListing.findFirst({
    where: { sourceId: parsed.sourceId, externalId: parsed.externalId },
    include: { source: { select: { id: true, name: true } } },
  });
  if (!row) return null;
  return jobListingToJob(row);
}

export async function getSourceFacetsFromDb(filters: JobListFilters) {
  if (!isDatabaseConfigured()) return [];

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
  if (!isDatabaseConfigured()) return 0;
  return prisma.jobListing.count({ where: buildWhere(filters) });
}

export async function getDistinctJobTypes(filters: JobListFilters) {
  if (!isDatabaseConfigured()) return [];

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
  if (!isDatabaseConfigured()) return [];

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
  if (!isDatabaseConfigured()) {
    return {
      totalJobs: 0,
      locationCount: 0,
      companyCount: 0,
      sources: [],
    };
  }

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
