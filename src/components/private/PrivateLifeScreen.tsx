import { FamilyPanel } from "./FamilyPanel";
import { HealthStressPanel } from "./HealthStressPanel";
import { HobbySelector } from "./HobbySelector";
import type { PlayerScreen } from "../../App";

export function PrivateLifeScreen({ onNavigate }: { onNavigate: (screen: PlayerScreen) => void }) {
  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-100">総理のプライベート</h1>
        <button
          type="button"
          onClick={() => onNavigate("dashboard")}
          className="text-sm text-slate-400 hover:text-slate-100"
        >
          戻る
        </button>
      </div>

      <HealthStressPanel />
      <FamilyPanel />
      <HobbySelector onNavigate={onNavigate} />
    </div>
  );
}
