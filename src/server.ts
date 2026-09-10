// src/server.ts
// Servidor HTTP con Bun. Expone el agente vía /chat y sirve el frontend.

import { runAgent } from "./agent/loop";
import type { ChatMessage } from "./llm";

const PORT = Number(process.env.PORT ?? 3000);

// Sesiones en memoria. Cada navegador tiene su propia conversación.
const sessions = new Map<string, ChatMessage[]>();

function getSession(id: string): ChatMessage[] {
  if (!sessions.has(id)) sessions.set(id, []);
  return sessions.get(id)!;
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);

    // CORS para desarrollo
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    };

    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }

    // --- POST /chat ---
    if (url.pathname === "/chat" && req.method === "POST") {
      try {
        const body = (await req.json()) as {
          message?: string;
          sessionId?: string;
        };

        const message = (body.message ?? "").trim();
        const sessionId = body.sessionId ?? "default";

        if (!message) {
          return Response.json(
            { error: "Mensaje vacío" },
            { status: 400, headers: corsHeaders }
          );
        }

        const history = getSession(sessionId);
        history.push({ role: "user", text: message });

        const { history: updated, reply } = await runAgent(history);
        sessions.set(sessionId, updated);

        return Response.json(
          { reply },
          { headers: corsHeaders }
        );
      } catch (err: any) {
        console.error("Error en /chat:", err);
        return Response.json(
          { error: "Error procesando el mensaje", detail: String(err?.message ?? err) },
          { status: 500, headers: corsHeaders }
        );
      }
    }

    // --- POST /reset ---
    if (url.pathname === "/reset" && req.method === "POST") {
      try {
        const body = (await req.json()) as { sessionId?: string };
        const sessionId = body.sessionId ?? "default";
        sessions.delete(sessionId);
        return Response.json({ ok: true }, { headers: corsHeaders });
      } catch {
        return Response.json({ ok: true }, { headers: corsHeaders });
      }
    }

    // --- Archivos estáticos (frontend) ---
    if (url.pathname === "/" || url.pathname.startsWith("/static/")) {
      const filePath =
        url.pathname === "/"
          ? "frontend/index.html"
          : `frontend${url.pathname.replace("/static", "")}`;

      const file = Bun.file(filePath);
      if (await file.exists()) {
        return new Response(file);
      }
      return new Response("Archivo no encontrado", { status: 404 });
    }

    return new Response("Ruta no encontrada", { status: 404 });
  },
});

console.log(`\n🚀 Servidor corriendo en http://localhost:${PORT}\n`);