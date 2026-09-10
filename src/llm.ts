// src/llm.ts
// Capa de comunicación con Gemini. Oculta los detalles del SDK.

import { GoogleGenAI } from "@google/genai";
import { toolDeclarations } from "./tools/index";

const MODEL = "gemini-3.5-flash-lite";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

// --- Tipos ---

export type ChatRole = "user" | "model";

export interface ChatMessage {
  role: ChatRole;
  text: string;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
}

export interface LLMResponse {
  text: string;
  toolCalls: ToolCall[];
}

// --- Utilidad: dormir N milisegundos ---

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// --- Wrapper con reintentos automáticos ---

async function callWithRetry<T>(
  fn: () => Promise<T>,
  maxRetries = 5
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;

      const status = err?.status ?? err?.code;
      const isRetryable = status === 429 || status === 503 || status === 500;

      if (!isRetryable || attempt === maxRetries) {
        throw err;
      }

      // Extraemos el delay sugerido por Google si viene en el error.
      let delayMs = 5000; // por defecto 5 segundos
      try {
        const errBody = typeof err.message === "string" ? JSON.parse(err.message) : err;
        const retryDelay = errBody?.error?.details?.find(
          (d: any) => d["@type"]?.includes("RetryInfo")
        )?.retryDelay;

        if (retryDelay && typeof retryDelay === "string") {
          const seconds = parseFloat(retryDelay.replace("s", ""));
          if (!isNaN(seconds)) delayMs = Math.ceil(seconds * 1000) + 500;
        }
      } catch {
        // Si no podemos parsear, usamos el default
      }

      // Backoff exponencial con jitter
      delayMs = Math.max(delayMs, 2000 * Math.pow(1.5, attempt));
      const jitter = Math.random() * 1000;
      const totalDelay = Math.round(delayMs + jitter);

      console.log(
        `⏳ Límite de peticiones alcanzado. Reintentando en ${(totalDelay / 1000).toFixed(1)}s (intento ${attempt + 1}/${maxRetries})...`
      );

      await sleep(totalDelay);
    }
  }

  throw lastError;
}

// --- Función principal ---

export async function askLLM(
  history: ChatMessage[],
  systemPrompt: string,
  toolResults?: Array<{ name: string; result: unknown }>
): Promise<LLMResponse> {
  const contents = history.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  if (toolResults && toolResults.length > 0) {
    const parts = toolResults.map((r) => ({
      functionResponse: {
        name: r.name,
        response: { result: r.result },
      },
    }));
    contents.push({ role: "user", parts: parts as any });
  }

  const response = await callWithRetry(() =>
    ai.models.generateContent({
      model: MODEL,
      contents: contents as any,
      config: {
        systemInstruction: systemPrompt,
        tools: [{ functionDeclarations: toolDeclarations as any }],
      },
    })
  );

  let text = "";
  const toolCalls: ToolCall[] = [];

  const candidate = response.candidates?.[0];
  const parts = candidate?.content?.parts ?? [];

  for (const part of parts) {
    if (part.text) {
      text += part.text;
    }
    if (part.functionCall) {
      toolCalls.push({
        name: part.functionCall.name!,
        args: (part.functionCall.args ?? {}) as Record<string, unknown>,
      });
    }
  }

  return { text, toolCalls };
}