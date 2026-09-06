/**
 * ゲーム内時間（Phase 1指示書11章）。年・月・日・時・分・速度を持つ、
 * 他の何にも依存しない独立した構造体にしてある。あとのPhaseで国家方針・
 * 建設・研究などが時間経過にぶら下がっても、この形自体は変わらない。
 */

/** 0は一時停止。1/2/4/8倍速。 */
export type Speed = 0 | 1 | 2 | 4 | 8;

export interface GameTime {
  year: number;
  month: number; // 1-12
  day: number; // 1-31
  hour: number; // 0-23
  minute: number; // 0-59
  speed: Speed;
}

/**
 * デフォルトの開始日時（指示書3章）。2024年10月1日——ただし指示書自身が
 * 「日付は後から変更できるようにする」と明記しているので、ここは値であって
 * 仕様に固定された定数ではない。実際に石破内閣が発足した日【事実】だが、
 * このPhaseでは単なるデフォルトの開始値以上の意味を持たせていない。
 */
export const DEFAULT_START: Omit<GameTime, "speed"> = {
  year: 2024,
  month: 10,
  day: 1,
  hour: 8,
  minute: 0,
};
