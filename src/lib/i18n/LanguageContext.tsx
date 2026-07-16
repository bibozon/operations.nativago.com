'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { type Locale, type TranslationKey, T } from './translations';

interface LangCtx {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: (key: TranslationKey) => string;
}

const Ctx = createContext<LangCtx>({
  locale: 'es',
  setLocale: () => {},
  t: (k) => T.es[k],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('es');

  useEffect(() => {
    const saved = localStorage.getItem('nativago_lang') as Locale | null;
    if (saved && saved in T) setLocaleState(saved);
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem('nativago_lang', l);
  }

  const t = (key: TranslationKey) => T[locale][key] ?? T.es[key];

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
