import { useState, type MouseEvent } from "react";
import { formatClock } from "../../engine/clock";
import { describeCondition } from "../../engine/condition";
import { MORNING_DATE_STAMP, WAKE_BEATS } from "../../data/briefing";
import { useTypewriter } from "../../hooks/useTypewriter";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/** Stable identity so the typewriter does not restart on beats without text. */
const NO_LINES: string[] = [];

/**
 * The 05:00 opening: a handful of short cuts rather than one block of prose,
 * advanced a screen at a time. Tapping mid-sentence finishes it; tapping again
 * moves on. Nothing here costs the player any time — 起床 is a zero-minute
 * appointment, and this is only how it is presented.
 */
export function WakeScene() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [index, setIndex] = useState(0);

  const beat = WAKE_BEATS[index];
  const isLast = index === WAKE_BEATS.length - 1;
  const typer = useTypewriter(beat.kind === "line" || beat.kind === "notification" ? beat.lines : NO_LINES);

  function advance() {
    if (!typer.done) {
      typer.skip();
      return;
    }
    if (isLast) {
      dispatch({ type: "RESOLVE_APPOINTMENT" });
      return;
    }
    setIndex((current) => current + 1);
  }

  function advanceFromButton(event: MouseEvent) {
    event.stopPropagation();
    advance();
  }

  // The line still being typed carries the caret.
  const typingLine = typer.revealed.findIndex(
    (text, line) => text.length < (beat.kind === "line" || beat.kind === "notification" ? beat.lines[line].length : 0),
  );

  return (
    <div
      onClick={advance}
      className="dawn-vignette tap-quiet flex min-h-[100dvh] cursor-pointer select-none flex-col bg-ink px-6 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-[calc(2rem+env(safe-area-inset-top))]"
    >
      <div key={index} className="flex flex-1 animate-fade-in flex-col justify-center">
        {beat.kind === "clock" && (
          <div className="animate-fade-in-slow text-center">
            <p className="figures font-figure text-[4.5rem] font-extralight leading-none tracking-tight text-body">
              {formatClock(state.clock)}
            </p>
            <p className="figures mt-5 font-figure text-[0.7rem] font-normal tracking-label text-brass">
              {MORNING_DATE_STAMP}
            </p>
          </div>
        )}

        {beat.kind === "line" && (
          <div className="mx-auto flex w-full max-w-md flex-col gap-5">
            {typer.revealed.map((text, line) => (
              <p key={beat.lines[line]} className="text-[1.05rem] leading-[2] text-body">
                {text}
                {typingLine === line && <Caret />}
              </p>
            ))}
          </div>
        )}

        {beat.kind === "condition" && (
          <div className="mx-auto w-full max-w-md animate-fade-up rounded-2xl border border-line bg-ink-panel p-6">
            <p className="font-figure text-[0.65rem] font-medium tracking-label text-brass">CONDITION</p>
            <div className="mt-4 flex flex-col gap-3">
              {describeCondition(state.condition).map((line) => (
                <p key={line} className="text-[1rem] leading-[1.95] text-body">
                  {line}
                </p>
              ))}
            </div>
          </div>
        )}

        {beat.kind === "notification" && (
          <div className="mx-auto flex w-full max-w-md flex-col gap-8">
            <div className="flex flex-col gap-5">
              {typer.revealed.map((text, line) => (
                <p key={beat.lines[line]} className="text-[1.05rem] leading-[2] text-body">
                  {text}
                  {typingLine === line && <Caret />}
                </p>
              ))}
            </div>

            {typer.done && (
              <div className="overflow-hidden rounded-2xl border border-line bg-ink-panel">
                {beat.apps.map((app, position) => (
                  <div
                    key={app}
                    style={{ animationDelay: `${position * 110}ms` }}
                    className="animate-fade-up border-b border-line px-4 py-3.5 last:border-b-0"
                  >
                    <p className="text-[0.7rem] font-medium tracking-wider text-body-muted">{app}</p>
                    <div className="mt-2 h-1.5 rounded-full bg-body-faint/25" style={{ width: `${72 - position * 16}%` }} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mx-auto flex w-full max-w-md flex-col items-center gap-6">
        <div className="flex gap-1.5">
          {WAKE_BEATS.map((_, position) => (
            <span
              key={position}
              className={`h-px w-5 transition-colors duration-500 ${
                position === index ? "bg-brass" : position < index ? "bg-brass/25" : "bg-line-strong"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={advanceFromButton}
          className={`min-h-[52px] w-full rounded-xl px-4 text-[0.95rem] font-medium transition-colors duration-200 ${
            isLast && typer.done
              ? "bg-brass text-ink hover:bg-brass/90 active:bg-brass/80"
              : "border border-line-strong text-body-muted hover:border-brass/40 hover:text-body active:bg-white/5"
          }`}
        >
          {!typer.done ? "すべて表示" : isLast ? "起きる" : "次へ"}
        </button>
      </div>
    </div>
  );
}

function Caret() {
  return <span className="ml-1 inline-block h-[1.05em] w-px translate-y-[0.18em] animate-caret bg-brass align-baseline" />;
}
