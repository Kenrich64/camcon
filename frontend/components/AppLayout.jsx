"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Toaster, toast } from "react-hot-toast";
import { io } from "socket.io-client";

const PUBLIC_ROUTES = ["/login", "/register"];

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const isAuthPage = PUBLIC_ROUTES.includes(pathname);
  const hasToken = typeof window !== "undefined" ? Boolean(localStorage.getItem("token")) : false;

  useEffect(() => {
    if (!isAuthPage && !hasToken) {
      router.replace("/login");
    }
  }, [hasToken, isAuthPage, router]);

  useEffect(() => {
    if (isAuthPage) {
      return undefined;
    }

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/$/, "");
    if (!baseUrl) {
      return undefined;
    }

    const socket = io(baseUrl, {
      transports: ["websocket"],
    });

    socket.on("new_event", (eventData) => {
      const title = eventData?.title || "Untitled Event";
      toast.success(`New Event Added: ${title}`, {
        duration: 5000,
      });
    });

    // Event update notification handler
    socket.on("event_update", (data) => {
      const { type, event, message } = data;
      const eventTitle = event?.title || "Event";

      // Color-coded toast based on type
      const toastConfig = {
        duration: 5000,
        icon: null,
      };

      switch (type) {
        case "created":
          toast.success(`Event Update: ${eventTitle} has been created`, toastConfig);
          break;
        case "cancelled":
          toast.error(`Event Update: ${eventTitle} has been cancelled`, toastConfig);
          break;
        case "postponed":
          toast(
            `Event Update: ${eventTitle} has been postponed`,
            {
              ...toastConfig,
              icon: "⏰",
              style: {
                background: "#92400e",
                color: "#fef3c7",
                border: "1px solid #d97706",
              },
            }
          );
          break;
        case "venue_changed":
          toast(
            `Event Update: ${eventTitle} venue has changed`,
            {
              ...toastConfig,
              icon: "📍",
              style: {
                background: "#1e3a8a",
                color: "#bfdbfe",
                border: "1px solid #3b82f6",
              },
            }
          );
          break;
        default:
          toast(message || `Event ${eventTitle} updated`, toastConfig);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [isAuthPage]);

  // Don't render sidebar/header on login page
  if (!isAuthPage && !hasToken) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-slate-300">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="bottom-right" />
      {isAuthPage ? (
        // Auth page full screen
        <main>{children}</main>
      ) : (
        // App layout with sidebar
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 overflow-hidden">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content */}
          <div className="flex-1 flex flex-col ml-0 md:ml-64 overflow-hidden">
            {/* Header */}
            <Header />

            {/* Page content */}
            <main className="flex-1 overflow-y-auto">
              <div className="min-h-full">{children}</div>
            </main>
          </div>
        </div>
      )}
    </>
  );
}
