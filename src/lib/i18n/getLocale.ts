import { cookies } from 'next/headers';
import { type Locale, T } from './translations';
import { LANG_COOKIE } from './langCookie';

export { LANG_COOKIE };

/** Lee el idioma elegido desde la cookie — para usar en Server Components,
 * donde LanguageContext (localStorage, cliente) no está disponible. */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const saved = store.get(LANG_COOKIE)?.value as Locale | undefined;
  return saved && saved in T ? saved : 'es';
}

export async function getT() {
  const locale = await getLocale();
  return T[locale];
}
