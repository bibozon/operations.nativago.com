'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NativaGoLogo } from '@/components/NativaGoLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// /admin y /operator ya tienen su propio header (con logout, etc.), y
// /login tiene su propio logo y CTA de "Iniciar sesión" en la tarjeta —
// este header genérico solo aplica al resto de páginas públicas (registro...).
export function SiteHeader() {
  const pathname = usePathname();
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/operator') ||
    pathname?.startsWith('/login')
  ) {
    return null;
  }

  return (
    <header className="bg-[#0F1117] py-2 text-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
        <NativaGoLogo size="sm" context="onDark" />
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="dark" />
          <Link
            href="/login"
            className="rounded-md border border-white/20 px-3 py-1 text-xs font-medium text-white/70 hover:bg-white/10"
          >
            Iniciar sesión
          </Link>
        </div>
      </div>
    </header>
  );
}
