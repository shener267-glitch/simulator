/** 研究カテゴリー（指示書14章、Phase 5で軍事研究を追加）。 */
export type ResearchCategory = "basic_science" | "computing_ai" | "energy" | "industry" | "aerospace" | "military";

export type TechEffect =
  | { type: "modify_research_speed"; amount: number }
  | { type: "modify_political_power_gain"; amount: number }
  | { type: "add_national_modifier"; id: string; label: string }
  | { type: "unlock_tech"; techId: string }
  /** 陸海空・ミサイル・その他の能力指数。Phase 5指示書19・30章、研究↔軍事の接続。 */
  | { type: "modify_military_capability"; category: "land" | "sea" | "air" | "missile" | "other"; amount: number };

export interface TechTemplate {
  id: string;
  name: string;
  category: ResearchCategory;
  description: string;
  durationDays: number;
  /** これらをすべて完了していないと選べない（AND条件）。 */
  prerequisites: string[];
  effects: TechEffect[];
  /** 前提条件を満たしても、`unlock_tech`効果で明示的に解禁されるまでは選べない。 */
  requiresUnlock?: boolean;
  /** ツリー上の座標。 */
  position: { x: number; y: number };
}

export interface ResearchProgress {
  techId: string;
  daysElapsed: number;
}
