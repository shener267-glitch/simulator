import type { Person } from "../types/person";
import type { GameState } from "../types/game";
import type { PlaceId } from "../types/place";
import { SAWATARI, SHINOZUKA, WIFE, YOUNGER_SON } from "./characters";

/**
 * 誰がどこにいるか。時刻で出入りする。
 *
 * 官邸に着くのは08:00で、そこから20:00過ぎまでは秘書官室に二人が詰めている。
 * 記者はエントランスにいる — ぶら下がりの時間だけでなく、一日中いる。
 */
export const PEOPLE: Person[] = [
  {
    id: "sawatari",
    name: SAWATARI.name,
    short: SAWATARI.shortName,
    emoji: "🧑‍💼",
    role: SAWATARI.role,
    summonable: true,
    phone: true,
    presence: [
      { place: "secretariat", from: 115, note: "予定表を広げて、電話を掛けている" },
    ],
  },
  {
    id: "shinozuka",
    name: SHINOZUKA.name,
    short: SHINOZUKA.shortName,
    emoji: "👩‍💼",
    role: SHINOZUKA.role,
    summonable: true,
    phone: true,
    presence: [
      { place: "secretariat", from: 115, note: "紙の束を種類ごとに積み直している" },
    ],
  },
  {
    id: "chief",
    name: "官房長官",
    short: "官房長官",
    emoji: "🎙️",
    role: "内閣官房長官",
    phone: true,
    presence: [
      // 官房長官室は5階の隣。用があれば来るが、こちらから覗く部屋ではない。
    ],
  },
  {
    id: "press",
    name: "官邸番の記者",
    short: "記者",
    emoji: "📸",
    role: "各社官邸クラブ",
    presence: [
      { place: "entrance", from: 115, until: 840, note: "三脚を立てたまま、こちらを見ている" },
    ],
  },
  {
    id: "wife",
    name: WIFE.name,
    short: WIFE.name,
    emoji: "👩",
    role: "妻",
    phone: true,
    presence: [
      { place: "living", until: 115, note: "台所に立っている" },
      { place: "living", from: 720, note: "洗い物をしながらテレビをつけている" },
    ],
  },
  {
    id: "son",
    name: YOUNGER_SON.name,
    short: YOUNGER_SON.name,
    emoji: "🧑",
    role: "次男",
    phone: true,
    presence: [
      { place: "living", from: 60, until: 115, note: "起きてきたところらしい" },
      { place: "living", from: 990, note: "バイトから帰ってきた" }, // 22:30
    ],
  },
];

export function personById(id: string): Person | undefined {
  return PEOPLE.find((person) => person.id === id);
}

function presentAt(person: Person, place: PlaceId, clock: number): boolean {
  return person.presence.some(
    (spot) =>
      spot.place === place &&
      (spot.from === undefined || clock >= spot.from) &&
      (spot.until === undefined || clock < spot.until),
  );
}

/** いまこの部屋にいる人。画面に並べる順は PEOPLE の定義順のまま。 */
export function peopleAt(state: GameState): { person: Person; note?: string }[] {
  return PEOPLE.filter((person) => presentAt(person, state.place, state.clock)).map((person) => ({
    person,
    note: person.presence.find(
      (spot) =>
        spot.place === state.place &&
        (spot.from === undefined || state.clock >= spot.from) &&
        (spot.until === undefined || state.clock < spot.until),
    )?.note,
  }));
}

/** その人がいまいる部屋。いなければ null。 */
export function whereIs(person: Person, clock: number): PlaceId | null {
  const spot = person.presence.find(
    (candidate) =>
      (candidate.from === undefined || clock >= candidate.from) &&
      (candidate.until === undefined || clock < candidate.until),
  );
  return spot?.place ?? null;
}

export function isPresent(state: GameState, personId: string): boolean {
  const person = personById(personId);
  return person ? presentAt(person, state.place, state.clock) : false;
}
