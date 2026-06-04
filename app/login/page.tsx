'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, Suspense } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { LoadingSpinner } from '@/components/loading-indicator';
import { inputSurfaceClass } from '@/lib/ui-classes';
import { getPostLoginPath } from '@/lib/auth-redirect';
import { authClient } from '@/lib/auth-client';
import { useAppSession } from '@/lib/use-app-session';
import { useAppLoading } from '@/components/app-loading-provider';
import { LoadingButtonLabel } from '@/components/loading-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { refresh: refreshSession } = useAppSession();
  const { startLoading, stopLoading, showUntilNavigate } = useAppLoading();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setError(null);
    setIsLoading(true);
    startLoading('Signing in…');

    try {
      const { error: signInError } = await authClient.signIn.email({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setError(signInError.message ?? 'Invalid email or password.');
        stopLoading();
        return;
      }

      const { data: session } = await authClient.getSession();
      const userRole = (session?.user as { role?: string } | undefined)?.role ?? 'user';
      const destination = getPostLoginPath(userRole, searchParams.get('callbackUrl'));

      await refreshSession();
      stopLoading();
      showUntilNavigate('Signing you in…');
      router.push(destination);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      stopLoading();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      backHref="/"
      backLabel="Back to jobs"
      title="Sign in"
      subtitle="Use the email and password from your account. Admins are sent to the admin panel after login."
      footer={
        <>
          No account?{' '}
          <Link href="/register" className="font-medium text-foreground hover:underline">
            Register
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            disabled={isLoading}
            className={inputSurfaceClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            disabled={isLoading}
            className={inputSurfaceClass}
          />
        </div>

        <Button type="submit" className="w-full gap-2" disabled={isLoading}>
          <LoadingButtonLabel loading={isLoading} loadingText="Signing in…">
            Sign in
          </LoadingButtonLabel>
        </Button>
      </form>
    </AuthShell>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-muted/30">
          <LoadingSpinner label="Loading sign in…" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
