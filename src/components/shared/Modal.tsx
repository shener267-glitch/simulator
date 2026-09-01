import type { ReactNode } from "react";

interface ModalProps {
  title: string;
  children: ReactNode;
  onClose?: () => void;
  /** Marks the sheet as something that arrived on its own and wants attention. */
  urgent?: boolean;
}

/**
 * Renders as a bottom sheet on phones (thumb-reachable, full width) and as a
 * centered dialog from `sm` up.
 */
export function Modal({ title, children, onClose, urgent = false }: ModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="flex max-h-[88dvh] w-full max-w-[27rem] animate-sheet-up flex-col overflow-hidden rounded-t-3xl border border-line bg-ink-panel shadow-2xl shadow-black/60 sm:max-h-[85dvh] sm:rounded-3xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`h-px w-full ${urgent ? "bg-alert" : "bg-brass"}`} />

        <div className="flex items-center justify-between gap-2 border-b border-line px-5 py-4">
          <h2 className="min-w-0 truncate text-[1.05rem] font-medium text-body">{title}</h2>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-xl leading-none text-body-muted transition-colors hover:bg-white/5 hover:text-body"
              aria-label="閉じる"
            >
              ×
            </button>
          )}
        </div>

        <div className="overflow-y-auto px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5">{children}</div>
      </div>
    </div>
  );
}
