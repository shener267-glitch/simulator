import { useGameState } from "../../state/GameContext";
import { ProgressBar } from "../shared/ProgressBar";

export function FamilyPanel() {
  const { family } = useGameState();

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-slate-700 bg-slate-800 p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">家族関係</p>
      {family.map((member) => (
        <ProgressBar
          key={member.id}
          label={`${member.name}(${member.relation})`}
          value={member.relationship}
          colorClassName="bg-pink-500"
        />
      ))}
    </div>
  );
}
