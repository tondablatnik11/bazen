"use client";

import { Sun, CloudRain, Plane, Sparkles, ShowerHead } from "lucide-react";
import { LIMITS, type PoolInputs } from "@/lib/chemistry";

interface QuickScenariosProps {
  onApply: (inputs: Partial<PoolInputs>) => void;
}

interface Scenario {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  apply: Partial<PoolInputs>;
  className: string;
}

const SCENARIOS: Scenario[] = [
  {
    id: "summer-heat",
    label: "Letní vedro",
    description: "30 °C+ · zvýšený chlór",
    icon: Sun,
    apply: {
      temperature: 30,
      chlorine: 0.2,
      ph: LIMITS.ph.default,
      condition: "clean",
      alkalinity: LIMITS.alkalinity.default,
      calciumHardness: LIMITS.calciumHardness.default,
      cyanuricAcid: 50,
    },
    className:
      "from-amber-50 to-orange-50 dark:from-amber-950/50 dark:to-orange-950/50 border-amber-200 dark:border-amber-700 hover:border-amber-400 dark:hover:border-amber-500",
  },
  {
    id: "after-storm",
    label: "Po bouřce",
    description: "pH ↓ · šok",
    icon: CloudRain,
    apply: {
      ph: 7.0,
      chlorine: 0.0,
      condition: "cloudy",
      temperature: 25,
      alkalinity: LIMITS.alkalinity.default,
      calciumHardness: LIMITS.calciumHardness.default,
      cyanuricAcid: LIMITS.cyanuricAcid.default,
    },
    className:
      "from-slate-50 to-slate-100 dark:from-slate-800/60 dark:to-slate-700/60 border-slate-300 dark:border-slate-600 hover:border-slate-500 dark:hover:border-slate-400",
  },
  {
    id: "vacation",
    label: "Před dovolenou",
    description: "Šok + 30 °C",
    icon: Plane,
    apply: {
      ph: 7.4,
      chlorine: 0.8,
      condition: "clean",
      temperature: 28,
      alkalinity: LIMITS.alkalinity.default,
      calciumHardness: LIMITS.calciumHardness.default,
      cyanuricAcid: 40,
    },
    className:
      "from-pool-50 to-sky-50 dark:from-pool-950/50 dark:to-sky-950/50 border-pool-200 dark:border-pool-700 hover:border-pool-400 dark:hover:border-pool-500",
  },
  {
    id: "fresh-fill",
    label: "Nově napuštěno",
    description: "Studená · čistá",
    icon: ShowerHead,
    apply: {
      ph: 7.0,
      chlorine: 0.0,
      condition: "clean",
      temperature: 14,
      alkalinity: LIMITS.alkalinity.default,
      calciumHardness: LIMITS.calciumHardness.default,
      cyanuricAcid: 0,
    },
    className:
      "from-cyan-50 to-blue-50 dark:from-cyan-950/50 dark:to-blue-950/50 border-cyan-200 dark:border-cyan-800 hover:border-cyan-400 dark:hover:border-cyan-500",
  },
];

export function QuickScenarios({ onApply }: QuickScenariosProps) {
  return (
    <section className="mb-5">
      <div className="flex items-center gap-2 mb-2.5">
        <Sparkles className="w-4 h-4 text-pool-600 dark:text-pool-400" />
        <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm">Rychlé scénáře</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">– nastaví typický stav</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => onApply(s.apply)}
              className={`text-left p-3 rounded-xl border bg-gradient-to-br transition-all active:scale-[0.98] ${s.className}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-4 h-4 text-slate-700 dark:text-slate-200" />
                <span className="font-semibold text-sm text-slate-900 dark:text-slate-50">
                  {s.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-tight">
                {s.description}
              </p>
            </button>
          );
        })}
      </div>
    </section>
  );
}