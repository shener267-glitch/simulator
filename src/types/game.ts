import type { Clock, Minutes } from "./clock";
import type { MeetingStage } from "./meeting";

/**
 * 国家ステータス（設計書24章）。数字は出すが、数字だけで結果を語らない
 * （設計書20章）——ニュースや報告書の文章が主で、ここは背景の指標。
 *
 * 開始値は2024年10月1日時点の実際の値を参考にした概算
 * ——名目GDP・政府債務・人口は【参考】、内閣支持率などゲーム固有の指標は
 * 【ゲーム上の設定】（史実の支持率調査値をそのまま使うと、その日の紙面と
 * 矛盾しかねないため、切りのよい概算に振ってある）。
 */
export interface NationStatus {
  /** 内閣支持率。0〜100。 */
  approval: number;
  /** 名目GDP、兆円。 */
  gdpTrillionYen: number;
  /** 実質成長率、%。 */
  growthRate: number;
  /** 消費者物価上昇率、%。 */
  cpi: number;
  /** 完全失業率、%。 */
  unemployment: number;
  /** 税収、兆円（年間ベース）。 */
  taxRevenueTrillionYen: number;
  /** 歳出、兆円（年間ベース）。 */
  expenditureTrillionYen: number;
  /** 政府債務残高、兆円。 */
  govDebtTrillionYen: number;
  /** 総人口、万人。 */
  populationTenThousand: number;
  /** 周辺の安全保障情勢。数値化しない三段階。 */
  regionalTension: "平常" | "やや高い" | "高い";
}

export type NationStatusDelta = Partial<NationStatus>;

/**
 * 政策や危機の効果は、その場では数字に出ない（設計書19章）。しばらく
 * 経ってから静かに反映される、という体裁のための遅延キュー。
 */
export interface PendingEffect {
  id: string;
  at: Minutes;
  delta: NationStatusDelta;
  /** 反映されたときにフィードへ一行出す。 */
  note?: string;
}

/**
 * 政治日程（設計書17章の「予定」）。国会審議・閣議・会談など、事前に
 * 分かっている枠。総理が動かせるものではない——現実の制度上の日程として
 * 降りてくる。
 */
export interface Appointment {
  id: string;
  label: string;
  /** ゲーム開始からの絶対分。 */
  at: Minutes;
  /** 名目上の枠の長さ。会議はこれより延ばせるし、早く切り上げてもよい。 */
  minutes: Minutes;
  resolved: boolean;
  highlight?: string;
}

/**
 * 政府機関が作成した報告書（設計書10〜11章）。確度は「高/中/低」までで、
 * 内部の数値としても持たない——確度そのものが情報という体裁にするため。
 */
export interface Report {
  id: string;
  from: string;
  title: string;
  at: Minutes;
  confidence: "高" | "中" | "低";
  summary: string;
  findings: string;
  analysis: string;
  outlook: string;
  read: boolean;
  flags?: string[];
  /** 緊急案件。届いた瞬間にゲームを自動停止して見せる。 */
  urgent?: boolean;
}

/** 政策決定の選択肢（設計書29章）。正解を用意しない——長所と短所だけ書く。 */
export interface PolicyOption {
  id: string;
  label: string;
  summary: string;
  flags?: string[];
  /** しばらく経ってから効いてくる、小さな変化。 */
  delayedEffect?: { afterMinutes: Minutes; delta: NationStatusDelta; note: string };
}

export interface PolicyDecision {
  id: string;
  title: string;
  prompt: string;
  from: Minutes;
  requiresFlags?: string[];
  options: PolicyOption[];
  /** 決めた選択肢のid。決めるまではundefined。 */
  decided?: string;
}

/** 発火した危機イベント一件。テンプレートはdata/crises/catalogue.tsを参照。 */
export interface FiredCrisis {
  id: string;
  templateId: string;
  firedAt: Minutes;
  acknowledged: boolean;
}

/** 画面に流す最新情報（設計書23章「📰最新情報」）。 */
export interface FeedEntry {
  id: string;
  at: Minutes;
  icon: string;
  text: string;
  kind: "news" | "report" | "urgent" | "policy" | "appointment" | "crisis";
}

/**
 * いまどの画面か。会議と危機イベントだけが全画面を占めて時計を止める。
 * 報告書・政策・省庁・国家ステータスは、時計が動いたまま覗ける窓
 * （設計書17章の「予定」と「現実」の分離とは別に、情報を見ること自体は
 * 時間を消費しない、という整理）。
 */
export type Mode =
  | { kind: "main" }
  | {
      kind: "meeting";
      appointmentId: string;
      startedAt: Minutes;
      stage: MeetingStage;
      showing: string | null;
      taken: string[];
    }
  | { kind: "event"; crisisId: string };

export interface GameState {
  saveVersion: number;
  clock: Clock;
  mode: Mode;
  appointments: Appointment[];
  reports: Report[];
  policies: PolicyDecision[];
  crises: FiredCrisis[];
  pendingEffects: PendingEffect[];
  feed: FeedEntry[];
  nation: NationStatus;
  /**
   * 知られたこと・決めたことの汎用フラグ（設計書27章の情報の連鎖に相当）。
   * 報告書を読む・政策を決める・会議で選ぶ、のいずれからも立つ。
   */
  flags: string[];
}
