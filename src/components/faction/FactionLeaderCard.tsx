import type { FactionState } from "../../types/game";
import { ProgressBar } from "../shared/ProgressBar";

const PERSONALITY_LABELS: Record<FactionState["personality"], string> = {
  hawkish: "タカ派",
  dovish: "ハト派",
  pragmatic: "現実路線",
  reformist: "改革志向",
};

export function FactionLeaderCard({ faction }: { faction: FactionState }) {
  const highPressure = faction.reshufflePressure >= 70;

  return (
    <div
      className={`flex flex-col gap-2 rounded-md border p-4 ${
        highPressure ? "border-rose-600 bg-rose-950/30" : "border-slate-700 bg-slate-800"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="font-semibold text-slate-100">
          {faction.name}({PERSONALITY_LABELS[faction.personality]})
        </span>
        <span className="text-sm text-slate-400">領袖: {faction.leaderName}</span>
      </div>
      <span className="text-xs text-slate-500">議席シェア {Math.round(faction.seatShare * 100)}%</span>
      <ProgressBar label="忠誠度" value={faction.loyalty} colorClassName="bg-indigo-500" />
      <ProgressBar
        label="造反圧力"
        value={faction.reshufflePressure}
        colorClassName={highPressure ? "bg-rose-500" : "bg-amber-500"}
      />
      {highPressure && (
        <p className="text-xs font-semibold text-rose-400">
          造反の動きが強まっています。内閣改造などの対応が必要です。
        </p>
      )}
    </div>
  );
}
