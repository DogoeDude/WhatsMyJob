/** Route external logo URLs through our proxy to avoid hotlink blocks. */
export function proxiedLogoUrl(logoUrl: string): string {
  return `/api/logo?url=${encodeURIComponent(logoUrl)}`;
}
