"use client";

import { Lightbulb } from "lucide-react";

interface TipsListProps {
  tips: string[];
}

export function TipsList({ tips }: TipsListProps) {
  if (tips.length === 0) return null;

  return (
    <section className="glass-card p-4 sm:p-5">
      <div className="flex items-center gap-2 mb-2.5">
        <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/60 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm">Doporučení navíc</h3>
      </div>
      <ul className="space-y-2">
        {tips.map((tip, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
            <span className="text-amber-500 dark:text-amber-400 mt-1 leading-none">•</span>
            <span className="leading-relaxed">{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}