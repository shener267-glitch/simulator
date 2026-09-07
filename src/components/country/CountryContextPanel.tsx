import { CountryInfoPanel } from "./CountryInfoPanel";
import { NationalOverviewPanel } from "./NationalOverviewPanel";
import type { Country } from "../../types/country";
import { useGameState } from "../../state/GameContext";

interface CountryContextPanelProps {
  isoNumeric: string;
  country: Country | undefined;
  onClose: () => void;
  onOpenDiplomacy: () => void;
}

/**
 * 地図で対象を選んだときのコンテキストパネル（指示書11章）。全画面Modalでは
 * 地図が隠れてしまう——HOI4のように地図の上に張り付く、閉じない限り
 * 地図を隠さないドック型のパネルにする。自国を選んだ場合は国家概要
 * （政治・経済・研究の要約）まで出す。
 */
export function CountryContextPanel({ isoNumeric, country, onClose, onOpenDiplomacy }: CountryContextPanelProps) {
  const state = useGameState();
  const isPlayerCountry = Boolean(country) && country?.id === state.playerCountryId;
  const hasDiplomacy = country && !isPlayerCountry && Boolean(state.diplomacy.relations[country.id]);

  return (
    <div className="absolute right-3 top-3 z-20 flex max-h-[calc(100%-1.5rem)] w-[21rem] max-w-[90%] animate-fade-in flex-col overflow-hidden rounded-lg border border-line-strong bg-ink-panel/95 shadow-2xl shadow-black/50 backdrop-blur-sm">
      <div className="flex shrink-0 items-center justify-between gap-2 border-b border-line px-4 py-2.5">
        <p className="text-[0.75rem] font-medium tracking-wider text-brass">選択中</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="閉じる"
          className="flex h-8 w-8 items-center justify-center rounded text-lg leading-none text-body-muted transition-colors hover:bg-white/5 hover:text-body"
        >
          ×
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {isPlayerCountry && country ? (
          <NationalOverviewPanel country={country} />
        ) : (
          <div className="flex flex-col gap-4">
            <CountryInfoPanel isoNumeric={isoNumeric} country={country} />
            {hasDiplomacy && (
              <button
                type="button"
                onClick={onOpenDiplomacy}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded border border-brass/60 bg-brass/10 text-[0.85rem] font-medium text-brass transition-colors hover:bg-brass/20"
              >
                🌍 外交関係を見る
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
