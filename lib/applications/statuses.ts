export const APPLICATION_STATUSES = [
  { id: 'applied', label: 'Applied', description: 'Application submitted' },
  { id: 'screening', label: 'Screening', description: 'Recruiter review or assessment' },
  { id: 'interview', label: 'Interview', description: 'Interview stage' },
  { id: 'offer', label: 'Offer', description: 'Offer received' },
  { id: 'rejected', label: 'Rejected', description: 'Not moving forward' },
  { id: 'withdrawn', label: 'Withdrawn', description: 'You withdrew' },
  { id: 'no_reply', label: 'No reply', description: 'No response yet' },
] as const;

export type ApplicationStatusId = (typeof APPLICATION_STATUSES)[number]['id'];

const VALID_IDS = new Set<string>(APPLICATION_STATUSES.map((s) => s.id));

export function isApplicationStatus(value: string): value is ApplicationStatusId {
  return VALID_IDS.has(value);
}

export function statusLabel(id: string): string {
  return APPLICATION_STATUSES.find((s) => s.id === id)?.label ?? id;
}
