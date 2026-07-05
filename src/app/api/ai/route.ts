/**
 * API route: /api/ai
 *
 * Proxy vrstva mezi klientem a NVIDIA Integrate API (OpenAI-kompatibilní).
 * Endpoint podporuje:
 *  - chat (text-only)
 *  - vision (text + base64 obrázek)
 *  - streaming (Server-Sent Events) pro lepší UX
 *
 * Klíč je uložen v env proměnné NVIDIA_API_KEY – nikdy se neodešle do prohlížeče.
 */

import { NextRequest } from "next/server";
import type { PoolInputs, AnalysisResult } from "@/lib/chemistry";
import { buildSystemPrompt } from "@/lib/ai-client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ChatRequest {
  messages: { role: "user" | "assistant"; content: string }[];
  inputs: PoolInputs;
  result: AnalysisResult;
  image?: { base64: string; mimeType: string };
  historySummary?: string;
}

const MODEL = "meta/llama-3.2-90b-vision-instruct";
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

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return new Response(JSON.stringify({ error: "Neplatný JSON payload." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
    return new Response(
      JSON.stringify({ error: "Chybí messages v payloadu." }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  }

  // Sestavíme systémový prompt
  const systemPrompt = buildSystemPrompt({
    inputs: body.inputs,
    result: body.result,
    hasImage: !!body.image,
    historySummary: body.historySummary,
  });

  // Sestavíme zprávy – poslední zprávu obohatíme o obrázek (vision)
  const lastMsg = body.messages[body.messages.length - 1];
  const previousMessages = body.messages.slice(0, -1);

  const userContent: unknown[] = [{ type: "text", text: lastMsg.content }];
  if (body.image?.base64) {
    userContent.push({
      type: "image_url",
      image_url: {
        url: `data:${body.image.mimeType || "image/jpeg"};base64,${
          body.image.base64
        }`,
      },
    });
  }

  const payload = {
    model: MODEL,
    messages: [
      { role: "system" as const, content: systemPrompt },
      ...previousMessages.map((m) => ({ role: m.role, content: m.content })),
      { role: "user" as const, content: userContent as never },
    ],
    temperature: 0.7,
    top_p: 0.9,
    max_tokens: 2048,
    stream: true,
  };

  // Zavoláme NVIDIA Integrate API se streamováním
  let upstream: Response;
  try {
    upstream = await fetch(`${API_BASE}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(payload),
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: "Nelze se připojit k AI službě." }),
      { status: 502, headers: { "Content-Type": "application/json" } }
    );
  }

  if (!upstream.ok || !upstream.body) {
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

  // Přepošleme SSE stream dál – klient si ho přečte a zobrazí průběžně.
  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}