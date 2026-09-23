/* v0.38 — Olhinho 👁 para conferir a senha digitada.
   Funciona em qualquer campo de senha do app (criar acesso, responsável, login,
   primeira configuração), inclusive nos que aparecem depois, dentro de janelas. */
(()=>{
  "use strict";
  const CSS=`
  .pw-wrap{position:relative;display:block}
  .pw-wrap>input{padding-right:46px!important;width:100%}
  .pw-eye{position:absolute;top:50%;right:6px;transform:translateY(-50%);
    border:0;background:transparent;font-size:18px;line-height:1;padding:8px;border-radius:10px;cursor:pointer}
  .pw-eye:active{background:rgba(0,0,0,.08)}`;
  const st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);

  function equip(inp){
    if(!inp||inp.dataset.pwEye)return;
    if(inp.type!=="password")return;
    inp.dataset.pwEye="1";
    const wrap=document.createElement("div");wrap.className="pw-wrap";
    inp.parentNode.insertBefore(wrap,inp);wrap.appendChild(inp);
    const b=document.createElement("button");
    b.type="button";b.className="pw-eye";b.textContent="👁";
    b.setAttribute("aria-label","Mostrar a senha");b.title="Mostrar a senha";
    b.addEventListener("click",ev=>{
      ev.preventDefault();ev.stopPropagation();
      const show=inp.type==="password";
      inp.type=show?"text":"password";
      b.textContent=show?"🙈":"👁";
      b.title=show?"Esconder a senha":"Mostrar a senha";
      try{inp.focus({preventScroll:true});const n=inp.value.length;inp.setSelectionRange(n,n)}catch(e){}
    });
    wrap.appendChild(b);
  }
  function scan(root){
    try{(root||document).querySelectorAll?.('input[type="password"]').forEach(equip)}catch(e){}
  }
  new MutationObserver(muts=>{
    for(const m of muts)for(const n of m.addedNodes){
      if(n.nodeType!==1)continue;
      if(n.matches?.('input[type="password"]'))equip(n);else scan(n);
    }
  }).observe(document.documentElement,{childList:true,subtree:true});
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",()=>scan());
  else scan();
})();
