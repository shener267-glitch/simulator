import { Modal } from "../shared/Modal";
import { findFocus } from "../../data/focuses";
import { findTech } from "../../data/technologies";
import { findEvent } from "../../data/events";
import { findCountry } from "../../data/countries";
import type { FocusNotice } from "../../types/game";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 国家方針完了・簡易イベントの確認演出（指示書15・16章）。確認すると
 * 通常画面へ戻る——時間は一時停止のまま、再開はプレイヤーが選ぶ。
 */
export function FocusNoticeModal({ notice }: { notice: FocusNotice }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const player = findCountry(state.countries, state.playerCountryId ?? "");

  function ack() {
    dispatch({ type: "ACK_FOCUS_NOTICE" });
  }

  if (notice.kind === "focus_complete") {
    const focus = findFocus(notice.focusId);
    return (
      <Modal title={`${player?.flag ?? ""} 国家方針完了`} onClose={undefined}>
        <div className="flex flex-col gap-4 text-center">
          <p className="text-[1.05rem] font-medium text-brass">「{focus?.name ?? notice.focusId}」</p>
          <p className="text-[0.9rem] leading-[1.8] text-body">
            {player?.name ?? "政府"}は新たな方針を実行に移した。
          </p>
          <button
            type="button"
            onClick={ack}
            className="mt-1 min-h-[52px] w-full rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors hover:bg-brass/20"
          >
            確認
          </button>
        </div>
      </Modal>
    );
  }

  if (notice.kind === "tech_complete") {
    const tech = findTech(notice.techId);
    return (
      <Modal title="🔬 研究完了" onClose={undefined}>
        <div className="flex flex-col gap-4 text-center">
          <p className="text-[1.05rem] font-medium text-brass">「{tech?.name ?? notice.techId}」</p>
          <p className="text-[0.9rem] leading-[1.8] text-body">研究が完了し、新たな技術が国家に加わった。</p>
          <button
            type="button"
            onClick={ack}
            className="mt-1 min-h-[52px] w-full rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors hover:bg-brass/20"
          >
            確認
          </button>
        </div>
      </Modal>
    );
  }

  const event = findEvent(notice.eventId);
  return (
    <Modal title={event?.title ?? "イベント"} onClose={undefined}>
      <div className="flex flex-col gap-4 text-center">
        <p className="text-[0.9rem] leading-[1.8] text-body">{event?.body}</p>
        <button
          type="button"
          onClick={ack}
          className="mt-1 min-h-[52px] w-full rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors hover:bg-brass/20"
        >
          確認
        </button>
      </div>
    </Modal>
  );
}
