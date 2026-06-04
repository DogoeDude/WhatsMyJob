import { GUEST_JOB_LIMIT, PAGE_SIZE, SEARCH_JOB_LIMIT } from '@/lib/jobs/limits';

/** How many jobs to load for the main browse view (no keyword search). */
export function browseJobLimit(hasSession: boolean, search = ''): number {
  if (search.trim().length > 0) {
    return SEARCH_JOB_LIMIT;
  }
  return hasSession ? PAGE_SIZE : GUEST_JOB_LIMIT;
}
