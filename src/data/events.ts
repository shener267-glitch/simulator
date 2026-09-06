export interface SimpleEvent {
  id: string;
  title: string;
  body: string;
}

/**
 * 簡易イベント（指示書16章）。Phase 2では選択肢を持たない、確認するだけの
 * お知らせにとどめる。本格的な分岐イベントは後のPhaseで作る。
 */
export const EVENTS: SimpleEvent[] = [
  {
    id: "fiscal-reform-debate",
    title: "財政改革をめぐる議論",
    body: "財政健全化の方針が固まったことを受け、国会では歳出改革の是非をめぐる議論が始まった。",
  },
];

export function findEvent(id: string): SimpleEvent | undefined {
  return EVENTS.find((event) => event.id === id);
}
