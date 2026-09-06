import { Modal } from "../shared/Modal";
import { findCrisis } from "../../data/crises/catalogue";
import { formatDateTime } from "../../engine/clock";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 危機イベントの通知（設計書16章）。届いた瞬間にゲームを自動停止して見せる
 * ——ここでは詳しい対応は選ばせない。まず「何が起きたか」を知らせるだけ。
 */
export function EventModal() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  if (state.mode.kind !== "event") return null;
  const crisisId = state.mode.crisisId;

  const fired = state.crises.find((c) => c.id === crisisId);
  const crisis = fired ? findCrisis(fired.templateId) : undefined;

  return (
    <Modal title="緊急" urgent onClose={undefined}>
      <div className="flex flex-col gap-4">
        <p className="figures text-[0.75rem] text-body-muted">{fired ? formatDateTime(fired.firedAt) : ""}</p>
        <p className="text-[1.05rem] font-medium text-body">{crisis?.label ?? "不明な事態"}</p>
        {crisis?.note && <p className="whitespace-pre-line text-[0.9rem] leading-[1.9] text-body-muted">{crisis.note}</p>}
        <p className="text-[0.85rem] text-body-muted">関係省庁: {crisis?.ministries.join("、") || "—"}</p>
        <button
          type="button"
          onClick={() => dispatch({ type: "ACK_CRISIS" })}
          className="mt-1 min-h-[52px] w-full rounded-xl bg-alert px-4 text-[0.95rem] font-medium text-ink transition-colors duration-200 hover:bg-alert/90 active:bg-alert/80"
        >
          報告を受けた
        </button>
      </div>
    </Modal>
  );
}
