"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const pageConfig = {
  "/dashboard": {
    title: "Dashboard",
    subtitle: "Welcome to your analytics hub",
    icon: "📊",
  },
  "/events": {
    title: "Events",
    subtitle: "Manage your events",
    icon: "📅",
  },
  "/predictions": {
    title: "Predictions",
    subtitle: "Attendance and feedback forecasts",
    icon: "🔮",
  },
  "/upload": {
    title: "Upload",
    subtitle: "Bulk import data",
    icon: "📤",
  },
};

export default function Header() {
  const pathname = usePathname();
  const config = pageConfig[pathname] || { title: "Page", subtitle: "", icon: "📄" };
  const [role, setRole] = useState("user");

  useEffect(() => {
    setRole(localStorage.getItem("role") || "user");
  }, []);

  return (
    <header className="sticky top-0 z-20 border-b border-white/8 bg-slate-950/40 backdrop-blur-2xl">
      <div className="px-6 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-cyan-400/70 font-semibold mb-2">
              {config.icon} {pathname.slice(1).toUpperCase() || "HOME"}
            </p>
            <h1 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
              {config.title}
            </h1>
            {config.subtitle && (
              <p className="text-sm text-slate-400 mt-1">{config.subtitle}</p>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/50 border border-white/10">
              <span className="text-xs text-slate-400">Role:</span>
              <span
                className={`text-sm font-semibold ${
                  role === "admin"
                    ? "text-amber-300"
                    : "text-slate-300"
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
