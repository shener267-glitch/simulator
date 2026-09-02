import type { Place, PlaceId } from "../types/place";

/**
 * 公邸は廊下をハブにした五部屋。寝室からリビングへは廊下を経由するので二分
 * かかる。官邸側は07:30の「官邸入り」で初めて到達する。
 */
export const PLACES: Record<PlaceId, Place> = {
  bedroom: {
    id: "bedroom",
    label: "公邸・寝室",
    short: "寝室",
    emoji: "🛏️",
    building: "residence",
    neighbours: ["corridor"],
  },
  corridor: {
    id: "corridor",
    label: "公邸・廊下",
    short: "廊下",
    emoji: "🚪",
    building: "residence",
    neighbours: ["bedroom", "bath", "living", "study"],
  },
  bath: {
    id: "bath",
    label: "公邸・風呂",
    short: "風呂",
    emoji: "🛁",
    building: "residence",
    neighbours: ["corridor"],
  },
  living: {
    id: "living",
    label: "公邸・リビング",
    short: "リビング",
    emoji: "🛋️",
    building: "residence",
    neighbours: ["corridor"],
  },
  study: {
    id: "study",
    label: "公邸・書斎",
    short: "書斎",
    emoji: "📚",
    building: "residence",
    neighbours: ["corridor"],
  },
  office: {
    id: "office",
    label: "官邸・執務室",
    short: "執務室",
    emoji: "🏛️",
    building: "kantei",
    neighbours: ["secretariat"],
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
  "office",
  "secretariat",
];

/** どこにいても選べる行動のための一覧。 */
export const ANYWHERE: PlaceId[] = [...PLACE_ORDER];

/** 公邸の中だけ。 */
export const RESIDENCE: PlaceId[] = PLACE_ORDER.filter(
  (id) => PLACES[id].building === "residence",
);

/** 05:00に目を覚ます場所。 */
export const STARTING_PLACE: PlaceId = "bedroom";

/** 07:30の官邸入りで運ばれる先。 */
export const KANTEI_ARRIVAL: PlaceId = "office";

export function placeById(id: PlaceId): Place {
  return PLACES[id];
}

/** 一分で行ける隣の部屋。建物をまたぐ移動はプレイヤーには開かない。 */
export function neighboursOf(id: PlaceId): Place[] {
  return PLACES[id].neighbours.map(placeById);
}
