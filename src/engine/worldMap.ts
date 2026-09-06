import { geoNaturalEarth1, geoPath } from "d3-geo";
import { COUNTRY_FEATURES } from "../data/worldTopology";

/** 地図のSVG座標系。projectionをこの大きさに合わせて一度だけ作る。 */
export const WORLD_WIDTH = 960;
export const WORLD_HEIGHT = 500;

const featureCollection = { type: "FeatureCollection" as const, features: COUNTRY_FEATURES };

/** 独自デザインのための投影法選択——特定ゲームの見た目を真似たものではない。 */
const projection = geoNaturalEarth1().fitSize([WORLD_WIDTH, WORLD_HEIGHT], featureCollection);

const path = geoPath(projection);

/** 国の輪郭をSVGのd属性用パス文字列にする。描けない形なら空文字を返す。 */
export function pathOf(feature: (typeof COUNTRY_FEATURES)[number]): string {
  return path(feature) ?? "";
}
