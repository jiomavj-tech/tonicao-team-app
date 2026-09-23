/* v0.34 — O Professor libera as contas dos alunos direto na aba Alunos.
   Antes, só o Administrador/Dono conseguia (em Mais → Usuários). As regras do Firebase
   já permitiam ao Professor liberar contas de ALUNO; faltava a tela. */
(()=>{
  "use strict";
  let cache={at:0,users:null};
  async function me(){try{return await TonicaoAuth.currentUser()}catch(e){return null}}
  async function cloudOn(){const s=await getSettings();return !!(window.TonicaoFirebase?.configured&&s.cloudSessionToken)}

  async function remoteUsers(force=false){
    if(!force&&cache.users&&Date.now()-cache.at<30000)return cache.users;
    const r=DB.clean(await TonicaoRemoteAuth.listRemoteUsers());
    cache={at:Date.now(),users:r.users||[]};
    return cache.users;
  }
  window.refreshStudentAccountsV034=async function(){
    try{await remoteUsers(true);toast("Lista atualizada.")}catch(e){toast(e.message||"Falha ao consultar o servidor.")}
    await renderStudents();
  };

  window.linkStudentAccountV034=async function(userId){
    if(!(await guard("manage_students")))return;
    const users=await remoteUsers(),u=users.find(x=>x.id===userId);if(!u)return;
    const students=(await getStudents()).filter(s=>s.active!==false).sort((a,b)=>a.name.localeCompare(b.name));
    const taken=new Set(users.filter(x=>x.studentId&&x.id!==userId).map(x=>x.studentId));
    const guess=students.find(s=>s.name.toLowerCase().startsWith(String(u.name||"").toLowerCase().split(" ")[0]));
    showModal(`<h3>🔐 Liberar acesso</h3>
      <div class="list-item" style="cursor:default"><div class="icon">${u.picture?`<img src="${esc(u.picture)}" alt="">`:"👤"}</div>
        <div><strong>${esc(u.name||"Sem nome")}</strong><span class="small muted">${esc(u.email||"")}</span></div></div>
      <div class="field" style="margin-top:12px"><label>Ficha do aluno</label>
        <select id="lnkStudent">${students.map(s=>`<option value="${esc(s.id)}" ${guess&&guess.id===s.id?"selected":""}>${esc(s.name)}${taken.has(s.id)?" (já tem outra conta)":""}</option>`).join("")}</select></div>
      <p class="small muted">A pessoa vai ver apenas a própria ficha, presenças e graduação.</p>
      <button class="btn primary full" onclick="saveLinkStudentAccountV034('${esc(userId)}')">Liberar acesso</button>
      <button class="btn secondary full" style="margin-top:8px" onclick="closeModal()">Agora não</button>`);
  };
  window.saveLinkStudentAccountV034=async function(userId){
    if(!(await guard("manage_students")))return;
    const studentId=document.getElementById("lnkStudent").value;
    if(!studentId){toast("Escolha a ficha do aluno.");return}
    try{
      await TonicaoRemoteAuth.approveGoogleUser({userId,role:"aluno",studentId});
      const s=await DB.getOne("students",studentId);
      closeModal();toast(`Acesso liberado para ${s?.name||"o aluno"}. ✅`);
      await remoteUsers(true);await renderAll();
    }catch(e){toast(e.message||"Não foi possível liberar.")}
  };
  window.blockStudentAccountV034=async function(userId){
    if(!(await guard("manage_students")))return;
    const u=(await remoteUsers()).find(x=>x.id===userId);if(!u)return;
    if(!confirm(`Bloquear o acesso de ${u.name||u.email}?\n\nA ficha e o histórico do aluno continuam salvos.`))return;
    try{
      await TonicaoRemoteAuth.updateRemoteUser({userId,role:"aluno",studentId:u.studentId||"",active:false});
      toast("Acesso bloqueado.");await remoteUsers(true);await renderAll();
    }catch(e){toast(e.message||"Não foi possível bloquear.")}
  };

  async function accountsSection(){
    const users=await remoteUsers();
    const students=await getStudents();
    const nameOf=id=>students.find(s=>s.id===id)?.name||"sem ficha";
    const pending=users.filter(u=>u.active===false&&u.role!=="admin");
    const alunos=users.filter(u=>u.active!==false&&u.role==="aluno");
    return `<div class="section-title"><h2>🔐 Contas de acesso</h2><button class="btn secondary" onclick="refreshStudentAccountsV034()">Atualizar</button></div>
      ${pending.length?`<div class="list">${pending.map(u=>`<div class="list-item" style="cursor:default"><div class="icon">⏳</div>
        <div class="meta" style="flex:1"><strong>${esc(u.name||"Sem nome")}</strong><span class="small muted">${esc(u.email||"")} • aguardando liberação</span></div>
        <button class="btn primary" onclick="linkStudentAccountV034('${esc(u.id)}')">Liberar</button></div>`).join("")}</div>`
        :`<div class="notice small">Nenhuma conta aguardando. Quando o aluno entrar com o Google pela primeira vez, ele aparece aqui.</div>`}
      ${alunos.length?`<details style="margin-top:10px"><summary class="small muted">Alunos com acesso liberado (${alunos.length})</summary>
        <div class="list" style="margin-top:8px">${alunos.map(u=>`<div class="list-item" style="cursor:default"><div class="icon">✅</div>
          <div class="meta" style="flex:1"><strong>${esc(u.name||u.email)}</strong><span class="small muted">ficha: ${esc(nameOf(u.studentId))}</span></div>
          <button class="mini-btn" onclick="linkStudentAccountV034('${esc(u.id)}')">Trocar ficha</button>
          <button class="mini-btn" onclick="blockStudentAccountV034('${esc(u.id)}')">Bloquear</button></div>`).join("")}</div></details>`:""}`;
  }

  window.addEventListener("tonicao:data-synced",()=>{cache.at=0}); // sincronizou: consulta de novo

  const baseRenderStudents=window.renderStudents;
  window.renderStudents=async function(...a){
    const r=await baseRenderStudents.apply(this,a);
    try{
      const u=await me();
      if(!u||u.role!=="professor"||!(await cloudOn()))return r;
      const host=document.getElementById("students");if(!host||host.querySelector("[data-v034]"))return r;
      const box=document.createElement("div");box.dataset.v034="1";
      box.innerHTML=await accountsSection();
      host.appendChild(box);
    }catch(e){
      const host=document.getElementById("students");
      if(host&&!host.querySelector("[data-v034]")){
        const box=document.createElement("div");box.dataset.v034="1";
        box.innerHTML=`<div class="section-title"><h2>🔐 Contas de acesso</h2><button class="btn secondary" onclick="refreshStudentAccountsV034()">Tentar de novo</button></div><div class="notice payment small">${esc(e.message||"Sem conexão com o servidor.")}</div>`;
        host.appendChild(box);
      }
    }
    return r;
  };
})();
