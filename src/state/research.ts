import type { ResearchState } from "../types/game";
import { AUTO_COMPLETED_TECH_IDS } from "../data/technologies";

/**
 * 開始時点の研究状況（指示書12章）。研究枠は基本2——将来的に研究機関・
 * 大学・予算・国家方針で増減できる構造にしてある（指示書12章）。
 * 「基礎科学」は最初から完了扱い——これが無いと、根を前提条件に持つ
 * どの技術も永遠に選べなくなる。
 */
export function createResearchState(): ResearchState {
  return {
    slots: 2,
    active: [],
    completedTechIds: [...AUTO_COMPLETED_TECH_IDS],
    unlockedTechIds: [],
    speedBonusPercent: 0,
    modifiers: [],
  };
}
