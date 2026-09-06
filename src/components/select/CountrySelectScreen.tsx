import { useState } from "react";
import { WorldMap } from "../map/WorldMap";
import { CountryInfoPanel } from "../country/CountryInfoPanel";
import { findCountry, findCountryByIsoNumeric } from "../../data/countries";
import { useGameDispatch, useGameState } from "../../state/GameContext";

/**
 * 国家選択画面（指示書2章）。地図の上の国旗チップは、指で小さな国を
 * 正確につまむのが難しいスマホ向けの近道——地図をクリックする方法自体も
 * そのまま残してある。
 */
export function CountrySelectScreen() {
  const state = useGameState();
  const dispatch = useGameDispatch();
  const [previewIso, setPreviewIso] = useState<string | null>(null);

  const selected = findCountry(state.countries, state.selectedCountryId);
  const previewedCountry = previewIso ? findCountryByIsoNumeric(state.countries, previewIso) : selected;
  const displayIso = previewIso ?? selected?.isoNumeric ?? "";
  const canStart = Boolean(previewedCountry);

  function selectPlayable(id: string) {
    setPreviewIso(findCountry(state.countries, id)?.isoNumeric ?? null);
    dispatch({ type: "SELECT_COUNTRY", id });
  }

  function handleMapClick(isoNumeric: string) {
    setPreviewIso(isoNumeric);
    const country = findCountryByIsoNumeric(state.countries, isoNumeric);
    if (country) dispatch({ type: "SELECT_COUNTRY", id: country.id });
  }

  return (
    <div className="flex h-dvh flex-col">
      <p className="px-4 pt-[calc(0.9rem+env(safe-area-inset-top))] pb-2 text-center text-[0.9rem] font-medium tracking-wider text-body-muted">
        国家を選択してください
      </p>

      <div className="flex gap-2 overflow-x-auto px-4 pb-2">
        {state.countries.map((country) => (
          <button
            key={country.id}
            type="button"
            onClick={() => selectPlayable(country.id)}
            className={`flex min-h-[44px] shrink-0 items-center gap-1.5 rounded border px-3 text-[0.85rem] font-medium transition-colors duration-150 ${
              displayIso === country.isoNumeric
                ? "border-brass bg-brass/15 text-brass"
                : "border-line text-body-muted hover:border-line-strong"
            }`}
          >
            <span aria-hidden>{country.flag}</span>
            {country.name}
          </button>
        ))}
      </div>

      <div className="min-h-0 flex-1">
        <WorldMap countries={state.countries} selectedIsoNumeric={displayIso} onSelectCountry={handleMapClick} />
      </div>

      <div className="flex flex-col gap-4 border-t border-line bg-ink-panel px-5 pt-4 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
        {displayIso ? (
          <CountryInfoPanel isoNumeric={displayIso} country={previewedCountry} />
        ) : (
          <p className="text-[0.85rem] text-body-muted">地図から国をクリックしてください。</p>
        )}

        <button
          type="button"
          disabled={!canStart}
          onClick={() => dispatch({ type: "BEGIN_GAME" })}
          className="min-h-[52px] w-full rounded border border-brass/60 bg-brass/10 text-[0.95rem] font-medium tracking-wider text-brass transition-colors duration-200 enabled:hover:bg-brass/20 disabled:cursor-not-allowed disabled:border-line disabled:bg-transparent disabled:text-body-faint"
        >
          この国で開始
        </button>
      </div>
    </div>
  );
}
