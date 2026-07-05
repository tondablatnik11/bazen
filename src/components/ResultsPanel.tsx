"use client";

import { Beaker, ListChecks, Package, Sparkles } from "lucide-react";
import type { AnalysisResult, Mode } from "@/lib/chemistry";
import { StatusBanner } from "./StatusBanner";
import { StepList } from "./StepList";
import { ProductCard } from "./ProductCard";
import { TipsList } from "./TipsList";
import { AdvancedWarnings } from "./AdvancedWarnings";

interface ResultsPanelProps {
  result: AnalysisResult;
  mode?: Mode;
}

export function ResultsPanel({ result, mode = "simple" }: ResultsPanelProps) {
  return (
    <div className="space-y-5 animate-fade-in">
      <StatusBanner
        status={result.status}
        title={result.statusTitle}
        description={result.statusDescription}
      />

      {mode === "advanced" && result.advancedWarnings.length > 0 && (
        <AdvancedWarnings warnings={result.advancedWarnings} />
      )}

      {result.steps.length > 0 && (
        <section>
          <SectionHeader
            icon={ListChecks}
            title="Akční plán"
            subtitle={`${result.steps.length} ${result.steps.length === 1 ? "krok" : result.steps.length < 5 ? "kroky" : "kroků"} k ideální vodě`}
          />
          <div className="mt-3">
            <StepList steps={result.steps} />
          </div>
        </section>
      )}

      {result.products.length > 0 && (
        <section>
          <SectionHeader
            icon={Package}
            title="Doporučené přípravky"
            subtitle="Přesné dávky pro váš bazén"
          />
          <div className="mt-3 grid grid-cols-1 gap-3">
            {result.products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {result.tips.length > 0 && (
        <TipsList tips={result.tips} />
      )}

      {result.products.length === 0 && result.steps.length === 0 && (
        <section className="glass-card-strong p-6 sm:p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-400 to-pool-500 flex items-center justify-center mb-4 shadow-lg shadow-pool-500/30">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h3 className="font-bold text-lg text-slate-900 dark:text-slate-50">
            Vše je v dokonalém pořádku
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-md mx-auto">
            pH je v ideální zóně, chlór je v pořádku a voda je čistá.
            Bazén je připravený ke koupání. Pro udržení kvality
            doporučujeme kontrolovat hodnoty každých 3–5 dní.
          </p>
        </section>
      )}

      <footer className="text-center text-[11px] text-slate-400 dark:text-slate-500 px-4 pt-2 pb-4">
        <Beaker className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />
        Doporučení jsou orientační. Vždy dodržujte pokyny výrobce
        přípravku a ověřte hodnoty testerem.
      </footer>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-baseline gap-2">
      <Icon className="w-5 h-5 text-pool-600 dark:text-pool-400 self-center" />
      <div className="flex-1">
        <h3 className="font-bold text-slate-900 dark:text-slate-50 leading-tight">{title}</h3>
        {subtitle && (
          <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}