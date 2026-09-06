import { useState } from "react";
import { ScreenContainer } from "../shared/ScreenContainer";
import { formatDateTime } from "../../engine/clock";
import type { Speed } from "../../types/clock";
import { useGameDispatch, useGameState } from "../../state/GameContext";
import { ReportSheet } from "../reports/ReportSheet";
import { PolicySheet } from "../policies/PolicySheet";
import { GovernmentSheet } from "../nation/GovernmentSheet";
import { ScheduleSheet } from "../schedule/ScheduleSheet";
import { EventModal } from "../event/EventModal";

const SPEEDS: Speed[] = [1, 2, 5, 10];

type SheetKind = "reports" | "policies" | "government" | "schedule" | null;

function NationStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-ink-panel px-3 py-2.5">
      <p className="text-[0.7rem] text-body-muted">{label}</p>
      <p className="figures mt-0.5 text-[0.95rem] font-medium text-body">{value}</p>
    </div>
  );
}

export function MainScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [sheet, setSheet] = useState<SheetKind>(null);

  const unreadUrgent = state.reports.some((r) => r.urgent && r.at <= state.clock.totalMinutes && !r.read);
  const undecided = state.policies.some(
    (p) =>
      !p.decided &&
      p.from <= state.clock.totalMinutes &&
      (!p.requiresFlags || p.requiresFlags.every((flag) => state.flags.includes(flag))),
  );
  const nation = state.nation;

  return (
    <ScreenContainer width="normal">
      <div className="pt-[calc(1rem+env(safe-area-inset-top))]">
        <div className="flex items-center justify-between gap-3">
          <span className="figures text-[0.95rem] font-medium tracking-wide text-body">
            {formatDateTime(state.clock.totalMinutes)}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => dispatch(state.clock.running ? { type: "PAUSE" } : { type: "PLAY" })}
              className="flex h-9 min-w-[44px] items-center justify-center rounded-lg border border-line-strong px-3 text-[0.85rem] font-medium text-body transition-colors hover:border-brass/40"
            >
              {state.clock.running ? "Ⅱ" : "▶"}
            </button>
            {SPEEDS.map((speed) => (
              <button
                key={speed}
                type="button"
                onClick={() => dispatch({ type: "SET_SPEED", speed })}
                className={`figures flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-2 text-[0.8rem] transition-colors ${
                  state.clock.speed === speed
                    ? "border-brass bg-brass/15 text-brass"
                    : "border-line text-body-muted hover:border-line-strong"
                }`}
              >
                {speed}×
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <NationStat label="支持率" value={`${nation.approval}%`} />
        <NationStat label="実質成長率" value={`${nation.growthRate}%`} />
        <NationStat label="物価上昇率" value={`${nation.cpi}%`} />
        <NationStat label="完全失業率" value={`${nation.unemployment}%`} />
        <NationStat label="政府債務" value={`${nation.govDebtTrillionYen}兆円`} />
        <NationStat label="周辺情勢" value={nation.regionalTension} />
      </div>

      <div className="flex flex-col gap-2.5">
        <button
          type="button"
          onClick={() => setSheet("reports")}
          className="flex min-h-[52px] items-center justify-between rounded-xl border border-line bg-ink-panel px-4 text-left text-[0.9rem] font-medium text-body transition-colors hover:border-brass/40"
        >
          <span>📄 報告書</span>
          {unreadUrgent && <span className="figures text-[0.75rem] text-alert">緊急あり</span>}
        </button>
        <button
          type="button"
          onClick={() => setSheet("policies")}
          className="flex min-h-[52px] items-center justify-between rounded-xl border border-line bg-ink-panel px-4 text-left text-[0.9rem] font-medium text-body transition-colors hover:border-brass/40"
        >
          <span>📜 政策</span>
          {undecided && <span className="figures text-[0.75rem] text-brass">未決定あり</span>}
        </button>
        <button
          type="button"
          onClick={() => setSheet("schedule")}
          className="flex min-h-[52px] items-center rounded-xl border border-line bg-ink-panel px-4 text-left text-[0.9rem] font-medium text-body transition-colors hover:border-brass/40"
        >
          🗓️ 予定
        </button>
        <button
          type="button"
          onClick={() => setSheet("government")}
          className="flex min-h-[52px] items-center rounded-xl border border-line bg-ink-panel px-4 text-left text-[0.9rem] font-medium text-body transition-colors hover:border-brass/40"
        >
          🏛️ 国家の窓（省庁・国会・外交）
        </button>
      </div>

      <div className="flex flex-col gap-3 pb-4">
        <p className="text-[0.75rem] font-medium tracking-wider text-brass">最新情報</p>
        <div className="flex flex-col gap-2.5">
          {[...state.feed]
            .slice(-30)
            .reverse()
            .map((entry) => (
              <div key={entry.id} className="flex items-start gap-2.5">
                <span aria-hidden>{entry.icon}</span>
                <p className="flex-1 text-[0.85rem] leading-[1.8] text-body-muted">{entry.text}</p>
              </div>
            ))}
        </div>
      </div>

      {sheet === "reports" && <ReportSheet onClose={() => setSheet(null)} />}
      {sheet === "policies" && <PolicySheet onClose={() => setSheet(null)} />}
      {sheet === "schedule" && <ScheduleSheet onClose={() => setSheet(null)} />}
      {sheet === "government" && <GovernmentSheet onClose={() => setSheet(null)} />}
      {state.mode.kind === "event" && <EventModal />}
    </ScreenContainer>
  );
}
