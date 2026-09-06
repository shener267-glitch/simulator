import { useState } from "react";
import { Modal } from "../shared/Modal";
import { SheetRow } from "../shared/SheetRow";
import { useGameDispatch, useGameState } from "../../state/GameContext";
import type { PolicyDecision, PolicyOption } from "../../types/game";

/**
 * 政策決定（設計書29章）。**正解を用意しない。** 選択肢はどれも長所と短所を
 * 文章で書くだけで、選んだ結果はしばらく経ってから静かに反映される。
 */
export function PolicySheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const [openId, setOpenId] = useState<string | null>(null);

  const available = state.policies.filter(
    (policy) =>
      policy.from <= state.clock.totalMinutes &&
      (!policy.requiresFlags || policy.requiresFlags.every((flag) => state.flags.includes(flag))),
  );
  const open = available.find((policy) => policy.id === openId);

  if (open) {
    return (
      <Modal title={open.title} onClose={() => setOpenId(null)}>
        <PolicyDetail policy={open} onDecided={() => setOpenId(null)} />
      </Modal>
    );
  }

  return (
    <Modal title="政策" onClose={onClose}>
      {available.length === 0 ? (
        <p className="py-6 text-center text-[0.85rem] text-body-muted">まだ決めるべき政策は上がっていない。</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {available.map((policy) => (
            <SheetRow
              key={policy.id}
              emoji={policy.decided ? "✅" : "📜"}
              label={policy.title}
              note={policy.decided ? `決定済み: ${policy.options.find((o) => o.id === policy.decided)?.label}` : "未決定"}
              onClick={() => setOpenId(policy.id)}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}

function PolicyDetail({ policy, onDecided }: { policy: PolicyDecision; onDecided: () => void }) {
  const dispatch = useGameDispatch();
  const decidedOption = policy.options.find((o) => o.id === policy.decided);

  return (
    <div className="flex flex-col gap-4">
      <p className="whitespace-pre-line text-[0.9rem] leading-[1.9] text-body">{policy.prompt}</p>

      {decidedOption ? (
        <div className="rounded-xl border border-affirm/30 bg-affirm/10 p-4">
          <p className="text-[0.85rem] font-medium text-affirm">決定: {decidedOption.label}</p>
          <p className="mt-1 text-[0.85rem] leading-[1.8] text-body-muted">{decidedOption.summary}</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {policy.options.map((option) => (
            <OptionRow
              key={option.id}
              option={option}
              onChoose={() => {
                dispatch({ type: "DECIDE_POLICY", policyId: policy.id, optionId: option.id });
                onDecided();
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function OptionRow({ option, onChoose }: { option: PolicyOption; onChoose: () => void }) {
  return (
    <button
      type="button"
      onClick={onChoose}
      className="flex flex-col gap-1.5 rounded-xl border border-line bg-ink-panel px-4 py-3.5 text-left transition-colors duration-200 hover:border-brass/40 hover:bg-ink-raised active:bg-ink-raised"
    >
      <span className="text-[0.95rem] font-medium text-body">{option.label}</span>
      <span className="text-[0.85rem] leading-[1.8] text-body-muted">{option.summary}</span>
    </button>
  );
}
