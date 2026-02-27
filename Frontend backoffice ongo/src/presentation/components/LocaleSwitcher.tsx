"use client";

import { usePathname, useRouter } from "next/navigation";
import { locales } from "@/i18n/config";

export function LocaleSwitcher() {
  const router = useRouter();
  const pathname = usePathname();

  const segments = pathname.split("/").filter(Boolean);
  const currentLocale = locales.includes(segments[0] as any) ? segments[0] : "es";

  const handleChange = (locale: string) => {
    if (locale === currentLocale) return;
    const rest = locales.includes(segments[0] as any) ? segments.slice(1) : segments;
    const nextPath = `/${locale}/${rest.join("/")}`.replace(/\/$/, "");
    router.push(nextPath || `/${locale}`);
  };

  return (
    <select
      className="rounded border border-slate-300 bg-white px-2 py-1 text-sm"
      value={currentLocale}
      onChange={(e) => handleChange(e.target.value)}
    >
      <option value="es">ES</option>
      <option value="pt">PT</option>
      <option value="en">EN</option>
      <option value="fr">FR</option>
    </select>
  );
}
