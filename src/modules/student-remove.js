/* v0.58 — Arquivar e excluir aluno.
   Arquivar tira das listas e guarda tudo. Excluir apaga a ficha e tudo que está
   preso a ela, neste celular e no servidor. Como não tem volta, a confirmação
   pede o primeiro nome escrito à mão. */
(()=>{
  "use strict";
  /* Tudo que carrega studentId e some junto com o aluno */
  const LIGADOS=["attendance","gradingHistory","gradingAssignments","gradingReminders","pointsLedger","paymentStatus","classBookings"];

  async function contar(studentId){
    const n={};
    for(const st of LIGADOS){
      try{n[st]=(await DB.getAll(st)).filter(x=>x.studentId===studentId).length}catch(e){n[st]=0}
    }
    return n;
  }

  window.zonaPerigoAlunoV058=async function(id){
    if(!(await guard("manage_students")))return;
    const s=await DB.getOne("students",id);if(!s)return;
    const n=await contar(id);
    const presencas=n.attendance||0,graduacoes=(n.gradingHistory||0);
    showModal(`<h3>⚠️ ${esc(s.name)}</h3>
      <p class="small muted">Duas saídas, e elas são bem diferentes. Leia antes de escolher.</p>

      <div class="notice small"><strong>📦 Arquivar</strong>
        <div class="small">Sai das listas, do check-in e do ranking, mas <b>continua guardado</b>. Dá para reativar quando quiser. É o certo para quem parou de treinar.</div></div>
      <button class="btn secondary full" style="margin-top:8px" onclick="arquivarAlunoV058('${esc(id)}')">📦 Arquivar ${esc(String(s.name).split(" ")[0])}</button>

      <div class="notice payment small" style="margin-top:16px"><strong>🗑️ Excluir de vez</strong>
        <div class="small">Apaga a ficha e tudo que está preso a ela, aqui e no servidor. <b>Não tem como desfazer.</b><br>
        Vai apagar: ${presencas} presença(s)${graduacoes?`, ${graduacoes} graduação(ões)`:""}${n.pointsLedger?`, ${n.pointsLedger} lançamento(s) de pontos`:""}.<br>
        Use para cadastro repetido ou feito por engano.</div></div>
      <button class="btn danger full" style="margin-top:8px" onclick="confirmarExclusaoV058('${esc(id)}')">🗑️ Excluir de vez</button>

      <button class="btn secondary full" style="margin-top:14px" onclick="studentDetails('${esc(id)}')">← Voltar à ficha</button>`);
  };

  window.arquivarAlunoV058=async function(id){
    if(!(await guard("manage_students")))return;
    const s=await DB.getOne("students",id);if(!s)return;
    s.active=false;s.archivedAt=new Date().toISOString();
    await DB.put("students",s);
    try{await TonicaoAuth.audit("student.archive","Aluno arquivado",id,{name:s.name})}catch(e){}
    closeModal();toast(`${String(s.name).split(" ")[0]} foi arquivado.`);
    await renderAll();
  };

  window.confirmarExclusaoV058=async function(id){
    const s=await DB.getOne("students",id);if(!s)return;
    const primeiro=String(s.name||"").trim().split(" ")[0];
    showModal(`<h3>🗑️ Excluir ${esc(s.name)}</h3>
      <div class="notice payment small"><strong>Isto não tem volta</strong>
        <div class="small">A ficha, as presenças, os pontos e as graduações desta pessoa somem deste celular e do servidor. Nenhum backup é feito automaticamente.</div></div>
      <div class="field" style="margin-top:12px"><label>Para confirmar, escreva <b>${esc(primeiro)}</b></label>
        <input id="exConfirma" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${esc(primeiro)}" oninput="checaExclusaoV058('${esc(primeiro)}')"></div>
      <button class="btn danger full" id="exBtn" disabled style="opacity:.5" onclick="excluirAlunoV058('${esc(id)}','${esc(primeiro)}')">Excluir definitivamente</button>
      <button class="btn secondary full" style="margin-top:8px" onclick="zonaPerigoAlunoV058('${esc(id)}')">Cancelar</button>`);
  };
  window.checaExclusaoV058=function(primeiro){
    const v=(document.getElementById("exConfirma")?.value||"").trim().toLowerCase();
    const b=document.getElementById("exBtn");if(!b)return;
    const ok=v===String(primeiro).toLowerCase();
    b.disabled=!ok;b.style.opacity=ok?"1":".5";
  };

  window.excluirAlunoV058=async function(id,primeiro){
    if(!(await guard("manage_students")))return;
    const v=(document.getElementById("exConfirma")?.value||"").trim().toLowerCase();
    if(v!==String(primeiro).toLowerCase()){toast("Escreva o primeiro nome para confirmar.");return}
    const s=await DB.getOne("students",id);if(!s)return;
    const nome=s.name;
    try{
      /* 1. tudo que está preso ao aluno */
      for(const st of LIGADOS){
        const alvos=(await DB.getAll(st)).filter(x=>x.studentId===id);
        for(const x of alvos)await DB.removeOne(st,x.id);
      }
      /* 2. pedidos de cadastro que geraram esta ficha */
      for(const r of await DB.getAll("registrationRequests")){
        if(r.studentId===id)await DB.removeOne("registrationRequests",r.id);
      }
      /* 3. a conta de acesso, se existir: bloqueia e desliga da ficha */
      try{
        const r=DB.clean(await TonicaoRemoteAuth.listRemoteUsers());
        for(const u of (r.users||[])){
          if(u.studentId===id)await TonicaoRemoteAuth.updateRemoteUser({userId:u.id,role:"aluno",studentId:"",active:false});
        }
      }catch(e){/* sem servidor agora: a ficha some mesmo assim */}
      /* 4. a ficha */
      await DB.removeOne("students",id);
      try{await TonicaoAuth.audit("student.delete","Aluno excluído definitivamente",id,{name:nome})}catch(e){}
      closeModal();
      toast(`${primeiro} foi excluído.`);
      try{TonicaoCloud.schedule(300)}catch(e){}
      await renderAll();
    }catch(e){toast(e.message||"Não foi possível excluir.")}
  };

  /* Botão na ficha do aluno */
  const baseDetalhe=window.studentDetails;
  if(typeof baseDetalhe==="function"){
    window.studentDetails=async function(id){
      const r=await baseDetalhe.call(this,id);
      try{
        const u=await TonicaoAuth.currentUser();
        if(!["professor","admin"].includes(u?.role))return r;
        const host=document.getElementById("modalContent");
        if(!host||host.querySelector("[data-v058]"))return r;
        const s=await DB.getOne("students",id);
        const b=document.createElement("button");
        b.dataset.v058="1";b.className="btn secondary full";b.style.marginTop="8px";
        b.textContent=s?.active===false?"📦 Arquivado — gerenciar":"⚙️ Arquivar ou excluir";
        b.onclick=()=>zonaPerigoAlunoV058(id);
        host.appendChild(b);
        if(s&&s.active===false){
          const r2=document.createElement("button");
          r2.className="btn green full";r2.style.marginTop="8px";r2.textContent="↩️ Reativar aluno";
          r2.onclick=async()=>{const x=await DB.getOne("students",id);x.active=true;delete x.archivedAt;await DB.put("students",x);closeModal();toast("Aluno reativado.");renderAll()};
          host.appendChild(r2);
        }
      }catch(e){}
      return r;
    };
  }

  /* Aviso de cadastro repetido, que foi o que gerou a bagunça */
  function chave(s){return String(s.name||"").trim().toLowerCase().replace(/\s+/g," ")}
  function fone(s){try{return phoneForWhatsApp(s.phone||"")}catch(e){return ""}}
  const baseAlunos=window.renderStudents;
  if(typeof baseAlunos==="function"){
    window.renderStudents=async function(...a){
      const r=await baseAlunos.apply(this,a);
      try{
        const u=await TonicaoAuth.currentUser();
        if(!["professor","admin"].includes(u?.role))return r;
        const host=document.getElementById("students");
        if(!host||host.querySelector("[data-repetidos]"))return r;
        const ativos=(await getStudents()).filter(x=>x.active!==false);
        const grupos={};
        for(const s of ativos){
          const k=chave(s),f=fone(s);
          (grupos["n:"+k]=grupos["n:"+k]||[]).push(s);
          if(f)(grupos["f:"+f]=grupos["f:"+f]||[]).push(s);
        }
        const vistos=new Set(),repetidos=[];
        for(const k in grupos){
          const g=grupos[k];if(g.length<2)continue;
          const assinatura=g.map(x=>x.id).sort().join("|");
          if(vistos.has(assinatura))continue;vistos.add(assinatura);
          repetidos.push(g);
        }
        if(!repetidos.length)return r;
        const box=document.createElement("div");box.dataset.repetidos="1";
        box.innerHTML=`<div class="section-title"><h2>⚠️ Possível cadastro repetido</h2><span class="pill amber">${repetidos.length}</span></div>
          <p class="small muted">Mesmo nome ou mesmo telefone. Confira e exclua o que estiver sobrando — pela ficha, em Arquivar ou excluir.</p>
          ${repetidos.map(g=>`<div class="card"><strong>${esc(g[0].name)}</strong>
            <div class="list" style="margin-top:8px">${g.map(s=>`<div class="list-item" style="cursor:default">
              <div class="meta" style="flex:1"><strong>${esc(s.name)}</strong><span class="small muted">${esc(s.belt||"")} • ${esc(s.phone||"sem telefone")}${s.createdAt?` • criado em ${new Date(s.createdAt).toLocaleDateString("pt-BR")}`:""}</span></div>
              <button class="mini-btn" onclick="studentDetails('${esc(s.id)}')">Abrir</button></div>`).join("")}</div></div>`).join("")}`;
        host.insertBefore(box,host.firstChild);
      }catch(e){}
      return r;
    };
  }
})();
