import type { PolicyArea } from "../../types/policy";
import { Modal } from "../shared/Modal";
import { EffectPreviewTags } from "../shared/EffectPreviewTag";

interface PolicyOptionModalProps {
  area: PolicyArea;
  onChoose: (optionId: string) => void;
  onClose: () => void;
}

export function PolicyOptionModal({ area, onChoose, onClose }: PolicyOptionModalProps) {
  return (
    <Modal title={area.name} onClose={onClose}>
      <div className="flex flex-col gap-2">
        {area.options.map((option) => (
          <button
            key={option.id}
            type="button"
            onClick={() => onChoose(option.id)}
            className="flex flex-col gap-2 rounded-md border border-slate-700 bg-slate-900 p-3 text-left hover:border-slate-500"
          >
            <span className="font-medium text-slate-100">{option.label}</span>
            <span className="text-sm text-slate-400">{option.description}</span>
            <EffectPreviewTags effect={option.effect} />
          </button>
        ))}
      </div>
    </Modal>
  );
}
