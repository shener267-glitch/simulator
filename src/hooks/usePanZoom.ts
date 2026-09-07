import { useCallback, useEffect, useRef, useState } from "react";

export interface PanZoomTransform {
  x: number;
  y: number;
  scale: number;
}

interface Point {
  x: number;
  y: number;
}

interface UsePanZoomOptions {
  /** キャンバスの座標系(viewBox)の大きさ。 */
  width: number;
  height: number;
  minScale?: number;
  maxScale?: number;
  /** クランプの余裕。大きいほど遠くまでパンできる。 */
  marginRatio?: number;
  /** これ未満の動きはタップ扱いにする(px)。 */
  dragThreshold?: number;
  /**
   * タップ判定に使うdata属性名（例: "data-iso-numeric"）。指定すると、
   * ドラッグでない一本指の操作の終わりに、この属性を持つ最も近い祖先を
   * `elementFromPoint`で拾い、その値を`onTap`へ渡す。
   *
   * ここでネイティブのclickイベントに頼らないのは理由がある——
   * `setPointerCapture`をルート要素にかけたまま、その内側のSVG子要素
   * （地図の国、国家方針のノード）へのclickが、環境によっては届かない
   * ことがある。タップの成立をここで自分の手で判定することで、パン・
   * ズームを持つキャンバスの上でも確実に選択できるようにしてある。
   */
  hitAttribute?: string;
  onTap?: (hitValue: string) => void;
}

interface Gesture {
  rect: DOMRect;
  /** 指(群)がキャンバスの元座標のどこを指していたか。動いてもここを追い続ける。 */
  anchor: Point;
  /** 二本指のときだけ。距離の比でスケールを決める。 */
  pinch: { startDist: number; startScale: number } | null;
}

function midpoint(points: Point[]): Point {
  return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
}

/**
 * ズーム・パンの範囲を絞る。「見える範囲の余裕」は画面上の一定量
 * （marginRatio×viewBox幅/高さ）にする——ここをscaleに比例させると、
 * ズームするほど許される範囲が狭くなり、拡大するほど地図の端まで
 * 届かなくなる（実際に踏んだ不具合）。端をきっちり画面端に合わせる
 * 位置は`辺の長さ*(1-scale)`と`0`——そこからオーバースクロール分だけ
 * 外側へ広げる。
 */
export function clampPanZoom(
  t: PanZoomTransform,
  { width, height, minScale = 1, maxScale = 8, marginRatio = 0.4 }: Pick<UsePanZoomOptions, "width" | "height" | "minScale" | "maxScale" | "marginRatio">,
): PanZoomTransform {
  const scale = Math.min(maxScale, Math.max(minScale, t.scale));
  const overscrollX = width * marginRatio;
  const minX = width * (1 - scale) - overscrollX;
  const maxX = overscrollX;
  const overscrollY = height * marginRatio;
  const minY = height * (1 - scale) - overscrollY;
  const maxY = overscrollY;
  return {
    scale,
    x: Math.min(maxX, Math.max(minX, t.x)),
    y: Math.min(maxY, Math.max(minY, t.y)),
  };
}

/**
 * SVGキャンバスのパン・ズーム・タップを、Pointer Events APIで自前実装した
 * もの。マウスのドラッグ・ホイールと、タッチのドラッグ・ピンチを同じ
 * 「アンカー点を指の下に保つ」計算で扱う——世界地図（指示書6章）と
 * 国家方針ツリー（指示書8章）の両方が同じ操作感になるよう、ここに
 * 一本化してある。
 */
export function usePanZoom<T extends SVGSVGElement>({
  width,
  height,
  minScale = 1,
  maxScale = 8,
  marginRatio = 0.4,
  dragThreshold = 6,
  hitAttribute,
  onTap,
}: UsePanZoomOptions) {
  const [transform, setTransform] = useState<PanZoomTransform>({ x: 0, y: 0, scale: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  const svgRef = useRef<T>(null);
  const pointers = useRef(new Map<number, Point>());
  const gesture = useRef<Gesture | null>(null);
  const draggedDistance = useRef(0);

  const clampScale = useCallback((scale: number) => Math.min(maxScale, Math.max(minScale, scale)), [minScale, maxScale]);

  const clampTransform = useCallback(
    (t: PanZoomTransform): PanZoomTransform => clampPanZoom(t, { width, height, minScale, maxScale, marginRatio }),
    [width, height, minScale, maxScale, marginRatio],
  );

  const clientToWorld = useCallback(
    (clientX: number, clientY: number, rect: DOMRect): Point => {
      const unit = width / rect.width;
      return { x: (clientX - rect.left) * unit, y: (clientY - rect.top) * unit };
    },
    [width],
  );

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
    [clientToWorld, clampTransform],
  );

  function onPointerDown(e: React.PointerEvent<T>) {
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 一部の環境・合成イベントでは失敗しうるが、追跡自体はキャプチャ無しでも動く。
    }
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    draggedDistance.current = 0;
    const rect = e.currentTarget.getBoundingClientRect();
    gesture.current = beginGesture([...pointers.current.values()], rect);
  }

  function onPointerMove(e: React.PointerEvent<T>) {
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

  function finishGesture(e: React.PointerEvent<T>) {
    pointers.current.delete(e.pointerId);
    const remaining = [...pointers.current.values()];
    if (remaining.length === 0) {
      gesture.current = null;
      return;
    }
    gesture.current = beginGesture(remaining, e.currentTarget.getBoundingClientRect());
  }

  function onPointerUp(e: React.PointerEvent<T>) {
    const wasSingleTap = pointers.current.size === 1 && draggedDistance.current <= dragThreshold;
    if (wasSingleTap && onTap && hitAttribute) {
      const atPoint = document.elementFromPoint(e.clientX, e.clientY);
      const hitEl = atPoint?.closest(`[${hitAttribute}]`);
      const hitValue = hitEl?.getAttribute(hitAttribute);
      if (hitValue) onTap(hitValue);
    }
    finishGesture(e);
  }

  // Reactの onWheel はpassiveなリスナーとして登録されうるため、確実に
  // preventDefault が効くよう、素のaddEventListenerで付け直す。
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
  }, [beginGesture, applyAt, clampScale]);

  /** ビューポート中心を軸にズームする——マップモード切替UIの＋／−ボタン用（指示書7章）。 */
  const zoomBy = useCallback(
    (factor: number) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const focal = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
      const g = beginGesture([focal], rect);
      applyAt(focal, rect, g.anchor, clampScale(transformRef.current.scale * factor));
    },
    [beginGesture, applyAt, clampScale],
  );

  const resetView = useCallback(() => {
    setTransform(clampTransform({ x: 0, y: 0, scale: 1 }));
  }, [clampTransform]);

  return {
    svgRef,
    transform,
    zoomBy,
    resetView,
    handlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: finishGesture,
    },
  };
}
