import type { ReactNode } from "react";
import { Panel } from "./Panel";

interface PlaceholderScreenProps {
  title: string;
  description: string;
  onClose: () => void;
  /** すでに実データがあるものは、ここに差し込む（指示書16章：仮画面でもいいが、あるものは出す）。 */
  children?: ReactNode;
}

/**
 * まだ内部システムを持たない国家管理メニューの入口（指示書16・17章）。
 * 「後から各システムを追加できるUI構造にする」——押せば必ず何かが開く、
 * という土台だけを先に用意する。
 */
export function PlaceholderScreen({ title, description, onClose, children }: PlaceholderScreenProps) {
  return (
    <Panel title={title} onClose={onClose}>
      <div className="flex flex-col gap-5 px-4 pb-[calc(2rem+env(safe-area-inset-bottom))] pt-4">
        <p className="text-[0.85rem] text-body-muted">{description}</p>
        {children}
        <div className="rounded-lg border border-dashed border-line px-3.5 py-3 text-[0.78rem] text-body-faint">
          このシステムは今後のPhaseで実装予定。ここはその入口。
        </div>
      </div>
    </Panel>
  );
}
