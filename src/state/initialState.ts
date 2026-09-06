import type { GameState } from "../types/game";
import type { Clock } from "../types/clock";
import { DAY_START_MINUTES } from "../types/clock";
import { APPOINTMENTS } from "../data/schedule";
import { REPORTS } from "../data/reports";
import { POLICIES } from "../data/policies";

export const SAVE_VERSION = 5;

/**
 * 開始値の内訳（設計書30章・31章の原則に沿って区分する）。
 *
 * 【事実】2024年10月1日、国会で石破茂が第102代内閣総理大臣に指名され、
 * その夜に石破内閣（自民・公明連立）が発足した。官房長官は林芳正。
 *
 * 【参考】名目GDP・政府債務・人口・税収・歳出・失業率はいずれも2024年
 * 前後の公表値に基づく概算。政府債務は定義によって公表額の幅が大きい
 * （財務省が示す「国の借金」ベースではおよそ1,100兆円台、OECD/IMF基準の
 * 一般政府債務ではより大きい数字になる）ため、ここでは前者に寄せた
 * 概算を置いている。
 *
 * 【ゲーム上の設定】内閣支持率・周辺情勢の初期値は、実際の世論調査値を
 * そのまま使うと日々の紙面と矛盾しかねないため、切りのよい数字に振って
 * ある。史実の支持率そのものを主張するものではない。
 */
const CLOCK: Clock = {
  totalMinutes: DAY_START_MINUTES,
  running: false,
  speed: 1,
};

export function createInitialState(): GameState {
  return {
    saveVersion: SAVE_VERSION,
    clock: { ...CLOCK },
    mode: { kind: "main" },
    appointments: APPOINTMENTS.map((appointment) => ({ ...appointment })),
    reports: REPORTS.map((report) => ({ ...report })),
    policies: POLICIES.map((policy) => ({ ...policy })),
    crises: [],
    pendingEffects: [],
    feed: [
      {
        id: "start",
        at: DAY_START_MINUTES,
        icon: "🏛️",
        text: "2024年10月1日、朝。今日、国会で首班指名選挙が行われ、この内閣が発足する。",
        kind: "news",
      },
    ],
    nation: {
      approval: 51,
      gdpTrillionYen: 600,
      growthRate: 1.2,
      cpi: 2.5,
      unemployment: 2.5,
      taxRevenueTrillionYen: 70,
      expenditureTrillionYen: 112,
      govDebtTrillionYen: 1105,
      populationTenThousand: 12400,
      regionalTension: "平常",
    },
    flags: [],
  };
}
