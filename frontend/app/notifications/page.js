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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 text-slate-100">
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-7 rounded-3xl border border-white/20 bg-white/10 p-6 backdrop-blur-lg">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-cyan-200/80">Realtime alerts</p>
              <h1 className="mt-2 text-4xl font-bold text-white">Notifications</h1>
              <p className="mt-2 text-sm text-slate-300">Track every event update with instant status changes.</p>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-white/20 bg-black/20 px-4 py-3">
              <BellRing className="text-cyan-300" size={18} />
              <p className="text-sm text-slate-200">
                Unread <span className="font-bold text-white">{unreadCount}</span>
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
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold shadow-lg transition hover:scale-105 ${
                activeTab === tab.id
                  ? "bg-cyan-300 text-slate-900"
                  : "border border-white/20 bg-white/10 text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </section>

        <section className="space-y-4">
          {loading ? (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-lg">
              <p className="text-slate-300">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="rounded-2xl border border-white/20 bg-white/10 p-10 text-center backdrop-blur-lg">
              <p className="text-lg font-semibold text-white">No notifications found</p>
              <p className="mt-2 text-sm text-slate-300">Switch tabs to explore other alerts.</p>
            </div>
          ) : (
            filteredNotifications.map((notification) => (
              <article
                key={notification.id}
                className="rounded-2xl border border-white/20 bg-white/10 p-5 backdrop-blur-lg transition hover:-translate-y-0.5 hover:bg-white/15"
              >
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CircleDot size={16} className="text-cyan-300" />
                    <h2 className="text-lg font-semibold text-white">{notification.title || "Event Update"}</h2>
                  </div>
                  <span
                    className={`rounded-full px-3 py-1 text-xs font-semibold uppercase ${
                      notification.type === "new"
                        ? "bg-emerald-400/20 text-emerald-200"
                        : "bg-amber-400/20 text-amber-200"
                    }`}
                  >
                    {notification.type || "update"}
                  </span>
                </div>
                <p className="text-sm text-slate-200">{notification.message}</p>
                <div className="mt-4 flex items-center justify-between gap-4">
                  <p className="inline-flex items-center gap-1 text-xs text-slate-400">
                    <Clock3 size={12} />
                    {notification.created_at ? new Date(notification.created_at).toLocaleString() : "Now"}
                  </p>
                  {!notification.is_read ? (
                    <button
                      type="button"
                      onClick={() => markAsRead(notification.id)}
                      className="inline-flex items-center gap-2 rounded-xl border border-cyan-200/40 bg-cyan-400/20 px-3 py-1.5 text-xs font-semibold text-cyan-100 transition hover:scale-105"
                    >
                      <CheckCheck size={14} /> Mark as read
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-300">Read</span>
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
