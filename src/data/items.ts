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

export type PhoneAppId = "messages" | "news" | "sns" | "calendar" | "photos";

export interface PhoneApp {
  id: PhoneAppId;
  label: string;
  emoji: string;
  /** その場で始まる行動があれば、そのid。なければアプリ自身が画面を出す。 */
  actionId?: string;
}

/** v0.2で優先するのはSNS・メッセージ・ニュース（設計書18章）。 */
export const PHONE_APPS: PhoneApp[] = [
  { id: "messages", label: "メッセージ", emoji: "💬" },
  { id: "news", label: "ニュース", emoji: "📰", actionId: "news" },
  { id: "sns", label: "SNS", emoji: "🌐", actionId: "sns" },
  { id: "calendar", label: "カレンダー", emoji: "📅" },
  { id: "photos", label: "写真", emoji: "📷" },
];
