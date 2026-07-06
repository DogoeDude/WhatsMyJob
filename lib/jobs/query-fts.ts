import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import type { JobListFilters } from '@/lib/jobs/filters';
import { ALL_CATEGORY_ID, getCategoryById } from '@/lib/jobs/categories';
import { isJobSearchIndexReady } from '@/lib/jobs/search-index';

function categoryTsQuery(categoryId: string): string | null {
  if (!categoryId || categoryId === ALL_CATEGORY_ID || categoryId === 'other') {
    return null;
  }
  const cat = getCategoryById(categoryId);
  if (!cat?.keywords.length) return null;

  const parts = cat.keywords
    .map((kw) =>
      kw
        .trim()
        .toLowerCase()
        .replace(/[^\w\s-]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length > 1)
        .join(' & ')
    )
    .filter(Boolean);

  return parts.length > 0 ? parts.join(' | ') : null;
}

function buildFtsConditions(filters: JobListFilters): Prisma.Sql[] {
  const conditions: Prisma.Sql[] = [];
  const q = filters.search.trim();

  if (q) {
    conditions.push(
      Prisma.sql`j.search_vector @@ websearch_to_tsquery('english', ${q})`
    );
  }

  const categoryQuery = categoryTsQuery(filters.category);
  if (categoryQuery) {
    conditions.push(
      Prisma.sql`j.search_vector @@ to_tsquery('english', ${categoryQuery})`
    );
  }

  if (filters.sourceIds.length > 0) {
    conditions.push(Prisma.sql`j."sourceId" IN (${Prisma.join(filters.sourceIds)})`);
  }

  if (filters.type) {
    conditions.push(Prisma.sql`j.type ILIKE ${'%' + filters.type + '%'}`);
  }

  if (filters.location) {
    conditions.push(Prisma.sql`j.location ILIKE ${'%' + filters.location + '%'}`);
  }

  return conditions;
}

function ftsWhereClause(filters: JobListFilters): Prisma.Sql {
  const conditions = buildFtsConditions(filters);
  if (conditions.length === 0) return Prisma.sql`TRUE`;
  return Prisma.join(conditions, ' AND ');
}

export async function shouldUseFtsSearch(filters: JobListFilters): Promise<boolean> {
  const q = filters.search.trim();
  const categoryQuery = categoryTsQuery(filters.category);
  if (!q && !categoryQuery) return false;
  return isJobSearchIndexReady();
}

type FtsListRow = {
  id: string;
  externalId: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string;
  tags: unknown;
  applyUrl: string | null;
  logoUrl: string | null;
  postedAt: Date | null;
  sourceId: string;
  sourceName: string;
};

export async function searchJobListingsFts(
  filters: JobListFilters,
  limit: number,
  offset: number
): Promise<FtsListRow[]> {
  const q = filters.search.trim();
  const where = ftsWhereClause(filters);
  const rankSql = q
    ? Prisma.sql`, ts_rank(j.search_vector, websearch_to_tsquery('english', ${q})) AS rank`
  : Prisma.empty;
  const orderRank = q ? Prisma.sql`rank DESC,` : Prisma.empty;

  return prisma.$queryRaw<FtsListRow[]>`
    SELECT
      j.id,
      j."externalId",
      j.title,
      j.company,
      j.location,
      j.salary,
      j.type,
      j.tags,
      j."applyUrl",
      j."logoUrl",
      j."postedAt"
      ${rankSql},
      s.id AS "sourceId",
      s.name AS "sourceName"
    FROM job_listing j
    INNER JOIN job_source s ON s.id = j."sourceId"
    WHERE ${where}
    ORDER BY ${orderRank} j."postedAt" DESC NULLS LAST, j."syncedAt" DESC, j."createdAt" DESC
    LIMIT ${limit}
    OFFSET ${offset}
  `;
}

export async function countJobListingsFts(filters: JobListFilters): Promise<number> {
  const where = ftsWhereClause(filters);
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM job_listing j
    WHERE ${where}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function getSourceFacetsFromDbFts(
  filters: JobListFilters
): Promise<{ sourceId: string; count: number }[]> {
  const facetFilters = { ...filters, sourceIds: [] };
  const where = ftsWhereClause(facetFilters);
  const rows = await prisma.$queryRaw<Array<{ sourceId: string; count: bigint }>>`
    SELECT j."sourceId", COUNT(*)::bigint AS count
    FROM job_listing j
    WHERE ${where}
    GROUP BY j."sourceId"
  `;
  return rows.map((row) => ({ sourceId: row.sourceId, count: Number(row.count) }));
}

export async function getDistinctJobTypesFts(filters: JobListFilters): Promise<string[]> {
  const facetFilters = { ...filters, sourceIds: [] };
  const where = ftsWhereClause(facetFilters);
  const rows = await prisma.$queryRaw<Array<{ type: string }>>`
    SELECT DISTINCT j.type
    FROM job_listing j
    WHERE ${where}
    ORDER BY j.type ASC
    LIMIT 30
  `;
  return rows.map((row) => row.type).filter(Boolean);
}

export async function getTopLocationsFromDbFts(
  filters: JobListFilters,
  limit = 8
): Promise<string[]> {
  const facetFilters = { ...filters, location: '', sourceIds: [] };
  const where = ftsWhereClause(facetFilters);
  const rows = await prisma.$queryRaw<Array<{ location: string; count: bigint }>>`
    SELECT j.location, COUNT(*)::bigint AS count
    FROM job_listing j
    WHERE ${where}
    GROUP BY j.location
    ORDER BY count DESC
    LIMIT ${limit}
  `;
  return rows.map((row) => row.location).filter(Boolean);
}
