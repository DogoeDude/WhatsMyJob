const descriptionByJobId = new Map<string, string>();
const MAX_ENTRIES = 200;

export function getCachedJobDescription(jobId: string): string | undefined {
  return descriptionByJobId.get(jobId);
}

export function setCachedJobDescription(jobId: string, description: string): void {
  if (!description.trim()) return;
  if (descriptionByJobId.size >= MAX_ENTRIES) {
    const oldest = descriptionByJobId.keys().next().value;
    if (oldest) descriptionByJobId.delete(oldest);
  }
  descriptionByJobId.set(jobId, description);
}
