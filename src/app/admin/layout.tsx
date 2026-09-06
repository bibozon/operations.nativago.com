import React from "react";
import { NativaGoLogo } from "@/components/NativaGoLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { AdminSidebarNav, type AdminMenuItem } from "@/components/admin/AdminSidebarNav";
import { getAuthFromCookies } from "@/lib/requireRole";
import { ROLE_LABEL } from "@/lib/roleLabels";
import { getT } from "@/lib/i18n/getLocale";
import type { AuthTokenPayload } from "@/lib/auth";
import type { TranslationKey } from "@/lib/i18n/translations";

function menuForAuth(auth: AuthTokenPayload, t: Record<TranslationKey, string>): AdminMenuItem[] {
  if (auth.role === "SUPERADMIN") {
    return [
      { label: t.admin_navDashboard, href: "/admin/dashboard", icon: "dashboard" },
      { label: t.admin_navExperiences, href: "/admin/experiences", icon: "sparkle" },
      { label: t.admin_navBookings, href: "/admin/bookings", icon: "calendar" },
      { label: t.admin_navCheckin, href: "/admin/checkin", icon: "qrcode" },
      { label: t.admin_navOperators, href: "/admin/operators", icon: "users" },
      { label: t.admin_navCities, href: "/admin/cities", icon: "map" },
      { label: t.admin_navCategories, href: "/admin/categories", icon: "tag" },
      { label: t.admin_navCountryVisual, href: "/admin/country-visual", icon: "photo" },
      { label: t.admin_navUsers, href: "/admin/users", icon: "shield" },
      { label: t.admin_navSettings, href: "/admin/settings", icon: "settings" },
    ];
  }

  if (auth.role === "SUPPORT") {
    return [
      { label: t.admin_navDashboard, href: "/admin/dashboard", icon: "dashboard" },
      { label: t.admin_navExperiences, href: "/admin/experiences", icon: "sparkle" },
      { label: t.admin_navBookings, href: "/admin/bookings", icon: "calendar" },
      { label: t.admin_navCheckin, href: "/admin/checkin", icon: "qrcode" },
      { label: t.admin_navOperators, href: "/admin/operators", icon: "users" },
    ];
  }

  // OPERATOR_AGENCY / OPERATOR_FREELANCE
  const items: AdminMenuItem[] = [
    {
      label: t.admin_navDashboard,
      href: auth.role === "OPERATOR_AGENCY" ? "/admin/agency" : "/admin/freelance",
      icon: "dashboard",
    },
    { label: t.admin_navExperiences, href: "/admin/experiences", icon: "sparkle" },
    { label: t.admin_navBookings, href: "/admin/bookings", icon: "calendar" },
    { label: t.admin_navCheckin, href: "/admin/checkin", icon: "qrcode" },
  ];

  if (auth.role === "OPERATOR_AGENCY" && auth.operatorRole === "ADMIN") {
    items.push({ label: t.admin_navTeam, href: "/admin/team", icon: "users" });
  }

  return items;
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthFromCookies();
  const t = await getT();
  const displayName = auth?.name?.trim() || auth?.email || "Usuario";
  const initial = displayName[0]?.toUpperCase() ?? "U";
  const roleLabel = auth ? (ROLE_LABEL[auth.role] ?? auth.role) : "";
  const menu = auth ? menuForAuth(auth, t) : [];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar — hidden on mobile, visible on desktop */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col bg-[#0B1120] py-6 px-4 sticky top-0 h-screen">
        <div className="mb-8 px-1">
          <NativaGoLogo size="md" context="onDark" />
        </div>
        <AdminSidebarNav menu={menu} />
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-2 px-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-teal-500/20 text-sm font-semibold text-teal-300">
            {initial}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-white">{displayName}</p>
            <p className="text-xs text-slate-400">{roleLabel}</p>
          </div>
        </div>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-slate-200 flex items-center justify-between h-16 px-6">
          {/* Mobile: hamburger que abre el menú completo */}
          <AdminSidebarNav menu={menu} mobile userInfo={{ initial, displayName, roleLabel }} />
          <div className="ml-auto flex items-center gap-3">
            <LanguageSwitcher variant="light" />
            <div className="hidden sm:flex h-9 w-9 items-center justify-center rounded-full bg-teal-50 text-sm font-semibold text-teal-700">
              {initial}
            </div>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-6 md:p-8">{children}</main>
      </div>
    </div>
  );
}
