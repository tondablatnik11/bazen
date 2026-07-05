"use client";

import { Sparkles, SlidersHorizontal } from "lucide-react";
import type { Mode } from "@/lib/chemistry";

interface ModeToggleProps {
  mode: Mode;
  onChange: (mode: Mode) => void;
}

export function ModeToggle({ mode, onChange }: ModeToggleProps) {
  const options: {
    id: Mode;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    sub: string;
  }[] = [
    {
      id: "simple",
      label: "Jednoduchý",
      icon: Sparkles,
      sub: "Základní péče",
    },
    {
      id: "advanced",
      label: "Rozšířený",
      icon: SlidersHorizontal,
      sub: "Pro detailní ladění",
    },
  ];

  return (
    <div
      role="tablist"
      aria-label="Režim aplikace"
      className="inline-flex p-1 rounded-xl bg-pool-100/80 dark:bg-pool-900/60 border border-pool-200 dark:border-pool-800 gap-1"
    >
      {options.map((opt) => {
        const Icon = opt.icon;
        const active = mode === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            className={`relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all ${
              active
                ? "bg-white dark:bg-slate-800 text-pool-800 dark:text-pool-100 shadow-sm"
                : "text-pool-700/70 dark:text-pool-300/70 hover:text-pool-800 dark:hover:text-pool-100"
            }`}
          >
            <Icon className="w-4 h-4" />
            <span>{opt.label}</span>
            {active && (
              <span className="hidden sm:inline text-[10px] font-medium text-pool-500 dark:text-pool-400 ml-1">
                · {opt.sub}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}