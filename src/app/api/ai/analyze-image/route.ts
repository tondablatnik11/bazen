/**
 * API route: /api/ai/analyze-image
 *
 * Strukturovaný rozbor fotografie bazénu. Vrací JSON s odhadem:
 *  - condition: "clean" | "green" | "cloudy" | "unknown"
 *  - description: slovní popis (1–2 věty, česky)
 *  - confidence: 0..1
 *  - recommendations: 0–3 konkrétní doporučení
 *  - _debug?: raw text od modelu (jen pokud se parsování nezdaří)
 *
 * Tuto routu použije klient pro automatické předvyplnění formuláře.
 */

import { NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface AnalyzeRequest {
  base64: string;
  mimeType: string;
  currentInputs?: Record<string, unknown>;
}

interface AnalyzeResponse {
  condition: "clean" | "green" | "cloudy" | "unknown";
  description: string;
  confidence: number;
  recommendations: string[];
  _debug?: string;
}

const MODEL = "meta/llama-3.2-90b-vision-instruct";
const API_BASE = "https://integrate.api.nvidia.com/v1";

/**
 * Pokusí se ze stringu vytáhnout JSON objekt.
 * Zvládá:
 *  - holý JSON
 *  - JSON v markdown code blocku (```json ... ```)
 *  - JSON s omáčkou kolem (vezme první vyvážený objekt)
 */
function extractJsonObject(raw: string): string | null {
  const trimmed = raw.trim();

  // 1) Markdown code block ```json ... ``` nebo ``` ... ```
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence && fence[1]) {
    const candidate = fence[1].trim();
    if (candidate.startsWith("{") && candidate.endsWith("}")) {
      return candidate;
    }
  }

  // 2) Najdi první vyvážený JSON objekt (počítá závorky a stringy)
  if (trimmed.startsWith("{")) {
    let depth = 0;
    let inString = false;
    let escape = false;
    for (let i = 0; i < trimmed.length; i++) {
      const ch = trimmed[i];
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === "{") depth++;
      else if (ch === "}") {
        depth--;
        if (depth === 0) return trimmed.slice(0, i + 1);
      }
    }
  }

  return null;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    console.error("[analyze-image] chybí NVIDIA_API_KEY");
    return new Response(
      JSON.stringify({
        error: "Server nemá nastavený NVIDIA_API_KEY (env variable).",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return new Response(
      JSON.stringify({ error: "Neplatný JSON payload." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!body.base64) {
    return new Response(
      JSON.stringify({ error: "Chybí obrázek (base64)." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Ověříme velikost – NVIDIA limit může být menší než náš 10MB client limit
  const sizeKB = Math.round((body.base64.length * 0.75) / 1024);
  console.log(
    `[analyze-image] mime=${body.mimeType}, ~${sizeKB} KB, model=${MODEL}`
  );

  const systemPrompt = `Jsi expert na bazénovou vodu. Analyzuj fotografii a odpověz POUZE platným JSON objektem (žádný další text, žádné markdown bloky).

Formát (přesně takto):

{"condition":"clean","description":"čistá tyrkysová voda","confidence":0.92,"recommendations":["pravidelně kontrolujte pH"]}

Hodnoty:
- "condition": "clean" (čistá/průzračná/tyrkysová) | "green" (zelený nádech/řasy) | "cloudy" (bílá/mléčná) | "unknown" (fotka není bazén, je moc tmavá/rozmazaná)
- "description": popis v češtině, 1–2 věty
- "confidence": číslo 0–1
- "recommendations": pole 0–3 krátkých doporučení v češtině

PRAVIDLA:
1. Odpověz JEN JSON objektem, nic jiného.
2. Nepiš žádné značky produktů – jen obecné typy přípravků.
3. Pokud fotka není bazén nebo je nečitelná, condition="unknown" a confidence < 0.3.`;

  const userText = "Analyzuj bazén na fotografii. Odpověz POUZE JSON objektem.";

  const payload = {
    model: MODEL,
    messages: [
      { role: "system" as const, content: systemPrompt },
      {
        role: "user" as const,
        content: [
          { type: "text" as const, text: userText },
          {
            type: "image_url" as const,
            image_url: {
              url: `data:${body.mimeType || "image/jpeg"};base64,${
                body.base64
              }`,
            },
          },
        ] as never,
      },
    ],
    temperature: 0.2,
    top_p: 0.9,
    max_tokens: 800,
    stream: false,
  };

  // Zavoláme NVIDIA Integrate API
  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Neznámá chyba";
    console.error("[analyze-image] fetch selhal:", msg);
    return new Response(
      JSON.stringify({ error: `Nelze se připojit k AI službě: ${msg}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    console.error(
      `[analyze-image] upstream ${upstream.status}:`,
      errText.slice(0, 500)
    );
    return new Response(
      JSON.stringify({
        error: `AI služba vrátila ${upstream.status}.`,
        detail: errText.slice(0, 300),
      }),
      {
        status: upstream.status || 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  let data: {
    choices?: { message?: { content?: string } }[];
  };
  try {
    data = (await upstream.json()) as typeof data;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Neznámá chyba";
    console.error("[analyze-image] parsování upstream JSON selhalo:", msg);
    return new Response(
      JSON.stringify({ error: `AI vrátila nevalidní JSON: ${msg}` }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  const rawContent = data.choices?.[0]?.message?.content ?? "";
  console.log(
    `[analyze-image] raw content (${rawContent.length} chars):`,
    rawContent.slice(0, 300)
  );

  if (!rawContent) {
    return new Response(
      JSON.stringify({
        error: "AI vrátila prázdnou odpověď.",
        _debug: "choices[0].message.content was empty",
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // Robustní extrakce JSON
  const jsonText = extractJsonObject(rawContent);
  if (!jsonText) {
    console.error(
      "[analyze-image] nepodařilo se najít JSON v:",
      rawContent.slice(0, 200)
    );
    return new Response(
      JSON.stringify({
        error: "AI nevrátila parsovatelný JSON.",
        _debug: rawContent.slice(0, 400),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  let parsed: Partial<AnalyzeResponse>;
  try {
    parsed = JSON.parse(jsonText) as Partial<AnalyzeResponse>;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Neznámá chyba";
    console.error("[analyze-image] JSON.parse selhal:", msg, "jsonText:", jsonText.slice(0, 200));
    return new Response(
      JSON.stringify({
        error: `Nelze parsovat odpověď AI: ${msg}`,
        _debug: jsonText.slice(0, 400),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validace a normalizace
  const validConditions = ["clean", "green", "cloudy", "unknown"] as const;
  const condition = validConditions.includes(
    parsed.condition as (typeof validConditions)[number]
  )
    ? (parsed.condition as AnalyzeResponse["condition"])
    : "unknown";

  return new Response(
    JSON.stringify({
      condition,
      description: String(parsed.description ?? "").slice(0, 400),
      confidence:
        typeof parsed.confidence === "number"
          ? Math.max(0, Math.min(1, parsed.confidence))
          : 0.5,
      recommendations: Array.isArray(parsed.recommendations)
        ? parsed.recommendations
            .map((r) => String(r).slice(0, 200))
            .slice(0, 3)
        : [],
    }),
    { headers: { "Content-Type": "application/json" } }
  );
}