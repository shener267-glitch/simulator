import { Modal } from "../shared/Modal";

interface ReshuffleModalProps {
  onConfirm: () => void;
  onClose: () => void;
}

export function ReshuffleModal({ onConfirm, onClose }: ReshuffleModalProps) {
  return (
    <Modal title="内閣改造" onClose={onClose}>
      <p className="mb-4 text-sm text-slate-300">
        内閣改造を行うと、各派閥の忠誠度が上がり造反圧力がリセットされますが、支持率がやや低下し、
        1日を消費します。実行しますか?
      </p>
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-4 py-2 text-slate-400 hover:bg-slate-700"
        >
          やめる
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-md bg-indigo-600 px-4 py-2 font-medium text-white hover:bg-indigo-500"
        >
          内閣改造を行う
        </button>
      </div>
    </Modal>
  );
}
