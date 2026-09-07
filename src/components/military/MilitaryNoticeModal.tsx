import { Modal } from "../shared/Modal";
import { findCountry } from "../../data/countries";
import { findMilitaryEvent } from "../../data/military";
import type { MilitaryNotice } from "../../types/military";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 軍事の通知（Phase 5指示書22・23・31・32章）。平時の軍事イベントは
 * 選択肢を持つものと、確認するだけのものがある。武力攻撃は必ず短い
 * 対応選択肢を持つ——戦争そのものはこの通知が立った時点ですでに始まっている。
 */
export function MilitaryNoticeModal({ notice }: { notice: MilitaryNotice }) {
  const state = useGameState();
  const dispatch = useGameDispatch();

  if (notice.kind === "armed_attack") {
    const enemy = findCountry(state.countries, notice.enemyCountryId);
    return (
      <Modal title="⚠️ 武力攻撃" onClose={undefined} urgent>
        <div className="flex flex-col gap-4 text-center">
          <p className="text-[0.9rem] leading-[1.8] text-body">
            {enemy?.flag ?? ""} {enemy?.name ?? notice.enemyCountryId}による、日本領域への武力攻撃を確認した。政府は対応を決定しなければならない。
          </p>
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => dispatch({ type: "RESPOND_ARMED_ATTACK", response: "defend" })}
              className="min-h-[52px] rounded border border-alert/60 bg-alert/10 text-[0.9rem] font-medium text-alert transition-colors hover:bg-alert/20"
            >
              🛡 防衛作戦を発動する
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "RESPOND_ARMED_ATTACK", response: "request_ally_support" })}
              className="min-h-[52px] rounded border border-brass/60 bg-brass/10 text-[0.9rem] font-medium text-brass transition-colors hover:bg-brass/20"
            >
              🤝 同盟国へ支援要請する
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "RESPOND_ARMED_ATTACK", response: "issue_statement" })}
              className="min-h-[52px] rounded border border-line text-[0.9rem] text-body-muted transition-colors hover:border-line-strong"
            >
              🌍 国際社会へ声明を出す
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "RESPOND_ARMED_ATTACK", response: "diplomatic_talks" })}
              className="min-h-[52px] rounded border border-line text-[0.9rem] text-body-muted transition-colors hover:border-line-strong"
            >
              📞 外交交渉を試みる
            </button>
          </div>
        </div>
      </Modal>
    );
  }

  const template = findMilitaryEvent(notice.eventId);

  if (template && template.options.length > 0) {
    return (
      <Modal title={template.title} onClose={undefined}>
        <div className="flex flex-col gap-4 text-center">
          <p className="text-[0.9rem] leading-[1.8] text-body">{template.body}</p>
          <div className="flex flex-col gap-2">
            {template.options.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => dispatch({ type: "RESPOND_MILITARY_EVENT", optionId: option.id })}
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

  return (
    <Modal title={template?.title ?? "軍事情報"} onClose={undefined}>
      <div className="flex flex-col gap-4 text-center">
        <p className="text-[0.9rem] leading-[1.8] text-body">{template?.body}</p>
        <button
          type="button"
          onClick={() => dispatch({ type: "ACK_MILITARY_NOTICE" })}
          className="mt-1 min-h-[52px] w-full rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors hover:bg-brass/20"
        >
          確認
        </button>
      </div>
    </Modal>
  );
}
