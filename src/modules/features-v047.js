/* v0.47 — Painel do Dono no topo do Início.
   Nada de função nova: são atalhos para telas que já existem, tiradas de dentro
   do Mais e postas na frente de quem administra. Só aparece para o Administrador/Dono. */
(()=>{
  "use strict";
  const CSS=`
  .owner-panel{background:#111213;color:#fff;border-radius:22px;padding:18px;margin-bottom:16px;box-shadow:0 10px 30px rgba(0,0,0,.18)}
  .owner-panel h2{margin:0;font-size:19px}
  .owner-panel .op-sub{margin:4px 0 0;font-size:13px;color:#b9bcc2}
  .op-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px}
  .op-btn{display:flex;flex-direction:column;align-items:flex-start;gap:4px;min-height:64px;
    background:#1e2024;border:1px solid #32353b;color:#fff;border-radius:12px;padding:12px;text-align:left;font-weight:700;font-size:14px}
  .op-btn:active{background:#2a2d33}
  .op-btn .op-ico{font-size:19px}
  .op-btn.wide{grid-column:1 / -1;flex-direction:row;align-items:center;gap:10px;min-height:52px}
  .op-nums{display:flex;gap:16px;margin-top:14px;flex-wrap:wrap}
  .op-num{font-size:13px;color:#b9bcc2}
  .op-num b{display:block;font-size:20px;color:#fff;line-height:1.2}
  .op-alert{display:block;margin-top:12px;background:#3a2a12;border:1px solid #7c5a1e;color:#ffd79a;
    border-radius:12px;padding:12px;font-size:13px;font-weight:700;width:100%;text-align:left}`;
  const st=document.createElement("style");st.textContent=CSS;document.head.appendChild(st);

  async function sou(){try{return await TonicaoAuth.currentUser()}catch(e){return null}}

  /* Cadastro de professor: abre a tela que já existe, com o papel escolhido. */
  window.novoProfessorV047=function(){
    newRemoteUserModal();
    setTimeout(()=>{
      const r=document.getElementById("ruRole");
      if(r){r.value="professor";try{toggleRemoteStudentField()}catch(e){}}
      const t=document.querySelector("#modalContent h3");
      if(t)t.textContent="🥋 Cadastrar professor";
      document.getElementById("ruName")?.focus();
    },60);
  };
  window.abrirNoMaisV047=function(tela){goPage("more");renderMore(tela)};

  /* Contagens do servidor: entram depois, sem segurar a tela. */
  async function preencherNumeros(){
    const box=document.getElementById("opServerNums");if(!box)return;
    try{
      const r=DB.clean(await TonicaoRemoteAuth.listRemoteUsers());
      const us=r.users||[];
      const profs=us.filter(u=>u.role==="professor"&&u.active!==false).length;
      const pend=us.filter(u=>u.active===false&&u.role!=="admin").length;
      box.innerHTML=`<div class="op-num"><b>${profs}</b>professor(es)</div>`;
      const al=document.getElementById("opPend");
      if(al){
        if(pend)al.innerHTML=`<button class="op-alert" onclick="abrirNoMaisV047('users')">⏳ ${pend} conta(s) aguardando liberação — toque para liberar</button>`;
        else al.innerHTML="";
      }
    }catch(e){box.innerHTML=`<div class="op-num" style="color:#9aa0a6">servidor não respondeu</div>`}
  }
  window.atualizarPainelDonoV047=function(){preencherNumeros()};

  /* ---- Senhas: uma tela só, com todo mundo, e um toque para redefinir ---- */
  let cacheUsers={at:0,list:null};
  async function contas(force){
    if(!force&&cacheUsers.list&&Date.now()-cacheUsers.at<30000)return cacheUsers.list;
    const r=DB.clean(await TonicaoRemoteAuth.listRemoteUsers());
    cacheUsers={at:Date.now(),list:r.users||[]};
    return cacheUsers.list;
  }
  const PAPEL={admin:"Dono",professor:"Professor",aluno:"Aluno"};
  function linha(u){
    return `<div class="list-item" style="cursor:default">
      <div class="icon">${u.role==="admin"?"🛡️":u.role==="professor"?"🥋":"👤"}</div>
      <div class="meta" style="flex:1"><strong>${esc(u.name||u.email||"Sem nome")}</strong>
        <span class="small muted">${esc(u.email||"sem e-mail")} • ${PAPEL[u.role]||u.role}${u.active===false?" • bloqueado":""}</span></div>
      ${u.email?`<button class="btn secondary" onclick="redefinirSenhaV047('${esc(u.id)}')">🔑 Redefinir</button>`:""}
    </div>`;
  }
  window.telaSenhasV047=async function(force){
    showModal(`<h3>🔑 Senhas</h3><p class="small muted">Carregando contas…</p>`);
    try{
      const us=(await contas(force)).slice().sort((a,b)=>String(a.name||a.email).localeCompare(String(b.name||b.email)));
      const equipe=us.filter(u=>u.role!=="aluno"),alunos=us.filter(u=>u.role==="aluno");
      showModal(`<h3>🔑 Senhas</h3>
        <p class="small muted">Um toque envia à pessoa o e-mail para ela criar a senha nova. O histórico dela não muda.</p>
        <div class="section-title"><h2>Equipe</h2><button class="btn secondary" onclick="telaSenhasV047(true)">Atualizar</button></div>
        <div class="list">${equipe.map(linha).join("")||`<div class="notice small">Nenhum professor cadastrado.</div>`}</div>
        ${alunos.length?`<details style="margin-top:12px"><summary style="cursor:pointer;font-weight:700">Alunos (${alunos.length})</summary>
          <div class="list" style="margin-top:8px">${alunos.map(linha).join("")}</div></details>`:""}
        <button class="btn secondary full" style="margin-top:12px" onclick="closeModal()">Fechar</button>`);
    }catch(e){
      showModal(`<h3>🔑 Senhas</h3><div class="notice payment small">${esc(e.message||"O servidor não respondeu.")}</div>
        <button class="btn primary full" style="margin-top:10px" onclick="telaSenhasV047(true)">Tentar de novo</button>
        <button class="btn secondary full" style="margin-top:8px" onclick="closeModal()">Fechar</button>`);
    }
  };
  window.redefinirSenhaV047=async function(userId){
    const u=(await contas()).find(x=>x.id===userId);if(!u)return;
    const nome=String(u.name||u.email).split(" ")[0];
    showModal(`<h3>🔑 Redefinir a senha de ${esc(nome)}</h3>
      <div class="notice small"><strong>O que vai acontecer</strong><div class="small">
        1. ${esc(u.email)} recebe um e-mail do app.<br>
        2. Ela abre o link e cadastra a senha nova, duas vezes.<br>
        3. Entra normalmente. Presenças, graduação e histórico ficam como estão.</div></div>
      <div class="notice payment small" style="margin-top:10px"><strong>Avise ela antes</strong><div class="small">O link vale por cerca de 1 hora e só funciona uma vez. Se você pedir de novo, o e-mail anterior deixa de valer.</div></div>
      <button class="btn primary full" style="margin-top:12px" onclick="enviarResetV047('${esc(userId)}')">📧 Enviar agora</button>
      <button class="btn secondary full" style="margin-top:8px" onclick="telaSenhasV047()">Voltar</button>`);
  };
  window.enviarResetV047=async function(userId){
    const u=(await contas()).find(x=>x.id===userId);
    try{
      await TonicaoRemoteAuth.resetRemotePassword({userId});
      const nome=String(u?.name||"").split(" ")[0]||"a pessoa";
      const aviso=`Oi ${nome}! Mandei no seu e-mail (${u?.email||""}) um link para você criar uma senha nova do app da academia. Abre agora, que ele vale por 1 hora. Qualquer coisa me chama. 👊`;
      showModal(`<h3>✅ E-mail enviado</h3>
        <p class="small muted">Enviado para <strong>${esc(u?.email||"")}</strong>. Peça para ela abrir agora e olhar também o spam.</p>
        ${u?.phone?`<button class="btn green full" onclick="window.open('https://wa.me/${esc(phoneForWhatsApp(u.phone))}?text=${encodeURIComponent(aviso)}','_blank')">💬 Avisar pelo WhatsApp</button>`:
          `<button class="btn secondary full" onclick="navigator.clipboard?.writeText(${JSON.stringify(aviso)});toast('Recado copiado.')">📋 Copiar recado para o WhatsApp</button>`}
        <button class="btn secondary full" style="margin-top:8px" onclick="telaSenhasV047()">Voltar às senhas</button>`);
    }catch(e){toast(e.message||"Não foi possível enviar.")}
  };

  const baseHome=window.renderProfessorHome;
  window.renderProfessorHome=async function(...a){
    const r=await baseHome.apply(this,a);
    try{
      const me=await sou();
      if(me?.role!=="admin")return r;
      const home=document.getElementById("home");
      if(!home||home.querySelector("[data-v047]"))return r;
      const s=await getSettings();
      const alunos=(await getStudents()).filter(x=>x.active!==false).length;
      const escola=s.academyName||s.academy||"Tonicão Team";

      const box=document.createElement("div");box.dataset.v047="1";
      box.innerHTML=`<div class="owner-panel">
        <h2>🛠 Painel do Dono</h2>
        <p class="op-sub">${esc(escola)}${s.unitName||s.unit?" • "+esc(s.unitName||s.unit):""}</p>
        <div class="op-grid">
          <button class="op-btn" onclick="novoProfessorV047()"><span class="op-ico">🥋</span>Cadastrar professor</button>
          <button class="op-btn" onclick="abrirNoMaisV047('newacademy')"><span class="op-ico">🏫</span>Cadastrar escola</button>
          <button class="op-btn" onclick="abrirNoMaisV047('users')"><span class="op-ico">🔐</span>Contas do app</button>
          <button class="op-btn" onclick="abrirNoMaisV047('academy')"><span class="op-ico">⚙️</span>Dados da academia</button>
          <button class="op-btn" onclick="telaSenhasV047()"><span class="op-ico">🔑</span>Redefinir senha</button>
          <button class="op-btn" onclick="abrirNoMaisV047('backup')"><span class="op-ico">💾</span>Backup</button>
        </div>
        <div class="op-nums">
          <div class="op-num"><b>${alunos}</b>aluno(s)</div>
          <div id="opServerNums" class="op-num" style="display:contents"></div>
        </div>
        <div id="opPend"></div>
      </div>`;
      /* dois redesenhos ao mesmo tempo passariam os dois pela checagem acima,
         porque entre ela e aqui houve espera: confere de novo na hora de inserir */
      if(home.querySelector("[data-v047]"))return r;
      home.prepend(box);
      setTimeout(preencherNumeros,40);
    }catch(e){console.warn("v0.47 painel do dono",e)}
    return r;
  };
  /* Liberou ou criou alguém: reconta sem redesenhar a tela toda. */
  window.addEventListener("tonicao:data-synced",()=>{setTimeout(preencherNumeros,300)});
})();
