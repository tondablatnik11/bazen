/**
 * LocalStorage hook + utilita pro historii měření.
 *
 * Data jsou uložena v jednom JSON klíči. Velikostní limit: posledních MAX_RECORDS
 * záznamů (chráníme storage quota). Struktura záznamu zahrnuje snapshot vstupů
 * v době měření + výsledný status – pro pozdější trendy.
 */

"use client";

import { useCallback, useEffect, useState } from "react";
import type { PoolInputs, AnalysisResult } from "@/lib/chemistry";

export interface HistoryRecord {
  id: string;
  timestamp: number;
  inputs: PoolInputs;
  status: AnalysisResult["status"];
  /** Stručný popis v době měření (např. "pH 7.8, Cl 0.1") */
  summary: string;
}

export const STORAGE_KEY = "chytry-bazen:history:v1";
const MAX_RECORDS = 100;

function safeGetItem(key: string): HistoryRecord[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (r) =>
        r &&
        typeof r.id === "string" &&
        typeof r.timestamp === "number" &&
        typeof r.inputs === "object" &&
        typeof r.status === "string"
    );
  } catch {
    return [];
  }
}

function safeSetItem(key: string, value: HistoryRecord[]) {
  if (typeof window === "undefined") return;
  try {
    const trimmed = value.slice(-MAX_RECORDS);
    window.localStorage.setItem(key, JSON.stringify(trimmed));
  } catch (e) {
    // QuotaExceeded – smažeme nejstarší záznamy a zkusíme znovu.
    if (value.length > 1) {
      safeSetItem(key, value.slice(Math.floor(value.length / 2)));
    }
  }
}

export function makeRecordId(): string {
  return `r_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function summarizeInputs(inputs: PoolInputs): string {
  const parts: string[] = [];
  parts.push(`pH ${inputs.ph.toFixed(1)}`);
  parts.push(`Cl ${inputs.chlorine.toFixed(1)}`);
  if (inputs.condition === "green") parts.push("zelená");
  else if (inputs.condition === "cloudy") parts.push("zakalená");
  else parts.push("čistá");
  if (typeof inputs.temperature === "number") {
    parts.push(`${Math.round(inputs.temperature)}°C`);
  }
  return parts.join(" · ");
}

/**
 * React hook: usePoolHistory().
 * - records: pole měření (nejnovější nakonec)
 * - addRecord(): přidá aktuální snapshot
 * - removeRecord(): smaže konkrétní záznam
 * - clear(): smaže vše
 * - isReady: máme data z localStorage (po hydration)
 */
export function usePoolHistory() {
  const [records, setRecords] = useState<HistoryRecord[]>([]);
  const [isReady, setIsReady] = useState(false);

  // Hydrate z localStorage při mountu
  useEffect(() => {
    setRecords(safeGetItem(STORAGE_KEY));
    setIsReady(true);
  }, []);

  // Synchronizuj při změně
  useEffect(() => {
    if (!isReady) return;
    safeSetItem(STORAGE_KEY, records);
  }, [records, isReady]);

  const addRecord = useCallback(
    (inputs: PoolInputs, result: AnalysisResult) => {
      const record: HistoryRecord = {
        id: makeRecordId(),
        timestamp: Date.now(),
        inputs: { ...inputs },
        status: result.status,
        summary: summarizeInputs(inputs),
      };
      setRecords((prev) => [...prev, record]);
      return record;
    },
    []
  );

  const removeRecord = useCallback((id: string) => {
    setRecords((prev) => prev.filter((r) => r.id !== id));
  }, []);

  const clear = useCallback(() => {
    setRecords([]);
  }, []);

  return { records, addRecord, removeRecord, clear, isReady };
}

/** Formátuje timestamp na krátké české datum+čas. */
export function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(
    d.getHours()
  )}:${pad(d.getMinutes())}`;
}

/** Vrátí rozdíl mezi dvěma čísly (kladný = vzestup). */
export function diff(a: number, b: number): number {
  return Number((a - b).toFixed(2));
}

/** Lidsky čitelný popis změny (např. "+0.4 (▲)"). */
export function formatDiff(d: number, decimals = 1): string {
  if (Math.abs(d) < 0.05) return "beze změny";
  const rounded = d.toFixed(decimals);
  if (d > 0) return `+${rounded} (▲)`;
  return `${rounded} (▼)`;
}