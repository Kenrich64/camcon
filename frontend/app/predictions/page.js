"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  LabelList,
} from "recharts";
import API from "@/lib/api";
import { GlassCard, CardSkeleton, StatCard } from "@/components/ui";
import { RefreshCw } from "lucide-react";
import toast from "react-hot-toast";

export default function PredictionsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [predictions, setPredictions] = useState({
    average_attendance: 0,
    best_department: null,
    average_feedback: 0,
  });
  const [overview, setOverview] = useState({
    totalEvents: 0,
    totalParticipation: 0,
  });

  const loadPredictions = async (isRefresh = false) => {
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    setError("");

    try {
      const [predictionsRes, overviewRes] = await Promise.all([
        API.get("/predictions"),
        API.get("/analytics/overview"),
      ]);

      setPredictions(predictionsRes.data || {});
      setOverview(overviewRes.data || {});
      if (isRefresh) {
        toast.success("Data refreshed!");
      }
    } catch (apiError) {
      if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
        localStorage.removeItem("token");
        router.replace("/login");
        return;
      }

      const errorMsg = apiError?.response?.data?.error || "Failed to load predictions";
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPredictions();
  }, [router]);

  const predictedAttendance = Number(predictions.average_attendance || 0);
  const actualAttendance =
    Number(overview.totalEvents || 0) > 0
      ? Number(overview.totalParticipation || 0) / Number(overview.totalEvents || 1)
      : 0;
  const successRate = Number(predictions.average_feedback || 0) * 20;

  const chartData = useMemo(
    () => [
      {
        label: "Predicted",
        attendance: Number(predictedAttendance.toFixed(2)),
      },
      {
        label: "Actual",
        attendance: Number(actualAttendance.toFixed(2)),
      },
    ],
    [predictedAttendance, actualAttendance]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        )}

        {loading ? (
          <>
            <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <CardSkeleton className="h-96" />
          </>
        ) : (
          <>
            {/* Prediction Cards */}
            <section className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <StatCard
                label="Predicted Attendance"
                value={predictedAttendance.toFixed(2)}
                icon="🎯"
                accent="from-cyan-400/25 to-cyan-400/5"
              />
              <StatCard
                label="Most Active Dept"
                value={predictions?.best_department?.department || "N/A"}
                icon="🏆"
                accent="from-amber-400/25 to-amber-400/5"
              />
              <StatCard
                label="Success Rate"
                value={`${successRate.toFixed(1)}%`}
                icon="📈"
                accent="from-green-400/25 to-green-400/5"
              />
            </section>

            {/* Comparison Chart */}
            <section className="mb-8">
              <GlassCard className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-white">Predicted vs Actual Attendance</h2>
                    <p className="text-sm text-slate-400 mt-1">
                      Comparison of forecasted vs actual attendance
                    </p>
                  </div>
                  <button
                    onClick={() => loadPredictions(true)}
                    disabled={refreshing}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 transition disabled:opacity-50"
                  >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Refreshing" : "Refresh"}
                  </button>
                </div>

                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                      <XAxis dataKey="label" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid rgba(148,163,184,0.2)",
                          borderRadius: "12px",
                          color: "#e2e8f0",
                        }}
                      />
                      <Bar dataKey="attendance" fill="#06b6d4" radius={[8, 8, 0, 0]} maxBarSize={120}>
                        <LabelList dataKey="attendance" position="top" fill="#e2e8f0" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </section>

            {/* Insights */}
            <section>
              <GlassCard className="p-6">
                <h3 className="text-lg font-bold text-white mb-4">Key Insights</h3>
                <div className="space-y-3 text-sm text-slate-300">
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">•</span>
                    <p>
                      Your predicted average attendance is{" "}
                      <span className="font-semibold text-cyan-300">
                        {predictedAttendance.toFixed(2)} students
                      </span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">•</span>
                    <p>
                      Actual average attendance{" "}
                      <span className="font-semibold text-cyan-300">
                        {actualAttendance.toFixed(2)} students
                      </span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="text-cyan-400 mt-1">•</span>
                    <p>
                      The{" "}
                      <span className="font-semibold text-amber-300">
                        {predictions?.best_department?.department}
                      </span>{" "}
                      department shows the strongest engagement
                    </p>
                  </div>
                </div>
              </GlassCard>
            </section>
          </>
        )}
      </main>
    </div>
  );
}