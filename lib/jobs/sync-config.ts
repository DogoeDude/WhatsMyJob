/** Parse positive integer env vars for provider sync tuning. */
export function envInt(name: string, fallback: number, max = 50): number {
  const raw = process.env[name]?.trim();
  if (!raw) return fallback;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return fallback;
  return Math.min(Math.floor(n), max);
}
