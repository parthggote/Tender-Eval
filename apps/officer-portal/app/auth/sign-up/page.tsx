import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { AppLogo } from '~/components/ui/app-logo';
import { credentialSignUp } from './actions';

export const metadata: Metadata = {
  title: 'Sign up — TenderEval',
  description: 'Create your TenderEval officer account.',
};

const SIGNUP_ERRORS: Record<string, string> = {
  missing_fields: 'Please fill in all fields.',
  weak_password: 'Password must be at least 8 characters.',
  email_taken: 'An account with this email already exists.',
  server_error: 'Something went wrong. Please try again.',
};

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function SignUpPage(props: PageProps): Promise<React.JSX.Element> {
  const searchParams = (await props.searchParams) ?? {};
  const errorMessage = searchParams.error
    ? (SIGNUP_ERRORS[searchParams.error] ?? SIGNUP_ERRORS.server_error)
    : null;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-background rounded-xl border border-border shadow-sm p-8 md:p-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <AppLogo size={40} showName nameClassName="text-lg font-bold ml-1" />
          <h2 className="text-2xl font-bold tracking-tight mt-4">Create an account</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Sign up to access the TenderEval officer portal.
          </p>
        </div>

        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="mb-6 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm"
          >
            {errorMessage}
          </div>
        )}

        <form className="flex flex-col gap-5" action={credentialSignUp}>
          <div className="space-y-1.5">
            <Label htmlFor="name">Full name</Label>
            <Input
              type="text"
              id="name"
              name="name"
              required
              autoComplete="name"
              placeholder="Rajesh Kumar"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="email">Email address</Label>
            <Input
              type="email"
              id="email"
              name="email"
              required
              autoComplete="email"
              placeholder="officer@agency.gov"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <Input
              type="password"
              id="password"
              name="password"
              required
              autoComplete="new-password"
              placeholder="Min. 8 characters"
            />
          </div>

          <Button type="submit" className="w-full">
            Create account
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground mt-6">
          Already have an account?{' '}
          <Link
            href="/auth/sign-in"
            className="underline underline-offset-4 hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
        </p>
      </div>
    </main>
  );
}
