'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save } from 'lucide-react';
import { ProfileChangePassword } from '@/components/profile-change-password';
import {
  ProfileField,
  ProfileFieldGrid,
  ProfileSubpanel,
  profileControlClass,
} from '@/components/profile-field';
import { ProfileResumeUpload } from '@/components/profile-resume-upload';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { selectSurfaceClass } from '@/lib/ui-classes';
import {
  PREFERRED_TYPE_OPTIONS,
  PREFERRED_WORK_OPTIONS,
  type UserProfileDto,
} from '@/lib/profile/types';
import { cn } from '@/lib/utils';

function skillsToText(skills: string[]) {
  return skills.join(', ');
}

function textToSkills(text: string) {
  return text
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

type ProfileFormProps = {
  initial: UserProfileDto;
};

export function ProfileForm({ initial }: ProfileFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    name: initial.name,
    headline: initial.headline,
    phone: initial.phone,
    location: initial.location,
    contactEmail: initial.contactEmail,
    bio: initial.bio,
    coverLetter: initial.coverLetter,
    linkedInUrl: initial.linkedInUrl,
    portfolioUrl: initial.portfolioUrl,
    githubUrl: initial.githubUrl,
    preferredWork: initial.preferredWork,
    preferredTypes: [...initial.preferredTypes],
    skillsText: skillsToText(initial.skills),
    openToWork: initial.openToWork,
    yearsExperience:
      initial.yearsExperience != null ? String(initial.yearsExperience) : '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const memberSince = new Date(initial.memberSince).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });

  const toggleType = (type: string) => {
    setForm((prev) => {
      const has = prev.preferredTypes.some(
        (t) => t.toLowerCase() === type.toLowerCase()
      );
      return {
        ...prev,
        preferredTypes: has
          ? prev.preferredTypes.filter((t) => t.toLowerCase() !== type.toLowerCase())
          : [...prev.preferredTypes, type],
      };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const years = form.yearsExperience.trim();
      const res = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          headline: form.headline,
          phone: form.phone,
          location: form.location,
          contactEmail: form.contactEmail,
          bio: form.bio,
          coverLetter: form.coverLetter,
          linkedInUrl: form.linkedInUrl,
          portfolioUrl: form.portfolioUrl,
          githubUrl: form.githubUrl,
          preferredWork: form.preferredWork,
          preferredTypes: form.preferredTypes,
          skills: textToSkills(form.skillsText),
          openToWork: form.openToWork,
          yearsExperience: years === '' ? null : Number(years),
        }),
      });
      const data = (await res.json()) as { profile?: UserProfileDto; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? 'Could not save profile');
      }
      setSuccess('Profile saved.');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile');
    } finally {
      setSaving(false);
    }
  };

  const accountItems = [
    { label: 'Login email', value: initial.email },
    { label: 'Member since', value: memberSince },
    { label: 'Applications', value: String(initial.applicationCount) },
  ];

  return (
    <div className="space-y-8">
    <form onSubmit={handleSubmit} className="space-y-8">
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </p>
      )}
      {success && (
        <p className="rounded-lg border border-primary/25 bg-primary/10 px-4 py-3 text-sm text-foreground">
          {success}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-x-0 gap-y-3 rounded-xl border border-border bg-muted/20 px-4 py-4 sm:px-5">
        {accountItems.map((item, i) => (
          <div
            key={item.label}
            className={cn(
              'min-w-[10rem] flex-1 px-4',
              i > 0 && 'border-border sm:border-l'
            )}
          >
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p
              className={cn(
                'mt-0.5 text-sm font-medium text-foreground',
                item.label === 'Login email' && 'truncate'
              )}
            >
              {item.value}
            </p>
          </div>
        ))}
        {initial.role === 'admin' && (
          <div className="flex w-full items-center px-4 sm:w-auto sm:border-l sm:border-border">
            <span className="rounded-md bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
              Admin
            </span>
          </div>
        )}
      </div>

      <div className="space-y-6">
        <Card>
          <CardHeader className="border-b border-border/60 px-6 py-5">
            <CardTitle className="text-base">Contact details</CardTitle>
            <CardDescription>
              How recruiters reach you — separate from your login email
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-6 py-5">
            <ProfileField label="Full name" htmlFor="name">
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
                className={profileControlClass}
              />
            </ProfileField>

            <ProfileFieldGrid>
              <ProfileField label="Phone" htmlFor="phone">
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 555 000 0000"
                  value={form.phone}
                  onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                  className={profileControlClass}
                />
              </ProfileField>
              <ProfileField label="Contact email" htmlFor="contactEmail">
                <Input
                  id="contactEmail"
                  type="email"
                  placeholder="you@email.com"
                  value={form.contactEmail}
                  onChange={(e) => setForm((p) => ({ ...p, contactEmail: e.target.value }))}
                  className={profileControlClass}
                />
              </ProfileField>
            </ProfileFieldGrid>

            <ProfileField label="Location" htmlFor="location">
              <Input
                id="location"
                placeholder="City, state / country"
                value={form.location}
                onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                className={profileControlClass}
              />
            </ProfileField>

            <ProfileFieldGrid>
              <ProfileField label="LinkedIn" htmlFor="linkedInUrl">
                <Input
                  id="linkedInUrl"
                  type="url"
                  placeholder="https://linkedin.com/in/…"
                  value={form.linkedInUrl}
                  onChange={(e) => setForm((p) => ({ ...p, linkedInUrl: e.target.value }))}
                  className={profileControlClass}
                />
              </ProfileField>
              <ProfileField label="GitHub" htmlFor="githubUrl">
                <Input
                  id="githubUrl"
                  type="url"
                  placeholder="https://github.com/…"
                  value={form.githubUrl}
                  onChange={(e) => setForm((p) => ({ ...p, githubUrl: e.target.value }))}
                  className={profileControlClass}
                />
              </ProfileField>
            </ProfileFieldGrid>

            <ProfileField label="Portfolio / website" htmlFor="portfolioUrl">
              <Input
                id="portfolioUrl"
                type="url"
                placeholder="https://yoursite.com"
                value={form.portfolioUrl}
                onChange={(e) => setForm((p) => ({ ...p, portfolioUrl: e.target.value }))}
                className={profileControlClass}
              />
            </ProfileField>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="border-b border-border/60 px-6 py-5">
            <CardTitle className="text-base">Documents</CardTitle>
            <CardDescription>Resume and cover letter for applications</CardDescription>
          </CardHeader>
          <CardContent className="px-6 py-5">
            <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
              <ProfileSubpanel title="Resume" className="min-h-[260px]">
                <ProfileResumeUpload initial={initial.resume} />
              </ProfileSubpanel>
              <ProfileSubpanel title="Cover letter" className="min-h-[260px]">
                <Textarea
                  id="coverLetter"
                  placeholder="Default cover letter to tailor per application…"
                  value={form.coverLetter}
                  onChange={(e) => setForm((p) => ({ ...p, coverLetter: e.target.value }))}
                  className="min-h-[200px] flex-1 resize-y text-sm leading-relaxed"
                />
              </ProfileSubpanel>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="flex flex-col">
            <CardHeader className="border-b border-border/60 px-6 py-5">
              <CardTitle className="text-base">Professional summary</CardTitle>
              <CardDescription>Headline and bio</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-5">
              <ProfileField label="Headline" htmlFor="headline">
                <Input
                  id="headline"
                  placeholder="e.g. Senior React Developer · open to remote"
                  value={form.headline}
                  onChange={(e) => setForm((p) => ({ ...p, headline: e.target.value }))}
                  className={profileControlClass}
                />
              </ProfileField>
              <ProfileField label="Bio" htmlFor="bio">
                <Textarea
                  id="bio"
                  rows={6}
                  placeholder="Experience and what you are looking for…"
                  value={form.bio}
                  onChange={(e) => setForm((p) => ({ ...p, bio: e.target.value }))}
                  className="min-h-[140px] resize-y text-sm"
                />
              </ProfileField>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader className="border-b border-border/60 px-6 py-5">
              <CardTitle className="text-base">Job preferences</CardTitle>
              <CardDescription>When browsing listings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 px-6 py-5">
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-muted/15 px-4 py-3.5">
                <div>
                  <p className="text-sm font-medium text-foreground">Open to work</p>
                  <p className="text-xs text-muted-foreground">Actively looking for roles</p>
                </div>
                <Switch
                  checked={form.openToWork}
                  onCheckedChange={(openToWork) => setForm((p) => ({ ...p, openToWork }))}
                  aria-label="Open to work"
                />
              </div>

              <ProfileFieldGrid>
                <ProfileField label="Work arrangement" htmlFor="preferredWork">
                  <select
                    id="preferredWork"
                    value={form.preferredWork}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        preferredWork: e.target.value as typeof form.preferredWork,
                      }))
                    }
                    className={cn(selectSurfaceClass, profileControlClass)}
                  >
                    {PREFERRED_WORK_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </ProfileField>
                <ProfileField label="Years of experience" htmlFor="yearsExperience">
                  <Input
                    id="yearsExperience"
                    type="number"
                    min={0}
                    max={60}
                    placeholder="Optional"
                    value={form.yearsExperience}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, yearsExperience: e.target.value }))
                    }
                    className={profileControlClass}
                  />
                </ProfileField>
              </ProfileFieldGrid>

              <ProfileField label="Preferred job types">
                <div className="flex flex-wrap gap-2">
                  {PREFERRED_TYPE_OPTIONS.map((type) => {
                    const active = form.preferredTypes.some(
                      (t) => t.toLowerCase() === type.toLowerCase()
                    );
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => toggleType(type)}
                        className={cn(
                          'rounded-lg border px-3 py-2 text-xs font-medium transition-colors',
                          active
                            ? 'border-primary bg-primary text-primary-foreground'
                            : 'border-border bg-background text-muted-foreground hover:bg-muted'
                        )}
                      >
                        {type}
                      </button>
                    );
                  })}
                </div>
              </ProfileField>

              <ProfileField label="Skills" htmlFor="skills">
                <Textarea
                  id="skills"
                  rows={3}
                  placeholder="React, TypeScript, … (comma-separated)"
                  value={form.skillsText}
                  onChange={(e) => setForm((p) => ({ ...p, skillsText: e.target.value }))}
                  className="min-h-[88px] resize-y text-sm"
                />
              </ProfileField>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="sticky bottom-0 z-10 flex flex-col gap-2 rounded-xl border border-border bg-background/95 px-4 py-3 shadow-sm backdrop-blur-sm sm:flex-row sm:items-center sm:justify-end">
        <p className="text-xs text-muted-foreground sm:mr-auto">
          Password changes use the button in the security section below.
        </p>
        <Button type="submit" disabled={saving} className="h-11 w-full px-6 sm:w-auto">
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          Save profile
        </Button>
      </div>
    </form>

    <Card>
      <CardHeader className="border-b border-border/60 px-6 py-5">
        <CardTitle className="text-base">Password &amp; security</CardTitle>
        <CardDescription>Sign-in password for this account</CardDescription>
      </CardHeader>
      <CardContent className="px-6 py-5">
        <ProfileChangePassword hasPassword={initial.hasPassword} />
      </CardContent>
    </Card>
    </div>
  );
}
