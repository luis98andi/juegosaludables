function textoBase64UTF8(texto){
  const bytes=new TextEncoder().encode(texto);
  let bin='';
  const bloque=0x8000;

  for(let i=0;i<bytes.length;i+=bloque){
    bin+=String.fromCharCode(...bytes.subarray(i,i+bloque));
  }

  return btoa(bin);
}

async function subirArchivoGitHub(cfg,ruta,contenido,mensaje){

  const apiUrl=
    'https://api.github.com/repos/'+
    encodeURIComponent(cfg.owner)+'/'+
    encodeURIComponent(cfg.repo)+'/contents/'+
    ruta.split('/').map(encodeURIComponent).join('/');

  const headers={
    'Accept':'application/vnd.github+json',
    'Authorization':'Bearer '+cfg.token,
    'X-GitHub-Api-Version':'2022-11-28'
  };

  for(let intento=0;intento<3;intento++){
    let sha=ultimosShaGitHub[ruta] || null;

    if(!sha || intento>0){
      const getResponse=await fetch(
        apiUrl+'?ref='+encodeURIComponent(cfg.branch)+'&_t='+Date.now(),
        {headers,cache:'no-store'}
      );

      if(getResponse.ok){
        sha=(await getResponse.json()).sha;
        if(sha)ultimosShaGitHub[ruta]=sha;
      }else if(getResponse.status!==404){
        const error=await getResponse.json().catch(()=>({}));
        throw new Error(error.message || 'No se pudo leer '+ruta+' en GitHub.');
      }
    }

    const body={
      message:mensaje,
      content:textoBase64UTF8(contenido),
      branch:cfg.branch
    };

    if(sha) body.sha=sha;

    const putResponse=await fetch(
      apiUrl,
      {
        method:'PUT',
        headers:{...headers,'Content-Type':'application/json'},
        body:JSON.stringify(body)
      }
    );

    const result=await putResponse.json().catch(()=>({}));

    if(putResponse.ok){
      const nuevoSha=result?.content?.sha;
      if(nuevoSha)ultimosShaGitHub[ruta]=nuevoSha;
      return;
    }

    /* Si hubo conflicto de SHA por varios cambios rápidos, refrescar SHA y reintentar automáticamente */
    if((putResponse.status===409 || putResponse.status===422) && intento<2){
      delete ultimosShaGitHub[ruta];
      await new Promise(r=>setTimeout(r,450*(intento+1)));
      continue;
    }

    throw new Error(result.message || 'GitHub rechazó la actualización de '+ruta+'.');
  }

}

async function actualizarGitHub(){

  const status=document.getElementById('github-status');

  const cfg={
    owner:document.getElementById('gh-owner').value.trim(),
    repo:document.getElementById('gh-repo').value.trim(),
    branch:document.getElementById('gh-branch').value.trim() || 'main',
    token:document.getElementById('gh-token').value.trim()
  };

  if(!cfg.owner || !cfg.repo || !cfg.token){
    status.textContent='Falta usuario, repositorio o token.';
    return;
  }

  guardarConfigGitHub();
  reordenar();

  status.textContent='⏳ Conectando con GitHub...';

  try{

    if(cuentasSucias){

      await subirArchivoGitHub(
        cfg,
        'cuentas.json',
        JSON.stringify(datosCuentas(),null,2),
        'Actualizar cuentas desde FreshMind Games'
      );

      cuentasSucias=false;

    }

    await subirArchivoGitHub(
      cfg,
      cuentaActual.archivo,
      JSON.stringify(catalogo,null,2),
      'Actualizar '+cuentaActual.archivo+' desde FreshMind Games'
    );

    status.textContent='✅ '+cuentaActual.archivo+' actualizado en GitHub.';
    setTimeout(()=>ocultarGitHub(),1000);

  }catch(error){

    console.error('Error actualizando GitHub:',error);
    status.textContent='❌ '+error.message;

  }

}

async function subirArchivosRaizGitHub(){
  const cfg=obtenerConfigGitHub();
  const status=document.getElementById('github-status');
  if(!cfg.owner || !cfg.repo || !cfg.token){
    if(status) status.textContent='Falta usuario, repositorio o token.';
    mostrarToastSync('⚠️ Primero completa tu Usuario, Repositorio y Token en 🔑 Token.');
    return;
  }
  if(status) status.textContent='⏳ Leyendo index.html para subir a GitHub...';
  try{
    const rIndex=await fetch('index.html', {cache:'no-store'});
    if(!rIndex.ok) throw new Error('No se pudo leer index.html');
    const txtIndex=await rIndex.text();
    
    if(status) status.textContent='⏳ Subiendo index.html a GitHub...';
    await subirArchivoGitHub(cfg, 'index.html', txtIndex, 'Actualizar index.html con AdSense y modo sin anuncios');
    
    if(status) status.textContent='⏳ Subiendo ads.txt a GitHub...';
    const adsContent='google.com, pub-8026306095938145, DIRECT, f08c47fec0942fa0\n';
    await subirArchivoGitHub(cfg, 'ads.txt', adsContent, 'Agregar ads.txt para verificación AdSense');

    try{
      const rJs=await fetch('copiloto.js', {cache:'no-store'});
      if(rJs.ok){
        const txtJs=await rJs.text();
        await subirArchivoGitHub(cfg, 'copiloto.js', txtJs, 'Actualizar copiloto.js modular');
      }
    }catch(e){}

    try{
      const rCss=await fetch('copiloto.css', {cache:'no-store'});
      if(rCss.ok){
        const txtCss=await rCss.text();
        await subirArchivoGitHub(cfg, 'copiloto.css', txtCss, 'Actualizar copiloto.css modular');
      }
    }catch(e){}

    if(status) status.textContent='✅ ¡index.html, copiloto y ads.txt subidos con éxito a GitHub!';
    mostrarToastSync('✅ Archivos actualizados en GitHub ✓');
  }catch(err){
    if(status) status.textContent='❌ Error al subir a GitHub: '+err.message;
    mostrarToastSync('❌ Error al subir a GitHub: '+err.message);
  }
}

async function sincronizarTodoGitHub(){
  const cfg=obtenerConfigGitHub();
  const status=document.getElementById('github-status');
  const quick=document.getElementById('github-quick-status');

  if(!cfg.token){
    mostrarGitHub(true);
    if(status) status.textContent='⚠️ Ingresa tu Token de GitHub para sincronizar.';
    mostrarToastSync('⚠️ Falta tu Token de GitHub. Ingresa uno en 🔑 Token.');
    return;
  }

  const fullCfg={
    owner:cfg.owner || 'luis98andi',
    repo:cfg.repo || 'juegosaludables',
    branch:cfg.branch || 'main',
    token:cfg.token
  };

  const notify = (msg) => {
    if(quick){ quick.style.display='block'; quick.textContent=msg; }
    if(status){ status.textContent=msg; }
    mostrarToastSync(msg, 3000);
  };

  notify('⏳ [1/4] Subiendo catálogo ('+(cuentaActual ? cuentaActual.archivo : 'juegos.json')+')...');
  try{
    reordenar();
    await subirArchivoGitHub(
      fullCfg,
      cuentaActual ? cuentaActual.archivo : 'juegos.json',
      JSON.stringify(catalogo,null,2),
      'Actualizar catálogo desde FreshMind Games'
    );

    notify('⏳ [2/4] Subiendo cuentas.json...');
    await subirArchivoGitHub(
      fullCfg,
      'cuentas.json',
      JSON.stringify(datosCuentas(),null,2),
      'Actualizar cuentas desde FreshMind Games'
    );
    cuentasSucias=false;

    notify('⏳ [3/4] Leyendo y subiendo index.html actualizado...');
    try{
      const rIdx=await fetch('index.html', {cache:'no-store'});
      if(rIdx.ok){
        const txtIdx=await rIdx.text();
        await subirArchivoGitHub(fullCfg, 'index.html', txtIdx, 'Actualizar index.html y juegos FreshMind Games');
      }
    }catch(e){
      console.warn('Advertencia subiendo index.html:', e);
    }

    notify('⏳ Subiendo módulos copiloto.js y copiloto.css...');
    try{
      const rJs=await fetch('copiloto.js', {cache:'no-store'});
      if(rJs.ok){
        const txtJs=await rJs.text();
        await subirArchivoGitHub(fullCfg, 'copiloto.js', txtJs, 'Actualizar copiloto.js modular');
      }
    }catch(e){
      console.warn('Advertencia subiendo copiloto.js:', e);
    }
    try{
      const rCss=await fetch('copiloto.css', {cache:'no-store'});
      if(rCss.ok){
        const txtCss=await rCss.text();
        await subirArchivoGitHub(fullCfg, 'copiloto.css', txtCss, 'Actualizar copiloto.css modular');
      }
    }catch(e){
      console.warn('Advertencia subiendo copiloto.css:', e);
    }

    notify('⏳ [4/4] Subiendo ads.txt...');
    const adsContent='google.com, pub-8026306095938145, DIRECT, f08c47fec0942fa0\n';
    try{
      await subirArchivoGitHub(fullCfg, 'ads.txt', adsContent, 'Actualizar ads.txt AdSense');
    }catch(e){}

    notify('✅ ¡Todo sincronizado a GitHub con éxito (Juegos, Cuentas, Index y Copiloto)!');
  }catch(err){
    console.error('Error sincronizando todo con GitHub:', err);
    notify('❌ Error al sincronizar con GitHub: '+err.message+' (revisa tu token en 🔑 Token)');
  }
}

/* =========================
   IMPORTAR / EXPORTAR
========================= */

function exportarJSON(){

  reordenar();

  const blob=
    new Blob(
      [
        JSON.stringify(
          catalogo,
          null,
          2
        )
      ],
      {
        type:'application/json'
      }
    );

  const a=
    document.createElement('a');

  a.href=
    URL.createObjectURL(blob);

  a.download=cuentaActual.archivo;

  a.click();

  URL.revokeObjectURL(a.href);

}

function importarJSON(){

  document.getElementById(
    'jsonFile'
  ).click();

}

function leerJSON(ev){

  const f=
    ev.target.files[0];

  if(!f)return;

  const r=
    new FileReader();

  r.onload=()=>{

    try{

      const data=
        JSON.parse(r.result);

      if(!Array.isArray(data.juegos))
        throw new Error();

      catalogo=data;

      if(!Array.isArray(catalogo.categorias))
        catalogo.categorias=[];

      renderCategorias();
      renderJuegos();
      renderAdmin();

      alert(
        'Catálogo cargado correctamente.'
      );

    }catch(e){

      alert(
        'JSON no válido.'
      );

    }

  };

  r.readAsText(f);

  ev.target.value='';

}

/* =========================
   INICIO
========================= */

/* =========================
   ORDENAR / EDITAR DESDE LA PÁGINA PRINCIPAL
========================= */

let modoOrden=false;

function entrarModoOrden(){

  categoriaActual="Todos";
  document.getElementById('searchInput').value='';

  cerrarAdmin();

  modoOrden=true;
  filtroSoloOcultosAdmin=false;
  huboCambiosSesionOrden=false;
  document.body.classList.add('modo-orden');
  const bar=document.getElementById('orden-bar');
  if(bar){
    bar.classList.remove('orden-bar-minimizado');
    bar.style.display='flex';
    const btnMin=document.getElementById('btn-min-orden-bar');
    if(btnMin)btnMin.textContent='🔽 Minimizar';
  }
  document.getElementById('orden-msg').textContent=
    'Arrastra ⠿ para ordenar · ⋯ tamaño y acciones · 🏷️ categoría';

  renderCategorias();
  aplicarFiltros();

  window.scrollTo({
    top:Math.max(0, document.getElementById('grid').offsetTop-65),
    behavior:'smooth'
  });

}

async function salirModoOrden(){

  modoOrden=false;
  filtroSoloOcultosAdmin=false;
  document.body.classList.remove('modo-orden');
  document.getElementById('orden-bar').style.display='none';
  const drawer=document.getElementById('dock-extra-tools');
  if(drawer)drawer.style.display='none';
  const arrow=document.getElementById('dock-more-arrow');
  if(arrow)arrow.textContent='▼';
  const btnMore=document.getElementById('btn-dock-mas');
  if(btnMore)btnMore.classList.remove('active');
  renderCategorias();
  aplicarFiltros();

  /* Si el usuario agregó, quitó o movió juegos y presionó Listo sin tocar Actualizar GitHub */
  const cfg=obtenerConfigGitHub();
  if(autoSyncTimer){
    clearTimeout(autoSyncTimer);
    autoSyncTimer=null;
    await sincronizarGitHubSilencioso('Cambios listos');
  }else if(cambiosPendientesSync && cfg && cfg.token && !syncEnCurso){
    await sincronizarGitHubSilencioso('Cambios listos');
  }else if(huboCambiosSesionOrden && cfg && cfg.token){
    mostrarToastSync('☁️ GitHub actualizado ✓', 2400);
  }
  huboCambiosSesionOrden=false;

}

function editarDesdeTarjeta(id){

  document.getElementById('admin-panel').style.display='block';
  document.getElementById('pin-screen').style.display='none';
  document.getElementById('admin-content').style.display='block';

  renderAdmin();
  editarJuego(id);

  document.getElementById('admin-panel').scrollTop=0;

}

async function ordenSubirGitHub(){

  const msg=document.getElementById('orden-msg');

  if(!obtenerConfigGitHub().token){
    abrirHerramientaAdmin('token');
    return;
  }

  msg.textContent='⏳ Subiendo cambios a GitHub...';
  await sincronizarGitHubSilencioso('Catálogo guardado');
  msg.textContent='✅ Catálogo sincronizado en GitHub';

}

(function(){

  const grid=document.getElementById('grid');
  let drag=null, timer=null;
  let rafPending=false;

  function actualizarPosicion(){
    if(!drag)return;
    drag.card.style.left=`${drag.x-drag.offsetX}px`;
    drag.card.style.top=`${drag.y-drag.offsetY}px`;
  }

  function moverMarcador(){
    if(!drag)return;
    const el=document.elementFromPoint(drag.x,drag.y);
    const target=el&&el.closest?el.closest('.card'):null;
    if(!target || target===drag.card || target===drag.placeholder || target.parentNode!==grid)return;

    const rect=target.getBoundingClientRect();
    const despues=
      drag.y>rect.top+rect.height/2 ||
      (drag.y>=rect.top && drag.y<=rect.bottom && drag.x>rect.left+rect.width/2);
    const siguiente=despues?target.nextElementSibling:target;
    if(siguiente===drag.placeholder)return;

    grid.insertBefore(drag.placeholder,siguiente);
    drag.changed=true;
    const msg=document.getElementById('orden-msg');
    if(msg)msg.textContent=`Suelta para colocar ${drag.y>rect.top+rect.height/2?'después de':'antes de'} ${target.querySelector('p')?.textContent||'esta tarjeta'}`;
  }

  function mover(){
    if(!drag)return;
    actualizarPosicion();
    moverMarcador();
  }

  function scheduleMover(){
    if(rafPending)return;
    rafPending=true;
    requestAnimationFrame(()=>{
      rafPending=false;
      if(drag)mover();
    });
  }

  grid.addEventListener('pointerdown',e=>{

    if(!modoOrden)return;

    const h=e.target.closest('.handle');
    if(!h)return;

    cerrarMenusTarjetas();
    const card=h.closest('.card');
    const r=card.getBoundingClientRect();
    const placeholder=document.createElement('div');
    placeholder.className='card card-drag-placeholder';
    placeholder.dataset.tamano=card.dataset.tamano;
    placeholder.setAttribute('aria-hidden','true');
    placeholder.style.height=`${r.height}px`;
    card.before(placeholder);

    drag={
      card,h,placeholder,
      id:e.pointerId,
      offsetX:e.clientX-r.left,
      offsetY:e.clientY-r.top,
      x:e.clientX,
      y:e.clientY,
      changed:false
    };

    document.body.classList.add('is-dragging-card');
    card.classList.add('arrastrando');
    card.style.width=`${r.width}px`;
    card.style.height=`${r.height}px`;
    card.style.left=`${r.left}px`;
    card.style.top=`${r.top}px`;
    card.style.transform='scale(1.04)';

    try{h.setPointerCapture(e.pointerId);}catch(err){}

    e.preventDefault();
    const msg=document.getElementById('orden-msg');
    if(msg)msg.textContent='Moviendo tarjeta… sigue el recuadro punteado y suelta para colocarla';

    /* desplazamiento suave y optimizado al acercarse a los bordes */
    timer=setInterval(()=>{
      if(!drag)return;
      let scrollDelta=0;
      if(drag.y<90) scrollDelta = -12;
      else if(drag.y>window.innerHeight-90) scrollDelta = 12;

      if(scrollDelta!==0){
        window.scrollBy(0,scrollDelta);
        scheduleMover();
      }
    },25);

  });

  document.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.id)return;
    drag.x=e.clientX;
    drag.y=e.clientY;
    scheduleMover();
  });

  function soltar(e){
    if(!drag||e.pointerId!==drag.id)return;

    const movimiento=drag;
    clearInterval(timer);
    timer=null;

    document.body.classList.remove('is-dragging-card');
    movimiento.card.classList.remove('arrastrando');
    movimiento.card.style.position='';
    movimiento.card.style.width='';
    movimiento.card.style.height='';
    movimiento.card.style.left='';
    movimiento.card.style.top='';
    movimiento.card.style.transform='';
    movimiento.placeholder.replaceWith(movimiento.card);

    drag=null;

    const msg=document.getElementById('orden-msg');
    if(movimiento.changed){
      [...grid.querySelectorAll('.card')].forEach((c,i)=>{
        const j=catalogo.juegos.find(x=>x.id===c.dataset.id);
        if(j)j.orden=i+1;
      });

      catalogo.juegos.sort((a,b)=>(a.orden||0)-(b.orden||0));
      if(msg)msg.textContent='✔ Tarjeta reubicada · El nuevo orden se guardará al tocar ✅ Listo';
      cambiosPendientesSync=true;
      huboCambiosSesionOrden=true;
    }else if(msg){
      msg.textContent='No cambió el orden de las tarjetas.';
    }
  }

  document.addEventListener('pointerup',soltar);
  document.addEventListener('pointercancel',soltar);

})();

/* =========================
   CUENTAS / PERFILES
========================= */

let cuentas=[];
let cuentaActual=null;
let cuentasSucias=false;
let cuentaPendiente=null;

const AVATARES=['🐣','🦄','🚀','🐱','🐶','🦖','🌈','⭐','🎨','🎮','🐼','🦊','🐰','🦋','🐬','👸','🧚‍♀️','🧜‍♀️','👑','💖','🌸','🍓','🍦','🧁'];

const CATEGORIAS_EMOJIS=[
  {
    titulo:'👑 Princesas, Hadas, Unicornios y Magia',
    emojis:['🦄','👸','🧚‍♀️','🧜‍♀️','🦸‍♀️','🧙‍♀️','👑','🎀','💖','💝','💘','💗','💓','💞','💕','🌸','🌺','🌷','🌹','🌻','🌼','🪄','💎','💍','🩰','🎠','🎡','🌈','⭐','🌟','✨','💫']
  },
  {
    titulo:'🐾 Animalitos Tiernos',
    emojis:['🐱','🐶','🐰','🦊','🐼','🐨','🐣','🐥','🦋','🐬','🐳','🦖','🦕','🐢','🐙','🐝','🐞','🦩','🦢','🐹','🐻','🐻‍❄️','🐯','🦁','🐮','🐷','🐸','🐵','🐧','🐦','🦉','🐴']
  },
  {
    titulo:'🍓 Dulces, Postres y Frutas',
    emojis:['🍓','🍒','🍉','🍑','🍎','🍍','🍌','🍇','🍦','🍧','🍨','🧁','🍰','🎂','🍭','🍬','🍫','🍩','🍪','🍿','🧋','🧃','🍕','🍔','🍟','🥞','🧇','🥐']
  },
  {
    titulo:'😊 Caritas, Juegos, Música y Arte',
    emojis:['😊','🥰','😍','🤩','🥳','😎','😇','🤠','😺','😸','😻','🎨','🎮','🕹️','🎲','🧩','🎵','🎶','🎧','🎤','🎸','🎹','🚀','🛸','🏆','⚽','🏀','🛹','🛼','🎯','🎪','🎬']
  }
];

let cuentaIdEditandoEmoji=null;

function abrirSelectorEmojiCuenta(idCuenta){
  const targetId=idCuenta || (cuentaActual ? cuentaActual.id : (cuentas[0]&&cuentas[0].id));
  const c=cuentas.find(x=>x.id===targetId) || cuentaActual || cuentas[0];
  if(!c)return;

  cuentaIdEditandoEmoji=c.id;
  document.getElementById('emoji-modal-titulo').textContent=`🎨 Elige el icono para "${c.nombre}" (actual: ${c.avatar})`;
  const customInp=document.getElementById('emoji-custom-input');
  if(customInp)customInp.value=c.avatar||'';

  const cont=document.getElementById('emoji-categorias-cont');
  cont.innerHTML=CATEGORIAS_EMOJIS.map(cat=>`
    <div class="emoji-cat-title">${escapeHtml(cat.titulo)}</div>
    <div class="emoji-grid">
      ${cat.emojis.map(em=>`
        <button type="button" class="emoji-btn" onclick="seleccionarEmojiCuenta('${escapeAttr(em)}')">${escapeHtml(em)}</button>
      `).join('')}
    </div>
  `).join('');

  document.getElementById('emoji-modal').style.display='flex';
}

function cerrarSelectorEmoji(){
  document.getElementById('emoji-modal').style.display='none';
  cuentaIdEditandoEmoji=null;
}

function aplicarEmojiPersonalizado(){
  const val=(document.getElementById('emoji-custom-input')?.value||'').trim();
  if(!val){
    mostrarToastSync('⚠️ Escribe o pega un emoji primero.');
    return;
  }
  /* Tomar el primer emoji / símbolo escrito */
  const chars=Array.from(val);
  const emoji=chars.slice(0,2).join('');
  seleccionarEmojiCuenta(emoji);
}

async function seleccionarEmojiCuenta(nuevoEmoji){
  const emoji=String(nuevoEmoji||'').trim();
  if(!emoji)return;

  const c=cuentas.find(x=>x.id===cuentaIdEditandoEmoji) || cuentaActual || cuentas[0];
  if(!c)return;

  c.avatar=emoji;
  cuentasSucias=true;

  /* Guardar también localmente por si aún no tiene token de GitHub */
  try{
    localStorage.setItem('freshmind_avatar_'+c.id, emoji);
  }catch(e){}

  actualizarBotonCuentas();

  if(document.getElementById('cuentas-screen').style.display==='block'){
    mostrarSelector();
  }
  if(document.getElementById('admin-panel').style.display==='block' && document.getElementById('editor').innerHTML.includes('👤 Cuentas')){
    mostrarCuentas();
  }

  cerrarSelectorEmoji();
  programarAutoSyncGitHub(`🎨 Icono cambiado a ${emoji}`, 800);
}

function normalizarCuenta(c,i){

  const id=String(c.id||('cuenta-'+i)).replace(/[^a-z0-9-]/gi,'');

  return {
    id,
    nombre:c.nombre||id,
    avatar:c.avatar||'🎮',
    archivo:c.archivo||(i===0?'juegos.json':'juegos-'+id+'.json'),
    sal:c.sal||'',
    claveEntrar:c.claveEntrar||null,
    claveAdmin:c.claveAdmin||null,
    adminLibre:!!c.adminLibre,
    sinAnuncios:!!c.sinAnuncios
  };

}

function cuentaPrincipal(){

  return normalizarCuenta({
    id:'hija',
    nombre:'Hija',
    avatar:'👸',
    archivo:'juegos.json',
    sinAnuncios:true
  },0);

}

function datosCuentas(){

  return {
    version:1,
    cuentas:cuentas.map(c=>({
      id:c.id,nombre:c.nombre,avatar:c.avatar,archivo:c.archivo,
      sal:c.sal,claveEntrar:c.claveEntrar,claveAdmin:c.claveAdmin,
      adminLibre:c.adminLibre,
      sinAnuncios:!!c.sinAnuncios
    }))
  };

}

function aplicarConfigAnuncios(){
  const sinAds = !!(cuentaActual && cuentaActual.sinAnuncios);
  document.body.classList.toggle('sin-anuncios', sinAds);
  if(sinAds){
    try{
      document.querySelectorAll('ins.adsbygoogle, .adsbygoogle, iframe[id^="aswift_"], iframe[id^="google_ads_"], .google-auto-placed').forEach(el=>{
        el.style.display='none';
      });
    }catch(e){}
  }
}

function nuevaSal(){

  const a=new Uint8Array(8);

  (window.crypto||{getRandomValues:x=>x.forEach((_,i)=>x[i]=Math.random()*256)})
    .getRandomValues(a);

  return [...a].map(x=>x.toString(16).padStart(2,'0')).join('');

}

/* Es un candado suave, no seguridad real: los archivos de un repositorio público se pueden leer */
async function hashClave(clave,sal){

  const txt=(sal||'')+':'+clave;

  try{

    if(window.crypto && crypto.subtle){

      const b=await crypto.subtle.digest(
        'SHA-256',
        new TextEncoder().encode(txt)
      );

      return [...new Uint8Array(b)]
        .map(x=>x.toString(16).padStart(2,'0'))
        .join('');

    }

  }catch(e){}

  let h1=0xdeadbeef,h2=0x41c6ce57;

  for(let i=0;i<txt.length;i++){
    const ch=txt.charCodeAt(i);
    h1=Math.imul(h1^ch,2654435761);
    h2=Math.imul(h2^ch,1597334677);
  }

  h1=Math.imul(h1^(h1>>>16),2246822507)^Math.imul(h2^(h2>>>13),3266489909);
  h2=Math.imul(h2^(h2>>>16),2246822507)^Math.imul(h1^(h1>>>13),3266489909);

  return 'c'+(4294967296*(2097151&h2)+(h1>>>0)).toString(16);

}

async function iniciarCuentas(){

  verificarServidorGemini();

  try{

    const r=await fetch('cuentas.json',{cache:'no-store'});

    if(r.ok){

      const d=await r.json();

      if(Array.isArray(d.cuentas) && d.cuentas.length)
        cuentas=d.cuentas.map(normalizarCuenta);

    }

  }catch(e){}

  if(!cuentas.length)cuentas=[cuentaPrincipal()];

  if( Array.isArray(cuentas) ){
    cuentas.forEach(c=>{
      try{
        const guardado=localStorage.getItem('freshmind_avatar_'+c.id);
        if(guardado)c.avatar=guardado;
      }catch(e){}
    });
  }

  /* 1. Si la URL solicita una cuenta específica (?cuenta=id) */
  const pedida=new URLSearchParams(location.search).get('cuenta');
  if(pedida){
    const solicitada=cuentas.find(c=>c.id===pedida || (pedida==='principal'&&c.id==='hija'));
    if(solicitada){
      if(solicitada.claveEntrar){
        const passGuardado=localStorage.getItem('freshmind_saved_pass_'+solicitada.id);
        if(passGuardado && passGuardado===solicitada.claveEntrar){
          await abrirCuenta(solicitada);
          return;
        }
        mostrarSelector();
        elegirCuenta(solicitada.id);
        return;
      }
      await abrirCuenta(solicitada);
      return;
    }
  }

  /* 2. Si este dispositivo (laptop o celular) ya tiene una sesión guardada (ej: Hija o Luis) */
  const guardadaId=localStorage.getItem('freshmind_ultima_cuenta');
  if(guardadaId){
    if(guardadaId==='visitante'){
      const visGuardado=localStorage.getItem('freshmind_visitante');
      let visData={nombre:'Jugador',avatar:'🚀'};
      try{ if(visGuardado) visData=JSON.parse(visGuardado); }catch(e){}
      await abrirCuenta({
        id:'visitante',
        nombre:visData.nombre||'Jugador',
        avatar:visData.avatar||'🚀',
        archivo:'juegos.json',
        sal:'',claveEntrar:null,claveAdmin:null,adminLibre:false,
        sinAnuncios:false
      });
      return;
    }

    const cGuardada=cuentas.find(c=>c.id===guardadaId || (guardadaId==='principal'&&c.id==='hija'));
    if(cGuardada){
      if(cGuardada.claveEntrar){
        const passGuardado=localStorage.getItem('freshmind_saved_pass_'+cGuardada.id);
        if(passGuardado && passGuardado===cGuardada.claveEntrar){
          /* ¡Contraseña guardada en este dispositivo! Ingresa directo sin pedir clave */
          await abrirCuenta(cGuardada);
          return;
        }
      }else{
        await abrirCuenta(cGuardada);
        return;
      }
    }
  }

  /* 3. Si hay un visitante previo guardado en este navegador */
  const visGuardado=localStorage.getItem('freshmind_visitante');
  if(visGuardado){
    let visData={nombre:'Jugador',avatar:'🚀'};
    try{ visData=JSON.parse(visGuardado); }catch(e){}
    await abrirCuenta({
      id:'visitante',
      nombre:visData.nombre||'Jugador',
      avatar:visData.avatar||'🚀',
      archivo:'juegos.json',
      sal:'',claveEntrar:null,claveAdmin:null,adminLibre:false,
      sinAnuncios:false
    });
    return;
  }

  /* 4. PRIMERA VEZ QUE VISITA: Cargar catálogo de la hija de fondo y mostrar pantalla de bienvenida */
  const cuentaBase=cuentas.find(c=>c.id==='hija'||c.id==='principal')||cuentas[0];
  await abrirCuenta(cuentaBase);
  mostrarPantallaBienvenida();

}

async function abrirCuenta(c,inicial){

  if(modoOrden)salirModoOrden();

  cuentaActual=c;
  aplicarConfigAnuncios();
  categoriaActual='Todos';
  document.getElementById('searchInput').value='';

  cerrarJuego();

  if(inicial){
    catalogo=inicial;
    renderCategorias();
    renderJuegos();
  }else{
    await cargarCatalogo();
  }

  renderAdmin();
  actualizarBotonCuentas();

}

function actualizarBotonCuentas(){

  const b=document.getElementById('btn-cuentas');

  b.style.display='flex';
  b.textContent=cuentaActual
    ? cuentaActual.avatar
    : '🎮';
  b.title=cuentaActual
    ? 'Cuenta: '+cuentaActual.nombre+' (toca para cambiar cuenta o cambiar tu emoji)'
    : 'Cambiar cuenta o emoji';

  document.getElementById('admin-cuenta').textContent=
    cuentas.length>1 && cuentaActual ? '· '+cuentaActual.nombre : '';

  document.getElementById('admin-archivo').textContent=
    cuentaActual ? cuentaActual.archivo : 'juegos.json';

}

/* =========================
   TRAER JUEGOS DE OTRA CUENTA
========================= */

let juegosOtraCuentaCache=[];

async function mostrarTraerDeCuenta(){
  const e=document.getElementById('editor');
  const otras=cuentas.filter(c=>!cuentaActual || c.id!==cuentaActual.id);

  if(!otras.length){
    e.innerHTML=`
      <div style="background:#222;padding:14px;border-radius:10px;margin-bottom:15px">
        <h3>🔄 Traer juegos de otra cuenta</h3>
        <p class="admin-muted">Aún no tienes otra cuenta creada. Crea una en <b>👤 Cuentas</b> para poder pasar juegos entre cuentas.</p>
        <button onclick="cancelarEditor()">Cerrar</button>
      </div>`;
    return;
  }

  e.innerHTML=`
    <div style="background:#222;padding:14px;border-radius:10px;margin-bottom:15px;border:1px solid #3a7bd5">
      <h3>🔄 Traer juegos a "${escapeHtml(cuentaActual.nombre)}"</h3>
      <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:12px">
        <label style="font-size:13px">
          Cuenta origen:
          <select id="selCuentaOrigen" onchange="cargarJuegosCuentaOrigen()" style="padding:8px;border-radius:6px;background:#292929;color:#fff;border:1px solid #555;margin-left:6px">
            ${otras.map(c=>`<option value="${escapeAttr(c.id)}">${escapeHtml(c.avatar+' '+c.nombre)} (${escapeHtml(c.archivo)})</option>`).join('')}
          </select>
        </label>
        <input id="filtroTraerCuenta" placeholder="🔎 Buscar juego en esa cuenta..." oninput="renderListaTraerCuenta()" style="padding:8px 10px;border-radius:6px;background:#292929;color:#fff;border:1px solid #555;flex:1;min-width:180px">
        <button type="button" onclick="seleccionarTodosTraer(true)">☑️ Marcar disponibles</button>
        <button type="button" onclick="seleccionarTodosTraer(false)">⬜ Desmarcar</button>
      </div>

      <div id="listaTraerCuenta" style="max-height:320px;overflow:auto;display:grid;gap:6px;margin-bottom:12px;padding-right:4px">
        <p class="admin-muted">Cargando juegos...</p>
      </div>

      <div class="admin-actions" style="margin-bottom:0">
        <button onclick="confirmarTraerJuegos()" style="background:#2b6cb0;color:#fff;font-weight:bold">
          📥 Traer seleccionados a ${escapeHtml(cuentaActual.nombre)}
        </button>
        <button onclick="cancelarEditor()">Cancelar</button>
      </div>
    </div>
  `;

  e.scrollIntoView({behavior:'smooth',block:'nearest'});
  await cargarJuegosCuentaOrigen();
}

async function cargarJuegosCuentaOrigen(){
  const sel=document.getElementById('selCuentaOrigen');
  const cont=document.getElementById('listaTraerCuenta');
  if(!sel||!cont)return;

  const origen=cuentas.find(c=>c.id===sel.value);
  if(!origen)return;

  cont.innerHTML='<p class="admin-muted">Cargando catálogo de '+escapeHtml(origen.nombre)+'...</p>';
  juegosOtraCuentaCache=[];

  try{
    const r=await fetch(origen.archivo,{cache:'no-store'});
    if(r.ok){
      const d=await r.json();
      if(Array.isArray(d.juegos)){
        juegosOtraCuentaCache=[...d.juegos].sort((a,b)=>(a.orden||0)-(b.orden||0));
      }
    }
  }catch(e){}

  renderListaTraerCuenta();
}

function renderListaTraerCuenta(){
  const cont=document.getElementById('listaTraerCuenta');
  if(!cont)return;

  if(!juegosOtraCuentaCache.length){
    cont.innerHTML='<p class="admin-muted">Esa cuenta no tiene juegos guardados todavía.</p>';
    return;
  }

  const filtro=(document.getElementById('filtroTraerCuenta')?.value||'').trim().toLowerCase();
  const urlsActuales=new Set((catalogo.juegos||[]).map(j=>String(j.url||'').trim()));

  cont.innerHTML='';

  juegosOtraCuentaCache
    .filter(j=>!filtro || String(j.nombre||'').toLowerCase().includes(filtro) || String(j.categoria||'').toLowerCase().includes(filtro))
    .forEach((j,idx)=>{
      const yaExiste=urlsActuales.has(String(j.url||'').trim());
      const row=document.createElement('label');
      row.className='admin-row';
      row.style.cursor='pointer';
      row.style.margin='0';
      if(yaExiste)row.style.opacity='0.6';

      row.innerHTML=`
        <input type="checkbox" class="chk-traer-juego" data-idx="${idx}" ${yaExiste?'':'checked'} style="width:18px;height:18px">
        <img src="${escapeAttr(j.imagen)}" alt="" onerror="this.src='portadas/logo.png'">
        <div class="grow">
          <b>${escapeHtml(j.nombre)}</b>
          ${yaExiste?'<span style="color:#68d391;font-size:12px"> · ✔ Ya está en esta cuenta</span>':''}
          <div class="admin-muted">${escapeHtml(j.tipo||'iframe')} · ${escapeHtml(j.categoria||'Todos')}</div>
        </div>
      `;
      cont.appendChild(row);
    });
}

function seleccionarTodosTraer(marcar){
  const urlsActuales=new Set((catalogo.juegos||[]).map(j=>String(j.url||'').trim()));
  document.querySelectorAll('.chk-traer-juego').forEach(chk=>{
    const j=juegosOtraCuentaCache[Number(chk.dataset.idx)];
    if(!j)return;
    const yaExiste=urlsActuales.has(String(j.url||'').trim());
    chk.checked=marcar ? !yaExiste : false;
  });
}

async function confirmarTraerJuegos(){
  const seleccionados=[...document.querySelectorAll('.chk-traer-juego:checked')];
  if(!seleccionados.length){
    alert('Selecciona al menos un juego para traer.');
    return;
  }

  let agregados=0;
  seleccionados.forEach((chk,n)=>{
    const j=juegosOtraCuentaCache[Number(chk.dataset.idx)];
    if(!j)return;
    const copia=JSON.parse(JSON.stringify(j));
    copia.id='game-'+Date.now()+'-'+n;
    copia.orden=catalogo.juegos.length+1;
    catalogo.juegos.push(copia);
    agregados++;
  });

  reordenar();
  renderCategorias();
  aplicarFiltros();
  renderAdmin();
  cancelarEditor();
  cerrarAdmin();

  programarAutoSyncGitHub(`📥 ${agregados} juego(s) traído(s) a ${cuentaActual.nombre}`, 900);
}

function mostrarSelector(){

  const l=document.getElementById('cuentas-lista');

  l.innerHTML='';

  cuentas.forEach(c=>{

    const wrap=document.createElement('div');
    wrap.style.display='flex';
    wrap.style.flexDirection='column';
    wrap.style.alignItems='center';
    wrap.style.gap='6px';

    const passGuardado=!!(c.claveEntrar && localStorage.getItem('freshmind_saved_pass_'+c.id)===c.claveEntrar);

    const b=document.createElement('button');
    b.className='cuenta-card';
    b.innerHTML=
      '<span class="av">'+escapeHtml(c.avatar)+'</span>'+
      '<b>'+escapeHtml(c.nombre)+'</b>'+
      (c.claveEntrar ? (passGuardado ? ' <span style="font-size:11px;color:#68d391;display:block;margin-top:2px">💾 Sesión guardada</span>' : ' 🔒') : '');
    b.onclick=()=>elegirCuenta(c.id);

    const btnEmoji=document.createElement('button');
    btnEmoji.type='button';
    btnEmoji.className='btn';
    btnEmoji.style.cssText='background:rgba(255,255,255,.16);color:#fff;font-size:12px;padding:6px 10px;border-radius:12px;border:1px solid rgba(255,255,255,.25);cursor:pointer;font-weight:bold';
    btnEmoji.textContent='🎨 Cambiar icono';
    btnEmoji.onclick=(ev)=>{
      ev.stopPropagation();
      abrirSelectorEmojiCuenta(c.id);
    };

    wrap.appendChild(b);
    wrap.appendChild(btnEmoji);

    if(passGuardado){
      const btnOlvidar=document.createElement('button');
      btnOlvidar.type='button';
      btnOlvidar.style.cssText='background:transparent;border:none;color:#fc8181;font-size:11px;cursor:pointer;padding:2px 6px;text-decoration:underline';
      btnOlvidar.textContent='Cerrar sesión (olvidar clave)';
      btnOlvidar.onclick=(ev)=>{
        ev.stopPropagation();
        try{ localStorage.removeItem('freshmind_saved_pass_'+c.id); }catch(e){}
        mostrarToastSync('🔒 Contraseña olvidada en este dispositivo.');
        mostrarSelector();
      };
      wrap.appendChild(btnOlvidar);
    }

    l.appendChild(wrap);

  });

  cancelarClaveCuenta();

  document.getElementById('cuentas-cerrar').style.display=
    cuentaActual?'inline-block':'none';

  document.getElementById('cuentas-screen').style.display='block';

}

function ocultarSelector(){

  document.getElementById('cuentas-screen').style.display='none';

}

function elegirCuenta(id){

  const c=cuentas.find(x=>x.id===id || (id==='principal'&&x.id==='hija'));

  if(!c)return;

  if(c.claveEntrar){

    /* Verificar si la contraseña ya fue guardada en este dispositivo (excepto para luis que siempre requiere clave) */
    if(c.id !== 'luis'){
      try{
        const passGuardado=localStorage.getItem('freshmind_saved_pass_'+c.id);
        if(passGuardado && passGuardado===c.claveEntrar){
          localStorage.setItem('freshmind_ultima_cuenta', c.id);
          ocultarSelector();
          abrirCuenta(c);
          mostrarToastSync('✨ Sesión iniciada: '+c.nombre);
          return;
        }
      }catch(e){}
    }

    cuentaPendiente=c;

    document.getElementById('cuentas-screen').style.display='block';
    document.getElementById('cuentas-lista').style.display='none';
    document.getElementById('cuentas-cerrar').style.display='none';
    document.getElementById('cuentas-clave').style.display='block';
    document.getElementById('cuentas-clave-titulo').textContent=
      c.avatar+' Contraseña de '+c.nombre;
    document.getElementById('cuentas-clave-error').textContent='';

    const chkRecordar=document.getElementById('cuentas-clave-recordar');
    if(chkRecordar) chkRecordar.checked=true;

    const i=document.getElementById('cuentas-clave-input');
    i.value='';
    i.focus();

    return;

  }

  try{
    localStorage.setItem('freshmind_ultima_cuenta', c.id);
  }catch(e){}

  ocultarSelector();
  abrirCuenta(c);

}

async function confirmarClaveCuenta(){

  const c=cuentaPendiente;

  if(!c)return;

  const v=document.getElementById('cuentas-clave-input').value;
  const hash=await hashClave(v,c.sal);

  if(hash===c.claveEntrar){

    const recordar=(c.id !== 'luis') && document.getElementById('cuentas-clave-recordar')?.checked;
    if(recordar){
      try{
        localStorage.setItem('freshmind_saved_pass_'+c.id, hash);
      }catch(e){}
    }else{
      try{
        localStorage.removeItem('freshmind_saved_pass_'+c.id);
      }catch(e){}
    }

    try{
      localStorage.setItem('freshmind_ultima_cuenta', c.id);
    }catch(e){}

    cuentaPendiente=null;
    ocultarSelector();
    await abrirCuenta(c);

    if(recordar){
      mostrarToastSync('💾 Contraseña guardada en este dispositivo.');
    }

  }else{

    document.getElementById('cuentas-clave-error').textContent=
      'Contraseña incorrecta.';

  }

}

function cancelarClaveCuenta(){

  cuentaPendiente=null;

  document.getElementById('cuentas-clave').style.display='none';
  document.getElementById('cuentas-lista').style.display='flex';
  document.getElementById('cuentas-cerrar').style.display=
    cuentaActual?'inline-block':'none';

}

/* ===================================================
   PANTALLA DE BIENVENIDA Y PERFIL VISITANTE
=================================================== */

let avatarBienvenidaSeleccionado='🚀';
const EMOJIS_BIENVENIDA=['🚀','🦄','🐱','🦊','🐼','🦁','🐯','👾','🤖','⚽','🎮','👑','🌟','⚡','🍕','🎨'];

function mostrarPantallaBienvenida(){
  const cont=document.getElementById('bienvenida-emojis');
  if(cont){
    cont.innerHTML=EMOJIS_BIENVENIDA.map(em=>`
      <button type="button" class="emoji-bienvenida-btn ${em===avatarBienvenidaSeleccionado?'seleccionado':''}" onclick="seleccionarEmojiBienvenida('${em}')">${em}</button>
    `).join('');
  }
  const modal=document.getElementById('bienvenida-screen');
  if(modal) modal.style.display='block';
  const inp=document.getElementById('bienvenida-nombre');
  if(inp) setTimeout(()=>inp.focus(), 250);
}

function cerrarPantallaBienvenida(){
  const modal=document.getElementById('bienvenida-screen');
  if(modal) modal.style.display='none';
}

function seleccionarEmojiBienvenida(emoji){
  avatarBienvenidaSeleccionado=emoji;
  document.querySelectorAll('.emoji-bienvenida-btn').forEach(btn=>{
    btn.classList.toggle('seleccionado', btn.textContent.trim()===emoji);
  });
}

async function crearPerfilVisitante(){
  const inp=document.getElementById('bienvenida-nombre');
  let nombre=(inp?.value||'').trim();
  if(!nombre) nombre='Jugador';
  const avatar=avatarBienvenidaSeleccionado||'🚀';

  const cuentaVisitante={
    id:'visitante',
    nombre:nombre,
    avatar:avatar,
    archivo:'juegos.json',
    sal:'',
    claveEntrar:null,
    claveAdmin:null,
    adminLibre:false,
    sinAnuncios:false /* Anuncios activos para visitantes */
  };

  try{
    localStorage.setItem('freshmind_visitante', JSON.stringify({ nombre, avatar }));
    localStorage.setItem('freshmind_ultima_cuenta', 'visitante');
  }catch(e){}

  cerrarPantallaBienvenida();
  await abrirCuenta(cuentaVisitante);
  mostrarToastSync(`🎉 ¡Bienvenido, ${escapeHtml(nombre)}! Disfruta los juegos.`);
}

async function entrarInvitadoDirecto(){
  const cuentaInvitado={
    id:'visitante',
    nombre:'Invitado',
    avatar:'🎮',
    archivo:'juegos.json',
    sal:'',
    claveEntrar:null,
    claveAdmin:null,
    adminLibre:false,
    sinAnuncios:false
  };

  try{
    localStorage.setItem('freshmind_visitante', JSON.stringify({ nombre:'Invitado', avatar:'🎮' }));
    localStorage.setItem('freshmind_ultima_cuenta', 'visitante');
  }catch(e){}

  cerrarPantallaBienvenida();
  await abrirCuenta(cuentaInvitado);
}

function abrirLoginDesdeBienvenida(){
  cerrarPantallaBienvenida();
  mostrarSelector();
}

/* ----- administración de cuentas ----- */

function camposClaves(p,c){

  const usaE=!!(c&&c.claveEntrar);
  const usaA=c ? (!!c.claveAdmin || !c.adminLibre) : false;

  return `
    <div class="claves-box">

      <label class="chk">
        <input type="checkbox" id="${p}UsaEntrar" ${usaE?'checked':''}
          onchange="document.getElementById('${p}ClaveEntrar').style.display=this.checked?'block':'none'">
        🔒 Pedir contraseña para entrar a la cuenta
      </label>
      <input type="password" id="${p}ClaveEntrar" maxlength="40"
        placeholder="${usaE?'Déjala vacía para conservar la actual':'Nueva contraseña (mínimo 4)'}"
        style="display:${usaE?'block':'none'};margin:6px 0 12px">

      <label class="chk">
        <input type="checkbox" id="${p}UsaAdmin" ${usaA?'checked':''}
          onchange="document.getElementById('${p}ClaveAdmin').style.display=this.checked?'block':'none'">
        🛠️ Pedir contraseña para administrar (agregar, editar, borrar)
      </label>
      <input type="password" id="${p}ClaveAdmin" maxlength="40"
        placeholder="${c&&!c.claveAdmin&&!c.adminLibre?'Ahora usa el PIN de siempre; escribe una nueva para cambiarlo':(usaA?'Déjala vacía para conservar la actual':'Nueva contraseña (mínimo 4)')}"
        style="display:${usaA?'block':'none'};margin:6px 0 12px">

    </div>`;

}

function mostrarCuentas(){

  const e=document.getElementById('editor');

  let filas='';

  cuentas.forEach((c,i)=>{

    filas+=`
      <div class="cuenta-fila" style="align-items:center">
        <button type="button" onclick="abrirSelectorEmojiCuenta('${escapeAttr(c.id)}')" title="Cambiar emoji de ${escapeAttr(c.nombre)}" style="font-size:26px;background:#1f1f1f;border:1px solid #444;border-radius:10px;width:46px;height:46px;cursor:pointer;display:flex;align-items:center;justify-content:center">${escapeHtml(c.avatar)}</button>
        <div class="grow">
          <b>${escapeHtml(c.nombre)}</b>${c.id===cuentaActual.id?' (abierta)':''}
          ${c.sinAnuncios ? '<span style="display:inline-block;background:#b7791f;color:#fff;font-size:11px;padding:2px 7px;border-radius:10px;margin-left:6px;font-weight:bold">⭐ SIN ANUNCIOS (VIP)</span>' : ''}
          <div class="admin-muted">
            ${escapeHtml(c.archivo)}
            ${c.claveEntrar?' · 🔒 entrar':''}
            ${(c.claveAdmin||!c.adminLibre)?' · 🛠️ admin':''}
          </div>
        </div>
        <button onclick="toggleSinAnuncios('${escapeAttr(c.id)}')" style="${c.sinAnuncios?'background:#d69e2e;color:#fff;font-weight:bold':'background:#333;color:#bbb'}" title="Activar/desactivar privilegio sin anuncios">${c.sinAnuncios?'⭐ Sin Anuncios':'📢 Con Anuncios'}</button>
        <button onclick="abrirSelectorEmojiCuenta('${escapeAttr(c.id)}')">🎨 Emoji</button>
        <button onclick="cerrarAdmin();elegirCuenta('${escapeAttr(c.id)}')">Abrir</button>
        ${i>0?`<button onclick="eliminarCuenta('${escapeAttr(c.id)}')">🗑️</button>`:''}
      </div>`;

  });

  e.innerHTML=`
    <div style="background:#222;padding:14px;border-radius:10px;margin-bottom:15px">
      <h3>👤 Cuentas y Privilegios</h3>
      <p class="admin-muted" style="margin-top:-6px;margin-bottom:12px">Puedes marcar una cuenta con <b>⭐ Sin Anuncios</b> (ideal para tu hija) para que no vea publicidad.</p>
      ${filas}
      <br>
      <button onclick="mostrarNuevaCuenta()">➕ Nueva cuenta</button>
      <button onclick="mostrarClavesCuenta()">🔑 Contraseñas de esta cuenta</button>
      <button onclick="subirCuentasGitHub()">☁️ Guardar cuentas en GitHub</button>
      <button onclick="cancelarEditor()">Cerrar</button>
    </div>`;

}

async function toggleSinAnuncios(id){
  const c=cuentas.find(x=>x.id===id);
  if(!c)return;
  c.sinAnuncios=!c.sinAnuncios;
  cuentasSucias=true;
  if(cuentaActual&&cuentaActual.id===id){
    aplicarConfigAnuncios();
  }
  mostrarCuentas();
  guardarCuentasLocal();
  mostrarToastSync(c.sinAnuncios?`⭐ "${c.nombre}" es ahora cuenta PRIVILEGIADA (SIN ANUNCIOS)`:`📢 "${c.nombre}" mostrará anuncios normalmente`);
  programarAutoSyncGitHub(`⭐ Privilegio sin anuncios de "${c.nombre}"`, 1000);
}

function mostrarNuevaCuenta(){

  const e=document.getElementById('editor');

  e.innerHTML=`
    <div style="background:#222;padding:14px;border-radius:10px;margin-bottom:15px">

      <h3>➕ Nueva cuenta</h3>

      <div class="form-grid">

        <label>
          Nombre
          <input id="nNombre" maxlength="24" placeholder="Ej. Hija, Valentina, María">
        </label>

        <label>
          Avatar
          <select id="nAvatar">
            ${AVATARES.map(a=>`<option value="${a}">${a}</option>`).join('')}
          </select>
        </label>

        <label>
          Juegos al empezar
          <select id="nCopiar">
            <option value="vacio">Sin ningún juego (para agregar los nuevos)</option>
            <option value="copiar">Copiar los juegos de esta cuenta</option>
          </select>
        </label>

      </div>

      <div style="margin:12px 0;background:#2a2a2a;padding:10px 14px;border-radius:8px">
        <label style="display:flex;align-items:center;gap:10px;cursor:pointer">
          <input type="checkbox" id="nSinAnuncios" style="width:18px;height:18px">
          <span>⭐ <b>Cuenta privilegiada sin anuncios</b> (marcar para tu hija)</span>
        </label>
      </div>

      <br>
      ${camposClaves('n',null)}
      <br>

      <button onclick="crearCuenta()">💾 Crear y abrir</button>
      <button onclick="mostrarCuentas()">Cancelar</button>

    </div>`;

}

function idCuentaUnico(nombre){

  let base=nombre.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g,'')
    .replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'cuenta';

  let id=base,n=2;

  while(cuentas.some(c=>c.id===id))id=base+'-'+(n++);

  return id;

}

async function crearCuenta(){

  const nombre=document.getElementById('nNombre').value.trim();

  if(!nombre){
    alert('Escribe un nombre para la cuenta.');
    return;
  }

  const usaE=document.getElementById('nUsaEntrar').checked;
  const usaA=document.getElementById('nUsaAdmin').checked;
  const cE=document.getElementById('nClaveEntrar').value;
  const cA=document.getElementById('nClaveAdmin').value;

  if((usaE&&cE.length<4)||(usaA&&cA.length<4)){
    alert('Las contraseñas deben tener al menos 4 caracteres.');
    return;
  }

  const id=idCuentaUnico(nombre);
  const sal=nuevaSal();

  const c={
    id,
    nombre,
    avatar:document.getElementById('nAvatar').value,
    archivo:'juegos-'+id+'.json',
    sal,
    claveEntrar:usaE?await hashClave(cE,sal):null,
    claveAdmin:usaA?await hashClave(cA,sal):null,
    adminLibre:!usaA,
    sinAnuncios:!!document.getElementById('nSinAnuncios')?.checked
  };

  const copiar=document.getElementById('nCopiar').value==='copiar';

  const base=copiar
    ? JSON.parse(JSON.stringify(catalogo))
    : {version:1,categorias:[],juegos:[]};

  cuentas.push(c);
  cuentasSucias=true;

  await abrirCuenta(c,base);

  mostrarCuentas();

  alert(
    'Cuenta "'+nombre+'" creada y abierta.\n\n'+
    'Agrega sus juegos y pulsa ☁️ Actualizar GitHub para que se guarde en todos tus dispositivos.'
  );

}

async function eliminarCuenta(id){

  const c=cuentas.find(x=>x.id===id);

  if(!c||c.id===cuentas[0].id)return;

  const ok=await pedirConfirmacion(
    '🗑️ Eliminar cuenta',
    `¿Eliminar la cuenta "${c.nombre}"? (Su archivo ${c.archivo} seguirá en GitHub hasta que lo borres allí).`,
    '🗑️ Sí, eliminar cuenta'
  );

  if(!ok)return;

  cuentas=cuentas.filter(x=>x.id!==id);
  cuentasSucias=true;

  if(cuentaActual.id===id){
    await abrirCuenta(cuentas[0]);
  }

  mostrarCuentas();

}

function mostrarClavesCuenta(){

  const e=document.getElementById('editor');

  e.innerHTML=`
    <div style="background:#222;padding:14px;border-radius:10px;margin-bottom:15px">
      <h3>🔑 Contraseñas de ${escapeHtml(cuentaActual.nombre)}</h3>
      ${camposClaves('c',cuentaActual)}
      <br>
      <button onclick="guardarClavesCuenta()">💾 Guardar</button>
      <button onclick="mostrarCuentas()">Cancelar</button>
    </div>`;

}

async function guardarClavesCuenta(){

  const c=cuentaActual;

  const usaE=document.getElementById('cUsaEntrar').checked;
  const usaA=document.getElementById('cUsaAdmin').checked;
  const cE=document.getElementById('cClaveEntrar').value;
  const cA=document.getElementById('cClaveAdmin').value;

  if((cE&&cE.length<4)||(cA&&cA.length<4)){
    alert('Las contraseñas deben tener al menos 4 caracteres.');
    return;
  }

  if(usaE&&!cE&&!c.claveEntrar){
    alert('Escribe la contraseña para entrar.');
    return;
  }

  if(usaA&&!cA&&!c.claveAdmin&&c.adminLibre){
    alert('Escribe la contraseña de administración.');
    return;
  }

  if(!c.sal)c.sal=nuevaSal();

  if(!usaE){
    c.claveEntrar=null;
  }else if(cE){
    c.claveEntrar=await hashClave(cE,c.sal);
  }

  if(!usaA){
    c.claveAdmin=null;
    c.adminLibre=true;
  }else if(cA){
    c.claveAdmin=await hashClave(cA,c.sal);
    c.adminLibre=false;
  }

  cuentasSucias=true;

  alert(
    'Contraseñas guardadas en esta pestaña.\n\n'+
    'Pulsa ☁️ Actualizar GitHub (o "Guardar cuentas en GitHub") para que valgan en todos tus dispositivos.'
  );

  mostrarCuentas();

}

async function subirCuentasGitHub(){

  const cfg=obtenerConfigGitHub();

  if(!cfg.token){
    alert('Primero guarda tu token en ☁️ Actualizar GitHub.');
    return;
  }

  try{

    await subirArchivoGitHub(
      {
        owner:cfg.owner||'luis98andi',
        repo:cfg.repo||'juegosaludables',
        branch:cfg.branch||'main',
        token:cfg.token
      },
      'cuentas.json',
      JSON.stringify(datosCuentas(),null,2),
      'Actualizar cuentas desde FreshMind Games'
    );

    cuentasSucias=false;

    alert('✅ cuentas.json actualizado en GitHub.');

  }catch(e){

    alert('❌ '+e.message);

  }

}

function mostrarCambiarClave(){
  const e=document.getElementById('editor');
  if(!e)return;
  const nombreCuenta=cuentaActual?.nombre || 'esta cuenta';
  const tieneClavePropia=!!(cuentaActual && cuentaActual.claveAdmin);

  e.innerHTML=`
    <div style="background:#222;border:1px solid #444;padding:16px;border-radius:12px;margin-bottom:15px;max-width:480px">
      <h3 style="margin:0 0 8px;font-size:17px;color:#fff">🔒 Cambiar contraseña de administración</h3>
      <p class="admin-muted" style="margin:0 0 14px;font-size:13px;line-height:1.4">
        Cambia la contraseña para administrar el catálogo (${escapeHtml(nombreCuenta)}). Al guardar, se sincronizará automáticamente en tu repositorio de GitHub para que sirva en todos tus dispositivos.
      </p>

      <div style="display:grid;gap:12px">
        <label style="font-size:13px;color:#cbd5e1;display:block">
          Contraseña antigua
          <input type="password" id="passAntigua" maxlength="40" placeholder="${tieneClavePropia?'Escribe tu contraseña actual':'Contraseña por defecto (1234)'}" style="width:100%;margin-top:5px;padding:9px 12px;border-radius:8px;border:1px solid #555;background:#181818;color:#fff;font-size:14px;box-sizing:border-box" onkeydown="if(event.key==='Enter')document.getElementById('passNueva').focus()">
        </label>

        <label style="font-size:13px;color:#cbd5e1;display:block">
          Nueva contraseña
          <input type="password" id="passNueva" maxlength="40" placeholder="Nueva contraseña (mínimo 4 caracteres)" style="width:100%;margin-top:5px;padding:9px 12px;border-radius:8px;border:1px solid #555;background:#181818;color:#fff;font-size:14px;box-sizing:border-box" onkeydown="if(event.key==='Enter')document.getElementById('passRepite').focus()">
        </label>

        <label style="font-size:13px;color:#cbd5e1;display:block">
          Repita la contraseña
          <input type="password" id="passRepite" maxlength="40" placeholder="Repite la nueva contraseña" style="width:100%;margin-top:5px;padding:9px 12px;border-radius:8px;border:1px solid #555;background:#181818;color:#fff;font-size:14px;box-sizing:border-box" onkeydown="if(event.key==='Enter')ejecutarCambioPassword()">
        </label>
      </div>

      <p id="passError" style="font-size:13px;color:#ff8b8b;margin:12px 0 0;min-height:18px"></p>

      <div class="admin-actions" style="margin-top:14px;margin-bottom:0">
        <button type="button" id="btnGuardarPass" onclick="ejecutarCambioPassword()" style="background:#2f855a;color:#fff;font-weight:bold;padding:10px 16px">
          💾 Guardar y sincronizar en GitHub
        </button>
        <button type="button" onclick="cancelarEditor()" style="padding:10px 16px">
          Cancelar
        </button>
      </div>
    </div>
  `;

  setTimeout(()=>{
    const el=document.getElementById('passAntigua');
    if(el)el.focus();
  },50);
}

async function ejecutarCambioPassword(){
  const errEl=document.getElementById('passError');
  const btn=document.getElementById('btnGuardarPass');
  const antigua=document.getElementById('passAntigua')?.value || '';
  const nueva=document.getElementById('passNueva')?.value || '';
  const repite=document.getElementById('passRepite')?.value || '';

  if(!antigua){
    errEl.style.color='#ff8b8b';
    errEl.textContent='❌ Debes ingresar tu contraseña antigua.';
    return;
  }

  let antiguaValida=false;
  if(cuentaActual && cuentaActual.claveAdmin){
    antiguaValida = (await hashClave(antigua, cuentaActual.sal)) === cuentaActual.claveAdmin;
  }else{
    antiguaValida = (antigua === PIN);
  }

  if(!antiguaValida){
    errEl.style.color='#ff8b8b';
    errEl.textContent='❌ La contraseña antigua es incorrecta.';
    return;
  }

  if(!nueva || nueva.length < 4){
    errEl.style.color='#ff8b8b';
    errEl.textContent='❌ La nueva contraseña debe tener al menos 4 caracteres.';
    return;
  }

  if(nueva !== repite){
    errEl.style.color='#ff8b8b';
    errEl.textContent='❌ Las contraseñas no coinciden. Escríbelas exactamente iguales.';
    return;
  }

  if(btn){
    btn.disabled=true;
    btn.textContent='⏳ Guardando...';
  }
  errEl.style.color='#90cdf4';
  errEl.textContent='⏳ Hasheando y guardando nueva contraseña...';

  if(!cuentaActual.sal)cuentaActual.sal=nuevaSal();
  cuentaActual.claveAdmin=await hashClave(nueva, cuentaActual.sal);
  cuentaActual.adminLibre=false;
  cuentasSucias=true;

  try{
    localStorage.setItem('freshmind_cuentas_cache', JSON.stringify(datosCuentas()));
  }catch(e){}

  const cfg=obtenerConfigGitHub();
  if(cfg && cfg.token){
    errEl.textContent='⏳ Sincronizando cuentas.json con GitHub...';
    try{
      await subirArchivoGitHub(
        {
          owner:cfg.owner||'luis98andi',
          repo:cfg.repo||'juegosaludables',
          branch:cfg.branch||'main',
          token:cfg.token
        },
        'cuentas.json',
        JSON.stringify(datosCuentas(),null,2),
        'Actualizar contraseña de administración en cuentas.json'
      );
      cuentasSucias=false;
      mostrarToastSync('✅ Contraseña guardada y sincronizada en GitHub ✓');
      alert('✅ ¡Contraseña cambiada con éxito!\n\nSe ha actualizado en tu repositorio de GitHub y ya rige para todos tus dispositivos.');
      cancelarEditor();
    }catch(err){
      errEl.style.color='#ff8b8b';
      errEl.textContent='⚠️ Contraseña guardada en esta sesión, pero falló GitHub: '+err.message;
      if(btn){
        btn.disabled=false;
        btn.textContent='💾 Guardar y sincronizar en GitHub';
      }
    }
  }else{
    mostrarToastSync('💾 Contraseña guardada localmente');
    alert('✅ Contraseña cambiada localmente en este navegador.\n\n⚠️ Para que se aplique automáticamente a todos tus demás dispositivos, recuerda ingresar tu token de GitHub en la opción 🔑 Token.');
    cancelarEditor();
  }
}

iniciarCuentas();
