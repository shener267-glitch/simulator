import { useGameState, useGameDispatch } from "../../state/GameContext";
import { EffectPreviewTags } from "./EffectPreviewTag";
import { ScreenContainer } from "./ScreenContainer";
import type { EventDef } from "../../types/events";

const ACCENTS = {
  amber: "border-amber-500 text-amber-400",
  blue: "border-blue-500 text-blue-400",
  purple: "border-purple-500 text-purple-400",
  rose: "border-rose-500 text-rose-400",
} as const;

interface EventScreenProps {
  def: EventDef;
  kicker: string;
  accent: keyof typeof ACCENTS;
}

export function EventScreen({ def, kicker, accent }: EventScreenProps) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const active = state.activeEvent;

  const node =
    def.dialogue && active
      ? def.dialogue.nodes[active.currentDialogueNodeId ?? def.dialogue.rootNodeId]
      : null;

  const choices = node ? node.choices : (def.choices ?? []);
  const prompt = node ? node.prompt : def.description;
  const speaker = node?.speakerLabel;

  return (
    <ScreenContainer>
      <div className={`border-l-4 pl-3 ${ACCENTS[accent]}`}>
        <p className="text-sm font-semibold uppercase tracking-wide">{kicker}</p>
        <h1 className="text-xl font-bold text-slate-100">{def.title}</h1>
      </div>
      {speaker && <p className="text-sm font-semibold text-slate-400">{speaker}</p>}
      <p className="rounded-md bg-slate-800 p-4 leading-relaxed text-slate-200">{prompt}</p>
      <div className="flex flex-col gap-2">
        {choices.map((choice) => (
          <button
            key={choice.id}
            type="button"
            onClick={() => dispatch({ type: "RESOLVE_EVENT_CHOICE", choiceId: choice.id })}
            className="flex flex-col gap-2 rounded-md border border-slate-700 bg-slate-800 p-3 text-left transition-colors hover:border-slate-500 hover:bg-slate-700"
          >
            <span className="font-medium text-slate-100">{choice.label}</span>
            <EffectPreviewTags effect={choice.effect} />
          </button>
        ))}
      </div>
    </ScreenContainer>
  );
}
