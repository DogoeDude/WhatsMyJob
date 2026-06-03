/** Jobs per page when browsing categories or loading more. */
export const PAGE_SIZE = 40;

/** Max listings when the user searches by keyword (`q`). */
export const SEARCH_JOB_LIMIT = 150;

const ABSOLUTE_MAX = 200;

/** Server-side page size / cap. */
export function resolveJobListLimit(
  search: string,
  offset: number,
  requested?: number
): number {
  const hasKeyword = search.trim().length > 0;
  const max = hasKeyword ? SEARCH_JOB_LIMIT : ABSOLUTE_MAX;
  const defaultSize = hasKeyword ? SEARCH_JOB_LIMIT : PAGE_SIZE;

  if (requested == null || Number.isNaN(requested) || requested <= 0) {
    return Math.min(defaultSize, max);
  }
  return Math.min(requested, max, ABSOLUTE_MAX);
}
