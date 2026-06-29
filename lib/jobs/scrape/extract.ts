import { stripHtml } from '@/lib/jobs/utils';

/** Extract `window.someVar = {...};` JSON assignments from HTML. */
export function extractWindowJson(html: string, varName: string): unknown | null {
  const escaped = varName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const match = html.match(new RegExp(`window\\.${escaped}\\s*=\\s*(\\{[\\s\\S]*?\\});`));
  if (!match) return null;
  try {
    return JSON.parse(match[1]);
  } catch {
    return null;
  }
}

/** Extract `window.mosaic.providerData["key"] = {...};` from Indeed SERPs. */
export function extractMosaicProviderData(html: string, key: string): unknown | null {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const patterns = [
    new RegExp(`window\\.mosaic\\.providerData\\["${escaped}"\\]\\s*=\\s*(\\{[\\s\\S]*?\\});`),
    new RegExp(`window\\.mosaic\\.providerData\\['${escaped}'\\]\\s*=\\s*(\\{[\\s\\S]*?\\});`),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (!match) continue;
    try {
      return JSON.parse(match[1]);
    } catch {
      continue;
    }
  }
  return null;
}

export function cleanScrapedText(value: string | null | undefined): string {
  if (!value) return '';
  return stripHtml(value).replace(/\s+/g, ' ').trim();
}

export async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex++;
      results[index] = await fn(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );
  return results;
}
