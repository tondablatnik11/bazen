/**
 * Systémový prompt pro AI chat / vision.
 *
 * Kontext je vždy:
 *  - aktuální vstupy (parametry bazénu)
 *  - výsledek výpočetního enginu (doporučení)
 *  - volitelně historie měření
 *  - volitelně text/obrázek od uživatele
 *
 * Prompt má tři „módy" chování:
 *  1. analyze-image: pokud je přiložen obrázek, prioritně analyzuj vizuální stav vody.
 *  2. free-chat: odpovídej jako zkušený bazénář, česky, věcně, bez zbytečné omáčky.
 *  3. never-recommend-brands: nikdy neuváděj konkrétní značky produktů – jen aktivní
 *     látky (NaHSO4, NaHCO3, Ca(ClO)₂ atd.) a obecný typ přípravku.
 *  4. stay-safe: připomínej ověření testerem, nikdy nenahrazuj lékařské/právní rady.
 */

import type { PoolInputs, AnalysisResult } from "./chemistry";

export function buildSystemPrompt(opts: {
  inputs: PoolInputs;
  result: AnalysisResult;
  hasImage?: boolean;
  historySummary?: string;
}): string {
  const { inputs, result, hasImage, historySummary } = opts;

  const lines: string[] = [
    "Jsi zkušený český bazénář – technický poradce pro péči o bazénovou vodu.",
    "Odpovídáš výhradně česky, věcně, strukturovaně a bez zbytečné omáčky.",
    "",
    "PRAVIDLA:",
    "1. Nikdy neuváděj konkrétní obchodní značky produktů. Místo toho uváděj aktivní látku (např. pH Mínus = NaHSO4, Chlor šok = Ca(ClO)2 nebo NaClO, Alkalita Plus = NaHCO3).",
    "2. Vždy připomeň, že jde o orientační doporučení a výsledky je nutné ověřit testerem.",
    "3. Pokud je situace akutní (zelená voda + nízký chlór), jasně zvýrazni pořadí kroků: pH → chlorový šok → algicid → filtrace 24h.",
    "4. Pokud vidíš v datech trendy (rostoucí pH, kolísavý chlór), zmiň je.",
    "5. Nikdy nenahrazuj lékařské ani právní rady. Při zdravotních potížích doporuč lékaře.",
    "6. Odpovídi maximálně 6–8 vět, pokud uživatel nechce víc. Používej odrážky pro přehlednost.",
    "",
    "AKTUÁLNÍ STAV BAZÉNU (z výpočetního enginu):",
    `- Objem: ${inputs.volume} m³`,
    `- pH: ${inputs.ph.toFixed(1)}`,
    `- Chlór: ${inputs.chlorine.toFixed(1)} mg/l`,
    `- Vzhled: ${
      inputs.condition === "clean"
        ? "čistá a průzračná"
        : inputs.condition === "green"
          ? "zelená (řasy)"
          : "mléčná / zakalená"
    }`,
  ];

  if (typeof inputs.temperature === "number") {
    lines.push(`- Teplota: ${inputs.temperature} °C`);
  }
  if (typeof inputs.alkalinity === "number") {
    lines.push(`- Alkalita: ${inputs.alkalinity} ppm`);
  }
  if (typeof inputs.calciumHardness === "number") {
    lines.push(`- Tvrdost vody: ${inputs.calciumHardness} ppm`);
  }
  if (typeof inputs.cyanuricAcid === "number") {
    lines.push(`- CYA: ${inputs.cyanuricAcid} ppm`);
  }

  lines.push("");
  lines.push("VÝSLEDEK ANALÝZY:");
  lines.push(`- Stav: ${result.statusTitle}`);
  lines.push(`- Popis: ${result.statusDescription}`);

  if (result.products.length > 0) {
    lines.push("- Doporučené přípravky:");
    result.products.forEach((p) => {
      lines.push(`  • ${p.name}: ${p.amount} ${p.unit}`);
    });
  }

  if (result.advancedWarnings.length > 0) {
    lines.push("- Rozšířená upozornění:");
    result.advancedWarnings.forEach((w) => lines.push(`  • ${w}`));
  }

  if (historySummary) {
    lines.push("");
    lines.push("HISTORIE (pro trendy):");
    lines.push(historySummary);
  }

  if (hasImage) {
    lines.push("");
    lines.push(
      "Uživatel přiložil fotografii bazénu. Analyzuj vizuální stav vody (barvu, čirost, přítomnost řas, listí, pěny, usazenin) a zkombinuj s výše uvedenými parametry. Pokud fotka ukazuje něco jiného než aktuální formulář, zmiň to a doporuč úpravu formuláře."
    );
  }

  return lines.join("\n");
}