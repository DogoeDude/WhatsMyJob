import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function isSafeLogoUrl(raw: string): URL | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    const host = url.hostname.toLowerCase();
    if (
      host === 'localhost' ||
      host.endsWith('.local') ||
      host.startsWith('127.') ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host === '0.0.0.0'
    ) {
      return null;
    }
    return url;
  } catch {
    return null;
  }
}

/** Proxy company logos so hotlink-protected URLs load in the browser. */
export async function GET(request: NextRequest) {
  const raw = request.nextUrl.searchParams.get('url');
  if (!raw) {
    return new NextResponse('Missing url', { status: 400 });
  }

  const url = isSafeLogoUrl(raw);
  if (!url) {
    return new NextResponse('Invalid url', { status: 400 });
  }

  try {
    const upstream = await fetch(url.href, {
      headers: {
        Accept: 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Referer: `${url.origin}/`,
      },
      redirect: 'follow',
      next: { revalidate: 86400 },
    });

    if (!upstream.ok) {
      return new NextResponse('Logo unavailable', { status: 502 });
    }

    const contentType = upstream.headers.get('content-type') ?? 'image/png';
    if (!contentType.startsWith('image/')) {
      return new NextResponse('Not an image', { status: 502 });
    }

    const body = await upstream.arrayBuffer();
    return new NextResponse(body, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
      },
    });
  } catch {
    return new NextResponse('Logo fetch failed', { status: 502 });
  }
}
