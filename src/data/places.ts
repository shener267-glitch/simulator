import type { Building, Place, PlaceId } from "../types/place";

/**
 * 議員宿舎は廊下をハブにした五部屋。寝室からリビングへは廊下を経由するので
 * 二分かかる。官邸は 07:55 の「議員宿舎を出発」で初めて到達する。
 *
 * 閣議室・応接室は場所として持たない。予定の時間にそこへ行き、終われば戻る
 * ものなので、立ち位置として置くと「何もできない部屋に取り残される」状態が
 * できてしまう。会議は場所ではなく出来事として扱う。
 */
export const PLACES: Record<PlaceId, Place> = {
  bedroom: {
    id: "bedroom",
    label: "議員宿舎・寝室",
    short: "寝室",
    emoji: "🛏️",
    building: "dormitory",
    neighbours: ["corridor"],
  },
  corridor: {
    id: "corridor",
    label: "議員宿舎・廊下",
    short: "廊下",
    emoji: "🚪",
    building: "dormitory",
    neighbours: ["bedroom", "bath", "living", "study"],
  },
  bath: {
    id: "bath",
    label: "議員宿舎・風呂",
    short: "風呂",
    emoji: "🛁",
    building: "dormitory",
    neighbours: ["corridor"],
  },
  living: {
    id: "living",
    label: "議員宿舎・リビング",
    short: "リビング",
    emoji: "🛋️",
    building: "dormitory",
    neighbours: ["corridor"],
  },
  study: {
    id: "study",
    label: "議員宿舎・書斎",
    short: "書斎",
    emoji: "📚",
    building: "dormitory",
    neighbours: ["corridor"],
  },
  entrance: {
    id: "entrance",
    label: "官邸・エントランス",
    short: "エントランス",
    emoji: "🏛️",
    building: "kantei",
    neighbours: ["office"],
  },
  office: {
    id: "office",
    label: "官邸・総理執務室",
    short: "執務室",
    emoji: "🖋️",
    building: "kantei",
    neighbours: ["entrance", "secretariat"],
  },
  secretariat: {
    id: "secretariat",
    label: "官邸・秘書官室",
    short: "秘書官室",
    emoji: "🗂️",
    building: "kantei",
    neighbours: ["office"],
  },
};

export const PLACE_ORDER: PlaceId[] = [
  "bedroom",
  "corridor",
  "bath",
  "living",
  "study",
  "entrance",
  "office",
  "secretariat",
];

function inBuilding(building: Building): PlaceId[] {
  return PLACE_ORDER.filter((id) => PLACES[id].building === building);
}

/**
 * どこにいても選べる行動のための一覧。増やすときは部屋ごとに選び直すこと —
 * 全部の部屋を自動で含めると、足したばかりの部屋に見直しなしで行動が生える。
 */
export const ANYWHERE: PlaceId[] = [...PLACE_ORDER];

/** 議員宿舎の中だけ。夜に帰ってからの行動はここに置く。 */
export const DORMITORY: PlaceId[] = inBuilding("dormitory");

/** 官邸の中だけ。日中の仕事はここに置く。 */
export const KANTEI: PlaceId[] = inBuilding("kantei");

/** 06:00に目を覚ます場所。 */
export const STARTING_PLACE: PlaceId = "bedroom";

/** 07:55に議員宿舎を出て着く先。08:00のぶら下がりはここで受ける。 */
export const KANTEI_ARRIVAL: PlaceId = "entrance";

/** 20:00に官邸を出て帰り着く先。 */
export const DORMITORY_ARRIVAL: PlaceId = "living";

export function placeById(id: PlaceId): Place {
  return PLACES[id];
}

/** 一分で行ける隣の部屋。建物をまたぐ移動はプレイヤーには開かない。 */
export function neighboursOf(id: PlaceId): Place[] {
  return PLACES[id].neighbours.map(placeById);
}

export function isPlaceId(value: unknown): value is PlaceId {
  return typeof value === "string" && (PLACE_ORDER as string[]).includes(value);
}
