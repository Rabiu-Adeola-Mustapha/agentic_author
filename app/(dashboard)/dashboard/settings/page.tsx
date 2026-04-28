import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/options';
import SettingsPage from '@/components/settings/SettingsPage';

export default async function SettingsRoute() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/login');
  }

  return <SettingsPage />;
}
