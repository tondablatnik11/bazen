/**
 * Statistické výpočty z historie měření.
 * Vše vstupně ošetřeno, výstup vždy validní (i pro prázdná data).
 */

import type { HistoryRecord } from "./history";

export interface HistoryStats {
  total: number;
  avgPh: number | null;
  avgChlorine: number | null;
  okCount: number;
  warningCount: number;
  dangerCount: number;
  /** Počet měření, kdy bylo potřeba šokovat (= danger status) */
  shockCount: number;
  /** Doba mezi prvním a posledním měřením (dny) */
  spanDays: number | null;
  /** Trend pH: 1 = roste, -1 = klesá, 0 = stabilní */
  phTrend: -1 | 0 | 1 | null;
  /** Trend chlóru */
  chlorineTrend: -1 | 0 | 1 | null;
}

export function computeStats(records: HistoryRecord[]): HistoryStats {
  const empty: HistoryStats = {
    total: 0,
    avgPh: null,
    avgChlorine: null,
    okCount: 0,
    warningCount: 0,
    dangerCount: 0,
    shockCount: 0,
    spanDays: null,
    phTrend: null,
    chlorineTrend: null,
  };

  if (records.length === 0) return empty;

  let sumPh = 0;
  let sumCl = 0;
  let ok = 0;
  let warn = 0;
  let danger = 0;

  for (const r of records) {
    sumPh += r.inputs.ph;
    sumCl += r.inputs.chlorine;
    if (r.status === "ok") ok++;
    else if (r.status === "warning") warn++;
    else if (r.status === "danger") danger++;
  }

  const first = records[0];
  const last = records[records.length - 1];

  const spanDays =
    records.length > 1
      ? Math.round((last.timestamp - first.timestamp) / (1000 * 60 * 60 * 24))
      : 0;

  // Trend = rozdíl posledních 3 vs prvních 3 (alespoň 4 měření)
  let phTrend: -1 | 0 | 1 | null = null;
  let chlorineTrend: -1 | 0 | 1 | null = null;
  if (records.length >= 4) {
    const head = records.slice(0, 3);
    const tail = records.slice(-3);
    const headAvgPh = head.reduce((a, r) => a + r.inputs.ph, 0) / head.length;
    const tailAvgPh = tail.reduce((a, r) => a + r.inputs.ph, 0) / tail.length;
    const headAvgCl = head.reduce((a, r) => a + r.inputs.chlorine, 0) / head.length;
    const tailAvgCl = tail.reduce((a, r) => a + r.inputs.chlorine, 0) / tail.length;
    const phDelta = tailAvgPh - headAvgPh;
    const clDelta = tailAvgCl - headAvgCl;
    phTrend = Math.abs(phDelta) < 0.1 ? 0 : phDelta > 0 ? 1 : -1;
    chlorineTrend = Math.abs(clDelta) < 0.1 ? 0 : clDelta > 0 ? 1 : -1;
  }

  return {
    total: records.length,
    avgPh: sumPh / records.length,
    avgChlorine: sumCl / records.length,
    okCount: ok,
    warningCount: warn,
    dangerCount: danger,
    shockCount: danger,
    spanDays,
    phTrend,
    chlorineTrend,
  };
}

/**
 * Převede záznamy na CSV pro stažení.
 * Hlavičky česky, oddělovač středník (lepší pro Excel čeština).
 */
export function recordsToCsv(records: HistoryRecord[]): string {
  const headers = [
    "Datum a čas",
    "Objem (m³)",
    "pH",
    "Chlór (mg/l)",
    "Vzhled",
    "Teplota (°C)",
    "Alkalita (ppm)",
    "Tvrdost (ppm)",
    "CYA (ppm)",
    "Stav",
  ];
  const rows = records.map((r) => [
    new Date(r.timestamp).toLocaleString("cs-CZ"),
    r.inputs.volume.toString(),
    r.inputs.ph.toFixed(1),
    r.inputs.chlorine.toFixed(1),
    r.inputs.condition,
    r.inputs.temperature !== undefined ? r.inputs.temperature.toString() : "",
    r.inputs.alkalinity !== undefined ? r.inputs.alkalinity.toString() : "",
    r.inputs.calciumHardness !== undefined
      ? r.inputs.calciumHardness.toString()
      : "",
    r.inputs.cyanuricAcid !== undefined ? r.inputs.cyanuricAcid.toString() : "",
    r.status,
  ]);

  // CSV escape: obal hodnoty do uvozovek, zdvojení uvozovek uvnitř
  const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
  return [headers, ...rows]
    .map((row) => row.map(escape).join(";"))
    .join("\n");
}

/**
 * Stáhne soubor do prohlížeče.
 */
export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}