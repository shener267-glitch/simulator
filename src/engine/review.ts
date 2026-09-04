import type { Minutes } from "../types/clock";
import type { GameState, LogEntry } from "../types/game";

/**
 * 一日の記録を時間帯で切る（本セッションでの決定）。
 *
 * 一日ぶんのログは数十行になるので、そのまま並べると読めない。そして
 * 「合計」はどう遊んでも一日ぶんになるので意味を失う — 代わりに時間帯ごとの
 * 内訳を出す。何時ごろ何に時間を使ったかは、合計と違って人によって変わる。
 */
export interface TimeBlock {
  id: string;
  label: string;
  from: Minutes;
  until: Minutes;
}

export const TIME_BLOCKS: TimeBlock[] = [
  { id: "early", label: "朝", from: 0, until: 120 }, // 06:00–08:00
  { id: "morning", label: "午前", from: 120, until: 360 }, // 08:00–12:00
  { id: "afternoon", label: "午後", from: 360, until: 600 }, // 12:00–16:00
  { id: "evening", label: "夕方", from: 600, until: 840 }, // 16:00–20:00
  { id: "night", label: "夜", from: 840, until: Number.POSITIVE_INFINITY },
];

export interface ReviewBlock extends TimeBlock {
  entries: LogEntry[];
  minutes: Minutes;
}

/** 中身のある時間帯だけを返す。空の見出しは並べない。 */
export function reviewBlocks(state: GameState): ReviewBlock[] {
  return TIME_BLOCKS.map((block) => {
    const entries = state.log.filter(
      (entry) => entry.startedAt >= block.from && entry.startedAt < block.until,
    );
    return {
      ...block,
      entries,
      minutes: entries.reduce((sum, entry) => sum + entry.minutes, 0),
    };
  }).filter((block) => block.entries.length > 0);
}
