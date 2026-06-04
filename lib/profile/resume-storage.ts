import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import path from 'path';
import { RESUME_ACCEPTED_MIME, RESUME_MAX_BYTES } from '@/lib/profile/resume-constants';

const RESUME_ROOT = path.join(process.cwd(), 'data', 'resumes');

function userDir(userId: string) {
  return path.join(RESUME_ROOT, userId);
}

function safeUserId(userId: string) {
  if (!/^[a-zA-Z0-9_-]+$/.test(userId)) {
    throw new Error('Invalid user id');
  }
  return userId;
}

export function resumeExtensionForMime(mime: string): string | null {
  return RESUME_ACCEPTED_MIME[mime] ?? null;
}

export function validateResumeFile(file: { size: number; type: string }) {
  if (file.size > RESUME_MAX_BYTES) {
    throw new Error(`Resume must be ${RESUME_MAX_BYTES / (1024 * 1024)} MB or smaller`);
  }
  const ext = resumeExtensionForMime(file.type);
  if (!ext) {
    throw new Error('Resume must be a PDF or Word document (.pdf, .doc, .docx)');
  }
  return ext;
}

export async function saveResumeFile(
  userId: string,
  buffer: Buffer,
  mime: string,
  originalName: string
) {
  const id = safeUserId(userId);
  const ext = validateResumeFile({ size: buffer.length, type: mime });
  const dir = userDir(id);
  await mkdir(dir, { recursive: true });

  const existing = await listResumeFiles(dir);
  await Promise.all(existing.map((f) => rm(path.join(dir, f), { force: true })));

  const storedName = `resume${ext}`;
  const fullPath = path.join(dir, storedName);
  await writeFile(fullPath, buffer);

  const displayName = originalName.trim().slice(0, 200) || storedName;

  return {
    resumeFileName: displayName,
    resumeMimeType: mime,
    resumeSizeBytes: buffer.length,
    resumeUpdatedAt: new Date(),
  };
}

async function listResumeFiles(dir: string) {
  try {
    const { readdir } = await import('fs/promises');
    const files = await readdir(dir);
    return files.filter((f) => f.startsWith('resume.'));
  } catch {
    return [];
  }
}

export async function readResumeFile(userId: string): Promise<{
  buffer: Buffer;
  mime: string;
  fileName: string;
} | null> {
  const id = safeUserId(userId);
  const dir = userDir(id);
  const files = await listResumeFiles(dir);
  if (files.length === 0) return null;

  const stored = files[0];
  const fullPath = path.join(dir, stored);
  const buffer = await readFile(fullPath);
  const ext = path.extname(stored).toLowerCase();
  const mime =
    Object.entries(RESUME_ACCEPTED_MIME).find(([, e]) => e === ext)?.[0] ??
    'application/octet-stream';

  return { buffer, mime, fileName: stored };
}

export async function deleteResumeFile(userId: string) {
  const id = safeUserId(userId);
  const dir = userDir(id);
  await rm(dir, { recursive: true, force: true });
}
