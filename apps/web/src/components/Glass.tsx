export function GlassPanel({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return (
    <section className={`section-glass ${className}`}>{children}</section>
  );
}

export function StatTile({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="card-glass p-5">
      <div className="text-sm text-zinc-400">{label}</div>
      <div className="text-3xl font-semibold text-white">{value}</div>
    </div>
  );
}

export function GlassTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800/50 bg-zinc-900/30 backdrop-blur">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

