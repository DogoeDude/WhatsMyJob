'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { AuthShell } from '@/components/auth-shell';
import { inputSurfaceClass } from '@/lib/ui-classes';
import { authClient } from '@/lib/auth-client';
import { useAppLoading } from '@/components/app-loading-provider';
import { LoadingButtonLabel } from '@/components/loading-indicator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { startLoading, stopLoading, showUntilNavigate } = useAppLoading();

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (password !== confirmPassword) return;

    setError(null);
    setIsLoading(true);
    startLoading('Creating your account…');

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message ?? 'Could not create account.');
        stopLoading();
        return;
      }

      stopLoading();
      showUntilNavigate('Account created — redirecting…');
      router.push('/login');
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
      backHref="/login"
      backLabel="Back to sign in"
      title="Create account"
      subtitle="Job seeker accounts only. Admin access is granted separately."
      footer={
        <>
          Already registered?{' '}
          <Link href="/login" className="font-medium text-foreground hover:underline">
            Sign in
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
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="name"
            className={inputSurfaceClass}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
            autoComplete="email"
            className={inputSurfaceClass}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
              autoComplete="new-password"
              className={inputSurfaceClass}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              disabled={isLoading}
              aria-invalid={passwordsMismatch}
              autoComplete="new-password"
              className={inputSurfaceClass}
            />
          </div>
        </div>
        {passwordsMismatch && (
          <p className="text-sm text-destructive">Passwords do not match</p>
        )}

        <Button
          type="submit"
          className="w-full gap-2"
          disabled={passwordsMismatch || isLoading}
        >
          <LoadingButtonLabel loading={isLoading} loadingText="Creating account…">
            Create account
          </LoadingButtonLabel>
        </Button>
      </form>
    </AuthShell>
  );
}
