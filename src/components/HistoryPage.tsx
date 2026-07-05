"use client";

import {
  Activity,
  ArrowDown,
  ArrowUp,
  Download,
  Minus,
  Trash2,
} from "lucide-react";
import {
  computeStats,
  downloadFile,
  recordsToCsv,
} from "@/lib/history-stats";
import { formatTimestamp, type HistoryRecord } from "@/lib/history";
import { TrendChart } from "./TrendChart";

interface HistoryPageProps {
  records: HistoryRecord[];
  onRemove: (id: string) => void;
  onClear: () => void;
}

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  ok: {
    label: "OK",
    cls: "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border-emerald-200 dark:border-emerald-700",
  },
  warning: {
    label: "Pozor",
    cls: "bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border-amber-200 dark:border-amber-700",
  },
  danger: {
    label: "Akutní",
    cls: "bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200 border-rose-200 dark:border-rose-700",
  },
};

export function HistoryPage({ records, onRemove, onClear }: HistoryPageProps) {
  const stats = computeStats(records);

  const handleExportCsv = () => {
    const csv = recordsToCsv(records);
    const filename = `chytry-bazen-historie-${
      new Date().toISOString().slice(0, 10)
    }.csv`;
    downloadFile(filename, "﻿" + csv, "text/csv"); // BOM pro Excel češtinu
  };

  const handleExportJson = () => {
    const json = JSON.stringify(records, null, 2);
    const filename = `chytry-bazen-historie-${
      new Date().toISOString().slice(0, 10)
    }.json`;
    downloadFile(filename, json, "application/json");
  };

  if (records.length === 0) {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="glass-card-strong p-8 sm:p-12 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-pool-400 to-pool-600 flex items-center justify-center mb-4 shadow-lg shadow-pool-500/30">
            <Activity className="w-10 h-10 text-white" />
          </div>
          <h2 className="font-bold text-2xl text-slate-900 dark:text-slate-50">
            Zatím žádná měření
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 max-w-md mx-auto leading-relaxed">
            Přepni se na záložku <strong>Kalkulačka</strong>, nastav
            aktuální stav bazénu a klikni na <strong>Uložit měření</strong>.
            Tady uvidíš trendy a statistiky.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      {/* HLAVNÍ GRAF */}
      <section className="glass-card-strong p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-3">
          <Activity className="w-5 h-5 text-pool-600 dark:text-pool-400" />
          <h2 className="font-bold text-slate-900 dark:text-slate-50 text-lg">
            Vývoj v čase
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            · posledních {Math.min(records.length, 12)} měření
          </span>
        </div>
        <TrendChart records={records} />
      </section>

      {/* STATISTIKY */}
      <section>
        <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-3 text-base">
          Přehled
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <StatCard
            label="Celkem měření"
            value={stats.total.toString()}
            sub={
              stats.spanDays !== null && stats.spanDays > 0
                ? `za ${stats.spanDays} ${
                    stats.spanDays === 1 ? "den" : stats.spanDays < 5 ? "dny" : "dní"
                  }`
                : "—"
            }
          />
          <StatCard
            label="Průměrné pH"
            value={stats.avgPh !== null ? stats.avgPh.toFixed(1) : "—"}
            sub={
              stats.phTrend === 1
                ? "rostoucí ↑"
                : stats.phTrend === -1
                  ? "klesající ↓"
                  : stats.phTrend === 0
                    ? "stabilní"
                    : null
            }
            subIcon={
              stats.phTrend === 1 ? (
                <ArrowUp className="w-3 h-3" />
              ) : stats.phTrend === -1 ? (
                <ArrowDown className="w-3 h-3" />
              ) : stats.phTrend === 0 ? (
                <Minus className="w-3 h-3" />
              ) : null
            }
          />
          <StatCard
            label="Průměrný chlór"
            unit="mg/l"
            value={stats.avgChlorine !== null ? stats.avgChlorine.toFixed(1) : "—"}
            sub={
              stats.chlorineTrend === 1
                ? "rostoucí ↑"
                : stats.chlorineTrend === -1
                  ? "klesající ↓"
                  : stats.chlorineTrend === 0
                    ? "stabilní"
                    : null
            }
            subIcon={
              stats.chlorineTrend === 1 ? (
                <ArrowUp className="w-3 h-3" />
              ) : stats.chlorineTrend === -1 ? (
                <ArrowDown className="w-3 h-3" />
              ) : stats.chlorineTrend === 0 ? (
                <Minus className="w-3 h-3" />
              ) : null
            }
          />
          <StatCard
            label="Šoků"
            value={stats.shockCount.toString()}
            sub="akutních zásahů"
            accent={stats.shockCount > 0 ? "rose" : "neutral"}
          />
        </div>

        {/* Rozdělení stavů – progress bary */}
        <div className="mt-3 glass-card-strong p-4">
          <h4 className="font-semibold text-slate-900 dark:text-slate-50 text-sm mb-2.5">
            Rozdělení stavů
          </h4>
          <div className="flex items-center gap-1 h-2 rounded-full overflow-hidden bg-slate-100 dark:bg-slate-800">
            {stats.total > 0 && stats.okCount > 0 && (
              <div
                className="bg-emerald-500 dark:bg-emerald-400 h-full transition-all"
                style={{ width: `${(stats.okCount / stats.total) * 100}%` }}
                title={`OK: ${stats.okCount}`}
              />
            )}
            {stats.warningCount > 0 && (
              <div
                className="bg-amber-500 dark:bg-amber-400 h-full transition-all"
                style={{ width: `${(stats.warningCount / stats.total) * 100}%` }}
                title={`Pozor: ${stats.warningCount}`}
              />
            )}
            {stats.dangerCount > 0 && (
              <div
                className="bg-rose-500 dark:bg-rose-400 h-full transition-all"
                style={{ width: `${(stats.dangerCount / stats.total) * 100}%` }}
                title={`Akutní: ${stats.dangerCount}`}
              />
            )}
          </div>
          <div className="flex items-center gap-4 mt-2 text-[11px]">
            <LegendDot color="bg-emerald-500 dark:bg-emerald-400" label={`OK (${stats.okCount})`} />
            <LegendDot color="bg-amber-500 dark:bg-amber-400" label={`Pozor (${stats.warningCount})`} />
            <LegendDot color="bg-rose-500 dark:bg-rose-400" label={`Akutní (${stats.dangerCount})`} />
          </div>
        </div>
      </section>

      {/* AKCE */}
      <section className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={handleExportCsv}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-pool-100 dark:bg-pool-900/60 text-pool-800 dark:text-pool-200 text-sm font-semibold border border-pool-200 dark:border-pool-700 hover:bg-pool-200 dark:hover:bg-pool-800/60 active:scale-[0.98] transition-all"
        >
          <Download className="w-4 h-4" />
          Exportovat CSV
        </button>
        <button
          type="button"
          onClick={handleExportJson}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-pool-100 dark:bg-pool-900/60 text-pool-800 dark:text-pool-200 text-sm font-semibold border border-pool-200 dark:border-pool-700 hover:bg-pool-200 dark:hover:bg-pool-800/60 active:scale-[0.98] transition-all"
        >
          <Download className="w-4 h-4" />
          Exportovat JSON
        </button>
        <button
          type="button"
          onClick={() => {
            if (
              window.confirm(
                "Opravdu smazat celou historii? Tato akce je nevratná."
              )
            ) {
              onClear();
            }
          }}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-sm font-semibold border border-rose-200 dark:border-rose-800 hover:bg-rose-100 dark:hover:bg-rose-900/60 active:scale-[0.98] transition-all"
        >
          <Trash2 className="w-4 h-4" />
          Smazat vše
        </button>
      </section>

      {/* SEZNAM MĚŘENÍ */}
      <section>
        <h3 className="font-bold text-slate-900 dark:text-slate-50 mb-3 text-base">
          Všechna měření
        </h3>
        <div className="space-y-2">
          {[...records].reverse().map((record) => {
            const sl = STATUS_LABEL[record.status];
            return (
              <article
                key={record.id}
                className="glass-card p-3.5 flex items-start gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <time className="text-xs font-medium text-slate-500 dark:text-slate-400 tabular-nums">
                      {formatTimestamp(record.timestamp)}
                    </time>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-full border ${sl?.cls ?? ""}`}
                    >
                      {sl?.label ?? record.status}
                    </span>
                  </div>
                  <p className="text-sm text-slate-800 dark:text-slate-200 mt-1.5">
                    {record.summary}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => onRemove(record.id)}
                  className="p-2 rounded-lg hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-500 dark:text-rose-400 flex-shrink-0"
                  title="Smazat záznam"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </article>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  unit,
  subIcon,
  accent = "neutral",
}: {
  label: string;
  value: string;
  sub?: string | null;
  unit?: string;
  subIcon?: React.ReactNode;
  accent?: "neutral" | "rose";
}) {
  const valueColor =
    accent === "rose"
      ? "text-rose-600 dark:text-rose-400"
      : "text-slate-900 dark:text-slate-50";
  return (
    <div className="glass-card-strong p-3.5">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 leading-tight">
        {label}
      </div>
      <div className="mt-1 flex items-baseline gap-1">
        <span className={`text-2xl font-bold tabular-nums ${valueColor}`}>
          {value}
        </span>
        {unit && (
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            {unit}
          </span>
        )}
      </div>
      {sub && (
        <div className="mt-1 flex items-center gap-0.5 text-[11px] text-slate-500 dark:text-slate-400">
          {subIcon}
          {sub}
        </div>
      )}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
      <span className={`w-2 h-2 rounded-full ${color}`} />
      <span>{label}</span>
    </div>
  );
}