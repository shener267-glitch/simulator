import type { InterruptOption, SoftInterrupt } from "../types/game";

/** option を書かない割り込みの既定の三択。 */
const DEFAULT_OPTIONS: InterruptOption[] = [
  { id: "answer", label: "中断して確認する", note: "手を止めて出る", minutes: 0 },
  { id: "defer", label: "後回しにする", note: "あとで読む", minutes: 0, leavesMessage: true },
  { id: "ignore", label: "無視する", note: "出ない", minutes: 0 },
];

/**
 * その割り込みで出す手（本セッションでの決定）。
 *
 * 既定は三択のまま。件ごとに「三分だけ聞く」「秘書官に任せる」を足せる。
 * どれを選んでも即座に良し悪しが出ることはない — 断るのも、忙しい総理の
 * 判断として成立するようにしてある。
 */
export function optionsOf(interrupt: SoftInterrupt): InterruptOption[] {
  if (interrupt.options?.length) return interrupt.options;
  return DEFAULT_OPTIONS.map((option) =>
    option.id === "answer"
      ? { ...option, minutes: interrupt.minutes, body: interrupt.body }
      : option,
  );
}

export function optionOf(interrupt: SoftInterrupt, id: string): InterruptOption | undefined {
  return optionsOf(interrupt).find((option) => option.id === id);
}
