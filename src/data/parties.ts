import type { Party } from "../types/politics";

/**
 * 2024年10月1日時点の衆議院勢力を土台にした政党データ（指示書5章）。
 *
 * 【参考】議席数はおおよその値——同年10月末の解散・総選挙の直前、
 * 2021年選挙以来の勢力に会派異動を加味した概算。支持率も同時期の
 * 世論調査のおおまかな水準に寄せた概算で、特定の一社の調査値を
 * そのまま使ってはいない。`governmentSupport`（政権への協力度）は
 * ゲーム上の設定——自民・公明の連立を軸に、野党をおおまかな距離感で
 * 数値化しただけのもの。
 */
export const PARTIES: Party[] = [
  {
    id: "ldp",
    name: "自由民主党",
    ideology: "保守",
    seats: 256,
    popularity: 28,
    governmentSupport: 100,
    factionRelations: {},
  },
  {
    id: "cdp",
    name: "立憲民主党",
    ideology: "中道左派",
    seats: 98,
    popularity: 7,
    governmentSupport: 15,
    factionRelations: {},
  },
  {
    id: "ishin",
    name: "日本維新の会",
    ideology: "保守改革",
    seats: 44,
    popularity: 5,
    governmentSupport: 20,
    factionRelations: {},
  },
  {
    id: "komeito",
    name: "公明党",
    ideology: "中道",
    seats: 32,
    popularity: 4,
    governmentSupport: 90,
    factionRelations: {},
  },
  {
    id: "jcp",
    name: "日本共産党",
    ideology: "共産主義",
    seats: 10,
    popularity: 3,
    governmentSupport: 5,
    factionRelations: {},
  },
  {
    id: "dpfp",
    name: "国民民主党",
    ideology: "中道",
    seats: 7,
    popularity: 3,
    governmentSupport: 30,
    factionRelations: {},
  },
  {
    id: "reiwa",
    name: "れいわ新選組",
    ideology: "左派",
    seats: 3,
    popularity: 2,
    governmentSupport: 5,
    factionRelations: {},
  },
  {
    id: "sdp",
    name: "社会民主党",
    ideology: "社会民主主義",
    seats: 1,
    popularity: 1,
    governmentSupport: 10,
    factionRelations: {},
  },
];
