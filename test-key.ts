const key = process.env.GEMINI_API_KEY;
if (!key) {
  console.log("❌ No hay clave");
  process.exit(1);
}

console.log("Longitud:", key.length);

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
const res = await fetch(url);
const data = await res.json();

if (res.ok) {
  console.log("✅ Clave válida. Modelos disponibles:", data.models?.length);
  console.log("Primer modelo:", data.models?.[0]?.name);
} else {
  console.log("❌ Clave inválida:", data.error?.message);
}