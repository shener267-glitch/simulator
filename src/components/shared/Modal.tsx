import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
}

/**
 * Renders as a bottom sheet on phones (thumb-reachable, full width) and as a
 * centered dialog from `sm` up.
 */
export function Modal({ title, children, onClose }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-lg flex-col rounded-t-2xl border border-slate-700 bg-slate-800 shadow-xl sm:max-h-[85dvh] sm:rounded-lg"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-2 border-b border-slate-700 px-4 py-3 sm:px-5">
          <h2 className="min-w-0 truncate text-lg font-bold text-slate-100">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded text-2xl leading-none text-slate-400 hover:bg-slate-700 hover:text-slate-100"
              aria-label="閉じる"
            >
              ×
            </button>
          )}
        </div>
        <div className="overflow-y-auto px-4 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-4 sm:px-5 sm:pb-5">
          {children}
        </div>
      </div>
    </div>
  );
}
