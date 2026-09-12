'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useLang } from '@/lib/i18n/LanguageContext';
import { NativaGoLogo } from '@/components/NativaGoLogo';

export default function LoginPage() {
  const router = useRouter();
  const { t } = useLang();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setError(data.error ?? t('login_errorDefault'));
        setLoading(false);
        return;
      }

      router.push('/admin');
    } catch (e) {
      setError(t('login_errorNetwork'));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B1120] px-4">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center">
          <NativaGoLogo size="md" context="onDark" />
        </div>

        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-8 py-8 shadow-[0_18px_45px_rgba(0,0,0,0.35)] backdrop-blur-sm">
          <div className="mb-6 text-center">
            <div className="inline-flex items-center justify-center rounded-full bg-teal-500/15 px-4 py-1 text-sm font-semibold text-teal-300">
              {t('admin_loginBadge')}
            </div>
            <h1 className="mt-4 text-2xl font-semibold tracking-tight text-white">
              {t('login_title')}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {t('login_subtitle')}
            </p>
          </div>

          {error && (
            <div className="mb-4 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300">{t('login_email')}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="tú@ejemplo.com"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">{t('login_password')}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white shadow-sm placeholder:text-slate-500 focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                placeholder="••••••••"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 inline-flex w-full items-center justify-center rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:opacity-60"
            >
              {loading ? t('login_submitting') : t('login_submit')}
            </button>

            <div className="pt-2 text-center">
              <button
                type="button"
                className="text-xs font-medium text-teal-400 hover:text-teal-300 hover:underline"
              >
                {t('login_forgotPassword')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
