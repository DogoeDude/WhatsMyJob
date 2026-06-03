import { requireAuth } from '@/lib/auth-guards';

export const dynamic = 'force-dynamic';

export default async function AnalyticsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth('/analytics');
  return <>{children}</>;
}
