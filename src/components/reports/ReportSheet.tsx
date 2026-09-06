import { useEffect, useState } from "react";
import { Modal } from "../shared/Modal";
import { SheetRow } from "../shared/SheetRow";
import { useGameDispatch, useGameState } from "../../state/GameContext";
import type { Report } from "../../types/game";

/**
 * 報告書の一覧と本文（設計書10〜11章）。読むこと自体は時間を使わない
 * ——覗くための窓であって、予定や会議のような「枠」ではない。
 */
export function ReportSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [openId, setOpenId] = useState<string | null>(null);

  const arrived = state.reports
    .filter((report) => report.at <= state.clock.totalMinutes)
    .sort((a, b) => b.at - a.at);
  const open = arrived.find((report) => report.id === openId);

  useEffect(() => {
    if (open && !open.read) dispatch({ type: "READ_REPORT", reportId: open.id });
  }, [open, dispatch]);

  if (open) {
    return (
      <Modal title={open.title} onClose={() => setOpenId(null)}>
        <ReportDetail report={open} />
      </Modal>
    );
  }

  return (
    <Modal title="報告書" onClose={onClose}>
      {arrived.length === 0 ? (
        <p className="py-6 text-center text-[0.85rem] text-body-muted">まだ届いている報告書はない。</p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {arrived.map((report) => (
            <SheetRow
              key={report.id}
              emoji={report.urgent ? "🚨" : report.read ? "📄" : "🔴"}
              label={report.title}
              note={`${report.from} · 確度${report.confidence}`}
              onClick={() => setOpenId(report.id)}
            />
          ))}
        </div>
      )}
    </Modal>
  );
}

function ReportDetail({ report }: { report: Report }) {
  return (
    <div className="flex flex-col gap-4">
      <p className="figures text-[0.75rem] text-body-muted">
        {report.from} · 確度{report.confidence}
      </p>
      <Section label="概要" text={report.summary} />
      <Section label="内容" text={report.findings} />
      <Section label="分析" text={report.analysis} />
      <Section label="見通し" text={report.outlook} />
    </div>
  );
}

function Section({ label, text }: { label: string; text: string }) {
  return (
    <div>
      <p className="text-[0.75rem] font-medium tracking-wider text-brass">{label}</p>
      <p className="mt-1 whitespace-pre-line text-[0.9rem] leading-[1.9] text-body">{text}</p>
    </div>
  );
}
