import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/options';
import MetricsDashboard from '@/components/admin/MetricsDashboard';

export const metadata = {
  title: 'Metrics & Monitoring - Agentic Author',
  description: 'View AI usage, token tracking, and system metrics',
};

export default async function MetricsPage() {
  const session = await auth();

  // Redirect to login if not authenticated
  if (!session?.user?.id) {
    redirect('/login');
  }

  // TODO: Add admin role check here if needed
  // if (!session.user.isAdmin) {
  //   redirect('/dashboard');
  // }

  return <MetricsDashboard />;
}
