// frontend/app.js
// Lógica del chat en el navegador.

const chatEl = document.getElementById("chat");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("sendBtn");
const resetBtn = document.getElementById("resetBtn");

// ID de sesión persistente en el navegador
const SESSION_ID =
  localStorage.getItem("sessionId") ??
  (() => {
    const id = crypto.randomUUID();
    localStorage.setItem("sessionId", id);
    return id;
  })();

let isSending = false;

function addMessage(text, role) {
  const div = document.createElement("div");
  div.className = `message ${role}`;
  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;
  div.appendChild(bubble);
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function showTyping() {
  const div = document.createElement("div");
  div.className = "message assistant";
  div.id = "typing-indicator";
  div.innerHTML =
    '<div class="bubble typing"><span></span><span></span><span></span></div>';
  chatEl.appendChild(div);
  chatEl.scrollTop = chatEl.scrollHeight;
}

function hideTyping() {
  document.getElementById("typing-indicator")?.remove();
}

async function sendMessage() {
  const text = inputEl.value.trim();
  if (!text || isSending) return;

  isSending = true;
  sendBtn.disabled = true;
  inputEl.value = "";
  inputEl.style.height = "auto";

  addMessage(text, "user");
  showTyping();

  try {
    const res = await fetch("/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: text, sessionId: SESSION_ID }),
    });

    const data = await res.json();
    hideTyping();

    if (!res.ok) {
      addMessage(
        `⚠️ Error: ${data.error || "No se pudo procesar el mensaje"}`,
        "assistant"
      );
    } else {
      addMessage(data.reply, "assistant");
    }
  } catch (err) {
    hideTyping();
    addMessage("⚠️ No se pudo conectar con el servidor.", "assistant");
    console.error(err);
  } finally {
    isSending = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

// Enviar con botón
sendBtn.addEventListener("click", sendMessage);

// Enviar con Enter (Shift+Enter hace salto de línea)
inputEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

// Autoajustar altura del textarea
inputEl.addEventListener("input", () => {
  inputEl.style.height = "auto";
  inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + "px";
});

// Reiniciar conversación
resetBtn.addEventListener("click", async () => {
  if (isSending) return;
  if (!confirm("¿Iniciar una nueva conversación?")) return;

  try {
    await fetch("/reset", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId: SESSION_ID }),
    });
  } catch (err) {
    console.error("Error al resetear:", err);
  }

  chatEl.innerHTML = `
    <div class="message assistant">
      <div class="bubble">
        ¡Hola de nuevo! 👋 Empecemos otra vez.
        <br><br>
        Dime la <strong>razón social</strong> y el <strong>NIT</strong>.
      </div>
    </div>`;

  inputEl.focus();
});

inputEl.focus();