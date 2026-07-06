/** Descriptions shorter than this are treated as teasers/snippets. */
export const SHORT_DESCRIPTION_MAX = 280;

export function isShortJobDescription(description: string | null | undefined): boolean {
  const text = description?.trim() ?? '';
  return text.length < SHORT_DESCRIPTION_MAX;
}
