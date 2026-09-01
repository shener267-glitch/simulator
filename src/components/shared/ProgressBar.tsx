interface ProgressBarProps {
  label: string;
  value: number;
  max?: number;
  colorClassName?: string;
}

export function ProgressBar({ label, value, max = 100, colorClassName = "bg-emerald-500" }: ProgressBarProps) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className="w-full">
      <div className="mb-1 flex items-center justify-between gap-2 text-sm text-slate-300">
        <span className="min-w-0 truncate">{label}</span>
        <span className="shrink-0 tabular-nums">{Number.isInteger(value) ? value : value.toFixed(1)}</span>
      </div>
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-700">
        <div className={`h-full rounded-full transition-all ${colorClassName}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
