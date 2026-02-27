import React from "react";
import Link from "next/link";

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

function Icon({ name }: { name: string }) {
  // Placeholder for Lucide/Feather icons
  return <span className="inline-block w-5 h-5 mr-2 align-middle">🔹</span>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      {/* Sidebar */}
      <aside className="w-64 bg-[#0F172A] text-[#E2E8F0] flex flex-col py-6 px-4 sticky top-0 h-screen">
        <div className="mb-8 flex items-center gap-2">
          <span className="text-2xl font-bold text-emerald-600">NativaGo</span>
          <span className="text-base font-medium text-white bg-emerald-600 rounded px-2 py-1">CMS</span>
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
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Header */}
        <header className="sticky top-0 z-10 bg-white border-b border-[#E2E8F0] flex items-center justify-end h-16 px-6">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold">U</div>
            <div className="flex flex-col text-right">
              <span className="font-semibold text-[#0F172A]">User Name</span>
              <span className="text-xs bg-emerald-100 text-emerald-700 rounded px-2 py-0.5">Superadmin</span>
            </div>
            <button className="ml-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-100">Logout</button>
          </div>
        </header>
        <main className="flex-1 p-8">{children}</main>
      </div>
    </div>
  );
}
