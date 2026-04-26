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
  // State management
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

  // API calls
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

  // Derived metrics
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

  // UI rendering
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {error && (
          <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
                icon="FORECAST"
                accent="border-blue-100 bg-blue-50"
              />
              <StatCard
                label="Most Active Dept"
                value={predictions?.best_department?.department || "N/A"}
                icon="TOP"
                accent="border-slate-200 bg-white"
              />
              <StatCard
                label="Success Rate"
                value={`${successRate.toFixed(1)}%`}
                icon="GROWTH"
                accent="border-blue-100 bg-blue-50"
              />
            </section>

            {/* Comparison Chart */}
            <section className="mb-8">
              <GlassCard className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="heading-display text-xl font-bold text-slate-900">Predicted vs Actual Attendance</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Comparison of forecasted vs actual attendance
                    </p>
                  </div>
                  <button
                    onClick={() => loadPredictions(true)}
                    disabled={refreshing}
                    className="btn-secondary"
                  >
                    <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
                    {refreshing ? "Refreshing" : "Refresh"}
                  </button>
                </div>

                <div className="h-96 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
                      <XAxis dataKey="label" stroke="#64748b" />
                      <YAxis stroke="#64748b" />
                      <Tooltip
                        contentStyle={{
                          background: "#ffffff",
                          border: "1px solid rgba(148,163,184,0.25)",
                          borderRadius: "12px",
                          color: "#0f172a",
                        }}
                      />
                      <Bar dataKey="attendance" fill="#3b82f6" radius={[8, 8, 0, 0]} maxBarSize={120}>
                        <LabelList dataKey="attendance" position="top" fill="#0f172a" />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>
            </section>

            {/* Insights */}
            <section>
              <GlassCard className="p-6">
                <h3 className="heading-display mb-4 text-lg font-bold text-slate-900">Key Insights</h3>
                <div className="space-y-3 text-sm text-slate-600">
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-blue-600">•</span>
                    <p>
                      Your predicted average attendance is{" "}
                      <span className="font-semibold text-blue-700">
                        {predictedAttendance.toFixed(2)} students
                      </span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-blue-600">•</span>
                    <p>
                      Actual average attendance{" "}
                      <span className="font-semibold text-blue-700">
                        {actualAttendance.toFixed(2)} students
                      </span>
                    </p>
                  </div>
                  <div className="flex items-start gap-3">
                    <span className="mt-1 text-blue-600">•</span>
                    <p>
                      The{" "}
                      <span className="font-semibold text-slate-900">
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