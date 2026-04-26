'use server';

import { redirect } from 'next/navigation';
import bcrypt from 'bcryptjs';
import { prisma } from '@workspace/database/client';
import { signIn } from '@workspace/auth';

export async function credentialSignUp(formData: FormData): Promise<void> {
  const name = String(formData.get('name') ?? '').trim();
  const email = String(formData.get('email') ?? '').trim().toLowerCase();
  const password = String(formData.get('password') ?? '');

  if (!email || !password || !name) {
    return redirect('/auth/sign-up?error=missing_fields');
  }

  if (password.length < 8) {
    return redirect('/auth/sign-up?error=weak_password');
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return redirect('/auth/sign-up?error=email_taken');
    }

    const passwordHash = bcrypt.hashSync(password, 12);
    await prisma.user.create({
      data: { name, email, passwordHash },
    });
  } catch {
    return redirect('/auth/sign-up?error=server_error');
  }

  // Sign in immediately after signup
  await signIn('credentials', {
    email,
    password,
    redirectTo: '/agencies',
  });
}
