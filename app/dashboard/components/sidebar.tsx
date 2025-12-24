"use client"

import { LogOut, Archive, Settings, LayoutDashboard } from "lucide-react";
import Link from "next/link";

const sidebarItems = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/dashboard", active: true },
  { label: "Archive", icon: Archive, href: "/dashboard/archive" },
  { label: "Settings", icon: Settings, href: "/dashboard/settings" },
];

export default function Sidebar() {
  return (
    <aside className="flex flex-col bg-white/70 border-r border-zinc-200 min-h-screen px-5 pt-8 w-56">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-14 pl-2">
        <img src="https://res.cloudinary.com/dh1rrfpmq/image/upload/v1766460430/prompt_pause-JRsbZR3dxCXndC8YMcyX6XU3XeT2Vw_vdvqfj.svg" className="h-8" alt="Prompt & Pause" />
        <span className="text-xl font-extrabold tracking-wide text-zinc-900">Prompt&Pause</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-2">
        {sidebarItems.map((item) => (
          <Link href={item.href} key={item.label} legacyBehavior>
            <a className={`flex items-center gap-3 px-4 py-2 rounded-lg font-medium text-base hover:bg-zinc-200/60 transition-all ${item.active ? "bg-zinc-900 text-white font-bold" : "text-zinc-800"}`}>
              <item.icon className="w-5 h-5" />
              {item.label}
            </a>
          </Link>
        ))}
      </nav>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Logout */}
      <button className="flex items-center gap-3 text-base text-zinc-700 w-full px-4 py-2 hover:bg-zinc-200/60 rounded-lg mb-8 border border-transparent hover:border-zinc-300 transition-all">
        <LogOut className="w-5 h-5" /> Logout
      </button>
    </aside>
  );
}