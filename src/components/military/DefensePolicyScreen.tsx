import { Panel } from "../shared/Panel";
import { MOBILIZATION_LABELS, MOBILIZATION_ORDER, MOBILIZATION_POLITICAL_POWER_COST, READINESS_LABELS, READINESS_ORDER, READINESS_POLITICAL_POWER_COST } from "../../engine/military";
import type { ConscriptionPolicyId, MobilizationState, ReadinessLevel } from "../../types/military";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const CONSCRIPTION_LABELS: Record<ConscriptionPolicyId, string> = { volunteer: "志願制", draft: "徴兵制", reserve_expansion: "予備役拡充" };
const DOCTRINE_TECH_IDS = ["bousei-jushi", "kidou-jushi", "kaiyou-bouei", "koukuu-yuusei", "tougou-bouei-doctrine"] as const;
const DOCTRINE_LABELS: Record<(typeof DOCTRINE_TECH_IDS)[number], string> = {
  "bousei-jushi": "🛡 防勢重視",
  "kidou-jushi": "⚡ 機動重視",
  "kaiyou-bouei": "🌊 海洋防衛",
  "koukuu-yuusei": "✈️ 航空優勢",
  "tougou-bouei-doctrine": "🛰 統合防衛",
};

/** 防衛政策画面（指示書11・12・13・18章）。防衛態勢・動員・徴募制度・ドクトリンをまとめる。 */
export function DefensePolicyScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const { readiness, mobilization, conscriptionPolicy } = state.military;
  const politicalPower = state.politics.stats.politicalPower;

  return (
    <Panel title="⚙️ 防衛政策" onClose={onClose}>
      <div className="flex flex-col gap-6 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">🛡 防衛態勢</p>
          <p className="mb-2 text-[0.78rem] text-body-muted">上げるほど即応能力は上がるが、経済・外交への負担も増える。引き下げは無償。</p>
          <div className="flex flex-col gap-1.5">
            {READINESS_ORDER.map((level) => {
              const active = level === readiness;
              const escalating = READINESS_ORDER.indexOf(level) > READINESS_ORDER.indexOf(readiness);
              const cost = escalating ? READINESS_POLITICAL_POWER_COST[level] : 0;
              const disabled = active || (escalating && politicalPower < cost);
              return (
                <button
                  key={level}
                  type="button"
                  disabled={disabled}
                  onClick={() => dispatch({ type: "SET_READINESS", level: level as ReadinessLevel })}
                  className={`flex min-h-[48px] items-center justify-between rounded-lg border px-3.5 text-left text-[0.9rem] transition-colors ${
                    active ? "border-brass bg-brass/15 text-brass" : "border-line text-body enabled:hover:border-brass/40"
                  } disabled:opacity-40`}
                >
                  <span>{READINESS_LABELS[level]}</span>
                  {!active && cost > 0 && <span className="figures text-[0.75rem] text-body-muted">PP{cost}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">⚠️ 動員</p>
          <p className="mb-2 text-[0.78rem] text-body-muted">動員には時間がかかる——人員の充足はゆるやかに進む。経済・社会への負担を伴う。</p>
          <div className="flex flex-col gap-1.5">
            {MOBILIZATION_ORDER.map((level) => {
              const active = level === mobilization;
              const escalating = MOBILIZATION_ORDER.indexOf(level) > MOBILIZATION_ORDER.indexOf(mobilization);
              const cost = escalating ? MOBILIZATION_POLITICAL_POWER_COST[level] : 0;
              const disabled = active || (escalating && politicalPower < cost);
              return (
                <button
                  key={level}
                  type="button"
                  disabled={disabled}
                  onClick={() => dispatch({ type: "SET_MOBILIZATION", state: level as MobilizationState })}
                  className={`flex min-h-[48px] items-center justify-between rounded-lg border px-3.5 text-left text-[0.9rem] transition-colors ${
                    active ? "border-brass bg-brass/15 text-brass" : "border-line text-body enabled:hover:border-brass/40"
                  } disabled:opacity-40`}
                >
                  <span>{MOBILIZATION_LABELS[level]}</span>
                  {!active && cost > 0 && <span className="figures text-[0.75rem] text-body-muted">PP{cost}</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">徴募制度</p>
          <p className="mb-2 text-[0.78rem] text-body-muted">2024年10月時点の日本は志願制。制度変更は政治システムと接続する。</p>
          <div className="flex flex-col gap-1.5">
            {(Object.keys(CONSCRIPTION_LABELS) as ConscriptionPolicyId[]).map((policy) => {
              const active = policy === conscriptionPolicy;
              return (
                <button
                  key={policy}
                  type="button"
                  disabled={active || politicalPower < 20}
                  onClick={() => dispatch({ type: "SET_CONSCRIPTION_POLICY", policy })}
                  className={`flex min-h-[48px] items-center justify-between rounded-lg border px-3.5 text-left text-[0.9rem] transition-colors ${
                    active ? "border-brass bg-brass/15 text-brass" : "border-line text-body enabled:hover:border-brass/40"
                  } disabled:opacity-40`}
                >
                  <span>{CONSCRIPTION_LABELS[policy]}</span>
                  {!active && <span className="figures text-[0.75rem] text-body-muted">PP20</span>}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="mb-2 text-[0.75rem] font-medium tracking-wider text-brass">軍事ドクトリン</p>
          <p className="mb-2 text-[0.78rem] text-body-muted">研究システムと接続する——🔬研究画面の研究ツリーから研究できる。</p>
          <div className="flex flex-wrap gap-1.5">
            {DOCTRINE_TECH_IDS.map((id) => {
              const done = state.research.completedTechIds.includes(id);
              return (
                <span key={id} className={`rounded border px-2.5 py-1.5 text-[0.78rem] ${done ? "border-brass/40 bg-brass/10 text-brass" : "border-line text-body-muted"}`}>
                  {DOCTRINE_LABELS[id]} {done && "✅"}
                </span>
              );
            })}
          </div>
        </div>
      </div>
    </Panel>
  );
}
