import { auth } from '@/lib/auth/options';
import { redirect } from 'next/navigation';

export async function getSession() {
  return await auth();
}

export async function requireSession() {
  const session = await auth();
  if (!session) {
    redirect('/login');
  }
  return session;
}
