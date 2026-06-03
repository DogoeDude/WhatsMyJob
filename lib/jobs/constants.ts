/** True when the id is a Prisma cuid stored in job_listing (not a live-feed synthetic id). */
export function isPersistedJobId(id: string): boolean {
  return /^c[a-z0-9]{20,}$/i.test(id);
}
