"use client";

import { Moon, Sun, Monitor } from "lucide-react";
import { useTheme } from "./ThemeProvider";

const OPTIONS = [
  { id: "light" as const, icon: Sun, label: "Světlý" },
  { id: "system" as const, icon: Monitor, label: "Auto" },
  { id: "dark" as const, icon: Moon, label: "Tmavý" },
];

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <div
      role="radiogroup"
      aria-label="Motiv vzhledu"
      className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-pool-100/80 dark:bg-pool-900/60 border border-pool-200 dark:border-pool-800"
    >
      {OPTIONS.map((opt) => {
        const Icon = opt.icon;
        const active = theme === opt.id;
        return (
          <button
            key={opt.id}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => setTheme(opt.id)}
            title={opt.label}
            className={`w-7 h-7 rounded-md flex items-center justify-center transition-all ${
              active
                ? "bg-white dark:bg-slate-800 text-pool-800 dark:text-pool-200 shadow-sm"
                : "text-pool-700/70 dark:text-pool-300/70 hover:text-pool-800 dark:hover:text-pool-100"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
          </button>
        );
      })}
    </div>
  );
}