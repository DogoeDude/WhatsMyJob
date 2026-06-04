export const RESUME_MAX_BYTES = 5 * 1024 * 1024;

export const RESUME_ACCEPTED_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

export const RESUME_ACCEPT_ATTR = Object.keys(RESUME_ACCEPTED_MIME).join(',');

export const RESUME_MAX_LABEL = '5 MB';
