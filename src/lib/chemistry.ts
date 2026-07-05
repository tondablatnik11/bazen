/**
 * Chemický engine pro výpočet péče o bazénovou vodu.
 *
 * Dvě úrovně:
 *  - simple: volume, ph, chlorine, condition
 *  - advanced: + temperature, alkalinity, calciumHardness, cyanuricAcid
 *
 * Všechny vzorce vychází z běžných doporučení výrobců bazénové chemie
 * a všechny vstupy jsou ošetřeny (clamp) na bezpečné rozsahy.
 */

// ---------- Typy ----------

export type WaterCondition = "clean" | "green" | "cloudy";
export type Mode = "simple" | "advanced";
export type Status = "ok" | "warning" | "danger";

export interface PoolInputs {
  volume: number;
  ph: number;
  chlorine: number;
  condition: WaterCondition;
  // Advanced
  temperature?: number; // °C, 5–35
  alkalinity?: number; // ppm (mg/l CaCO3), 0–300
  calciumHardness?: number; // ppm, 0–800
  cyanuricAcid?: number; // ppm, 0–150
}

export interface ProductDose {
  id: string;
  name: string;
  category: "ph" | "disinfection" | "clarifier" | "support" | "balancing";
  amount: number;
  unit: "g" | "ml";
  instruction: string;
  iconKey: "droplets" | "flask" | "sparkles" | "shield" | "wind" | "scale";
}

export interface ActionStep {
  order: number;
  title: string;
  detail: string;
  product?: ProductDose;
}

export interface AnalysisResult {
  status: Status;
  statusTitle: string;
  statusDescription: string;
  steps: ActionStep[];
  products: ProductDose[];
  tips: string[];
  /** Dílčí kontroly nad rámec 3 základních – pro pokročilý režim */
  advancedWarnings: string[];
  phZonePosition: number;
  chlorineZonePosition: number;
}

// ---------- Konstanty ----------

export const PH_IDEAL_MIN = 7.2;
export const PH_IDEAL_MAX = 7.6;
export const PH_TARGET = 7.4;

export const CHLORINE_IDEAL_MIN = 0.3;
export const CHLORINE_IDEAL_MAX = 0.6;

/** Ideální zóny pro advanced parametry */
export const TEMP_IDEAL_MIN = 24;
export const TEMP_IDEAL_MAX = 28;
export const ALK_IDEAL_MIN = 80;
export const ALK_IDEAL_MAX = 120;
export const CALCIUM_IDEAL_MIN = 200;
export const CALCIUM_IDEAL_MAX = 400;
export const CYA_IDEAL_MIN = 30;
export const CYA_IDEAL_MAX = 50;

/** Bezpečné rozsahy vstupů (clamp) */
export const LIMITS = {
  volume: { min: 5, max: 100, default: 20 },
  ph: { min: 6.0, max: 8.6, default: 7.8 },
  chlorine: { min: 0.0, max: 5.0, default: 0.1 },
  temperature: { min: 5, max: 35, default: 26 },
  alkalinity: { min: 0, max: 300, default: 100 },
  calciumHardness: { min: 0, max: 800, default: 250 },
  cyanuricAcid: { min: 0, max: 150, default: 40 },
} as const;

const PH_MINUS_G_PER_0_1_PER_10M3 = 80;
const PH_PLUS_G_PER_0_1_PER_10M3 = 100;
const CHLORINE_SHOCK_G_PER_M3 = 15;
const ALGICIDE_ML_PER_M3 = 15;
const FLOC_ML_PER_10M3 = 50;

/**
 * Dávky pro advanced parametry (orientační, vychází z běžných norem).
 *  - Alkalita: +10 ppm zvýší ALK o cca 0,45 °dKH na 10 m³ (= 25 g NaHCO3).
 *  - Vápník: +10 ppm Ca²⁺ zvýší tvrdost o cca 0,56 °dGH na 10 m³ (= 28 g CaCl2).
 *  - CYA: +10 ppm CYA na 10 m³ = cca 30 g kyseliny kyanurové.
 */
const ALK_PLUS_G_PER_10PPM_PER_10M3 = 25; // NaHCO3
const CALCIUM_PLUS_G_PER_10PPM_PER_10M3 = 28; // CaCl2
const CYA_PLUS_G_PER_10PPM_PER_10M3 = 30; // kyselina kyanurová
const ALK_MINUS_ML_PER_10PPM_PER_10M3 = 25; // pH/Alkalinity Minus (kys. sírová / NaHSO4)

// ---------- Pomocné funkce ----------

export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value) || !Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

function roundToTens(grams: number): number {
  return Math.max(0, Math.round(grams / 10) * 10);
}
function roundToWhole(ml: number): number {
  return Math.max(0, Math.round(ml));
}
function zonePosition(value: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return clamp((value - min) / (max - min), 0, 1);
}

// ---------- Hlavní analýza ----------

export function analyzePool(inputs: PoolInputs): AnalysisResult {
  const volume = clamp(
    Number(inputs.volume) || LIMITS.volume.default,
    LIMITS.volume.min,
    LIMITS.volume.max
  );
  const ph = clamp(
    Number(inputs.ph) || LIMITS.ph.default,
    LIMITS.ph.min,
    LIMITS.ph.max
  );
  const chlorine = clamp(
    Number(inputs.chlorine) || LIMITS.chlorine.default,
    LIMITS.chlorine.min,
    LIMITS.chlorine.max
  );
  const condition: WaterCondition =
    inputs.condition === "green" || inputs.condition === "cloudy"
      ? inputs.condition
      : "clean";

  // Advanced – undefined = nepoužito (jednoduchý režim)
  const temperature =
    inputs.temperature !== undefined
      ? clamp(inputs.temperature, LIMITS.temperature.min, LIMITS.temperature.max)
      : undefined;
  const alkalinity =
    inputs.alkalinity !== undefined
      ? clamp(inputs.alkalinity, LIMITS.alkalinity.min, LIMITS.alkalinity.max)
      : undefined;
  const calciumHardness =
    inputs.calciumHardness !== undefined
      ? clamp(
          inputs.calciumHardness,
          LIMITS.calciumHardness.min,
          LIMITS.calciumHardness.max
        )
      : undefined;
  const cyanuricAcid =
    inputs.cyanuricAcid !== undefined
      ? clamp(inputs.cyanuricAcid, LIMITS.cyanuricAcid.min, LIMITS.cyanuricAcid.max)
      : undefined;

  const products: ProductDose[] = [];
  const steps: ActionStep[] = [];
  const tips: string[] = [];
  const advancedWarnings: string[] = [];

  // ====== 1. pH (Priorita 1) ======
  let phProduct: ProductDose | null = null;
  if (ph > PH_IDEAL_MAX) {
    const delta = ph - PH_TARGET;
    const stepsCount = Math.max(1, Math.ceil(delta / 0.1));
    phProduct = {
      id: "ph-minus",
      name: "pH Mínus (granulát)",
      category: "ph",
      amount: roundToTens(stepsCount * (volume / 10) * PH_MINUS_G_PER_0_1_PER_10M3),
      unit: "g",
      instruction:
        "Rozpusťte odměřené množství v kbelíku s teplou vodou a pomalu vylévejte podél okraje bazénu při zapnuté filtraci. Nechte cirkulovat 2–3 hodiny, poté znovu změřte pH.",
      iconKey: "droplets",
    };
  } else if (ph < PH_IDEAL_MIN) {
    const delta = PH_TARGET - ph;
    const stepsCount = Math.max(1, Math.ceil(delta / 0.1));
    phProduct = {
      id: "ph-plus",
      name: "pH Plus (granulát)",
      category: "ph",
      amount: roundToTens(stepsCount * (volume / 10) * PH_PLUS_G_PER_0_1_PER_10M3),
      unit: "g",
      instruction:
        "Rozpusťte v kbelíku s vodou a za stálého míchání vlévejte do bazénu při zapnuté filtraci. Po 3–4 hodinách zkontrolujte pH a případně dávku opakujte.",
      iconKey: "flask",
    };
  }

  // ====== 2. Chlorový šok (Priorita 2) ======
  const chlorineLow = chlorine < CHLORINE_IDEAL_MIN;
  const needsShock =
    chlorineLow || condition === "green" || condition === "cloudy";
  const shockProduct: ProductDose | null = needsShock
    ? {
        id: "chlor-shock",
        name: "Chlorový šok (granulát)",
        category: "disinfection",
        amount: roundToTens(CHLORINE_SHOCK_G_PER_M3 * volume),
        unit: "g",
        instruction:
          "Rozpusťte v kbelíku s vodou a vylijte do bazénu při zapnuté filtraci. Nechte filtrovat nepřetržitě alespoň 24 hodin. Po šoku nepoužívejte bazén, dokud chlór neklesne pod 1,5 mg/l.",
        iconKey: "shield",
      }
    : null;

  // ====== 3. Algicid ======
  const algicideProduct: ProductDose | null =
    condition === "green"
      ? {
          id: "algicide",
          name: "Algicid (proti řasám)",
          category: "disinfection",
          amount: roundToWhole(ALGICIDE_ML_PER_M3 * volume),
          unit: "ml",
          instruction:
            "Nalijte doporučené množství přímo do vody u okraje bazénu při zapnuté filtraci. Preventivně opakujte každých 7–10 dní.",
          iconKey: "sparkles",
        }
      : null;

  // ====== 4. Vločkovač ======
  const needsFloc = condition === "cloudy" || (needsShock && condition !== "green");
  const flocProduct: ProductDose | null = needsFloc
    ? {
        id: "flocculant",
        name: "Vločkovač / Projasňovač",
        category: "clarifier",
        amount: roundToWhole((FLOC_ML_PER_10M3 * volume) / 10),
        unit: "ml",
        instruction:
          "Přidejte do vody u trysek při zapnuté filtraci. Nechte filtrovat nepřetržitě 24 hodin. Po vysrážení nečistot vysajte dno bazénovým vysavačem.",
        iconKey: "wind",
      }
    : null;

  // ====== 5. Advanced – alkalita ======
  let alkalinityProduct: ProductDose | null = null;
  if (alkalinity !== undefined) {
    if (alkalinity < ALK_IDEAL_MIN) {
      const delta = ALK_IDEAL_MIN - alkalinity;
      const amount = roundToTens(
        (delta / 10) * (volume / 10) * ALK_PLUS_G_PER_10PPM_PER_10M3
      );
      alkalinityProduct = {
        id: "alk-plus",
        name: "Alkalita Plus (NaHCO3)",
        category: "balancing",
        amount,
        unit: "g",
        instruction:
          "Rozpusťte v kbelíku s teplou vodou a pomalu přidávejte do bazénu. Doporučujeme upravovat alkalitu před korekcí pH – stabilní alkalita brání kolísání pH.",
        iconKey: "scale",
      };
    } else if (alkalinity > ALK_IDEAL_MAX) {
      const delta = alkalinity - ALK_IDEAL_MAX;
      const amount = roundToWhole(
        (delta / 10) * (volume / 10) * ALK_MINUS_ML_PER_10PPM_PER_10M3
      );
      alkalinityProduct = {
        id: "alk-minus",
        name: "Alkalita Minus",
        category: "balancing",
        amount,
        unit: "ml",
        instruction:
          "Přidejte do vody při zapnuté filtraci. Snížení alkality provádějte postupně po menších dávkách, abyste předešli prudkému poklesu pH.",
        iconKey: "scale",
      };
    }
  }

  // ====== 6. Advanced – vápník ======
  let calciumProduct: ProductDose | null = null;
  if (calciumHardness !== undefined && calciumHardness < CALCIUM_IDEAL_MIN) {
    const delta = CALCIUM_IDEAL_MIN - calciumHardness;
    calciumProduct = {
      id: "calcium-plus",
      name: "Tvrdost Plus (CaCl₂)",
      category: "balancing",
      amount: roundToTens(
        (delta / 10) * (volume / 10) * CALCIUM_PLUS_G_PER_10PPM_PER_10M3
      ),
      unit: "g",
      instruction:
        "Rozpusťte v kbelíku a pomalu přidávejte do bazénu. Příliš měkká voda může narušovat povrchy a těsnění – doplňte na minimum 200 ppm.",
      iconKey: "scale",
    };
  }

  // ====== 7. Advanced – CYA upozornění (bez dávky, jen doporučení) ======
  let cyaWarning: string | null = null;
  if (cyanuricAcid !== undefined) {
    if (cyanuricAcid > CYA_IDEAL_MAX) {
      cyaWarning = `Kyanurová kyselina je ${cyanuricAcid} ppm – příliš vysoká hodnota „uvězní" chlór a sníží jeho účinnost. Řešení: částečně vyměnit vodu v bazénu.`;
    } else if (cyanuricAcid < CYA_IDEAL_MIN && chlorine > 0) {
      cyaWarning = `Stabilizátor chlóru (CYA) je nízký (${cyanuricAcid} ppm). UV záření rychle rozkládá chlór – zvažte přidání stabilizátoru na ${CYA_IDEAL_MIN}–${CYA_IDEAL_MAX} ppm.`;
    }
  }

  // ====== Advanced – teplota (jen varování) ======
  let tempWarning: string | null = null;
  if (temperature !== undefined) {
    if (temperature >= 30) {
      tempWarning = `Teplota vody ${temperature} °C výrazně urychluje růst řas a zvyšuje spotřebu chlóru. Zvažte zastínění bazénu nebo častější kontroly.`;
    } else if (temperature >= TEMP_IDEAL_MAX) {
      tempWarning = `Teplota vody ${temperature} °C je na horní hranici ideální zóny. Sledujte častěji pH a chlór.`;
    } else if (temperature < TEMP_IDEAL_MIN && temperature >= 15) {
      tempWarning = `Teplota vody ${temperature} °C je nízká – chemické reakce jsou pomalejší, ale bazén je stabilnější. Snižte frekvenci měření.`;
    }
  }

  // ====== Sestavení akčního plánu ======
  let order = 1;

  // Priorita pro advanced: alkalita ovlivňuje pH, takže nejdříve alkalita
  if (alkalinityProduct) {
    steps.push({
      order: order++,
      title: "Nejprve upravte alkalitu",
      detail: `Alkalita je mimo ideální zónu ${ALK_IDEAL_MIN}–${ALK_IDEAL_MAX} ppm. Nestabilní alkalita způsobuje kolísání pH, proto srovnejte ji před úpravou pH.`,
      product: alkalinityProduct,
    });
    steps.push({
      order: order++,
      title: "Počkejte 4–6 hodin",
      detail:
        "Nechte vodu cirkulovat, aby se hydrogenuhličitan rovnoměrně rozprostřel, a poté znovu změřte alkalitu i pH.",
    });
  }

  if (phProduct) {
    steps.push({
      order: order++,
      title: "Upravte pH",
      detail: `Aktuální pH ${ph.toFixed(1)} je mimo ideální zónu ${PH_IDEAL_MIN.toFixed(1)}–${PH_IDEAL_MAX.toFixed(1)}. Při správné alkalitě se bude držet stabilně.`,
      product: phProduct,
    });
    steps.push({
      order: order++,
      title: "Počkejte 2–3 hodiny",
      detail:
        "Nechte vodu cirkulovat, aby se přípravek rovnoměrně rozprostřel a pH se stabilizovalo. Poté proveďte kontrolní měření.",
    });
  }

  if (calciumProduct) {
    steps.push({
      order: order++,
      title: "Doplňte tvrdost vody",
      detail: `Tvrdost ${calciumHardness} ppm je nízká – může narušovat povrchy bazénu.`,
      product: calciumProduct,
    });
  }

  if (shockProduct) {
    const reason = chlorineLow
      ? `chlór je ${chlorine.toFixed(1)} mg/l (minimum je ${CHLORINE_IDEAL_MIN} mg/l)`
      : condition === "green"
        ? "voda je zelená a obsahuje řasy"
        : "voda je zakalená a vyžaduje dezinfekci";
    steps.push({
      order: order++,
      title: "Aplikujte chlorový šok",
      detail: `Důvod: ${reason}. Chlorový šok rychle zvýší dezinfekční hladinu a zničí bakterie i řasy.`,
      product: shockProduct,
    });
  }

  if (algicideProduct) {
    steps.push({
      order: order++,
      title: "Přidejte algicid",
      detail:
        "Zelená voda znamená přítomnost řas. Algicid zabrání jejich dalšímu množení a pomůže šoku je zničit.",
      product: algicideProduct,
    });
  }

  if (flocProduct) {
    steps.push({
      order: order++,
      title: "Použijte vločkovač a spusťte filtraci na 24 hodin",
      detail:
        "Vločkovač srazí jemné nečistoty do větších vloček, které zachytí filtr nebo je posbíráte vysavačem.",
      product: flocProduct,
    });
  }

  // ====== Tipy ======
  if (needsShock) {
    tips.push("Během šokové léčby udržujte nepřetržitý chod filtrace 24 hodin.");
    tips.push(
      "Po aplikaci chlorového šoku nekoupejte se, dokud chlór neklesne pod 1,5 mg/l."
    );
  }
  if (condition === "green") {
    tips.push(
      "Vyčistěte stěny a dno bazénu kartáčem, aby se řasy uvolnily do vody."
    );
  }
  if (phProduct && phProduct.id === "ph-minus") {
    tips.push(
      "pH Mínus přidávejte postupně po menších dávkách – snadno se přidá, ale těžko se sníží zpět."
    );
  }
  if (temperature !== undefined && temperature >= 28) {
    tips.push(
      "Při vyšší teplotě vody zdvojnásobte frekvenci kontrol chlóru a pH."
    );
  }

  // ====== Advanced warnings ======
  if (tempWarning) advancedWarnings.push(tempWarning);
  if (cyaWarning) advancedWarnings.push(cyaWarning);

  // ====== Produkty v pořadí ======
  if (alkalinityProduct) products.push(alkalinityProduct);
  if (phProduct) products.push(phProduct);
  if (calciumProduct) products.push(calciumProduct);
  if (shockProduct) products.push(shockProduct);
  if (algicideProduct) products.push(algicideProduct);
  if (flocProduct) products.push(flocProduct);

  // ====== Celkový status ======
  let status: Status = "ok";
  let statusTitle = "Voda je v ideálním stavu";
  let statusDescription =
    "Všechny naměřené hodnoty jsou v doporučeném rozmezí. Bazén je připravený ke koupání.";

  const hasAdvancedIssue =
    advancedWarnings.length > 0 ||
    (alkalinity !== undefined &&
      (alkalinity < ALK_IDEAL_MIN || alkalinity > ALK_IDEAL_MAX)) ||
    (calciumHardness !== undefined && calciumHardness < CALCIUM_IDEAL_MIN);

  if (condition !== "clean" || phProduct || chlorineLow) {
    status = "danger";
    statusTitle = "Vyžaduje akutní zásah";
    statusDescription =
      "Některé parametry jsou mimo bezpečné rozmezí. Postupujte podle akčního plánu a vodu zkontrolujte znovu za 24 hodin.";
  } else if (
    ph > PH_IDEAL_MAX ||
    ph < PH_IDEAL_MIN ||
    chlorine < CHLORINE_IDEAL_MIN ||
    chlorine > CHLORINE_IDEAL_MAX ||
    hasAdvancedIssue
  ) {
    status = "warning";
    statusTitle = "Drobná nerovnováha";
    statusDescription =
      "Hodnoty jsou mimo ideální zónu, ale nevyžadují okamžitý šok. Proveďte drobné korekce a kontrolujte častěji.";
  } else if (phProduct) {
    status = "warning";
    statusTitle = "Drobná nerovnováha";
    statusDescription =
      "Voda je čistá, ale pH se vychýlilo z ideální zóny. Doporučujeme jemnou korekci.";
  }

  return {
    status,
    statusTitle,
    statusDescription,
    steps,
    products,
    tips,
    advancedWarnings,
    phZonePosition: zonePosition(ph, LIMITS.ph.min, LIMITS.ph.max),
    chlorineZonePosition: zonePosition(
      chlorine,
      LIMITS.chlorine.min,
      LIMITS.chlorine.max
    ),
  };
}