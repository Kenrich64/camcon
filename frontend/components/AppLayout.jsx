"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { Toaster, toast } from "react-hot-toast";
import { io } from "socket.io-client";

export default function AppLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isReady, setIsReady] = useState(false);

  // Redirect to login if not authenticated (except on login/signup pages)
  useEffect(() => {
    const isAuthPage = pathname === "/login";
    const token = localStorage.getItem("token");

    if (!token && !isAuthPage) {
      router.replace("/login");
      return;
    }

    setIsReady(true);
  }, [router, pathname]);

  useEffect(() => {
    if (pathname === "/login") {
      return undefined;
    }

    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000").replace(/\/$/, "");
    const socket = io(baseUrl, {
      transports: ["websocket"],
    });

    socket.on("new_event", (eventData) => {
      const title = eventData?.title || "Untitled Event";
      toast.success(`New Event Added: ${title}`, {
        duration: 5000,
      });
    });

    return () => {
      socket.disconnect();
    };
  }, [pathname]);

  // Don't render sidebar/header on login page
  const isAuthPage = pathname === "/login";

  if (!isReady && !isAuthPage) {
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
        <div className="flex h-screen bg-slate-950 overflow-hidden">
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
