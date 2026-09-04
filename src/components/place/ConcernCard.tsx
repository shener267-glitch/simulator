import { activeConcerns } from "../../engine/concern";
import { useGameState } from "../../state/GameContext";

/**
 * 内心（設計書8章）。チェックボックスも、済んだ印も、件数も出さない —
 * 出せば、たちまちToDoリストとして読まれる。ただ気になっていることが
 * 二つまで並んでいて、そのまま一日を終えることもできる。
 */
export function ConcernCard() {
  const state = useGameState();
  const concerns = activeConcerns(state);

  if (concerns.length === 0) return null;

  return (
    <div className="rounded-2xl border border-line bg-ink-panel px-5 py-4">
      <p className="font-figure text-[0.6rem] font-medium tracking-label text-brass">🧠 内心</p>

      <div className="mt-3 flex flex-col gap-2.5">
        {concerns.map((concern) => (
          <p key={concern.id} className="text-[0.88rem] leading-[1.9] text-body-muted">
            {concern.text}
          </p>
        ))}
      </div>
    </div>
  );
}
