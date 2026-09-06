import { useCallback, useEffect, useRef, useState } from "react";
import { COUNTRY_FEATURES } from "../../data/worldTopology";
import { findCountryByIsoNumeric } from "../../data/countries";
import { WORLD_HEIGHT, WORLD_WIDTH, pathOf } from "../../engine/worldMap";

const MIN_SCALE = 1;
const MAX_SCALE = 8;
const DRAG_THRESHOLD = 6; // px。これ未満の動きはクリック扱いにする。

interface Transform {
  x: number;
  y: number;
  scale: number;
}

interface Point {
  x: number;
  y: number;
}

function clampScale(scale: number): number {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/** 地図がまったく見えなくなるほどパンできないよう、ゆるく制限する。 */
function clampTransform(t: Transform): Transform {
  const scale = clampScale(t.scale);
  const marginX = WORLD_WIDTH * 0.4 * scale;
  const minX = -(WORLD_WIDTH * scale) + marginX;
  const maxX = WORLD_WIDTH - marginX;
  const marginY = WORLD_HEIGHT * 0.4 * scale;
  const minY = -(WORLD_HEIGHT * scale) + marginY;
  const maxY = WORLD_HEIGHT - marginY;
  return {
    scale,
    x: Math.min(maxX, Math.max(minX, t.x)),
    y: Math.min(maxY, Math.max(minY, t.y)),
  };
}

function midpoint(points: Point[]): Point {
  return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
}

interface Gesture {
  rect: DOMRect;
  /** 指(群)が地図の元座標のどこを指していたか。動いてもここを追い続ける。 */
  anchor: Point;
  /** 二本指のときだけ。距離の比でスケールを決める。 */
  pinch: { startDist: number; startScale: number } | null;
}

interface WorldMapProps {
  /** 強調表示する国（選択中の国）のISO数字コード。 */
  selectedIsoNumeric?: string | null;
  onSelectCountry: (isoNumeric: string) => void;
}

/**
 * インタラクティブな世界地図（指示書6章）。境界データは実在の地理データ
 * （world-atlas、パブリックドメイン相当）で、既存ゲームの画像・アイコンは
 * 使っていない——見た目はここで独自に組んだもの。
 *
 * ズーム・パンはPointer Events APIで自前実装している。マウスのドラッグ・
 * ホイールと、タッチのドラッグ・ピンチを同じ「アンカー点を指の下に保つ」
 * 計算で扱う——ズーム中でも、つかんだ場所が指から逃げない。
 */
export function WorldMap({ selectedIsoNumeric, onSelectCountry }: WorldMapProps) {
  const [transform, setTransform] = useState<Transform>({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const svgRef = useRef<SVGSVGElement>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const draggedDistance = useRef(0);

  const clientToWorld = useCallback((clientX: number, clientY: number, rect: DOMRect): Point => {
    const unit = WORLD_WIDTH / rect.width;
    return { x: (clientX - rect.left) * unit, y: (clientY - rect.top) * unit };
  }, []);

  const beginGesture = useCallback(
    (points: Point[], rect: DOMRect): Gesture => {
      const focal = points.length >= 2 ? midpoint(points) : points[0];
      const t = transformRef.current;
      const world = clientToWorld(focal.x, focal.y, rect);
      const anchor = { x: (world.x - t.x) / t.scale, y: (world.y - t.y) / t.scale };
      const pinch =
        points.length >= 2
          ? { startDist: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y), startScale: t.scale }
          : null;
      return { rect, anchor, pinch };
    },
    [clientToWorld],
  );

  const applyAt = useCallback(
    (focal: Point, rect: DOMRect, anchor: Point, scale: number) => {
      const world = clientToWorld(focal.x, focal.y, rect);
      setTransform(clampTransform({ scale, x: world.x - scale * anchor.x, y: world.y - scale * anchor.y }));
    },
    [clientToWorld],
  );

  function onPointerDown(e: React.PointerEvent<SVGSVGElement>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 一部の環境・合成イベントでは失敗しうるが、ポインタの追跡自体は
      // キャプチャ無しでも動く——ここで諦める理由にはしない。
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    draggedDistance.current = 0;
    const rect = e.currentTarget.getBoundingClientRect();
    gesture.current = beginGesture([...pointers.current.values()], rect);
  }

  function onPointerMove(e: React.PointerEvent<SVGSVGElement>) {
    if (!pointers.current.has(e.pointerId)) return;
    const prev = pointers.current.get(e.pointerId)!;
    draggedDistance.current += Math.hypot(e.clientX - prev.x, e.clientY - prev.y);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });

    const g = gesture.current;
    if (!g) return;
    const pts = [...pointers.current.values()];

    if (pts.length >= 2 && g.pinch) {
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
      const scale = clampScale(g.pinch.startScale * (dist / g.pinch.startDist));
      applyAt(midpoint(pts), g.rect, g.anchor, scale);
    } else {
      applyAt(pts[0], g.rect, g.anchor, transformRef.current.scale);
    }
  }

  function onPointerUpOrCancel(e: React.PointerEvent<SVGSVGElement>) {
    pointers.current.delete(e.pointerId);
    const remaining = [...pointers.current.values()];
    if (remaining.length === 0) {
      gesture.current = null;
      return;
    }
    gesture.current = beginGesture(remaining, e.currentTarget.getBoundingClientRect());
  }

  // Reactの onWheel はpassiveなリスナーとして登録されうるため、確実に
  // preventDefault が効くよう、ここだけ素のaddEventListenerで付け直す。
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      const rect = svg!.getBoundingClientRect();
      const focal = { x: e.clientX, y: e.clientY };
      const g = beginGesture([focal], rect);
      const factor = Math.exp(-e.deltaY * 0.0015);
      applyAt(focal, rect, g.anchor, clampScale(transformRef.current.scale * factor));
    }

    svg.addEventListener("wheel", onWheel, { passive: false });
    return () => svg.removeEventListener("wheel", onWheel);
  }, [beginGesture, applyAt]);

  function handleCountryClick(isoNumeric: string) {
    if (draggedDistance.current > DRAG_THRESHOLD) return;
    onSelectCountry(isoNumeric);
  }

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${WORLD_WIDTH} ${WORLD_HEIGHT}`}
      className="h-full w-full touch-none select-none"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUpOrCancel}
      onPointerCancel={onPointerUpOrCancel}
    >
      <rect x={0} y={0} width={WORLD_WIDTH} height={WORLD_HEIGHT} fill="#0a1420" />
      <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
        {COUNTRY_FEATURES.map((f, index) => {
          // 一部の係争地・未確定地域はidを持たない（world-atlas 110m版の既知の欠け）。
          // 陸地の輪郭としては描くが、選べる国としては扱わない。
          const country = f.id ? findCountryByIsoNumeric(f.id) : undefined;
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
              onClick={() => f.id && handleCountryClick(f.id)}
              className={f.id ? "cursor-pointer transition-colors duration-150 hover:fill-brass/70" : undefined}
            />
          );
        })}
      </g>
    </svg>
  );
}
