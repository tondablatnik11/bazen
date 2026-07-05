"use client";

import {
  Bot,
  Camera,
  Send,
  Sparkles,
  X,
  ImagePlus,
  Loader2,
  RefreshCw,
  AlertCircle,
  Droplets,
  FlaskConical,
  Thermometer,
  TestTube,
  ShieldCheck,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { PoolInputs, AnalysisResult, WaterCondition } from "@/lib/chemistry";
import { summarizeInputs, type HistoryRecord } from "@/lib/history";

interface AIAssistantProps {
  inputs: PoolInputs;
  result: AnalysisResult;
  history: HistoryRecord[];
  onApplyImageAnalysis?: (condition: WaterCondition) => void;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageDataUrl?: string;
}

const MAX_IMAGE_DIM = 1024;

const SUGGESTIONS = [
  {
    icon: Droplets,
    text: "Proč mi pořád zelená voda?",
    color: "text-emerald-600 dark:text-emerald-400",
  },
  {
    icon: TestTube,
    text: "Jak často mám měřit pH a chlór?",
    color: "text-pool-600 dark:text-pool-400",
  },
  {
    icon: FlaskConical,
    text: "Co je to kyanurová kyselina?",
    color: "text-violet-600 dark:text-violet-400",
  },
  {
    icon: ShieldCheck,
    text: "Můžu se koupat po chlorovém šoku?",
    color: "text-amber-600 dark:text-amber-400",
  },
  {
    icon: Thermometer,
    text: "Jak teplota ovlivňuje chlór?",
    color: "text-rose-600 dark:text-rose-400",
  },
  {
    icon: Camera,
    text: "Co dělat s mléčnou vodou?",
    color: "text-slate-600 dark:text-slate-300",
  },
];

/**
 * Plnohodnotná stránka AI chatu – velký chat, galerie poslaných fotek,
 * kontextové návrhy. Streamuje odpovědi z /api/ai (SSE), podporuje vision dotazy.
 */
export function AIAssistant({
  inputs,
  result,
  history,
  onApplyImageAnalysis,
}: AIAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [imageMime, setImageMime] = useState<string>("image/jpeg");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analyzingImage, setAnalyzingImage] = useState(false);
  const [imageAnalysisResult, setImageAnalysisResult] = useState<{
    condition: WaterCondition | "unknown";
    description: string;
    confidence: number;
  } | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isStreaming]);

  const handleImageFile = useCallback(async (file: File) => {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("Soubor musí být obrázek (JPG/PNG/WebP).");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Obrázek je příliš velký (max 10 MB).");
      return;
    }
    const dataUrl = await readFileAsDataURL(file);
    const img = await loadImage(dataUrl);
    const resized = await resizeImage(img, MAX_IMAGE_DIM, file.type);
    setImageDataUrl(resized.dataUrl);
    setImageMime(resized.mimeType);
    const b64 = resized.dataUrl.split(",")[1] ?? null;
    setImageBase64(b64);
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleImageFile(file);
    e.target.value = "";
  };

  const clearImage = () => {
    setImageDataUrl(null);
    setImageBase64(null);
    setImageAnalysisResult(null);
  };

  const sendMessage = async () => {
    const text = input.trim();
    if (!text && !imageBase64) return;
    if (isStreaming) return;

    setError(null);
    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: text || "Co je na fotce?",
      imageDataUrl: imageDataUrl ?? undefined,
    };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setImageDataUrl(null);
    setImageBase64(null);
    setImageAnalysisResult(null);

    setIsStreaming(true);
    try {
      const resp = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: nextMessages.map(({ role, content }) => ({ role, content })),
          inputs,
          result,
          image: imageBase64
            ? { base64: imageBase64, mimeType: imageMime }
            : undefined,
          historySummary: buildHistorySummary(history),
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(errBody.error ?? `HTTP ${resp.status}`);
      }
      if (!resp.body) throw new Error("Prázdná odpověď serveru.");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";

      setMessages((prev) => [
        ...prev,
        { id: makeId(), role: "assistant", content: "" },
      ]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const payload = trimmed.slice(5).trim();
          if (payload === "[DONE]") continue;
          try {
            const json = JSON.parse(payload) as {
              choices?: { delta?: { content?: string } }[];
            };
            const delta = json.choices?.[0]?.delta?.content;
            if (delta) {
              assistantText += delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  ...updated[updated.length - 1],
                  role: "assistant",
                  content: assistantText,
                };
                return updated;
              });
            }
          } catch {
            // keep-alive
          }
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Neznámá chyba.";
      setError(`AI asistent selhal: ${msg}`);
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setIsStreaming(false);
    }
  };

  const handleAnalyzeImageOnly = async () => {
    if (!imageBase64) return;
    setError(null);
    setAnalyzingImage(true);
    setImageAnalysisResult(null);
    try {
      const resp = await fetch("/api/ai/analyze-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ base64: imageBase64, mimeType: imageMime }),
      });

      // Bez ohledu na status čteme JSON – chyby z API mají strukturovaný tvar.
      const body = (await resp.json().catch(() => ({}))) as {
        error?: string;
        detail?: string;
        _debug?: string;
        condition?: WaterCondition | "unknown";
        description?: string;
        confidence?: number;
        recommendations?: string[];
      };

      if (!resp.ok || body.error) {
        // Logujeme pro vývojáře (zobrazí se v DevTools konzoli)
        // eslint-disable-next-line no-console
        console.error("[analyze-image] API chyba:", {
          status: resp.status,
          error: body.error,
          detail: body.detail,
          debug: body._debug,
        });
        throw new Error(
          body.error || body.detail || `HTTP ${resp.status}`
        );
      }

      // Úspěch – nastavíme výsledek
      setImageAnalysisResult({
        condition: body.condition ?? "unknown",
        description: body.description ?? "",
        confidence: typeof body.confidence === "number" ? body.confidence : 0,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Neznámá chyba.";
      setError(`Analýza selhala: ${msg}`);
    } finally {
      setAnalyzingImage(false);
    }
  };

  const handleReset = () => {
    setMessages([]);
    setError(null);
    clearImage();
  };

  // Obrázky z historie (pro galerii)
  const imageMessages = messages.filter((m) => m.imageDataUrl);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* HEADER */}
      <div className="glass-card-strong p-4 sm:p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center text-white shadow-lg shadow-violet-500/30 flex-shrink-0">
              <Bot className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-lg text-slate-900 dark:text-slate-50 leading-tight">
                AI bazénář
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-tight mt-0.5">
                Poháněno GLM 5.2 · odpovídá v češtině s kontextem tvého bazénu
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-full bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 border border-violet-200 dark:border-violet-700">
              <Sparkles className="w-3 h-3" />
              Vision + Chat
            </span>
            {messages.length > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Nový chat
              </button>
            )}
          </div>
        </div>

        {/* Kontextový box */}
        <div className="mt-3 px-3 py-2 bg-pool-50/60 dark:bg-pool-950/60 border border-pool-200/60 dark:border-pool-800/60 rounded-lg text-[11px] text-pool-800 dark:text-pool-200 leading-relaxed">
          <span className="font-semibold">Aktuální kontext:</span>{" "}
          {summarizeInputs(inputs)}
        </div>
      </div>

      {/* HLAVNÍ CHAT */}
      <div className="glass-card-strong overflow-hidden flex flex-col">
        {/* Oblast zpráv */}
        <div
          ref={scrollRef}
          className="p-4 space-y-3 min-h-[320px] max-h-[60vh] overflow-y-auto bg-slate-50/30 dark:bg-slate-950/30"
        >
          {messages.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center mb-3 shadow-lg shadow-violet-500/30">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-slate-900 dark:text-slate-50 text-lg">
                Zeptej se na cokoliv
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                Vyber rychlý dotaz níže nebo napiš vlastní. Můžeš přidat i
                fotografii bazénu.
              </p>
            </div>
          )}
          {messages.map((m) => (
            <ChatBubble key={m.id} message={m} />
          ))}
          {isStreaming &&
            messages[messages.length - 1]?.content === "" && (
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 pl-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Přemýšlím…
              </div>
            )}
          {error && (
            <div className="text-xs text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg p-2.5 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Náhled obrázku */}
        {imageDataUrl && (
          <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageDataUrl}
                  alt="Náhled"
                  className="w-24 h-24 object-cover rounded-lg border border-slate-200 dark:border-slate-600"
                />
                <button
                  type="button"
                  onClick={clearImage}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-rose-500 dark:bg-rose-600 text-white flex items-center justify-center shadow"
                  title="Odebrat obrázek"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="flex-1 min-w-0 space-y-2">
                <button
                  type="button"
                  onClick={handleAnalyzeImageOnly}
                  disabled={analyzingImage}
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-100 dark:bg-violet-900/60 text-violet-800 dark:text-violet-200 text-xs font-semibold border border-violet-200 dark:border-violet-700 hover:bg-violet-200 dark:hover:bg-violet-800/60 disabled:opacity-50"
                >
                  {analyzingImage ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Camera className="w-3.5 h-3.5" />
                  )}
                  Analyzovat fotku a předvyplnit kalkulačku
                </button>
                {/* Chyba z analyze-image se zobrazí PŘÍMO u tlačítka, ne ve scrollovací oblasti */}
                {error && imageDataUrl && (
                  <div className="text-[11px] text-rose-700 dark:text-rose-200 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 rounded-lg p-2 leading-relaxed">
                    {error}
                  </div>
                )}
                {imageAnalysisResult && (
                  <div className="text-[11px] bg-violet-50 dark:bg-violet-950/60 border border-violet-200 dark:border-violet-700 rounded-lg p-2.5 leading-relaxed">
                    <p className="font-semibold text-violet-900 dark:text-violet-100">
                      Stav:{" "}
                      {imageAnalysisResult.condition === "clean"
                        ? "čistá"
                        : imageAnalysisResult.condition === "green"
                          ? "zelená"
                          : imageAnalysisResult.condition === "cloudy"
                            ? "zakalená"
                            : "nelze určit"}{" "}
                      ({Math.round(imageAnalysisResult.confidence * 100)}%)
                    </p>
                    <p className="text-violet-800 dark:text-violet-200 mt-1">
                      {imageAnalysisResult.description}
                    </p>
                    {imageAnalysisResult.condition !== "unknown" &&
                      imageAnalysisResult.condition !== "clean" &&
                      onApplyImageAnalysis && (
                        <button
                          type="button"
                          onClick={() => {
                            onApplyImageAnalysis(
                              imageAnalysisResult.condition as WaterCondition
                            );
                            clearImage();
                          }}
                          className="mt-1.5 inline-flex items-center gap-1 text-[11px] font-bold text-violet-700 dark:text-violet-200 hover:underline"
                        >
                          ← Použít v kalkulačce
                        </button>
                      )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 p-3">
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileSelect}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center"
              title="Přidat nebo vyfotit fotku"
            >
              <ImagePlus className="w-4 h-4" />
            </button>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              placeholder={
                imageBase64
                  ? "Zeptej se na fotku…"
                  : "Zeptej se na cokoliv o bazénu…"
              }
              rows={1}
              className="flex-1 resize-none px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 dark:focus:ring-violet-500 focus:bg-white dark:focus:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-sm max-h-32"
            />
            <button
              type="button"
              onClick={sendMessage}
              disabled={isStreaming || (!input.trim() && !imageBase64)}
              className="flex-shrink-0 w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white flex items-center justify-center shadow-md shadow-violet-500/30 hover:scale-105 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100"
              title="Odeslat"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-center">
            Odpovědi generuje AI – ověřte testerem.
          </p>
        </div>
      </div>

      {/* NÁVRHOVÉ ŠABLONY + GALERIE */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <section className="lg:col-span-2 glass-card p-4 sm:p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm">
              Rychlé dotazy
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {SUGGESTIONS.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.text}
                  type="button"
                  onClick={() => setInput(s.text)}
                  className="text-left p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 hover:border-violet-300 dark:hover:border-violet-600 hover:bg-violet-50/40 dark:hover:bg-violet-950/40 transition-colors group"
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 mt-0.5 ${s.color}`} />
                    <span className="text-sm text-slate-700 dark:text-slate-200 leading-snug">
                      {s.text}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="glass-card p-4 sm:p-5" ref={galleryRef}>
          <div className="flex items-center gap-2 mb-3">
            <Camera className="w-4 h-4 text-pool-600 dark:text-pool-400" />
            <h3 className="font-bold text-slate-900 dark:text-slate-50 text-sm">
              Galerie fotek
            </h3>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              ({imageMessages.length})
            </span>
          </div>
          {imageMessages.length === 0 ? (
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Přiložené fotky se ukážou tady. Můžeš jich poslat víc a
              porovnat je s AI.
            </p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {imageMessages.map((m) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={m.id}
                  src={m.imageDataUrl}
                  alt="Přiložená fotka"
                  className="w-full aspect-square object-cover rounded-lg border border-slate-200 dark:border-slate-700"
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[88%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white rounded-br-md"
            : "bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-bl-md shadow-sm"
        }`}
      >
        {message.imageDataUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={message.imageDataUrl}
            alt="Přiložený obrázek"
            className="rounded-lg mb-2 max-h-64 object-cover"
          />
        )}
        {message.content && (
          <div className="whitespace-pre-wrap">{message.content}</div>
        )}
      </div>
    </div>
  );
}

function makeId(): string {
  return `m_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 7)}`;
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(new Error("Nelze přečíst soubor."));
    r.readAsDataURL(file);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Nelze načíst obrázek."));
    img.src = src;
  });
}

async function resizeImage(
  img: HTMLImageElement,
  maxDim: number,
  mimeType: string
): Promise<{ dataUrl: string; mimeType: string }> {
  const { naturalWidth: w, naturalHeight: h } = img;
  if (w <= maxDim && h <= maxDim && mimeType !== "image/heic") {
    return { dataUrl: img.src, mimeType: mimeType || "image/jpeg" };
  }
  const scale = Math.min(maxDim / w, maxDim / h, 1);
  const nw = Math.round(w * scale);
  const nh = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = nw;
  canvas.height = nh;
  const ctx = canvas.getContext("2d");
  if (!ctx) return { dataUrl: img.src, mimeType: mimeType || "image/jpeg" };
  ctx.drawImage(img, 0, 0, nw, nh);
  const outMime =
    mimeType === "image/heic" ? "image/jpeg" : mimeType || "image/jpeg";
  const dataUrl = canvas.toDataURL(outMime, 0.85);
  return { dataUrl, mimeType: outMime };
}

function buildHistorySummary(records: HistoryRecord[]): string {
  if (records.length === 0) return "";
  const last = records.slice(-5);
  return last
    .map(
      (r) =>
        `  ${new Date(r.timestamp).toLocaleString("cs-CZ")} – ${r.summary} (${r.status})`
    )
    .join("\n");
}