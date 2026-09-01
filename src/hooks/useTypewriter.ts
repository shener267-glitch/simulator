import { useCallback, useEffect, useMemo, useState } from "react";

/** Roughly a comfortable reading pace — fast enough not to be a wait. */
const CHAR_MS = 30;
const COMMA_MS = 150;
const PERIOD_MS = 260;
const LINE_MS = 340;
/** Let the fade settle before the first character lands. */
const OPENING_MS = 220;

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export interface Typewriter {
  /** Each line, revealed as far as the typing has got. */
  revealed: string[];
  done: boolean;
  /** Show the rest of the text at once. */
  skip: () => void;
}

/**
 * Reveals a run of sentences one character at a time, pausing a beat at
 * punctuation and a longer one between sentences. Used only by the 05:00
 * opening (本セッションでの決定) — everywhere else text is simply there.
 */
export function useTypewriter(lines: string[]): Typewriter {
  const glyphs = useMemo(() => lines.map((line) => Array.from(line)), [lines]);

  const flat = useMemo(
    () =>
      glyphs.flatMap((line) =>
        line.map((character, index) => ({ character, endsLine: index === line.length - 1 })),
      ),
    [glyphs],
  );

  const total = flat.length;
  const [count, setCount] = useState(() => (prefersReducedMotion() ? total : 0));

  // A new beat restarts the typing.
  useEffect(() => {
    setCount(prefersReducedMotion() ? total : 0);
  }, [flat, total]);

  useEffect(() => {
    if (count >= total) return;

    const previous = count > 0 ? flat[count - 1] : null;
    let delay = OPENING_MS;
    if (previous) {
      if (previous.endsLine) delay = LINE_MS;
      else if ("。！？".includes(previous.character)) delay = PERIOD_MS;
      else if ("、".includes(previous.character)) delay = COMMA_MS;
      else delay = CHAR_MS;
    }

    const timer = window.setTimeout(() => setCount((current) => current + 1), delay);
    return () => window.clearTimeout(timer);
  }, [count, total, flat]);

  const skip = useCallback(() => setCount(total), [total]);

  const revealed = useMemo(() => {
    let budget = count;
    return glyphs.map((line) => {
      const take = Math.max(0, Math.min(line.length, budget));
      budget -= line.length;
      return line.slice(0, take).join("");
    });
  }, [glyphs, count]);

  return { revealed, done: count >= total, skip };
}
