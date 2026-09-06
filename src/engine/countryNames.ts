import { getName, registerLocale } from "i18n-iso-countries";
import ja from "i18n-iso-countries/langs/ja.json";

registerLocale(ja);

/**
 * カタログに無い国（プレイ可能な7か国以外）でも、名前だけは出せるようにする
 * （指示書6・7章の「他国をクリックできる」「国家情報を表示できる」）。
 * ISO 3166-1の数字コードから日本語の国名を引く——地図の境界データが使う
 * idと同じコード体系なので、そのまま渡せる。
 */
export function countryNameOf(isoNumeric: string): string {
  return getName(isoNumeric, "ja") ?? `国コード ${isoNumeric}`;
}
