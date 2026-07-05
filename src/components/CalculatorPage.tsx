"use client";

import {
  Save,
  Settings2,
  Share2,
  Thermometer,
  TestTube2,
  Beaker,
  Sun,
} from "lucide-react";
import {
  LIMITS,
  PH_IDEAL_MIN,
  PH_IDEAL_MAX,
  CHLORINE_IDEAL_MIN,
  CHLORINE_IDEAL_MAX,
  ALK_IDEAL_MIN,
  ALK_IDEAL_MAX,
  CALCIUM_IDEAL_MIN,
  CALCIUM_IDEAL_MAX,
  CYA_IDEAL_MIN,
  CYA_IDEAL_MAX,
  TEMP_IDEAL_MIN,
  TEMP_IDEAL_MAX,
  type AnalysisResult,
  type Mode,
  type PoolInputs,
  type WaterCondition,
} from "@/lib/chemistry";
import { LabeledSlider } from "./LabeledSlider";
import { RadioCards } from "./RadioCards";
import { VolumeInput } from "./VolumeInput";
import { ModeToggle } from "./ModeToggle";
import { ResultsPanel } from "./ResultsPanel";
import { QuickScenarios } from "./QuickScenarios";
import { summarizeInputs } from "@/lib/history";

interface CalculatorPageProps {
  inputs: PoolInputs;
  effectiveInputs: PoolInputs;
  mode: Mode;
  setMode: (m: Mode) => void;
  update: <K extends keyof PoolInputs>(key: K, value: PoolInputs[K]) => void;
  result: AnalysisResult;
  historyCount: number;
  onSave: () => void;
  onShare: () => void;
  onApplyScenario: (partial: Partial<PoolInputs>) => void;
  onCopyToast: () => void;
}

/**
 * Stránka kalkulačky – formulář vlevo, výsledky vpravo (na desktopu).
 * Na mobilu stacked pod sebou.
 */
export function CalculatorPage({
  inputs,
  effectiveInputs,
  mode,
  setMode,
  update,
  result,
  onSave,
  onApplyScenario,
  onCopyToast,
}: CalculatorPageProps) {
  const handleShare = async () => {
    const lines = [
      "🧪 Chytrý Bazénář – stav vody",
      `Stav: ${result.statusTitle}`,
      "",
      `• Objem: ${effectiveInputs.volume} m³`,
      `• pH: ${effectiveInputs.ph.toFixed(1)}`,
      `• Chlór: ${effectiveInputs.chlorine.toFixed(1)} mg/l`,
      `• Vzhled: ${
        effectiveInputs.condition === "clean"
          ? "čistá"
          : effectiveInputs.condition === "green"
            ? "zelená"
            : "mléčná"
      }`,
    ];
    if (effectiveInputs.temperature !== undefined) {
      lines.push(`• Teplota: ${effectiveInputs.temperature} °C`);
    }
    if (effectiveInputs.alkalinity !== undefined) {
      lines.push(`• Alkalita: ${effectiveInputs.alkalinity} ppm`);
    }
    if (result.products.length > 0) {
      lines.push("");
      lines.push("📦 Doporučené přípravky:");
      result.products.forEach((p) => {
        lines.push(`• ${p.name}: ${p.amount} ${p.unit}`);
      });
    }
    const text = lines.join("\n");

    try {
      if (
        typeof navigator !== "undefined" &&
        navigator.share &&
        /Mobi|Android/i.test(navigator.userAgent)
      ) {
        await navigator.share({ title: "Stav bazénu", text });
      } else {
        await navigator.clipboard.writeText(text);
        onCopyToast();
      }
    } catch {
      // canceled
    }
  };

  return (
    <>
      <QuickScenarios onApply={onApplyScenario} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start">
        {/* LEVÝ SLOUPEC – formulář */}
        <section
          aria-labelledby="inputs-heading"
          className="glass-card-strong p-5 sm:p-6 lg:sticky lg:top-6"
        >
          <header className="flex items-center justify-between gap-3 mb-5 flex-wrap">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pool-500 to-pool-700 flex items-center justify-center text-white shadow-lg shadow-pool-500/30 flex-shrink-0">
                <Settings2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h2
                  id="inputs-heading"
                  className="font-bold text-lg text-slate-900 dark:text-slate-50 leading-tight"
                >
                  Parametry bazénu
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                  Vše se přepočítává okamžitě
                </p>
              </div>
            </div>
            <ModeToggle mode={mode} onChange={setMode} />
          </header>

          <div className="space-y-6">
            <VolumeInput
              value={inputs.volume}
              min={LIMITS.volume.min}
              max={LIMITS.volume.max}
              onChange={(v) => update("volume", v)}
            />

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

            <LabeledSlider
              label="Aktuální pH"
              value={inputs.ph}
              min={LIMITS.ph.min}
              max={LIMITS.ph.max}
              step={0.1}
              decimals={1}
              onChange={(v) => update("ph", v)}
              idealMin={PH_IDEAL_MIN}
              idealMax={PH_IDEAL_MAX}
              helper={`Cílová hodnota je 7,4. Ideální zóna ${PH_IDEAL_MIN.toFixed(
                1
              )}–${PH_IDEAL_MAX.toFixed(1)}.`}
              hint="Měřte pH testerem ráno před aplikací chemie."
            />

            <LabeledSlider
              label="Volný chlór"
              unit="mg/l"
              accent="amber"
              value={inputs.chlorine}
              min={LIMITS.chlorine.min}
              max={LIMITS.chlorine.max}
              step={0.1}
              decimals={1}
              onChange={(v) => update("chlorine", v)}
              idealMin={CHLORINE_IDEAL_MIN}
              idealMax={CHLORINE_IDEAL_MAX}
              helper={`Ideální rozmezí ${CHLORINE_IDEAL_MIN.toFixed(
                1
              )}–${CHLORINE_IDEAL_MAX.toFixed(1)} mg/l.`}
              hint="Příliš málo = řasy, příliš mnoho = dráždí oči a pokožku."
            />

            <div className="h-px bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />

            <RadioCards
              value={inputs.condition}
              onChange={(c: WaterCondition) => update("condition", c)}
            />

            {mode === "advanced" && (
              <>
                <div className="pt-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-300 dark:via-violet-700 to-transparent" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-violet-700 dark:text-violet-200 bg-violet-50 dark:bg-violet-950/60 px-2 py-1 rounded-full border border-violet-200 dark:border-violet-700">
                      Rozšířené parametry
                    </span>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-violet-300 dark:via-violet-700 to-transparent" />
                  </div>
                </div>

                <LabeledSlider
                  label="Teplota vody"
                  unit="°C"
                  value={inputs.temperature ?? LIMITS.temperature.default}
                  min={LIMITS.temperature.min}
                  max={LIMITS.temperature.max}
                  step={1}
                  decimals={0}
                  onChange={(v) => update("temperature", v)}
                  idealMin={TEMP_IDEAL_MIN}
                  idealMax={TEMP_IDEAL_MAX}
                  helper={`Ideální teplota ${TEMP_IDEAL_MIN}–${TEMP_IDEAL_MAX} °C. Nad 28 °C se řasy množí rychleji.`}
                  icon={Thermometer}
                />

                <LabeledSlider
                  label="Celková alkalita"
                  unit="ppm"
                  value={inputs.alkalinity ?? LIMITS.alkalinity.default}
                  min={LIMITS.alkalinity.min}
                  max={LIMITS.alkalinity.max}
                  step={5}
                  decimals={0}
                  onChange={(v) => update("alkalinity", v)}
                  idealMin={ALK_IDEAL_MIN}
                  idealMax={ALK_IDEAL_MAX}
                  helper={`Stabilní alkalita ${ALK_IDEAL_MIN}–${ALK_IDEAL_MAX} ppm brání kolísání pH.`}
                  icon={TestTube2}
                />

                <LabeledSlider
                  label="Tvrdost vody (vápník)"
                  unit="ppm"
                  value={inputs.calciumHardness ?? LIMITS.calciumHardness.default}
                  min={LIMITS.calciumHardness.min}
                  max={LIMITS.calciumHardness.max}
                  step={10}
                  decimals={0}
                  onChange={(v) => update("calciumHardness", v)}
                  idealMin={CALCIUM_IDEAL_MIN}
                  idealMax={CALCIUM_IDEAL_MAX}
                  helper={`Ideál ${CALCIUM_IDEAL_MIN}–${CALCIUM_IDEAL_MAX} ppm. Příliš měkká voda narusuje povrchy.`}
                  icon={Beaker}
                />

                <LabeledSlider
                  label="Kyanurová kyselina (CYA)"
                  unit="ppm"
                  accent="amber"
                  value={inputs.cyanuricAcid ?? LIMITS.cyanuricAcid.default}
                  min={LIMITS.cyanuricAcid.min}
                  max={LIMITS.cyanuricAcid.max}
                  step={5}
                  decimals={0}
                  onChange={(v) => update("cyanuricAcid", v)}
                  idealMin={CYA_IDEAL_MIN}
                  idealMax={CYA_IDEAL_MAX}
                  helper={`Stabilizátor chlóru – ideál ${CYA_IDEAL_MIN}–${CYA_IDEAL_MAX} ppm. Chrání chlór před UV.`}
                  icon={Sun}
                />
              </>
            )}
          </div>

          <footer className="mt-6 pt-4 border-t border-slate-200/70 dark:border-slate-700/70 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              type="button"
              onClick={onSave}
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 dark:bg-emerald-500 text-white text-sm font-semibold shadow-md shadow-emerald-500/30 hover:bg-emerald-700 dark:hover:bg-emerald-600 active:scale-[0.98] transition-all"
            >
              <Save className="w-4 h-4" />
              Uložit měření
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-pool-100 dark:bg-pool-900/60 text-pool-800 dark:text-pool-200 text-sm font-semibold border border-pool-200 dark:border-pool-700 hover:bg-pool-200 dark:hover:bg-pool-800/70 active:scale-[0.98] transition-all"
            >
              <Share2 className="w-4 h-4" />
              Sdílet
            </button>
          </footer>
        </section>

        {/* PRAVÝ SLOUPEC – výsledky */}
        <section aria-labelledby="results-heading">
          <h2 id="results-heading" className="sr-only">
            Výsledky analýzy
          </h2>
          <ResultsPanel result={result} mode={mode} />
        </section>
      </div>
    </>
  );
}