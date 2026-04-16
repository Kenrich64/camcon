"use client";

export function LoadingSkeleton({ className = "" }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="mb-3 h-4 w-3/4 rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="mb-3 h-4 w-full rounded-lg bg-slate-200 dark:bg-slate-700" />
      <div className="h-4 w-5/6 rounded-lg bg-slate-200 dark:bg-slate-700" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <LoadingSkeleton className="h-6" />
      <div className="space-y-2">
        <LoadingSkeleton />
        <LoadingSkeleton />
      </div>
      <LoadingSkeleton className="h-32" />
    </div>
  );
}

export function GlassCard({ children, className = "", hoverable = true }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800 ${
        hoverable ? "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md" : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

export function EmptyState({ icon = "📭", title = "No data", description = "", action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="heading-display mb-2 text-xl font-semibold text-slate-900 dark:text-slate-100">{title}</h3>
      {description && <p className="mb-6 max-w-sm text-slate-500 dark:text-slate-400">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon = "📊", accent = "border-blue-100 bg-blue-50" }) {
  return (
    <GlassCard className={`p-6 ${accent}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
          <p className="heading-display text-3xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
        <div className="text-4xl text-blue-600 dark:text-blue-400">{icon}</div>
      </div>
    </GlassCard>
  );
}
