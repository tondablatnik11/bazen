"use client";

import { AlertCircle } from "lucide-react";

interface AdvancedWarningsProps {
  warnings: string[];
}

export function AdvancedWarnings({ warnings }: AdvancedWarningsProps) {
  if (warnings.length === 0) return null;
  return (
    <section className="rounded-2xl border-2 border-sky-200 dark:border-sky-800 bg-sky-50/70 dark:bg-sky-950/40 backdrop-blur p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-sky-100 dark:bg-sky-900/60 flex items-center justify-center">
          <AlertCircle className="w-4 h-4 text-sky-700 dark:text-sky-300" />
        </div>
        <h3 className="font-bold text-sky-900 dark:text-sky-100 text-sm">
          Rozšířená upozornění
        </h3>
      </div>
      <ul className="space-y-2">
        {warnings.map((w, i) => (
          <li
            key={i}
            className="flex items-start gap-2 text-sm text-sky-900 dark:text-sky-100 leading-relaxed"
          >
            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-sky-500 dark:bg-sky-400 flex-shrink-0" />
            <span>{w}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}