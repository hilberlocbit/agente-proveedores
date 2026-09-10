// src/agent/loop.ts
// Ciclo del agente: recibe mensaje, ejecuta herramientas, responde.

import { askLLM, type ChatMessage, type ToolCall } from "../llm";
import {
  validateField,
  saveProvider,
  getProviderStatus,
  type FieldName,
} from "../tools/index";
import { SYSTEM_PROMPT } from "./prompts";

const MAX_ITERATIONS = 6;

// Ejecuta una herramienta por nombre y devuelve su resultado.
function executeTool(call: ToolCall): unknown {
  switch (call.name) {
    case "validateField": {
      const field = call.args.field as FieldName;
      const value = String(call.args.value ?? "");
      return validateField(field, value);
    }
    case "saveProvider": {
      return saveProvider({
        razonSocial: String(call.args.razonSocial ?? ""),
        nit: String(call.args.nit ?? ""),
        email: String(call.args.email ?? ""),
        telefono: String(call.args.telefono ?? ""),
        direccion: String(call.args.direccion ?? ""),
        representanteLegal: String(call.args.representanteLegal ?? ""),
        tipoPersona: call.args.tipoPersona as "natural" | "juridica",
      });
    }
    case "getProviderStatus": {
      const nit = String(call.args.nit ?? "");
      return getProviderStatus(nit);
    }
    default:
      return { ok: false, error: `Herramienta desconocida: ${call.name}` };
  }
}

// Ciclo principal del agente.
// Recibe el historial completo y devuelve el historial actualizado + respuesta final.
export async function runAgent(
  history: ChatMessage[]
): Promise<{ history: ChatMessage[]; reply: string }> {
  let iterations = 0;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const res = await askLLM(history, SYSTEM_PROMPT);

    // Si el modelo no pidió herramientas, esa es la respuesta final.
    if (res.toolCalls.length === 0) {
      history.push({ role: "model", text: res.text });
      return { history, reply: res.text };
    }

    // El modelo pidió una o más herramientas. Las ejecutamos todas.
    const toolResults = res.toolCalls.map((call) => ({
      name: call.name,
      result: executeTool(call),
    }));

    // Guardamos el turno del modelo con texto vacío (o el que haya dado).
    history.push({ role: "model", text: res.text || "" });

    // Le devolvemos los resultados al modelo en el siguiente turno.
    const followup = await askLLM(history, SYSTEM_PROMPT, toolResults);

    // Si ya no pide más herramientas, terminamos.
    if (followup.toolCalls.length === 0) {
      history.push({ role: "model", text: followup.text });
      return { history, reply: followup.text };
    }

    // Si pidió más, las ejecutamos en la siguiente vuelta del while.
    // Para eso, hay que "empujar" los resultados al historial de forma que
    // askLLM los vea. Simplificamos: continuamos el while con los nuevos calls.
    // Reinyectamos el resultado como texto para no romper el flujo.
    for (const r of toolResults) {
      history.push({
        role: "user",
        text: `[resultado de ${r.name}]: ${JSON.stringify(r.result)}`,
      });
    }
  }

  const fallback = "Lo siento, no pude completar la solicitud. ¿Puedes intentarlo de nuevo?";
  history.push({ role: "model", text: fallback });
  return { history, reply: fallback };
}