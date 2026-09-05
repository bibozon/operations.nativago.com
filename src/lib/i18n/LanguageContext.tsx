'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { type Locale, type TranslationKey, T } from './translations';
import { LANG_COOKIE } from './langCookie';

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
    localStorage.setItem('nativago_lang', l);
    // Cookie legible del lado del servidor — permite traducir Server
    // Components (todo el admin del CMS se renderiza en servidor). Se usa
    // un reload completo en vez de router.refresh(): el router cache de
    // Next no siempre vuelve a pedir el RSC payload solo porque cambió una
    // cookie, así que un refresh() a veces dejaba la página en el idioma
    // viejo.
    document.cookie = `${LANG_COOKIE}=${l}; path=/; max-age=31536000; samesite=lax`;
    window.location.reload();
  }

  const t = (key: TranslationKey) => T[locale][key] ?? T.es[key];

  return <Ctx.Provider value={{ locale, setLocale, t }}>{children}</Ctx.Provider>;
}

export function useLang() {
  return useContext(Ctx);
}
