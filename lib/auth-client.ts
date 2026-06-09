import { createAuthClient } from 'better-auth/react';

function authBaseUrl() {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (appUrl && !appUrl.includes('localhost')) {
    return appUrl.replace(/\/$/, '');
  }
  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) {
    return `https://${vercelUrl.replace(/\/$/, '')}`;
  }
  return appUrl || 'http://localhost:3000';
}

export const authClient = createAuthClient({
  baseURL: authBaseUrl(),
});
