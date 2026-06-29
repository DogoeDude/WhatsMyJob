import { ProfileForm } from '@/components/profile-form';
import { PageContent, PageShell } from '@/components/page-shell';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { getCachedSession } from '@/lib/auth-session';
import { getOrCreateUserProfile } from '@/lib/profile/query';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const session = await getCachedSession();
  if (!session) redirect('/login?callbackUrl=%2Fprofile');

  try {
    const profile = await getOrCreateUserProfile(session.user.id);

    return (
      <PageShell>
        <PageHeader
          title="Your profile"
          subtitle="Contact details, resume, cover letter, job preferences, and password — all in one place. Everything here is private to your account."
        />
        <PageContent wide>
          <ProfileForm initial={profile} />
        </PageContent>
      </PageShell>
    );
  } catch (err) {
    console.error('[ProfilePage]', err);
    return (
      <PageShell>
        <PageContent className="max-w-lg">
          <h1 className="text-xl font-semibold text-foreground">Profile</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The profile table is not set up yet. From the project folder, run:
          </p>
          <pre className="mt-4 rounded-md border border-border bg-muted/30 p-3 text-xs">
            npm run db:push
          </pre>
          <Button className="mt-4" asChild>
            <Link href="/">Back to jobs</Link>
          </Button>
        </PageContent>
      </PageShell>
    );
  }
}
