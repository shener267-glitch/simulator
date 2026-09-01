import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}

export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-lg border border-slate-700 bg-slate-800 p-5 shadow-xl">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-slate-100">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="rounded px-2 py-1 text-slate-400 hover:bg-slate-700 hover:text-slate-100"
              aria-label="閉じる"
            >
              ×
            </button>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}
