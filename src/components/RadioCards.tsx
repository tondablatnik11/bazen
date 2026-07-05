"use client";

import { Waves, Leaf, CloudFog } from "lucide-react";
import type { WaterCondition } from "@/lib/chemistry";

interface RadioCardsProps {
  value: WaterCondition;
  onChange: (value: WaterCondition) => void;
}

interface Option {
  id: WaterCondition;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  activeClass: string;
  iconBgClass: string;
}

const OPTIONS: Option[] = [
  {
    id: "clean",
    label: "Čistá a průzračná",
    description: "Vše je v normě",
    icon: Waves,
    activeClass:
      "border-pool-500 dark:border-pool-400 bg-pool-50 dark:bg-pool-950/50 ring-2 ring-pool-300 dark:ring-pool-700",
    iconBgClass: "bg-pool-100 dark:bg-pool-900/60 text-pool-700 dark:text-pool-200",
  },
  {
    id: "green",
    label: "Zelená (řasy)",
    description: "Vyžaduje šok a algicid",
    icon: Leaf,
    activeClass:
      "border-emerald-500 dark:border-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 ring-2 ring-emerald-300 dark:ring-emerald-700",
    iconBgClass:
      "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-200",
  },
  {
    id: "cloudy",
    label: "Mléčná / zakalená",
    description: "Vyžaduje vločkovač",
    icon: CloudFog,
    activeClass:
      "border-slate-500 dark:border-slate-400 bg-slate-50 dark:bg-slate-800/60 ring-2 ring-slate-300 dark:ring-slate-600",
    iconBgClass: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200",
  },
];

export function RadioCards({ value, onChange }: RadioCardsProps) {
  return (
    <div className="space-y-2">
      <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
        Vzhled a stav vody
      </p>
      <div
        role="radiogroup"
        aria-label="Vzhled a stav vody"
        className="grid grid-cols-1 sm:grid-cols-3 gap-2.5"
      >
        {OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const isActive = value === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              role="radio"
              aria-checked={isActive}
              onClick={() => onChange(opt.id)}
              className={`text-left p-3.5 rounded-xl border-2 transition-all active:scale-[0.98] ${
                isActive
                  ? opt.activeClass
                  : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-pool-300 dark:hover:border-pool-600 hover:bg-pool-50/50 dark:hover:bg-pool-950/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${
                    isActive
                      ? opt.iconBgClass
                      : "bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400"
                  }`}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div
                    className={`font-semibold text-sm leading-tight ${
                      isActive
                        ? "text-slate-900 dark:text-slate-50"
                        : "text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    {opt.label}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                    {opt.description}
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}