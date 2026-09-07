import { COUNTRY_FEATURES } from "../../data/worldTopology";
import { findCountryByIsoNumeric } from "../../data/countries";
import { WORLD_HEIGHT, WORLD_WIDTH, centroidOf, pathOf } from "../../engine/worldMap";
import { usePanZoom } from "../../hooks/usePanZoom";
import type { Country } from "../../types/country";

/** 外交の関係線オーバーレイ一本分（指示書24章、任意機能）。 */
export interface RelationLine {
  isoNumeric: string;
  relation: number;
}

interface WorldMapProps {
  /** その時点の国家データ。`state.countries`を渡す——静的カタログではなく。 */
  countries: Country[];
  /** 強調表示する国（選択中の国）のISO数字コード。 */
  selectedIsoNumeric?: string | null;
  onSelectCountry: (isoNumeric: string) => void;
  /** 外交画面と連動した関係線オーバーレイ。省略時は描かない。 */
  relationLines?: RelationLine[];
}

function relationLineColor(relation: number): string {
  if (relation >= 20) return "#5fa87e";
  if (relation <= -20) return "#c0564f";
  return "#8a95a5";
}

/**
 * インタラクティブな世界地図（指示書6章）。境界データは実在の地理データ
 * （world-atlas、パブリックドメイン相当）で、既存ゲームの画像・アイコンは
 * 使っていない——見た目はここで独自に組んだもの。パン・ズームの仕組みは
 * `usePanZoom`（国家方針ツリーと共有）。
 */
export function WorldMap({ countries, selectedIsoNumeric, onSelectCountry, relationLines }: WorldMapProps) {
  const { svgRef, transform, zoomBy, resetView, handlers } = usePanZoom<SVGSVGElement>({
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    hitAttribute: "data-iso-numeric",
    onTap: onSelectCountry,
  });

  const featureByIso = new Map(COUNTRY_FEATURES.filter((f) => f.id).map((f) => [f.id as string, f]));
  const originFeature = selectedIsoNumeric ? featureByIso.get(selectedIsoNumeric) : undefined;
  const originCentroid = originFeature ? centroidOf(originFeature) : null;

  return (
    <div className="relative h-full w-full">
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

          {relationLines && originCentroid && (
            <g pointerEvents="none">
              {relationLines.map((line) => {
                const feature = featureByIso.get(line.isoNumeric);
                const target = feature ? centroidOf(feature) : null;
                if (!target) return null;
                return (
                  <line
                    key={line.isoNumeric}
                    x1={originCentroid[0]}
                    y1={originCentroid[1]}
                    x2={target[0]}
                    y2={target[1]}
                    stroke={relationLineColor(line.relation)}
                    strokeWidth={1.5}
                    strokeOpacity={0.85}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              })}
            </g>
          )}
        </g>
      </svg>

      {/* マップ操作UI（指示書7章）：ズームイン・ズームアウト・表示リセット。パン/ホイールズームと並行して使える。 */}
      <div className="pointer-events-none absolute bottom-3 right-3 flex flex-col gap-1">
        <button
          type="button"
          onClick={() => zoomBy(1.3)}
          aria-label="ズームイン"
          title="ズームイン"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded border border-line-strong bg-ink-panel/90 text-body-muted backdrop-blur-sm transition-colors hover:border-brass/50 hover:text-body"
        >
          ＋
        </button>
        <button
          type="button"
          onClick={() => zoomBy(1 / 1.3)}
          aria-label="ズームアウト"
          title="ズームアウト"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded border border-line-strong bg-ink-panel/90 text-body-muted backdrop-blur-sm transition-colors hover:border-brass/50 hover:text-body"
        >
          −
        </button>
        <button
          type="button"
          onClick={resetView}
          aria-label="表示をリセット"
          title="表示をリセット"
          className="pointer-events-auto flex h-9 w-9 items-center justify-center rounded border border-line-strong bg-ink-panel/90 text-[0.7rem] text-body-muted backdrop-blur-sm transition-colors hover:border-brass/50 hover:text-body"
        >
          ⟲
        </button>
      </div>
    </div>
  );
}
