"use client";

import { useEffect, useMemo, useState } from "react";
import API from "@/lib/api";
import { BellRing, Clock3, CircleDot, CheckCheck } from "lucide-react";
import toast from "react-hot-toast";

const tabs = [
  { id: "new", label: "New" },
  { id: "recent", label: "Recent" },
  { id: "old", label: "Old" },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("new");

  useEffect(() => {
    let mounted = true;

    const loadNotifications = async () => {
      try {
        const response = await API.get("/notifications");
        if (mounted) {
          setNotifications(response.data || []);
        }
      } catch {
        toast.error("Failed to load notifications");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  const filteredNotifications = useMemo(() => {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    return (notifications || []).filter((notification) => {
      const createdAt = notification?.created_at ? new Date(notification.created_at).getTime() : now;

      if (activeTab === "new") {
        return !notification.is_read;
      }

      if (activeTab === "recent") {
        return now - createdAt <= oneDay;
      }

      return now - createdAt > oneDay;
    });
  }, [activeTab, notifications]);

  const markAsRead = async (id) => {
    try {
      await API.put(`/notifications/read/${id}`);
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === id ? { ...notification, is_read: true } : notification
        )
      );
    } catch {
      toast.error("Could not mark notification as read");
    }
  };

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B1220] dark:text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-7 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Realtime alerts</p>
              <h1 className="heading-display mt-2 text-4xl font-bold text-slate-900 dark:text-slate-100">Notifications</h1>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">Track event and dataset updates across your workspace.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 dark:border-blue-400/30 dark:bg-blue-500/10">
              <BellRing className="text-blue-600" size={18} />
              <p className="text-sm text-slate-700 dark:text-slate-300">
                Unread <span className="font-bold text-slate-900 dark:text-slate-100">{unreadCount}</span>
              </p>
            </div>
          </div>
        </section>

        <section className="mb-6 flex flex-wrap gap-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                activeTab === tab.id
                  ? "bg-blue-500 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </section>

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800">
              <p className="text-slate-600 dark:text-slate-400">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-800">
              <p className="text-lg font-semibold text-slate-900 dark:text-slate-100">No notifications found</p>
              <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Switch tabs to explore other alerts.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <article
                key={notification.id}
                onClick={() => {
                  if (!notification.is_read) {
                    markAsRead(notification.id);
                  }
                }}
                className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-sm dark:border-slate-700 dark:bg-slate-800"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CircleDot size={16} className="text-blue-500" />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">{notification.title || "Event Update"}</h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                      notification.type === "new"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-amber-100 text-amber-700"
                    }`}
                  >
                    {notification.type || "update"}
                  </span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{notification.message}</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
                    <Clock3 size={12} />
                    {notification.created_at ? new Date(notification.created_at).toLocaleString() : "Now"}
                  </p>
                  {!notification.is_read ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        markAsRead(notification.id);
                      }}
                      className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100 dark:border-blue-400/30 dark:bg-blue-500/10 dark:text-blue-300"
                    >
                      <CheckCheck size={14} /> Mark as read
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Read</span>
                  )}
                </div>
              </article>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
