import type { ReactNode } from "react";
import { CountryInfoPanel } from "./CountryInfoPanel";
import { totalBudget } from "../../engine/economy";
import type { Country } from "../../types/country";
import { useGameState } from "../../state/GameContext";

/**
 * 国家概要（指示書20章）。基本情報に加えて、政治・経済・研究の要約を表示する。
 * プレイヤー自身の国だけが持つ画面——地図で他国を覗いたときの簡易表示
 * （`CountryInfoPanel`）とは別にしてある。
 */
export function NationalOverviewPanel({ country }: { country: Country }) {
  const state = useGameState();
  const { politics, economy, research } = state;

  return (
    <div className="flex flex-col gap-5">
      <CountryInfoPanel isoNumeric={country.isoNumeric} country={country} />

      <Section title="🏛 政治">
        <Row label="政府支持率" value={`${Math.round(politics.stats.governmentSupport)}%`} />
        <Row label="安定度" value={`${Math.round(politics.stats.stability)}%`} />
      </Section>

      <Section title="💰 経済">
        <Row label="GDP" value={`¥${economy.stats.gdpTrillionYen.toLocaleString("ja-JP", { maximumFractionDigits: 0 })}兆`} />
        <Row label="成長率" value={`${economy.stats.gdpGrowthRate >= 0 ? "+" : ""}${economy.stats.gdpGrowthRate.toFixed(1)}%`} />
        <Row label="インフレ" value={`${economy.stats.inflationRate.toFixed(1)}%`} />
        <Row label="失業率" value={`${economy.stats.unemploymentRate.toFixed(1)}%`} />
        <Row label="政府支出" value={`¥${totalBudget(economy.budget).toLocaleString("ja-JP", { maximumFractionDigits: 1 })}兆`} />
      </Section>

      <Section title="🔬 研究">
        <Row label="研究枠" value={`${research.slots}`} />
        <Row label="研究中" value={`${research.active.length}`} />
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 text-[0.75rem] font-medium tracking-wider text-brass">{title}</p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[0.85rem]">{children}</dl>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <>
      <dt className="text-body-muted">{label}</dt>
      <dd className="figures text-body">{value}</dd>
    </>
  );
}
