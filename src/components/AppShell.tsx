"use client";

import { useMemo, useState } from "react";
import {
  LIMITS,
  analyzePool,
  type Mode,
  type PoolInputs,
  type WaterCondition,
} from "@/lib/chemistry";
import { usePoolHistory, summarizeInputs } from "@/lib/history";
import { useTab } from "@/lib/useTab";
import { TabBar } from "./TabBar";
import { CalculatorPage } from "./CalculatorPage";
import { HistoryPage } from "./HistoryPage";
import { AIAssistant } from "./AIAssistant";

/**
 * Orchestrátor celé aplikace.
 *
 * Drží společný stav kalkulačky (aby se nevytratil při přepnutí záložky)
 * a podle aktivní záložky vykresluje příslušnou stránku.
 *
 * Historie je dostupná ze všech záložek (sdílený hook).
 */
export function AppShell() {
  const { tab, setTab } = useTab();

  // Stav kalkulačky – sdílený napříč záložkami (AI asistent ho čte,
  // výsledky se ukládají do historie z kalkulačky).
  const [inputs, setInputs] = useState<PoolInputs>({
    volume: LIMITS.volume.default,
    ph: LIMITS.ph.default,
    chlorine: LIMITS.chlorine.default,
    condition: "clean",
    temperature: LIMITS.temperature.default,
    alkalinity: LIMITS.alkalinity.default,
    calciumHardness: LIMITS.calciumHardness.default,
    cyanuricAcid: LIMITS.cyanuricAcid.default,
  });
  const [mode, setMode] = useState<Mode>("simple");
  const [toast, setToast] = useState<string | null>(null);

  const history = usePoolHistory();

  // V simple režimu nepředáváme advanced parametry do engine.
  const effectiveInputs: PoolInputs = useMemo(() => {
    if (mode === "simple") {
      return {
        volume: inputs.volume,
        ph: inputs.ph,
        chlorine: inputs.chlorine,
        condition: inputs.condition,
      };
    }
    return inputs;
  }, [mode, inputs]);

  const result = useMemo(() => analyzePool(effectiveInputs), [effectiveInputs]);

  const update = <K extends keyof PoolInputs>(key: K, value: PoolInputs[K]) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const showToast = (msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2200);
  };

  return (
    <>
      <TabBar
        active={tab}
        onChange={setTab}
        historyCount={history.records.length}
      />

      <div className="pb-24 sm:pb-0">
        {tab === "calculator" && (
          <CalculatorPage
            inputs={inputs}
            effectiveInputs={effectiveInputs}
            mode={mode}
            setMode={setMode}
            update={update}
            result={result}
            historyCount={history.records.length}
            onSave={() => {
              history.addRecord(effectiveInputs, result);
              showToast("Měření uloženo do historie");
            }}
            onShare={() => showToast("Zkopírováno do schránky")}
            onApplyScenario={(partial) => {
              setInputs((prev) => ({ ...prev, ...partial }));
              showToast("Scénář aplikován");
            }}
            onCopyToast={() => showToast("Zkopírováno do schránky")}
          />
        )}

        {tab === "history" && (
          <HistoryPage
            records={history.records}
            onRemove={history.removeRecord}
            onClear={history.clear}
          />
        )}

        {tab === "ai" && (
          <AIAssistant
            inputs={effectiveInputs}
            result={result}
            history={history.records}
            onApplyImageAnalysis={(c: WaterCondition) => {
              update("condition", c);
              setTab("calculator");
              showToast("Stav z fotky předvyplněn v kalkulačce");
            }}
          />
        )}
      </div>

      {/* Toast – přes všechny záložky */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-xl bg-slate-900/95 dark:bg-slate-800/95 backdrop-blur text-white text-sm font-medium shadow-lg animate-fade-in"
        >
          {toast}
        </div>
      )}
    </>
  );
}