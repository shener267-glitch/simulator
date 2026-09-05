import { peopleAt } from "../../data/people";
import { useGameState } from "../../state/GameContext";

/**
 * この部屋にいる人（本セッションでの決定）。
 *
 * 話しかけるボタンではない — ただ、誰がそこにいるかを見せる。秘書官室に
 * 二人ともいるのが見えていれば、わざわざ電話を掛ける理由がなくなるし、
 * エントランスに記者が立っているのが見えていれば、そこを通るかどうかが
 * 判断になる。
 */
export function PeopleHere() {
  const state = useGameState();
  const here = peopleAt(state);

  if (here.length === 0) return null;

  return (
    <div className="rounded-2xl border border-line bg-ink-panel px-5 py-4">
      <p className="font-figure text-[0.6rem] font-medium tracking-label text-brass">ここにいる人</p>

      <div className="mt-3 flex flex-col gap-2.5">
        {here.map(({ person, note }) => (
          <div key={person.id} className="flex items-baseline gap-3">
            <span className="shrink-0 text-[1.05rem]" aria-hidden>
              {person.emoji}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[0.9rem] text-body">{person.name}</span>
              {note && (
                <span className="mt-0.5 block text-[0.78rem] leading-[1.7] text-body-muted">
                  {note}
                </span>
              )}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
