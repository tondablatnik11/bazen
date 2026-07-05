"use client";

import { Calculator, History as HistoryIcon, Sparkles } from "lucide-react";
import type { TabId } from "@/lib/useTab";

interface TabBarProps {
  active: TabId;
  onChange: (tab: TabId) => void;
  /** Počet záznamů v historii (zobrazí se u ikony Historie) */
  historyCount?: number;
}

interface TabConfig {
  id: TabId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
}

const TABS: TabConfig[] = [
  {
    id: "calculator",
    label: "Kalkulačka",
    shortLabel: "Kalkulačka",
    icon: Calculator,
    description: "Výpočet dávkování a akční plán",
  },
  {
    id: "history",
    label: "Historie",
    shortLabel: "Historie",
    icon: HistoryIcon,
    description: "Měření, trendy a statistiky",
  },
  {
    id: "ai",
    label: "AI asistent",
    shortLabel: "AI",
    icon: Sparkles,
    description: "Chat, fotky a doporučení",
  },
];

/**
 * Tab bar – slouží jako horní přepínač na desktopu i jako spodní tab bar na mobilu.
 * Díky responsive layoutu se styluje podle breakpointu:
 *   - < sm: sticky dole s velkými ikonami (touch-friendly)
 *   - >= sm: inline v obsahu s popisky (desktop)
 */
export function TabBar({ active, onChange, historyCount }: TabBarProps) {
  return (
    <>
      {/* DESKTOP – horizontální tab bar pod hero */}
      <div className="hidden sm:block mb-5">
        <div
          role="tablist"
          aria-label="Sekce aplikace"
          className="inline-flex p-1 rounded-2xl bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl border border-pool-200/60 dark:border-slate-700/70 shadow-md gap-1"
        >
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            const count = t.id === "history" && historyCount ? historyCount : 0;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(t.id)}
                className={`relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? "bg-gradient-to-br from-pool-500 to-pool-700 text-white shadow-md shadow-pool-500/30"
                    : "text-slate-600 dark:text-slate-300 hover:bg-pool-50 dark:hover:bg-slate-800/60 hover:text-pool-800 dark:hover:text-pool-200"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{t.label}</span>
                {count > 0 && (
                  <span
                    className={`text-[10px] font-bold tabular-nums px-1.5 py-0.5 rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-pool-100 dark:bg-pool-900/60 text-pool-700 dark:text-pool-200"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* MOBIL – sticky bottom tab bar */}
      <nav
        role="tablist"
        aria-label="Sekce aplikace"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-30 bg-white/95 dark:bg-slate-950/95 backdrop-blur-xl border-t border-pool-200 dark:border-slate-700 shadow-[0_-4px_20px_rgba(0,0,0,0.08)] dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0)" }}
      >
        <div className="grid grid-cols-3">
          {TABS.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            const count = t.id === "history" && historyCount ? historyCount : 0;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(t.id)}
                className={`relative flex flex-col items-center gap-0.5 py-2.5 transition-colors ${
                  isActive
                    ? "text-pool-600 dark:text-pool-300"
                    : "text-slate-500 dark:text-slate-400"
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" />
                  {count > 0 && (
                    <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-pool-500 dark:bg-pool-400 text-white text-[9px] font-bold flex items-center justify-center tabular-nums">
                      {count > 99 ? "99+" : count}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-semibold">{t.shortLabel}</span>
                {isActive && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-10 h-0.5 rounded-b-full bg-pool-600 dark:bg-pool-400" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}