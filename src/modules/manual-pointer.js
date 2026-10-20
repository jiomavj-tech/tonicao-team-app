/* v0.55 — Deixar o manual achável.
   O manual já existia atrás do botão "?", mas ninguém sabia. Agora ele tem
   um item fixo no Mais e um recado no Início, que some depois de aberto. */
(()=>{
  "use strict";
  function visto(){try{return localStorage.getItem("tonicao_manual_visto")==="1"}catch(e){return false}}
  function marcar(){try{localStorage.setItem("tonicao_manual_visto","1")}catch(e){}}

  window.abrirManualV055=function(){
    marcar();
    document.querySelectorAll("[data-manual-aviso]").forEach(x=>x.remove());
    try{TonicaoHelp.manual()}catch(e){toast("Abra o botão ? no canto da tela.")}
  };
  window.dispensarManualV055=function(btn){
    marcar();btn?.closest("[data-manual-aviso]")?.remove();
  };

  /* Item fixo no menu Mais */
  function porNoMais(){
    const host=document.getElementById("more");if(!host)return;
    if(host.querySelector(".section-title h2")?.textContent?.trim()!=="Mais")return;
    const list=host.querySelector(".list");if(!list)return;
    if(host.querySelector("[data-manual-item]"))return;
    const el=document.createElement("div");
    el.className="list-item";el.dataset.manualItem="1";
    el.onclick=()=>abrirManualV055();
    el.innerHTML='<div class="icon">📖</div><div><strong>Manual do aplicativo</strong><span class="small muted">Passo a passo de cada tela, por tema.</span></div>';
    list.appendChild(el);
  }
  const baseMore=window.renderMore;
  if(typeof baseMore==="function"){
    window.renderMore=async function(...a){const r=await baseMore.apply(this,a);setTimeout(porNoMais,30);return r};
  }

  /* Recado no Início, até a pessoa abrir o manual uma vez */
  function aviso(){
    try{
      if(visto())return;
      const home=document.getElementById("home");
      if(!home||home.querySelector("[data-manual-aviso]"))return;
      const box=document.createElement("div");
      box.dataset.manualAviso="1";box.className="notice";
      box.style.cssText="display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap";
      box.innerHTML=`<div><strong>📖 Com dúvida no aplicativo?</strong>
        <div class="small">O manual fica em <b>Mais → Manual do aplicativo</b>. E o botão <b>?</b> no canto da tela mostra a ajuda da tela em que você está.</div></div>
        <div class="actions" style="flex-wrap:nowrap">
          <button class="btn primary" onclick="abrirManualV055()">Abrir manual</button>
          <button class="mini-btn" onclick="dispensarManualV055(this)">Já vi</button>
        </div>`;
      home.appendChild(box);
    }catch(e){}
  }
  for(const fn of ["renderProfessorHome","renderStudentHome"]){
    const base=window[fn];if(typeof base!=="function")continue;
    window[fn]=async function(...a){const r=await base.apply(this,a);try{aviso()}catch(e){}return r};
  }
})();
