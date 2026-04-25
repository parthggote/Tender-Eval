'use server';

import { redirect } from 'next/navigation';
import { AuthError } from 'next-auth';

import { signIn } from '@workspace/auth';
import { baseUrl, getPathname, routes } from '@workspace/routes';

export async function credentialSignIn(formData: FormData): Promise<void> {
  const email = String(formData.get('email') ?? '');
  const password = String(formData.get('password') ?? '');

  try {
    await signIn('credentials', {
      email,
      password,
      redirectTo: getPathname(routes.portal.agencies.Index, baseUrl.Portal)
    });
  } catch (err) {
    if (err instanceof AuthError) {
      return redirect(`/auth/sign-in?error=${encodeURIComponent(err.type)}`);
    }
    // Next.js redirects throw a special error that should not be caught
    if (err instanceof Error && err.message === 'NEXT_REDIRECT') {
      throw err;
    }
    console.error('[portal] sign-in failed', err);
    return redirect('/auth/sign-in?error=unknown');
  }
}
