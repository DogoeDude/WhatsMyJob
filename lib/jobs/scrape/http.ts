const DEFAULT_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

export const SCRAPE_BROWSER_HEADERS = {
  'User-Agent': DEFAULT_UA,
  'Accept-Language': 'en-US,en;q=0.9',
} as const;

/** Fetch HTML/JSON from job boards with browser-like headers and optional residential proxy. */
export async function scrapeFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const headers = {
    ...SCRAPE_BROWSER_HEADERS,
    ...(init.headers as Record<string, string> | undefined),
  };

  const proxy = process.env.SCRAPE_PROXY_URL?.trim();
  if (proxy) {
    const { ProxyAgent, fetch: undiciFetch } = await import('undici');
    return undiciFetch(url, {
      ...init,
      headers,
      dispatcher: new ProxyAgent(proxy),
    });
  }

  return fetch(url, { ...init, headers });
}

export async function scrapeText(url: string, init: RequestInit = {}): Promise<string> {
  const res = await scrapeFetch(url, init);
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${new URL(url).hostname}`);
  }
  return res.text();
}
