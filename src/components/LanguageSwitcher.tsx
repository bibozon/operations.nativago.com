'use client';
import { useState } from 'react';
import { useLang } from '@/lib/i18n/LanguageContext';
import { LOCALES } from '@/lib/i18n/translations';

interface Props {
  variant?: 'dark' | 'light';
}

export function LanguageSwitcher({ variant = 'dark' }: Props) {
  const { locale, setLocale } = useLang();
  const [open, setOpen] = useState(false);
  const current = LOCALES.find(l => l.code === locale) ?? LOCALES[0];

  const btnClass = variant === 'dark'
    ? 'text-white/80 hover:text-white active:bg-white/10'
    : 'text-gray-600 hover:text-gray-900 active:bg-gray-100 border border-gray-200 bg-white';

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 text-xs font-bold px-2 py-1.5 rounded-xl transition ${btnClass}`}
      >
        <span>{current.flag}</span>
        <span>{current.label}</span>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3 h-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-50 bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden min-w-[140px]">
            {LOCALES.map(l => (
              <button
                key={l.code}
                onClick={() => { setLocale(l.code); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-colors ${
                  locale === l.code
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-base">{l.flag}</span>
                <span>{l.label}</span>
                {locale === l.code && (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 ml-auto">
                    <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
