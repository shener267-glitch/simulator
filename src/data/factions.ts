import type { FactionDef, CountryDef, FamilyMemberDef } from "../types/politician";

export const factionDefs: FactionDef[] = [
  {
    id: "mainstream",
    name: "保守主流派",
    leaderName: "田中 剛造",
    personality: "pragmatic",
    initialSeatShare: 0.4,
    initialLoyalty: 65,
  },
  {
    id: "reform",
    name: "改革派",
    leaderName: "水野 志保",
    personality: "reformist",
    initialSeatShare: 0.25,
    initialLoyalty: 55,
  },
  {
    id: "fiscal_hawks",
    name: "財政規律派",
    leaderName: "黒田 修一",
    personality: "hawkish",
    initialSeatShare: 0.2,
    initialLoyalty: 50,
  },
  {
    id: "moderates",
    name: "中間派",
    leaderName: "小林 蓮",
    personality: "dovish",
    initialSeatShare: 0.15,
    initialLoyalty: 60,
  },
];

export const countryDefs: CountryDef[] = [
  { id: "us", name: "アメリカ", initialRelation: 65 },
  { id: "china", name: "中国", initialRelation: 45 },
  { id: "korea", name: "韓国", initialRelation: 55 },
];

export const familyDefs: FamilyMemberDef[] = [
  { id: "spouse", name: "総理の配偶者", relation: "配偶者", initialRelationship: 70 },
  { id: "daughter", name: "長女", relation: "長女", initialRelationship: 65 },
  { id: "son", name: "長男", relation: "長男", initialRelationship: 60 },
];

export const INITIAL_DIET_SEATS = 465;
