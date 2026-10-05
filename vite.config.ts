import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { GoogleGenAI } from '@google/genai';

const SPOOF_NORMAL_TAB_SCRIPT = (fakeOrigin: string, fakeHref: string) => `<script>
(function(){
  /* 1. Ocultar cualquier rastro de iframe ante scripts del juego */
  try {
    Object.defineProperty(window, 'frameElement', { get: function(){ return null; }, configurable: true });
  } catch(e){}
  try {
    Object.defineProperty(document, 'referrer', { get: function(){ return ${JSON.stringify(fakeOrigin + '/')}; }, configurable: true });
  } catch(e){}
  try {
    if (window.location && 'ancestorOrigins' in window.location) {
      Object.defineProperty(window.location, 'ancestorOrigins', {
        get: function(){ return { length: 0, item: function(){ return null; }, contains: function(){ return false; } }; },
        configurable: true
      });
    }
  } catch(e){}

  /* 2. Si el sitio intenta abrir un popup o nueva pestaña (window.open), abrirlo DENTRO de este mismo recuadro */
  var __proxyOrigin = window.location.origin;
  var __realBase = ${JSON.stringify(fakeHref)};
  var __fakeOrigin = ${JSON.stringify(fakeOrigin)};
  function __toProxyUrl(u) {
    try {
      var abs = new URL(u, __realBase).href;
      if (abs.indexOf(__proxyOrigin) === 0) return abs;
      return __proxyOrigin + '/api/proxy-tab?url=' + encodeURIComponent(abs);
    } catch(e) {
      return u;
    }
  }
  try {
    window.open = function(url) {
      if (url && typeof url === 'string' && !url.startsWith('javascript:')) {
        window.location.href = __toProxyUrl(url);
      }
      return window;
    };
  } catch(e){}

  /* 3. Resolver peticiones fetch / XHR con rutas relativas a la raíz (/...) hacia el servidor real del juego */
  try {
    var _origFetch = window.fetch;
    if (_origFetch) {
      window.fetch = function(input, init) {
        try {
          if (typeof input === 'string' && input.startsWith('/') && !input.startsWith('//') && !input.startsWith('/api/')) {
            input = __fakeOrigin + input;
          }
        } catch(e){}
        return _origFetch.call(this, input, init);
      };
    }
    var _origOpen = XMLHttpRequest.prototype.open;
    if (_origOpen) {
      XMLHttpRequest.prototype.open = function(method, url) {
        try {
          if (typeof url === 'string' && url.startsWith('/') && !url.startsWith('//') && !url.startsWith('/api/')) {
            arguments[1] = __fakeOrigin + url;
          }
        } catch(e){}
        return _origOpen.apply(this, arguments);
      };
    }
  } catch(e){}

  /* 4. Interceptar enlaces <a target="_blank"> para que nunca salgan afuera de tu página */
  document.addEventListener('click', function(ev) {
    var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
    ev.preventDefault();
    ev.stopPropagation();
    window.location.href = __toProxyUrl(href);
  }, true);

  /* 5. Parche automático de Sitelock WebAssembly (Poki / Unity / Defold) */
  try {
    window._JS_SystemInfo_GetDocumentURL = function(buffer, bufferSize) {
      var url = "https://poki.com/";
      if (typeof stringToUTF8 === 'function' && buffer) stringToUTF8(url, buffer, bufferSize);
      if (typeof lengthBytesUTF8 === 'function') return lengthBytesUTF8(url);
      return url.length;
    };
    if (typeof WebAssembly !== 'undefined' && !window.__wasmSitelockPatched) {
      window.__wasmSitelockPatched = true;
      var W = null;
      var SIG = [0x02,0x40, 0x20,0x01, 0x04,0x40, 0x20,0x01, 0x28,0x02,0x0c, 0x04,0x40,
                 0x20,0x00,0x20,0x01,0x41,0x00, 0x10,W,W,W, 0x45, 0x04,0x40,
                 0x20,0x00,0x41,0x00, 0x10,W,W,W, 0x0c,0x03, 0x0b,
                 0x41,0x00,0x10,W,W,W, 0x41,0x00,0x10,W,W,W, 0x0b,0x0b,0x0b,
                 0x20,0x00,0x41,0x00,0x41,W,W,W,W, 0x28,0x02,0x00,
                 0x10,W,W,W, 0x41,0x00,0x10,W,W,W, 0x0b];
      var PROC_FROM = 37, PROC_LEN = 12, END_AT = 74;
      function matchAt(u8, o){
        for (var i = 0; i < SIG.length; i++){ if (SIG[i] !== null && u8[o+i] !== SIG[i]) return false; }
        return true;
      }
      function patchSource(src){
        try {
          var u8 = src instanceof ArrayBuffer ? new Uint8Array(src) : (ArrayBuffer.isView(src) ? new Uint8Array(src.buffer, src.byteOffset, src.byteLength) : null);
          if (!u8) return src;
          var L = u8.length - SIG.length;
          for (var o = 0; o <= L; o++){
            if (!matchAt(u8, o) || u8[o + END_AT] !== 0x0b) continue;
            var seq = u8.slice(o + PROC_FROM, o + PROC_FROM + PROC_LEN);
            for (var i = 0; i < PROC_LEN; i++) u8[o + i] = seq[i];
            for (var k = PROC_LEN; k < END_AT; k++) u8[o + k] = 0x01;
            o += END_AT;
          }
        } catch(e){}
        return src;
      }
      var _inst = WebAssembly.instantiate;
      if (_inst) WebAssembly.instantiate = function(src, imp){
        if (!(src instanceof WebAssembly.Module)) patchSource(src);
        return _inst.apply(this, arguments);
      };
      var _comp = WebAssembly.compile;
      if (_comp) WebAssembly.compile = function(src){ patchSource(src); return _comp.apply(this, arguments); };
    }
  } catch(e){}
})();
</script>`;

function rewriteAntiIframeJS(code: string): string {
  return code
    .replace(/window\.top\s*!==?\s*window\.self/g, 'false')
    .replace(/window\.self\s*!==?\s*window\.top/g, 'false')
    .replace(/window\.top\s*===\s*window\.self/g, 'true')
    .replace(/window\.self\s*===\s*window\.top/g, 'true')
    .replace(/\btop\s*!==?\s*self\b/g, 'false')
    .replace(/\bself\s*!==?\s*top\b/g, 'false')
    .replace(/\btop\s*===\s*self\b/g, 'true')
    .replace(/\bself\s*===\s*top\b/g, 'true')
    .replace(/window\.parent\s*!==?\s*window\.self/g, 'false')
    .replace(/window\.parent\s*!==?\s*window\b/g, 'false')
    .replace(/\bparent\s*!==?\s*window\b/g, 'false')
    .replace(/\bwindow\s*!==?\s*parent\b/g, 'false');
}

function normalizeSpecialGameUrl(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    const host = u.hostname.toLowerCase();
    if (host.includes('minigamesville.com') && u.pathname.includes('/gamelib/')) {
      u.searchParams.set('direct', 'true');
      u.searchParams.set('universal', 'true');
      return u.href;
    }
    if (host.includes('gamedistribution.com')) {
      if (!u.searchParams.has('gd_sdk_referrer_url')) {
        u.searchParams.set('gd_sdk_referrer_url', 'https://gamedistribution.com/games/');
      }
      return u.href;
    }
    if (host.includes('playhop.com')) {
      if (!u.searchParams.has('skip-guard')) u.searchParams.set('skip-guard', '1');
      if (!u.searchParams.has('header')) u.searchParams.set('header', 'no');
      return u.href;
    }
    if (host.includes('crazygames.com') && /\/(?:[a-z]{2}\/)?game\//i.test(u.pathname)) {
      const slug = u.pathname.split('/game/')[1]?.replace(/\/+$/, '');
      if (slug) return `https://www.crazygames.com/embed/${slug}`;
    }
  } catch {}
  return rawUrl;
}

function extractPokiSlug(rawUrl: string): string {
  try {
    const u = new URL(rawUrl);
    if (!u.hostname.toLowerCase().includes('poki.')) return '';
    const m = u.pathname.match(/\/g\/([a-z0-9\-_]+)/i);
    return m?.[1] || '';
  } catch {
    return '';
  }
}

async function resolvePokiUnlockedUrl(slug: string): Promise<{ url: string; titulo: string; imagen: string } | null> {
  if (!slug) return null;
  /* Probar si minigamesville tiene el build HTML5 directo desbloqueado para este mismo slug de Poki */
  const mvUrl = `https://minigamesville.com/play/${encodeURIComponent(slug)}/`;
  try {
    const r = await fetch(mvUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
        'Referer': 'https://minigamesville.com/'
      }
    });
    if (r.ok) {
      const html = await r.text();
      const next = findInnerGameIframe(html, mvUrl);
      if (next) {
        const ogT = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i);
        const ogI = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
        return {
          url: next,
          titulo: ogT?.[1]?.trim() || '',
          imagen: ogI?.[1]?.trim() || ''
        };
      }
    }
  } catch {}
  return null;
}

const BAD_URLS_RX = /doubleclick|googlesyndication|google-analytics|googletagmanager|googleadservices|adservice|adsystem|adnxs|taboola|outbrain|scorecardresearch|hotjar|clarity\.ms|amazon-adsystem|pubmatic|criteo|connect\.facebook\.net|cloudflare|sentry\.io|newrelic|gstatic\.com|googleapis\.com|facebook\.com|twitter\.com|instagram\.com|tiktok\.com|discord\.(?:gg|com)/i;
const ASSET_EXT_RX = /\.(?:js|mjs|css|png|jpe?g|gif|webp|svg|ico|woff2?|ttf|eot|otf|mp3|wav|ogg|mp4|webm|m4v|json|xml|txt|pdf|zip|rar)(?:[?#]|$)/i;
const AD_PATH_RX = /\/ads\/|\/ad\/|adsense|adserver|prebid|ima3\.js|gpt\.js|pagead|banner|popunder|analytics|pixel|tracker/i;

const RX_SWF = /\.swf(?:[?#]|$)/i;
const RX_YT = /(?:youtube(?:-nocookie)?\.com\/(?:embed|watch|shorts)|youtu\.be\/)/i;
const RX_EMU = /retrogames\.cc\/embed|retrogamesnexus\.com\/embed|archive\.org\/embed|emulatorjs|\bejs[_-]|snes9x|embed-upload|webretro|nostalgist|jsnes|\/emulator|emulador/i;
const RX_H5 = /gamemonetize|gamedistribution|famobi|games\.s3\.yandex|cdn\.games\.yandex|playhop|playgama\.com\/export|wordwall\.net\/(?:\w+\/)?embed|minijuegos\.com\/embed|minijuegosgratis\.com|cooljuegos\.com\/embed|crazygames\.com\/embed|games\.crazygames\.com|y8\.com\/embed|poki-gdn\.com|games\.poki\.com|itch\.io\/embed|itch\.zone|html5games|igroutka\.ru\/games|shoalmedia\.com|minigamesville\.com\/gamelib|gameboss\.com\/games|madkidgames\.com\/full|silvergames\.com\/[^"']+\/iframe/i;
const RX_HTML = /\.html?(?:[?#]|$)/i;
const RX_EMBED = /\/embed\/|\/iframe\/|\/gamelib\/|\/play\/|player|game-frame|html5/i;

const DATA_ATTRS = [
  'data-src', 'data-iframe-src', 'data-url', 'data-href', 'data-game',
  'data-swf', 'data-embed', 'data-iframe', 'data-lazy-src', 'data-lazy',
  'data-original', 'data-file', 'data-movie', 'data-link'
];

interface FoundLink {
  url: string;
  cat: 'swf' | 'emu' | 'html5' | 'iframe' | 'youtube';
  tipo: string;
  srcs: string[];
  depth: number;
  score: number;
}

function classifyCandidateUrl(u: string): 'swf' | 'emu' | 'html5' | 'youtube' | null {
  if (RX_SWF.test(u)) return 'swf';
  if (RX_YT.test(u)) return 'youtube';
  if (ASSET_EXT_RX.test(u) || AD_PATH_RX.test(u)) return null;
  if (RX_EMU.test(u)) return 'emu';
  if (RX_H5.test(u)) return 'html5';
  return null;
}

function scanHtmlForLinks(
  html: string,
  baseUrl: string,
  depth: number,
  prefixTag: string,
  foundMap: Map<string, FoundLink>,
  iframesToFollow: string[]
) {
  if (!html) return;
  const orderRank: Record<string, number> = { swf: 1, emu: 2, html5: 3, iframe: 4, youtube: 5 };
  const tipoMap: Record<string, string> = { swf: 'swf', emu: 'snes', html5: 'iframe', iframe: 'iframe', youtube: 'youtube' };

  function addCandidate(raw: string, srcLabel: string, hintCat: 'swf' | 'emu' | 'html5' | 'iframe' | 'youtube' | null, isDomEmbed = false) {
    if (!raw || typeof raw !== 'string') return;
    const clean = raw.replace(/&amp;/g, '&').replace(/\\\//g, '/').replace(/\\u002f/gi, '/').trim();
    if (!clean || /^(?:data|blob|javascript|about|mailto|tel|#):/i.test(clean)) return;
    let abs = '';
    try {
      const u = new URL(clean, baseUrl);
      if (u.protocol !== 'http:' && u.protocol !== 'https:') return;
      abs = normalizeSpecialGameUrl(u.href);
    } catch {
      return;
    }
    if (BAD_URLS_RX.test(abs)) return;
    if (!RX_SWF.test(abs) && (ASSET_EXT_RX.test(abs) || AD_PATH_RX.test(abs))) return;

    const detected = classifyCandidateUrl(abs);
    const cat = detected || hintCat;
    if (!cat) return;

    /* Calcular puntaje para elegir automáticamente el mejor enlace (prefiere iframes internos profundos, SWF, emuladores y motores HTML5 limpios) */
    let score = depth * 25;
    if (cat === 'swf') score += 100;
    else if (cat === 'emu') score += 95;
    else if (cat === 'html5') score += 90;
    else if (cat === 'iframe') score += 60;
    else if (cat === 'youtube') score += 50;
    if (isDomEmbed) score += 20;
    if (/cdn\.|shoalmedia|gamelib|gamemonetize|gamedistribution|itch\.zone|retrogames\.cc\/embed/i.test(abs)) score += 35;
    if (/\/iframe\/\d+\.html/i.test(abs)) score -= 10; // wrapper intermedio como play-games.com/iframe/25684.html

    const existing = foundMap.get(abs);
    if (!existing) {
      foundMap.set(abs, {
        url: abs,
        cat,
        tipo: tipoMap[cat] || 'iframe',
        srcs: [srcLabel],
        depth,
        score
      });
    } else {
      if ((orderRank[cat] || 99) < (orderRank[existing.cat] || 99)) {
        existing.cat = cat;
        existing.tipo = tipoMap[cat] || 'iframe';
      }
      if (score > existing.score) existing.score = score;
      if (!existing.srcs.includes(srcLabel)) existing.srcs.push(srcLabel);
    }

    if (isDomEmbed && !RX_SWF.test(abs) && !RX_YT.test(abs) && !iframesToFollow.includes(abs)) {
      iframesToFollow.push(abs);
    }
  }

  /* 1. Escaneo de <iframe, frame, embed, object> */
  const tagRegex = /<(iframe|frame|embed|object)\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = tagRegex.exec(html)) !== null) {
    const tagName = m[1].toLowerCase();
    const attrs = m[2] || '';
    for (const attrName of ['src', 'data', ...DATA_ATTRS]) {
      const am = attrs.match(new RegExp(`\\b${attrName}\\s*=\\s*["']([^"']+)["']`, 'i'));
      if (am?.[1]) {
        addCandidate(am[1], `${prefixTag}DOM (${tagName} · ${attrName})`, 'iframe', true);
      }
    }
  }

  /* 2. Escaneo de <param name="movie|src|data|url" value="..."> */
  const paramRegex = /<param\b([^>]*)>/gi;
  while ((m = paramRegex.exec(html)) !== null) {
    const attrs = m[1] || '';
    const nm = attrs.match(/\bname\s*=\s*["'](movie|src|data|url)["']/i);
    const vm = attrs.match(/\bvalue\s*=\\s*["']([^"']+)["']/i);
    if (nm && vm?.[1]) {
      addCandidate(vm[1], `${prefixTag}param (${nm[1]})`, 'iframe', true);
    }
  }

  /* 3. Escaneo de todos los atributos DATA_ATTRS en cualquier etiqueta (ej. <div data-src="..." data-game="...">) */
  for (const attrName of DATA_ATTRS) {
    const attrRx = new RegExp(`\\b${attrName}\\s*=\\s*["']([^"']+)["']`, 'gi');
    while ((m = attrRx.exec(html)) !== null) {
      const val = m[1];
      if (!val) continue;
      const c = classifyCandidateUrl(val);
      if (c || RX_HTML.test(val) || RX_EMBED.test(val)) {
        addCandidate(val, `${prefixTag}${attrName}`, c || 'iframe', true);
      }
    }
  }

  /* 4. Escaneo de <script> y <noscript> (igual que textScan del bookmarklet) */
  const cleanText = html
    .slice(0, 1500000)
    .replace(/\\\//g, '/')
    .replace(/\\u002f/gi, '/')
    .replace(/&amp;/g, '&');

  const urlRegex = /(?:https?:)?\/\/[^\s"'`<>\\)\]}]+/gi;
  while ((m = urlRegex.exec(cleanText)) !== null) {
    const rawUrl = m[0].startsWith('//') ? 'https:' + m[0] : m[0];
    const c = classifyCandidateUrl(rawUrl);
    if (c) {
      addCandidate(rawUrl, `${prefixTag}script/red`, c, false);
    } else if ((RX_HTML.test(rawUrl) || RX_EMBED.test(rawUrl)) && /iframe|embed|gamelib|kidoz|shoalmedia|html5|games\//i.test(rawUrl)) {
      addCandidate(rawUrl, `${prefixTag}script/iframe`, 'iframe', true);
    }
  }

  const swfRegex = /["'`]([^"'`\s<>]{2,300}\.swf[^"'`\s<>]{0,100})["'`]/gi;
  while ((m = swfRegex.exec(cleanText)) !== null) {
    addCandidate(m[1], `${prefixTag}script (.swf)`, 'swf', false);
  }
}

function findInnerGameIframe(html: string, baseUrl: string): string {
  const retro = html.match(/https?:\/\/(?:www\.)?retrogames\.cc\/embed\/\d+-[a-z0-9\-_.]+\.html/i)
             || html.match(/\/embed\/\d+-[a-z0-9\-_.]+\.html/i);
  if (retro) {
    try { return new URL(retro[0], baseUrl).href; } catch {}
  }
  const iframeRegex = /<iframe[^>]+(?:data-src|data-iframe-src|src)=["']([^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = iframeRegex.exec(html)) !== null) {
    const tag = m[0].toLowerCase();
    const src = m[1]?.replace(/&amp;/g, '&').trim();
    if (!src || src.startsWith('javascript:') || src.startsWith('about:') || src.startsWith('#')) continue;
    if (BAD_URLS_RX.test(src) || AD_PATH_RX.test(src)) continue;
    if (
      tag.includes('game') ||
      tag.includes('player') ||
      tag.includes('emulator') ||
      src.includes('gamelib') ||
      src.includes('wp-content/uploads') ||
      src.includes('embed') ||
      src.includes('iframe') ||
      src.includes('html5') ||
      src.includes('poki-gdn') ||
      src.includes('shoalmedia') ||
      src.includes('gamedistribution') ||
      src.includes('gamemonetize') ||
      tag.includes('allowfullscreen')
    ) {
      try {
        return normalizeSpecialGameUrl(new URL(src, baseUrl).href);
      } catch {}
    }
  }
  return '';
}

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'normal-tab-game-proxy',
        configureServer(server) {
          server.middlewares.use('/api/gemini/status', (req, res) => {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({
              hasServerKey: !!process.env.GEMINI_API_KEY
            }));
          });

          server.middlewares.use('/api/gemini/chat', async (req, res) => {
            if (req.method !== 'POST') {
              res.statusCode = 405;
              res.end(JSON.stringify({ error: 'Method not allowed' }));
              return;
            }
            try {
              let body = '';
              for await (const chunk of req) {
                body += chunk;
              }
              const data = JSON.parse(body || '{}');
              const { contents, systemInstruction, useGoogleSearch, apiKey: clientApiKey } = data;
              const apiKey = clientApiKey || process.env.GEMINI_API_KEY;
              if (!apiKey) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({ ok: false, error: 'No se encontró clave de Gemini API configurada' }));
                return;
              }

              const ai = new GoogleGenAI({
                apiKey: apiKey,
                httpOptions: {
                  headers: { 'User-Agent': 'aistudio-build' }
                }
              });

              const modelsToTry = ['gemini-3.8-flash', 'gemini-flash-latest'];
              let result = null;
              let lastErr: any = null;

              for (const model of modelsToTry) {
                try {
                  const config: any = {
                    temperature: 0.2
                  };
                  if (systemInstruction) {
                    config.systemInstruction = systemInstruction;
                  }
                  if (useGoogleSearch) {
                    config.tools = [{ googleSearch: {} }];
                  }

                  let response;
                  try {
                    response = await ai.models.generateContent({
                      model,
                      contents,
                      config
                    });
                  } catch (e: any) {
                    // Si falló por cuota de búsqueda (429) o incompatibilidad de tools, reintentar sin tools
                    if (useGoogleSearch) {
                      const configSinTools = { ...config };
                      delete configSinTools.tools;
                      response = await ai.models.generateContent({
                        model,
                        contents,
                        config: configSinTools
                      });
                    } else {
                      throw e;
                    }
                  }

                  result = {
                    text: response.text || '',
                    searchQueries: response.candidates?.[0]?.groundingMetadata?.webSearchQueries || [],
                    modelUsed: model
                  };
                  break;
                } catch (err: any) {
                  lastErr = err;
                  console.warn(`[Gemini Server API] Modelo ${model} falló: ${err?.message}`);
                }
              }

              if (!result) {
                throw lastErr || new Error('No se pudo generar respuesta con Gemini');
              }

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: true, ...result }));
            } catch (err: any) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ ok: false, error: err?.message || 'Error en Gemini API' }));
            }
          });

          server.middlewares.use('/api/extract-embed', async (req, res) => {
            try {
              const reqUrl = new URL(req.url || '', 'http://localhost');
              let target = reqUrl.searchParams.get('url') || '';
              if (!target || !/^https?:\/\//i.test(target)) {
                res.statusCode = 400;
                res.end(JSON.stringify({ error: 'Invalid url' }));
                return;
              }
              let currentUrl = normalizeSpecialGameUrl(target);
              let html = '';
              let titulo = '';
              let imagen = '';

              /* Si es un enlace de poki.com/es/g/..., primero extraemos su portada/título oficial de Poki y verificamos si existe el motor directo desbloqueado */
              const pokiSlug = extractPokiSlug(currentUrl);
              if (pokiSlug) {
                try {
                  const rp = await fetch(currentUrl, {
                    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
                  });
                  if (rp.ok) {
                    const hp = await rp.text();
                    const ogT = hp.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
                             || hp.match(/<title[^>]*>([^<]+)<\/title>/i);
                    if (ogT?.[1]) titulo = ogT[1].trim();
                    const ogI = hp.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
                    if (ogI?.[1]) imagen = new URL(ogI[1], currentUrl).href;
                  }
                } catch {}
                const unlocked = await resolvePokiUnlockedUrl(pokiSlug);
                if (unlocked?.url) {
                  currentUrl = unlocked.url;
                  if (!titulo && unlocked.titulo) titulo = unlocked.titulo;
                  if (!imagen && unlocked.imagen) imagen = unlocked.imagen;
                }
              }

              const foundMap = new Map<string, FoundLink>();
              const visited = new Set<string>();

              for (let depth = 0; depth < 5; depth++) {
                currentUrl = normalizeSpecialGameUrl(currentUrl);
                if (visited.has(currentUrl)) break;
                visited.add(currentUrl);
                const u = new URL(currentUrl);
                const r = await fetch(currentUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Referer': u.origin + '/',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-origin'
                  }
                });
                if (!r.ok) break;
                html = await r.text();
                if (depth === 0 && !titulo) {
                  const ogT = html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i)
                           || html.match(/<title[^>]*>([^<]+)<\/title>/i);
                  if (ogT?.[1]) titulo = ogT[1].trim();
                  const ogI = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i);
                  if (ogI?.[1]) {
                    try { imagen = new URL(ogI[1], currentUrl).href; } catch {}
                  }
                }
                const toFollow: string[] = [];
                const prefix = depth === 0 ? '' : `iframe interno (${depth}) · `;
                scanHtmlForLinks(html, currentUrl, depth, prefix, foundMap, toFollow);
                const nextIframe = toFollow.find(x => !visited.has(x));
                if (nextIframe && nextIframe !== currentUrl) {
                  currentUrl = nextIframe;
                } else {
                  break;
                }
              }

              const enlaces = Array.from(foundMap.values()).sort((a, b) => b.score - a.score);
              const best = enlaces[0];
              const finalUrl = best?.url || currentUrl;
              const tipoSugerido = best?.tipo || '';

              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({ finalUrl, tipoSugerido, titulo, imagen, enlaces: enlaces.slice(0, 20) }));
            } catch (e: any) {
              res.statusCode = 500;
              res.end(JSON.stringify({ error: e?.message || 'error' }));
            }
          });

          server.middlewares.use('/api/proxy-tab', async (req, res) => {
            try {
              const reqUrl = new URL(req.url || '', 'http://localhost');
              let target = reqUrl.searchParams.get('url') || '';
              const mode = reqUrl.searchParams.get('mode') || '';
              if (!target || !/^https?:\/\//i.test(target)) {
                res.statusCode = 400;
                res.end('URL inválida');
                return;
              }
              let currentUrl = normalizeSpecialGameUrl(target);

              /* Si es un enlace de poki.com/es/g/..., resolvemos automáticamente su motor HTML5 directo */
              const pokiSlug = extractPokiSlug(currentUrl);
              if (pokiSlug && mode !== 'raw') {
                const unlocked = await resolvePokiUnlockedUrl(pokiSlug);
                if (unlocked?.url) {
                  currentUrl = unlocked.url;
                }
              }

              let html = '';
              let contentType = 'text/html; charset=utf-8';
              let lastXfo = '';
              let lastCsp = '';
              for (let depth = 0; depth < 5; depth++) {
                currentUrl = normalizeSpecialGameUrl(currentUrl);
                const u = new URL(currentUrl);
                const r = await fetch(currentUrl, {
                  headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
                    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                    'Referer': u.origin + '/',
                    'Sec-Fetch-Dest': 'document',
                    'Sec-Fetch-Mode': 'navigate',
                    'Sec-Fetch-Site': 'same-origin'
                  }
                });
                lastXfo = (r.headers.get('x-frame-options') || '').toLowerCase();
                lastCsp = (r.headers.get('content-security-policy') || '').toLowerCase();
                contentType = r.headers.get('content-type') || contentType;
                if (!contentType.includes('text/html')) {
                  const buf = Buffer.from(await r.arrayBuffer());
                  res.setHeader('Content-Type', contentType);
                  res.setHeader('Access-Control-Allow-Origin', '*');
                  res.end(buf);
                  return;
                }
                const candidateHtml = await r.text();
                if (!candidateHtml || candidateHtml.length < 40) break;
                html = candidateHtml;

                if (mode !== 'raw') {
                  const nextIframe = findInnerGameIframe(html, currentUrl);
                  if (nextIframe && nextIframe !== currentUrl && depth < 4) {
                    const nextHost = new URL(nextIframe).hostname;
                    if (nextHost === u.hostname || html.length < 4500 || !html.includes('<canvas')) {
                      currentUrl = nextIframe;
                      continue;
                    }
                  }
                }
                break;
              }

              const finalU = new URL(currentUrl);
              const blocksFraming =
                lastXfo.includes('deny') ||
                lastXfo.includes('sameorigin') ||
                lastCsp.includes('frame-ancestors') ||
                finalU.hostname.includes('minigamesville.com') ||
                finalU.hostname.includes('poki.com');

              /* Si el motor final NO bloquea iframes por cabeceras, redirigir directo a su origen nativo para que WebGL/WASM/Workers carguen sin pantalla negra */
              if (!blocksFraming && mode !== 'raw' && currentUrl !== target) {
                res.statusCode = 302;
                res.setHeader('Location', currentUrl);
                res.end();
                return;
              }

              const baseHref = finalU.origin + finalU.pathname.replace(/[^/]*$/, '');
              const headInject = `<base href="${baseHref}">` + SPOOF_NORMAL_TAB_SCRIPT(finalU.origin, currentUrl);

              let modified = rewriteAntiIframeJS(html)
                .replace(/\b(src|href|action|poster)=(["'])\/(?!\/)/gi, `$1=$2${finalU.origin}/`);

              if (/<head[^>]*>/i.test(modified)) {
                modified = modified.replace(/<head[^>]*>/i, (m) => m + headInject);
              } else {
                modified = headInject + modified;
              }

              res.removeHeader('X-Frame-Options');
              res.removeHeader('Content-Security-Policy');
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.setHeader('Access-Control-Allow-Origin', '*');
              res.end(modified);
            } catch (e: any) {
              res.statusCode = 500;
              res.end('Error cargando página: ' + (e?.message || ''));
            }
          });
        }
      }
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
