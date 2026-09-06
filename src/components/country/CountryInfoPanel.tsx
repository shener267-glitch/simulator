import type { Country } from "../../types/country";
import { countryNameOf } from "../../engine/countryNames";

interface CountryInfoPanelProps {
  isoNumeric: string;
  country: Country | undefined;
}

/**
 * 国家情報パネル（指示書7章）。カタログにある7か国は詳しく、それ以外は
 * 名前だけの簡易表示になる——「他国をクリックできる」ことと「詳細な国家
 * シミュレーションは要らない」ことの両方を満たす形。
 */
export function CountryInfoPanel({ isoNumeric, country }: CountryInfoPanelProps) {
  if (!country) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-[1.05rem] font-medium text-body">{countryNameOf(isoNumeric)}</p>
        <p className="text-[0.8rem] text-body-muted">詳細データは未整備（Phase 2以降で追加）。</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[1.15rem] font-medium text-body">
        <span className="mr-2" aria-hidden>
          {country.flag}
        </span>
        {country.name}
      </p>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1.5 text-[0.85rem]">
        <dt className="text-body-muted">首都</dt>
        <dd className="text-body">{country.capital}</dd>
        <dt className="text-body-muted">人口</dt>
        <dd className="figures text-body">{country.population.toLocaleString("ja-JP")}</dd>
        <dt className="text-body-muted">政府</dt>
        <dd className="text-body">{country.government}</dd>
        <dt className="text-body-muted">政治体制</dt>
        <dd className="text-body">{country.politicalSystem}</dd>
      </dl>
    </div>
  );
}
