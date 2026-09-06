/**
 * 国家方針（National Focus）。指示書7〜14章。HOI4型のツリー構造を
 * データとして持つ——ツリーの絵そのものは`position`から描く。
 */
export type FocusEffect =
  | { type: "add_political_power"; amount: number }
  | { type: "modify_political_power_gain"; amount: number }
  | { type: "modify_stability"; amount: number }
  | { type: "modify_government_support"; amount: number }
  | { type: "modify_party_popularity"; partyId: string; amount: number }
  | { type: "add_national_modifier"; id: string; label: string }
  | { type: "trigger_event"; eventId: string }
  | { type: "unlock_focus"; focusId: string }
  /** 研究速度への加算ボーナス(%)。指示書19章、国家方針と研究の接続。 */
  | { type: "modify_research_speed"; amount: number };

export interface FocusTemplate {
  id: string;
  name: string;
  description: string;
  /** 所要日数。 */
  durationDays: number;
  /** これらをすべて完了していないと選べない（AND条件、指示書12章）。 */
  prerequisites: string[];
  /** 開始に必要な政治力。 */
  politicalPowerCost: number;
  /** 完了時に一度だけ適用される効果。 */
  effects: FocusEffect[];
  /**
   * 前提条件を満たしていても、`unlock_focus`効果で明示的に解禁されるまでは
   * 選べない特別な方針（指示書14章のunlock_focusのための仕掛け）。
   */
  requiresUnlock?: boolean;
  /** ツリー上の座標。 */
  position: { x: number; y: number };
}

export interface FocusProgress {
  focusId: string;
  /** 経過日数。ゲーム内分から換算して積み上げる。 */
  daysElapsed: number;
}
