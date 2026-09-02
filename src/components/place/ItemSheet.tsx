import { useState } from "react";
import { Modal } from "../shared/Modal";
import { SheetRow } from "../shared/SheetRow";
import { actionMinutesLeft, isSpent } from "../../engine/actions";
import { formatClock, formatDuration } from "../../engine/clock";
import { ITEMS, PHONE_APPS } from "../../data/items";
import { TODAY_SCHEDULE } from "../../data/briefing";
import { findAction } from "../../data/actions";
import { useGameDispatch, useGameState } from "../../state/GameContext";

type View = "items" | "phone" | "calendar" | "messages" | "photos";

/**
 * 持ち物と、その中のスマートフォン（設計書17〜20章）。ニュースとSNSは
 * 「スマートフォンを使って見る」扱いで、中身は行動と同じ仕組みで走る。
 */
export function ItemSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [view, setView] = useState<View>("items");

  function start(actionId: string) {
    dispatch({ type: "CHOOSE_ACTION", actionId });
    onClose();
  }

  if (view === "items") {
    const papers = findAction("documents");
    const papersHere = papers?.places.includes(state.place) ?? false;

    return (
      <Modal title="アイテム" onClose={onClose}>
        <div className="flex flex-col gap-2.5">
          {ITEMS.map((item) => {
            if (item.id === "phone") {
              return (
                <SheetRow
                  key={item.id}
                  emoji={item.emoji}
                  label={item.label}
                  note={item.hint}
                  onClick={() => setView("phone")}
                />
              );
            }

            if (item.id === "watch") {
              return (
                <SheetRow
                  key={item.id}
                  emoji={item.emoji}
                  label={item.label}
                  note={item.hint}
                  meta={formatClock(state.clock)}
                  disabled
                />
              );
            }

            const spent = papers ? isSpent(state, papers) : true;
            return (
              <SheetRow
                key={item.id}
                emoji={item.emoji}
                label={item.label}
                note={papersHere ? item.hint : "ここで広げる場所がない"}
                meta={
                  spent
                    ? "読んだ"
                    : papers
                      ? formatDuration(actionMinutesLeft(state, papers))
                      : undefined
                }
                disabled={!papersHere || spent}
                onClick={() => start("documents")}
              />
            );
          })}
        </div>
      </Modal>
    );
  }

  if (view === "calendar") {
    return (
      <Modal title="カレンダー" onClose={onClose}>
        <ul className="overflow-hidden rounded-xl border border-line bg-ink-panel">
          {TODAY_SCHEDULE.map((entry) => (
            <li key={entry.time} className="flex gap-4 border-b border-line px-4 py-3 last:border-b-0">
              <span className="figures shrink-0 text-[0.8rem] text-brass/80">{entry.time}</span>
              <span className="min-w-0 text-[0.85rem] leading-[1.7] text-body-muted">{entry.label}</span>
            </li>
          ))}
        </ul>
        <BackRow onBack={() => setView("phone")} />
      </Modal>
    );
  }

  if (view === "messages") {
    const messages = state.phone.messages;

    return (
      <Modal title="メッセージ" onClose={onClose}>
        {messages.length === 0 ? (
          <p className="px-1 py-2 text-[0.88rem] leading-[1.9] text-body-muted">
            未読はない。夜のうちに届いたものは、もう秘書官が捌いている。
          </p>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((message) => (
              <article
                key={message.id}
                className="rounded-xl border border-line bg-ink-panel px-4 py-3.5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[0.8rem] font-medium tracking-wider text-brass">
                    {message.from}
                  </span>
                  <span className="figures shrink-0 text-[0.75rem] text-body-muted">
                    {formatClock(message.at)}
                  </span>
                </div>
                <div className="mt-2.5 flex flex-col gap-2">
                  {message.body.map((line) => (
                    <p key={line} className="text-[0.86rem] leading-[1.9] text-body-muted">
                      {line}
                    </p>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
        <BackRow onBack={() => setView("phone")} />
      </Modal>
    );
  }

  if (view === "photos") {
    return (
      <Modal title="写真" onClose={onClose}>
        <p className="px-1 py-2 text-[0.88rem] leading-[1.9] text-body-muted">
          直近は昨日の親任式のものばかりだ。その前は、息子たちがまだ小さかった頃の海。
        </p>
        <BackRow onBack={() => setView("phone")} />
      </Modal>
    );
  }

  return (
    <Modal title="スマートフォン" onClose={onClose}>
      <div className="flex flex-col gap-2.5">
        {PHONE_APPS.map((app) => {
          const action = app.actionId ? findAction(app.actionId) : undefined;
          const spent = action ? isSpent(state, action) : false;

          return (
            <SheetRow
              key={app.id}
              emoji={app.emoji}
              label={app.label}
              meta={
                action
                  ? spent
                    ? "見終えた"
                    : formatDuration(actionMinutesLeft(state, action))
                  : app.id === "messages" && state.phone.messages.length > 0
                    ? `${state.phone.messages.length}件`
                    : undefined
              }
              disabled={Boolean(action) && spent}
              onClick={() => {
                if (action) return start(action.id);
                setView(app.id as View);
              }}
            />
          );
        })}
      </div>
      <BackRow onBack={() => setView("items")} />
    </Modal>
  );
}

function BackRow({ onBack }: { onBack: () => void }) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mt-3 min-h-[52px] w-full rounded-xl border border-line-strong px-4 text-[0.9rem] font-medium text-body-muted transition-colors duration-200 hover:border-brass/40 hover:text-body active:bg-white/5"
    >
      戻る
    </button>
  );
}
