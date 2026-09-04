/** 設計書17章。持ち物は場所の制限を一部だけ解除する道具でもある。 */
export interface Item {
  id: string;
  label: string;
  emoji: string;
  hint: string;
}

export const ITEMS: Item[] = [
  { id: "phone", label: "スマートフォン", emoji: "📱", hint: "通知が溜まったまま" },
  { id: "watch", label: "腕時計", emoji: "⌚", hint: "就任祝いに贈られたもの" },
  { id: "papers", label: "手元の資料", emoji: "📄", hint: "枕元に置いたままの束" },
];

export type PhoneAppId = "calls" | "messages" | "mail" | "news" | "sns" | "calendar" | "photos";

export interface PhoneApp {
  id: PhoneAppId;
  label: string;
  emoji: string;
  /**
   * その場で始まる行動があれば、そのid。時間帯で中身が変わるものは複数書き、
   * いま始められる最初のものを使う — 朝は朝刊、夜は夜のニュースになる。
   */
  actionIds?: string[];
}

/** 設計書18章。起床演出が見せる三つ（ニュース・メッセージ・メール）は全部ある。 */
export const PHONE_APPS: PhoneApp[] = [
  { id: "calls", label: "電話", emoji: "📞" },
  { id: "messages", label: "メッセージ", emoji: "💬" },
  { id: "mail", label: "メール", emoji: "📧" },
  { id: "news", label: "ニュース", emoji: "📰", actionIds: ["news", "news-evening"] },
  { id: "sns", label: "SNS", emoji: "🌐", actionIds: ["sns"] },
  { id: "calendar", label: "カレンダー", emoji: "📅" },
  { id: "photos", label: "写真", emoji: "📷" },
];
