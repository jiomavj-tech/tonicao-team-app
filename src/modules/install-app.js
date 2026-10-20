/* v0.51 — Botão "Instalar o aplicativo".
   No Android o próprio navegador instala com um toque. No iPhone a Apple não
   permite isso: o app só pode ensinar o caminho, que é o botão Compartilhar.
   Por isso aqui tem os dois: instalação direta onde dá, e passo a passo onde não dá. */
(()=>{
  "use strict";
  let convite=null;                                   // convite de instalação do Android

  window.addEventListener("beforeinstallprompt",e=>{
    e.preventDefault();convite=e;
    document.querySelectorAll("[data-instalar]").forEach(x=>x.style.display="");
  });
  window.addEventListener("appinstalled",()=>{
    convite=null;try{localStorage.setItem("tonicao_instalado","1")}catch(e){}
    document.querySelectorAll("[data-instalar]").forEach(x=>x.remove());
    try{toast("Aplicativo instalado. ✅")}catch(e){}
  });

  function jaInstalado(){
    try{
      if(window.matchMedia?.("(display-mode: standalone)").matches)return true;
      if(window.navigator.standalone===true)return true;          // iPhone
      if(localStorage.getItem("tonicao_instalado")==="1")return true;
    }catch(e){}
    return false;
  }
  window.appJaInstaladoV051=jaInstalado;

  function aparelho(){
    const ua=navigator.userAgent||"";
    const iOS=/iPad|iPhone|iPod/.test(ua)||(/Mac/.test(ua)&&navigator.maxTouchPoints>1);
    if(iOS)return /CriOS/.test(ua)?"iphone-chrome":(/FxiOS|EdgiOS|OPiOS/.test(ua)?"iphone-outro":"iphone-safari");
    if(/Android/.test(ua))return "android";
    return "computador";
  }

  const PASSOS={
    "iphone-safari":{titulo:"Instalar no iPhone",
      passos:["Toque no botão <strong>Compartilhar</strong> — o quadradinho com a seta para cima, na barra de baixo do Safari.",
              "Role a lista e toque em <strong>Adicionar à Tela de Início</strong>.",
              "Toque em <strong>Adicionar</strong>, no canto de cima."],
      nota:"O ícone da Tonicão vai aparecer junto dos outros aplicativos. A partir daí ele abre sem o navegador."},
    "iphone-chrome":{titulo:"Instalar no iPhone",
      passos:["Toque nos <strong>três pontinhos</strong> do Chrome, no canto.",
              "Toque em <strong>Compartilhar…</strong>",
              "Escolha <strong>Adicionar à Tela de Início</strong> e confirme."],
      nota:"Pelo Safari costuma ser mais fácil: copie o endereço e abra no Safari."},
    "iphone-outro":{titulo:"Instalar no iPhone",
      passos:["Abra este mesmo endereço no <strong>Safari</strong>.",
              "Toque em <strong>Compartilhar</strong>, na barra de baixo.",
              "Escolha <strong>Adicionar à Tela de Início</strong>."],
      nota:"No iPhone só o Safari instala direito."},
    "android":{titulo:"Instalar no Android",
      passos:["Toque nos <strong>três pontinhos</strong> do navegador, no canto de cima.",
              "Toque em <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.",
              "Confirme em <strong>Instalar</strong>."],
      nota:""},
    "computador":{titulo:"Instalar no computador",
      passos:["Procure o ícone de instalar na barra de endereço, do lado direito.",
              "Ou abra o menu do navegador e escolha <strong>Instalar</strong>."],
      nota:""}
  };

  window.instalarAppV051=async function(){
    if(jaInstalado()){toast("O aplicativo já está instalado neste aparelho.");return}
    if(convite){                                      // Android: instala de verdade
      try{
        convite.prompt();
        const r=await convite.userChoice;
        convite=null;
        if(r?.outcome==="accepted")return;             // o aviso sai no appinstalled
        toast("Instalação cancelada. Você pode instalar depois em Mais.");
        return;
      }catch(e){/* cai no passo a passo */}
    }
    const p=PASSOS[aparelho()];
    showModal(`<h3>📲 ${p.titulo}</h3>
      <p class="small muted">Instalar deixa o app com ícone próprio, abrindo em tela cheia e sem a barra do navegador.</p>
      <div class="list">${p.passos.map((x,i)=>`<div class="list-item" style="cursor:default">
        <div class="icon">${i+1}</div><div class="meta"><strong>${x}</strong></div></div>`).join("")}</div>
      ${p.nota?`<div class="notice small" style="margin-top:10px">${p.nota}</div>`:""}
      <button class="btn secondary full" style="margin-top:12px" onclick="closeModal()">Entendi</button>`);
  };

  /* Entra no menu Mais, junto de Compartilhar. */
  function porNoMais(){                               // continua no Mais mesmo para quem dispensou
    const host=document.getElementById("more");if(!host)return;
    if(host.querySelector(".section-title h2")?.textContent?.trim()!=="Mais")return;
    const list=host.querySelector(".list");if(!list)return;
    if(host.querySelector("[data-instalar-item]"))return;
    if(jaInstalado())return;
    const el=document.createElement("div");
    el.className="list-item";el.dataset.instalarItem="1";
    el.onclick=()=>instalarAppV051();
    el.innerHTML='<div class="icon">📲</div><div><strong>Instalar o aplicativo</strong><span class="small muted">Ícone na tela do celular, abre em tela cheia.</span></div>';
    list.prepend(el);
  }
  const baseMore=window.renderMore;
  window.renderMore=async function(...a){
    const r=await baseMore.apply(this,a);
    try{setTimeout(porNoMais,30)}catch(e){}
    return r;
  };

  /* ---- Portão de instalação: depois de entrar, pede para instalar antes de usar ----
     Tem uma saída pequena de propósito. A conferência de "está instalado" não é
     exata em todo navegador, e quem abre pelo navegador de dentro do WhatsApp não
     consegue instalar — sem a saída, essa pessoa ficaria trancada fora do app. */
  function pulouAgora(){try{return sessionStorage.getItem("tonicao_pular_instalar")==="1"}catch(e){return false}}
  function nuncaMais(){try{return localStorage.getItem("tonicao_instalar_nunca")==="1"}catch(e){return false}}
  function vezesVistas(){try{return Number(localStorage.getItem("tonicao_instalar_vezes")||0)}catch(e){return 0}}
  function contarVez(){try{localStorage.setItem("tonicao_instalar_vezes",String(vezesVistas()+1))}catch(e){}}
  window.naoMostrarInstalarV051=function(){
    try{localStorage.setItem("tonicao_instalar_nunca","1")}catch(e){}
    document.getElementById("instalarGate")?.remove();
    document.body.classList.remove("install-locked");
    document.querySelectorAll("[data-instalar]").forEach(x=>x.remove());
    toast("Combinado. Se precisar, use Mais → Instalar o aplicativo.");
  };
  window.pularInstalacaoV051=function(){
    try{sessionStorage.setItem("tonicao_pular_instalar","1")}catch(e){}
    document.getElementById("instalarGate")?.remove();
    document.body.classList.remove("install-locked");
  };
  window.conferirInstalacaoV051=function(){
    if(jaInstalado()){
      document.getElementById("instalarGate")?.remove();
      document.body.classList.remove("install-locked");
      toast("Instalado. Bom treino! 🥋");return;
    }
    toast("Ainda não. Depois de adicionar, abra o app pelo ícone novo da tela.");
  };
  async function portaoInstalar(){
    try{
      if(jaInstalado()||pulouAgora()||nuncaMais())return;
      if(document.getElementById("instalarGate"))return;
      let me=null;try{me=await TonicaoAuth.currentUser()}catch(e){}
      if(!me)return;                                   // só depois de entrar
      const p=PASSOS[aparelho()],android=!!convite;
      const repetindo=vezesVistas()>=1;                // já viu esta tela antes
      contarVez();
      const g=document.createElement("div");
      g.id="instalarGate";g.className="auth-gate show";
      g.innerHTML=`<div class="auth-card">
        <img src="./assets/logo-tonicao.jpg" alt="" class="auth-logo">
        <h2>📲 Instale o aplicativo</h2>
        <p class="small muted" style="text-align:center">Falta só isto para começar. Instalado, ele abre em tela cheia, carrega mais rápido e funciona sem internet no tatame.</p>
        ${android?`<button class="btn primary full" style="margin-top:14px" onclick="instalarAppV051()">Instalar agora</button>`:
        `<div class="list" style="margin-top:14px">${p.passos.map((x,i)=>`<div class="list-item" style="cursor:default">
          <div class="icon">${i+1}</div><div class="meta"><strong>${x}</strong></div></div>`).join("")}</div>
        ${p.nota?`<div class="notice small" style="margin-top:10px">${p.nota}</div>`:""}`}
        <button class="btn ${android?"secondary":"primary"} full" style="margin-top:10px" onclick="conferirInstalacaoV051()">Já instalei</button>
        ${repetindo?`<button class="btn secondary full" style="margin-top:8px" onclick="naoMostrarInstalarV051()">Já instalei — não mostrar mais</button>
          <p class="small muted" style="margin-top:10px;text-align:center">Use este se o aplicativo já estiver na tela do celular e esta mensagem continuar aparecendo.</p>`:""}
        <p class="small muted" style="margin-top:${repetindo?"10":"16"}px;text-align:center">
          <a href="#" onclick="pularInstalacaoV051();return false">Não consigo instalar agora</a></p>
      </div>`;
      document.body.appendChild(g);
      document.body.classList.add("install-locked");
    }catch(e){console.warn("portão de instalação",e)}
  }
  const baseAll=window.renderAll;
  if(typeof baseAll==="function"){
    window.renderAll=async function(...a){const r=await baseAll.apply(this,a);setTimeout(portaoInstalar,250);return r};
  }
  window.addEventListener("load",()=>setTimeout(portaoInstalar,2500));

  /* Aviso discreto no Início, uma vez só, para quem ainda não instalou. */
  function avisoNaHome(){
    try{
      if(jaInstalado()||nuncaMais())return;
      if(localStorage.getItem("tonicao_instalar_dispensado")==="1")return;
      const home=document.getElementById("home");
      if(!home||home.querySelector("[data-instalar]"))return;
      const box=document.createElement("div");
      box.dataset.instalar="1";box.className="notice";
      box.style.cssText="display:flex;align-items:center;gap:10px;justify-content:space-between;flex-wrap:wrap";
      box.innerHTML=`<div><strong>📲 Instale o aplicativo</strong><div class="small">Fica com ícone próprio e abre em tela cheia.</div></div>
        <div class="actions" style="flex-wrap:nowrap">
          <button class="btn primary" onclick="instalarAppV051()">Instalar</button>
          <button class="mini-btn" onclick="dispensarInstalarV051(this)">Agora não</button>
        </div>`;
      home.prepend(box);
    }catch(e){}
  }
  window.dispensarInstalarV051=function(btn){
    try{localStorage.setItem("tonicao_instalar_dispensado","1")}catch(e){}
    btn?.closest("[data-instalar]")?.remove();
  };
  for(const fn of ["renderProfessorHome","renderStudentHome"]){
    const base=window[fn];if(typeof base!=="function")continue;
    window[fn]=async function(...a){const r=await base.apply(this,a);try{avisoNaHome()}catch(e){}return r};
  }
})();
