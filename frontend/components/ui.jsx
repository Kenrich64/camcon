"use client";

export function LoadingSkeleton({ className = "" }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="h-4 bg-slate-700 rounded-lg w-3/4 mb-3" />
      <div className="h-4 bg-slate-700 rounded-lg w-full mb-3" />
      <div className="h-4 bg-slate-700 rounded-lg w-5/6" />
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-800/50 p-6 space-y-4">
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
      className={`rounded-2xl border border-white/10 bg-slate-800/50 backdrop-blur-sm shadow-lg ${
        hoverable ? "hover:border-white/20 hover:bg-slate-800/60 transition-all duration-300 hover:shadow-xl" : ""
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
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      {description && <p className="text-slate-400 mb-6 max-w-sm">{description}</p>}
      {action && <div>{action}</div>}
    </div>
  );
}

export function StatCard({ label, value, icon = "📊", accent = "from-cyan-400/25 to-cyan-400/5" }) {
  return (
    <GlassCard className={`bg-gradient-to-br ${accent} border-white/10 p-6`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-400 font-medium mb-2">{label}</p>
          <p className="text-3xl font-bold text-white">{value}</p>
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </GlassCard>
  );
}
