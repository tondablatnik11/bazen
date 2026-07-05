"use client";

import { ChangeEvent } from "react";
import { Droplet } from "lucide-react";

interface VolumeInputProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
}

/**
 * Vstup pro objem bazénu – kombinace slideru a číselného pole.
 * Uživatel může buď posouvat, nebo přímo zapsat přesnou hodnotu.
 */
export function VolumeInput({
  value,
  min,
  max,
  step = 1,
  onChange,
}: VolumeInputProps) {
  const handleSlider = (e: ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    if (!Number.isNaN(v)) onChange(v);
  };

  const handleNumber = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(",", ".");
    const v = parseFloat(raw);
    if (!Number.isNaN(v)) onChange(v);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <label
          htmlFor="volume-input"
          className="text-sm font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5"
        >
          <Droplet className="w-4 h-4 text-pool-500 dark:text-pool-400" />
          Objem bazénu
        </label>
        <div className="flex items-center gap-1">
          <input
            id="volume-input"
            type="number"
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleNumber}
            className="w-20 px-2 py-1 rounded-lg bg-pool-100 dark:bg-pool-900/60 border border-pool-200 dark:border-pool-700 text-pool-900 dark:text-pool-100 font-bold text-right tabular-nums focus:outline-none focus:ring-2 focus:ring-pool-400 dark:focus:ring-pool-500"
          />
          <span className="text-xs font-medium text-pool-700 dark:text-pool-300">m³</span>
        </div>
      </div>

      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={handleSlider}
        className="pool-input"
        aria-label="Posuvník objemu bazénu"
      />

      <div className="flex justify-between text-[10px] font-medium text-slate-400 dark:text-slate-500 px-0.5">
        <span>{min} m³</span>
        <span>{max} m³</span>
      </div>
    </div>
  );
}