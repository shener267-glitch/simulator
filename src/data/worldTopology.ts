import type { Feature, Geometry } from "geojson";
import { feature } from "topojson-client";
import rawTopology from "world-atlas/countries-110m.json";

/**
 * 世界地図の国境データ（指示書6章）。world-atlasは公開されているカタログ
 * データ（Natural Earthベース、パブリックドメイン相当）で、既存ゲームの
 * 画像・アイコンではない——実在の国境線そのものを使っているだけ。
 *
 * 解像度は110m（もっとも粗い版）を選んだ。スマートフォンでの初期読み込みを
 * 軽くするため——指示書10章のスマホ対応を優先した判断。見た目の精度を
 * 上げたくなったら50mや10mに差し替えられる。
 */
export interface CountryFeature extends Feature<Geometry, { name: string }> {
  // ISO 3166-1 数字コード（文字列）。一部の係争地・未確定地域はデータ側に
  // idが無い（world-atlas 110m版の既知の欠け）——undefinedのまま扱う。
  id: string | undefined;
}

export const COUNTRY_FEATURES: CountryFeature[] = (
  feature(rawTopology, rawTopology.objects.countries) as unknown as {
    features: CountryFeature[];
  }
).features;
