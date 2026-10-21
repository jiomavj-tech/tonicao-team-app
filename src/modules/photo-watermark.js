/* v0.61 — Marca d'água nas fotos dos alunos.
   Print não dá para bloquear em aplicativo de navegador: isso não existe na web,
   e quem vê a tela sempre pode fotografar com outro celular. O que dá para fazer
   é deixar a cópia rastreável — a foto sai com o nome de quem estava vendo e a
   data — e cortar o caminho fácil de salvar segurando o dedo.
   O Administrador liga e desliga em Mais → Configurar academia. */
(()=>{
  "use strict";
  const CSS=`
  .wm-wrap{position:relative;display:inline-block;line-height:0;max-width:100%}
  .wm-wrap>img{display:block;max-width:100%}
  .wm-wrap::after{
    content:attr(data-wm);
    position:absolute;inset:0;pointer-events:none;
    display:flex;align-items:center;justify-content:center;
    text-align:center;white-space:pre-line;line-height:1.35;
    font-family:system-ui,-apple-system,sans-serif;font-weight:700;
    font-size:clamp(9px,3.2vw,13px);letter-spacing:.02em;
    color:rgba(255,255,255,.72);
    text-shadow:0 1px 2px rgba(0,0,0,.65);
    background:linear-gradient(transparent 38%,rgba(0,0,0,.28) 100%);
    transform:rotate(-16deg);
  }
  /* a foto deixa de oferecer "Salvar imagem" ao segurar o dedo */
  .wm-wrap,.wm-wrap>img{
    -webkit-touch-callout:none;-webkit-user-select:none;user-select:none;-webkit-user-drag:none;
  }`;
  const st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);

  let ligada=true,quem="";
  async function carregar(){
    try{
      const s=await getSettings();
      ligada=s.photoWatermark!==false;                  // ligada por padrão
      const u=await TonicaoAuth.currentUser();
      quem=u?.name||u?.email||"";
    }catch(e){}
  }
  carregar();
  window.addEventListener("tonicao:data-synced",()=>carregar());
  window.recarregarMarcaV061=carregar;

  function texto(){
    const data=new Date().toLocaleDateString("pt-BR");
    const nome=String(quem||"").split(" ").slice(0,2).join(" ");
    return `Tonicão Team\n${nome}${nome?" · ":""}${data}\nuso interno`;
  }

  /* Envolve uma <img> com a marca, sem mexer no resto da tela */
  function marcar(img){
    if(!ligada||!img||img.dataset.wmOn)return;
    if(!img.closest(".student-row,.hero-row,#modalContent"))return;   // só foto de pessoa
    const w=img.naturalWidth||img.width||0,h=img.height||0;
    if((img.clientWidth||0)<70&&(img.clientHeight||0)<70)return;       // avatar pequeno não leva marca
    img.dataset.wmOn="1";
    const wrap=document.createElement("span");
    wrap.className="wm-wrap";wrap.dataset.wm=texto();
    img.parentNode.insertBefore(wrap,img);wrap.appendChild(img);
  }
  function varrer(raiz){
    if(!ligada)return;
    try{(raiz||document).querySelectorAll?.("img").forEach(marcar)}catch(e){}
  }
  new MutationObserver(ms=>{
    if(!ligada)return;
    for(const m of ms)for(const n of m.addedNodes){
      if(n.nodeType!==1)continue;
      if(n.tagName==="IMG")marcar(n);else varrer(n);
    }
  }).observe(document.documentElement,{childList:true,subtree:true});
  setTimeout(()=>varrer(),1200);

  /* Interruptor na tela do Administrador */
  window.alternarMarcaV061=async function(valor){
    if(!(await guard("manage_branding").catch(()=>true)))return;
    const s=await getSettings();s.photoWatermark=!!valor;await DB.put("settings",s);
    ligada=!!valor;
    if(!ligada){
      document.querySelectorAll(".wm-wrap").forEach(w=>{
        const img=w.querySelector("img");if(!img)return;
        delete img.dataset.wmOn;w.parentNode.insertBefore(img,w);w.remove();
      });
    }else varrer();
    toast(ligada?"Marca d'água ligada.":"Marca d'água desligada.");
  };

  const baseMore=window.renderMore;
  if(typeof baseMore==="function"){
    window.renderMore=async function(mode,...a){
      const r=await baseMore.call(this,mode,...a);
      try{
        if(mode!=="academy")return r;
        const host=document.getElementById("more");
        if(!host||host.querySelector("[data-wm-cfg]"))return r;
        const s=await getSettings();
        const on=s.photoWatermark!==false;
        const box=document.createElement("div");
        box.dataset.wmCfg="1";box.className="card";
        box.innerHTML=`<h3>Fotos dos alunos</h3>
          <div class="field"><label>Marca d'água nas fotos</label>
            <select id="cfgWm" onchange="alternarMarcaV061(this.value==='1')">
              <option value="1" ${on?"selected":""}>Ligada</option>
              <option value="0" ${on?"":"selected"}>Desligada</option>
            </select></div>
          <p class="small muted">Com ela ligada, a foto aparece com o nome de quem está vendo e a data por cima, e segurar o dedo deixa de oferecer "Salvar imagem".</p>
          <div class="notice payment small"><strong>Isto não impede print</strong>
            <div class="small">Nenhum aplicativo aberto pelo navegador consegue bloquear a captura de tela, e quem vê a tela sempre pode fotografar com outro celular. A marca serve para a cópia ficar rastreável e sem graça de repassar.</div></div>`;
        host.appendChild(box);
      }catch(e){}
      return r;
    };
  }
})();
