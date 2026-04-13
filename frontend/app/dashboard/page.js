"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import API from "@/lib/api";
import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  Area,
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

export default function DashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [trend, setTrend] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [feedbackStats, setFeedbackStats] = useState([]);
  const [rawEvents, setRawEvents] = useState([]);
  const [timeRange, setTimeRange] = useState("90");
  const [selectedDepartment, setSelectedDepartment] = useState("all");
  const [insightLoading, setInsightLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [aiInsight, setAiInsight] = useState("");
  const [typedInsight, setTypedInsight] = useState("");
  const reportRef = useRef(null);

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        console.log("[Dashboard] Loading data...");
        
        const [overviewRes, departmentsRes, trendRes, feedbackRes, eventsRes] = await Promise.all([
          API.get("/analytics/overview"),
          API.get("/analytics/departments"),
          API.get("/analytics/trend"),
          API.get("/analytics/feedback"),
          API.get("/events"),
        ]);

        // Safely extract data with fallbacks
        setOverview(overviewRes?.data || {
          totalEvents: 0,
          totalParticipation: 0,
          averageFeedbackScore: 0,
        });
        setDepartments(departmentsRes?.data?.series || []);
        setTrend(trendRes?.data?.series || []);
        setFeedbackStats(feedbackRes?.data?.series || []);
        setRawEvents(eventsRes?.data || []);
        
        console.log("[Dashboard] Data loaded successfully ✅");
        setError("");
      } catch (apiError) {
        console.error("[Dashboard] Load error:", apiError?.message);
        
        if (apiError?.response?.status === 401 || apiError?.response?.status === 403) {
          localStorage.removeItem("token");
          localStorage.removeItem("role");
          router.replace("/login");
          return;
        }

        const errorMsg = apiError?.response?.data?.error || apiError?.message || "Failed to load dashboard";
        setError(errorMsg);
        toast.error(errorMsg);
        
        // Set default empty data to allow dashboard to render with placeholders
        setOverview({ totalEvents: 0, totalParticipation: 0, averageFeedbackScore: 0 });
        setDepartments([]);
        setTrend([]);
        setFeedbackStats([]);
        setRawEvents([]);
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

  const departmentOptions = useMemo(() => {
    const set = new Set();
    rawEvents.forEach((event) => {
      if (event?.department) {
        set.add(event.department);
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [rawEvents]);

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const dayRange = Number(timeRange);

    return rawEvents.filter((event) => {
      const departmentMatch = selectedDepartment === "all" || event.department === selectedDepartment;

      const eventDate = event?.date ? new Date(event.date) : null;
      const hasValidDate = eventDate && !Number.isNaN(eventDate.getTime());
      const dateMatch =
        dayRange === 0 || !hasValidDate
          ? true
          : now.getTime() - eventDate.getTime() <= dayRange * 24 * 60 * 60 * 1000;

      return departmentMatch && dateMatch;
    });
  }, [rawEvents, selectedDepartment, timeRange]);

  const participationTrendData = useMemo(() => {
    const grouped = new Map();

    filteredEvents.forEach((event) => {
      const eventDate = event?.date ? new Date(event.date) : null;
      if (!eventDate || Number.isNaN(eventDate.getTime())) {
        return;
      }

      const monthKey = `${eventDate.getFullYear()}-${String(eventDate.getMonth() + 1).padStart(2, "0")}`;
      grouped.set(monthKey, (grouped.get(monthKey) || 0) + Number(event.total_students || 0));
    });

    return Array.from(grouped.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, totalAttendance]) => ({
        month: formatMonthLabel(monthKey),
        totalAttendance,
      }));
  }, [filteredEvents]);

  const departmentDistributionData = useMemo(() => {
    const grouped = new Map();

    filteredEvents.forEach((event) => {
      const department = event.department || "Unknown";
      grouped.set(department, (grouped.get(department) || 0) + Number(event.total_students || 0));
    });

    return Array.from(grouped.entries())
      .map(([department, participationCount]) => ({
        department,
        participationCount,
      }))
      .sort((a, b) => b.participationCount - a.participationCount);
  }, [filteredEvents]);

  const attendanceComparisonData = useMemo(() => {
    return [...filteredEvents]
      .sort((a, b) => Number(b.total_students || 0) - Number(a.total_students || 0))
      .slice(0, 8)
      .map((item) => ({
        name: item.title?.length > 18 ? `${item.title.slice(0, 18)}...` : item.title,
        attendance: Number(item.total_students || 0),
      }));
  }, [filteredEvents]);

  const statusTimelineData = useMemo(() => {
    return [...filteredEvents]
      .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime())
      .slice(0, 6)
      .map((event) => {
        const normalizedStatus = String(event.status || "scheduled").toLowerCase();
        const currentStage =
          normalizedStatus === "completed"
            ? "completed"
            : normalizedStatus === "scheduled"
              ? "created"
              : "updated";

        return {
          id: event.id,
          title: event.title,
          department: event.department,
          stage: currentStage,
          date: event.date,
        };
      });
  }, [filteredEvents]);

  const participationHeatmapData = useMemo(() => {
    const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const departmentTotals = new Map();

    filteredEvents.forEach((event) => {
      const department = event.department || "Unknown";
      departmentTotals.set(department, (departmentTotals.get(department) || 0) + Number(event.total_students || 0));
    });

    const topDepartments = Array.from(departmentTotals.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([department]) => department);

    const heatmap = topDepartments.map((department) => {
      const dayBuckets = new Array(7).fill(0);

      filteredEvents.forEach((event) => {
        if ((event.department || "Unknown") !== department) {
          return;
        }

        const eventDate = event?.date ? new Date(event.date) : null;
        if (!eventDate || Number.isNaN(eventDate.getTime())) {
          return;
        }

        dayBuckets[eventDate.getDay()] += Number(event.total_students || 0);
      });

      const max = Math.max(...dayBuckets, 1);
      return {
        department,
        cells: dayBuckets.map((value, dayIndex) => ({
          day: dayLabels[dayIndex],
          value,
          intensity: value / max,
        })),
      };
    });

    return heatmap;
  }, [filteredEvents]);

  const smartInsights = useMemo(() => {
    const bestDepartment = departmentDistributionData[0]?.department || "N/A";
    const lowEngagementCount = filteredEvents.filter((event) => Number(event.total_students || 0) < 30).length;

    return {
      bestDepartment,
      lowEngagementCount,
    };
  }, [departmentDistributionData, filteredEvents]);

  const handleGenerateInsights = async () => {
    setInsightLoading(true);
    console.log("[AI] Generating insights...");

    try {
      const payload = {
        overview: overview || {},
        trend: trend || [],
        departments: departments || [],
        feedback: feedbackStats || [],
      };

      const response = await API.post("/ai/insights", payload);
      const newInsight = response?.data?.insight || "No insight generated.";

      setAiInsight(newInsight);
      localStorage.setItem("camcon_ai_insight", newInsight);
      console.log("[AI] Insights generated successfully ✅");
      toast.success("AI insights generated successfully");
    } catch (apiError) {
      console.error("[AI] Generation failed:", apiError?.message);
      const message =
        apiError?.response?.data?.error ||
        apiError?.response?.data?.message ||
        "Failed to generate AI insights. Please try again.";
      toast.error(message);
      
      // Set fallback insight
      const fallbackInsight = "Based on current campus data, your event management shows steady participation. Focus on increasing department engagement and feedback collection for better insights.";
      setAiInsight(fallbackInsight);
      localStorage.setItem("camcon_ai_insight", fallbackInsight);
    } finally {
      setInsightLoading(false);
    }
  };

  const handleDownloadReport = async () => {
    if (!reportRef.current) {
      toast.error("Report container not available");
      return;
    }

    setExportLoading(true);

    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#020617",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      const imageWidth = pageWidth - margin * 2;
      const imageHeight = (canvas.height * imageWidth) / canvas.width;

      pdf.setFontSize(18);
      pdf.text("Camcon Analytics Report", margin, 14);

      pdf.setFontSize(10);
      pdf.setTextColor(90, 90, 90);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 20);
      pdf.text(`Total Events: ${overview.totalEvents}`, margin, 25);
      pdf.text(`Total Participation: ${overview.totalParticipation}`, margin + 55, 25);
      pdf.text(`Avg Feedback: ${Number(overview.averageFeedbackScore || 0).toFixed(2)}`, margin + 120, 25);

      let remainingHeight = imageHeight;
      let imageY = 30;

      pdf.addImage(imgData, "PNG", margin, imageY, imageWidth, imageHeight);
      remainingHeight -= pageHeight - imageY;

      while (remainingHeight > 0) {
        pdf.addPage();
        imageY = remainingHeight - imageHeight;
        pdf.addImage(imgData, "PNG", margin, imageY, imageWidth, imageHeight);
        remainingHeight -= pageHeight;
      }

      pdf.save(`camcon-analytics-report-${Date.now()}.pdf`);
      toast.success("Report downloaded successfully");
    } catch (pdfError) {
      console.error("PDF export failed:", pdfError);
      toast.error("Failed to generate PDF report");
    } finally {
      setExportLoading(false);
    }
  };

  if (!overview) {
    return <p className="px-6 py-8 text-slate-300">Loading dashboard...</p>;
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <main ref={reportRef} className="px-4 py-8 sm:px-6 lg:px-8 max-w-7xl mx-auto">
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
            <div className="grid gap-6 lg:grid-cols-5">
              <ChartPanelSkeleton className="lg:col-span-3" />
              <ChartPanelSkeleton className="lg:col-span-2" />
            </div>
            <ChartPanelSkeleton />
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
                        onClick={handleDownloadReport}
                        disabled={exportLoading || loading}
                        className="inline-flex items-center gap-2 rounded-xl border border-cyan-300/30 bg-cyan-400/10 px-4 py-2.5 text-sm font-semibold text-cyan-200 transition-all duration-300 hover:bg-cyan-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {exportLoading ? "Preparing PDF..." : "Download Report"}
                      </button>

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
              <GlassCard className="lg:col-span-5 p-4 sm:p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-cyan-300">Chart Filters</h3>
                    <p className="text-xs text-slate-400">Refine charts by time window and department</p>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                    <select
                      value={timeRange}
                      onChange={(event) => setTimeRange(event.target.value)}
                      className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="30">Last 30 days</option>
                      <option value="90">Last 90 days</option>
                      <option value="180">Last 180 days</option>
                      <option value="0">All time</option>
                    </select>

                    <select
                      value={selectedDepartment}
                      onChange={(event) => setSelectedDepartment(event.target.value)}
                      className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-100"
                    >
                      <option value="all">All departments</option>
                      {departmentOptions.map((department) => (
                        <option key={department} value={department}>
                          {department}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </GlassCard>

              {/* Trend Chart */}
              <GlassCard className="lg:col-span-3 p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-white">Participation Trend</h2>
                  <p className="text-sm text-slate-400 mt-1">Attendance over time for selected filters</p>
                </div>
                <div className="h-80">
                  {participationTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={participationTrendData} margin={{ left: 4, right: 14, top: 16, bottom: 8 }}>
                        <defs>
                          <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.45} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                          </linearGradient>
                          <linearGradient id="trendStroke" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#818cf8" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                        <XAxis dataKey="month" stroke="#94a3b8" tickLine={false} />
                        <YAxis stroke="#94a3b8" tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: "#0f172a",
                            border: "1px solid rgba(148,163,184,0.18)",
                            borderRadius: "12px",
                            color: "#e2e8f0",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="totalAttendance"
                          stroke="none"
                          fill="url(#trendFill)"
                          isAnimationActive
                          animationDuration={1000}
                        />
                        <Line
                          type="monotone"
                          dataKey="totalAttendance"
                          stroke="url(#trendStroke)"
                          strokeWidth={3}
                          dot={{ r: 3, strokeWidth: 1, fill: "#0f172a" }}
                          activeDot={{ r: 6, stroke: "#22d3ee", strokeWidth: 2, fill: "#0f172a" }}
                          isAnimationActive
                          animationDuration={1200}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <EmptyState title="No trend data" icon="📈" />
                  )}
                </div>
              </GlassCard>

              {/* Department Pie */}
              <GlassCard className="lg:col-span-2 p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-white">Department Distribution</h2>
                  <p className="text-sm text-slate-400 mt-1">Attendance split by department</p>
                </div>
                <div className="h-80">
                  {departmentDistributionData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <defs>
                          <linearGradient id="deptGradA" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#38bdf8" />
                          </linearGradient>
                          <linearGradient id="deptGradB" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#60a5fa" />
                            <stop offset="100%" stopColor="#818cf8" />
                          </linearGradient>
                          <linearGradient id="deptGradC" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#a78bfa" />
                            <stop offset="100%" stopColor="#f472b6" />
                          </linearGradient>
                        </defs>
                        <Pie
                          data={departmentDistributionData}
                          dataKey="participationCount"
                          nameKey="department"
                          outerRadius={100}
                          innerRadius={60}
                          paddingAngle={2}
                          isAnimationActive
                          animationDuration={1100}
                        >
                          {departmentDistributionData.map((entry, index) => (
                            <Cell
                              key={`dept-${index}`}
                              fill={
                                index % 3 === 0
                                  ? "url(#deptGradA)"
                                  : index % 3 === 1
                                    ? "url(#deptGradB)"
                                    : "url(#deptGradC)"
                              }
                            />
                          ))}
                        </Pie>
                        <Legend />
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

            {/* Event Attendance Comparison */}
            <section>
              <GlassCard className="p-6">
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white">Event Attendance Comparison</h2>
                  <p className="text-sm text-slate-400 mt-1">Top events by attendance for selected filters</p>
                </div>

                {attendanceComparisonData.length > 0 ? (
                  <div className="h-[26rem]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={attendanceComparisonData} margin={{ top: 20, right: 20, left: 0, bottom: 72 }}>
                        <defs>
                          <linearGradient id="barFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#3b82f6" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                        <XAxis
                          dataKey="name"
                          stroke="#94a3b8"
                          tickLine={false}
                          angle={-30}
                          interval={0}
                          textAnchor="end"
                          height={70}
                        />
                        <YAxis stroke="#94a3b8" tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            background: "#0f172a",
                            border: "1px solid rgba(148,163,184,0.18)",
                            borderRadius: "12px",
                            color: "#e2e8f0",
                          }}
                        />
                        <Bar
                          dataKey="attendance"
                          fill="url(#barFill)"
                          radius={[10, 10, 0, 0]}
                          maxBarSize={56}
                          isAnimationActive
                          animationDuration={1200}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <EmptyState
                    title="No attendance data"
                    icon="📊"
                    description="Create events to start comparing attendance"
                  />
                )}
              </GlassCard>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-5">
              <GlassCard className="lg:col-span-2 p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-white">Event Status Timeline</h2>
                  <p className="text-sm text-slate-300 mt-1">Latest lifecycle signals: created, updated, completed.</p>
                </div>

                {statusTimelineData.length > 0 ? (
                  <div className="space-y-4">
                    {statusTimelineData.map((item) => (
                      <div key={item.id} className="relative pl-6">
                        <div className="absolute left-0 top-1 h-3 w-3 rounded-full bg-cyan-300" />
                        <div className="absolute left-[5px] top-5 h-[calc(100%-4px)] w-px bg-white/20" />
                        <p className="text-sm font-semibold text-white">{item.title}</p>
                        <p className="text-xs uppercase tracking-[0.2em] text-cyan-200 mt-1">{item.stage}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          {item.department} • {item.date ? new Date(item.date).toLocaleDateString() : "No date"}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No timeline data" icon="🕒" />
                )}
              </GlassCard>

              <GlassCard className="lg:col-span-3 p-6">
                <div className="mb-5">
                  <h2 className="text-xl font-bold text-white">Participation Heatmap</h2>
                  <p className="text-sm text-slate-300 mt-1">Visual activity grid by day and top departments.</p>
                </div>

                {participationHeatmapData.length > 0 ? (
                  <div className="space-y-4">
                    {participationHeatmapData.map((row) => (
                      <div key={row.department} className="grid grid-cols-[120px_1fr] items-center gap-3">
                        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">{row.department}</p>
                        <div className="grid grid-cols-7 gap-2">
                          {row.cells.map((cell) => (
                            <div
                              key={`${row.department}-${cell.day}`}
                              title={`${row.department} ${cell.day}: ${cell.value}`}
                              className="h-8 rounded-md border border-white/20"
                              style={{
                                backgroundColor: `rgba(34, 211, 238, ${0.12 + cell.intensity * 0.75})`,
                              }}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No heatmap data" icon="🔥" />
                )}
              </GlassCard>
            </section>

            <section className="mt-8 grid gap-5 md:grid-cols-2">
              <GlassCard className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Smart Insight</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Best performing department</h3>
                <p className="mt-2 text-lg text-cyan-100">{smartInsights.bestDepartment}</p>
              </GlassCard>

              <GlassCard className="p-6">
                <p className="text-xs uppercase tracking-[0.2em] text-amber-200">Engagement Alert</p>
                <h3 className="mt-2 text-2xl font-bold text-white">Low engagement events</h3>
                <p className="mt-2 text-lg text-amber-100">{smartInsights.lowEngagementCount} events under 30 participants</p>
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

function ChartPanelSkeleton({ className = "" }) {
  return (
    <GlassCard className={`p-6 ${className}`} hoverable={false}>
      <div className="mb-6 space-y-2">
        <div className="h-6 w-56 animate-pulse rounded bg-slate-700/70" />
        <div className="h-4 w-36 animate-pulse rounded bg-slate-700/50" />
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-slate-800/70" />
    </GlassCard>
  );
}

function formatMonthLabel(monthKey) {
  const [year, month] = monthKey.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);

  return date.toLocaleDateString(undefined, {
    month: "short",
    year: "2-digit",
  });
}