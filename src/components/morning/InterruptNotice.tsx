import { Modal } from "../shared/Modal";
import { formatClock, formatDuration } from "../../engine/clock";
import type { InterruptChoice } from "../../types/game";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const CHOICES: { id: InterruptChoice; label: string; note: string }[] = [
  { id: "answer", label: "中断して確認する", note: "手を止めて出る" },
  { id: "defer", label: "後回しにする", note: "あとで読む" },
  { id: "ignore", label: "無視する", note: "出ない" },
];

/**
 * 行動の途中で届く連絡（設計書26章）。予定と違って時間は切らない。
 * 中身は出て初めて読める — 何の件かを見てから出るかどうかを決められては、
 * 選ばせる意味がないので。
 */
export function InterruptNotice() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const mode = state.mode;
  if (mode.kind !== "interrupt") return null;
  const interrupt = state.interrupts.find((candidate) => candidate.id === mode.interruptId);
  if (!interrupt) return null;

  return (
    <Modal title={interrupt.title} urgent>
      <div className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-3">
          <span className="figures font-figure text-[0.8rem] font-medium text-alert">
            {formatClock(interrupt.at)}
          </span>
          <span className="text-[0.78rem] tracking-wider text-body-muted">{interrupt.from}</span>
        </div>

        {(mode.answered ? interrupt.body : interrupt.teaser).map((line) => (
          <p key={line} className="text-[0.92rem] leading-[2] text-body">
            {line}
          </p>
        ))}

        {mode.answered && interrupt.movesAppointment && (
          <p className="rounded-xl border border-alert/30 bg-alert/10 px-4 py-3 text-[0.85rem] leading-[1.9] text-alert">
            {interrupt.movesAppointment.note}
          </p>
        )}

        {mode.answered ? (
          <button
            type="button"
            onClick={() => dispatch({ type: "CLOSE_INTERRUPT" })}
            className="min-h-[52px] w-full rounded-xl border border-line-strong px-4 text-[0.95rem] font-medium text-body transition-colors duration-200 hover:border-brass/40 active:bg-white/5"
          >
            わかった
          </button>
        ) : (
          <div className="flex flex-col gap-2.5">
            {CHOICES.map((choice) => (
              <button
                key={choice.id}
                type="button"
                onClick={() => dispatch({ type: "ANSWER_INTERRUPT", choice: choice.id })}
                className="flex min-h-[56px] w-full items-center justify-between gap-3 rounded-xl border border-line bg-ink-panel px-4 py-3 text-left transition-colors duration-200 hover:border-brass/40 hover:bg-ink-raised active:bg-ink-raised"
              >
                <span className="min-w-0">
                  <span className="block text-[0.95rem] font-medium text-body">{choice.label}</span>
                  <span className="mt-0.5 block text-[0.75rem] text-body-muted">{choice.note}</span>
                </span>
                <span className="figures shrink-0 text-[0.78rem] text-body-muted">
                  {choice.id === "answer" ? formatDuration(interrupt.minutes) : "0分"}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Modal>
  );
}
