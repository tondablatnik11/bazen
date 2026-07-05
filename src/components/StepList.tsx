"use client";

import { Clock } from "lucide-react";
import type { ActionStep } from "@/lib/chemistry";

interface StepListProps {
  steps: ActionStep[];
}

export function StepList({ steps }: StepListProps) {
  if (steps.length === 0) {
    return (
      <div className="glass-card-strong p-6 text-center">
        <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center mb-3">
          <Clock className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
        </div>
        <p className="text-slate-700 dark:text-slate-200 font-medium">
          Žádné kroky nejsou potřeba.
        </p>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          Užívejte si koupání a kontrolujte hodnoty jednou týdně.
        </p>
      </div>
    );
  }

  return (
    <ol className="space-y-3">
      {steps.map((step) => (
        <li
          key={`${step.order}-${step.title}`}
          className="glass-card-strong p-4 sm:p-5 animate-slide-up"
        >
          <div className="flex items-start gap-3">
            <div className="step-number">{step.order}</div>
            <div className="flex-1 min-w-0">
              <h4 className="font-bold text-slate-900 dark:text-slate-50 leading-tight">
                {step.title}
              </h4>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                {step.detail}
              </p>
              {step.product && (
                <div className="mt-2.5 inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-pool-50 dark:bg-pool-950/60 border border-pool-200 dark:border-pool-700">
                  <span className="text-xs font-semibold text-pool-700 dark:text-pool-200">
                    {step.product.name}
                  </span>
                  <span className="text-xs font-bold text-pool-900 dark:text-pool-100 tabular-nums">
                    {step.product.amount} {step.product.unit}
                  </span>
                </div>
              )}
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}