import { useState } from "react";
import { Modal } from "../shared/Modal";
import { useGameState } from "../../state/GameContext";

/**
 * 省庁・国会・外交への入口（設計書33章）。この版では本格的なやり取りは
 * 作らない——まずは「そこにアクセスできる」状態を用意し、中身は静的な
 * 参照情報にとどめる（設計書23章、今回作らないもの）。
 */
const TABS = ["省庁", "国会", "外交"] as const;
type Tab = (typeof TABS)[number];

const MINISTRIES = [
  "内閣府",
  "総務省",
  "法務省",
  "外務省",
  "財務省",
  "文部科学省",
  "厚生労働省",
  "農林水産省",
  "経済産業省",
  "国土交通省",
  "環境省",
  "防衛省",
];

export function GovernmentSheet({ onClose }: { onClose: () => void }) {
  const state = useGameState();
  const [tab, setTab] = useState<Tab>("省庁");

  return (
    <Modal title="国家の窓" onClose={onClose}>
      <div className="mb-4 flex gap-2">
        {TABS.map((candidate) => (
          <button
            key={candidate}
            type="button"
            onClick={() => setTab(candidate)}
            className={`min-h-[40px] flex-1 rounded-lg border px-3 text-[0.85rem] font-medium transition-colors duration-200 ${
              tab === candidate
                ? "border-brass bg-brass/15 text-brass"
                : "border-line text-body-muted hover:border-line-strong"
            }`}
          >
            {candidate}
          </button>
        ))}
      </div>

      {tab === "省庁" && (
        <div className="flex flex-col gap-3">
          <p className="text-[0.8rem] text-body-muted">
            【参考】2024年10月発足時点の府省庁。個々の大臣とのやり取りは今後の版で広げる。
          </p>
          <div className="grid grid-cols-2 gap-2">
            {MINISTRIES.map((ministry) => (
              <div key={ministry} className="rounded-lg border border-line bg-ink-panel px-3 py-2.5 text-[0.85rem] text-body">
                {ministry}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "国会" && (
        <div className="flex flex-col gap-3 text-[0.85rem] leading-[1.9] text-body">
          <p className="text-[0.8rem] text-body-muted">【参考】2024年10月1日時点のおおよその勢力図。</p>
          <p>
            自由民主党と公明党の連立が、衆議院・参議院のいずれでも過半数を占めている。野党第一党は立憲民主党。
          </p>
          <p className="text-body-muted">
            国会審議そのものへの介入は、この版ではまだ作っていない。指名選挙と閣議のような、日程上決まっている場面だけが会議として開く。
          </p>
        </div>
      )}

      {tab === "外交" && (
        <div className="flex flex-col gap-3 text-[0.85rem] leading-[1.9] text-body">
          <p className="text-[0.8rem] text-body-muted">【参考】2024年10月時点の主な対外関係。</p>
          <p>日米同盟を基軸に、近隣国・地域とは経済・安全保障の両面で関係が続いている。</p>
          <p className="text-body-muted">
            首脳会談や条約交渉のような具体的なやり取りは、この版ではまだ作っていない。周辺情勢は「{state.nation.regionalTension}
            」という三段階だけで背景に置いてある。
          </p>
        </div>
      )}
    </Modal>
  );
}
