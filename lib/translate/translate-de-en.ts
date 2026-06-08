import {
  chunkTextForTranslation,
  getMaxChunkChars,
  getTranslationProvider,
  joinTranslatedChunks,
} from '@/lib/translate/chunk-text';

async function translateChunkDeepL(text: string, apiKey: string): Promise<string> {
  const res = await fetch('https://api-free.deepl.com/v2/translate', {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${apiKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      text,
      source_lang: 'DE',
      target_lang: 'EN',
    }),
  });

  const data = (await res.json()) as {
    translations?: { text: string }[];
    message?: string;
  };

  if (!res.ok) {
    throw new Error(data.message ?? 'DeepL translation failed');
  }

  const translated = data.translations?.[0]?.text;
  if (!translated) throw new Error('DeepL returned an empty translation');
  return translated;
}

async function translateChunkLibreTranslate(
  text: string,
  baseUrl: string,
  apiKey?: string
): Promise<string> {
  const res = await fetch(`${baseUrl.replace(/\/$/, '')}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      q: text,
      source: 'de',
      target: 'en',
      format: 'text',
      ...(apiKey ? { api_key: apiKey } : {}),
    }),
  });

  const data = (await res.json()) as { translatedText?: string; error?: string };
  if (!res.ok) {
    throw new Error(data.error ?? 'LibreTranslate request failed');
  }
  if (!data.translatedText?.trim()) {
    throw new Error('LibreTranslate returned an empty translation');
  }
  return data.translatedText;
}

async function translateChunkMyMemory(text: string): Promise<string> {
  const url = new URL('https://api.mymemory.translated.net/get');
  url.searchParams.set('q', text);
  url.searchParams.set('langpair', 'de|en');

  const res = await fetch(url, { next: { revalidate: 0 } });
  const data = (await res.json()) as {
    responseData?: { translatedText?: string };
    responseStatus?: number;
    responseDetails?: string;
  };

  const status = data.responseStatus ?? (res.ok ? 200 : res.status);
  if (!res.ok || status !== 200) {
    throw new Error(data.responseDetails ?? 'Translation service request failed');
  }

  const translated = data.responseData?.translatedText?.trim();
  if (!translated) throw new Error('Translation service returned an empty result');
  if (/QUERY LENGTH LIMIT EXCEEDED/i.test(translated) || /MAX ALLOWED QUERY/i.test(translated)) {
    throw new Error('Description chunk was too long for the free translator');
  }
  return translated;
}

async function translateChunk(text: string): Promise<string> {
  const deepLKey = process.env.DEEPL_API_KEY?.trim();
  if (deepLKey) {
    return translateChunkDeepL(text, deepLKey);
  }

  const libreUrl = process.env.LIBRETRANSLATE_URL?.trim();
  if (libreUrl) {
    return translateChunkLibreTranslate(text, libreUrl, process.env.LIBRETRANSLATE_API_KEY?.trim());
  }

  return translateChunkMyMemory(text);
}

/** Translate German job description text to English (server-only). */
export async function translateGermanToEnglish(text: string): Promise<string> {
  const provider = getTranslationProvider();
  const maxChars = getMaxChunkChars(provider);
  const chunks = chunkTextForTranslation(text, maxChars);
  if (chunks.length === 0) return '';

  const translated: string[] = [];
  for (const chunk of chunks) {
    if (chunk.length > maxChars) {
      throw new Error(`Internal error: chunk exceeds ${maxChars} characters`);
    }
    translated.push(await translateChunk(chunk));
  }

  return joinTranslatedChunks(translated, maxChars);
}
