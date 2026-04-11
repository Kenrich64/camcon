"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import API from "@/lib/api";
import toast from "react-hot-toast";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  CartesianGrid,
  Legend,
} from "recharts";
import { CardSkeleton, GlassCard, StatCard, EmptyState } from "@/components/ui";
import { Bot, Sparkles } from "lucide-react";
import AIChatbot from "@/components/AIChatbot";

const PIE_COLORS = ["#22d3ee", "#38bdf8", "#60a5fa", "#818cf8", "#a78bfa", "#f472b6"];

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState({
    totalEvents: 0,
    totalParticipation: 0,
    averageFeedbackScore: 0,
  });
  const [trend, setTrend] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState([]);
  const [insightLoading, setInsightLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [typedInsight, setTypedInsight] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/login");
      return;
    }

    const loadDashboard = async () => {
      try {
        const [overviewRes, departmentsRes, trendRes, feedbackRes] = await Promise.all([
          API.get("/analytics/overview"),
          API.get("/analytics/departments"),
          API.get("/analytics/trend"),
          API.get("/analytics/feedback"),
        ]);

        setOverview(overviewRes.data);
        setDepartments(departmentsRes.data.series || []);
        setTrend(trendRes.data.series || []);
        setFeedbackStats(feedbackRes.data.series || []);
      } catch (apiError) {
        if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
          localStorage.removeItem("token");
          router.replace("/login");
          return;
        }

        setError(apiError?.response?.data?.error || "Failed to load dashboard");
      } finally {
        setLoading(false);
      }
    };

    loadDashboard();
  }, [router]);

  useEffect(() => {
    const cachedInsight = localStorage.getItem("camcon_ai_insight");
    if (cachedInsight) {
      setAiInsight(cachedInsight);
      setTypedInsight(cachedInsight);
    }
  }, []);

  useEffect(() => {
    if (!aiInsight) {
      setTypedInsight("");
      return;
    }

    let index = 0;
    const timer = setInterval(() => {
      index += 1;
      setTypedInsight(aiInsight.slice(0, index));

      if (index >= aiInsight.length) {
        clearInterval(timer);
      }
    }, 8);

    return () => clearInterval(timer);
  }, [aiInsight]);

  const handleGenerateInsights = async () => {
    setInsightLoading(true);

    try {
      const payload = {
        overview,
        trend,
        departments,
        feedback: feedbackStats,
      };

      const response = await API.post("/ai/insights", payload);
      const newInsight = response?.data?.insight || "No insight generated.";

      setAiInsight(newInsight);
      localStorage.setItem("camcon_ai_insight", newInsight);
      toast.success("AI insights generated successfully");
    } catch (apiError) {
      const message =
        apiError?.response?.data?.error ||
        apiError?.response?.data?.message ||
        "Failed to generate AI insights";
      toast.error(message);
    } finally {
      setInsightLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        {error ? (
          <div className="mb-6 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        {loading ? (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
            <CardSkeleton className="h-80" />
          </div>
        ) : (
          <>
            <section className="mb-8">
              <div className="rounded-xl bg-gradient-to-r from-cyan-500/30 via-blue-500/20 to-indigo-500/30 p-[1px]">
                <GlassCard className="rounded-xl p-5 sm:p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-300">
                        <Bot size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-white">AI Campus Insights</h2>
                        <p className="mt-1 text-sm text-slate-400">
                          Generate expert analysis from your live event analytics.
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleGenerateInsights}
                        disabled={insightLoading}
                        className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 px-4 py-2.5 text-sm font-semibold text-slate-950 transition-all duration-300 hover:scale-[1.02] hover:from-cyan-300 hover:to-blue-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {insightLoading ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Sparkles size={16} />
                            {aiInsight ? "Regenerate Insights" : "Generate AI Insights"}
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-5 rounded-xl border border-white/10 bg-slate-900/60 p-4">
                    {insightLoading ? (
                      <div className="space-y-2">
                        <div className="h-4 w-2/3 animate-pulse rounded bg-slate-700/70" />
                        <div className="h-4 w-full animate-pulse rounded bg-slate-700/60" />
                        <div className="h-4 w-5/6 animate-pulse rounded bg-slate-700/60" />
                      </div>
                    ) : typedInsight ? (
                      <pre className="whitespace-pre-wrap break-words font-sans text-sm leading-6 text-slate-200">
                        {typedInsight}
                      </pre>
                    ) : (
                      <p className="text-sm text-slate-400">
                        No AI insight yet. Click Generate AI Insights to analyze this dashboard.
                      </p>
                    )}
                  </div>
                </GlassCard>
              </div>
            </section>

            {/* Stats Grid */}
            <section className="mb-8 grid gap-4 md:grid-cols-3">
              <StatCard
                label="Total Events"
                value={overview.totalEvents}
                icon="📅"
                accent="from-cyan-400/25 to-cyan-400/5"
              />
              <StatCard
                label="Total Participants"
                value={overview.totalParticipation}
                icon="👥"
                accent="from-blue-400/25 to-blue-400/5"
              />
              <StatCard
                label="Avg Feedback Score"
                value={Number(overview.averageFeedbackScore || 0).toFixed(2)}
                icon="⭐"
                accent="from-purple-400/25 to-purple-400/5"
              />
            </section>

            {/* Charts Grid */}
            <section className="mb-8 grid gap-6 lg:grid-cols-5">
              {/* Trend Chart */}
              <GlassCard className="lg:col-span-3 p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-white">Participation Trend</h2>
                  <p className="text-sm text-slate-400 mt-1">Monthly attendance overview</p>
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                      <XAxis dataKey="month" stroke="#94a3b8" />
                      <YAxis stroke="#94a3b8" />
                      <Tooltip
                        contentStyle={{
                          background: "#0f172a",
                          border: "1px solid rgba(148,163,184,0.18)",
                          borderRadius: "12px",
                          color: "#e2e8f0",
                        }}
                      />
                      <Bar dataKey="totalAttendance" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </GlassCard>

              {/* Department Pie */}
              <GlassCard className="lg:col-span-2 p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-white">Department Distribution</h2>
                  <p className="text-sm text-slate-400 mt-1">Participation breakdown</p>
                </div>
                <div className="h-80">
                  {departments.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={departments}
                          dataKey="participationCount"
                          nameKey="department"
                          outerRadius={100}
                          innerRadius={60}
                          paddingAngle={2}
                        >
                          {departments.map((entry, index) => (
                            <Cell
                              key={`dept-${index}`}
                              fill={PIE_COLORS[index % PIE_COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <Tooltip
                          contentStyle={{
                            background: "#0f172a",
                            border: "1px solid rgba(148,163,184,0.18)",
                            borderRadius: "12px",
                          }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState title="No data" icon="📊" />
                  )}
                </div>
              </GlassCard>
            </section>

            {/* Feedback Stats */}
            <section>
              <GlassCard className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">Feedback by Category</h2>
                  <p className="text-sm text-slate-400 mt-1">Average scores and response counts</p>
                </div>

                {feedbackStats.length > 0 ? (
                  <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                    {feedbackStats.map((item) => (
                      <div
                        key={item.category}
                        className="rounded-xl bg-slate-900/50 border border-white/10 p-5 hover:border-white/20 transition-all"
                      >
                        <p className="text-sm text-slate-400 font-medium">{item.category}</p>
                        <p className="mt-3 text-3xl font-bold text-cyan-400">
                          {Number(item.averageScore || 0).toFixed(1)}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">{item.responseCount} responses</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No feedback yet" icon="💬" description="Feedback data will appear here once collected" />
                )}
              </GlassCard>
            </section>
          </>
        )}
      </main>
      <AIChatbot
        context={{
          overview,
          trend,
          departments,
          feedback: feedbackStats,
        }}
      />
    </div>
  );
}