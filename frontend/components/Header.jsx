"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Bell, Moon, Sun } from "lucide-react";
import API from "@/lib/api";

const pageConfig = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Welcome to your analytics hub",
    icon: "ANALYTICS",
  },
  "/events": {
    title: "Events",
    subtitle: "Manage your events",
    icon: "EVENTS",
  },
  "/predictions": {
    title: "Predictions",
    subtitle: "Attendance and feedback forecasts",
    icon: "FORECASTS",
  },
  "/upload": {
    title: "Upload",
    subtitle: "Bulk import data",
    icon: "IMPORT",
  },
  "/notifications": {
    title: "Notifications",
    subtitle: "Stay updated on campus event changes",
    icon: "NOTIFY",
  },
};

export default function Header({ theme = "light", onToggleTheme }) {
  const pathname = usePathname();
  const config = pageConfig[pathname] || { title: "Page", subtitle: "", icon: "📄" };
  const [notifications, setNotifications] = useState([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const role = typeof window !== "undefined" ? localStorage.getItem("role") || "user" : "user";

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const response = await API.get("/notifications");
        if (mounted) {
          setNotifications(response.data || []);
        }
      } catch {
        if (mounted) {
          setNotifications([]);
        }
      }
    };

    loadNotifications();
    const timer = setInterval(loadNotifications, 20000);

    return () => {
      mounted = false;
      clearInterval(timer);
    };
  }, [pathname]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;
  const previewNotifications = notifications.slice(0, 4);

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/read/${id}`);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id
            ? { ...notification, is_read: true }
            : notification
        )
      );
    } catch {
      // Keep interaction resilient even if the API fails.
    }
  };

  const formatTime = (value) => {
    if (!value) {
      return "Now";
    }

    const createdAt = new Date(value);
    return createdAt.toLocaleString();
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/90 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-[#0B1220]/80">
      <div className="px-4 py-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400">
              {config.icon} {pathname.slice(1).toUpperCase() || "HOME"}
            </p>
            <h1 className="heading-display text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-100 md:text-4xl">
              {config.title}
            </h1>
            {config.subtitle && (
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{config.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleTheme}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
            </button>

            <div className="relative">
              <button
                type="button"
                onClick={() => setDropdownOpen((current) => !current)}
                className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
              >
                <Bell size={18} />
                {unreadCount > 0 ? (
                  <span className="absolute -right-1 -top-1 rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                ) : null}
              </button>

              {dropdownOpen ? (
                <div className="animate-slide-in absolute right-0 top-14 z-30 w-80 rounded-2xl border border-slate-200 bg-white p-3 shadow-xl dark:border-slate-700 dark:bg-slate-800">
                  <div className="mb-2 flex items-center justify-between px-1">
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Recent notifications</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{unreadCount} unread</p>
                  </div>
                  <div className="space-y-2">
                    {previewNotifications.length === 0 ? (
                      <p className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-4 text-xs text-slate-500 dark:border-slate-700 dark:bg-slate-700 dark:text-slate-300">
                        No notifications yet.
                      </p>
                    ) : (
                      previewNotifications.map((notification) => (
                        <button
                          key={notification.id}
                          type="button"
                          onClick={() => markAsRead(notification.id)}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-left transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600"
                        >
                          <div className="mb-1 flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold text-slate-900 dark:text-slate-100">{notification.title}</p>
                            {!notification.is_read ? (
                              <span className="rounded-full bg-blue-500 px-2 py-0.5 text-[10px] font-bold text-white">New</span>
                            ) : null}
                          </div>
                          <p className="line-clamp-2 text-xs text-slate-600 dark:text-slate-300">{notification.message}</p>
                          <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">{formatTime(notification.created_at)}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            <div className="hidden items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-800 sm:flex">
              <span className="text-xs text-slate-500 dark:text-slate-400">Role:</span>
              <span
                className={`text-sm font-semibold ${
                  role === "admin"
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-slate-700 dark:text-slate-200"
                }`}
              >
                {role.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
