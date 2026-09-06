import type { PoliticsState } from "../types/game";
import { AUTO_COMPLETED_FOCUS_IDS } from "../data/focuses";
import { PARTIES } from "../data/parties";

/**
 * 開始時点の政治状況（指示書1〜6章）。
 *
 * 【事実】2024年10月1日時点の内閣総理大臣は石破茂、内閣は石破内閣。
 * 【ゲーム上の設定】政治力・政府支持率・安定度の初期値は、指示書中の
 * 数値例（政治力125、支持率62%、安定度71%）をそのまま初期値として
 * 使うと「すでにしばらく経過した状態」に見えてしまうため、切りのよい
 * 控えめな値から始めている。
 *
 * 日本以外の国は、Phase 2ではまだ政党データも国家方針も用意していない
 * （指示書18章のとおり、国家方針の「日本化」に向けた土台をまず日本で
 * 作る段階のため）。
 */
export function createPoliticsState(countryId: string): PoliticsState {
  if (countryId === "JPN") {
    return {
      leader: { name: "石破 茂", cabinetName: "石破内閣" },
      stats: { politicalPower: 0, politicalPowerPerDay: 2, governmentSupport: 51, stability: 65 },
      parties: PARTIES.map((party) => ({ ...party })),
      completedFocusIds: [...AUTO_COMPLETED_FOCUS_IDS],
      unlockedFocusIds: [],
      activeFocus: null,
      modifiers: [],
      pendingNotices: [],
    };
  }

  return {
    leader: { name: "—", cabinetName: "—" },
    stats: { politicalPower: 0, politicalPowerPerDay: 2, governmentSupport: 50, stability: 60 },
    parties: [],
    completedFocusIds: [],
    unlockedFocusIds: [],
    activeFocus: null,
    modifiers: [],
    pendingNotices: [],
  };
}
