import type { ReactNode } from "react";

interface PanelProps {
  title: string;
  children: ReactNode;
  onClose: () => void;
  /** ヘッダー右側、閉じるボタンの手前に足す追加ボタンなど。 */
  actions?: ReactNode;
}

/**
 * 全画面のスライド表示パネル（指示書22章）。政治画面・国家方針ツリーのような
 * 情報量の多い画面は、`Modal`のボトムシートでは狭い——画面いっぱいに
 * 使い、スライドで出入りする。
 */
export function Panel({ title, children, onClose, actions }: PanelProps) {
  return (
    <div className="fixed inset-0 z-40 flex animate-sheet-up flex-col bg-ink">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 pt-[calc(0.75rem+env(safe-area-inset-top))] pb-3">
        <h1 className="min-w-0 truncate text-[1.05rem] font-medium text-body">{title}</h1>
        <div className="flex shrink-0 items-center gap-1.5">
          {actions}
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className="flex h-11 w-11 items-center justify-center rounded-lg text-xl leading-none text-body-muted transition-colors hover:bg-white/5 hover:text-body"
          >
            ×
          </button>
        </div>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  );
}
