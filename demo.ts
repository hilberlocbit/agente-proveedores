// demo.ts
// Ejecuta las herramientas del agente SIN LLM. Sirve para probar la Fase 1.

import {
  validateField,
  saveProvider,
  getProviderStatus,
  resetProviders,
  type FieldName,
} from "./src/tools/index";

console.log("=== DEMO: herramientas del agente (sin LLM) ===\n");

// --- 1) Validaciones individuales ---
console.log("--- 1) Validando campos individuales ---");

const pruebas: Array<[FieldName, string]> = [
  ["razonSocial", "Tech Solutions SAS"],
  ["nit", "900123456"],
  ["email", "contacto@techsolutions.com"],
  ["telefono", "3101234567"],
  ["direccion", "Calle 100 # 15-20, Bogotá"],
  ["representanteLegal", "Juan Pérez"],
  ["tipoPersona", "juridica"],

  // Casos malos a propósito
  ["email", "correo-malo"],
  ["nit", "123"],
  ["tipoPersona", "empresa"],
];

for (const [campo, valor] of pruebas) {
  const r = validateField(campo, valor);
  if (r.ok) {
    console.log(`  ✅ ${campo} = "${valor}"`);
  } else {
    console.log(`  ❌ ${campo} = "${valor}"  →  ${r.error}`);
  }
}

// --- 2) Guardar un proveedor válido ---
console.log("\n--- 2) Guardando proveedor válido ---");

const proveedor = {
  razonSocial: "Tech Solutions SAS",
  nit: "900123456",
  email: "contacto@techsolutions.com",
  telefono: "3101234567",
  direccion: "Calle 100 # 15-20, Bogotá",
  representanteLegal: "Juan Pérez",
  tipoPersona: "juridica" as const,
};

const guardado = saveProvider(proveedor);
if (guardado.ok) {
  console.log("  ✅ Guardado:", guardado.provider.razonSocial, "-", guardado.provider.nit);
} else {
  console.log("  ❌ Error:", guardado.error);
}

// --- 3) Intentar guardar duplicado ---
console.log("\n--- 3) Intentando guardar el mismo NIT otra vez ---");
const duplicado = saveProvider(proveedor);
if (duplicado.ok) {
  console.log("  ✅ Guardado (no debería pasar)");
} else {
  console.log("  ✅ Rechazado como se esperaba →", duplicado.error);
}

// --- 4) Consultar estado por NIT ---
console.log("\n--- 4) Consultando estado de un NIT ---");
const estado = getProviderStatus("900123456");
if (estado.existe) {
  console.log("  ✅ Existe:", estado.provider.razonSocial);
} else {
  console.log("  ⚠️  No existe.");
}

const estado2 = getProviderStatus("111111111");
console.log("  Consulta NIT inexistente →", estado2.existe ? "existe" : "no existe");

// --- 5) Reset final ---
resetProviders();
console.log("\n=== Demo finalizada ===");