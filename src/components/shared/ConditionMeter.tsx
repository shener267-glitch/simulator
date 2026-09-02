import { METER_CELLS, type ConditionGauge } from "../../engine/condition";

/** 埋まったマスの色は、その状態が良い側か悪い側かで変わる。 */
const FILL: Record<ConditionGauge["label"], string> = {
  低: "bg-affirm",
  中: "bg-brass",
  高: "bg-alert",
};

/**
 * 五つのマスと「低/中/高」（設計書30章）。文字の ▰▱ ではなく span で描く —
 * 端末の書体で幅が変わらないようにするため。数字はどこにも出さない。
 */
export function ConditionMeter({ label, gauge }: { label: string; gauge: ConditionGauge }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="shrink-0 text-[0.72rem] text-body-muted">{label}</span>

      <span className="flex items-center gap-1" role="img" aria-label={`${label} ${gauge.label}`}>
        {Array.from({ length: METER_CELLS }, (_, cell) => (
          <span
            key={cell}
            className={`h-1.5 w-4 rounded-full transition-colors duration-500 ${
              cell < gauge.filled ? FILL[gauge.label] : "bg-line-strong"
            }`}
          />
        ))}
      </span>

      <span className="shrink-0 text-[0.72rem] font-medium text-body-muted">{gauge.label}</span>
    </div>
  );
}
