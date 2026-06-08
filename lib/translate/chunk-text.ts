/** MyMemory free API allows at most 500 characters per query. */
export const MYMEMORY_MAX_CHARS = 450;

const PROVIDER_LIMITS = {
  mymemory: MYMEMORY_MAX_CHARS,
  libretranslate: 4000,
  deepl: 12_000,
} as const;

export type TranslationProvider = keyof typeof PROVIDER_LIMITS;

export function getTranslationProvider(): TranslationProvider {
  if (process.env.DEEPL_API_KEY?.trim()) return 'deepl';
  if (process.env.LIBRETRANSLATE_URL?.trim()) return 'libretranslate';
  return 'mymemory';
}

export function getMaxChunkChars(provider = getTranslationProvider()): number {
  return PROVIDER_LIMITS[provider];
}

/**
 * Split text into chunks that fit provider limits.
 * Breaks prefer paragraph → line → sentence → word boundaries.
 */
export function chunkTextForTranslation(text: string, maxChars = getMaxChunkChars()): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];
  if (trimmed.length <= maxChars) return [trimmed];

  const chunks: string[] = [];
  let remaining = trimmed;

  while (remaining.length > 0) {
    if (remaining.length <= maxChars) {
      chunks.push(remaining);
      break;
    }

    const window = remaining.slice(0, maxChars + 1);
    let sliceEnd = maxChars;

    const paraBreak = window.lastIndexOf('\n\n');
    if (paraBreak > maxChars * 0.25) {
      sliceEnd = paraBreak;
    } else {
      const lineBreak = window.lastIndexOf('\n');
      if (lineBreak > maxChars * 0.25) {
        sliceEnd = lineBreak;
      } else {
        const punctBreak = Math.max(
          window.lastIndexOf('. '),
          window.lastIndexOf('! '),
          window.lastIndexOf('? '),
          window.lastIndexOf('.\n'),
          window.lastIndexOf('!\n'),
          window.lastIndexOf('?\n')
        );
        if (punctBreak > maxChars * 0.25) {
          sliceEnd = punctBreak + 1;
        } else {
          const spaceBreak = window.lastIndexOf(' ');
          if (spaceBreak > maxChars * 0.25) {
            sliceEnd = spaceBreak;
          }
        }
      }
    }

    const piece = remaining.slice(0, sliceEnd).trim();
    if (!piece) {
      chunks.push(remaining.slice(0, maxChars));
      remaining = remaining.slice(maxChars).trimStart();
    } else {
      chunks.push(piece);
      remaining = remaining.slice(sliceEnd).trimStart();
    }
  }

  return chunks;
}

export function joinTranslatedChunks(chunks: string[], maxChars = getMaxChunkChars()): string {
  return chunks.join(maxChars <= MYMEMORY_MAX_CHARS ? ' ' : '\n\n');
}
