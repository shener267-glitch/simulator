import { COUNTRY_FEATURES } from "../../data/worldTopology";
import { findCountryByIsoNumeric } from "../../data/countries";
import { WORLD_HEIGHT, WORLD_WIDTH, pathOf } from "../../engine/worldMap";
import { usePanZoom } from "../../hooks/usePanZoom";
import type { Country } from "../../types/country";

interface WorldMapProps {
  /** その時点の国家データ。`state.countries`を渡す——静的カタログではなく。 */
  countries: Country[];
  /** 強調表示する国（選択中の国）のISO数字コード。 */
  selectedIsoNumeric?: string | null;
  onSelectCountry: (isoNumeric: string) => void;
}

/**
 * インタラクティブな世界地図（指示書6章）。境界データは実在の地理データ
 * （world-atlas、パブリックドメイン相当）で、既存ゲームの画像・アイコンは
 * 使っていない——見た目はここで独自に組んだもの。パン・ズームの仕組みは
 * `usePanZoom`（国家方針ツリーと共有）。
 */
export function WorldMap({ countries, selectedIsoNumeric, onSelectCountry }: WorldMapProps) {
  const { svgRef, transform, handlers } = usePanZoom<SVGSVGElement>({
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    hitAttribute: "data-iso-numeric",
    onTap: onSelectCountry,
  });

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
      className="h-full w-full touch-none select-none"
      {...handlers}
    >
      <rect x={0} y={0} width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="#0a1420" />
      <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
        {COUNTRY_FEATURES.map((f, index) => {
          // 一部の係争地・未確定地域はidを持たない(world-atlas 110m版の既知の欠け)。
          // 陸地の輪郭としては描くが、選べる国としては扱わない。
          const country = f.id ? findCountryByIsoNumeric(countries, f.id) : undefined;
          const isSelected = Boolean(f.id) && f.id === selectedIsoNumeric;
          const fill = isSelected ? "#c8a96b" : country ? "#3d5a6c" : "#1c232d";
          return (
            <path
              key={f.id ?? `unclaimed-${index}`}
              data-iso-numeric={f.id}
              d={pathOf(f)}
              fill={fill}
              stroke="#0b0d12"
              strokeWidth={0.5}
              vectorEffect="non-scaling-stroke"
              className={f.id ? "cursor-pointer transition-colors duration-150 hover:fill-brass/70" : undefined}
            />
          );
        })}
      </g>
    </svg>
  );
}
