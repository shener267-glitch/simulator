/**
 * 一日は 06:00 に始まり、遅くとも 24:00 に終わる。ゲーム内のあらゆる時刻は
 * 06:00 からの経過分で持つので、時と分をまたぐ計算を手で書かなくて済む。
 */
export type Minutes = number;

export const DAY_START_HOUR = 6;

/** 06:00 から 24:00 まで。自分で寝なければ、ここで一日が閉じる。 */
export const DAY_LENGTH: Minutes = 1080;

/** 時計の表示を丸めるための一日の長さ。 */
export const MINUTES_IN_DAY = 1440;
