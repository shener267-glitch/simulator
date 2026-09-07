import { useState } from "react";
import { Panel } from "../shared/Panel";
import { Modal } from "../shared/Modal";
import { usePanZoom } from "../../hooks/usePanZoom";
import { TECHNOLOGIES, TREE_SIZE, findTech } from "../../data/technologies";
import { describeTechEffect, isTechAvailable } from "../../engine/research";
import type { ResearchCategory, TechTemplate } from "../../types/research";
import { useGameDispatch, useGameState } from "../../state/GameContext";

const NODE_WIDTH = 140;
const NODE_HEIGHT = 54;

type TechStatus = "completed" | "active" | "available" | "locked";

const CATEGORY_LABELS: Record<ResearchCategory, string> = {
  basic_science: "🔬 基礎科学",
  computing_ai: "💻 情報・AI",
  energy: "⚡ エネルギー",
  industry: "🏭 産業技術",
  aerospace: "🚀 航空宇宙",
  military: "🪖 軍事技術",
};

function statusOf(
  tech: TechTemplate,
  completedTechIds: string[],
  unlockedTechIds: string[],
  activeTechIds: string[],
): TechStatus {
  if (completedTechIds.includes(tech.id)) return "completed";
  if (activeTechIds.includes(tech.id)) return "active";
  if (isTechAvailable(tech, completedTechIds, unlockedTechIds, activeTechIds)) return "available";
  return "locked";
}

const STATUS_STYLE: Record<TechStatus, { fill: string; border: string; text: string }> = {
  completed: { fill: "bg-brass/25", border: "border-brass", text: "text-brass" },
  active: { fill: "bg-brass/10", border: "border-brass", text: "text-body" },
  available: { fill: "bg-ink-raised", border: "border-line-strong", text: "text-body" },
  locked: { fill: "bg-ink-panel", border: "border-line", text: "text-body-faint" },
};

/** 研究ツリー（指示書13〜17章）。国家方針ツリーと同じ`usePanZoom`で操作する。 */
export function TechTreeScreen({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const [detailId, setDetailId] = useState<string | null>(null);
  const { svgRef, transform, handlers } = usePanZoom<SVGSVGElement>({
    width: TREE_SIZE.width,
    height: TREE_SIZE.height,
    maxScale: 4,
    hitAttribute: "data-tech-id",
    onTap: setDetailId,
  });

  const { completedTechIds, unlockedTechIds, active } = state.research;
  const activeTechIds = active.map((progress) => progress.techId);

  return (
    <Panel title="🔬 研究ツリー" onClose={onClose}>
      <svg ref={svgRef} viewBox={`0 0 ${TREE_SIZE.width} ${TREE_SIZE.height}`} className="h-full w-full touch-none select-none" {...handlers}>
        <g transform={`translate(${transform.x} ${transform.y}) scale(${transform.scale})`}>
          {TECHNOLOGIES.flatMap((tech) =>
            tech.prerequisites.map((prereqId) => {
              const from = findTech(prereqId);
              if (!from) return null;
              const done = completedTechIds.includes(prereqId);
              return (
                <line
                  key={`${prereqId}->${tech.id}`}
                  x1={from.position.x}
                  y1={from.position.y + NODE_HEIGHT / 2}
                  x2={tech.position.x}
                  y2={tech.position.y - NODE_HEIGHT / 2}
                  stroke={done ? "#c8a96b" : "#2a303b"}
                  strokeWidth={2}
                  vectorEffect="non-scaling-stroke"
                />
              );
            }),
          )}

          {TECHNOLOGIES.map((tech) => {
            const status = statusOf(tech, completedTechIds, unlockedTechIds, activeTechIds);
            const style = STATUS_STYLE[status];
            const progress = status === "active" ? active.find((p) => p.techId === tech.id) : undefined;
            const percent = progress ? Math.min(1, progress.daysElapsed / tech.durationDays) : null;

            return (
              <foreignObject
                key={tech.id}
                data-tech-id={tech.id}
                x={tech.position.x - NODE_WIDTH / 2}
                y={tech.position.y - NODE_HEIGHT / 2}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
              >
                <div className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded border px-1.5 text-center ${style.fill} ${style.border}`}>
                  <span className={`text-[0.68rem] font-medium leading-tight ${style.text}`}>
                    {status === "completed" && "✅ "}
                    {tech.name}
                  </span>
                  {percent !== null && (
                    <div className="h-1 w-[85%] overflow-hidden rounded-full bg-ink">
                      <div className="h-full bg-brass" style={{ width: `${percent * 100}%` }} />
                    </div>
                  )}
                </div>
              </foreignObject>
            );
          })}
        </g>
      </svg>

      {detailId && <TechDetailModal techId={detailId} onClose={() => setDetailId(null)} />}
    </Panel>
  );
}

function TechDetailModal({ techId, onClose }: { techId: string; onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const tech = findTech(techId);
  if (!tech) return null;

  const { completedTechIds, unlockedTechIds, active, slots } = state.research;
  const activeTechIds = active.map((progress) => progress.techId);
  const status = statusOf(tech, completedTechIds, unlockedTechIds, activeTechIds);
  const progress = active.find((p) => p.techId === tech.id);
  const missingPrereqs = tech.prerequisites.filter((id) => !completedTechIds.includes(id));
  const slotsFull = active.length >= slots;

  return (
    <Modal title={tech.name} onClose={onClose}>
      <div className="flex flex-col gap-4">
        <p className="text-[0.75rem] text-body-muted">{CATEGORY_LABELS[tech.category]}</p>
        <p className="text-[0.9rem] leading-[1.8] text-body">{tech.description}</p>

        <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[0.85rem]">
          <dt className="text-body-muted">所要期間</dt>
          <dd className="figures text-body">{tech.durationDays}日</dd>
          <dt className="text-body-muted">前提条件</dt>
          <dd className="text-body">
            {tech.prerequisites.length === 0 ? "なし" : tech.prerequisites.map((id) => findTech(id)?.name ?? id).join("、")}
          </dd>
        </dl>

        <div>
          <p className="mb-1 text-[0.75rem] font-medium tracking-wider text-brass">研究完了時の効果</p>
          <ul className="flex flex-col gap-1 text-[0.85rem] text-body">
            {tech.effects.length === 0 ? <li className="text-body-muted">なし</li> : tech.effects.map((effect, index) => <li key={index}>・{describeTechEffect(effect)}</li>)}
          </ul>
        </div>

        {status === "completed" && (
          <p className="rounded-lg border border-affirm/30 bg-affirm/10 px-4 py-3 text-center text-[0.9rem] text-affirm">✅ 完了済み</p>
        )}

        {status === "active" && progress && (
          <div className="rounded-lg border border-brass/40 bg-brass/10 px-4 py-3">
            <p className="text-[0.85rem] text-body">残り {Math.max(0, Math.ceil(tech.durationDays - progress.daysElapsed))}日</p>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-ink">
              <div className="h-full bg-brass" style={{ width: `${Math.min(100, (progress.daysElapsed / tech.durationDays) * 100)}%` }} />
            </div>
          </div>
        )}

        {status === "locked" && (
          <p className="text-[0.85rem] text-alert">
            {missingPrereqs.length > 0
              ? `未完了の前提条件: ${missingPrereqs.map((id) => findTech(id)?.name ?? id).join("、")}`
              : "まだ解禁されていない。"}
          </p>
        )}

        {status === "available" && (
          <>
            {slotsFull && <p className="text-[0.8rem] text-alert">空いている研究枠が無い。</p>}
            <button
              type="button"
              disabled={slotsFull}
              onClick={() => {
                dispatch({ type: "START_RESEARCH", techId: tech.id });
                onClose();
              }}
              className="min-h-[52px] w-full rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium text-brass transition-colors enabled:hover:bg-brass/20 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-body-faint"
            >
              研究を始める
            </button>
          </>
        )}
      </div>
    </Modal>
  );
}
