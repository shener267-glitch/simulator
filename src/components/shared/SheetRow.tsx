import type { ReactNode } from "react";

interface SheetRowProps {
  emoji: string;
  label: string;
  /** ラベルの下の一行。なくてもよい。 */
  note?: string;
  /** 右端。所要時間など。 */
  meta?: ReactNode;
  disabled?: boolean;
  /** 選べるが、選ぶと何かを踏む。押せなくはしない。 */
  warn?: boolean;
  onClick?: () => void;
}

/**
 * シートの中の一行。片手の親指で押せるように 56px を下限にしてある。
 * 選べないものは消さずに薄く出す — 「あるが、いまは選べない」ことが
 * 分かるようにするため（設計書6章）。
 */
export function SheetRow({ emoji, label, note, meta, disabled, warn, onClick }: SheetRowProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`group flex min-h-[56px] w-full items-center gap-3.5 rounded-xl border px-4 py-3 text-left transition-colors duration-200 ${
        disabled
          ? "cursor-not-allowed border-line/50 opacity-45"
          : warn
            ? "border-alert/40 bg-ink-panel hover:border-alert hover:bg-ink-raised active:bg-ink-raised"
            : "border-line bg-ink-panel hover:border-brass/40 hover:bg-ink-raised active:bg-ink-raised"
      }`}
    >
      <span className="shrink-0 text-[1.15rem]" aria-hidden>
        {emoji}
      </span>

      <span className="min-w-0 flex-1">
        <span className="block truncate text-[0.95rem] font-medium text-body">{label}</span>
        {note && (
          <span
            className={`mt-0.5 block truncate text-[0.75rem] ${warn ? "text-alert" : "text-body-muted"}`}
          >
            {note}
          </span>
        )}
      </span>

      {meta && (
        <span
          className={`figures shrink-0 text-[0.78rem] ${
            disabled ? "text-body-faint" : "text-body-muted group-hover:text-brass"
          }`}
        >
          {meta}
        </span>
      )}
    </button>
  );
}
