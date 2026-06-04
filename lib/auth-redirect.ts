const BLOCKED_CALLBACKS = new Set(['/login', '/register']);

function normalizeCallback(raw: string | null): string | null {
  if (!raw?.startsWith('/')) return null;
  if (BLOCKED_CALLBACKS.has(raw)) return null;
  return raw;
}

/** Where to send a user after sign-in based on role and optional callback. */
export function getPostLoginPath(
  role: string | undefined,
  rawCallback?: string | null
): string {
  const callback = normalizeCallback(rawCallback ?? null);
  const isAdmin = role === 'admin';

  if (isAdmin) {
    return '/admin';
  }

  if (callback === '/analytics') {
    return '/analytics';
  }

  if (callback && callback !== '/admin') {
    return callback;
  }

  return '/';
}

/** Default home for an already-signed-in session. */
export function getAuthenticatedHomePath(role: string | undefined): string {
  return role === 'admin' ? '/admin' : '/';
}
