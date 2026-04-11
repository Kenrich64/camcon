"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  Upload,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";

const sidebarItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/predictions", label: "Predictions", icon: TrendingUp },
];

export default function Sidebar({ className = "" }) {
  const pathname = usePathname();
  const [role, setRole] = useState("user");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setRole(localStorage.getItem("role") || "user");
  }, []);

  const items = [
    ...sidebarItems,
    ...(role === "admin" ? [{ href: "/upload", label: "Upload", icon: Upload }] : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <button
        onClick={() => setOpen(!open)}
        className="fixed bottom-6 right-6 z-50 md:hidden flex items-center justify-center w-12 h-12 rounded-full bg-cyan-500 text-slate-950 shadow-lg hover:bg-cyan-400 transition"
      >
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Backdrop for mobile */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed left-0 top-0 h-screen w-64 bg-slate-950/95 backdrop-blur-xl border-r border-white/10 flex flex-col z-40 transform transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${className}`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-400/40 to-blue-500/40 text-cyan-300 ring-1 ring-cyan-400/50">
              <Calendar size={20} />
            </div>
            <div>
              <p className="text-sm font-bold tracking-wider text-white">CAMCON</p>
              <p className="text-xs text-slate-400">v1.0</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-4 py-6 space-y-2">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                  isActive
                    ? "bg-cyan-500/30 text-cyan-300 shadow-lg shadow-cyan-500/20 ring-1 ring-cyan-400/50"
                    : "text-slate-300 hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-cyan-400" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Role Badge & Logout */}
        <div className="border-t border-white/10 p-4 space-y-3">
          <div className="rounded-lg bg-slate-800/50 px-4 py-3 text-center">
            <p className="text-xs text-slate-400 mb-1">Current Role</p>
            <p
              className={`text-sm font-bold uppercase tracking-wide ${
                role === "admin" ? "text-amber-300" : "text-slate-300"
              }`}
            >
              {role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 transition border border-rose-500/30"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
