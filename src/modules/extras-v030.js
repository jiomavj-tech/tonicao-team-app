/* v0.30 — ajustes de uso:
   - qualquer bloqueio/erro de botão vira aviso na tela (antes alguns botões "não faziam nada")
   - atalho do Cronômetro na tela inicial do Professor e do Aluno */
(()=>{
  "use strict";
  window.addEventListener("unhandledrejection",e=>{
    const m=e?.reason?.message||(typeof e?.reason==="string"?e.reason:"");
    if(m&&typeof toast==="function")toast(m);
  });
  const timerCard=()=>`<div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:12px;cursor:pointer" onclick="openTimerV030()">
      <div style="font-size:34px">⏱️</div><div style="flex:1"><strong>Cronômetro de treino</strong><div class="small muted">Rounds, descanso e presets. Funciona sem internet.</div></div>
      <button class="btn primary">Abrir</button></div>`;
  window.openTimerV030=function(){goPage("more");renderMore("timer")};
  for(const fn of ["renderProfessorHome","renderStudentHome"]){
    const base=window[fn];if(typeof base!=="function")continue;
    window[fn]=async function(...args){
      const r=await base.apply(this,args);
      const home=document.getElementById("home");
      if(home&&!home.querySelector("[data-timer-card]")){
        const box=document.createElement("div");box.dataset.timerCard="1";box.innerHTML=timerCard();
        const hero=home.querySelector(".hero");
        if(hero&&hero.nextSibling)home.insertBefore(box,hero.nextSibling);else home.appendChild(box);
      }
      return r;
    };
  }
})();
