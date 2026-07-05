"use client";

import {
  Droplets,
  FlaskConical,
  Sparkles,
  ShieldCheck,
  Wind,
  Scale,
} from "lucide-react";
import type { ProductDose } from "@/lib/chemistry";

const ICONS = {
  droplets: Droplets,
  flask: FlaskConical,
  sparkles: Sparkles,
  shield: ShieldCheck,
  wind: Wind,
  scale: Scale,
} as const;

const CATEGORY_META = {
  ph: {
    label: "Úprava pH",
    chip: "bg-pool-100 dark:bg-pool-900/60 text-pool-800 dark:text-pool-200 border-pool-200 dark:border-pool-700",
    accent: "from-pool-500 to-pool-600",
  },
  disinfection: {
    label: "Dezinfekce",
    chip: "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700",
    accent: "from-amber-500 to-orange-500",
  },
  clarifier: {
    label: "Čištění",
    chip: "bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-600",
    accent: "from-slate-500 to-slate-600",
  },
  support: {
    label: "Podpora",
    chip: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700",
    accent: "from-emerald-500 to-emerald-600",
  },
  balancing: {
    label: "Vyvažování vody",
    chip: "bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 border-violet-200 dark:border-violet-700",
    accent: "from-violet-500 to-purple-600",
  },
} as const;

interface ProductCardProps {
  product: ProductDose;
}

export function ProductCard({ product }: ProductCardProps) {
  const Icon = ICONS[product.iconKey];
  const meta = CATEGORY_META[product.category];

  return (
    <article className="glass-card-strong p-4 sm:p-5 animate-fade-in">
      <div className="flex items-start gap-3">
        <div
          className={`flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br ${meta.accent} flex items-center justify-center text-white shadow-lg`}
        >
          <Icon className="w-6 h-6" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-0.5">
            <span
              className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${meta.chip}`}
            >
              {meta.label}
            </span>
          </div>
          <h3 className="font-bold text-base text-slate-900 dark:text-slate-50 leading-tight">
            {product.name}
          </h3>
        </div>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <div className="text-3xl font-bold tabular-nums gradient-text">
          {product.amount}
        </div>
        <div className="text-base font-semibold text-slate-600 dark:text-slate-300">
          {product.unit}
        </div>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-slate-700/70">
        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
          <span className="font-semibold text-slate-700 dark:text-slate-200">Postup: </span>
          {product.instruction}
        </p>
      </div>
    </article>
  );
}