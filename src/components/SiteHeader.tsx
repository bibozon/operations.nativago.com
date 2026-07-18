'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { NativaGoLogo } from '@/components/NativaGoLogo';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';

// /admin y /operator ya tienen su propio header (con logout, etc.) —
// este header genérico solo aplica a páginas públicas (login, registro...).
export function SiteHeader() {
  const pathname = usePathname();
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/operator')) {
    return null;
  }

  return (
    <header className="bg-[#0F1117] py-2 text-sm">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <NativaGoLogo size="sm" context="onDark" />
          <span className="text-xs font-semibold text-emerald-400 bg-emerald-900/40 rounded px-2 py-0.5">CMS</span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageSwitcher variant="dark" />
          <Link
            href="/login"
            className="rounded-md border border-white/20 px-3 py-1 text-xs font-medium text-white/70 hover:bg-white/10"
          >
            Login
          </Link>
        </div>
      </div>
    </header>
  );
}
