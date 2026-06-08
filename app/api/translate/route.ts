import { NextRequest, NextResponse } from 'next/server';
import { isLikelyGerman } from '@/lib/translate/detect-german';
import { translateGermanToEnglish } from '@/lib/translate/translate-de-en';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const MAX_TEXT_LENGTH = 50_000;

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const text = typeof (body as { text?: unknown })?.text === 'string' ? (body as { text: string }).text.trim() : '';

  if (!text) {
    return NextResponse.json({ error: 'Text is required' }, { status: 400 });
  }

  if (text.length > MAX_TEXT_LENGTH) {
    return NextResponse.json({ error: 'Text is too long to translate' }, { status: 400 });
  }

  if (!isLikelyGerman(text)) {
    return NextResponse.json(
      { error: 'This description does not look like German' },
      { status: 400 }
    );
  }

  try {
    const translatedText = await translateGermanToEnglish(text);
    return NextResponse.json({ translatedText, sourceLang: 'de', targetLang: 'en' });
  } catch (err) {
    console.error('[POST /api/translate]', err);
    const message = err instanceof Error ? err.message : 'Translation failed';
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
