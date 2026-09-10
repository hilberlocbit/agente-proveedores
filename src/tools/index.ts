// src/tools/index.ts
// Exporta todas las herramientas con su esquema (formato OpenAI/Gemini function calling).

export { validateField } from "./validateField";
export { saveProvider, getProviderStatus, listProviders, resetProviders } from "./saveProvider";
export type { FieldName, ValidationResult } from "./validateField";
export type { Provider, SaveResult } from "./saveProvider";

// Esquema de herramientas que el LLM verá.
// Formato: mismo que usa @google/genai para functionDeclarations.
export const toolDeclarations = [
  {
    name: "validateField",
    description:
      "Valida un campo individual del formulario de proveedor. Devuelve si el valor es válido o un mensaje de error.",
    parameters: {
      type: "object",
      properties: {
        field: {
          type: "string",
          description: "Nombre del campo a validar.",
          enum: [
            "razonSocial",
            "nit",
            "email",
            "telefono",
            "direccion",
            "representanteLegal",
            "tipoPersona",
          ],
        },
        value: {
          type: "string",
          description: "Valor a validar para el campo.",
        },
      },
      required: ["field", "value"],
    },
  },
  {
    name: "saveProvider",
    description:
      "Guarda definitivamente un proveedor cuando todos sus campos son válidos. Falla si ya existe un proveedor con ese NIT.",
    parameters: {
      type: "object",
      properties: {
        razonSocial: { type: "string" },
        nit: { type: "string" },
        email: { type: "string" },
        telefono: { type: "string" },
        direccion: { type: "string" },
        representanteLegal: { type: "string" },
        tipoPersona: { type: "string", enum: ["natural", "juridica"] },
      },
      required: [
        "razonSocial",
        "nit",
        "email",
        "telefono",
        "direccion",
        "representanteLegal",
        "tipoPersona",
      ],
    },
  },
  {
    name: "getProviderStatus",
    description: "Consulta si un proveedor ya existe en el sistema, buscándolo por NIT.",
    parameters: {
      type: "object",
      properties: {
        nit: { type: "string", description: "NIT del proveedor a consultar." },
      },
      required: ["nit"],
    },
  },
];