/**
 * API route: /api/ai/analyze-image
 *
 * Strukturovaný rozbor fotografie bazénu. Vrací JSON s odhadem:
 *  - condition: "clean" | "green" | "cloudy" | "unknown"
 *  - description: slovní popis (1–2 věty, česky)
 *  - confidence: 0..1
 *  - recommendations: 0–3 konkrétní doporučení
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
}

const MODEL = "z-ai/glm-5.2";
const API_BASE = "https://integrate.api.nvidia.com/v1";

export async function POST(req: NextRequest) {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          "Server není nakonfigurován: chybí NVIDIA_API_KEY. Nastavte jej v .env.local.",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  let body: AnalyzeRequest;
  try {
    body = (await req.json()) as AnalyzeRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Neplatný JSON payload." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.base64) {
    return new Response(JSON.stringify({ error: "Chybí obrázek." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const systemPrompt = `Jsi expert na bazénovou vodu. Analyzuj fotografii a odpověz POUZE platným JSON objektem v tomto formátu (bez dalšího textu):

{
  "condition": "clean" | "green" | "cloudy" | "unknown",
  "description": "krátký popis v češtině (1–2 věty)",
  "confidence": číslo 0–1,
  "recommendations": ["doporučení 1", "doporučení 2"]
}

Podmínky:
- "clean" = voda je čirá, průhledná, lehce modrá/tyrkysová
- "green" = viditelný zelený nádech nebo řasy
- "cloudy" = bílá/mléčná, neprůhledná
- "unknown" = fotka je nejasná, moc tmavá, nebo není bazén

Nikdy nepřidávej další text mimo JSON. Nikdy neuváděj značky produktů.`;

  const userText = "Analyzuj tento bazén a odpověz pouze JSON objektem podle schématu.";

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
    temperature: 0.3,
    top_p: 0.9,
    max_tokens: 800,
    stream: false,
  };

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
  } catch {
    return new Response(
      JSON.stringify({ error: "Nelze se připojit k AI službě." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!upstream.ok) {
    const errText = await upstream.text().catch(() => "");
    return new Response(
      JSON.stringify({
        error: `AI služba vrátila chybu ${upstream.status}: ${errText.slice(
          0,
          200
        )}`,
      }),
      {
        status: upstream.status || 502,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const data = (await upstream.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const rawContent = data.choices?.[0]?.message?.content ?? "";

  // Pokusíme se vytáhnout JSON i z případného „omáčkového" výstupu
  const jsonMatch = rawContent.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    return new Response(
      JSON.stringify({
        error: "AI nevrátila parsovatelný JSON.",
        raw: rawContent.slice(0, 300),
      }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  let parsed: AnalyzeResponse;
  try {
    parsed = JSON.parse(jsonMatch[0]) as AnalyzeResponse;
  } catch {
    return new Response(
      JSON.stringify({ error: "Nelze parsovat odpověď AI." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  // Validace
  const validConditions = ["clean", "green", "cloudy", "unknown"] as const;
  const condition = validConditions.includes(parsed.condition as never)
    ? parsed.condition
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