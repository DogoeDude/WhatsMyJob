'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { AuthShell } from '@/components/auth-shell';
import { inputSurfaceClass } from '@/lib/ui-classes';
import { authClient } from '@/lib/auth-client';
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

  const passwordsMismatch =
    confirmPassword.length > 0 && password !== confirmPassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;
    if (password !== confirmPassword) return;

    setError(null);
    setIsLoading(true);

    try {
      const { error: signUpError } = await authClient.signUp.email({
        name: name.trim(),
        email: email.trim(),
        password,
      });

      if (signUpError) {
        setError(signUpError.message ?? 'Could not create account.');
        return;
      }

      router.push('/login');
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthShell
      backHref="/login"
      backLabel="Back to sign in"
      title="Create your account"
      subtitle="Join WhatsMyJob as a job seeker. Admin accounts are created separately."
      footer={
        <>
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-semibold text-primary transition-colors hover:text-primary/80"
          >
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="pb-1 text-center lg:hidden">
          <h2 className="text-lg font-semibold text-foreground">Your details</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Create a job seeker account to get started
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="space-y-2">
          <Label htmlFor="name">Full name</Label>
          <Input
            id="name"
            type="text"
            placeholder="Jane Doe"
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
              placeholder="Min. 8 characters"
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
              placeholder="Repeat password"
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
          size="lg"
          className="group w-full"
          disabled={passwordsMismatch || isLoading}
        >
          {isLoading ? 'Creating account…' : 'Create account'}
          {!isLoading && (
            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          )}
        </Button>
      </form>
    </AuthShell>
  );
}
