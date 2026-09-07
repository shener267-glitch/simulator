import { Modal } from "../shared/Modal";
import { findCountry } from "../../data/countries";
import { findDiplomaticCrisis, findDiplomaticNews } from "../../data/diplomacy";
import type { DiplomaticNotice } from "../../types/diplomacy";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 外交の通知（Phase 4指示書9・18・25章）。国家方針・研究の完了通知
 * （`FocusNoticeModal`）と違い、「確認するだけ」では終わらないものがある
 * ——首脳会談の招請には承諾／延期／辞退、国際危機には短い対応選択肢を持つ。
 */
export function DiplomaticNoticeModal({ notice }: { notice: DiplomaticNotice }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  if (notice.kind === "summit_invite") {
    const country = findCountry(state.countries, notice.countryId);
    return (
      <Modal title="🤝 首脳会談" onClose={undefined}>
        <div className="flex flex-col gap-4 text-center">
          <p className="text-[0.9rem] leading-[1.8] text-body">
            {country?.flag} {country?.name ?? notice.countryId}との首脳会談の準備が整った。開催日程の確認が来ている。
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "RESPOND_SUMMIT_INVITE", response: "accept" })}
              className="min-h-[52px] rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors hover:bg-brass/20"
            >
              開催する
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "RESPOND_SUMMIT_INVITE", response: "reschedule" })}
              className="min-h-[52px] rounded border border-line text-[0.9rem] text-body-muted transition-colors hover:border-line-strong"
            >
              延期する
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "RESPOND_SUMMIT_INVITE", response: "decline" })}
              className="min-h-[52px] rounded border border-line text-[0.9rem] text-body-muted transition-colors hover:border-line-strong"
            >
              辞退する
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  if (notice.kind === "international_crisis") {
    const crisis = findDiplomaticCrisis(notice.crisisId);
    return (
      <Modal title={crisis?.title ?? "国際危機"} onClose={undefined} urgent>
        <div className="flex flex-col gap-4 text-center">
          <p className="text-[0.9rem] leading-[1.8] text-body">{crisis?.body}</p>
          <div className="flex flex-col gap-2">
            {crisis?.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => dispatch({ type: "RESPOND_DIPLOMATIC_CRISIS", optionId: option.id })}
                className="min-h-[52px] rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors hover:bg-brass/20"
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </Modal>
    );
  }

  const news = findDiplomaticNews(notice.eventId);
  return (
    <Modal title={news?.title ?? "国際ニュース"} onClose={undefined}>
      <div className="flex flex-col gap-4 text-center">
        <p className="text-[0.9rem] leading-[1.8] text-body">{news?.body}</p>
        <button
          type="button"
          onClick={() => dispatch({ type: "ACK_DIPLOMATIC_NOTICE" })}
          className="mt-1 min-h-[52px] w-full rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors hover:bg-brass/20"
        >
          確認
        </button>
      </div>
    </Modal>
  );
}
