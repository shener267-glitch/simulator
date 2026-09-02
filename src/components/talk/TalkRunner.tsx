import { ScreenContainer } from "../shared/ScreenContainer";
import { PlaceHeader } from "../place/PlaceHeader";
import { SheetRow } from "../shared/SheetRow";
import { formatDuration } from "../../engine/clock";
import { choicesAt, hasSomethingLeft } from "../../engine/talk";
import { choiceOf, nodeOf } from "../../types/talk";
import { findTree } from "../../data/talk";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 人と話す（設計書9〜11章）。相手はメニューではなく、こちらの聞き方に
 * よって別のことを返してくる。話題を一つ選ぶたびに時間が減るので、
 * 「全部聞く」は最初から選択肢に入っていない。
 */
export function TalkRunner() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  if (state.mode.kind !== "talk") return null;
  const mode = state.mode;

  const tree = findTree(mode.treeId);
  const node = tree && nodeOf(tree, mode.nodeId);
  if (!tree || !node) return null;

  // 返事を再生中なら、その話題。話題を選んでいる最中なら undefined。
  const running = mode.run;
  const topic =
    running && running.source.kind === "talk" ? choiceOf(tree, running.source.choiceId) : undefined;

  return (
    <ScreenContainer width="narrow">
      <PlaceHeader />

      <div className="flex items-baseline justify-between gap-3 border-b border-line pb-3">
        <h1 className="min-w-0 truncate text-[1.05rem] font-medium text-body">
          <span className="mr-2" aria-hidden>
            {tree.emoji}
          </span>
          {tree.short}
        </h1>
        <span className="figures shrink-0 text-[0.8rem] text-body-muted">
          {formatDuration(mode.minutesSpent + (running?.minutesSpent ?? 0))}
        </span>
      </div>

      {running && topic?.kind === "topic" ? (
        <>
          <div key={topic.id} className="flex animate-fade-up flex-col gap-4">
            {topic.reply.speaker && (
              <p className="text-[0.8rem] font-medium tracking-wider text-brass">
                {topic.reply.speaker}
              </p>
            )}
            <p className="whitespace-pre-line text-[0.95rem] leading-[2] text-body">
              {topic.reply.text}
            </p>
          </div>

          {running.interrupted && (
            <p className="rounded-xl border border-alert/30 bg-alert/10 px-4 py-3 text-[0.88rem] leading-[1.9] text-alert">
              ——そこで時間になった。
            </p>
          )}

          <button
            type="button"
            onClick={() => dispatch({ type: "TALK_BACK" })}
            className="mt-1 min-h-[52px] w-full rounded-xl bg-brass px-4 text-[0.95rem] font-medium text-ink transition-colors duration-200 hover:bg-brass/90 active:bg-brass/80"
          >
            {running.interrupted ? "わかった" : "戻る"}
          </button>
        </>
      ) : (
        <>
          {node.prompt && (
            <p className="whitespace-pre-line text-[0.95rem] leading-[2] text-body">{node.prompt}</p>
          )}

          <div className="flex flex-col gap-2.5">
            {choicesAt(state, tree, node).map((choice) => {
              if (choice.kind === "goto") {
                const empty = !hasSomethingLeft(state, tree, choice.to);
                return (
                  <SheetRow
                    key={choice.id}
                    emoji="›"
                    label={choice.label}
                    note={empty ? "いまは頼むことがない" : undefined}
                    disabled={empty}
                    onClick={() => dispatch({ type: "TALK_GOTO", nodeId: choice.to })}
                  />
                );
              }

              if (choice.kind === "end") {
                return (
                  <SheetRow
                    key={choice.id}
                    emoji="✕"
                    label={choice.label}
                    onClick={() => dispatch({ type: "END_TALK" })}
                  />
                );
              }

              return (
                <SheetRow
                  key={choice.id}
                  emoji="·"
                  label={choice.label}
                  meta={formatDuration(choice.reply.minutes)}
                  onClick={() => dispatch({ type: "TALK_CHOOSE", choiceId: choice.id })}
                />
              );
            })}
          </div>

          {mode.nodeId !== tree.rootId && (
            <button
              type="button"
              onClick={() => dispatch({ type: "TALK_GOTO", nodeId: tree.rootId })}
              className="min-h-[52px] w-full rounded-xl border border-line-strong px-4 text-[0.9rem] font-medium text-body-muted transition-colors duration-200 hover:border-brass/40 hover:text-body active:bg-white/5"
            >
              戻る
            </button>
          )}
        </>
      )}
    </ScreenContainer>
  );
}
