import { requireAuth } from '@/lib/auth-guards';

export const dynamic = 'force-dynamic';

export default async function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAuth('/profile');
  return <>{children}</>;
}
