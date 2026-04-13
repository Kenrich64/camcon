"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import API from "@/lib/api";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/events", label: "Events" },
  { href: "/upload", label: "Upload" },
  { href: "/predictions", label: "Predictions" },
  { href: "/notifications", label: "Notifications" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
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

        const unread = (response.data || []).filter((item) => !item.is_read).length;
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

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/85 backdrop-blur-xl">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-400/15 text-cyan-300 ring-1 ring-cyan-400/25">
            C
          </div>
          <div>
            <p className="text-sm font-semibold tracking-[0.22em] text-cyan-300 uppercase">Camcon</p>
            <p className="text-xs text-slate-400">Event analytics dashboard</p>
          </div>
          <span
            className={`ml-2 rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${
              role === "admin"
                ? "bg-amber-400/20 text-amber-300 ring-1 ring-amber-400/25"
                : "bg-white/10 text-slate-300 ring-1 ring-white/20"
            }`}
          >
            {role}
          </span>
        </Link>

        <nav className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 shadow-glow">
          {navItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? "bg-cyan-400 text-slate-950 shadow-sm"
                    : "text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                {item.label}
                {item.href === "/notifications" && unreadCount > 0 ? (
                  <span className="ml-2 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-rose-500/15 hover:text-rose-300"
          >
            Logout
          </button>
        </nav>
      </div>
    </header>
  );
}