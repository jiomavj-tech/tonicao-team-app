/* v0.54 — Ajuda ao criar a senha.
   Enquanto a pessoa digita, mostra a lista de exigências e vai marcando o que
   já cumpriu, com uma barra de força. Vale em todo campo de senha NOVA do app;
   nos campos de entrar (senha já existente) não aparece, porque ali não há regra
   a cumprir, só acertar a que já existe. */
(()=>{
  "use strict";
  const CSS=`
  .pwx{margin-top:8px}
  .pwx-bar{height:7px;border-radius:999px;background:#e5e7eb;overflow:hidden}
  .pwx-bar i{display:block;height:100%;width:0;border-radius:999px;transition:width .18s,background .18s}
  .pwx-label{font-size:12px;font-weight:700;margin-top:6px}
  .pwx-list{list-style:none;margin:8px 0 0;padding:0;display:grid;gap:4px}
  .pwx-list li{font-size:12.5px;color:#70737a;display:flex;align-items:flex-start;gap:7px;line-height:1.35}
  .pwx-list li b{font-weight:700;color:#151515}
  .pwx-list li.ok{color:#166534}
  .pwx-list li.ok b{color:#166534}
  .pwx-mark{width:16px;flex:0 0 16px;text-align:center}
  .pwx-dica{font-size:12px;color:#70737a;margin-top:8px;background:#f4f5f7;border-radius:10px;padding:8px 10px}`;
  const st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);

  const REGRAS=[
    {t:"Pelo menos <b>9 caracteres</b>",   ok:p=>p.length>=9},
    {t:"Uma letra <b>MAIÚSCULA</b> (A-Z)", ok:p=>/[A-Z]/.test(p)},
    {t:"Uma letra <b>minúscula</b> (a-z)", ok:p=>/[a-z]/.test(p)},
    {t:"Um <b>número</b> (0-9)",           ok:p=>/[0-9]/.test(p)},
    {t:'Um <b>símbolo</b>: . ! @ # * ou -',ok:p=>/[^A-Za-z0-9]/.test(p)}
  ];
  window.regrasDaSenhaV054=REGRAS;

  /* Campo de senha NOVA? Os de entrar ficam de fora. */
  function senhaNova(inp){
    const id=(inp.id||"").toLowerCase();
    if(/cloudpass|loginpass|^senha$/.test(id))return false;
    const ac=(inp.getAttribute("autocomplete")||"").toLowerCase();
    if(ac==="current-password")return false;
    const rot=inp.closest(".field")?.querySelector("label")?.textContent||"";
    if(/atual/i.test(rot))return false;
    return true;
  }

  function avaliar(p){
    const feitas=REGRAS.filter(r=>r.ok(p)).length;
    let forca=feitas, label="", cor="#dc2626";
    if(!p.length)return {feitas,pct:0,label:"",cor,completa:false};
    const completa=feitas===REGRAS.length;
    if(completa&&p.length>=14){forca=6;label="Senha muito forte";cor="#15803d"}
    else if(completa){label="Senha forte";cor="#16a34a"}
    else if(feitas>=4){label="Quase lá";cor="#d97706"}
    else if(feitas>=2){label="Senha fraca";cor="#d97706"}
    else {label="Senha muito fraca";cor="#dc2626"}
    return {feitas,pct:Math.round(Math.min(forca,6)/6*100),label,cor,completa};
  }

  function montar(inp){
    if(inp.dataset.pwxOn)return;
    if(!senhaNova(inp))return;
    inp.dataset.pwxOn="1";
    const alvo=inp.closest(".pw-wrap")||inp;          // o olhinho da v0.38 embrulha o campo
    const box=document.createElement("div");
    box.className="pwx";
    box.innerHTML=`<div class="pwx-bar"><i></i></div>
      <div class="pwx-label"></div>
      <ul class="pwx-list">${REGRAS.map(r=>`<li><span class="pwx-mark">○</span><span>${r.t}</span></li>`).join("")}</ul>
      <div class="pwx-dica">Dica: junte duas palavras que você lembra e termine com número e símbolo. Ex.: <b>Tatame@2026</b></div>`;
    (alvo.parentNode||inp.parentNode).insertBefore(box,(alvo.nextSibling||null));
    const barra=box.querySelector(".pwx-bar i"),rotulo=box.querySelector(".pwx-label"),itens=[...box.querySelectorAll(".pwx-list li")];
    function atualizar(){
      const p=inp.value||"",a=avaliar(p);
      barra.style.width=a.pct+"%";barra.style.background=a.cor;
      rotulo.textContent=a.label;rotulo.style.color=a.cor;
      REGRAS.forEach((r,i)=>{
        const ok=r.ok(p);
        itens[i].classList.toggle("ok",ok);
        itens[i].querySelector(".pwx-mark").textContent=ok?"✓":"○";
      });
    }
    inp.addEventListener("input",atualizar);
    inp.addEventListener("focus",atualizar);
    atualizar();
  }

  function varrer(raiz){
    try{(raiz||document).querySelectorAll?.('input[type="password"],input[data-pw-eye]').forEach(montar)}catch(e){}
  }
  new MutationObserver(ms=>{
    for(const m of ms)for(const n of m.addedNodes){
      if(n.nodeType!==1)continue;
      if(n.matches?.('input[type="password"]'))montar(n);else varrer(n);
    }
  }).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>varrer());
  else varrer();
})();
