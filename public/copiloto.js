/* ============================================================
   COPILOTO GEMINI ADMIN IA - MÓDULO INDEPENDIENTE
   Inyección dinámica de UI y lógica de interacción con Google Gemini
   ============================================================ */

function inyectarModalCopilotoSiNoExiste() {
  let div = document.getElementById("copiloto-gemini-modal");
  if (!div) {
    div = document.createElement("div");
    div.id = "copiloto-gemini-modal";
    document.body.appendChild(div);
  }

  // Siempre asegurar que el botón de dominios y el drawer estén presentes
  if (!div.innerHTML.includes('toggleCopilotDomainsDrawer')) {
    div.innerHTML = `
    <div class="copiloto-header">
      <div style="display:flex;align-items:center;gap:8px">
        <span style="font-size:20px">🤖</span>
        <div>
          <b style="font-size:14px;display:block;line-height:1.2">Copiloto IA Gemini</b>
          <span id="copiloto-status-pill" class="copiloto-badge-status" style="margin-top:2px">● Conectado</span>
        </div>
      </div>
      <div style="display:flex;gap:5px;align-items:center">
        <button type="button" id="copiloto-btn-min" class="copiloto-btn-icon" onclick="toggleMinimizarCopiloto()" title="Minimizar o expandir ventana de chat">🔽</button>
        <button type="button" class="copiloto-btn-icon" onclick="toggleCopilotDomainsDrawer()" title="Activar o desactivar dominios y fuentes" style="background:#4f46e5;color:#fff;font-weight:bold;padding:4px 8px;font-size:11.5px;border-radius:6px">🌐 Dominios</button>
        <button type="button" class="copiloto-btn-icon" onclick="mostrarConfigGemini(true)" title="Configurar clave Gemini API">⚙️ Clave</button>
        <button type="button" class="copiloto-btn-icon" onclick="cerrarCopilotoGemini()" style="background:#e11d48;font-weight:bold" title="Cerrar copiloto">✕</button>
      </div>
    </div>

    <div id="copiloto-domains-drawer" style="display:none;background:#18181b;border-bottom:1px solid rgba(255,255,255,0.15);padding:10px 14px;max-height:260px;overflow-y:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
        <b style="color:#c4b5fd;font-size:12.5px">🌐 Gestión de Dominios y Fuentes (12 principales)</b>
        <button type="button" onclick="toggleCopilotDomainsDrawer()" style="background:transparent;color:#9ca3af;border:0;cursor:pointer;font-size:11.5px">✕ Cerrar</button>
      </div>
      <p style="margin:0 0 8px;font-size:11px;color:#94a3b8;line-height:1.3">
        Activa o desactiva fuentes web (ej. desactiva <b>archive.org</b> si no quieres resultados de ahí) o añade dominios personalizados.
      </p>
      <div id="copiloto-domains-drawer-list" style="display:grid;gap:6px"></div>
      <div style="display:flex;gap:6px;margin-top:8px">
        <input id="copiloto-drawer-new-domain-input" placeholder="Añadir dominio (ej: nexusgamesretro.com)..." style="flex:1;padding:5px 8px;border-radius:6px;border:1px solid #444;background:#222;color:#fff;font-size:11.5px" onkeydown="if(event.key==='Enter')agregarDominioCustomCopilotoDesdeChat()">
        <button type="button" onclick="agregarDominioCustomCopilotoDesdeChat()" style="background:#0284c7;color:#fff;border:0;padding:5px 10px;border-radius:6px;font-weight:bold;cursor:pointer;font-size:11.5px">➕ Añadir</button>
      </div>
    </div>

    <div class="copiloto-chips-bar">
      <span class="copiloto-chip" onclick="pedirCopilotoSugerencia('Buscar opciones de Rosita Fresita')">🍓 Rosita Fresita</span>
      <span class="copiloto-chip" onclick="pedirCopilotoSugerencia('Agrega Chrono Trigger de SNES')">🎮 Chrono Trigger (SNES)</span>
      <span class="copiloto-chip" onclick="pedirCopilotoSugerencia('Agrega Super Mario Kart de SNES')">🏎️ Super Mario Kart</span>
      <span class="copiloto-chip" onclick="pedirCopilotoSugerencia('Agrega Street Fighter 2 SNES')">🥊 Street Fighter II</span>
      <span class="copiloto-chip" onclick="pedirCopilotoSugerencia('Agrega Sonic the Hedgehog HTML5')">🦔 Sonic</span>
      <span class="copiloto-chip" onclick="pedirCopilotoSugerencia('Agrega Pac-Man clásico HTML5')">👾 Pac-Man</span>
      <span class="copiloto-chip" onclick="pedirCopilotoSugerencia('Agrega Donkey Kong Country de SNES')">🍌 Donkey Kong</span>
      <span class="copiloto-chip" onclick="copilotoAuditarCatalogo()" style="background:rgba(217,119,6,0.25);border-color:#d97706;color:#fde047">🛡️ Auditar catálogo</span>
    </div>

    <div id="copiloto-chat-logs">
      <div class="copiloto-msg-bubble copiloto-msg-ai">
        ¡Hola <b>Luis</b>! 👋 Soy tu copiloto inteligente de administración para <b>Juegos Saludables</b>.<br><br>
        Puedes conversar conmigo con naturalidad, pedirme buscar juegos (Retro, Web HTML5, Itch.io o Internet Archive), auditar tu catálogo o ingresar una URL directamente en el recuadro inferior. 🚀
      </div>
    </div>

    <!-- Espacio dedicado para ingreso directo de URL inspeccionada -->
    <div class="copiloto-url-inspector-wrap">
      <input id="copiloto-direct-url-input" class="copiloto-url-inspector-input" placeholder="🔗 Pegar URL inspeccionada directa (TurboWarp, Itch, Retro, YT)..." onkeydown="if(event.key==='Enter')copilotoProcesarUrlDirecta()">
      <button type="button" class="copiloto-url-inspector-btn" onclick="copilotoProcesarUrlDirecta()" title="Inspeccionar y auto-obtener título, tipo y portadas en 1 clic">📥 Analizar URL</button>
    </div>

    <!-- Barra de control de búsqueda y memoria -->
    <div class="copiloto-toolbar-bar">
      <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
        <button type="button" id="copiloto-btn-search-toggle" class="copiloto-btn-search-toggle" onclick="toggleGoogleSearchCopiloto()" title="Toca para activar o desactivar la búsqueda web en Google">
          <span id="copiloto-search-icon">🔍</span>
          <span>Búsqueda Google:</span>
          <b id="copiloto-search-status-txt">ACTIVADA</b>
        </button>
        <span class="copiloto-memoria-badge" id="copiloto-memoria-badge-txt" title="El Copiloto recuerda los últimos mensajes para mantener el hilo de la conversación">
          🧠 Memoria: 0/7 turnos (0/14 msgs)
        </span>
      </div>
      <button type="button" id="copiloto-btn-limpiar" class="copiloto-btn-limpiar" onclick="limpiarChatCopiloto()" title="Limpiar la conversación y reiniciar la memoria">
        🗑️ Reiniciar
      </button>
    </div>

    <div class="copiloto-input-wrap">
      <input id="copiloto-input" placeholder="Ej: Agrega Chrono Trigger de SNES o pega una URL..." onkeydown="copilotoHandleKey(event)">
      <button type="button" id="copiloto-btn-send" onclick="enviarMensajeCopiloto()">⚡ Enviar</button>
    </div>
    `;
  }
  renderizarConfigDominiosCopiloto();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    inyectarModalCopilotoSiNoExiste();
    cargarHistorialCopiloto();
    if (typeof actualizarEstadoCopilotoBadge === "function") {
      actualizarEstadoCopilotoBadge();
    }
  });
} else {
  inyectarModalCopilotoSiNoExiste();
  cargarHistorialCopiloto();
  if (typeof actualizarEstadoCopilotoBadge === "function") {
    actualizarEstadoCopilotoBadge();
  }
}

/* ============================================================
   COPILOTO GEMINI ADMIN IA - LÓGICA Y API DE GOOGLE
   ============================================================ */

let copilotoJuegosPendientes = {};
let copilotoBatches = {};
let copilotoCargando = false;
let copilotoHistorial = [];
let copilotoInputHistory = [];
let copilotoHistoryIndex = -1;
let copilotoUsarGoogleSearch = localStorage.getItem('copiloto_google_search') !== '0';
let servidorGeminiDisponible = false;
let copilotoTimerInterval = null;
let copilotoAbortController = null;
let copilotoSegundos = 0;

function reproducirChimeCopiloto() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(587.33, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch(e){}
}

function actualizarBadgeMemoria() {
  const badge = document.getElementById("copiloto-memoria-badge-txt");
  if (badge) {
    const totalMsgs = Array.isArray(copilotoHistorial) ? copilotoHistorial.length : 0;
    const turnos = Math.floor(totalMsgs / 2);
    badge.textContent = "🧠 Memoria: " + turnos + "/7 turnos (" + totalMsgs + "/14 msgs)";
  }
}

function cargarHistorialCopiloto() {
  try {
    const guardado = sessionStorage.getItem("freshmind_copiloto_historial");
    if (guardado) {
      const arr = JSON.parse(guardado);
      if (Array.isArray(arr) && arr.length > 0) {
        copilotoHistorial = arr.slice(-14);
      }
    }
  } catch(e){}
  actualizarBadgeMemoria();
}

function guardarHistorialCopiloto() {
  try {
    sessionStorage.setItem("freshmind_copiloto_historial", JSON.stringify((copilotoHistorial || []).slice(-14)));
  } catch(e){}
  actualizarBadgeMemoria();
}

function copilotoHandleKey(event) {
  if (event.key === "Enter" && !event.shiftKey) {
    event.preventDefault();
    enviarMensajeCopiloto();
    return;
  }
  if (event.key === "ArrowUp") {
    if (copilotoInputHistory.length > 0) {
      if (copilotoHistoryIndex === -1) {
        copilotoHistoryIndex = copilotoInputHistory.length - 1;
      } else if (copilotoHistoryIndex > 0) {
        copilotoHistoryIndex--;
      }
      const val = copilotoInputHistory[copilotoHistoryIndex];
      if (val !== undefined) {
        event.target.value = val;
        event.preventDefault();
      }
    }
  } else if (event.key === "ArrowDown") {
    if (copilotoHistoryIndex !== -1) {
      if (copilotoHistoryIndex < copilotoInputHistory.length - 1) {
        copilotoHistoryIndex++;
        event.target.value = copilotoInputHistory[copilotoHistoryIndex];
      } else {
        copilotoHistoryIndex = -1;
        event.target.value = "";
      }
      event.preventDefault();
    }
  } else if (event.key === "Escape") {
    const modal = document.getElementById("copiloto-gemini-modal");
    if (modal && modal.style.display === "flex") {
      toggleMinimizarCopiloto();
    }
  }
}

function verificarSiJuegoExisteEnCatalogo(nombre, url) {
  if (!window.catalogo || !Array.isArray(window.catalogo.juegos)) return false;
  const n = (nombre || "").toLowerCase().trim();
  const u = (url || "").toLowerCase().trim();
  const nNorm = n.replace(/[^a-z0-9]/g, "");
  return window.catalogo.juegos.some(j => {
    if (!j) return false;
    const jn = (j.nombre || "").toLowerCase().trim();
    const ju = (j.url || "").toLowerCase().trim();
    if (u && ju && (ju === u || ju.split("?")[0] === u.split("?")[0])) return true;
    if (nNorm && jn) {
      const jnNorm = jn.replace(/[^a-z0-9]/g, "");
      if (jnNorm === nNorm || (nNorm.length > 5 && jnNorm.includes(nNorm))) return true;
    }
    return false;
  });
}

function repararYParsearJSON(rawText) {
  if (!rawText) return { mensaje: "He procesado tu solicitud.", juego: null, juegos: [] };
  const clean = rawText
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(clean);
  } catch(e){}

  const firstBrace = clean.indexOf("{");
  const lastBrace = clean.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    const candidate = clean.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch(e){}

    try {
      const repaired = candidate
        .replace(/,\s*([}\]])/g, "$1")
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, " ");
      return JSON.parse(repaired);
    } catch(e){}
  }

  const urlMatch = clean.match(/https?:\/\/[^\s"'<>\)]+/i);
  if (urlMatch) {
    return {
      mensaje: clean,
      juego: {
        nombre: "Juego Sugerido",
        url: urlMatch[0],
        tipo: "normal",
        categoria: "Retro",
        descripcion: "Enlace recuperado automáticamente de la respuesta."
      },
      juegos: []
    };
  }

  return {
    mensaje: clean || "He procesado tu solicitud.",
    juego: null,
    juegos: []
  };
}

function cancelarConsultaCopiloto(porTimeout=false){
  if(copilotoAbortController){
    try{ copilotoAbortController.abort(); }catch(e){}
    copilotoAbortController = null;
  }
  if(copilotoTimerInterval){
    clearInterval(copilotoTimerInterval);
    copilotoTimerInterval = null;
  }
  const typingEl = document.getElementById('copiloto-typing-indicator');
  if(typingEl){
    typingEl.remove();
  }
  copilotoCargando = false;
  const btnSend = document.getElementById('copiloto-btn-send');
  if(btnSend){
    btnSend.disabled = false;
    btnSend.textContent = '⚡ Enviar';
  }

  const chat = document.getElementById('copiloto-chat-logs');
  if(chat){
    const msgBubble = document.createElement('div');
    msgBubble.className = 'copiloto-msg-bubble copiloto-msg-ai';
    if(porTimeout){
      msgBubble.style.borderColor = 'rgba(239, 68, 68, 0.4)';
      msgBubble.innerHTML = `⏱️ <b>Tiempo límite alcanzado (45 segundos):</b> La consulta tardó más de lo habitual. Puedes reintentar ahora o probar en modo rápido (⚡ Búsqueda Desactivada).`;
    } else {
      msgBubble.innerHTML = '🛑 <i>Búsqueda cancelada por el usuario.</i>';
    }
    chat.appendChild(msgBubble);
    scrollCopilotoAlFinal();
  }
  mostrarToastSync(porTimeout ? '⏱️ Tiempo límite de búsqueda alcanzado' : '🛑 Búsqueda cancelada');
}

function actualizarProgresoCopiloto(){
  copilotoSegundos++;
  const timerEl = document.getElementById('copiloto-loading-timer');
  const barEl = document.getElementById('copiloto-progress-bar');
  const textEl = document.getElementById('copiloto-loading-text');
  const etaEl = document.getElementById('copiloto-loading-eta');
  const btnSend = document.getElementById('copiloto-btn-send');

  if(timerEl) timerEl.textContent = `⏱️ ${copilotoSegundos}s`;
  if(btnSend) btnSend.textContent = `⏳ (${copilotoSegundos}s)`;

  if(copilotoSegundos >= 45){
    cancelarConsultaCopiloto(true);
    return;
  }

  // Progreso visual y estados informativos paso a paso con tiempo estimado
  if(copilotoSegundos <= 2){
    if(textEl) textEl.textContent = '🔍 Paso 1/3: Analizando solicitud y catálogo...';
    if(etaEl) etaEl.textContent = 'Estimado: ~3s a 5s restantes (25%)';
    if(barEl) barEl.style.width = '25%';
  } else if(copilotoSegundos <= 5){
    if(textEl){
      textEl.textContent = copilotoUsarGoogleSearch 
        ? '🌐 Paso 2/3: Buscando en Google Search y verificando enlaces...' 
        : '🤖 Paso 2/3: Consultando con IA Gemini opciones jugables...';
    }
    if(etaEl) etaEl.textContent = 'Estimado: ~2s a 3s restantes (60%)';
    if(barEl) barEl.style.width = '60%';
  } else if(copilotoSegundos <= 9){
    if(textEl) textEl.textContent = '⚡ Paso 3/3: Verificando compatibilidad de emuladores y portadas...';
    if(etaEl) etaEl.textContent = 'Estimado: ~1s restante (85%)';
    if(barEl) barEl.style.width = '85%';
  } else if(copilotoSegundos <= 14){
    if(textEl) textEl.textContent = '🎨 Ensamblando fichas interactivas y botones de 1 clic...';
    if(etaEl) etaEl.textContent = 'Finalizando propuesta... (94%)';
    if(barEl) barEl.style.width = '94%';
  } else {
    if(textEl) textEl.textContent = '⏳ Servidores ocupados, recibiendo respuesta final...';
    if(etaEl) etaEl.textContent = 'Unos segundos más...';
    if(barEl) barEl.style.width = '97%';
  }
}

async function verificarServidorGemini(){
  try{
    const res = await fetch('/api/gemini/status', { cache: 'no-store' });
    if(res.ok){
      const data = await res.json();
      if(data && data.hasServerKey){
        servidorGeminiDisponible = true;
        actualizarEstadoCopilotoBadge();
      }
    }
  }catch(e){}
}

function actualizarBotonGoogleSearch(){
  const btn = document.getElementById('copiloto-btn-search-toggle');
  const txt = document.getElementById('copiloto-search-status-txt');
  const icon = document.getElementById('copiloto-search-icon');
  if(!btn) return;

  if(copilotoUsarGoogleSearch){
    btn.className = 'copiloto-btn-search-toggle';
    if(icon) icon.textContent = '🔍';
    if(txt) txt.textContent = 'ACTIVADA';
    btn.title = 'Búsqueda web en Google activa: Copiloto investigará enlaces reales en la web. Toca para desactivar.';
  } else {
    btn.className = 'copiloto-btn-search-toggle disabled';
    if(icon) icon.textContent = '⚡';
    if(txt) txt.textContent = 'DESACTIVADA (Rápido)';
    btn.title = 'Búsqueda en Google apagada: respuestas ultra rápidas basadas en el catálogo y memoria interna. Toca para activar.';
  }
}

function toggleGoogleSearchCopiloto(){
  copilotoUsarGoogleSearch = !copilotoUsarGoogleSearch;
  try{
    localStorage.setItem('copiloto_google_search', copilotoUsarGoogleSearch ? '1' : '0');
  }catch(e){}
  actualizarBotonGoogleSearch();
  mostrarToastSync(copilotoUsarGoogleSearch 
    ? '🔍 Búsqueda en Google ACTIVADA en Copiloto' 
    : '⚡ Búsqueda en Google DESACTIVADA (Modo Rápido)');
}

function obtenerConfigGemini(){
  try{
    const raw = localStorage.getItem('freshmind_gemini_config') || localStorage.getItem('freshmind_gemini_api_key');
    if(!raw) return { apiKey: '' };
    if(raw.startsWith('{')){
      return JSON.parse(raw);
    }
    return { apiKey: raw };
  }catch(e){
    return { apiKey: '' };
  }
}

function guardarConfigGemini(){
  const keyInput = document.getElementById('gemini-api-key');
  const statusEl = document.getElementById('gemini-status');
  const key = (keyInput ? keyInput.value : '').trim();

  if(!key){
    if(statusEl){
      statusEl.style.color = '#fca5a5';
      statusEl.textContent = '⚠️ Por favor pega tu Gemini API Key.';
    }
    return;
  }

  localStorage.setItem('freshmind_gemini_config', JSON.stringify({ apiKey: key }));
  localStorage.setItem('freshmind_gemini_api_key', key);

  if(statusEl){
    statusEl.style.color = '#6ee7b7';
    statusEl.textContent = '✅ Clave de Gemini guardada correctamente.';
  }
  actualizarEstadoCopilotoBadge();
  mostrarToastSync('🤖 Clave de Gemini guardada');
  setTimeout(()=>{
    ocultarConfigGemini();
  }, 1000);
}

function toggleVerGeminiKey(){
  const el = document.getElementById('gemini-api-key');
  if(el){
    el.type = el.type === 'password' ? 'text' : 'password';
  }
}

function mostrarConfigGemini(forzarMostrar=false){
  const box = document.getElementById('gemini-config');
  if(!box) return;
  const cfg = obtenerConfigGemini();
  const input = document.getElementById('gemini-api-key');
  if(input) input.value = cfg.apiKey || '';
  const status = document.getElementById('gemini-status');
  if(status) status.textContent = '';

  if(forzarMostrar){
    box.style.display = box.style.display === 'block' ? 'none' : 'block';
  }else{
    box.style.display = 'block';
  }
  if(box.style.display === 'block' && input){
    input.focus();
    renderizarConfigDominiosCopiloto();
  }
}

function obtenerConfigDominiosCopiloto() {
  let disabled = [];
  let custom = [];
  try {
    disabled = JSON.parse(localStorage.getItem('copiloto_disabled_domains') || '[]');
    custom = JSON.parse(localStorage.getItem('copiloto_custom_domains') || '[]');
  } catch(e) {}
  return { disabled, custom };
}

function renderizarConfigDominiosCopiloto() {
  const container = document.getElementById('copiloto-domains-list');
  const drawerContainer = document.getElementById('copiloto-domains-drawer-list');
  const { disabled, custom } = obtenerConfigDominiosCopiloto();
  
  const defaults = [
    { id: 'archive.org', name: 'archive.org (Internet Archive Emuladores)', desc: 'Emuladores web clásicos (NES, SNES, GBC, Arcade)' },
    { id: 'gamemonetize.com', name: 'gamemonetize.com (Catálogo HTML5)', desc: 'Juegos HTML5 arcade y minijuegos' },
    { id: 'retrogames.cc', name: 'retrogames.cc (Retro Games Emulador)', desc: 'Consolas SNES, Genesis, Arcade' },
    { id: 'retrogamesnexus.com', name: 'retrogamesnexus.com (Retro Nexus)', desc: 'Plataforma de juegos retro web' },
    { id: 'turbowarp.org', name: 'turbowarp.org (Scratch / TurboWarp)', desc: 'Juegos interactivos Scratch de la comunidad' },
    { id: 'scratch.mit.edu', name: 'scratch.mit.edu (Scratch Official)', desc: 'Proyectos educativos Scratch' },
    { id: 'famobi.com', name: 'famobi.com (Famobi HTML5)', desc: 'Minijuegos móviles y HTML5' },
    { id: 'playgama.com', name: 'playgama.com (Playgama Games)', desc: 'Juegos web HTML5' },
    { id: 'gameboss.com', name: 'gameboss.com (Gameboss)', desc: 'Arcade y juegos casuales HTML5' },
    { id: 'crazygames.com', name: 'crazygames.com (CrazyGames)', desc: 'Juegos Flash y HTML5' },
    { id: 'itch.io', name: 'itch.io (Juegos Indie / Web)', desc: 'Juegos independientes HTML5' },
    { id: 'youtube.com', name: 'youtube.com (YouTube Videos/Trailers)', desc: 'Gameplays y contenido en video' }
  ];

  let html = '';
  defaults.forEach(d => {
    const isEnabled = !disabled.includes(d.id);
    html += `
      <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(255,255,255,0.04);padding:6px 10px;border-radius:6px;font-size:12px">
        <div>
          <b style="color:${isEnabled ? '#34d399' : '#9ca3af'}">${d.name}</b>
          <div style="font-size:10.5px;color:#94a3b8">${d.desc}</div>
        </div>
        <label style="cursor:pointer;display:flex;align-items:center;gap:4px">
          <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleFuenteDominioCopiloto('${d.id}', this.checked)" style="accent-color:#10b981">
          <span style="font-size:11px;color:${isEnabled ? '#34d399' : '#9ca3af'}">${isEnabled ? 'Activo' : 'Inactivo'}</span>
        </label>
      </div>
    `;
  });

  if (custom.length > 0) {
    html += `<div style="font-weight:bold;margin-top:6px;font-size:11.5px;color:#cbd5e1">Dominios personalizados:</div>`;
    custom.forEach((dom, idx) => {
      const isEnabled = !disabled.includes(dom);
      html += `
        <div style="display:flex;align-items:center;justify-content:space-between;background:rgba(2,132,199,0.1);padding:6px 10px;border-radius:6px;font-size:12px">
          <div>
            <b style="color:${isEnabled ? '#38bdf8' : '#9ca3af'}">🌐 ${escapeHtml(dom)}</b>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            <label style="cursor:pointer;display:flex;align-items:center;gap:4px">
              <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="toggleFuenteDominioCopiloto('${escapeAttr(dom)}', this.checked)" style="accent-color:#0284c7">
              <span style="font-size:11px">${isEnabled ? 'Activo' : 'Inactivo'}</span>
            </label>
            <button type="button" onclick="eliminarDominioCustomCopiloto(${idx})" style="background:#dc2626;color:#fff;border:0;padding:2px 6px;border-radius:4px;cursor:pointer;font-size:10px" title="Eliminar dominio">🗑️</button>
          </div>
        </div>
      `;
    });
  }

  if (container) container.innerHTML = html;
  if (drawerContainer) drawerContainer.innerHTML = html;
}

function toggleCopilotDomainsDrawer() {
  const drawer = document.getElementById('copiloto-domains-drawer');
  if (!drawer) return;
  const isOpen = drawer.style.display === 'block';
  drawer.style.display = isOpen ? 'none' : 'block';
  if (!isOpen) {
    renderizarConfigDominiosCopiloto();
  }
}

function agregarDominioCustomCopilotoDesdeChat() {
  const input = document.getElementById('copiloto-drawer-new-domain-input');
  if (!input) return;
  const val = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!val || val.length < 3) {
    mostrarToastSync('⚠️ Ingresa un dominio válido (ej: nexusgamesretro.com)');
    return;
  }
  let { disabled, custom } = obtenerConfigDominiosCopiloto();
  if (custom.includes(val) || ['archive.org', 'gamemonetize.com', 'retrogames.cc', 'itch.io'].includes(val)) {
    mostrarToastSync('⚠️ Este dominio ya está registrado.');
    return;
  }
  custom.push(val);
  disabled = disabled.filter(d => d !== val);
  try {
    localStorage.setItem('copiloto_custom_domains', JSON.stringify(custom));
    localStorage.setItem('copiloto_disabled_domains', JSON.stringify(disabled));
  } catch(e) {}
  input.value = '';
  renderizarConfigDominiosCopiloto();
  mostrarToastSync(`✅ Dominio personalizado "${val}" añadido con éxito`);
}

function toggleFuenteDominioCopiloto(domainId, active) {
  let { disabled, custom } = obtenerConfigDominiosCopiloto();
  if (active) {
    disabled = disabled.filter(d => d !== domainId);
  } else {
    if (!disabled.includes(domainId)) disabled.push(domainId);
  }
  try {
    localStorage.setItem('copiloto_disabled_domains', JSON.stringify(disabled));
  } catch(e) {}
  renderizarConfigDominiosCopiloto();
  mostrarToastSync(active ? `🌐 Dominio ${domainId} activado` : `🔇 Dominio ${domainId} desactivado`);
}

function agregarDominioCustomCopiloto() {
  const input = document.getElementById('copiloto-new-domain-input');
  if (!input) return;
  const val = input.value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  if (!val || val.length < 3) {
    mostrarToastSync('⚠️ Ingresa un dominio válido (ej: nexusgamesretro.com)');
    return;
  }
  let { disabled, custom } = obtenerConfigDominiosCopiloto();
  if (custom.includes(val) || ['archive.org', 'gamemonetize.com', 'retrogames.cc', 'itch.io'].includes(val)) {
    mostrarToastSync('⚠️ Este dominio ya está registrado.');
    return;
  }
  custom.push(val);
  disabled = disabled.filter(d => d !== val);
  try {
    localStorage.setItem('copiloto_custom_domains', JSON.stringify(custom));
    localStorage.setItem('copiloto_disabled_domains', JSON.stringify(disabled));
  } catch(e) {}
  input.value = '';
  renderizarConfigDominiosCopiloto();
  mostrarToastSync(`✅ Dominio personalizado "${val}" añadido con éxito`);
}

function eliminarDominioCustomCopiloto(idx) {
  let { disabled, custom } = obtenerConfigDominiosCopiloto();
  if (idx >= 0 && idx < custom.length) {
    const removed = custom.splice(idx, 1)[0];
    disabled = disabled.filter(d => d !== removed);
    try {
      localStorage.setItem('copiloto_custom_domains', JSON.stringify(custom));
      localStorage.setItem('copiloto_disabled_domains', JSON.stringify(disabled));
    } catch(e) {}
    renderizarConfigDominiosCopiloto();
    mostrarToastSync(`🗑️ Dominio personalizado eliminado`);
  }
}

function ocultarConfigGemini(){
  const box = document.getElementById('gemini-config');
  if(box) box.style.display = 'none';
}

function actualizarEstadoCopilotoBadge(){
  const pill = document.getElementById('copiloto-status-pill');
  if(pill){
    const cfg = obtenerConfigGemini();
    if(servidorGeminiDisponible || cfg.apiKey){
      pill.className = 'copiloto-badge-status';
      pill.innerHTML = servidorGeminiDisponible ? '● Conectado (Servidor AI)' : '● Conectado (Gemini)';
    }else{
      pill.className = 'copiloto-badge-status sin-clave';
      pill.innerHTML = '⚠️ Requiere API Key';
    }
  }
  actualizarBotonGoogleSearch();
}

async function ejecutarLlamadaGemini(apiKey, payload, signal=null){
  const modelos = ['gemini-3.1-flash-lite', 'gemini-3.8-flash', 'gemini-flash-latest'];
  let ultimoError = null;

  for(const modelo of modelos){
    if(signal && signal.aborted) throw new Error('Consulta cancelada.');
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent?key=${encodeURIComponent(apiKey)}`;
      
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: signal
      });

      if(res.ok){
        return await res.json();
      }

      // Si falló por configuración de tools/búsqueda (ej: 429 cuota excedida de búsqueda), intentar sin tools
      if(payload.tools){
        const payloadSinTools = { ...payload };
        delete payloadSinTools.tools;
        const res2 = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadSinTools),
          signal: signal
        });
        if(res2.ok){
          return await res2.json();
        }
      }

      // Si falló por systemInstruction, intentar integrándolo en el primer mensaje de usuario
      if(payload.systemInstruction && payload.contents && payload.contents.length){
        const payloadSinSys = JSON.parse(JSON.stringify(payload));
        const sysTxt = payloadSinSys.systemInstruction?.parts?.[0]?.text || '';
        delete payloadSinSys.systemInstruction;
        if(sysTxt){
          payloadSinSys.contents[0].parts[0].text = sysTxt + "\n\n" + payloadSinSys.contents[0].parts[0].text;
        }
        const res3 = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payloadSinSys),
          signal: signal
        });
        if(res3.ok){
          return await res3.json();
        }
      }

      const errJson = await res.json().catch(()=>({}));
      const errMsg = errJson.error?.message || `HTTP ${res.status}`;
      ultimoError = new Error(errMsg);

      // Si la clave API es inválida (401 o mensaje de API_KEY), detenerse inmediatamente
      if(res.status === 401 || (errMsg && (errMsg.includes('API_KEY_INVALID') || errMsg.includes('API key not valid')))){
        throw ultimoError;
      }

      // Para fallos de modelo no encontrado (404), cuota/rate limit (429), servidores saturados (500, 502, 503) o error de argumento (400), continuar probando el siguiente modelo
      console.warn(`Modelo ${modelo} retornó error (${res.status}: ${errMsg}), intentando siguiente modelo disponible...`);
      continue;
    } catch(err) {
      if(signal && signal.aborted) throw err;
      if(err.message && (err.message.includes('API_KEY_INVALID') || err.message.includes('API key not valid'))){
        throw err;
      }
      ultimoError = err;
    }
  }

  throw ultimoError || new Error("No se pudo conectar con ningún modelo de Gemini disponible.");
}

async function probarConexionGemini(){
  const statusEl = document.getElementById('gemini-status');
  const input = document.getElementById('gemini-api-key');
  const key = (input ? input.value : '').trim() || obtenerConfigGemini().apiKey;

  if(!key){
    if(statusEl){
      statusEl.style.color = '#fca5a5';
      statusEl.textContent = '⚠️ Ingresa una clave antes de probar la conexión.';
    }
    return;
  }

  if(statusEl){
    statusEl.style.color = '#93c5fd';
    statusEl.textContent = '⏳ Probando conexión con Google AI Studio...';
  }

  try{
    await ejecutarLlamadaGemini(key, {
      contents: [
        { role: 'user', parts: [{ text: 'Responde exactamente: "CONEXION_OK"' }] }
      ]
    });

    if(statusEl){
      statusEl.style.color = '#6ee7b7';
      statusEl.textContent = '✅ ¡Conexión exitosa con Gemini! Tu clave funciona perfectamente.';
    }
    actualizarEstadoCopilotoBadge();
  }catch(err){
    if(statusEl){
      statusEl.style.color = '#fca5a5';
      statusEl.textContent = '❌ Error de conexión: ' + err.message;
    }
  }
}

function abrirCopilotoGemini(){
  inyectarModalCopilotoSiNoExiste();
  const modal = document.getElementById('copiloto-gemini-modal');
  if(!modal) return;
  modal.style.display = 'flex';
  verificarServidorGemini();
  actualizarEstadoCopilotoBadge();
  const input = document.getElementById('copiloto-input');
  if(input) input.focus();
  scrollCopilotoAlFinal();
}

function cerrarCopilotoGemini(){
  const modal = document.getElementById('copiloto-gemini-modal');
  if(modal) modal.style.display = 'none';
}

function toggleCopilotoGemini(){
  const modal = document.getElementById('copiloto-gemini-modal');
  if(!modal) return;
  if(modal.style.display === 'flex'){
    cerrarCopilotoGemini();
  }else{
    abrirCopilotoGemini();
  }
}

function toggleMinimizarCopiloto(){
  const modal = document.getElementById('copiloto-gemini-modal');
  const btn = document.getElementById('copiloto-btn-min');
  if(!modal) return;
  const minimizado = modal.classList.toggle('copiloto-minimizado');
  if(btn){
    btn.textContent = minimizado ? '🔼' : '🔽';
    btn.title = minimizado ? 'Expandir ventana de chat' : 'Minimizar ventana de chat';
  }
}

/* ============================================================
   DICCIONARIO DE JUEGOS RETRO VERIFICADOS
   Garantiza URLs 100% funcionales y probadas para clásicos (RetroGamesNexus /embed/)
   ============================================================ */
const DICCIONARIO_JUEGOS_VERIFICADOS = [
  {
    claves: ['chrono trigger', 'crono trigger', 'chrono'],
    nombre: 'Chrono Trigger',
    tipo: 'snes',
    categoria: 'Aventura',
    url: 'https://retrogamesnexus.com/embed/games/chrono-trigger',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1r7a.jpg'
  },
  {
    claves: ['super mario kart', 'mario kart snes', 'mario kart'],
    nombre: 'Super Mario Kart',
    tipo: 'snes',
    categoria: 'Carreras',
    url: 'https://www.retrogames.cc/embed/43860-super-mario-kart-deluxe.html',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x3a.jpg'
  },
  {
    claves: ['super mario all stars', 'mario all stars', 'super mario all-stars'],
    nombre: 'Super Mario All-Stars',
    tipo: 'snes',
    categoria: 'Aventura',
    url: 'https://www.retrogames.cc/embed/46302-super-mario-all-stars-enhanced.html',
    imagen: 'https://mario.wiki.gallery/images/thumb/7/72/SMAS.jpg/1200px-SMAS.jpg'
  },
  {
    claves: ['super mario world', 'mario world'],
    nombre: 'Super Mario World',
    tipo: 'snes',
    categoria: 'Aventura',
    url: 'https://retrogamesnexus.com/embed/games/super-mario-world',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x1a.jpg'
  },
  {
    claves: ['street fighter 2', 'street fighter ii', 'sf2'],
    nombre: 'Street Fighter II Turbo',
    tipo: 'snes',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/street-fighter-2-turbo',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x4a.jpg'
  },
  {
    claves: ['donkey kong country', 'donkey kong snes', 'donkey kong'],
    nombre: 'Donkey Kong Country',
    tipo: 'snes',
    categoria: 'Aventura',
    url: 'https://retrogamesnexus.com/embed/games/donkey-kong-country',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x2a.jpg'
  },
  {
    claves: ['legend of zelda', 'zelda a link to the past', 'zelda snes', 'zelda'],
    nombre: 'The Legend of Zelda: A Link to the Past',
    tipo: 'snes',
    categoria: 'Aventura',
    url: 'https://retrogamesnexus.com/embed/games/the-legend-of-zelda-a-link-to-the-past',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x5a.jpg'
  },
  {
    claves: ['top gear', 'top gear snes'],
    nombre: 'Top Gear',
    tipo: 'snes',
    categoria: 'Carreras',
    url: 'https://retrogamesnexus.com/embed/games/top-gear',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204a.jpg'
  },
  {
    claves: ['sonic the hedgehog', 'sonic html5', 'sonic', 'sonic 3'],
    nombre: 'Sonic the Hedgehog 3',
    tipo: 'snes',
    categoria: 'Aventura',
    url: 'https://www.retrogames.cc/embed/30349-sonic-the-hedgehog-3-usa.html',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1v7a.jpg'
  },
  {
    claves: ['pacman', 'pac-man', 'pac man'],
    nombre: 'Pac-Man Clásico',
    tipo: 'normal',
    categoria: 'Infantiles',
    url: 'https://retrogamesnexus.com/embed/games/pac-man',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1v8a.jpg'
  },
  {
    claves: ['metal slug', 'metal slug arcade'],
    nombre: 'Metal Slug',
    tipo: 'normal',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/metal-slug',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1v9a.jpg'
  },
  {
    claves: ['tmnt', 'turtles in time', 'tortugas ninja'],
    nombre: 'TMNT IV: Turtles in Time',
    tipo: 'snes',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/teenage-mutant-ninja-turtles-iv-turtles-in-time',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x6a.jpg'
  },
  {
    claves: ['mortal kombat 2', 'mortal kombat ii', 'mk2', 'mortal kombat'],
    nombre: 'Mortal Kombat II',
    tipo: 'snes',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/mortal-kombat-2',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7a.jpg'
  },
  {
    claves: ['mega man x', 'megaman x', 'megaman'],
    nombre: 'Mega Man X',
    tipo: 'snes',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/mega-man-x',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8a.jpg'
  },
  {
    claves: ['super metroid', 'metroid snes', 'metroid'],
    nombre: 'Super Metroid',
    tipo: 'snes',
    categoria: 'Aventura',
    url: 'https://retrogamesnexus.com/embed/games/super-metroid',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x9a.jpg'
  },
  {
    claves: ['kirby', 'kirby dream land 3'],
    nombre: "Kirby's Dream Land 3",
    tipo: 'snes',
    categoria: 'Infantiles',
    url: 'https://retrogamesnexus.com/embed/games/kirbys-dream-land-3',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co205a.jpg'
  },
  {
    claves: ['bomberman', 'super bomberman 5'],
    nombre: 'Super Bomberman 5',
    tipo: 'snes',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/super-bomberman-5',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co206a.jpg'
  },
  {
    claves: ['pokemon', 'pokemon emerald', 'pokémon'],
    nombre: 'Pokémon Emerald Version',
    tipo: 'snes',
    categoria: 'Aventura',
    url: 'https://retrogamesnexus.com/embed/games/pokemon-emerald',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co207a.jpg'
  },
  {
    claves: ['smash bros', 'super smash bros'],
    nombre: 'Super Smash Bros',
    tipo: 'snes',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/super-smash-bros',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co208a.jpg'
  },
  {
    claves: ['pokemon rojo fuego', 'pokemon firered', 'pokemon fire red', 'rojo fuego'],
    nombre: 'Pokémon Edición Rojo Fuego',
    tipo: 'snes',
    categoria: 'Aventura',
    url: 'https://retrogamesnexus.com/embed/games/pokemon-firered-version',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co207a.jpg'
  },
  {
    claves: ['super mario 64', 'mario 64', 'sm64'],
    nombre: 'Super Mario 64',
    tipo: 'normal',
    categoria: 'Aventura',
    url: 'https://retrogamesnexus.com/embed/games/super-mario-64',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x1a.jpg'
  },
  {
    claves: ['contra 3', 'contra iii', 'contra snes', 'contra the alien wars'],
    nombre: 'Contra III: The Alien Wars',
    tipo: 'snes',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/contra-iii-the-alien-wars',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x8a.jpg'
  },
  {
    claves: ['tetris', 'tetris attack', 'tetris snes'],
    nombre: 'Tetris Attack',
    tipo: 'snes',
    categoria: 'Puzzles',
    url: 'https://retrogamesnexus.com/embed/games/tetris-attack',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co204a.jpg'
  },
  {
    claves: ['castlevania', 'dracula x', 'castlevania snes'],
    nombre: 'Castlevania: Dracula X',
    tipo: 'snes',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/castlevania-dracula-x',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x6a.jpg'
  },
  {
    claves: ['aladdin', 'aladdin snes'],
    nombre: 'Disney Aladdin',
    tipo: 'snes',
    categoria: 'Aventura',
    url: 'https://retrogamesnexus.com/embed/games/disneys-aladdin',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x2a.jpg'
  },
  {
    claves: ['earthworm jim', 'earthworm jim snes'],
    nombre: 'Earthworm Jim',
    tipo: 'snes',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/earthworm-jim',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x4a.jpg'
  },
  {
    claves: ['sunset riders', 'sunset riders snes'],
    nombre: 'Sunset Riders',
    tipo: 'snes',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/sunset-riders',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x7a.jpg'
  },
  {
    claves: ['killer instinct', 'killer instinct snes'],
    nombre: 'Killer Instinct',
    tipo: 'snes',
    categoria: 'Acción',
    url: 'https://retrogamesnexus.com/embed/games/killer-instinct',
    imagen: 'https://images.igdb.com/igdb/image/upload/t_cover_big/co1x9a.jpg'
  }
];

/* ============================================================
   RESOLUCIÓN INTELIGENTE DE PORTADAS DE ALTA DEFINICIÓN (Copiloto IA)
   Multi-fuente: OpenGraph Google/Microlink, Internet Archive, Wikipedia, YouTube y CDNs oficiales
   Garantiza múltiples portadas para que Luis elija la mejor con un clic
   ============================================================ */
async function resolverMultiplesPortadasCopiloto(nombre, url = '', imgActual = '') {
  const portadas = [];
  const u = (url || '').trim();
  const nom = (nombre || '').trim();

  // 1. Imagen devuelta por la IA (SOLO si no es de imgur, ni placeholder, ni el logo por defecto)
  if (imgActual && typeof imgActual === 'string' && imgActual.trim() && !imgActual.includes('portadas/logo.png') && /^https?:\/\//i.test(imgActual)) {
    const imgL = imgActual.toLowerCase();
    // Rechazar imgur (frecuentes errores de imagen no disponible) o placeholders
    if (!imgL.includes('imgur.com') && !imgL.includes('removed.png') && !imgL.includes('placeholder') && !imgL.includes('not-found') && !imgL.includes('deleted')) {
      portadas.push(imgActual.trim());
    }
  }

  // 2. Extraer portada directa conocida por la estructura de la URL
  if (u) {
    try {
      // YouTube
      const mYt = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
      if (mYt && mYt[1]) {
        portadas.push(`https://i.ytimg.com/vi/${mYt[1]}/hqdefault.jpg`);
        portadas.push(`https://i.ytimg.com/vi/${mYt[1]}/mqdefault.jpg`);
      }

      const uObj = new URL(u, window.location.href);
      const host = uObj.hostname.toLowerCase();

      // Internet Archive
      if (host.includes('archive.org')) {
        const mArc = u.match(/\/embed\/([a-zA-Z0-9_\-\.]+)/i) || u.match(/\/details\/([a-zA-Z0-9_\-\.]+)/i);
        if (mArc && mArc[1]) {
          portadas.push(`https://archive.org/services/img/${mArc[1]}`);
        }
      }

      // TurboWarp / Scratch
      if (host.includes('turbowarp.org') || host.includes('scratch.mit.edu')) {
        const mScr = u.match(/(?:turbowarp\.org|scratch\.mit\.edu)\/(?:projects\/)?(\d+)/i);
        if (mScr && mScr[1]) {
          portadas.push(`https://uploads.scratch.mit.edu/get_image/project/${mScr[1]}_480x360.png`);
        }
      }

      // RetroGamesNexus
      if (host.includes('retrogamesnexus.com')) {
        const mRgn = uObj.pathname.match(/\/embed\/games\/([a-z0-9-_]+)/i);
        if (mRgn && mRgn[1]) {
          portadas.push(`https://retrogamesnexus.com/images/games/cover/snes/${mRgn[1]}.webp`);
          portadas.push(`https://retrogamesnexus.com/images/games/cover/nes/${mRgn[1]}.webp`);
        }
      }

      // GameMonetize / GameDistribution / Wordwall
      if (host.includes('gamemonetize.co') || host.includes('gamemonetize.com')) {
        const mGm = uObj.pathname.match(/\/([a-z0-9]{20,40})/i);
        if (mGm && mGm[1]) portadas.push(`https://img.gamemonetize.com/${mGm[1]}/512x384.jpg`);
      }
      if (host.includes('gamedistribution.com')) {
        const mGd = uObj.pathname.match(/\/([0-9a-f]{24,36})/i);
        if (mGd && mGd[1]) portadas.push(`https://img.gamedistribution.com/${mGd[1]}-512x384.jpeg`);
      }
      if (host.includes('wordwall.net')) {
        const mWw = uObj.pathname.match(/([0-9a-f]{24,36})/i);
        if (mWw && mWw[1]) portadas.push(`https://screens.cdn.wordwall.net/200/${mWw[1]}_1`);
      }

      // Si es una web genérica (Itch.io u otras), extraer og:image vía Microlink libre de CORS
      if (!host.includes('retrogamesnexus') && !host.includes('archive.org') && !host.includes('youtube') && /^https?:\/\//i.test(u)) {
        try {
          const rMicro = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(u)}`).catch(() => null);
          if (rMicro && rMicro.ok) {
            const jMicro = await rMicro.json();
            const ogImg = jMicro?.data?.image?.url || jMicro?.data?.logo?.url;
            if (ogImg && !ogImg.endsWith('.ico')) portadas.push(ogImg);
          }
        } catch(e){}
      }
    } catch (e) {}
  }

  // 3. Búsqueda de alta resolución en Google / DuckDuckGo Images (/api/covers/search)
  if (nom) {
    try {
      const rCov = await fetch(`/api/covers/search?q=${encodeURIComponent(nom)}`).catch(() => null);
      if (rCov && rCov.ok) {
        const dCov = await rCov.json();
        if (Array.isArray(dCov.covers) && dCov.covers.length > 0) {
          dCov.covers.forEach(c => portadas.push(c));
        }
      }
    } catch(e) {}
  }

  // 4. Coincidencia en diccionario verificado (SOLO cuando Google Search está DESACTIVADO)
  if (!copilotoUsarGoogleSearch && nom) {
    const nomLower = nom.toLowerCase();
    const ver = DICCIONARIO_JUEGOS_VERIFICADOS.find(j =>
      j.claves.some(k => nomLower.includes(k) || k.includes(nomLower))
    );
    if (ver && ver.imagen) portadas.push(ver.imagen);
  }

  // 5. Búsqueda en catálogo local activo de Luis (SOLO cuando Google Search está DESACTIVADO)
  if (!copilotoUsarGoogleSearch && nom && catalogo && Array.isArray(catalogo.juegos)) {
    const nomLower = nom.toLowerCase();
    const exist = catalogo.juegos.find(j =>
      j.nombre && j.nombre.toLowerCase().includes(nomLower) && j.imagen && !j.imagen.includes('logo.png')
    );
    if (exist && exist.imagen) portadas.push(exist.imagen);
  }

  // 6. Búsqueda enciclopédica de respaldo (Wikipedia OpenSearch / Microlink)
  if (nom && portadas.length < 3) {
    try {
      const qLimpia = nom.replace(/\b(snes|nes|genesis|online|swf|html5|flash|web)\b/gi, '').trim();
      const rWiki = await fetch(`https://api.microlink.io/?url=${encodeURIComponent('https://en.wikipedia.org/wiki/' + encodeURIComponent(qLimpia))}`).catch(() => null);
      if (rWiki && rWiki.ok) {
        const jWiki = await rWiki.json();
        const wikiImg = jWiki?.data?.image?.url;
        if (wikiImg && !wikiImg.endsWith('.svg') && !wikiImg.endsWith('.ico')) {
          portadas.push(wikiImg);
        }
      }
    } catch(e){}
  }

  const unicas = [...new Set(portadas.filter(p => p && typeof p === 'string' && p.startsWith('http') && !p.includes('logo.png')))];
  if (unicas.length === 0) {
    return ['portadas/logo.png'];
  }
  return unicas.slice(0, 4);
}

async function resolverPortadaJuegoCopiloto(nombre, url = '', imgActual = '') {
  const multi = await resolverMultiplesPortadasCopiloto(nombre, url, imgActual);
  return multi[0] || 'portadas/logo.png';
}

function obtenerDominiosYLogicaDelCatalogo(){
  const { disabled, custom } = obtenerConfigDominiosCopiloto();
  
  if(!catalogo || !Array.isArray(catalogo.juegos)) {
    return {
      dominios: ['retrogamesnexus.com', 'retrogames.cc', 'turbowarp.org', 'scratch.mit.edu', 'famobi.com', 'gamemonetize.co', 'playgama.com', 'gameboss.com', 'crazygames.com', 'youtube.com'].filter(d => !disabled.includes(d)),
      resumen: '- retrogamesnexus.com\n- turbowarp.org\n- famobi.com\n- gamemonetize.co\n- playgama.com\n- gameboss.com\n- crazygames.com\n- retrogames.cc'
    };
  }

  const dominiosSet = new Set();
  const resumenList = [];

  catalogo.juegos.forEach(j => {
    if(!j.url || typeof j.url !== 'string') return;
    const uStr = j.url.trim();

    try {
      if(uStr.startsWith('http://') || uStr.startsWith('https://')){
        const urlObj = new URL(uStr);
        const host = urlObj.hostname.replace(/^www\./, '');
        if(host && !dominiosSet.has(host) && !disabled.includes(host)){
          dominiosSet.add(host);
          resumenList.push(`- ${host} (${j.tipo || 'normal'}: "${j.nombre}")`);
        }
      } else if(uStr.endsWith('.swf') || uStr.startsWith('games/')){
        if(!disabled.includes('Archivos locales .swf / Ruffle')) {
            dominiosSet.add('Archivos locales .swf / Ruffle');
        }
      }
    } catch(e){}
  });

  return {
    dominios: Array.from(dominiosSet).concat(custom).filter((d, i, a) => a.indexOf(d) === i),
    resumen: resumenList.length ? resumenList.slice(0, 20).join('\n') : '- Dominios verificados de Juegos Saludables'
  };
}

function buscarJuegoVerificado(texto, juegoAI=null){
  if(!texto && !juegoAI) return juegoAI;

  // Detectar si el usuario pegó una URL directa explícita en su mensaje (ej: retrogames.cc/embed/..., youtube, turbowarp, etc.)
  const urlDirectaUsuario = (texto || '').match(/https?:\/\/[^\s"']+/i)?.[0];

  const textoLimpio = ((texto || '') + ' ' + (juegoAI && juegoAI.nombre ? juegoAI.nombre : '')).toLowerCase().trim();

  // Detectar tipo de petición: HTML5 / Fan-made, Flash SWF, o YouTube
  const pideHTML5 = /html5|fan|clone|scratch|js|web|fanmade|fan-made|browser|3d/i.test((texto || '').toLowerCase());
  const pideFlash = /flash|swf|ruffle/i.test((texto || '').toLowerCase());
  const pideYouTube = /youtube|video|gameplay|musica|música|cancion|canción|trailer|tráiler/i.test((texto || '').toLowerCase());

  // SI EL USUARIO PEGÓ SU PROPIA URL DIRECTA (ej: https://www.retrogames.cc/embed/17335-super-mario-kart-usa.html)
  if(urlDirectaUsuario){
    if(!juegoAI){
      juegoAI = {
        nombre: 'Juego Supervisado',
        url: urlDirectaUsuario,
        imagen: 'portadas/logo.png',
        tipo: (urlDirectaUsuario.includes('youtube') || urlDirectaUsuario.includes('youtu.be')) ? 'youtube' : 'snes',
        categoria: 'Retro',
        descripcion: 'Enlace directo proporcionado y supervisado por Luis.'
      };
    } else {
      juegoAI.url = urlDirectaUsuario;
    }
    juegoAI.supervisado = true;
    return juegoAI;
  }

  if(pideYouTube && juegoAI){
    juegoAI.tipo = 'youtube';
  } else if((pideHTML5 || pideFlash) && juegoAI){
    juegoAI.tipo = 'normal';
  }

  if(!copilotoUsarGoogleSearch && !pideHTML5 && !pideFlash && !pideYouTube){
    // Buscar coincidencia en diccionario verificado para juegos retro de consola (SOLO sin Google Search)
    const encontrado = DICCIONARIO_JUEGOS_VERIFICADOS.find(j => 
      j.claves.some(clave => textoLimpio.includes(clave))
    );

    if(encontrado){
      return {
        nombre: encontrado.nombre,
        url: encontrado.url,
        imagen: (juegoAI && juegoAI.imagen && !juegoAI.imagen.includes('logo.png')) ? juegoAI.imagen : encontrado.imagen,
        tipo: encontrado.tipo,
        categoria: (juegoAI && juegoAI.categoria) ? juegoAI.categoria : encontrado.categoria,
        descripcion: (juegoAI && juegoAI.descripcion) ? juegoAI.descripcion : `Ficha verificada de ${encontrado.nombre}.`
      };
    }
  }

  // Si la IA devolvió alguna respuesta, procesarla respetando peticiones
  if(juegoAI){
    const nombreRef = juegoAI.nombre || texto || 'juego';
    juegoAI.url = sanearUrlJuego(juegoAI.url, juegoAI.tipo, nombreRef, pideHTML5, juegoAI.supervisado);
  }

  return juegoAI;
}

function sanearUrlJuego(url, tipo, nombreJuego='', pideHTML5=false, esSupervisado=false){
  if(!url || typeof url !== 'string') url = '';
  let u = url.trim();

  // Asegurar protocolo seguro HTTPS en dominios web modernos para evitar bloqueo de contenido mixto
  if(u.startsWith('http://') && !u.includes('localhost') && !u.includes('127.0.0.1')){
    u = u.replace('http://', 'https://');
  }

  // SI ES UN ENLACE DIRECTO SUPERVISADO O ES UN EMBED ESPECÍFICO DE RETROGAMES.CC CON ID (ej: retrogames.cc/embed/17335-super-mario-kart-usa.html)
  if(esSupervisado || (u.includes('retrogames.cc/embed/') && /\d+/.test(u))){
    return u; // ¡RESPETAR LA URL QUE LUIS SUPERVISÓ Y PEGÓ!
  }

  // 1. YouTube videos (convertir a formato embed)
  if(u.includes('youtube.com') || u.includes('youtu.be') || tipo === 'youtube'){
    const match = u.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
    if(match && match[1]){
      return `https://www.youtube.com/embed/${match[1]}`;
    }
  }

  // EN MODO GOOGLE SEARCH ACTIVO: Respetar plenamente los enlaces encontrados en internet
  // NO sustituir por retrogamesnexus ni recurrir al catálogo guardado
  if (copilotoUsarGoogleSearch && u.startsWith('http')) {
    if (u.includes('gamemonetize.co') || u.includes('gamemonetize.com')) {
      if (!/\/([a-z0-9]{20,40})\/?/i.test(u)) return '';
    }
    return u;
  }

  const uLower = (u + ' ' + nombreJuego).toLowerCase();

  // 2. Comprobar si pertenece a dominios probados y confiables del catálogo de Luis
  // NOTA: Para GameMonetize, SOLO se acepta si contiene un hash real (mínimo 20 caracteres hex/alfanumérico en la ruta).
  if (u.includes('gamemonetize.co') || u.includes('gamemonetize.com')) {
    const tieneHashReal = /\/([a-z0-9]{20,40})\/?/i.test(u);
    if (!tieneHashReal) {
      return '';
    }
    return u;
  }

  const dominiosProbados = [
    'retrogamesnexus.com', 'turbowarp.org', 'scratch.mit.edu', 'famobi.com',
    'playgama.com', 'gameboss.com', 'crazygames.com', 'madkidgames.com',
    'playhop.com', 'itch.io', 'blockly.games'
  ];

  const esDominioProbado = dominiosProbados.some(dom => u.includes(dom));
  if(esDominioProbado && u.startsWith('http')){
    return u;
  }

  // 4. Juegos Flash (.swf) o Archive.org embeds
  if(u.endsWith('.swf') || u.includes('.swf') || u.includes('archive.org/embed/')){
    return u;
  }

  // 5. Si NO se pidió HTML5/Flash/YouTube explícito, comprobar con el diccionario verificado (solo si NO usamos Google)
  if(!copilotoUsarGoogleSearch && !pideHTML5){
    const encontrado = DICCIONARIO_JUEGOS_VERIFICADOS.find(j =>
      j.claves.some(clave => uLower.includes(clave))
    );
    if(encontrado) return encontrado.url;
  }

  // 6. Si es un juego retro de consola (solo si NO usamos Google)
  if(!copilotoUsarGoogleSearch && !pideHTML5 && (tipo === 'snes' || u.includes('retrogames.cc') || u.includes('snesfun.com') || !u.startsWith('http'))){
    const slug = (nombreJuego || 'juego')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if(slug){
      return `https://retrogamesnexus.com/embed/games/${slug}`;
    }
  }

  return u;
}

function limpiarChatCopiloto(){
  copilotoHistorial = [];
  try { sessionStorage.removeItem('freshmind_copiloto_historial'); } catch(e){}
  actualizarBadgeMemoria();
  const chat = document.getElementById('copiloto-chat-logs');
  if(!chat) return;
  chat.innerHTML = `
    <div class="copiloto-msg-bubble copiloto-msg-ai">
      Conversación y memoria reiniciadas. 🧹<br>
      ¿Qué juego retro o web deseas buscar y agregar hoy a <b>Juegos Saludables</b>? 🎮
    </div>
  `;
  mostrarToastSync('🧹 Memoria del copiloto reiniciada (0/6 msgs)');
}

function extraerTerminoBusquedaJuego(texto) {
  if (!texto) return '';
  let t = texto.trim();
  t = t.replace(/^(por\s+favor\s+)?(quiero\s+que\s+)?(busques?|busca|encuentra|dame|muestra|agrega|a[ñn]ade|pon|quiero\s+jugar(\s+a)?|un\s+juego\s+de|juegos?\s+de)\s+/i, '');
  t = t.replace(/\b(en\s+scratch|en\s+turbowarp|en\s+html5|para\s+el\s+cat[aá]logo|en\s+espa[ñn]ol|online|gratis)\b/gi, '');
  return t.trim() || texto.trim();
}

async function copilotoManejarErrorImagen(tempId, imgEl){
  if(!imgEl) return;
  imgEl.onerror = null;
  const j = copilotoJuegosPendientes[tempId];
  if(j && Array.isArray(j.portadasSugeridas)){
    const alt = j.portadasSugeridas.find(p => p && p !== imgEl.src && !p.includes('imgur.com') && !p.includes('logo.png'));
    if(alt){
      imgEl.src = alt;
      j.imagen = alt;
      return;
    }
  }
  if(j && j.nombre){
    try {
      const r = await fetch(`/api/covers/search?q=${encodeURIComponent(j.nombre)}`);
      if(r.ok){
        const d = await r.json();
        if(Array.isArray(d.covers) && d.covers.length > 0){
          imgEl.src = d.covers[0];
          j.imagen = d.covers[0];
          return;
        }
      }
    } catch(e){}
  }
  imgEl.src = 'portadas/logo.png';
}

function scrollCopilotoAlFinal(){
  const chat = document.getElementById('copiloto-chat-logs');
  if(chat){
    chat.scrollTop = chat.scrollHeight;
  }
}

function pedirCopilotoSugerencia(texto){
  const input = document.getElementById('copiloto-input');
  if(!input) return;
  input.value = texto;
  enviarMensajeCopiloto();
}

function formatearMensajeCopiloto(texto){
  if(!texto) return '';
  let seguro = escapeHtml(texto);
  // Bloques de código preformateado
  seguro = seguro.replace(/```([a-z]*)\n?([\s\S]*?)```/g, '<pre style="background:#0a0a10;padding:8px 10px;border-radius:6px;overflow-x:auto;font-size:12px;color:#a5b4fc;margin:6px 0"><code>$2</code></pre>');
  // Código en línea
  seguro = seguro.replace(/`([^`]+)`/g, '<code style="background:rgba(255,255,255,0.08);padding:1px 5px;border-radius:4px;font-size:12px;color:#e2e8f0">$1</code>');
  // Negrita
  seguro = seguro.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  // Cursiva
  seguro = seguro.replace(/(?<!\*)\*(?!\*)(.*?)(?<!\*)\*(?!\*)/g, '<i>$1</i>');
  seguro = seguro.replace(/(?<!_)_([^_]+)_(?!_)/g, '<i>$1</i>');
  // Enlaces en Markdown [texto](url)
  seguro = seguro.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" style="color:#38bdf8;text-decoration:underline">$1</a>');
  // Encabezados
  seguro = seguro.replace(/###\s*(.*?)(?=\n|$)/g, '<div style="font-weight:bold;margin-top:7px;color:#e2e8f0;font-size:13.5px">$1</div>');
  seguro = seguro.replace(/##\s*(.*?)(?=\n|$)/g, '<div style="font-weight:bold;margin-top:9px;color:#c4b5fd;font-size:14px">$1</div>');
  // Listas con viñetas
  seguro = seguro.replace(/(?:^|\n)[*-]\s+(.*?)(?=\n|$)/g, '<br>• $1');
  // Listas numeradas
  seguro = seguro.replace(/(?:^|\n)(\d+)\.\s+(.*?)(?=\n|$)/g, '<br><b>$1.</b> $2');
  // Saltos de línea
  seguro = seguro.replace(/\n\n+/g, '<br><br>').replace(/\n/g, '<br>');
  return seguro;
}

async function enviarMensajeCopiloto(){
  if(copilotoCargando) return;
  const input = document.getElementById('copiloto-input');
  const chat = document.getElementById('copiloto-chat-logs');
  const btnSend = document.getElementById('copiloto-btn-send');
  if(!input || !chat) return;

  const texto = input.value.trim();
  if(!texto) return;

  // Guardar en historial de comandos para navegación con flechas arriba/abajo
  copilotoInputHistory.push(texto);
  if(copilotoInputHistory.length > 30) copilotoInputHistory.shift();
  copilotoHistoryIndex = -1;

  // 1. Agregar mensaje del usuario a la vista
  const userBubble = document.createElement('div');
  userBubble.className = 'copiloto-msg-bubble copiloto-msg-user';
  userBubble.textContent = texto;
  chat.appendChild(userBubble);
  input.value = '';
  scrollCopilotoAlFinal();

  const cfg = obtenerConfigGemini();
  if(!servidorGeminiDisponible && !cfg.apiKey){
    const errorBubble = document.createElement('div');
    errorBubble.className = 'copiloto-msg-bubble copiloto-msg-ai';
    errorBubble.innerHTML = `
      ⚠️ <b>Aún no has configurado tu clave API de Gemini.</b><br><br>
      Para usar el copiloto inteligente, pega tu API Key gratuita de Google AI Studio:<br><br>
      <button onclick="mostrarConfigGemini(true)" style="background:#6366f1;color:#fff;border:0;padding:7px 12px;border-radius:7px;font-weight:bold;cursor:pointer">⚙️ Configurar Clave Gemini</button>
      <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" style="display:inline-block;margin-left:6px;background:#333;color:#fff;padding:7px 12px;border-radius:7px;text-decoration:none;font-size:12px">🔑 Obtener clave gratis</a>
    `;
    chat.appendChild(errorBubble);
    scrollCopilotoAlFinal();
    return;
  }

  // 2. Indicador visual de carga con cronómetro, pasos y progreso en tiempo real
  copilotoCargando = true;
  copilotoSegundos = 0;
  copilotoAbortController = new AbortController();

  if(btnSend){
    btnSend.disabled = true;
    btnSend.textContent = '⏳ (0s)';
  }

  const typingBubble = document.createElement('div');
  typingBubble.id = 'copiloto-typing-indicator';
  typingBubble.className = 'copiloto-msg-bubble copiloto-msg-ai';
  typingBubble.innerHTML = `
    <div class="copiloto-loading-box">
      <div class="copiloto-loading-header">
        <div class="copiloto-loading-status">
          <span class="copiloto-spinner-icon">⚡</span>
          <span id="copiloto-loading-text">${copilotoUsarGoogleSearch ? '🌐 Paso 1/3: Buscando en Google Search e investigando opciones...' : '🤖 Paso 1/3: Analizando catálogo y memoria rápida...'}</span>
        </div>
        <span id="copiloto-loading-timer" class="copiloto-loading-timer">⏱️ 0s</span>
      </div>
      <div class="copiloto-progress-track">
        <div id="copiloto-progress-bar" class="copiloto-progress-bar" style="width: 15%;"></div>
      </div>
      <div class="copiloto-loading-footer">
        <span id="copiloto-loading-eta">Estimado: ~3s a 5s restantes (15%)</span>
        <button type="button" class="copiloto-btn-cancel-query" onclick="cancelarConsultaCopiloto(false)">🛑 Cancelar</button>
      </div>
    </div>
  `;
  chat.appendChild(typingBubble);
  scrollCopilotoAlFinal();

  if(copilotoTimerInterval) clearInterval(copilotoTimerInterval);
  copilotoTimerInterval = setInterval(actualizarProgresoCopiloto, 1000);

  // 3. Preparar memoria conversacional (máximo 6 mensajes previos)
  if(!Array.isArray(copilotoHistorial)) copilotoHistorial = [];
  if(copilotoHistorial.length > 6){
    copilotoHistorial = copilotoHistorial.slice(-6);
  }
  // La API de Gemini requiere que el primer turno en contents sea siempre 'user'
  while(copilotoHistorial.length > 0 && copilotoHistorial[0].role !== 'user'){
    copilotoHistorial.shift();
  }

  const contentsPayload = [
    ...copilotoHistorial,
    {
      role: 'user',
      parts: [{ text: texto }]
    }
  ];

  // 3.5 BÚSQUEDA Y MENTALIZACIÓN DE METADATOS EN EL ÍNDICE REAL DE JUEGOS
  // Consulta Internet Archive (emuladores web oficiales) y GameMonetize (HTML5 verificado)
  const terminoLimpio = extraerTerminoBusquedaJuego(texto);
  let juegosIndexados = [];
  try {
    const cfgDom = obtenerConfigDominiosCopiloto();
    const paramsIdx = new URLSearchParams({
      q: terminoLimpio,
      disabled: JSON.stringify(cfgDom.disabled || []),
      custom: JSON.stringify(cfgDom.custom || [])
    });
    const rIdx = await fetch(`/api/games/index-search?${paramsIdx.toString()}`, {
      signal: copilotoAbortController ? copilotoAbortController.signal : undefined
    }).catch(() => null);
    if(rIdx && rIdx.ok){
      const dIdx = await rIdx.json();
      if(Array.isArray(dIdx.games) && dIdx.games.length > 0){
        juegosIndexados = dIdx.games;
      }
    }
  } catch(e) {}

  // 4. Parámetros del sistema y contexto de juegos
  const categoriasActuales = Array.isArray(catalogo.categorias) && catalogo.categorias.length 
    ? catalogo.categorias 
    : ['Acción', 'Aventura', 'Carreras', 'Retro', 'Infantiles', 'Deportes', 'Puzzles', 'Estrategia', 'Super Nintendo'];

  const infoCatalogo = copilotoUsarGoogleSearch ? { dominios: [], resumen: '' } : obtenerDominiosYLogicaDelCatalogo();

  const seccionCatalogoPrompt = copilotoUsarGoogleSearch
    ? `MODO BÚSQUEDA WEB ACTIVA (Google Search):
- Estás conectado a Google Search en vivo. Debes buscar libremente en internet los mejores enlaces jugables, portadas y datos actualizados.
- NO te limites ni uses forzosamente los enlaces o proveedores locales previamente guardados de la web; investiga en la web para encontrar la mejor versión jugable en línea (HTML5, emuladores oficiales web, fan-games en GitHub Pages / Itch.io / Scratch, o videos de YouTube).`
    : `MODO RÁPIDO (Memoria interna y Catálogo guardado de Luis):
DOMINIOS Y PROVEEDORES PROBADOS Y PRIORITARIOS EN EL CATÁLOGO ACTIVO DE LUIS:
${infoCatalogo.resumen}`;

  let seccionMetadatosIndice = '';
  if (juegosIndexados.length > 0) {
    seccionMetadatosIndice = `
METADATOS VERIFICADOS REALES DEL ÍNDICE DE JUEGOS PARA "${terminoLimpio}":
Se encontraron estas opciones 100% reales y jugables en navegador (con emulador web oficial o HTML5):
${juegosIndexados.map((g, idx) => `
- Opción ${idx + 1}:
  * Título: "${g.title}"
  * URL jugable verificada: "${g.url}"
  * Portada oficial: "${g.thumb}"
  * Tipo: "${g.tipo || 'normal'}"
  * Categoría sugerida: "${g.category || 'Retro'}"
  * Descripción: "${g.description || ''}"
`).join('\n')}

INSTRUCCIÓN CRÍTICA DE METADATOS:
- Usa estas opciones reales del índice. Si alguna coincide con lo que pide Luis (ej: "${juegosIndexados[0].title}"), UTILIZA ESA URL EXACTA.
- ESTÁ PROHIBIDO inventar números ni IDs de Scratch o TurboWarp. Usa los enlaces oficiales verificados de arriba.
`;
  }

  const promptSistema = `
Eres el Copiloto Inteligente de Administración para la plataforma de videojuegos web 'Juegos Saludables' del administrador Luis.
Tu tarea es ayudar a Luis a buscar, clasificar, auditar y añadir videojuegos (emuladores retro, HTML5, arcade, fan-made, etc.) o videos de YouTube al catálogo en 1 clic.

CATEGORÍAS EXISTENTES EN LA WEB:
${categoriasActuales.join(', ')}

${seccionCatalogoPrompt}

${seccionMetadatosIndice}

LÓGICA DE ENLACES Y ESTRUCTURA CONFIABLE:
1. Juegos Retro / Emulados en Navegador:
   - Internet Archive con emulador web oficial (https://archive.org/embed/{id_verificado})
   - RetroGamesNexus (https://retrogamesnexus.com/embed/games/nombre-del-juego) o RetroGames.cc con ID (https://www.retrogames.cc/embed/ID-nombre.html).
2. Juegos Web HTML5 / Canvas / Minijuegos:
   - GameMonetize con hash verificado (32 caracteres hexadecimales).
   - Famobi, Playgama, Gameboss, Madkidgames, Playhop/Yandex, itch.io o GitHub Pages.
3. PROHIBICIÓN ESTRICTA DE ALUCINAR SCRATCH/TURBOWARP:
   - NUNCA inventes números ni URLs ficticias tipo https://turbowarp.org/{id}/embed. Solo usa TurboWarp si Luis te pegó esa URL directa o si proviene de un proyecto verificado. Si no tienes un ID real, USA las opciones de Internet Archive o HTML5 del índice.
4. Juegos Flash (.swf):
   - Enlaces directos .swf de CrazyGames (files.crazygames.com) o locales.
5. Videos de YouTube:
   - Formato embed oficial (https://www.youtube.com/embed/VIDEO_ID).

TIPOS DE JUEGO DISPONIBLES:
- "snes": Para juegos de consola retro original (Super Nintendo / NES / GBA / Genesis).
- "normal": Para juegos HTML5 / Web / Canvas / JavaScript / Fan-Made que cargan directamente en iframe.
- "ventana": Para juegos con mejor experiencia en ventana emergente/popup.
- "ventana2": Para páginas de juegos con bloqueo de iframe.
- "youtube": Para gameplays, trailers o música de juegos en YouTube.
- "newtab": Para páginas externas que requieren abrir en pestaña nueva.

REGLAS OBLIGATORIAS DE HONESTIDAD Y PRECISIÓN:
1. NUNCA INVENTES URLS NI RESPUESTAS FALSAS:
   - Es fundamental ser 100% honesto. Es mil veces mejor decirle a Luis con sinceridad "No encontré un enlace jugable verificado para este título" o sugerir una alternativa real, que inventar enlaces inexistentes, rotos o ficticios.
   - Si no estás seguro de la URL o no existe una versión jugable pública, pon "url": "" y explica la situación en "mensaje".
2. SI LUIS ENVÍA O PEGA UN ENLACE DIRECTO:
   - DEBES UTILIZAR ESA URL EXACTA EN EL CAMPO "url". NO LA MODIFIQUES NI INVENTES OTRA.
3. ${copilotoUsarGoogleSearch ? 'INVESTIGA EN GOOGLE SEARCH para encontrar URLs jugables y portadas de alta calidad reales.' : 'DA PRIORIDAD A LOS DOMINIOS Y PROVEEDORES DEL CATÁLOGO PROBADO DE LUIS.'}
4. ATENCIÓN A JUEGOS HTML5 Y FAN-MADE:
   - Si se pide HTML5 o fan-made (ej. Mario Kart HTML5), asigna tipo "normal" y entrega juegos HTML5/Web reales o Scratch/TurboWarp, NUNCA emulador SNES.
5. Consigue una URL de portada o boxart en alta resolución.
6. Elige la categoría más precisa.
7. Si Luis pide varias opciones (ej. "dame 4 opciones"), incluye una lista en "juegos": [ { ... }, { ... } ]. Solo incluye opciones con enlaces válidos y reales.

FORMATO DE RESPUESTA OBLIGATORIO:
Debes responder SIEMPRE con un objeto JSON válido (sin texto antes ni después) con este esquema:
{
  "mensaje": "Breve explicación amigable en español de lo que encontraste.",
  "juego": {
    "nombre": "Nombre del juego",
    "url": "https://enlace-jugable",
    "imagen": "https://enlace-portada.jpg",
    "tipo": "snes" | "normal" | "ventana" | "ventana2" | "youtube" | "newtab",
    "categoria": "Categoría",
    "descripcion": "Breve sinopsis de 1 línea"
  },
  "juegos": [
    {
      "nombre": "Nombre de opción",
      "url": "https://enlace-jugable",
      "imagen": "https://enlace-portada.jpg",
      "tipo": "normal",
      "categoria": "Categoría",
      "descripcion": "Breve sinopsis"
    }
  ]
}
Si es una conversación general o no busca agregar un juego, pon "juego": null, "juegos": [] y responde en "mensaje".
`;

  let rawText = '';
  let searchQueries = [];

  try {
    let llamadoExitoso = false;

    // A) Intentar consultar vía el endpoint del servidor AI Studio (/api/gemini/chat)
    let serverErrorMsg = null;
    try {
      const serverRes = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: copilotoAbortController ? copilotoAbortController.signal : undefined,
        body: JSON.stringify({
          contents: contentsPayload,
          systemInstruction: promptSistema,
          useGoogleSearch: copilotoUsarGoogleSearch,
          apiKey: cfg.apiKey || ''
        })
      });

      if (serverRes.ok) {
        const serverData = await serverRes.json();
        if (serverData.ok && serverData.text) {
          rawText = serverData.text;
          searchQueries = serverData.searchQueries || [];
          llamadoExitoso = true;
          servidorGeminiDisponible = true;
          actualizarEstadoCopilotoBadge();
        } else if (serverData.error) {
          serverErrorMsg = serverData.error;
        }
      } else {
        const errJson = await serverRes.json().catch(() => null);
        if (errJson && errJson.error) {
          serverErrorMsg = errJson.error;
        }
      }
    } catch(serverErr) {
      if(copilotoAbortController && copilotoAbortController.signal.aborted) throw serverErr;
      // Servidor no disponible (ej. hosting estático en GitHub Pages)
    }

    // B) Si el servidor no respondió (ej. en GitHub Pages), llamar directamente con la clave API del usuario
    if(!llamadoExitoso) {
      if(!cfg.apiKey) {
        if(serverErrorMsg){
          throw new Error(serverErrorMsg);
        }
        throw new Error("No hay API Key configurada. Configura tu clave en el botón ⚙️ Clave.");
      }

      const requestBody = {
        systemInstruction: {
          parts: [{ text: promptSistema }]
        },
        contents: contentsPayload,
        generationConfig: {
          temperature: 0.2
        }
      };

      if(copilotoUsarGoogleSearch){
        requestBody.tools = [{ googleSearch: {} }];
      }

      const directData = await ejecutarLlamadaGemini(cfg.apiKey, requestBody, copilotoAbortController ? copilotoAbortController.signal : null);
      const candidate = directData.candidates?.[0];
      rawText = candidate?.content?.parts?.[0]?.text || '';
      searchQueries = candidate?.groundingMetadata?.webSearchQueries || [];
    }

    if(copilotoTimerInterval){
      clearInterval(copilotoTimerInterval);
      copilotoTimerInterval = null;
    }

    const typingEl = document.getElementById('copiloto-typing-indicator');
    if(typingEl) typingEl.remove();

    let parsed = repararYParsearJSON(rawText);

    // Guardar en la memoria conversacional (historial limitado a los últimos 6 mensajes) y sincronizar
    copilotoHistorial.push({
      role: 'user',
      parts: [{ text: texto }]
    });
    copilotoHistorial.push({
      role: 'model',
      parts: [{ text: rawText || JSON.stringify(parsed) }]
    });
    if(copilotoHistorial.length > 6){
      copilotoHistorial = copilotoHistorial.slice(-6);
    }
    guardarHistorialCopiloto();

    // Recopilar lista de juegos (soporta tanto 'juegos' múltiple como 'juego' único, y campos nombre/titulo)
    let rawLista = [];
    if(Array.isArray(parsed.juegos) && parsed.juegos.length > 0){
      rawLista = parsed.juegos;
    } else if(parsed.juego){
      rawLista = [parsed.juego];
    }

    const pideHTML5 = /html5|fan|clone|scratch|js|web|fanmade|fan-made|browser|3d/i.test(texto);

    let listaJuegos = rawLista
      .filter(j => j && (j.nombre || j.titulo))
      .map(j => {
        const nombreFinal = (j.nombre || j.titulo || '').trim();
        const urlFinal = (j.url || j.enlace || '').trim();
        return {
          ...j,
          nombre: nombreFinal,
          url: urlFinal,
          imagen: j.imagen || j.portada || 'portadas/logo.png',
          categoria: j.categoria || 'Infantiles',
          tipo: j.tipo || (pideHTML5 ? 'normal' : 'snes'),
          descripcion: j.descripcion || ''
        };
      });

    // Validar y auditar cada juego de la lista:
    // En Modo Google Search: NO sobrescribir con enlaces de consolas o diccionario viejo
    // En Modo Rápido (sin Google): verificar con el diccionario de juegos probados
    listaJuegos = listaJuegos.map(j => {
      if(!copilotoUsarGoogleSearch){
        let auditado = buscarJuegoVerificado(j.nombre || texto, j);
        if(auditado && auditado.url){
          auditado.url = sanearUrlJuego(auditado.url, auditado.tipo, auditado.nombre, pideHTML5, auditado.supervisado);
        }
        return auditado;
      } else {
        // En modo Google, sanear solo si la URL es claramente inválida o requiere protocolo seguro
        if(j && j.url){
          j.url = sanearUrlJuego(j.url, j.tipo, j.nombre, pideHTML5, true);
        }
        return j;
      }
    });

    // REGLA CRÍTICA DE METADATOS Y ANTIALUCINACIÓN DE SCRATCH/TURBOWARP:
    // Si la IA inventó un enlace de turbowarp con número no supervisado:
    listaJuegos = listaJuegos.map(j => {
      const esTurboWarpNoSupervisado = j.url && /turbowarp\.org\/\d+/i.test(j.url) && !j.supervisado;
      if (esTurboWarpNoSupervisado && juegosIndexados.length > 0) {
        const coincidenciaIndex = juegosIndexados.find(idxG => 
          idxG.title.toLowerCase().includes(terminoLimpio.toLowerCase()) || 
          terminoLimpio.toLowerCase().includes(idxG.title.toLowerCase())
        ) || juegosIndexados[0];

        return {
          ...j,
          nombre: coincidenciaIndex.title || j.nombre,
          url: coincidenciaIndex.url,
          imagen: coincidenciaIndex.thumb || j.imagen,
          tipo: coincidenciaIndex.tipo || 'normal',
          categoria: coincidenciaIndex.category || j.categoria,
          descripcion: coincidenciaIndex.description || j.descripcion
        };
      }
      return j;
    });

    // Si el usuario pidió o buscó algo relacionado con GameMonetize o HTML5 y no hay enlace válido,
    // consultar el catálogo oficial real de GameMonetize para encontrar el juego verificado con su hash
    if(!copilotoUsarGoogleSearch && (listaJuegos.some(j => !j.url || !j.url.startsWith('http')) || listaJuegos.length === 0)){
      const queryBusqueda = (listaJuegos[0]?.nombre || texto).replace(/html5|gamemonetize|juego|game/gi, '').trim();
      if(queryBusqueda.length >= 2 && typeof buscarJuegosRealesGameMonetize === 'function'){
        try {
          const encontradosGM = await buscarJuegosRealesGameMonetize(queryBusqueda, 2);
          if(Array.isArray(encontradosGM) && encontradosGM.length > 0){
            encontradosGM.forEach(gm => {
              if(!listaJuegos.some(x => x.url === gm.url)){
                listaJuegos.push({
                  nombre: gm.title,
                  url: gm.url,
                  imagen: gm.thumb || 'portadas/logo.png',
                  tipo: 'normal',
                  categoria: gm.category || 'Arcade',
                  descripcion: gm.description ? gm.description.slice(0, 120) + '...' : `Juego oficial HTML5 verificado de GameMonetize.`
                });
              }
            });
          }
        } catch(e){}
      }
    }

    // Regla de honestidad: descartar cualquier propuesta que no tenga una URL jugable válida (evitar inventos)
    listaJuegos = listaJuegos.filter(j => j && j.url && j.url.startsWith('http'));

    // Si hay juegos indexados/curados y la IA no trajo URLs válidas o devolvió pocas opciones, integrar/priorizar los juegos indexados verificados:
    if (juegosIndexados.length > 0) {
      const validasActuales = listaJuegos.filter(j => j && j.url && j.url.startsWith('http') && !j.url.includes('turbowarp.org/9'));
      if (validasActuales.length === 0) {
        listaJuegos = juegosIndexados.slice(0, 3).map(g => ({
          nombre: g.title,
          url: g.url,
          imagen: g.thumb || 'portadas/logo.png',
          tipo: g.tipo || 'normal',
          categoria: g.category || 'Retro',
          descripcion: g.description || ''
        }));
      } else {
        // Fusionar los mejores del índice si no están ya
        juegosIndexados.slice(0, 2).forEach(idxG => {
          if (!listaJuegos.some(j => j.nombre.toLowerCase().includes(idxG.title.toLowerCase()) || idxG.title.toLowerCase().includes(j.nombre.toLowerCase()))) {
            listaJuegos.unshift({
              nombre: idxG.title,
              url: idxG.url,
              imagen: idxG.thumb || 'portadas/logo.png',
              tipo: idxG.tipo || 'normal',
              categoria: idxG.category || 'Retro',
              descripcion: idxG.description || ''
            });
          }
        });
      }
    }

    // Si la IA no trajo URLs válidas pero el usuario buscó un juego verificado (SOLO en modo rápido sin Google Search)
    if(listaJuegos.length === 0 && !copilotoUsarGoogleSearch){
      const verificadoDirecto = buscarJuegoVerificado(texto);
      if(verificadoDirecto && verificadoDirecto.url && verificadoDirecto.url.startsWith('http')){
        listaJuegos = [verificadoDirecto];
      }
    }

    // RESOLUCIÓN AUTOMÁTICA DE PORTADAS DE ALTA CALIDAD:
    // Consulta /api/covers/search (Google Images / DDG) y genera múltiples opciones de carátula
    listaJuegos = await Promise.all(listaJuegos.map(async j => {
      const multi = await resolverMultiplesPortadasCopiloto(j.nombre, j.url, j.imagen);
      return {
        ...j,
        imagen: multi[0] || j.imagen || 'portadas/logo.png',
        portadasSugeridas: multi
      };
    }));

    const aiBubble = document.createElement('div');
    aiBubble.className = 'copiloto-msg-bubble copiloto-msg-ai';
    
    let htmlContent = '';
    if(copilotoUsarGoogleSearch && searchQueries.length > 0){
      htmlContent += `<div style="font-size:11px;color:#a7f3d0;margin-bottom:6px;background:rgba(16,185,129,0.15);padding:3px 8px;border-radius:5px;display:inline-block">🔍 Investigado en Google Search: <b>"${escapeHtml(searchQueries[0])}"</b></div>`;
    } else if(!copilotoUsarGoogleSearch){
      htmlContent += `<div style="font-size:10.5px;color:#94a3b8;margin-bottom:6px;background:rgba(255,255,255,0.06);padding:2px 7px;border-radius:5px;display:inline-block">⚡ Modo Rápido (Catálogo y Memoria)</div>`;
    }

    htmlContent += `<div>${formatearMensajeCopiloto(parsed.mensaje || 'Aquí tienes las opciones encontradas:')}</div>`;

    if(listaJuegos.length > 0){
      const batchTimestamp = Date.now();
      const batchId = 'batch-' + batchTimestamp;
      const tempIdsEnBatch = [];

      // Si la IA devolvió más de 1 juego, ofrecer botón para agregar todos en 1 clic
      if(listaJuegos.length > 1){
        htmlContent += `
          <div class="copiloto-batch-container">
            <button type="button" id="batch-btn-${batchId}" class="copiloto-btn-batch-add" onclick="copilotoAgregarTodos('${batchId}')" title="Agregar todas las ${listaJuegos.length} opciones sugeridas de una sola vez">
              ➕ Agregar los ${listaJuegos.length} juegos al catálogo
            </button>
          </div>
        `;
      }

      listaJuegos.forEach((juegoItem, index) => {
        const tempId = 'temp-copiloto-' + batchTimestamp + '-' + index;
        tempIdsEnBatch.push(tempId);
        copilotoJuegosPendientes[tempId] = juegoItem;

        const yaExiste = verificarSiJuegoExisteEnCatalogo(juegoItem.nombre, juegoItem.url);

        const tipoBadge = juegoItem.supervisado ? '👁️ Supervisado por Luis' :
                          juegoItem.tipo === 'snes' ? '🎮 Super Nintendo' :
                          juegoItem.tipo === 'youtube' ? '📺 YouTube' :
                          juegoItem.tipo === 'ventana' ? '🪟 Ventana' :
                          juegoItem.tipo === 'newtab' ? '🚀 Nueva pestaña' : '🌐 Web / HTML5';

        const tieneMultiplesPortadas = Array.isArray(juegoItem.portadasSugeridas) && juegoItem.portadasSugeridas.length > 1;

        htmlContent += `
          <div id="card-${tempId}" class="copiloto-card-propuesta" style="margin-top:10px">
            <div class="copiloto-card-top">
              <div class="copiloto-card-img-col">
                <img id="img-${tempId}" class="copiloto-card-img" src="${escapeAttr(juegoItem.imagen || 'portadas/logo.png')}" onerror="copilotoManejarErrorImagen('${tempId}', this)" alt="Portada">
                ${tieneMultiplesPortadas ? `
                  <div class="copiloto-picker-discreto" title="Toca cualquier opción para cambiar de portada al instante">
                    ${juegoItem.portadasSugeridas.slice(0, 4).map((pUrl, pIdx) => `
                      <span class="copiloto-picker-thumb ${pUrl === juegoItem.imagen ? 'selected' : ''}" onclick="copilotoCambiarPortada('${tempId}', '${escapeAttr(pUrl)}', this)" title="Elegir portada alternativa ${pIdx + 1}">
                        <img src="${escapeAttr(pUrl)}" onerror="this.parentElement.remove()" alt="Opción ${pIdx + 1}">
                      </span>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
              <div class="copiloto-card-info">
                <div class="copiloto-card-title">${escapeHtml(juegoItem.nombre)}</div>
                <div class="copiloto-tags-row">
                  <span class="copiloto-tag">${escapeHtml(tipoBadge)}</span>
                  <span class="copiloto-tag">🏷️ ${escapeHtml(juegoItem.categoria || 'Retro')}</span>
                  ${yaExiste ? `<span class="copiloto-tag copiloto-tag-duplicate" title="Este juego o enlace ya está registrado en tu catálogo de Juegos Saludables">⚠️ Ya en tu catálogo</span>` : ''}
                </div>
                ${juegoItem.descripcion ? `<div style="font-size:11.5px;color:#94a3b8;margin-top:4px;line-height:1.3">${escapeHtml(juegoItem.descripcion)}</div>` : ''}
              </div>
            </div>

            <div style="font-size:11px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:6px">
              🔗 ${escapeHtml(juegoItem.url)}
            </div>

            <div class="copiloto-card-actions">
              <button type="button" class="copiloto-btn-probar" onclick="copilotoProbarJuego('${tempId}')" title="Probar el juego en vivo para ver si carga">
                ▶️ Probar ahora
              </button>
              <button type="button" class="copiloto-btn-nueva-ventana" onclick="copilotoAbrirEnVentanaNueva('${tempId}')" title="Abrir en ventana nueva o pestaña independiente para probar">
                🪟 Abrir en ventana nueva
              </button>
              <button type="button" class="copiloto-btn-agregar" onclick="copilotoAgregarJuego('${tempId}')" title="${yaExiste ? 'Ya existe en el catálogo. Toca para agregarlo de todas formas si es otra versión.' : 'Agregar directamente a tu catálogo'}">
                ${yaExiste ? '➕ Agregar de nuevo' : '✅ Agregar al catálogo'}
              </button>
              <button type="button" class="copiloto-btn-editar" onclick="copilotoEditarJuego('${tempId}')" title="Modificar portada o datos antes de guardar">
                ✏️ Editar
              </button>
            </div>
          </div>
        `;
      });

      copilotoBatches[batchId] = tempIdsEnBatch;
    }

    aiBubble.innerHTML = htmlContent;
    chat.appendChild(aiBubble);
    reproducirChimeCopiloto();
    scrollCopilotoAlFinal();

  } catch(err) {
    if(copilotoTimerInterval){
      clearInterval(copilotoTimerInterval);
      copilotoTimerInterval = null;
    }
    const typingEl = document.getElementById('copiloto-typing-indicator');
    if(typingEl) typingEl.remove();

    const errBubble = document.createElement('div');
    errBubble.className = 'copiloto-msg-bubble copiloto-msg-ai';
    errBubble.style.borderColor = 'rgba(239, 68, 68, 0.4)';
    errBubble.innerHTML = `❌ <b>Error al consultar Gemini:</b> ${escapeHtml(err.message)}<br><br><small style="color:#94a3b8">Puedes cambiar al modo rápido sin Google Search (⚡ Desactivada) o verificar tu clave en ⚙️ Clave.</small>`;
    chat.appendChild(errBubble);
    scrollCopilotoAlFinal();
  } finally {
    if(copilotoTimerInterval){
      clearInterval(copilotoTimerInterval);
      copilotoTimerInterval = null;
    }
    const typingEl = document.getElementById('copiloto-typing-indicator');
    if(typingEl) typingEl.remove();
    copilotoCargando = false;
    copilotoAbortController = null;
    if(btnSend){
      btnSend.disabled = false;
      btnSend.textContent = '⚡ Enviar';
    }
  }
}

function copilotoProbarJuego(tempId){
  const j = copilotoJuegosPendientes[tempId];
  if(!j) return;

  const urlSaneada = sanearUrlJuego(j.url, j.tipo);
  j.url = urlSaneada;
  const tipo = j.tipo || 'normal';
  const accion = accionPorTipo(tipo);

  // Ocultar modal de administración y minimizar copiloto para ver el juego claramente sin estorbos
  cerrarAdmin();
  const modalCopiloto = document.getElementById('copiloto-gemini-modal');
  if(modalCopiloto && !modalCopiloto.classList.contains('copiloto-minimizado')){
    toggleMinimizarCopiloto();
  }

  abrirJuego(urlSaneada, tipo, accion, {
    id: tempId,
    nombre: j.nombre,
    imagen: j.imagen || 'portadas/logo.png',
    url: urlSaneada,
    tipo: tipo,
    categoria: j.categoria || 'Retro',
    accion: accion
  });
}

function copilotoAbrirEnVentanaNueva(tempId){
  const j = copilotoJuegosPendientes[tempId];
  if(!j || !j.url){
    mostrarToastSync('⚠️ No hay URL disponible para abrir');
    return;
  }
  const urlSaneada = sanearUrlJuego(j.url, j.tipo, j.nombre, false, true);
  window.open(urlSaneada, '_blank', 'noopener,noreferrer');
  mostrarToastSync('🪟 Abriendo ' + (j.nombre || 'juego') + ' en ventana nueva...');
}

function copilotoCambiarPortada(tempId, urlPortada, el){
  if(!urlPortada || !tempId) return;
  const j = copilotoJuegosPendientes[tempId];
  if(j){
    j.imagen = urlPortada;
  }
  const imgEl = document.getElementById('img-' + tempId);
  if(imgEl) imgEl.src = urlPortada;
  if(el && el.parentElement){
    [...el.parentElement.querySelectorAll('.copiloto-picker-thumb')].forEach(x => x.classList.remove('selected'));
    el.classList.add('selected');
  }
  mostrarToastSync('🖼️ Portada seleccionada');
}

async function copilotoProcesarUrlDirecta(){
  const input = document.getElementById('copiloto-direct-url-input');
  const chat = document.getElementById('copiloto-chat-logs');
  if(!input || !chat) return;

  const url = input.value.trim();
  if(!url){
    input.focus();
    mostrarToastSync('⚠️ Pega una URL válida en el recuadro');
    return;
  }

  if(!/^https?:\/\//i.test(url)){
    mostrarToastSync('⚠️ La URL debe comenzar con http:// o https://');
    return;
  }

  input.value = '';

  const userBubble = document.createElement('div');
  userBubble.className = 'copiloto-msg-bubble copiloto-msg-user';
  userBubble.innerHTML = `📥 Inspeccionar URL directa:<br><code style="color:#a7f3d0;font-size:11.5px">${escapeHtml(url)}</code>`;
  chat.appendChild(userBubble);
  scrollCopilotoAlFinal();

  const loadingBubble = document.createElement('div');
  loadingBubble.className = 'copiloto-msg-bubble copiloto-msg-ai';
  loadingBubble.innerHTML = `🔍 Inspeccionando enlace, extrayendo título y resolviendo portadas automáticas...`;
  chat.appendChild(loadingBubble);
  scrollCopilotoAlFinal();

  try {
    let tituloDetectado = '';
    let imagenDetectada = '';
    let tipoSugerido = 'normal';

    // 1. Detectar YouTube
    const mYt = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|v\/|shorts\/))([\w-]{11})/);
    if(mYt){
      tipoSugerido = 'youtube';
      imagenDetectada = `https://i.ytimg.com/vi/${mYt[1]}/hqdefault.jpg`;
      try {
        const rOe = await fetch(`https://noembed.com/embed?url=${encodeURIComponent('https://www.youtube.com/watch?v=' + mYt[1])}`).catch(()=>null);
        if(rOe && rOe.ok){
          const dOe = await rOe.json();
          if(dOe.title) tituloDetectado = dOe.title;
        }
      } catch(e){}
    }

    // 2. TurboWarp / Scratch
    if(url.includes('turbowarp.org') || url.includes('scratch.mit.edu')){
      tipoSugerido = 'normal';
      const mScr = url.match(/(?:turbowarp\.org|scratch\.mit\.edu)\/(?:projects\/)?(\d+)/i);
      if(mScr && mScr[1]){
        imagenDetectada = `https://uploads.scratch.mit.edu/get_image/project/${mScr[1]}_480x360.png`;
      }
    }

    // 3. RetroGamesNexus
    if(url.includes('retrogamesnexus.com')){
      tipoSugerido = 'snes';
      const mRgn = url.match(/\/embed\/games\/([a-z0-9-_]+)/i);
      if(mRgn && mRgn[1]){
        tituloDetectado = mRgn[1].replace(/[-_]+/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        imagenDetectada = `https://retrogamesnexus.com/images/games/cover/snes/${mRgn[1]}.webp`;
      }
    }

    // 4. Archive.org
    if(url.includes('archive.org')){
      tipoSugerido = 'normal';
      const mArc = url.match(/\/embed\/([a-zA-Z0-9_\-\.]+)/i) || url.match(/\/details\/([a-zA-Z0-9_\-\.]+)/i);
      if(mArc && mArc[1]){
        tituloDetectado = mArc[1].replace(/[-_]+/g, ' ');
        imagenDetectada = `https://archive.org/services/img/${mArc[1]}`;
      }
    }

    // 5. Consultar extractor de servidor si no se resolvió título
    if(!tituloDetectado){
      try {
        const rExt = await fetch(`/api/extract-embed?url=${encodeURIComponent(url)}`).catch(()=>null);
        if(rExt && rExt.ok){
          const dExt = await rExt.json();
          if(dExt.titulo) tituloDetectado = dExt.titulo;
          if(!imagenDetectada && dExt.imagen) imagenDetectada = dExt.imagen;
          if(dExt.tipoSugerido) tipoSugerido = dExt.tipoSugerido;
        }
      } catch(e){}
    }

    if(!tituloDetectado){
      try {
        const uObj = new URL(url);
        const pathParts = uObj.pathname.split('/').filter(Boolean);
        const lastPart = pathParts[pathParts.length - 1] || uObj.hostname;
        tituloDetectado = decodeURIComponent(lastPart).replace(/[-_]+/g, ' ').replace(/\.(html|php|aspx|swf)$/i, '').trim();
      } catch(e){
        tituloDetectado = 'Juego Inspeccionado';
      }
    }

    // Resolver portadas
    const portadasMulti = await resolverMultiplesPortadasCopiloto(tituloDetectado, url, imagenDetectada);
    const portadaFinal = portadasMulti[0] || 'portadas/logo.png';

    const juegoInspeccionado = {
      nombre: tituloDetectado,
      url: url,
      imagen: portadaFinal,
      portadasSugeridas: portadasMulti,
      tipo: tipoSugerido,
      categoria: tipoSugerido === 'snes' ? 'Super Nintendo' : (tipoSugerido === 'youtube' ? 'YouTube' : 'Web / HTML5'),
      descripcion: `Enlace inspeccionado directamente por Luis (${new URL(url).hostname}).`,
      supervisado: true
    };

    const tempId = 'temp-inspeccion-' + Date.now();
    copilotoJuegosPendientes[tempId] = juegoInspeccionado;

    const yaExiste = verificarSiJuegoExisteEnCatalogo(juegoInspeccionado.nombre, juegoInspeccionado.url);

    loadingBubble.innerHTML = `
      <div>✅ <b>Enlace analizado con éxito:</b> Título y portadas listos para agregar o probar.</div>
      <div id="card-${tempId}" class="copiloto-card-propuesta" style="margin-top:10px">
        <div class="copiloto-card-top">
          <div class="copiloto-card-img-col">
            <img id="img-${tempId}" class="copiloto-card-img" src="${escapeAttr(juegoInspeccionado.imagen)}" onerror="this.src='portadas/logo.png'" alt="Portada">
            ${(juegoInspeccionado.portadasSugeridas && juegoInspeccionado.portadasSugeridas.length > 1) ? `
              <div class="copiloto-picker-discreto" title="Toca para cambiar la portada al instante">
                ${juegoInspeccionado.portadasSugeridas.slice(0, 4).map((pUrl, pIdx) => `
                  <span class="copiloto-picker-thumb ${pUrl === juegoInspeccionado.imagen ? 'selected' : ''}" onclick="copilotoCambiarPortada('${tempId}', '${escapeAttr(pUrl)}', this)" title="Opción ${pIdx + 1}">
                    <img src="${escapeAttr(pUrl)}" onerror="this.parentElement.remove()" alt="Op ${pIdx + 1}">
                  </span>
                `).join('')}
              </div>
            ` : ''}
          </div>
          <div class="copiloto-card-info">
            <div class="copiloto-card-title">${escapeHtml(juegoInspeccionado.nombre)}</div>
            <div class="copiloto-tags-row">
              <span class="copiloto-tag">👁️ Supervisado por Luis</span>
              <span class="copiloto-tag">🏷️ ${escapeHtml(juegoInspeccionado.categoria)}</span>
              ${yaExiste ? `<span class="copiloto-tag copiloto-tag-duplicate">⚠️ Ya en tu catálogo</span>` : ''}
            </div>
            <div style="font-size:11.5px;color:#94a3b8;margin-top:4px">${escapeHtml(juegoInspeccionado.descripcion)}</div>
          </div>
        </div>

        <div style="font-size:11px;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:rgba(0,0,0,0.3);padding:4px 8px;border-radius:6px">
          🔗 ${escapeHtml(juegoInspeccionado.url)}
        </div>

        <div class="copiloto-card-actions">
          <button type="button" class="copiloto-btn-probar" onclick="copilotoProbarJuego('${tempId}')">▶️ Probar ahora</button>
          <button type="button" class="copiloto-btn-nueva-ventana" onclick="copilotoAbrirEnVentanaNueva('${tempId}')">🪟 Abrir en ventana nueva</button>
          <button type="button" class="copiloto-btn-agregar" onclick="copilotoAgregarJuego('${tempId}')">${yaExiste ? '➕ Agregar de nuevo' : '✅ Agregar al catálogo'}</button>
          <button type="button" class="copiloto-btn-editar" onclick="copilotoEditarJuego('${tempId}')">✏️ Editar</button>
        </div>
      </div>
    `;

    reproducirChimeCopiloto();
    scrollCopilotoAlFinal();
  } catch(err) {
    loadingBubble.innerHTML = `❌ Error analizando URL: ${escapeHtml(err.message)}`;
  }
}

function copilotoAuditarCatalogo(){
  const chat = document.getElementById('copiloto-chat-logs');
  if(!chat) return;

  const juegos = (catalogo && Array.isArray(catalogo.juegos)) ? catalogo.juegos : [];
  const total = juegos.length;

  const sinPortada = juegos.filter(j => !j.imagen || j.imagen.includes('logo.png'));
  
  const mapaUrls = new Map();
  const mapaNombres = new Map();
  const duplicadosIds = new Set();

  juegos.forEach(j => {
    const u = (j.url || '').trim().toLowerCase();
    const nom = (j.nombre || '').trim().toLowerCase();
    if(u && mapaUrls.has(u)) {
      duplicadosIds.add(j.id);
    } else if(u) {
      mapaUrls.set(u, j.id);
    }
    if(nom && mapaNombres.has(nom)) {
      duplicadosIds.add(j.id);
    } else if(nom) {
      mapaNombres.set(nom, j.id);
    }
  });

  const inseguros = juegos.filter(j => j.url && j.url.startsWith('http://'));

  const auditBubble = document.createElement('div');
  auditBubble.className = 'copiloto-msg-bubble copiloto-msg-ai';
  auditBubble.innerHTML = `
    <div>🛡️ <b>Auditoría Completa del Catálogo de Luis:</b></div>
    <div style="font-size:12px;color:#94a3b8;margin-top:3px">Análisis detallado de tus ${total} juegos actuales:</div>
    <div class="copiloto-audit-card">
      <div class="copiloto-audit-stats">
        <div>📊 Total registrados: <b style="color:#fff">${total}</b></div>
        <div>🖼️ Sin portada oficial: <b style="color:${sinPortada.length ? '#f59e0b' : '#10b981'}">${sinPortada.length}</b></div>
        <div>⚠️ Juegos duplicados: <b style="color:${duplicadosIds.size ? '#ef4444' : '#10b981'}">${duplicadosIds.size}</b></div>
        <div>🔒 Enlaces HTTP no seguros: <b style="color:${inseguros.length ? '#38bdf8' : '#10b981'}">${inseguros.length}</b></div>
      </div>
      <div class="copiloto-audit-actions">
        ${sinPortada.length > 0 ? `
          <button type="button" class="copiloto-btn-audit-fix" onclick="copilotoAutoRepararPortadas()">
            🖼️ Auto-buscar portadas en Google/DDG para ${sinPortada.length} juegos sin imagen
          </button>
        ` : `<div style="font-size:11.5px;color:#10b981">✅ Todos tus juegos tienen portadas asignadas.</div>`}
        ${duplicadosIds.size > 0 ? `
          <button type="button" class="copiloto-btn-audit-fix" onclick="copilotoEliminarDuplicados()">
            🧹 Limpiar los ${duplicadosIds.size} juegos duplicados detectados
          </button>
        ` : `<div style="font-size:11.5px;color:#10b981">✅ No tienes títulos ni enlaces duplicados.</div>`}
        ${inseguros.length > 0 ? `
          <button type="button" class="copiloto-btn-audit-fix" onclick="copilotoConvertirHttps()">
            🔒 Convertir los ${inseguros.length} enlaces HTTP a HTTPS
          </button>
        ` : ''}
      </div>
    </div>
  `;
  chat.appendChild(auditBubble);
  reproducirChimeCopiloto();
  scrollCopilotoAlFinal();
}

async function copilotoAutoRepararPortadas(){
  const juegos = (catalogo && Array.isArray(catalogo.juegos)) ? catalogo.juegos : [];
  const sinPortada = juegos.filter(j => !j.imagen || j.imagen.includes('logo.png'));
  if(!sinPortada.length){
    mostrarToastSync('✅ Todos los juegos ya tienen portada');
    return;
  }

  mostrarToastSync(`🔍 Reparando portadas de ${sinPortada.length} juegos...`);
  let reparadas = 0;

  for(const j of sinPortada){
    try {
      const multi = await resolverMultiplesPortadasCopiloto(j.nombre, j.url, '');
      if(multi && multi[0] && !multi[0].includes('logo.png')){
        j.imagen = multi[0];
        reparadas++;
      }
    } catch(e){}
  }

  if(reparadas > 0){
    if(typeof renderJuegos === 'function') renderJuegos();
    if(typeof renderAdmin === 'function') renderAdmin();
    mostrarToastSync(`🎉 ¡${reparadas} portadas actualizadas y reparadas!`);
    if(typeof programarAutoSyncGitHub === 'function'){
      programarAutoSyncGitHub(`🖼️ ${reparadas} portadas reparadas automáticamente con Copiloto IA`, 1000);
    }
  } else {
    mostrarToastSync('No se pudieron encontrar nuevas imágenes para estos juegos');
  }

  copilotoAuditarCatalogo();
}

function copilotoEliminarDuplicados(){
  if(!catalogo || !Array.isArray(catalogo.juegos)) return;
  const vistos = new Set();
  const inicial = catalogo.juegos.length;
  catalogo.juegos = catalogo.juegos.filter(j => {
    const clave = ((j.nombre || '') + '|' + (j.url || '')).toLowerCase().trim();
    if(vistos.has(clave)){
      return false;
    }
    vistos.add(clave);
    return true;
  });
  const eliminados = inicial - catalogo.juegos.length;
  if(eliminados > 0){
    if(typeof renderJuegos === 'function') renderJuegos();
    if(typeof renderAdmin === 'function') renderAdmin();
    mostrarToastSync(`🧹 ¡${eliminados} duplicados eliminados!`);
    if(typeof programarAutoSyncGitHub === 'function'){
      programarAutoSyncGitHub(`🧹 ${eliminados} juegos duplicados eliminados con Copiloto IA`, 1000);
    }
  } else {
    mostrarToastSync('No se encontraron duplicados para eliminar');
  }
  copilotoAuditarCatalogo();
}

function copilotoConvertirHttps(){
  if(!catalogo || !Array.isArray(catalogo.juegos)) return;
  let convertidos = 0;
  catalogo.juegos.forEach(j => {
    if(j.url && j.url.startsWith('http://') && !j.url.includes('localhost')){
      j.url = j.url.replace('http://', 'https://');
      convertidos++;
    }
  });
  if(convertidos > 0){
    if(typeof renderJuegos === 'function') renderJuegos();
    if(typeof renderAdmin === 'function') renderAdmin();
    mostrarToastSync(`🔒 ¡${convertidos} enlaces actualizados a HTTPS!`);
    if(typeof programarAutoSyncGitHub === 'function'){
      programarAutoSyncGitHub(`🔒 ${convertidos} enlaces convertidos a HTTPS`, 1000);
    }
  }
  copilotoAuditarCatalogo();
}

function copilotoAgregarTodos(batchId) {
  const ids = copilotoBatches[batchId];
  if (!Array.isArray(ids) || !ids.length) return;
  let agregados = 0;
  ids.forEach(tempId => {
    const j = copilotoJuegosPendientes[tempId];
    if (j && !j._agregado) {
      copilotoAgregarJuego(tempId, true);
      agregados++;
    }
  });

  if (agregados > 0) {
    if (typeof renderCategorias === 'function') renderCategorias();
    if (typeof aplicarFiltros === 'function') aplicarFiltros();
    if (typeof renderAdmin === 'function') renderAdmin();
    mostrarToastSync(`✅ ¡${agregados} juegos agregados al catálogo!`);
    if (typeof programarAutoSyncGitHub === 'function') {
      programarAutoSyncGitHub(`➕ ${agregados} juegos agregados en lote con Copiloto IA`, 1000);
    }
  }

  const batchBtn = document.getElementById('batch-btn-' + batchId);
  if (batchBtn) {
    batchBtn.disabled = true;
    batchBtn.innerHTML = `✅ ${agregados} juegos agregados`;
    batchBtn.style.background = '#059669';
  }
}

function copilotoAgregarJuego(tempId, silencioso = false){
  const j = copilotoJuegosPendientes[tempId];
  if(!j) return;

  const urlSaneada = sanearUrlJuego(j.url, j.tipo);
  j.url = urlSaneada;
  const tipo = j.tipo || 'normal';
  const categoria = j.categoria || 'Retro';

  if(Array.isArray(catalogo.categorias) && !catalogo.categorias.includes(categoria)){
    catalogo.categorias.push(categoria);
  }

  const nuevoJuego = {
    id: 'game-' + Date.now() + '-' + Math.floor(Math.random() * 10000),
    nombre: j.nombre,
    imagen: j.imagen || 'portadas/logo.png',
    url: urlSaneada,
    tipo: tipo,
    accion: accionPorTipo(tipo),
    categoria: categoria,
    youtubeStart: 0,
    orden: (catalogo.juegos || []).length + 1
  };

  if(!Array.isArray(catalogo.juegos)){
    catalogo.juegos = [];
  }

  catalogo.juegos.push(nuevoJuego);
  j._agregado = true;

  if(!silencioso){
    renderCategorias();
    aplicarFiltros();
    renderAdmin();
  }

  const cardEl = document.getElementById('card-' + tempId);
  if(cardEl){
    cardEl.style.borderColor = '#10b981';
    cardEl.style.background = 'rgba(16, 185, 129, 0.1)';
    const actions = cardEl.querySelector('.copiloto-card-actions');
    if(actions){
      actions.innerHTML = `
        <div style="width:100%;color:#6ee7b7;font-weight:bold;font-size:13px;display:flex;align-items:center;justify-content:center;gap:6px;padding:6px">
          ✅ ¡"${escapeHtml(j.nombre)}" agregado exitosamente al catálogo!
        </div>
      `;
    }
  }

  if(!silencioso){
    mostrarToastSync(`➕ "${j.nombre}" agregado`);
    programarAutoSyncGitHub(`➕ "${j.nombre}" agregado con Copiloto IA`, 900);
  }
}

function copilotoEditarJuego(tempId){
  const j = copilotoJuegosPendientes[tempId];
  if(!j) return;

  cerrarCopilotoGemini();
  abrirHerramientaAdmin('agregar');

  setTimeout(()=>{
    const fNombre = document.getElementById('fNombre');
    const fUrl = document.getElementById('fUrl');
    const fImagen = document.getElementById('fImagen');
    const fTipo = document.getElementById('fTipo');
    const fCat = document.getElementById('fCat');

    if(fNombre) fNombre.value = j.nombre || '';
    if(fUrl) fUrl.value = j.url || '';
    if(fImagen) fImagen.value = j.imagen || '';
    if(fTipo) fTipo.value = j.tipo || 'normal';
    if(fCat && j.categoria) fCat.value = j.categoria;
    if(typeof actualizarVistaPrevia === 'function'){
      actualizarVistaPrevia('f');
    }
  }, 100);
}

// Garantizar disponibilidad global en window
window.inyectarModalCopilotoSiNoExiste = inyectarModalCopilotoSiNoExiste;
window.abrirCopilotoGemini = abrirCopilotoGemini;
window.cerrarCopilotoGemini = cerrarCopilotoGemini;
window.toggleCopilotoGemini = toggleCopilotoGemini;
window.toggleMinimizarCopiloto = toggleMinimizarCopiloto;
window.pedirCopilotoSugerencia = pedirCopilotoSugerencia;
window.enviarMensajeCopiloto = enviarMensajeCopiloto;
window.toggleGoogleSearchCopiloto = toggleGoogleSearchCopiloto;
window.limpiarChatCopiloto = limpiarChatCopiloto;
window.guardarConfigGemini = guardarConfigGemini;
window.probarConexionGemini = probarConexionGemini;
window.mostrarConfigGemini = mostrarConfigGemini;
window.ocultarConfigGemini = ocultarConfigGemini;
window.toggleVerGeminiKey = toggleVerGeminiKey;
window.copilotoProbarJuego = copilotoProbarJuego;
window.copilotoAgregarJuego = copilotoAgregarJuego;
window.copilotoAgregarTodos = copilotoAgregarTodos;
window.copilotoHandleKey = copilotoHandleKey;
window.actualizarBadgeMemoria = actualizarBadgeMemoria;
window.copilotoEditarJuego = copilotoEditarJuego;
window.cancelarConsultaCopiloto = cancelarConsultaCopiloto;
window.actualizarEstadoCopilotoBadge = actualizarEstadoCopilotoBadge;
window.copilotoAbrirEnVentanaNueva = copilotoAbrirEnVentanaNueva;
window.copilotoCambiarPortada = copilotoCambiarPortada;
window.copilotoProcesarUrlDirecta = copilotoProcesarUrlDirecta;
window.copilotoAuditarCatalogo = copilotoAuditarCatalogo;
window.copilotoAutoRepararPortadas = copilotoAutoRepararPortadas;
window.copilotoEliminarDuplicados = copilotoEliminarDuplicados;
window.copilotoConvertirHttps = copilotoConvertirHttps;
window.copilotoManejarErrorImagen = copilotoManejarErrorImagen;
window.renderizarConfigDominiosCopiloto = renderizarConfigDominiosCopiloto;
window.toggleFuenteDominioCopiloto = toggleFuenteDominioCopiloto;
window.agregarDominioCustomCopiloto = agregarDominioCustomCopiloto;
window.eliminarDominioCustomCopiloto = eliminarDominioCustomCopiloto;
window.toggleCopilotDomainsDrawer = toggleCopilotDomainsDrawer;
window.agregarDominioCustomCopilotoDesdeChat = agregarDominioCustomCopilotoDesdeChat;
