'use client';



import Link from 'next/link';

import { useRouter, useSearchParams } from 'next/navigation';

import { useState, Suspense } from 'react';

import { ChevronRight } from 'lucide-react';

import { AuthShell } from '@/components/auth-shell';

import { inputSurfaceClass } from '@/lib/ui-classes';

import { getPostLoginPath } from '@/lib/auth-redirect';

import { authClient } from '@/lib/auth-client';

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



  const handleSubmit = async (e: React.FormEvent) => {

    e.preventDefault();

    if (!email.trim() || !password.trim()) return;



    setError(null);

    setIsLoading(true);



    try {

      const { error: signInError } = await authClient.signIn.email({

        email: email.trim(),

        password,

      });



      if (signInError) {

        setError(signInError.message ?? 'Invalid email or password.');

        return;

      }



      const { data: session } = await authClient.getSession();

      const userRole = (session?.user as { role?: string } | undefined)?.role ?? 'user';

      const destination = getPostLoginPath(userRole, searchParams.get('callbackUrl'));



      router.push(destination);

      router.refresh();

    } catch {

      setError('Something went wrong. Please try again.');

    } finally {

      setIsLoading(false);

    }

  };



  return (

    <AuthShell

      backHref="/"

      backLabel="Back to home"

      title="Welcome back"

      subtitle="Sign in with your email and password. You will be taken to the right place based on your account."

      footer={

        <>

          Don&apos;t have an account?{' '}

          <Link

            href="/register"

            className="font-semibold text-primary transition-colors hover:text-primary/80"

          >

            Register

          </Link>

        </>

      }

    >

      <form onSubmit={handleSubmit} className="space-y-5">

        {error && (

          <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">

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

            placeholder="••••••••"

            value={password}

            onChange={(e) => setPassword(e.target.value)}

            required

            autoComplete="current-password"

            disabled={isLoading}

            className={inputSurfaceClass}

          />

        </div>



        <Button

          type="submit"

          size="lg"

          className="group w-full"

          disabled={isLoading}

        >

          {isLoading ? 'Signing in…' : 'Sign in'}

          {!isLoading && (

            <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />

          )}

        </Button>

      </form>

    </AuthShell>

  );

}



export default function LoginPage() {

  return (

    <Suspense fallback={<div className="app-mesh min-h-screen" />}>

      <LoginForm />

    </Suspense>

  );

}

