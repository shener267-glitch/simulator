import type { Country } from "../types/country";

/**
 * Phase 1でプレイ可能にする7か国（指示書2章）。国旗・首都・政治体制の大枠は
 * 広く確認された事実として扱ってよい水準のもの【事実】。人口は日本のみ
 * 指示書のモックアップに書かれていた数字をそのまま使い、他の6か国は
 * 2024年前後の概算【参考】——このPhaseでは表示用の値でしかなく、国家運営の
 * 計算には使わない。
 *
 * `isoNumeric`はISO 3166-1の数字コードで、世界地図（world-atlas）の国境
 * データが使うidと直接対応する。国を増やすときはここに一件足すだけでよい
 * ——地図側のコードを触る必要はない。
 */
export const COUNTRIES: Country[] = [
  {
    id: "JPN",
    isoNumeric: "392",
    name: "日本",
    flag: "🇯🇵",
    capital: "東京",
    population: 120_295_592,
    government: "日本国政府",
    politicalSystem: "立憲君主制・議院内閣制",
    economy: {},
    military: {},
    diplomacy: {},
    provinces: [],
    playable: true,
  },
  {
    id: "USA",
    isoNumeric: "840",
    name: "アメリカ合衆国",
    flag: "🇺🇸",
    capital: "ワシントンD.C.",
    population: 335_000_000,
    government: "アメリカ合衆国政府",
    politicalSystem: "大統領制・連邦共和制",
    economy: {},
    military: {},
    diplomacy: {},
    provinces: [],
    playable: true,
  },
  {
    id: "CHN",
    isoNumeric: "156",
    name: "中華人民共和国",
    flag: "🇨🇳",
    capital: "北京",
    population: 1_410_000_000,
    government: "中華人民共和国政府",
    politicalSystem: "一党制・社会主義共和国",
    economy: {},
    military: {},
    diplomacy: {},
    provinces: [],
    playable: true,
  },
  {
    id: "RUS",
    isoNumeric: "643",
    name: "ロシア連邦",
    flag: "🇷🇺",
    capital: "モスクワ",
    population: 144_400_000,
    government: "ロシア連邦政府",
    politicalSystem: "半大統領制・連邦共和制",
    economy: {},
    military: {},
    diplomacy: {},
    provinces: [],
    playable: true,
  },
  {
    id: "GBR",
    isoNumeric: "826",
    name: "イギリス",
    flag: "🇬🇧",
    capital: "ロンドン",
    population: 67_700_000,
    government: "イギリス政府",
    politicalSystem: "立憲君主制・議院内閣制",
    economy: {},
    military: {},
    diplomacy: {},
    provinces: [],
    playable: true,
  },
  {
    id: "FRA",
    isoNumeric: "250",
    name: "フランス",
    flag: "🇫🇷",
    capital: "パリ",
    population: 68_000_000,
    government: "フランス共和国政府",
    politicalSystem: "半大統領制・共和制",
    economy: {},
    military: {},
    diplomacy: {},
    provinces: [],
    playable: true,
  },
  {
    id: "DEU",
    isoNumeric: "276",
    name: "ドイツ",
    flag: "🇩🇪",
    capital: "ベルリン",
    population: 84_700_000,
    government: "ドイツ連邦政府",
    politicalSystem: "議院内閣制・連邦共和制",
    economy: {},
    military: {},
    diplomacy: {},
    provinces: [],
    playable: true,
  },
];

/**
 * `countries`は呼び出し側から渡す——`state.countries`（ゲーム内で変わりうる、
 * その時点の値）を見るためで、この静的なカタログを直接見るためではない。
 * 後のPhaseで経済・人口などが変化するようになったとき、ここが static な
 * `COUNTRIES`のままだと変化が一切反映されなくなる、という落とし穴を避ける。
 */
export function findCountry(countries: Country[], id: string): Country | undefined {
  return countries.find((country) => country.id === id);
}

export function findCountryByIsoNumeric(countries: Country[], isoNumeric: string): Country | undefined {
  return countries.find((country) => country.isoNumeric === isoNumeric);
}

/** Phase 1のテスト開始国（指示書3章）。 */
export const DEFAULT_COUNTRY_ID = "JPN";
