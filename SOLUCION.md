# SOLUCION.md

## 1. Descripción general

Agente conversacional que automatiza el llenado de formularios de registro
de proveedores. El usuario conversa en lenguaje natural y el agente:

1. Pide los datos paso a paso.
2. Valida cada campo con herramientas dedicadas.
3. Guarda al proveedor cuando todos los campos son válidos.

## 2. Arquitectura


Variable	Descripción
GEMINI_API_KEY	Clave de Gemini (AQ. o AIza). Nunca se sube al repo.
PORT (opcional)	Puerto del servidor. Por defecto 3000.
de proveedores. El usuario conversa en lenguaje natural y el agente:

1. Pide los datos paso a paso.
2. Valida cada campo con herramientas dedicadas.
3. Guarda al proveedor cuando todos los campos son válidos.


┌──────────────┐ POST /chat ┌──────────────┐
│ Frontend │ ───────────────▶ │ Backend │
│ (HTML/JS) │ │ (Bun.serve) │
│ │ ◀─────────────── │ │
└──────────────┘ JSON response └──────┬───────┘
│
▼
┌──────────────┐
│ Gemini │
│ 3.5 Flash │
└──────────────┘


### Componentes

- **Frontend** (`frontend/`): chat en HTML/CSS/JS plano, sin build.
- **Backend** (`src/server.ts`): servidor Bun con endpoints `/chat`,
  `/reset` y sirve los archivos estáticos.
- **Agente** (`src/agent/`): ciclo del agente en `loop.ts` y system
  prompt en `prompts.ts`.
- **Herramientas** (`src/tools/`): funciones puras que ejecutan la
  lógica de negocio.
- **LLM** (`src/llm.ts`): capa que encapsula Gemini con reintentos
  automáticos para el límite de peticiones.

## 3. Herramientas

| Herramienta | Descripción |
|---|---|
| `validateField(field, value)` | Valida un campo individual. Devuelve `{ok:true}` o `{ok:false, error}`. |
| `saveProvider(data)` | Guarda al proveedor. Falla si el NIT ya existe. |
| `getProviderStatus(nit)` | Consulta si un proveedor ya existe por NIT. |

## 4. Ciclo del agente

1. Llega un mensaje del usuario.
2. Se envía el historial + tools al LLM.
3. El LLM puede responder con texto o pedir una o más herramientas.
4. Si pide herramientas, se ejecutan y se le devuelve el resultado.
5. Se repite hasta que el LLM da una respuesta final (máx. 6 iteraciones).

## 5. IA utilizada

| Herramienta | Uso |
|---|---|
| Claude | Diseño de la arquitectura, redacción del system prompt, revisión de código. |
| ChatGPT / Gemini | Consultas puntuales de sintaxis de TypeScript y del SDK de Gemini. |

*(Ajusta esta tabla a las IA que realmente usaste.)*

## 6. Cómo correr el proyecto

```bash
# 1. Instalar dependencias
bun install

# 2. Configurar variables de entorno
# Crea .env con: GEMINI_API_KEY=tu_clave

# 3. Correr el demo sin LLM
bun run demo.ts

# 4. Levantar el servidor
bun run src/server.ts

# 5. Abrir http://localhost:3000


# 6. Link público

🚀 **Demo en vivo**: https://agente-proveedores.onrender.com
