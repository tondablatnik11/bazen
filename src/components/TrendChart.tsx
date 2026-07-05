"use client";

import { TrendingUp } from "lucide-react";
import type { HistoryRecord } from "@/lib/history";

interface TrendChartProps {
  records: HistoryRecord[];
}

export function TrendChart({ records }: TrendChartProps) {
  if (records.length < 2) return null;

  const data = records.slice(-12);

  const W = 320;
  const H = 90;
  const padding = 8;

  const xFor = (i: number) =>
    padding + (i / Math.max(1, data.length - 1)) * (W - 2 * padding);
  const yFor = (val: number, min: number, max: number) => {
    const range = max - min || 1;
    return H - padding - ((val - min) / range) * (H - 2 * padding);
  };

  const phLine = data
    .map((r, i) => `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(r.inputs.ph, 6.5, 8.0).toFixed(1)}`)
    .join(" ");
  const clLine = data
    .map(
      (r, i) =>
        `${i === 0 ? "M" : "L"} ${xFor(i).toFixed(1)} ${yFor(r.inputs.chlorine, 0, 1.5).toFixed(1)}`
    )
    .join(" ");

  const phIdealTop = yFor(7.6, 6.5, 8.0);
  const phIdealBottom = yFor(7.2, 6.5, 8.0);

  return (
    <section className="glass-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <TrendingUp className="w-4 h-4 text-pool-600 dark:text-pool-400" />
        <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm">Trend posledních měření</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">({data.length})</span>
      </div>

      <div className="space-y-3">
        {/* pH */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-pool-700 dark:text-pool-300">pH</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {data[data.length - 1].inputs.ph.toFixed(1)}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-20 bg-pool-50/50 dark:bg-pool-950/40 rounded-lg"
            role="img"
            aria-label="Graf vývoje pH"
          >
            <rect
              x={xFor(0)}
              y={phIdealTop}
              width={W - 2 * padding}
              height={Math.max(0, phIdealBottom - phIdealTop)}
              fill="rgb(16 185 129 / 0.12)"
              className="dark:fill-emerald-500/15"
            />
            <path
              d={phLine}
              fill="none"
              stroke="#0284c7"
              className="dark:stroke-pool-300"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((r, i) => (
              <circle
                key={i}
                cx={xFor(i)}
                cy={yFor(r.inputs.ph, 6.5, 8.0)}
                r={i === data.length - 1 ? 3.5 : 2}
                fill="#0284c7"
                className="dark:fill-pool-300"
              />
            ))}
          </svg>
        </div>

        {/* Chlór */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-300">Chlór (mg/l)</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
              {data[data.length - 1].inputs.chlorine.toFixed(1)}
            </span>
          </div>
          <svg
            viewBox={`0 0 ${W} ${H}`}
            className="w-full h-20 bg-amber-50/40 dark:bg-amber-950/30 rounded-lg"
            role="img"
            aria-label="Graf vývoje chlóru"
          >
            <rect
              x={xFor(0)}
              y={yFor(0.6, 0, 1.5)}
              width={W - 2 * padding}
              height={Math.max(0, yFor(0.3, 0, 1.5) - yFor(0.6, 0, 1.5))}
              fill="rgb(16 185 129 / 0.12)"
              className="dark:fill-emerald-500/15"
            />
            <path
              d={clLine}
              fill="none"
              stroke="#d97706"
              className="dark:stroke-amber-300"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {data.map((r, i) => (
              <circle
                key={i}
                cx={xFor(i)}
                cy={yFor(r.inputs.chlorine, 0, 1.5)}
                r={i === data.length - 1 ? 3.5 : 2}
                fill="#d97706"
                className="dark:fill-amber-300"
              />
            ))}
          </svg>
        </div>

        <div className="flex items-center gap-4 text-[10px] text-slate-500 dark:text-slate-400 pt-1">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-1.5 bg-emerald-500/40 dark:bg-emerald-400/40 rounded-sm" />
            Ideální zóna
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-pool-500 dark:bg-pool-300" />
            pH
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-300" />
            Chlór
          </div>
        </div>
      </div>
    </section>
  );
}