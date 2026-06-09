import { cache } from 'react';
import { headers } from 'next/headers';
import { auth } from '@/lib/auth';

/** One session lookup per request (dedupes layout + page auth checks). */
export const getCachedSession = cache(async () => {
  try {
    return await auth.api.getSession({ headers: await headers() });
  } catch (err) {
    console.error('[auth] getSession failed:', err);
    return null;
  }
});
