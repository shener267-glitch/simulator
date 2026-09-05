import { ScreenContainer } from "../shared/ScreenContainer";
import { SheetRow } from "../shared/SheetRow";
import { formatClock, formatDuration } from "../../engine/clock";
import {
  currentMeeting,
  isRunningOver,
  meetingBudget,
  offeredChoices,
  visibleBeats,
} from "../../engine/meeting";
import type { MeetingBeat } from "../../types/meeting";
import { useGameDispatch, useGameState } from "../../state/GameContext";

function Beats({ beats }: { beats: MeetingBeat[] }) {
  return (
    <div className="flex flex-col gap-5">
      {beats.map((beat, index) => (
        // 同じ文が二度出ることがあるので、本文ではなく順番で識別する。
        <div key={index}>
          {beat.speaker && (
            <p className="text-[0.8rem] font-medium tracking-wider text-brass">{beat.speaker}</p>
          )}
          <p
            className={`whitespace-pre-line text-[0.92rem] leading-[2] text-body ${
              beat.speaker ? "mt-1.5" : ""
            }`}
          >
            {beat.text}
          </p>
        </div>
      ))}
    </div>
  );
}

/**
 * 会議（設計書15章）。文章を読んで終わりにはしない。枠の中で小さな判断を
 * させる — 40分の枠に10分の話題は四つしか入らないので、何を聞かずに終える
 * かが、その会議の中身になる。
 */
export function MeetingScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();

  const current = currentMeeting(state);
  if (!current || state.mode.kind !== "meeting") return null;
  const { appointment, meeting } = current;
  const mode = state.mode;

  const budget = meetingBudget(state);
  const runningOver = isRunningOver(state);
  const showing = mode.showing
    ? meeting.choices.find((choice) => choice.id === mode.showing)
    : undefined;

  return (
    <ScreenContainer width="narrow">
      <div className="pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex items-baseline justify-between gap-3">
          <span className="figures font-figure text-[0.75rem] font-medium tracking-label text-brass">
            {formatClock(appointment.at)} — {formatClock(state.clock)}
          </span>
          <span
            className={`figures text-[0.75rem] ${runningOver ? "text-alert" : "text-body-muted"}`}
          >
            {runningOver ? "予定を超えている" : budget > 0 ? `残り${formatDuration(budget)}` : "まもなく終わり"}
          </span>
        </div>
        <h1 className="mt-2 text-[1.15rem] font-medium leading-snug text-body">{appointment.label}</h1>
      </div>

      {mode.stage === "opening" && (
        <>
          <Beats beats={visibleBeats(meeting.opening, state.flags)} />
          <button
            type="button"
            onClick={() => dispatch({ type: "MEETING_BEGIN" })}
            className="mt-1 min-h-[52px] w-full rounded-xl bg-brass px-4 text-[0.95rem] font-medium text-ink transition-colors duration-200 hover:bg-brass/90 active:bg-brass/80"
          >
            続ける
          </button>
        </>
      )}

      {mode.stage === "reply" && showing && (
        <>
          <Beats beats={visibleBeats(showing.reply, state.flags)} />
          <button
            type="button"
            onClick={() => dispatch({ type: "MEETING_BACK" })}
            className="mt-1 min-h-[52px] w-full rounded-xl bg-brass px-4 text-[0.95rem] font-medium text-ink transition-colors duration-200 hover:bg-brass/90 active:bg-brass/80"
          >
            わかった
          </button>
        </>
      )}

      {mode.stage === "choices" && (
        <>
          {meeting.prompt && (
            <p className="whitespace-pre-line text-[0.95rem] leading-[2] text-body">{meeting.prompt}</p>
          )}

          <div className="flex flex-col gap-2.5">
            {offeredChoices(state).map(({ choice, fits }) => (
              <SheetRow
                key={choice.id}
                emoji="·"
                label={choice.label}
                note={fits ? choice.note : "この会議では時間が足りない"}
                meta={formatDuration(choice.minutes)}
                disabled={!fits}
                onClick={() => dispatch({ type: "MEETING_CHOOSE", choiceId: choice.id })}
              />
            ))}
          </div>

          <button
            type="button"
            onClick={() => dispatch({ type: "END_MEETING" })}
            className="min-h-[52px] w-full rounded-xl border border-line-strong px-4 text-[0.9rem] font-medium text-body-muted transition-colors duration-200 hover:border-brass/40 hover:text-body active:bg-white/5"
          >
            会議を終える
          </button>
        </>
      )}

      {mode.stage === "closing" && (
        <>
          <Beats beats={visibleBeats(meeting.closing, state.flags)} />
          <button
            type="button"
            onClick={() => dispatch({ type: "RESOLVE_APPOINTMENT" })}
            className="mt-1 min-h-[52px] w-full rounded-xl bg-brass px-4 text-[0.95rem] font-medium text-ink transition-colors duration-200 hover:bg-brass/90 active:bg-brass/80"
          >
            席を立つ
          </button>
        </>
      )}
    </ScreenContainer>
  );
}
