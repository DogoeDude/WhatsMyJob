import { prisma, isDatabaseConfigured } from '@/lib/prisma';

let indexReady: boolean | null = null;
let ensurePromise: Promise<boolean> | null = null;

/** Idempotent — adds tsvector column, trigger, GIN index, and pg_trgm indexes. */
export async function ensureJobSearchIndex(): Promise<boolean> {
  if (!isDatabaseConfigured()) return false;
  if (indexReady === true) return true;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    try {
      await prisma.$executeRawUnsafe(`
        CREATE EXTENSION IF NOT EXISTS pg_trgm;

        ALTER TABLE job_listing ADD COLUMN IF NOT EXISTS search_vector tsvector;

        CREATE OR REPLACE FUNCTION job_listing_search_vector_update() RETURNS trigger AS $$
        BEGIN
          NEW.search_vector :=
            setweight(to_tsvector('english', coalesce(NEW.title, '')), 'A') ||
            setweight(to_tsvector('english', coalesce(NEW.company, '')), 'B') ||
            setweight(to_tsvector('english', coalesce(NEW.location, '')), 'C') ||
            setweight(to_tsvector('english', coalesce(NEW.description, '')), 'D');
          RETURN NEW;
        END;
        $$ LANGUAGE plpgsql;

        DROP TRIGGER IF EXISTS job_listing_search_vector_trigger ON job_listing;
        CREATE TRIGGER job_listing_search_vector_trigger
          BEFORE INSERT OR UPDATE OF title, company, location, description ON job_listing
          FOR EACH ROW EXECUTE PROCEDURE job_listing_search_vector_update();

        UPDATE job_listing
        SET search_vector =
          setweight(to_tsvector('english', coalesce(title, '')), 'A') ||
          setweight(to_tsvector('english', coalesce(company, '')), 'B') ||
          setweight(to_tsvector('english', coalesce(location, '')), 'C') ||
          setweight(to_tsvector('english', coalesce(description, '')), 'D')
        WHERE search_vector IS NULL;

        CREATE INDEX IF NOT EXISTS job_listing_search_vector_idx
          ON job_listing USING GIN (search_vector);

        CREATE INDEX IF NOT EXISTS job_listing_title_trgm_idx
          ON job_listing USING GIN (title gin_trgm_ops);

        CREATE INDEX IF NOT EXISTS job_listing_company_trgm_idx
          ON job_listing USING GIN (company gin_trgm_ops);

        CREATE INDEX IF NOT EXISTS job_listing_location_trgm_idx
          ON job_listing USING GIN (location gin_trgm_ops);

        CREATE INDEX IF NOT EXISTS job_listing_type_trgm_idx
          ON job_listing USING GIN (type gin_trgm_ops);
      `);
      indexReady = true;
      return true;
    } catch (err) {
      console.warn('[ensureJobSearchIndex]', err);
      indexReady = false;
      return false;
    } finally {
      ensurePromise = null;
    }
  })();

  return ensurePromise;
}

export async function isJobSearchIndexReady(): Promise<boolean> {
  if (indexReady === true) return true;
  if (!isDatabaseConfigured()) return false;

  try {
    const rows = await prisma.$queryRaw<Array<{ ready: boolean }>>`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'job_listing'
          AND column_name = 'search_vector'
      ) AS ready
    `;
    indexReady = rows[0]?.ready ?? false;
    return indexReady;
  } catch {
    indexReady = false;
    return false;
  }
}

export function resetJobSearchIndexCache() {
  indexReady = null;
}
