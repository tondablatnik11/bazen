"use client";

import { CheckCircle2, AlertTriangle, AlertOctagon } from "lucide-react";
import type { Status } from "@/lib/chemistry";

interface StatusBannerProps {
  status: Status;
  title: string;
  description: string;
}

export function StatusBanner({ status, title, description }: StatusBannerProps) {
  const config = {
    ok: {
      Icon: CheckCircle2,
      classes:
        "bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950/60 dark:to-emerald-900/40 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100",
      iconClasses: "bg-emerald-500 dark:bg-emerald-600 text-white",
      badge: "V pořádku",
      badgeClasses: "bg-emerald-600 dark:bg-emerald-500 text-white",
    },
    warning: {
      Icon: AlertTriangle,
      classes:
        "bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/60 dark:to-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-100",
      iconClasses: "bg-amber-500 dark:bg-amber-600 text-white",
      badge: "Drobná nerovnováha",
      badgeClasses: "bg-amber-600 dark:bg-amber-500 text-white",
    },
    danger: {
      Icon: AlertOctagon,
      classes:
        "bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/60 dark:to-rose-900/40 border-rose-300 dark:border-rose-700 text-rose-900 dark:text-rose-100",
      iconClasses:
        "bg-rose-500 dark:bg-rose-600 text-white animate-pulse-soft",
      badge: "Akutní zásah",
      badgeClasses: "bg-rose-600 dark:bg-rose-500 text-white",
    },
  } as const;

  const c = config[status];
  const Icon = c.Icon;

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 p-5 ${c.classes}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-start gap-4">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center shadow-md ${c.iconClasses}`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${c.badgeClasses}`}
            >
              {c.badge}
            </span>
          </div>
          <h2 className="font-bold text-lg sm:text-xl mt-1.5 leading-tight">
            {title}
          </h2>
          <p className="text-sm mt-1 leading-relaxed opacity-90">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}