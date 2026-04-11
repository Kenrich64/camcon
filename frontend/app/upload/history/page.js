"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import API from "@/lib/api";
import { GlassCard } from "@/components/ui";
import { History, FileText, RefreshCw } from "lucide-react";

function HistorySkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-white/5">
      <td className="px-4 py-4"><div className="h-4 w-44 rounded bg-slate-700/70" /></td>
      <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-slate-700/70" /></td>
      <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-slate-700/70" /></td>
      <td className="px-4 py-4"><div className="h-4 w-40 rounded bg-slate-700/70" /></td>
    </tr>
  );
}

export default function UploadHistoryPage() {
  const router = useRouter();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadHistory = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await API.get("/upload/history");
      setLogs(response.data?.logs || []);
    } catch (error) {
      const msg = error?.response?.data?.error || "Failed to load upload history";
      toast.error(msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) {
      router.replace("/login");
      return;
    }

    if (role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    loadHistory();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 rounded-2xl bg-gradient-to-r from-cyan-500/30 via-blue-500/25 to-indigo-500/25 p-[1px]">
          <GlassCard className="rounded-2xl p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/20 p-2 text-cyan-300">
                  <History size={20} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white">Upload History</h1>
                  <p className="text-sm text-slate-400">Audit previous CSV/Excel uploads</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadHistory(true)}
                disabled={refreshing}
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2 text-sm font-semibold text-slate-950 transition-all duration-300 hover:scale-[1.02] hover:from-cyan-300 hover:to-blue-400 disabled:opacity-60"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="overflow-hidden rounded-2xl p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-900/70 text-slate-300">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">File Name</th>
                  <th className="px-4 py-3 text-left font-semibold">Total Rows</th>
                  <th className="px-4 py-3 text-left font-semibold">Inserted Rows</th>
                  <th className="px-4 py-3 text-left font-semibold">Uploaded At</th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <>
                    <HistorySkeletonRow />
                    <HistorySkeletonRow />
                    <HistorySkeletonRow />
                  </>
                ) : logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id} className="border-b border-white/5 transition hover:bg-white/5">
                      <td className="px-4 py-4 text-slate-200">
                        <div className="inline-flex items-center gap-2">
                          <FileText size={16} className="text-cyan-300" />
                          <span>{log.file_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-300">{log.total_rows}</td>
                      <td className="px-4 py-4 text-emerald-300">{log.inserted_rows}</td>
                      <td className="px-4 py-4 text-slate-400">
                        {log.uploaded_at ? new Date(log.uploaded_at).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400">
                      No uploads recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </main>
    </div>
  );
}
