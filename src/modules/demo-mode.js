/* ===== demo-mode.js ===== */
/* v0.26 — Modo Apresentação completo.
   Abre o app inteiro (todas as telas e funções) num banco separado, só com dados fictícios,
   sem Firebase e sem tocar nos dados reais. Endereço: ...?demo=1 */
(()=>{
  "use strict";
  const DEMO=!!window.TONICAO_DEMO;
  const BASE=location.origin+location.pathname;
  const PASS="Demo@2026!";
  const ACCOUNTS={
    admin:{username:"dono.demo",name:"Dono (demonstração)",label:"🛡️ Dono"},
    professor:{username:"professor.demo",name:"Professor Demo",label:"🥋 Professor"},
    aluno:{username:"aluno.demo",name:"Carlos Souza",label:"👤 Aluno",studentId:"s2"}
  };

  if(!DEMO){
    // No app real: o botão "Apresentar aplicativo" abre a versão completa de demonstração
    window.openPresentation=function(){const u=new URL(BASE);u.searchParams.set("academy",window.TONICAO_ACADEMY_ID||"tonicao-sul-ilha");u.searchParams.set("demo","1");location.href=u.href};
    const fixText=()=>{document.querySelectorAll("[data-v024-present] .small").forEach(el=>{if(!el.dataset.v026){el.dataset.v026="1";el.textContent="Abre o app completo com dados fictícios: Dono, Professor e Aluno. Seus dados reais não são tocados."}})};
    new MutationObserver(fixText).observe(document.documentElement,{childList:true,subtree:true});
    return;
  }

  const css=`
    body{padding-top:52px!important}
    .topbar{top:52px!important}
    #demoBar{position:fixed;top:0;left:0;right:0;z-index:1500;background:#b45309;color:#fff;display:flex;align-items:center;gap:6px;padding:6px 8px;padding-top:calc(6px + env(safe-area-inset-top,0px));font:600 13px system-ui,sans-serif;box-shadow:0 2px 8px rgba(0,0,0,.25);overflow-x:auto}
    #demoBar .t{white-space:nowrap;margin-right:4px}
    #demoBar button{border:0;border-radius:999px;padding:8px 11px;font:700 13px system-ui,sans-serif;background:rgba(255,255,255,.2);color:#fff;white-space:nowrap;cursor:pointer}
    #demoBar button.on{background:#fff;color:#b45309}
    #demoBar .sp{flex:1}
    .v024-demo-close,#v024Presentation{display:none!important}`;
  function bar(role){
    let b=document.getElementById("demoBar");
    if(!b){
      const st=document.createElement("style");st.textContent=css;document.head.appendChild(st);
      b=document.createElement("div");b.id="demoBar";document.body.appendChild(b);
    }
    b.innerHTML=`<span class="t">🎬 Apresentação</span>`+
      Object.entries(ACCOUNTS).map(([r,a])=>`<button class="${r===role?"on":""}" onclick="demoSwitch('${r}')">${a.label}</button>`).join("")+
      `<span class="sp"></span><button onclick="demoMenu()">⋯</button>`;
  }
  async function ensureAccounts(){
    if(!(await TonicaoAuth.hasOwner())){
      await TonicaoAuth.bootstrapAdmin({name:ACCOUNTS.admin.name,username:ACCOUNTS.admin.username,password:PASS});
    }
    await TonicaoAuth.login(ACCOUNTS.admin.username,PASS);
    if(!(await DB.getOne("classSessions","cls-demo-diario"))){ // diário e histórico fictícios (v0.31)
      const d=n=>{const x=new Date();x.setDate(x.getDate()-n);return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`};
      const techs=(await DB.getAll("techniques")).slice(0,2).map(t=>t.id);
      await DB.rawPut("classSessions",{id:"cls-demo-diario",title:"Adulto • 19:00",date:d(1),startTime:"19:00",createdAt:new Date(Date.now()-86400000).toISOString(),expiresAt:new Date(Date.now()-86400000+5400000).toISOString(),status:"closed",lesson:{topic:"Passagem de guarda e controle lateral",techniqueIds:techs,notes:"3 rounds de 5 min com foco em manter o controle lateral.",updatedAt:new Date().toISOString(),by:"Professor Demo"}});
      await DB.rawPut("classSessions",{id:"cls-demo-diario2",title:"Adulto • 19:00",date:d(3),startTime:"19:00",createdAt:new Date(Date.now()-3*86400000).toISOString(),expiresAt:new Date(Date.now()-3*86400000+5400000).toISOString(),status:"closed"});
      for(const [sid,sess,dt] of [["s2","cls-demo-diario",d(1)],["s1","cls-demo-diario",d(1)],["s3","cls-demo-diario2",d(3)],["s4","cls-demo-antigo",d(20)]])
        await DB.rawPut("attendance",{id:`${sess}_${sid}`,studentId:sid,sessionId:sess,date:dt,time:"19:05",source:"qr-codigo",status:"approved"});
      for(const [i,sid] of ["s1","s2","s3","s4"].entries()){const st=await DB.getOne("students",sid);if(st&&!st.phone){st.phone="4899990000"+(i+1);await DB.rawPut("students",st)}}
      const s1=await DB.getOne("students","s1");if(s1){s1.classesInBelt=Math.max(s1.classesInBelt||0,s1.targetClasses||120);await DB.rawPut("students",s1)}
    }
    if(!(await DB.getAll("classSchedule")).length){ // grade fictícia para a apresentação
      for(const x of [{id:"sch-demo-adulto",name:"Adulto",days:[1,3,5],start:"19:00",duration:90,track:"adulto"},{id:"sch-demo-kids",name:"Kids",days:[2,4],start:"18:00",duration:60,track:"kids"},{id:"sch-demo-sabado",name:"Treino livre",days:[6],start:"10:00",duration:120,track:"todos"},{id:"sch-demo-hoje",name:"Aula de hoje",days:[new Date().getDay()],start:"20:00",duration:90,track:"todos"}])
        await DB.rawPut("classSchedule",{...x,active:true});
    }
    const all=await (TonicaoAuth.allUsers?TonicaoAuth.allUsers():TonicaoAuth.users());
    for(const r of ["professor","aluno"]){
      const a=ACCOUNTS[r];
      if(!all.some(u=>u.username===a.username))await TonicaoAuth.createUser({name:a.name,username:a.username,password:PASS,role:r,studentId:a.studentId||""});
    }
  }
  async function switchTo(role){
    const a=ACCOUNTS[role];
    try{await TonicaoAuth.logout()}catch(e){}
    await TonicaoAuth.login(a.username,PASS);
    sessionStorage.setItem("tonicaoDemoRole",role);
    bar(role);
    try{closeModal()}catch(e){}
    await renderAuthGate();await renderAll();
    try{goPage("home")}catch(e){}
    window.scrollTo(0,0);
    toast(`Agora você está vendo o app como ${a.label.replace(/^\S+\s/,"")}.`);
  }
  window.demoSwitch=r=>switchTo(r).catch(e=>toast(e.message||"Falha ao trocar."));
  // ---- v0.30: na apresentação nada sai do app (WhatsApp, servidor) e tudo pode ser simulado ----
  let lastWhats="";
  const realOpen=window.open.bind(window);
  window.open=function(url,...rest){
    const u=String(url||"");
    if(/wa\.me|whatsapp/i.test(u)){
      try{lastWhats=decodeURIComponent((u.split("text=")[1]||"").replace(/\+/g," "))}catch(e){lastWhats=""}
      setTimeout(()=>{if(!window.__demoKeepWhats)showModal(`<h3>📲 Mensagem de WhatsApp</h3><p class="small muted">No uso real, o WhatsApp abre com esta mensagem pronta. Na apresentação, só mostramos o texto:</p><div class="notice" style="white-space:pre-wrap">${esc(lastWhats||"(mensagem)")}</div><button class="btn primary full" onclick="closeModal()">OK</button>`)},60);
      return null;
    }
    return realOpen(url,...rest);
  };
  const baseQuick=window.saveQuickStudentInvite;
  window.saveQuickStudentInvite=async function(){
    window.__demoKeepWhats=true;
    try{await baseQuick()}finally{setTimeout(()=>{window.__demoKeepWhats=false},1500)}
    await new Promise(r=>setTimeout(r,450)); // o app abre o WhatsApp logo em seguida
    const req=(await DB.getAll("registrationRequests")).filter(r=>r.status==="invited").sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)))[0];
    if(!req)return;
    showModal(`<h3>✅ Convite criado</h3>
      <p class="small muted">No uso real, o aluno recebe esta mensagem no WhatsApp, abre o link e preenche os próprios dados:</p>
      <div class="notice" style="white-space:pre-wrap;max-height:160px;overflow:auto">${esc(lastWhats||"Convite de cadastro")}</div>
      <p class="small"><strong>Na apresentação</strong>, toque abaixo para simular que o aluno já preencheu.</p>
      <button class="btn primary full" onclick="demoCompleteRegistration('${esc(req.id)}')">✍️ Simular: aluno preencheu o cadastro</button>
      <button class="btn secondary full" style="margin-top:8px" onclick="closeModal()">Depois</button>`);
  };
  window.demoCompleteRegistration=async function(id){
    const r=await DB.getOne("registrationRequests",id);if(!r)return;
    Object.assign(r,{status:"awaiting_approval",birth:r.birth||"2001-05-10",graduationTrack:r.graduationTrack||"adulto",belt:r.belt||"Branca",stripes:r.stripes||0,
      emergencyName:r.emergencyName||"Contato de emergência",emergencyPhone:r.emergencyPhone||"48999990000",privacyConsentAt:new Date().toISOString(),completedAt:new Date().toISOString()});
    await DB.put("registrationRequests",r);
    closeModal();toast("Cadastro preenchido. Agora o Professor confirma na aba Alunos.");
    await renderAll();try{goPage("students")}catch(e){}
  };
  // contas "no servidor" viram contas locais da apresentação
  try{
    TonicaoRemoteAuth.createRemoteUser=async({name,username,password,role,studentId=""})=>{await TonicaoAuth.createUser({name,username,password,role,studentId});return {user:{id:username}}};
    TonicaoRemoteAuth.listRemoteUsers=async()=>({users:(await (TonicaoAuth.allUsers?TonicaoAuth.allUsers():TonicaoAuth.users())).map(u=>({id:u.id,name:u.name,email:u.username,username:u.username,role:u.role,studentId:u.studentId||"",active:u.active!==false,provider:"password"}))});
  }catch(e){}

  window.demoMenu=function(){
    showModal(`<h3>🎬 Modo Apresentação</h3>
      <p class="small muted">Tudo aqui é fictício e fica separado dos dados reais da academia. Pode apertar todos os botões à vontade.</p>
      <div class="notice"><strong>Roteiro sugerido</strong><div class="small">
        1. <b>Professor</b>: abra uma aula (Check-in) e mostre o QR e o código.<br>
        2. <b>Aluno</b>: faça o check-in com o código e veja pontos e ranking.<br>
        3. <b>Professor</b>: graduação, eventos, técnicas, relatórios.<br>
        4. <b>Dono</b>: usuários, conteúdo da academia e acesso do sistema.</div></div>
      <button class="btn secondary full" style="margin-top:12px" onclick="demoReset()">🔄 Recomeçar apresentação do zero</button>
      <button class="btn primary full" style="margin-top:8px" onclick="demoExit()">✅ Sair da apresentação</button>`);
  };
  window.demoReset=function(){
    if(!confirm("Apagar tudo o que foi feito na apresentação e começar de novo?"))return;
    sessionStorage.removeItem("tonicaoDemoRole");
    const req=indexedDB.deleteDatabase("tonicao_demo");
    req.onsuccess=req.onerror=req.onblocked=()=>location.reload();
    setTimeout(()=>location.reload(),1500);
  };
  window.demoExit=function(){location.href=BASE};

  async function start(){
    // espera o app terminar de preparar o banco de demonstração
    for(let i=0;i<60;i++){
      try{if((await DB.getAll("gradingPlans")).length)break}catch(e){}
      await new Promise(r=>setTimeout(r,150));
    }
    try{
      await ensureAccounts();
      const role=sessionStorage.getItem("tonicaoDemoRole")||"professor";
      await switchTo(role);
    }catch(e){console.warn("Demo",e);toast("Não foi possível abrir a apresentação: "+(e.message||e))}
  }
  window.addEventListener("load",()=>setTimeout(start,300));
})();
