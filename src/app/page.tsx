import { redirect } from 'next/navigation';
import { getAuthFromCookies } from '@/lib/requireRole';

export default async function Home() {
  const auth = await getAuthFromCookies();
  if (!auth) {
    redirect('/login');
    return null;
  }
  // Redirect by role
  if (auth.role === 'SUPERADMIN' || auth.role === 'SUPPORT') {
    redirect('/admin/dashboard');
    return null;
  }
  if (auth.role === 'OPERATOR_AGENCY') {
    redirect('/admin/agency');
    return null;
  }
  if (auth.role === 'OPERATOR_FREELANCE') {
    redirect('/admin/freelance');
    return null;
  }
  // Fallback: show login
  redirect('/login');
  return null;
}
