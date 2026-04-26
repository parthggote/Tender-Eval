import { signOut } from '@workspace/auth';

export default async function SignOutPage() {
  await signOut({ redirectTo: '/auth/sign-in' });
}
