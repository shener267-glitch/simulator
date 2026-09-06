import { useState } from "react";
import { Panel } from "../shared/Panel";
import { Modal } from "../shared/Modal";
import { usePanZoom } from "../../hooks/usePanZoom";
import { JAPAN_FOCUSES, findFocus } from "../../data/focuses";
import { describeFocusEffect, isFocusAvailable } from "../../engine/focus";
import type { FocusTemplate } from "../../types/focus";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const TREE_WIDTH = 960;
const TREE_HEIGHT = 820;
const NODE_WIDTH = 140;
const NODE_HEIGHT = 54;

type FocusStatus = "completed" | "active" | "available" | "locked";

function statusOf(focus: FocusTemplate, completedFocusIds: string[], unlockedFocusIds: string[], activeFocusId: string | undefined): FocusStatus {
  if (completedFocusIds.includes(focus.id)) return "completed";
  if (focus.id === activeFocusId) return "active";
  if (isFocusAvailable(focus, completedFocusIds, unlockedFocusIds)) return "available";
  return "locked";
}

const STATUS_STYLE: Record<FocusStatus, { fill: string; border: string; text: string }> = {
  completed: { fill: "bg-brass/25", border: "border-brass", text: "text-brass" },
  active: { fill: "bg-brass/10", border: "border-brass", text: "text-body" },
  available: { fill: "bg-ink-raised", border: "border-line-strong", text: "text-body" },
  locked: { fill: "bg-ink-panel", border: "border-line", text: "text-body-faint" },
};

/**
 * 国家方針ツリー（指示書8〜14章）。HOI4型のツリー表示——パン・ズームは
 * 世界地図と同じ`usePanZoom`を使い、同じ操作感にしてある。
 */
export function FocusTreeScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const [detailId, setDetailId] = useState<string | null>(null);
  const { svgRef, transform, handlers } = usePanZoom<SVGSVGElement>({
    width: TREE_WIDTH,
    height: TREE_HEIGHT,
    maxScale: 4,
    hitAttribute: "data-focus-id",
    onTap: setDetailId,
  });

  const { completedFocusIds, unlockedFocusIds, activeFocus } = state.politics;
  const isJapan = state.playerCountryId === "JPN";
  const focuses = isJapan ? JAPAN_FOCUSES : [];

  return (
    <Panel title="🌳 国家方針" onClose={onClose}>
      {!isJapan ? (
        <p className="p-6 text-center text-[0.85rem] text-body-muted">この国の国家方針はまだ用意されていない。</p>
      ) : (
        <svg ref={svgRef} viewBox={`0 0 ${TREE_WIDTH} ${TREE_HEIGHT}`} className="h-full w-full touch-none select-none" {...handlers}>
          <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
            {focuses.flatMap((focus) =>
              focus.prerequisites.map((prereqId) => {
                const from = findFocus(prereqId);
                if (!from) return null;
                const done = completedFocusIds.includes(prereqId);
                return (
                  <line
                    key={`${prereqId}->${focus.id}`}
                    x1={from.position.x}
                    y1={from.position.y + NODE_HEIGHT / 2}
                    x2={focus.position.x}
                    y2={focus.position.y - NODE_HEIGHT / 2}
                    stroke={done ? "#c8a96b" : "#2a303b"}
                    strokeWidth={2}
                    vectorEffect="non-scaling-stroke"
                  />
                );
              }),
            )}

            {focuses.map((focus) => {
              const status = statusOf(focus, completedFocusIds, unlockedFocusIds, activeFocus?.focusId);
              const style = STATUS_STYLE[status];
              const progress = status === "active" && activeFocus ? Math.min(1, activeFocus.daysElapsed / focus.durationDays) : null;

              return (
                <foreignObject
                  key={focus.id}
                  data-focus-id={focus.id}
                  x={focus.position.x - NODE_WIDTH / 2}
                  y={focus.position.y - NODE_HEIGHT / 2}
                  width={NODE_WIDTH}
                  height={NODE_HEIGHT}
                >
                  <div
                    className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded border px-1.5 text-center ${style.fill} ${style.border}`}
                  >
                    <span className={`text-[0.68rem] font-medium leading-tight ${style.text}`}>
                      {status === "completed" && "✅ "}
                      {focus.name}
                    </span>
                    {progress !== null && (
                      <div className="h-1 w-[85%] overflow-hidden rounded-full bg-ink">
                        <div className="h-full bg-brass" style={{ width: `${progress * 100}%` }} />
                      </div>
                    )}
                  </div>
                </foreignObject>
              );
            })}
          </g>
        </svg>
      )}

      {detailId && (
        <FocusDetailModal
          focusId={detailId}
          status={
            findFocus(detailId)
              ? statusOf(findFocus(detailId)!, completedFocusIds, unlockedFocusIds, activeFocus?.focusId)
              : "locked"
          }
          onClose={() => setDetailId(null)}
        />
      )}
    </Panel>
  );
}

function FocusDetailModal({ focusId, status, onClose }: { focusId: string; status: FocusStatus; onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const focus = findFocus(focusId);
  if (!focus) return null;

  const missingPrereqs = focus.prerequisites.filter((id) => !state.politics.completedFocusIds.includes(id));
  const canAfford = state.politics.stats.politicalPower >= focus.politicalPowerCost;
  const hasActiveFocus = Boolean(state.politics.activeFocus);
  const activeProgress = status === "active" ? state.politics.activeFocus : null;

  return (
    <Modal title={focus.name} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="whitespace-pre-line text-[0.9rem] leading-[1.8] text-body">{focus.description}</p>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[0.85rem]">
          <dt className="text-body-muted">所要期間</dt>
          <dd className="figures text-body">{focus.durationDays}日</dd>
          <dt className="text-body-muted">前提条件</dt>
          <dd className="text-body">
            {focus.prerequisites.length === 0
              ? "なし"
              : focus.prerequisites.map((id) => findFocus(id)?.name ?? id).join("、")}
          </dd>
          <dt className="text-body-muted">必要政治力</dt>
          <dd className="figures text-body">{focus.politicalPowerCost}</dd>
        </dl>

        <div>
          <p className="mb-1 text-[0.75rem] font-medium tracking-wider text-brass">完了時の効果</p>
          <ul className="flex flex-col gap-1 text-[0.85rem] text-body">
            {focus.effects.length === 0 ? (
              <li className="text-body-muted">なし</li>
            ) : (
              focus.effects.map((effect, index) => <li key={index}>・{describeFocusEffect(effect, state.politics.parties)}</li>)
            )}
          </ul>
        </div>

        {status === "completed" && (
          <p className="rounded-lg border border-affirm/30 bg-affirm/10 px-4 py-3 text-center text-[0.9rem] text-affirm">
            ✅ 完了済み
          </p>
        )}

        {status === "active" && activeProgress && (
          <div className="rounded-lg border border-brass/40 bg-brass/10 px-4 py-3">
            <p className="text-[0.85rem] text-body">
              残り {Math.max(0, Math.ceil(focus.durationDays - activeProgress.daysElapsed))}日
            </p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink">
              <div
                className="h-full bg-brass"
                style={{ width: `${Math.min(100, (activeProgress.daysElapsed / focus.durationDays) * 100)}%` }}
              />
            </div>
          </div>
        )}

        {status === "locked" && (
          <p className="text-[0.85rem] text-alert">
            {missingPrereqs.length > 0
              ? `未完了の前提条件: ${missingPrereqs.map((id) => findFocus(id)?.name ?? id).join("、")}`
              : "まだ解禁されていない。"}
          </p>
        )}

        {status === "available" && (
          <>
            {hasActiveFocus && <p className="text-[0.8rem] text-alert">他の国家方針が進行中は選べない。</p>}
            {!canAfford && <p className="text-[0.8rem] text-alert">政治力が足りない。</p>}
            <button
              type="button"
              disabled={hasActiveFocus || !canAfford}
              onClick={() => {
                dispatch({ type: "START_FOCUS", focusId: focus.id });
                onClose();
              }}
              className="min-h-[52px] w-full rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors enabled:hover:bg-brass/20 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-body-faint"
            >
              国家方針を開始
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
