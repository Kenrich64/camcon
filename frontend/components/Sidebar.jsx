"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Calendar,
  TrendingUp,
  Upload,
  Bell,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useEffect, useState } from "react";
import API from "@/lib/api";

const sidebarItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/events", label: "Events", icon: Calendar },
  { href: "/predictions", label: "Predictions", icon: TrendingUp },
  { href: "/notifications", label: "Notifications", icon: Bell },
];

export default function Sidebar({ className = "" }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const role = typeof window !== "undefined" ? localStorage.getItem("role") || "user" : "user";

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const response = await API.get("/notifications");
        if (!mounted) {
          return;
        }

        const unread = (response.data || []).filter((notification) => !notification.is_read).length;
        setUnreadCount(unread);
      } catch {
        if (mounted) {
          setUnreadCount(0);
        }
      }
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 30000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [pathname]);

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
        className="fixed bottom-6 right-6 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-blue-500 text-white shadow-lg transition hover:bg-blue-600 md:hidden"
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
        className={`fixed left-0 top-0 z-40 flex h-screen w-64 transform flex-col border-r border-slate-200 bg-white transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } ${className}`}
      >
        {/* Logo */}
        <div className="border-b border-slate-200 p-6">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600 ring-1 ring-blue-200">
              <Calendar size={20} />
            </div>
            <div>
              <p className="heading-display text-sm font-bold tracking-wider text-slate-900">CAMCON</p>
              <p className="text-xs text-slate-500">v1.0</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-2 overflow-y-auto px-4 py-6">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-700 ring-1 ring-blue-200"
                    : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
                }`}
              >
                <Icon size={20} />
                <span className="text-sm font-medium">{item.label}</span>
                {item.href === "/notifications" && unreadCount > 0 ? (
                  <span className="ml-auto rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
                {isActive && (
                  <div className="ml-auto h-2 w-2 rounded-full bg-blue-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Role Badge & Logout */}
        <div className="space-y-3 border-t border-slate-200 p-4">
          <div className="rounded-lg bg-slate-50 px-4 py-3 text-center">
            <p className="mb-1 text-xs text-slate-500">Current Role</p>
            <p
              className={`text-sm font-bold uppercase tracking-wide ${
                role === "admin" ? "text-amber-700" : "text-slate-700"
              }`}
            >
              {role}
            </p>
          </div>
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-rose-700 transition hover:bg-rose-100"
          >
            <LogOut size={18} />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </div>
    </>
  );
}
