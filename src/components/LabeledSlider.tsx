"use client";

import { ChangeEvent } from "react";
import { Info } from "lucide-react";

interface LabeledSliderProps {
  label: string;
  unit?: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  /** Pomocný popisek pod sliderem (např. "Ideální zóna") */
  helper?: string;
  /** Doporučené minimum (v rámci rozsahu) – vizuálně vyznačeno zeleně */
  idealMin?: number;
  /** Doporučené maximum (v rámci rozsahu) – vizuálně vyznačeno zeleně */
  idealMax?: number;
  /** Barevný akcent pro thumb (default: pool) */
  accent?: "pool" | "amber";
  /** Přesnost zobrazení (počet desetinných míst) */
  decimals?: number;
  /** Volitelný info tooltip */
  hint?: string;
  /** Volitelná ikona vlevo od labelu */
  icon?: React.ComponentType<{ className?: string }>;
}

/**
 * Stylový posuvník s popiskem, aktuální hodnotou a vyznačením ideální zóny.
 * Mobile-first: velký thumb (touch-friendly ≥ 24px), přehledné popisky.
 */
export function LabeledSlider({
  label,
  unit,
  value,
  min,
  max,
  step,
  onChange,
  helper,
  idealMin,
  idealMax,
  accent = "pool",
  decimals = 1,
  hint,
  icon: Icon,
}: LabeledSliderProps) {
  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!Number.isNaN(v)) onChange(v);
  };

  const accentRing =
    accent === "amber"
      ? "accent-amber-500 dark:accent-amber-400 [&::-webkit-slider-thumb]:border-amber-500 dark:[&::-webkit-slider-thumb]:border-amber-400 [&::-moz-range-thumb]:border-amber-500 dark:[&::-moz-range-thumb]:border-amber-400"
      : "accent-pool-500 dark:accent-pool-400 [&::-webkit-slider-thumb]:border-pool-500 dark:[&::-webkit-slider-thumb]:border-pool-400 [&::-moz-range-thumb]:border-pool-500 dark:[&::-moz-range-thumb]:border-pool-400";

  // Výpočet procenta ideální zóny (pro pozadí)
  const totalRange = max - min;
  const idealStartPct =
    idealMin !== undefined ? ((idealMin - min) / totalRange) * 100 : null;
  const idealWidthPct =
    idealMin !== undefined && idealMax !== undefined
      ? ((idealMax - idealMin) / totalRange) * 100
      : null;

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2">
          {Icon && (
            <Icon
              className={`w-4 h-4 ${
                accent === "amber" ? "text-amber-500 dark:text-amber-400" : "text-pool-500 dark:text-pool-400"
              }`}
            />
          )}
          <label className="text-sm font-semibold text-slate-700 dark:text-slate-200">{label}</label>
          {hint && (
            <span title={hint} className="text-slate-400 dark:text-slate-500 cursor-help">
              <Info className="w-3.5 h-3.5" />
            </span>
          )}
        </div>
        <div
          className={`px-3 py-1 rounded-lg font-bold tabular-nums text-base ${
            accent === "amber"
              ? "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-200 border border-amber-200 dark:border-amber-700"
              : "bg-pool-100 dark:bg-pool-900/60 text-pool-800 dark:text-pool-100 border border-pool-200 dark:border-pool-700"
          }`}
        >
          {value.toFixed(decimals)}
          {unit && <span className="text-xs font-medium ml-1">{unit}</span>}
        </div>
      </div>

      <div className="relative pt-1 pb-3">
        {idealStartPct !== null && idealWidthPct !== null && (
          <>
            <div
              className="absolute h-3 rounded-full bg-emerald-200/70 dark:bg-emerald-500/25 border border-emerald-300/80 dark:border-emerald-500/50 pointer-events-none"
              style={{
                left: `${idealStartPct}%`,
                width: `${idealWidthPct}%`,
                top: "4px",
              }}
              aria-hidden="true"
            />
            <div
              className="absolute -top-0 text-[10px] font-medium text-emerald-700 dark:text-emerald-300 pointer-events-none whitespace-nowrap"
              style={{
                left: `calc(${idealStartPct}% + ${idealWidthPct / 2}%)`,
                transform: "translateX(-50%)",
              }}
            >
              Ideální zóna
            </div>
          </>
        )}

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={handleChange}
          className={`pool-input relative z-10 ${accentRing}`}
          aria-label={label}
        />
      </div>

      {helper && (
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{helper}</p>
      )}

      <div className="flex justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500 px-0.5">
        <span>{min.toFixed(decimals)}</span>
        <span>{max.toFixed(decimals)}</span>
      </div>
    </div>
  );
}