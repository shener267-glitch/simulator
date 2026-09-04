import { canGoToBed } from "../../engine/sleep";
import { useGameState } from "../../state/GameContext";

export type CommandId = "act" | "talk" | "move" | "item" | "bed";

const COMMANDS: { id: CommandId; emoji: string; label: string }[] = [
  { id: "act", emoji: "💪", label: "行動" },
  { id: "talk", emoji: "💬", label: "話す" },
  { id: "move", emoji: "🚪", label: "移動" },
  { id: "item", emoji: "🎒", label: "アイテム" },
];

/**
 * 画面の下に常にある四つの入口（設計書4章・30章）。押すと選択肢がせり上がる。
 * ここが「次へ」ではなく「今、何をする？」を毎回聞いてくる場所になる。
 */
export function CommandBar({ onOpen }: { onOpen: (command: CommandId) => void }) {
  const state = useGameState();

  return (
    <div className="sticky bottom-0 -mx-5 mt-5 border-t border-line bg-ink/90 px-5 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 backdrop-blur-md">
      {/* 寝るのは四つの入口とは別。夜、寝室にいて、予定が残っていないときだけ出す。 */}
      {canGoToBed(state) && (
        <button
          type="button"
          onClick={() => onOpen("bed")}
          className="mb-2.5 flex min-h-[56px] w-full items-center justify-center gap-2.5 rounded-xl border border-brass/40 bg-ink-panel text-[0.95rem] font-medium text-body transition-colors duration-200 hover:border-brass hover:bg-ink-raised active:bg-ink-raised"
        >
          <span className="text-[1.15rem]" aria-hidden>
            🛏️
          </span>
          寝る
        </button>
      )}

      <div className="grid grid-cols-2 gap-2.5">
        {COMMANDS.map((command) => (
          <button
            key={command.id}
            type="button"
            onClick={() => onOpen(command.id)}
            className="flex min-h-[64px] items-center justify-center gap-2.5 rounded-xl border border-line bg-ink-panel text-[0.95rem] font-medium text-body transition-colors duration-200 hover:border-brass/40 hover:bg-ink-raised active:bg-ink-raised"
          >
            <span className="text-[1.15rem]" aria-hidden>
              {command.emoji}
            </span>
            {command.label}
          </button>
        ))}
      </div>
    </div>
  );
}
