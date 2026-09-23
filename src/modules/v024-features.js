/* ===== v024-features.js ===== */
/* Tonicão Team v0.24
   Compartilhamento + Modo Apresentação + Cadastro unificado local/remoto
   Camada complementar: não altera o modelo de dados acadêmicos existente.
*/
(() => {
  "use strict";

  const V024 = {
    version: "v0.24",
    demoMessageKey: "tonicao_v024_demo_message",
    demoStudentKey: "tonicao_v024_demo_student",
    scheduled: false
  };

  const $ = (q, root=document) => root.querySelector(q);
  const esc024 = (v="") => String(v).replace(/[&<>"']/g, c => ({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
  }[c]));

  function publicAppUrl(){
    try{
      if(typeof APP_CONFIG!=="undefined" && APP_CONFIG.publicAppUrl) return APP_CONFIG.publicAppUrl;
    }catch(_){}
    return location.origin + location.pathname.replace(/[^/]*$/,"");
  }

  async function academyName(){
    try{
      const s = await getSettings();
      return s?.academyName || s?.academy || "Tonicão Team";
    }catch(_){ return "Tonicão Team"; }
  }

  async function shareApplication(){
    const name = await academyName();
    const base = publicAppUrl();
    let url=base;
    try{const u=new URL(base,location.href);u.search="";u.searchParams.set("academy",window.TONICAO_ACADEMY_ID||"tonicao-sul-ilha");url=u.href}catch(_){}
    const data = {
      title: `${name} — aplicativo`,
      text: `Conheça o aplicativo da ${name}.`,
      url
    };
    if(navigator.share){
      try{
        await navigator.share(data);
        return;
      }catch(e){
        if(e?.name === "AbortError") return;
      }
    }
    try{
      await navigator.clipboard.writeText(url);
      toast("Link do aplicativo copiado.");
    }catch(_){
      prompt("Copie o link do aplicativo:", url);
    }
  }
  window.shareApplication = shareApplication;

  function injectStyles(){
    if($("#v024-styles")) return;
    const style=document.createElement("style");
    style.id="v024-styles";
    style.textContent=`
      .v024-share-top{min-width:42px;height:42px;border:0;border-radius:12px;background:#1d4ed8;color:#fff;font-size:20px;font-weight:800;cursor:pointer;margin-left:8px}
      .v024-badge{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 9px;font-size:12px;font-weight:800;background:#dbeafe;color:#1e40af}
      .v024-note{border:1px solid #bfdbfe;background:#eff6ff;border-radius:14px;padding:12px;margin:10px 0}
      .v024-demo-overlay{position:fixed;inset:0;z-index:99999;background:#f7f7f8;color:#111;display:none;overflow:auto}
      .v024-demo-overlay.show{display:block}
      .v024-demo-head{position:sticky;top:0;z-index:5;background:#111;color:#fff;padding:12px 14px;box-shadow:0 2px 8px #0003}
      .v024-demo-headline{display:flex;align-items:center;gap:10px}
      .v024-demo-headline strong{font-size:16px}
      .v024-demo-headline .spacer{flex:1}
      .v024-demo-close,.v024-demo-share{border:0;border-radius:10px;padding:9px 12px;font-weight:800;cursor:pointer}
      .v024-demo-close{background:#fff;color:#111}
      .v024-demo-share{background:#2563eb;color:#fff}
      .v024-demo-warning{margin-top:8px;font-size:12px;color:#fde68a}
      .v024-demo-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:12px;background:#fff;position:sticky;top:78px;z-index:4;border-bottom:1px solid #e5e7eb}
      .v024-demo-tab{border:1px solid #d1d5db;background:#fff;padding:10px 6px;border-radius:12px;font-weight:800;cursor:pointer}
      .v024-demo-tab.active{background:#111;color:#fff;border-color:#111}
      .v024-demo-body{padding:14px;max-width:900px;margin:0 auto 100px}
      .v024-demo-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}
      .v024-demo-card{background:#fff;border:1px solid #e5e7eb;border-radius:16px;padding:14px;box-shadow:0 3px 14px #0000000b}
      .v024-demo-card h3{margin:0 0 8px}
      .v024-demo-kpi{font-size:30px;font-weight:900}
      .v024-demo-actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      .v024-demo-btn{border:0;border-radius:12px;padding:10px 12px;font-weight:800;cursor:pointer;background:#2563eb;color:#fff}
      .v024-demo-btn.secondary{background:#e5e7eb;color:#111}
      .v024-demo-list{display:grid;gap:8px;margin-top:10px}
      .v024-demo-row{display:flex;align-items:center;gap:10px;padding:10px;border-radius:12px;background:#f9fafb;border:1px solid #eee}
      .v024-demo-icon{width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:#e5e7eb;font-size:20px}
      .v024-demo-watermark{position:fixed;right:12px;bottom:12px;z-index:6;background:#111;color:#fff;border-radius:999px;padding:7px 11px;font-size:11px;font-weight:900;opacity:.88}
      .v024-unified-status{display:flex;align-items:center;gap:8px;border-radius:12px;padding:10px;margin-bottom:12px}
      .v024-unified-status.ok{background:#ecfdf5;color:#065f46}
      .v024-unified-status.warn{background:#fff7ed;color:#9a3412}
      @media(max-width:520px){.v024-demo-tabs{top:96px}.v024-demo-headline strong{font-size:14px}.v024-demo-share{padding:8px 9px}}
    `;
    document.head.appendChild(style);
  }

  function versionObserver(){
    const subtitle=$("#topSubtitle");
    if(!subtitle) return;
    const fix=()=>{
      /* v0.25: versão já vem correta do app */
    };
    fix();
    new MutationObserver(fix).observe(subtitle,{childList:true,subtree:true,characterData:true});
  }

  function topShareButton(){
    const bar=$(".topbar");
    if(!bar || $("#v024TopShare")) return;
    const btn=document.createElement("button");
    btn.id="v024TopShare";
    btn.className="v024-share-top";
    btn.type="button";
    btn.title="Compartilhar aplicativo";
    btn.setAttribute("aria-label","Compartilhar aplicativo");
    btn.textContent="↗";
    btn.onclick=shareApplication;
    const spacer=bar.querySelector(".spacer");
    bar.insertBefore(btn, spacer || null);
  }

  async function enhanceMore(){
    const host=$("#more");
    if(!host) return;
    const title=host.querySelector(".section-title h2")?.textContent?.trim();

    if(title==="Mais"){
      const list=host.querySelector(".list");
      if(list && !host.querySelector("[data-v024-share]")){
        const el=document.createElement("div");
        el.className="list-item";
        el.dataset.v024Share="1";
        el.onclick=shareApplication;
        el.innerHTML='<div class="icon">📤</div><div><strong>Compartilhar aplicativo</strong><span class="small muted">Enviar o link pelo WhatsApp, e-mail ou outro aplicativo.</span></div>';
        list.prepend(el);
      }

      let me=null;
      try{ me=await TonicaoAuth.currentUser(); }catch(_){}
      if(me?.role==="admin" && list && !host.querySelector("[data-v024-present]")){
        const el=document.createElement("div");
        el.className="list-item";
        el.dataset.v024Present="1";
        el.onclick=()=>openPresentation("admin");
        el.innerHTML='<div class="icon">🎬</div><div><strong>Apresentar aplicativo</strong><span class="small muted">Mostrar as visões Dono, Professor e Aluno sem alterar dados reais.</span></div>';
        const share=host.querySelector("[data-v024-share]");
        if(share?.nextSibling) list.insertBefore(el, share.nextSibling); else list.appendChild(el);
      }
    }

    if(title==="Usuários e permissões"){
      if(!host.querySelector("[data-v024-unified-note]")){
        const note=document.createElement("div");
        note.dataset.v024UnifiedNote="1";
        note.className="v024-note";
        note.innerHTML='<strong>Cadastro unificado v0.24</strong><div class="small">O botão <b>+ Novo usuário</b> agora cria a conta local e a conta do servidor em uma única etapa quando o Administrador estiver conectado ao servidor. A área “Usuários do servidor” fica como recurso avançado/reparo.</div>';
        const firstBtn=host.querySelector("button");
        firstBtn?.insertAdjacentElement("afterend",note);
      }
      host.querySelectorAll(".section-title h2").forEach(h=>{
        if(h.textContent.trim()==="Usuários do servidor") h.textContent="Contas no servidor — avançado";
      });
      host.querySelectorAll("button").forEach(b=>{
        if(b.textContent.trim()==="+ Remoto") b.textContent="+ Conta avançada";
      });
    }
  }

  function scheduleEnhance(){
    if(V024.scheduled) return;
    V024.scheduled=true;
    setTimeout(async()=>{
      V024.scheduled=false;
      try{await enhanceMore();}catch(e){console.warn("v0.24 enhance",e)}
    },20);
  }

  function observeUI(){
    const more=$("#more");
    if(more) new MutationObserver(scheduleEnhance).observe(more,{childList:true,subtree:true});
    scheduleEnhance();
  }

  function presentationShell(){
    let overlay=$("#v024Presentation");
    if(overlay) return overlay;
    overlay=document.createElement("div");
    overlay.id="v024Presentation";
    overlay.className="v024-demo-overlay";
    overlay.innerHTML=`
      <div class="v024-demo-head">
        <div class="v024-demo-headline">
          <strong>🎬 MODO APRESENTAÇÃO</strong>
          <span class="v024-badge">dados de demonstração</span>
          <div class="spacer"></div>
          <button class="v024-demo-share" onclick="shareApplication()">📤 Compartilhar</button>
          <button class="v024-demo-close" onclick="closePresentation()">Fechar</button>
        </div>
        <div class="v024-demo-warning">Esta área é somente demonstrativa e não altera presença, graduação, pagamentos, pontos ou cadastros reais.</div>
      </div>
      <div class="v024-demo-tabs">
        <button class="v024-demo-tab" data-demo-tab="admin" onclick="renderPresentation('admin')">🛡️ Dono</button>
        <button class="v024-demo-tab" data-demo-tab="professor" onclick="renderPresentation('professor')">🥋 Professor</button>
        <button class="v024-demo-tab" data-demo-tab="aluno" onclick="renderPresentation('aluno')">👤 Aluno</button>
      </div>
      <div class="v024-demo-body" id="v024PresentationBody"></div>
      <div class="v024-demo-watermark">DEMONSTRAÇÃO • v0.24</div>`;
    document.body.appendChild(overlay);
    return overlay;
  }

  function demoMessage(){
    return localStorage.getItem(V024.demoMessageKey) || "Nenhum aviso demonstrativo enviado ainda.";
  }

  function demoStudentCreated(){
    return localStorage.getItem(V024.demoStudentKey)==="1";
  }

  function adminPresentation(){
    return `
      <div class="v024-demo-grid">
        <div class="v024-demo-card"><div class="v024-badge">Administrador/Dono</div><h2>Visão total do aplicativo</h2><p>Configura a academia, usuários, identidade, sincronização e acesso. Pode visualizar a operação acadêmica sem assumir decisões do Professor.</p></div>
        <div class="v024-demo-card"><div class="small muted">Usuários</div><div class="v024-demo-kpi">3 perfis</div><p class="small">Dono • Professor • Aluno</p></div>
        <div class="v024-demo-card"><div class="small muted">Publicação</div><div class="v024-demo-kpi">Online</div><p class="small">PWA + servidor, mantendo prioridade offline.</p></div>
      </div>
      <div class="v024-demo-card" style="margin-top:12px">
        <h3>O que você pode demonstrar para outra academia</h3>
        <div class="v024-demo-list">
          <div class="v024-demo-row"><div class="v024-demo-icon">🏫</div><div><strong>Identidade da academia</strong><div class="small muted">Nome, unidade, logo, história e configurações.</div></div></div>
          <div class="v024-demo-row"><div class="v024-demo-icon">🛡️</div><div><strong>Usuários e permissões</strong><div class="small muted">Criação unificada e controle de acesso.</div></div></div>
          <div class="v024-demo-row"><div class="v024-demo-icon">☁️</div><div><strong>Sincronização</strong><div class="small muted">Uso offline com camada remota entre aparelhos.</div></div></div>
          <div class="v024-demo-row"><div class="v024-demo-icon">🎬</div><div><strong>Apresentação segura</strong><div class="small muted">Troque entre Dono, Professor e Aluno sem expor dados reais.</div></div></div>
        </div>
      </div>`;
  }

  function professorPresentation(){
    const created=demoStudentCreated();
    return `
      <div class="v024-demo-grid">
        <div class="v024-demo-card"><div class="v024-badge">Professor</div><h2>Operação do tatame</h2><p>Cadastro e aprovação de alunos, presença, check-in, graduação, pontos, eventos, conteúdo técnico e avisos.</p></div>
        <div class="v024-demo-card"><div class="small muted">Aluno demonstrativo</div><div class="v024-demo-kpi">${created?"Ativo":"Novo"}</div><p class="small">${created?"Aluno Demo pronto para apresentação.":"Simule um cadastro sem mexer nos alunos reais."}</p></div>
      </div>
      <div class="v024-demo-card" style="margin-top:12px">
        <h3>Aluno Demo</h3>
        <div class="v024-demo-row"><div class="v024-demo-icon">👤</div><div style="flex:1"><strong>Aluno Demonstração</strong><div class="small muted">Faixa Branca • 2 graus • mensalidade liberada</div></div><span class="v024-badge">${created?"cadastrado":"simulação"}</span></div>
        <div class="v024-demo-actions">
          <button class="v024-demo-btn" onclick="simulateDemoStudent()">➕ Simular cadastro</button>
          <button class="v024-demo-btn" onclick="sendDemoCommunication()">🔔 Enviar aviso ao Aluno Demo</button>
          <button class="v024-demo-btn secondary" onclick="renderPresentation('aluno')">Ver como Aluno →</button>
        </div>
      </div>
      <div class="v024-demo-card" style="margin-top:12px">
        <h3>Recursos do Professor</h3>
        <div class="v024-demo-list">
          <div class="v024-demo-row"><div class="v024-demo-icon">✓</div><div><strong>Check-in e presença</strong><div class="small muted">Aprovação e acompanhamento das aulas.</div></div></div>
          <div class="v024-demo-row"><div class="v024-demo-icon">🥋</div><div><strong>Graduação</strong><div class="small muted">Plano por faixa, avaliação e decisão do Professor.</div></div></div>
          <div class="v024-demo-row"><div class="v024-demo-icon">🏆</div><div><strong>Pontos e eventos</strong><div class="small muted">Pontuação anual, campeonatos e ranking.</div></div></div>
          <div class="v024-demo-row"><div class="v024-demo-icon">🎥</div><div><strong>Biblioteca técnica</strong><div class="small muted">Vídeos, posição da semana e observações.</div></div></div>
        </div>
      </div>`;
  }

  function alunoPresentation(){
    const msg=esc024(demoMessage());
    return `
      <div class="v024-demo-grid">
        <div class="v024-demo-card"><div class="v024-badge">Aluno</div><h2>Minha jornada no Jiu-Jitsu</h2><p>O aluno vê somente sua área: check-in, evolução, pontos, materiais e avisos permitidos.</p></div>
        <div class="v024-demo-card"><div class="small muted">Faixa</div><div class="v024-demo-kpi">Branca</div><p class="small">2 graus • referência de evolução</p></div>
        <div class="v024-demo-card"><div class="small muted">Pontos</div><div class="v024-demo-kpi">285</div><p class="small">Exemplo demonstrativo</p></div>
      </div>
      <div class="v024-demo-card" style="margin-top:12px">
        <h3>🔔 Aviso recebido do Professor</h3>
        <div class="v024-note"><strong>Professor Demo</strong><div style="margin-top:5px">${msg}</div></div>
        <div class="v024-demo-actions">
          <button class="v024-demo-btn secondary" onclick="renderPresentation('professor')">← Voltar ao Professor</button>
        </div>
      </div>
      <div class="v024-demo-card" style="margin-top:12px">
        <h3>Área do Aluno</h3>
        <div class="v024-demo-list">
          <div class="v024-demo-row"><div class="v024-demo-icon">✓</div><div><strong>Check-in</strong><div class="small muted">Registra a própria presença conforme a sessão liberada.</div></div></div>
          <div class="v024-demo-row"><div class="v024-demo-icon">🥋</div><div><strong>Graduação</strong><div class="small muted">Acompanha material, agendamento e resultado público.</div></div></div>
          <div class="v024-demo-row"><div class="v024-demo-icon">🏆</div><div><strong>Pontos e ranking</strong><div class="small muted">Acompanha o próprio histórico e participação.</div></div></div>
          <div class="v024-demo-row"><div class="v024-demo-icon">🔔</div><div><strong>Avisos</strong><div class="small muted">Recebe comunicações da academia e do Professor.</div></div></div>
        </div>
      </div>`;
  }

  function renderPresentation(role="admin"){
    presentationShell();
    document.querySelectorAll("[data-demo-tab]").forEach(b=>b.classList.toggle("active",b.dataset.demoTab===role));
    const body=$("#v024PresentationBody");
    if(!body) return;
    body.innerHTML=role==="professor" ? professorPresentation() : role==="aluno" ? alunoPresentation() : adminPresentation();
    body.scrollTop=0;
  }
  window.renderPresentation=renderPresentation;

  function openPresentation(role="admin"){
    const o=presentationShell();
    o.classList.add("show");
    document.body.style.overflow="hidden";
    renderPresentation(role);
  }
  window.openPresentation=openPresentation;

  function closePresentation(){
    $("#v024Presentation")?.classList.remove("show");
    document.body.style.overflow="";
  }
  window.closePresentation=closePresentation;

  function simulateDemoStudent(){
    localStorage.setItem(V024.demoStudentKey,"1");
    try{toast("Cadastro demonstrativo criado. Nenhum aluno real foi alterado.");}catch(_){}
    renderPresentation("professor");
  }
  window.simulateDemoStudent=simulateDemoStudent;

  function sendDemoCommunication(){
    const current=demoMessage()==="Nenhum aviso demonstrativo enviado ainda."
      ? "Treino confirmado hoje às 20h. Leve kimono e garrafa de água."
      : demoMessage();
    const msg=prompt("Mensagem demonstrativa para o Aluno Demo:", current);
    if(msg===null) return;
    localStorage.setItem(V024.demoMessageKey, msg.trim() || current);
    try{toast("Aviso demonstrativo enviado.");}catch(_){}
    renderPresentation("aluno");
  }
  window.sendDemoCommunication=sendDemoCommunication;

  async function unifiedUserModal(){
    const me=await TonicaoAuth.currentUser();
    if(me?.role!=="admin"){toast("Somente o Administrador/Dono pode criar Professor e outros usuários.");return}
    const students=await getStudents();
    const settings=await getSettings();
    const remoteReady=!!settings.cloudSessionToken && !!settings.remoteUser && navigator.onLine;
    const fb=!!window.TonicaoFirebase?.configured;

    showModal(`<h3>Novo usuário</h3>
      <div class="v024-unified-status ${remoteReady?"ok":"warn"}">
        <strong>${remoteReady?"✅ Cadastro unificado ativo":"⚠️ Servidor não conectado"}</strong>
        <span class="small">${remoteReady?(fb?"A conta é criada na nuvem: a pessoa entra com esse e-mail e senha em qualquer celular.":"Esta ação criará a conta neste aparelho e no servidor."):"Entre no servidor para criar a conta completa em uma única etapa."}</span>
      </div>
      <div class="field"><label>Nome</label><input id="usrName"></div>
      <div class="field"><label>${fb?"E-mail":"Usuário"}</label><input id="usrUsername" autocomplete="off" ${fb?'type="email"':""}></div>
      <div class="field"><label>Senha (9+ caracteres, maiúscula, minúscula, número e símbolo)</label><input id="usrPass" type="password" autocomplete="new-password"></div>
      <div class="field"><label>Perfil</label><select id="usrRole" onchange="toggleStudentUserField()">
        <option value="professor">Professor</option><option value="aluno">Aluno</option><option value="admin">Administrador/Dono</option>
      </select></div>
      <div class="field" id="usrStudentWrap" style="display:none"><label>Aluno vinculado</label><select id="usrStudent"><option value="">Selecione</option>${students.map(s=>`<option value="${s.id}">${esc024(s.name)}</option>`).join("")}</select></div>
      ${remoteReady
        ? `<button class="btn primary full" onclick="saveUnifiedUser(false)">Criar usuário completo</button><p class="small muted" style="margin-top:8px">${fb?"A conta é criada uma única vez no Firebase e funciona nos outros aparelhos.":"Uma única ação cria a conta local + remota."}</p>`
        : fb
          ? `<button class="btn primary full" onclick="goToCloudFromUnified()">Entrar como Administrador/Dono</button>
             <p class="small muted" style="margin-top:8px">Com Firebase não criamos uma segunda conta apenas neste aparelho. Conecte o Dono e faça um único cadastro.</p>`
          : `<button class="btn primary full" onclick="goToCloudFromUnified()">Conectar ao servidor</button>
             <button class="btn secondary full" style="margin-top:8px" onclick="saveUnifiedUser(true)">Criar somente neste aparelho</button>`
      }`);
  }

  async function saveUnifiedUser(localOnly=false){
    try{
      const name=$("#usrName")?.value.trim()||"";
      const username=$("#usrUsername")?.value.trim()||"";
      const password=$("#usrPass")?.value||"";
      const role=$("#usrRole")?.value||"professor";
      const studentId=$("#usrStudent")?.value||"";
      if(!name) throw new Error("Informe o nome.");
      if(!username) throw new Error(window.TonicaoFirebase?.configured?"Informe o e-mail.":"Informe o usuário.");
      const fbMode=!!window.TonicaoFirebase?.configured;
      if(localOnly&&fbMode)throw new Error("Com Firebase, conecte o Administrador e crie uma única conta completa.");
      if(fbMode&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(username)) throw new Error("Digite um e-mail válido.");
      {const prob=TonicaoAuth.passwordProblem?TonicaoAuth.passwordProblem(password):"";if(prob)throw new Error(prob)}
      if(role==="aluno" && !studentId) throw new Error("Selecione o aluno vinculado.");

      const locals=await (TonicaoAuth.allUsers?TonicaoAuth.allUsers():TonicaoAuth.users());
      const localExisting=(locals||[]).find(u=>String(u.username||"").toLowerCase()===username.toLowerCase());
      if(localExisting && (localExisting.role!==role || String(localExisting.studentId||"")!==String(studentId||""))){
        throw new Error("Já existe uma conta local com esse usuário e outro perfil/vínculo.");
      }

      let remoteExisting=null;
      if(!localOnly){
        const settings=await getSettings();
        if(!settings.cloudSessionToken || !settings.remoteUser || !navigator.onLine){
          throw new Error("Conecte o Administrador ao servidor antes de criar a conta completa.");
        }
        const remoteList=await TonicaoRemoteAuth.listRemoteUsers();
        remoteExisting=(remoteList?.users||[]).find(u=>String(u.username||"").toLowerCase()===username.toLowerCase());
        if(remoteExisting && (remoteExisting.role!==role || String(remoteExisting.studentId||"")!==String(studentId||""))){
          throw new Error("Já existe uma conta remota com esse usuário e outro perfil/vínculo.");
        }
        if(!remoteExisting){
          await TonicaoRemoteAuth.createRemoteUser({name,username,password,role,studentId});
        }
      }

      if(!localExisting && !fbMode){ // com Firebase, a conta vale na nuvem; não precisa cópia local
        await TonicaoAuth.createUser({name,username,password,role,studentId});
      }

      closeModal();
      toast(localOnly
        ? "Conta criada neste aparelho. Falta a conta do servidor para uso em outros dispositivos."
        : (fbMode?"Conta criada. A pessoa já pode entrar com esse e-mail e senha.":"Usuário criado no aparelho e no servidor."));
      await renderMore("users");
    }catch(e){
      toast(e.message||"Falha ao criar usuário.");
    }
  }
  window.saveUnifiedUser=saveUnifiedUser;

  async function goToCloudFromUnified(){
    closeModal();
    goPage("more");
    await renderMore("cloud");
    toast(window.TonicaoFirebase?.configured?"Saia e entre de novo com sua conta de Dono (e-mail e senha).":"Faça login como Administrador remoto e depois volte em Usuários e permissões.");
  }
  window.goToCloudFromUnified=goToCloudFromUnified;

  // Substitui apenas a entrada normal do cadastro. As ferramentas remotas antigas
  // continuam disponíveis na área avançada para migração/reparo.
  window.newUserModal=unifiedUserModal;

  function init(){
    injectStyles();
    versionObserver();
    topShareButton();
    observeUI();
    presentationShell();
  }

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",init,{once:true});
  else init();
})();
