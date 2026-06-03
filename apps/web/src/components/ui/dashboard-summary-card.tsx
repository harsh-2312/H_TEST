export function DashboardSummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-soft backdrop-blur-xl">
      <p className="text-sm uppercase tracking-[0.25em] text-slate-500">{label}</p>
      <p className="mt-4 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}
