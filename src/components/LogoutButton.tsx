'use client';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n/LanguageContext';

export function LogoutButton() {
  const router = useRouter();
  const { t } = useLang();

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  return (
    <button
      onClick={handleLogout}
      className="ml-4 bg-red-600 hover:bg-red-700 text-white rounded-lg px-4 py-2 text-sm font-semibold transition"
    >
      {t('logout')}
    </button>
  );
}
