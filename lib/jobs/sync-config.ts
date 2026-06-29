/** Parse positive integer env vars for provider sync tuning. */
export function envInt(name: string, fallback: number, max = 50): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}

/** Parse string env vars with a fallback when unset or blank. */
export function envStr(name: string, fallback: string): string {
  const raw = process.env[name]?.trim();
  return raw || fallback;
}

/** True unless env is explicitly "0", "false", or "no". */
export function envEnabled(name: string, defaultEnabled = true): boolean {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) return defaultEnabled;
  return raw !== '0' && raw !== 'false' && raw !== 'no';
}
