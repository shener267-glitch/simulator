import type { PolicyArea } from "../../types/policy";

interface PolicyAreaCardProps {
  area: PolicyArea;
  onCooldown: boolean;
  readyAtDayIndex?: number;
  onSelect: () => void;
}

export function PolicyAreaCard({ area, onCooldown, readyAtDayIndex, onSelect }: PolicyAreaCardProps) {
  return (
    <button
      type="button"
      disabled={onCooldown}
      onClick={onSelect}
      className={`flex flex-col gap-1 rounded-md border p-4 text-left transition-colors ${
        onCooldown
          ? "cursor-not-allowed border-slate-800 bg-slate-800/50 opacity-50"
          : "border-slate-700 bg-slate-800 hover:border-slate-500"
      }`}
    >
      <span className="font-semibold text-slate-100">{area.name}</span>
      <span className="text-sm text-slate-400">{area.description}</span>
      {onCooldown && (
        <span className="mt-1 text-xs text-amber-400">Day {readyAtDayIndex} まで再検討できません</span>
      )}
    </button>
  );
}
