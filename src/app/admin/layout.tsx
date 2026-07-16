import React from "react";
import Link from "next/link";
import { NativaGoLogo } from "@/components/NativaGoLogo";
import { LogoutButton } from "@/components/LogoutButton";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

const menu = [
  { label: "Dashboard", href: "/admin", icon: "dashboard" },
  { label: "Experiences", href: "/admin/experiences", icon: "sparkle" },
  { label: "Bookings", href: "/admin/bookings", icon: "calendar" },
  { label: "Check-in QR", href: "/admin/checkin", icon: "qrcode" },
  { label: "Operators", href: "/admin/operators", icon: "users" },
  { label: "Cities", href: "/admin/cities", icon: "map" },
  { label: "Categories", href: "/admin/categories", icon: "tag" },
  { label: "Payments", href: "/admin/payments", icon: "credit-card" },
  { label: "Settings", href: "/admin/settings", icon: "settings" },
];

function Icon({ name: _name }: { name: string }) {
  // Placeholder for Lucide/Feather icons
  return <span className="inline-block w-5 h-5 mr-2 align-middle">🔹</span>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar — hidden on mobile, visible on desktop */}
      <aside className="hidden md:flex w-64 bg-[#0F172A] text-[#E2E8F0] flex-col py-6 px-4 sticky top-0 h-screen">
        <div className="mb-8 flex items-center gap-2 px-1">
          <NativaGoLogo size="md" context="onDark" />
          <span className="text-xs font-bold text-white bg-emerald-600 rounded px-2 py-1 shrink-0">CMS</span>
        </div>
        <nav className="flex-1">
          {menu.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-2 rounded-lg px-3 py-2 mb-2 hover:bg-emerald-600/20 hover:text-emerald-400 transition"
            >
              <Icon name={item.icon} />
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </aside>
      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E2E8F0] flex items-center justify-between h-16 px-6">
          {/* Mobile: show nav links */}
          <nav className="flex md:hidden items-center gap-1 overflow-x-auto">
            {menu.slice(0, 4).map(item => (
              <Link key={item.href} href={item.href}
                className="text-xs font-semibold text-gray-600 hover:text-emerald-700 px-2 py-1 rounded whitespace-nowrap">
                {item.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="light" />
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold">U</div>
            <LogoutButton />
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
