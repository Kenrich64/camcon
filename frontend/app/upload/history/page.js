"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import API from "@/lib/api";
import { GlassCard } from "@/components/ui";
import { History, FileText, RefreshCw } from "lucide-react";

function HistorySkeletonRow() {
  return (
    <tr className="animate-pulse border-b border-slate-200">
      <td className="px-4 py-4"><div className="h-4 w-44 rounded bg-slate-200" /></td>
      <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-slate-200" /></td>
      <td className="px-4 py-4"><div className="h-4 w-16 rounded bg-slate-200" /></td>
      <td className="px-4 py-4"><div className="h-4 w-40 rounded bg-slate-200" /></td>
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
    const role = localStorage.getItem("role");

    if (role !== "admin") {
      router.replace("/dashboard");
      return;
    }

    loadHistory();
  }, [router]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6">
          <GlassCard className="p-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2 text-blue-600">
                  <History size={20} />
                </div>
                <div>
                  <h1 className="heading-display text-2xl font-bold text-slate-900">Upload History</h1>
                  <p className="text-sm text-slate-500">Audit previous CSV/Excel uploads</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => loadHistory(true)}
                disabled={refreshing}
                className="btn-primary"
              >
                <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                {refreshing ? "Refreshing..." : "Refresh"}
              </button>
            </div>
          </GlassCard>
        </div>

        <GlassCard className="overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-slate-100 text-slate-700">
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
                    <tr key={log.id} className="border-b border-slate-200 transition hover:bg-slate-50">
                      <td className="px-4 py-4 text-slate-900">
                        <div className="inline-flex items-center gap-2">
                          <FileText size={16} className="text-blue-600" />
                          <span>{log.file_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 text-slate-600">{log.total_rows}</td>
                      <td className="px-4 py-4 text-emerald-600">{log.inserted_rows}</td>
                      <td className="px-4 py-4 text-slate-500">
                        {log.uploaded_at ? new Date(log.uploaded_at).toLocaleString() : "-"}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-12 text-center text-slate-500">
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
