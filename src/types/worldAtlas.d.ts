/**
 * world-atlasのJSONは実データ（何千座標もの配列）なので、resolveJsonModule
 * にそのまま推論させると型検査が重くなる。ここで形だけを宣言しておく。
 */
declare module "world-atlas/countries-110m.json" {
  import type { GeometryCollection, Topology } from "topojson-specification";

  const data: Topology<{
    countries: GeometryCollection<{ name: string }>;
    land: GeometryCollection;
  }>;
  export default data;
}
