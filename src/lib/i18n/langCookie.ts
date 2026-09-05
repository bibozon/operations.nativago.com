// Nombre de cookie compartido entre cliente (LanguageContext) y servidor
// (getLocale.ts) — en su propio archivo, sin importar next/headers, para
// que los componentes cliente puedan referenciarlo sin arrastrar código
// server-only a su bundle.
export const LANG_COOKIE = 'nativago_lang';
