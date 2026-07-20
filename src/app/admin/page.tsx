import { redirect } from 'next/navigation';
import { requireAuth } from '@/lib/requireRole';

export default async function AdminIndexPage() {
  const auth = await requireAuth();

  if (auth.role === 'SUPERADMIN') redirect('/admin/dashboard');
  if (auth.role === 'SUPPORT') redirect('/admin/dashboard');
  if (auth.role === 'OPERATOR_AGENCY') redirect('/admin/agency');
  if (auth.role === 'OPERATOR_FREELANCE') redirect('/admin/freelance');

  redirect('/login');
}
