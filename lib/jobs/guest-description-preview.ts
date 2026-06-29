/** How much of a job description guests may read before sign-in. */
export const GUEST_DESCRIPTION_PREVIEW_CHARS = 900;

/** Snippet embedded in job list rows — stays under SHORT_DESCRIPTION_MAX so signed-in users still fetch full text. */
export const LIST_DESCRIPTION_SNIPPET_CHARS = 275;

function truncateToChars(description: string, max: number): string {
  const text = description.trim();
  if (!text) return '';
  if (text.length <= max) return text;

  const slice = text.slice(0, max);
  const lastBreak = Math.max(
    slice.lastIndexOf('\n\n'),
    slice.lastIndexOf('. '),
    slice.lastIndexOf(' ')
  );
  const cut = lastBreak > Math.min(120, max * 0.35) ? lastBreak + (slice[lastBreak] === ' ' ? 0 : 2) : slice.length;
  const out = slice.slice(0, cut).trimEnd();
  return out.endsWith('…') ? out : `${out}…`;
}

export function listDescriptionSnippet(description: string): string {
  return truncateToChars(description, LIST_DESCRIPTION_SNIPPET_CHARS);
}

export function truncateGuestJobDescription(description: string): string {
  return truncateToChars(description, GUEST_DESCRIPTION_PREVIEW_CHARS);
}

export function guestDescriptionPreview(description: string): string {
  return truncateGuestJobDescription(description);
}
