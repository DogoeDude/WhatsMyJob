import { prisma } from '@/lib/prisma';
import { parseJsonStringArray } from '@/lib/jobs/utils';
import type { PreferredWork, ResumeMeta, UpdateProfileInput, UserProfileDto } from '@/lib/profile/types';
import { PREFERRED_WORK_OPTIONS } from '@/lib/profile/types';

const PREFERRED_WORK_SET = new Set(PREFERRED_WORK_OPTIONS.map((o) => o.value));

function normalizePreferredWork(value: string | null | undefined): PreferredWork {
  if (value && PREFERRED_WORK_SET.has(value as PreferredWork)) {
    return value as PreferredWork;
  }
  return 'any';
}

function resumeMetaFromProfile(
  p: {
    resumeFileName: string | null;
    resumeMimeType: string | null;
    resumeSizeBytes: number | null;
    resumeUpdatedAt: Date | null;
  } | null
): ResumeMeta {
  if (!p?.resumeFileName || !p.resumeMimeType || p.resumeSizeBytes == null || !p.resumeUpdatedAt) {
    return null;
  }
  return {
    fileName: p.resumeFileName,
    mimeType: p.resumeMimeType,
    sizeBytes: p.resumeSizeBytes,
    updatedAt: p.resumeUpdatedAt.toISOString(),
  };
}

async function userHasPassword(userId: string): Promise<boolean> {
  const account = await prisma.account.findFirst({
    where: { userId, providerId: 'credential' },
    select: { password: true },
  });
  return Boolean(account?.password);
}

function toDto(
  user: {
    id: string;
    name: string;
    email: string;
    image: string | null;
    role: string;
    createdAt: Date;
    profile: {
      headline: string | null;
      phone: string | null;
      location: string | null;
      contactEmail: string | null;
      bio: string | null;
      coverLetter: string | null;
      linkedInUrl: string | null;
      portfolioUrl: string | null;
      githubUrl: string | null;
      resumeFileName: string | null;
      resumeMimeType: string | null;
      resumeSizeBytes: number | null;
      resumeUpdatedAt: Date | null;
      preferredWork: string;
      preferredTypes: unknown;
      skills: unknown;
      openToWork: boolean;
      yearsExperience: number | null;
    } | null;
    _count: { applications: number };
  },
  hasPassword: boolean
): UserProfileDto {
  const p = user.profile;
  return {
    userId: user.id,
    name: user.name,
    email: user.email,
    image: user.image,
    role: user.role,
    memberSince: user.createdAt.toISOString(),
    hasPassword,
    headline: p?.headline ?? '',
    phone: p?.phone ?? '',
    location: p?.location ?? '',
    contactEmail: p?.contactEmail ?? '',
    bio: p?.bio ?? '',
    coverLetter: p?.coverLetter ?? '',
    linkedInUrl: p?.linkedInUrl ?? '',
    portfolioUrl: p?.portfolioUrl ?? '',
    githubUrl: p?.githubUrl ?? '',
    resume: resumeMetaFromProfile(p),
    preferredWork: normalizePreferredWork(p?.preferredWork),
    preferredTypes: parseJsonStringArray(p?.preferredTypes),
    skills: parseJsonStringArray(p?.skills),
    openToWork: p?.openToWork ?? true,
    yearsExperience: p?.yearsExperience ?? null,
    applicationCount: user._count.applications,
  };
}

export async function getOrCreateUserProfile(userId: string): Promise<UserProfileDto> {
  await prisma.userProfile.upsert({
    where: { userId },
    create: { userId },
    update: {},
  });

  const [user, hasPassword] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      include: {
        profile: true,
        _count: { select: { applications: true } },
      },
    }),
    userHasPassword(userId),
  ]);

  if (!user?.profile) {
    throw new Error('User not found');
  }

  return toDto(user, hasPassword);
}

function trimToNull(value: string, max: number): string | null {
  const t = value.trim();
  if (!t) return null;
  return t.slice(0, max);
}

function normalizeEmail(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const t = value.trim().toLowerCase();
  if (!t) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return null;
  return t.slice(0, 254);
}

function normalizeUrl(value: string | undefined): string | null | undefined {
  if (value === undefined) return undefined;
  const t = value.trim();
  if (!t) return null;
  try {
    const withProtocol = /^https?:\/\//i.test(t) ? t : `https://${t}`;
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    return url.href.slice(0, 500);
  } catch {
    return null;
  }
}

function normalizeTypes(types: string[] | undefined): string[] | undefined {
  if (types === undefined) return undefined;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of types) {
    const t = raw.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t.slice(0, 80));
  }
  return out.slice(0, 12);
}

function normalizeSkills(skills: string[] | undefined): string[] | undefined {
  if (skills === undefined) return undefined;
  return normalizeTypes(skills)?.map((s) => s.slice(0, 60));
}

export async function updateUserProfile(
  userId: string,
  input: UpdateProfileInput
): Promise<UserProfileDto> {
  await getOrCreateUserProfile(userId);

  if (input.name !== undefined) {
    const name = input.name.trim().slice(0, 120);
    if (name.length < 1) {
      throw new Error('Name is required');
    }
    await prisma.user.update({
      where: { id: userId },
      data: { name },
    });
  }

  const profileData: Record<string, unknown> = {};

  if (input.headline !== undefined) profileData.headline = trimToNull(input.headline, 160);
  if (input.phone !== undefined) profileData.phone = trimToNull(input.phone, 40);
  if (input.location !== undefined) profileData.location = trimToNull(input.location, 120);
  if (input.contactEmail !== undefined) profileData.contactEmail = normalizeEmail(input.contactEmail);
  if (input.bio !== undefined) profileData.bio = trimToNull(input.bio, 2000);
  if (input.coverLetter !== undefined) profileData.coverLetter = trimToNull(input.coverLetter, 12000);
  if (input.linkedInUrl !== undefined) profileData.linkedInUrl = normalizeUrl(input.linkedInUrl);
  if (input.portfolioUrl !== undefined) profileData.portfolioUrl = normalizeUrl(input.portfolioUrl);
  if (input.githubUrl !== undefined) profileData.githubUrl = normalizeUrl(input.githubUrl);
  if (input.preferredWork !== undefined) {
    profileData.preferredWork = normalizePreferredWork(input.preferredWork);
  }
  if (input.preferredTypes !== undefined) {
    profileData.preferredTypes = normalizeTypes(input.preferredTypes) ?? [];
  }
  if (input.skills !== undefined) {
    profileData.skills = normalizeSkills(input.skills) ?? [];
  }
  if (input.openToWork !== undefined) profileData.openToWork = Boolean(input.openToWork);
  if (input.yearsExperience !== undefined) {
    const y = input.yearsExperience;
    profileData.yearsExperience =
      y == null || Number.isNaN(y) ? null : Math.min(60, Math.max(0, Math.floor(y)));
  }

  if (Object.keys(profileData).length > 0) {
    await prisma.userProfile.update({
      where: { userId },
      data: profileData,
    });
  }

  return getOrCreateUserProfile(userId);
}

export async function updateResumeMeta(
  userId: string,
  meta: {
    resumeFileName: string;
    resumeMimeType: string;
    resumeSizeBytes: number;
    resumeUpdatedAt: Date;
  } | null
) {
  await getOrCreateUserProfile(userId);
  await prisma.userProfile.update({
    where: { userId },
    data: meta
      ? meta
      : {
          resumeFileName: null,
          resumeMimeType: null,
          resumeSizeBytes: null,
          resumeUpdatedAt: null,
        },
  });
  return getOrCreateUserProfile(userId);
}
