// src/tools/saveProvider.ts
// Guarda y consulta proveedores en memoria (para el reto; en producción sería una BD).

export interface Provider {
  razonSocial: string;
  nit: string;
  email: string;
  telefono: string;
  direccion: string;
  representanteLegal: string;
  tipoPersona: "natural" | "juridica";
  creadoEn: string;
}

const providers = new Map<string, Provider>();

export type SaveResult =
  | { ok: true; provider: Provider }
  | { ok: false; error: string };

export function saveProvider(data: Omit<Provider, "creadoEn">): SaveResult {
  if (providers.has(data.nit)) {
    return { ok: false, error: `Ya existe un proveedor con NIT ${data.nit}.` };
  }

  const provider: Provider = {
    ...data,
    creadoEn: new Date().toISOString(),
  };

  providers.set(provider.nit, provider);
  return { ok: true, provider };
}

export function getProviderStatus(nit: string):
  | { existe: true; provider: Provider }
  | { existe: false } {
  const p = providers.get(nit);
  if (!p) return { existe: false };
  return { existe: true, provider: p };
}

export function listProviders(): Provider[] {
  return Array.from(providers.values());
}

export function resetProviders(): void {
  providers.clear();
}