// src/tools/validateField.ts
// Valida un campo individual del formulario de proveedor.

export type FieldName =
  | "razonSocial"
  | "nit"
  | "email"
  | "telefono"
  | "direccion"
  | "representanteLegal"
  | "tipoPersona";

export type ValidationResult =
  | { ok: true }
  | { ok: false; error: string };

export function validateField(field: FieldName, value: string): ValidationResult {
  const v = (value ?? "").trim();

  switch (field) {
    case "razonSocial":
      if (v.length < 3) return { ok: false, error: "La razón social debe tener al menos 3 caracteres." };
      if (v.length > 100) return { ok: false, error: "La razón social no puede superar 100 caracteres." };
      return { ok: true };

    case "nit":
      if (!/^\d{9,10}$/.test(v)) return { ok: false, error: "El NIT debe tener 9 o 10 dígitos numéricos." };
      return { ok: true };

    case "email":
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return { ok: false, error: "El correo no tiene un formato válido." };
      return { ok: true };

    case "telefono":
      if (!/^\d{7,10}$/.test(v)) return { ok: false, error: "El teléfono debe tener entre 7 y 10 dígitos." };
      return { ok: true };

    case "direccion":
      if (v.length < 5) return { ok: false, error: "La dirección debe tener al menos 5 caracteres." };
      return { ok: true };

    case "representanteLegal":
      if (v.length < 3) return { ok: false, error: "El nombre del representante legal debe tener al menos 3 caracteres." };
      if (v.length > 100) return { ok: false, error: "El nombre del representante legal no puede superar 100 caracteres." };
      return { ok: true };

    case "tipoPersona":
      if (v !== "natural" && v !== "juridica") {
        return { ok: false, error: 'El tipo de persona debe ser "natural" o "juridica".' };
      }
      return { ok: true };

    default:
      return { ok: false, error: `Campo desconocido: ${field}` };
  }
}