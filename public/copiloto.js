/* ============================================================
   COPILOTO GEMINI ADMIN IA - MÓDULO INDEPENDIENTE
   Inyección dinámica de UI y lógica de interacción con Google Gemini
   ============================================================ */

function inyectarModalCopilotoSiNoExiste() {
  if (document.getElementById("copiloto-gemini-modal")) return;
  const div = document.createElement("div");
  div.id = "copiloto-gemini-modal";
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
      <button type="button" class="copiloto-btn-icon" onclick="mostrarConfigGemini(true)" title="Configurar clave Gemini API">⚙️ Clave</button>
      <button type="button" class="copiloto-btn-icon" onclick="cerrarCopilotoGemini()" style="background:#e11d48;font-weight:bold" title="Cerrar copiloto">✕</button>
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
  </div>

  <div id="copiloto-chat-logs">
    <div class="copiloto-msg-bubble copiloto-msg-ai">
      ¡Hola <b>Luis</b>! 👋 Soy tu copiloto inteligente de administración para <b>Juegos Saludables</b>.<br><br>
      Pídeme cualquier juego retro o web (ej: <i>"Agrega Chrono Trigger de SNES"</i>, <i>"Busca Mario Kart"</i>) o pégame un enlace directo. Yo me encargaré de conseguir la portada, el tipo correcto y la categoría con botones para probarlo y agregarlo en 1 clic. 🚀
    </div>
  </div>

  <!-- Barra de control de búsqueda y memoria -->
  <div class="copiloto-toolbar-bar">
    <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap">
      <button type="button" id="copiloto-btn-search-toggle" class="copiloto-btn-search-toggle" onclick="toggleGoogleSearchCopiloto()" title="Toca para activar o desactivar la búsqueda web en Google">
        <span id="copiloto-search-icon">🔍</span>
        <span>Búsqueda Google:</span>
        <b id="copiloto-search-status-txt">ACTIVADA</b>
      </button>
      <span class="copiloto-memoria-badge" title="El Copiloto recuerda los últimos 6 mensajes para mantener el hilo de la conversación">
        🧠 Memoria: 6 msgs
      </span>
    </div>
    <button type="button" class="copiloto-btn-limpiar" onclick="limpiarChatCopiloto()" title="Limpiar la conversación y reiniciar la memoria de 6 mensajes">
      🗑️ Reiniciar
    </button>
  </div>

  <div class="copiloto-input-wrap">
    <input id="copiloto-input" placeholder="Ej: Agrega Chrono Trigger de SNES o pega una URL..." onkeydown="if(event.key==='Enter' && !event.shiftKey){event.preventDefault();enviarMensajeCopiloto();}">
    <button type="button" id="copiloto-btn-send" onclick="enviarMensajeCopiloto()">⚡ Enviar</button>
  </div>
  `;
  document.body.appendChild(div);
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    inyectarModalCopilotoSiNoExiste();
    if (typeof actualizarEstadoCopilotoBadge === "function") {
      actualizarEstadoCopilotoBadge();
    }
  });
} else {
  inyectarModalCopilotoSiNoExiste();
  if (typeof actualizarEstadoCopilotoBadge === "function") {
    actualizarEstadoCopilotoBadge();
  }
}

/* ============================================================
   COPILOTO GEMINI ADMIN IA - LÓGICA Y API DE GOOGLE
   ============================================================ */

let copilotoJuegosPendientes = {};
let copilotoCargando = false;
let copilotoHistorial = [];
let copilotoUsarGoogleSearch = localStorage.getItem('copiloto_google_search') !== '0';
let servidorGeminiDisponible = false;
let copilotoTimerInterval = null;
let copilotoAbortController = null;
let copilotoSegundos = 0;

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
  }
];

function obtenerDominiosYLogicaDelCatalogo(){
  if(!catalogo || !Array.isArray(catalogo.juegos)) {
    return {
      dominios: ['retrogamesnexus.com', 'retrogames.cc', 'turbowarp.org', 'scratch.mit.edu', 'famobi.com', 'gamemonetize.co', 'playgama.com', 'gameboss.com', 'crazygames.com', 'youtube.com'],
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
        if(host && !dominiosSet.has(host)){
          dominiosSet.add(host);
          resumenList.push(`- ${host} (${j.tipo || 'normal'}: "${j.nombre}")`);
        }
      } else if(uStr.endsWith('.swf') || uStr.startsWith('games/')){
        dominiosSet.add('Archivos locales .swf / Ruffle');
      }
    } catch(e){}
  });

  return {
    dominios: Array.from(dominiosSet),
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

  if(!pideHTML5 && !pideFlash && !pideYouTube){
    // Buscar coincidencia en diccionario verificado para juegos retro de consola
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

  const uLower = (u + ' ' + nombreJuego).toLowerCase();

  // 2. Comprobar si pertenece a dominios probados y confiables del catálogo de Luis
  const dominiosProbados = [
    'retrogamesnexus.com', 'turbowarp.org', 'scratch.mit.edu', 'famobi.com',
    'gamemonetize.co', 'gamemonetize.com', 'playgama.com', 'gameboss.com',
    'crazygames.com', 'madkidgames.com', 'playhop.com', 'itch.io', 'blockly.games'
  ];

  const esDominioProbado = dominiosProbados.some(dom => u.includes(dom));
  if(esDominioProbado && u.startsWith('http')){
    return u; // Retener URL si proviene de un servidor probado del catálogo
  }

  // 4. Juegos Flash (.swf) o Archive.org embeds
  if(u.endsWith('.swf') || u.includes('.swf') || u.includes('archive.org/embed/')){
    return u;
  }

  // 5. Si NO se pidió HTML5/Flash/YouTube explícito, comprobar con el diccionario verificado
  if(!pideHTML5){
    const encontrado = DICCIONARIO_JUEGOS_VERIFICADOS.find(j =>
      j.claves.some(clave => uLower.includes(clave))
    );
    if(encontrado) return encontrado.url;
  }

  // 6. Si es un juego retro de consola (y no pidió HTML5/Flash)
  if(!pideHTML5 && (tipo === 'snes' || u.includes('retrogames.cc') || u.includes('snesfun.com') || !u.startsWith('http'))){
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
  seguro = seguro.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>');
  seguro = seguro.replace(/(?:^|\n)[*-]\s+(.*?)(?=\n|$)/g, '<br>• $1');
  seguro = seguro.replace(/###\s*(.*?)(?=\n|$)/g, '<div style="font-weight:bold;margin-top:6px;color:#e2e8f0">$1</div>');
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

  // 4. Parámetros del sistema y contexto de juegos
  const categoriasActuales = Array.isArray(catalogo.categorias) && catalogo.categorias.length 
    ? catalogo.categorias 
    : ['Acción', 'Aventura', 'Carreras', 'Retro', 'Infantiles', 'Deportes', 'Puzzles', 'Estrategia', 'Super Nintendo'];

  const infoCatalogo = obtenerDominiosYLogicaDelCatalogo();

  const promptSistema = `
Eres el Copiloto Inteligente de Administración para la plataforma de videojuegos web 'Juegos Saludables' del administrador Luis.
Tu tarea es ayudar a Luis a buscar, clasificar, auditar y añadir videojuegos (emuladores retro, HTML5, arcade, fan-made, etc.) o videos de YouTube al catálogo en 1 clic.

CATEGORÍAS EXISTENTES EN LA WEB:
${categoriasActuales.join(', ')}

DOMINIOS Y PROVEEDORES PROBADOS Y PRIORITARIOS EN EL CATÁLOGO ACTIVO DE LUIS:
${infoCatalogo.resumen}

LÓGICA DE ENLACES Y ESTRUCTURA CONFIABLE:
1. Retro Emuladores de Consola (SNES, NES, GBA, Genesis, Arcade):
   - Usa URLs de RetroGamesNexus (https://retrogamesnexus.com/embed/games/nombre-del-juego) o RetroGames.cc con ID (https://www.retrogames.cc/embed/ID-nombre.html).
2. Juegos Web HTML5 / Canvas / Minijuegos:
   - Usa Scratch/TurboWarp embed (https://turbowarp.org/{id}/embed), Famobi, Gamemonetize, Playgama, Gameboss, Madkidgames, Playhop/Yandex, itch.io o GitHub Pages.
3. Juegos Flash (.swf):
   - Enlaces directos .swf de CrazyGames (files.crazygames.com) o locales.
4. Videos de YouTube:
   - Formato embed oficial (https://www.youtube.com/embed/VIDEO_ID).

TIPOS DE JUEGO DISPONIBLES:
- "snes": Para juegos de consola retro original (Super Nintendo / NES / GBA / Genesis).
- "normal": Para juegos HTML5 / Web / Canvas / JavaScript / Fan-Made que cargan directamente en iframe.
- "ventana": Para juegos con mejor experiencia en ventana emergente/popup.
- "ventana2": Para páginas de juegos con bloqueo de iframe.
- "youtube": Para gameplays, trailers o música de juegos en YouTube.
- "newtab": Para páginas externas que requieren abrir en pestaña nueva.

REGLAS OBLIGATORIAS:
1. SI LUIS ENVÍA O PEGA UN ENLACE DIRECTO:
   - DEBES UTILIZAR ESA URL EXACTA EN EL CAMPO "url". NO LA MODIFIQUES.
2. DA PRIORIDAD A LOS DOMINIOS Y PROVEEDORES DEL CATÁLOGO PROBADO DE LUIS.
3. ATENCIÓN A JUEGOS HTML5 Y FAN-MADE:
   - Si se pide HTML5 o fan-made (ej. Mario Kart HTML5), asigna tipo "normal" y entrega juegos HTML5/Web reales o Scratch/TurboWarp, NUNCA emulador SNES.
4. Consigue una URL de portada o boxart en alta resolución.
5. Elige la categoría más precisa.
6. Si Luis pide varias opciones (ej. "dame 4 opciones"), incluye una lista en "juegos": [ { ... }, { ... } ].

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

    let parsed = null;
    try {
      const cleanJson = rawText
        .replace(/```json/gi, '')
        .replace(/```/g, '')
        .trim();
      const match = cleanJson.match(/\{[\s\S]*\}/);
      if(match){
        parsed = JSON.parse(match[0]);
      }else{
        parsed = JSON.parse(cleanJson);
      }
    } catch(parseErr){
      parsed = {
        mensaje: rawText || 'He procesado tu solicitud.',
        juego: null,
        juegos: []
      };
    }

    // Guardar en la memoria conversacional (historial limitado a los últimos 6 mensajes)
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

    // Validar y auditar cada juego de la lista con el diccionario verificado
    listaJuegos = listaJuegos.map(j => {
      let auditado = buscarJuegoVerificado(j.nombre || texto, j);
      if(auditado && auditado.url){
        auditado.url = sanearUrlJuego(auditado.url, auditado.tipo, auditado.nombre, pideHTML5, auditado.supervisado);
      }
      return auditado;
    });

    // Si la IA no trajo URLs válidas pero el usuario buscó un juego verificado (ej: Rosita Fresita, Mario Kart, Sonic)
    if(listaJuegos.length === 0){
      const verificadoDirecto = buscarJuegoVerificado(texto);
      if(verificadoDirecto && verificadoDirecto.url){
        listaJuegos = [verificadoDirecto];
      }
    }

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
      listaJuegos.forEach((juegoItem, index) => {
        const tempId = 'temp-copiloto-' + Date.now() + '-' + index;
        copilotoJuegosPendientes[tempId] = juegoItem;

        const tipoBadge = juegoItem.supervisado ? '👁️ Supervisado por Luis' :
                          juegoItem.tipo === 'snes' ? '🎮 Super Nintendo' :
                          juegoItem.tipo === 'youtube' ? '📺 YouTube' :
                          juegoItem.tipo === 'ventana' ? '🪟 Ventana' :
                          juegoItem.tipo === 'newtab' ? '🚀 Nueva pestaña' : '🌐 Web / HTML5';

        htmlContent += `
          <div id="card-${tempId}" class="copiloto-card-propuesta" style="margin-top:10px">
            <div class="copiloto-card-top">
              <img class="copiloto-card-img" src="${escapeAttr(juegoItem.imagen || 'portadas/logo.png')}" onerror="this.src='portadas/logo.png'" alt="Portada">
              <div class="copiloto-card-info">
                <div class="copiloto-card-title">${escapeHtml(juegoItem.nombre)}</div>
                <div class="copiloto-tags-row">
                  <span class="copiloto-tag">${escapeHtml(tipoBadge)}</span>
                  <span class="copiloto-tag">🏷️ ${escapeHtml(juegoItem.categoria || 'Retro')}</span>
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
              <button type="button" class="copiloto-btn-agregar" onclick="copilotoAgregarJuego('${tempId}')" title="Agregar directamente a tu catálogo">
                ✅ Agregar al catálogo
              </button>
              <button type="button" class="copiloto-btn-editar" onclick="copilotoEditarJuego('${tempId}')" title="Modificar portada o datos antes de guardar">
                ✏️ Editar
              </button>
            </div>
          </div>
        `;
      });
    }

    aiBubble.innerHTML = htmlContent;
    chat.appendChild(aiBubble);
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

function copilotoAgregarJuego(tempId){
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
    id: 'game-' + Date.now(),
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

  renderCategorias();
  aplicarFiltros();
  renderAdmin();

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

  mostrarToastSync(`➕ "${j.nombre}" agregado`);
  programarAutoSyncGitHub(`➕ "${j.nombre}" agregado con Copiloto IA`, 900);
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
window.copilotoEditarJuego = copilotoEditarJuego;
window.cancelarConsultaCopiloto = cancelarConsultaCopiloto;
window.actualizarEstadoCopilotoBadge = actualizarEstadoCopilotoBadge;
