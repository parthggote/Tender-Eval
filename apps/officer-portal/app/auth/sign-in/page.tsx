import * as React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@workspace/ui/components/button';
import { Input } from '@workspace/ui/components/input';
import { Label } from '@workspace/ui/components/label';
import { AppLogo } from '~/components/ui/app-logo';
import { credentialSignIn, googleSignIn } from './actions';

export const metadata: Metadata = {
  title: 'Sign in — TenderEval',
  description: 'Sign in to the TenderEval officer portal.',
};

// #51: map NextAuth error codes to plain-language messages
const AUTH_ERRORS: Record<string, string> = {
  CredentialsSignin: 'Invalid email or password. Please try again.',
  OAuthAccountNotLinked: 'This email is linked to a different sign-in method.',
  SessionRequired: 'Your session expired. Please sign in again.',
  AccessDenied: 'You do not have permission to access this portal.',
  Default: 'Sign-in failed. Please try again or contact your administrator.',
};

type PageProps = {
  searchParams?: Promise<{ error?: string }>;
};

export default async function SignInPage(props: PageProps): Promise<React.JSX.Element> {
  const searchParams = (await props.searchParams) ?? {};
  const errorCode = searchParams.error;
  const errorMessage = errorCode
    ? (AUTH_ERRORS[errorCode] ?? AUTH_ERRORS.Default)
    : null;

  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-4xl flex rounded-xl border border-border overflow-hidden shadow-sm">

        {/* Left panel — hidden on mobile */}
        <div className="hidden md:flex md:w-1/2 bg-muted/30 flex-col justify-between p-10 border-r border-border">
          <div>
            {/* Logo mark */}
            <div className="mb-8">
              <AppLogo size={48} showName nameClassName="text-xl font-bold ml-1" />
            </div>
            <h1 className="text-2xl font-bold leading-tight tracking-tight mb-3">
              Procurement evaluation,{' '}
              <span className="relative inline-block">
                simplified
                <svg className="absolute -bottom-1 left-0 w-full overflow-visible pointer-events-none" viewBox="0 0 120 8" preserveAspectRatio="none" aria-hidden="true">
                  <path d="M2 5 C25 2, 60 7, 90 4 C110 2, 116 6, 118 5" stroke="oklch(0.82 0.14 80)" strokeWidth="2.5" strokeLinecap="round" fill="none" opacity="0.8" />
                </svg>
              </span>
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-xs">
              AI-assisted tender evaluation for procurement officers. Consistent, auditable, and fast.
            </p>
          </div>

          <div className="space-y-3">
            {[
              'Automated criteria extraction',
              'Multi-engine OCR for scanned documents',
              'Officer review queue for ambiguous cases',
              'Immutable audit log',
            ].map((feature) => (
              <div key={feature} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                {/* Sketch checkmark */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" className="shrink-0">
                  <circle cx="8" cy="8" r="6" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 1.5" opacity="0.4" />
                  <path d="M5 8 L7 10.5 L11 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                </svg>
                {feature}
              </div>
            ))}
          </div>

          {/* Sketch annotation at bottom */}
          <div className="flex items-center gap-2 mt-4">
            <svg width="24" height="16" viewBox="0 0 24 16" fill="none" aria-hidden="true">
              <path d="M2 8 C6 5, 14 11, 20 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" className="text-muted-foreground/30" />
              <path d="M17 4 L20 7 L18 11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground/30" />
            </svg>
            <p className="font-sketch text-sm text-muted-foreground/50">TenderEval AI Platform</p>
          </div>
        </div>

        {/* Right panel — sign-in form */}
        <div className="w-full md:w-1/2 bg-background p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-8">
            <h2 className="text-2xl font-bold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Enter your credentials to access the portal.
            </p>
          </div>

          {/* #51: plain-language error messages */}
          {errorMessage && (
            <div
              role="alert"
              aria-live="polite"
              className="mb-6 p-3 rounded-md border border-destructive/30 bg-destructive/10 text-destructive text-sm"
            >
              {errorMessage}
            </div>
          )}

          {/* Google SSO */}
          <form action={googleSignIn}>
            <Button type="submit" variant="outline" className="w-full flex items-center gap-2">
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
                <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 7.293C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </Button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Credentials form */}
          <form className="flex flex-col gap-5" action={credentialSignIn}>
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
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                {/* #50: forgot password path */}
                <a
                  href="mailto:admin@tendereval.gov?subject=Password reset request"
                  className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4 transition-colors"
                >
                  Forgot password?
                </a>
              </div>
              <Input
                type="password"
                id="password"
                name="password"
                required
                autoComplete="current-password"
                placeholder="••••••••"
              />
            </div>

            <Button type="submit" className="w-full">
              Sign in
            </Button>

            <p className="text-center text-xs text-muted-foreground">
              Need access?{' '}
              <Link
                href="/auth/sign-up"
                className="underline underline-offset-4 hover:text-foreground transition-colors"
              >
                Create an account
              </Link>
            </p>
          </form>
        </div>
      </div>
    </main>
  );
}
