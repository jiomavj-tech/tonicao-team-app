/* v0.31 — funções para o dia a dia do Professor:
   1) Alunos sumidos: quem não treina há 7/14/30 dias, com mensagem pronta de WhatsApp.
   2) Diário de aula: tema e técnicas de cada aula; o aluno vê "O que eu treinei".
   3) Prontos para avaliar: quem já atingiu a referência de treinos para a próxima graduação.
   Nada disso exige mudança nas regras do Firebase (usa alunos e aulas, que já sincronizam). */
(()=>{
  "use strict";
  const DAY=86400000;
  const daysSince=iso=>iso?Math.floor((Date.now()-new Date(String(iso).slice(0,10)+"T12:00:00").getTime())/DAY):null;
  const firstName=n=>String(n||"").trim().split(/\s+/)[0]||"";
  async function me(){try{return await TonicaoAuth.currentUser()}catch(e){return null}}
  async function isStaffRole(){const u=await me();return u&&["professor","admin"].includes(u.role)}

  // ================= 1) ALUNOS SUMIDOS =================
  async function absentList(){
    const students=(await getStudents()).filter(s=>s.active!==false);
    const att=(await getAttendance()).filter(a=>a.status==="approved");
    const last={};for(const a of att){if(!last[a.studentId]||a.date>last[a.studentId])last[a.studentId]=a.date}
    return students.map(s=>{
      const ref=last[s.id]||(s.createdAt||s.approvedAt||"").slice(0,10);
      return {s,last:last[s.id]||"",days:ref?daysSince(ref):null,contacted:s.absenceContactedAt||""};
    }).sort((a,b)=>(b.days??9999)-(a.days??9999));
  }
  window.absentModalV031=async function(min=7){
    if(!(await isStaffRole()))return;
    const list=(await absentList()).filter(x=>x.days===null||x.days>=min);
    showModal(`<h3>😴 Alunos sumidos</h3>
      <div class="actions" style="margin-bottom:10px">${[7,14,30].map(d=>`<button class="btn ${d===min?"primary":"secondary"}" onclick="absentModalV031(${d})">+${d} dias</button>`).join("")}</div>
      <div class="list">${list.length?list.map(({s,last,days,contacted})=>`<div class="list-item" style="cursor:default">${studentAvatar(s)}<div class="meta" style="flex:1"><strong>${esc(s.name)}</strong>
        <span class="small muted">${last?`último treino ${fmtDate(last)} • ${days} dia(s)`:"nenhuma presença registrada"}${contacted?` • 📨 contatado ${fmtDate(contacted.slice(0,10))}`:""}</span></div>
        ${s.phone?`<button class="btn green" onclick="absentWhatsV031('${esc(s.id)}')">💬</button>`:`<span class="small muted">sem telefone</span>`}</div>`).join(""):`<div class="notice">Ninguém sumido há mais de ${min} dias. 💪</div>`}</div>
      <p class="small muted" style="margin-top:10px">Mandar uma mensagem cedo é o que mais evita que o aluno desista.</p>`);
  };
  window.absentWhatsV031=async function(id){
    const s=await DB.getOne("students",id);if(!s)return;
    const settings=await getSettings();
    const text=`Oi ${firstName(s.nickname||s.name)}! 🥋 Sentimos sua falta no tatame da ${settings.academyName||"Tonicão Team"}. Tá tudo bem? Bora voltar pro treino essa semana? Qualquer coisa, estou por aqui. Oss! 👊`;
    s.absenceContactedAt=new Date().toISOString();await DB.put("students",s);
    const phone=phoneForWhatsApp(s.phone);
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`,"_blank");
  };

  // ================= 2) DIÁRIO DE AULA =================
  async function sessionsDesc(){return (await getSessions()).sort((a,b)=>String(b.date||"").localeCompare(String(a.date||""))||String(b.createdAt||"").localeCompare(String(a.createdAt||"")))}
  window.lessonLogListV031=async function(){
    if(!(await isStaffRole()))return;
    const ss=(await sessionsDesc()).slice(0,20);
    showModal(`<h3>📝 Diário de aula</h3><p class="small muted">Anote o que foi ensinado. Os alunos que treinaram veem em "O que eu treinei".</p>
      <button class="btn primary full" onclick="lessonLogEditV031('')">+ Registrar aula (sem QR)</button>
      <div class="list" style="margin-top:10px">${ss.length?ss.map(s=>`<div class="list-item" onclick="lessonLogEditV031('${esc(s.id)}')"><div class="icon">${s.lesson?.topic?"✅":"✏️"}</div><div><strong>${esc(fmtDate(s.date))} • ${esc(s.title||"Aula")}</strong><span class="small muted">${s.lesson?.topic?esc(s.lesson.topic):"sem anotação — toque para preencher"}</span></div></div>`).join(""):`<div class="notice">Nenhuma aula ainda.</div>`}</div>`);
  };
  window.lessonLogEditV031=async function(sessionId){
    if(!(await guard("attendance")))return;
    const s=sessionId?await DB.getOne("classSessions",sessionId):null;
    const techs=(await DB.getAll("techniques")).sort((a,b)=>String(a.title).localeCompare(String(b.title)));
    const sel=new Set(s?.lesson?.techniqueIds||[]);
    const sch=sessionId?[]:(await DB.getAll("classSchedule")).filter(x=>x.active!==false);
    showModal(`<h3>📝 ${s?esc(s.title||"Aula"):"Registrar aula"}</h3>
      ${s?`<p class="small muted">${esc(fmtDate(s.date))}</p>`:`<div class="field"><label>Data</label><input id="llDate" type="date" value="${todayISO()}"></div>
        <div class="field"><label>Turma</label><select id="llSched"><option value="">Aula avulsa</option>${sch.map(x=>`<option value="${esc(x.id)}">${esc(x.start)} • ${esc(x.name)}</option>`).join("")}</select></div>`}
      <div class="field"><label>Tema da aula</label><input id="llTopic" value="${esc(s?.lesson?.topic||"")}" placeholder="Ex.: Passagem de guarda aberta"></div>
      <div class="field"><label>Técnicas trabalhadas</label><div style="max-height:180px;overflow:auto;border:1px solid #e5e7eb;border-radius:12px;padding:6px">${techs.length?techs.map(t=>`<label style="display:flex;gap:8px;align-items:center;padding:6px"><input type="checkbox" class="llTech" value="${esc(t.id)}" ${sel.has(t.id)?"checked":""}> ${esc(t.title)} <span class="small muted">${esc(t.category||"")}</span></label>`).join(""):`<div class="small muted">Cadastre técnicas em Mais → Biblioteca Técnica.</div>`}</div></div>
      <div class="field"><label>Observações (opcional)</label><textarea id="llNotes" placeholder="Ex.: 3 rounds de 5 min com foco em raspagem">${esc(s?.lesson?.notes||"")}</textarea></div>
      <button class="btn primary full" onclick="lessonLogSaveV031('${esc(sessionId||"")}')">Salvar no diário</button>`);
  };
  window.lessonLogSaveV031=async function(sessionId){
    if(!(await guard("attendance")))return;
    const topic=document.getElementById("llTopic").value.trim();
    if(!topic){toast("Escreva o tema da aula.");return}
    const lesson={topic,techniqueIds:[...document.querySelectorAll(".llTech:checked")].map(x=>x.value),notes:document.getElementById("llNotes").value.trim(),updatedAt:new Date().toISOString(),by:(await me())?.name||""};
    let s;
    if(sessionId){s=await DB.getOne("classSessions",sessionId);if(!s)return}
    else{
      const date=document.getElementById("llDate").value||todayISO(),schedId=document.getElementById("llSched").value;
      const sc=schedId?await DB.getOne("classSchedule",schedId):null;
      s={id:uid("cls"),title:sc?`${sc.name} • ${sc.start}`:"Aula avulsa",scheduleId:schedId,date,startTime:sc?.start||"",createdAt:new Date().toISOString(),expiresAt:new Date().toISOString(),status:"closed",closedAt:new Date().toISOString(),manualLog:true};
    }
    s.lesson=lesson;await DB.put("classSessions",s);
    toast("Aula registrada no diário. ✅");closeModal();renderAll();
  };
  async function myLessons(studentId){
    const att=(await getAttendance()).filter(a=>a.studentId===studentId&&a.status==="approved");
    const book=(await DB.getAll("classBookings")).filter(b=>b.studentId===studentId&&b.status==="confirmed");
    const ss=(await sessionsDesc()).filter(s=>s.lesson?.topic);
    return ss.filter(s=>att.some(a=>a.sessionId===s.id||(!a.sessionId&&a.date===s.date&&(!a.scheduleId||a.scheduleId===s.scheduleId)))||book.some(b=>b.date===s.date&&b.scheduleId&&b.scheduleId===s.scheduleId));
  }
  async function lessonCard(s,techs){
    const ts=(s.lesson.techniqueIds||[]).map(id=>techs.find(t=>t.id===id)).filter(Boolean);
    return `<div class="list-item" style="cursor:default;align-items:flex-start"><div class="icon">📖</div><div style="flex:1"><strong>${esc(s.lesson.topic)}</strong>
      <span class="small muted">${esc(fmtDate(s.date))} • ${esc(s.title||"")}</span>
      ${ts.length?`<div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">${ts.map(t=>t.url?`<a class="pill" href="${esc(t.url)}" target="_blank" rel="noopener">▶ ${esc(t.title)}</a>`:`<span class="pill">${esc(t.title)}</span>`).join("")}</div>`:""}
      ${s.lesson.notes?`<div class="small" style="margin-top:6px">${esc(s.lesson.notes)}</div>`:""}</div></div>`;
  }
  window.myLessonsModalV031=async function(){
    const cur=await getCurrentStudent();if(!cur)return;
    const techs=await DB.getAll("techniques"),list=await myLessons(cur.id);
    showModal(`<h3>📖 O que eu treinei</h3><div class="list">${list.length?(await Promise.all(list.map(s=>lessonCard(s,techs)))).join(""):`<div class="notice">Quando o Professor anotar as aulas em que você treinou, elas aparecem aqui.</div>`}</div>`);
  };

  // ================= 3) PRONTOS PARA AVALIAR =================
  async function readiness(){
    const students=(await getStudents()).filter(s=>s.active!==false);
    const assigns=await DB.getAll("gradingAssignments");
    const rems=(await DB.getAll("gradingReminders")).filter(r=>r.status==="active");
    const today=todayISO();
    return students.map(s=>{
      const target=s.targetClasses||targetClassesFor(s.graduationTrack||"adulto",s.belt);
      const pct=Math.round(((s.classesInBelt||0)/(target||1))*100);
      const inPrep=assigns.some(a=>a.studentId===s.id&&!["graduado","revisar"].includes(a.status));
      const r=rems.find(x=>x.studentId===s.id);
      const reminderDue=r&&(r.mode==="date"?(r.date&&r.date<=today):(Number(r.remaining)<=0));
      const reminderWaiting=r&&!reminderDue;
      return {s,target,pct,inPrep,reminderDue,reminderWaiting,ready:(pct>=100&&!reminderWaiting)||reminderDue,near:pct>=85&&pct<100&&!reminderWaiting};
    });
  }
  function readyRow({s,target,pct,inPrep,reminderDue}){
    return `<div class="list-item" style="cursor:default">${studentAvatar(s)}<div class="meta" style="flex:1"><strong>${esc(s.name)}</strong>
      <span class="small muted">${esc(s.belt)} • ${Number(s.stripes||0)} grau(s) • ${s.classesInBelt||0}/${target} treinos (${pct}%)${reminderDue?" • ⏰ reavaliação chegou":""}${inPrep?" • 📘 já em preparação":""}</span></div>
      ${inPrep?`<button class="btn secondary" onclick="closeModal();goPage('graduation')">Ver</button>`:`<button class="btn primary" onclick="closeModal();releaseExam('${esc(s.id)}')">Liberar preparação</button>`}</div>`;
  }
  window.readyModalV031=async function(){
    if(!(await isStaffRole()))return;
    const all=await readiness();const ready=all.filter(x=>x.ready),near=all.filter(x=>x.near);
    showModal(`<h3>🎯 Prontos para avaliar</h3><p class="small muted">Referência de treinos atingida. A decisão de graduar é sempre do Professor.</p>
      <div class="list">${ready.length?ready.map(readyRow).join(""):`<div class="notice">Ninguém atingiu a referência ainda.</div>`}</div>
      ${near.length?`<div class="section-title" style="margin-top:12px"><h2>Quase lá (85%+)</h2></div><div class="list">${near.map(readyRow).join("")}</div>`:""}`);
  };

  // ================= telas =================
  function card(icon,title,sub,count,onclick,color){
    return `<div class="card" style="display:flex;align-items:center;gap:12px;margin-bottom:10px;cursor:pointer" onclick="${onclick}">
      <div style="font-size:30px">${icon}</div><div style="flex:1"><strong>${title}</strong><div class="small muted">${sub}</div></div>
      <span class="pill ${color}" style="font-size:16px;min-width:34px;text-align:center">${count}</span></div>`;
  }
  const baseProfHome=window.renderProfessorHome;
  window.renderProfessorHome=async function(...a){
    const r=await baseProfHome.apply(this,a);
    try{
      const home=document.getElementById("home");if(!home||home.querySelector("[data-v031]"))return r;
      const absent=(await absentList()).filter(x=>x.days===null||x.days>=7).length;
      const rd=await readiness(),ready=rd.filter(x=>x.ready).length;
      const unlogged=(await getSessions()).filter(s=>s.date>=new Date(Date.now()-7*DAY).toISOString().slice(0,10)&&!s.lesson?.topic).length;
      const box=document.createElement("div");box.dataset.v031="1";
      box.innerHTML=card("🎯","Prontos para avaliar","Atingiram a referência de treinos",ready,"readyModalV031()",ready?"green":"")+
        card("😴","Alunos sumidos","Sem treinar há 7 dias ou mais",absent,"absentModalV031(7)",absent?"amber":"")+
        card("📝","Diário de aula",unlogged?`${unlogged} aula(s) da semana sem anotação`:"Tudo anotado",unlogged,"lessonLogListV031()",unlogged?"amber":"green");
      const hero=home.querySelector(".hero");if(hero&&hero.nextSibling)home.insertBefore(box,hero.nextSibling);else home.prepend(box);
    }catch(e){console.warn("v0.31 home",e)}
    return r;
  };
  const baseStuHome=window.renderStudentHome;
  window.renderStudentHome=async function(...a){
    const r=await baseStuHome.apply(this,a);
    try{
      const home=document.getElementById("home");const cur=await getCurrentStudent();if(!home||!cur||home.querySelector("[data-v031]"))return r;
      const list=await myLessons(cur.id),techs=await DB.getAll("techniques");
      const box=document.createElement("div");box.dataset.v031="1";
      box.innerHTML=`<div class="section-title"><h2>📖 O que eu treinei</h2>${list.length>3?`<button class="btn secondary" onclick="myLessonsModalV031()">Ver tudo</button>`:""}</div>
        <div class="list">${list.length?(await Promise.all(list.slice(0,3).map(s=>lessonCard(s,techs)))).join(""):`<div class="notice small">Quando o Professor anotar as aulas, o que você treinou aparece aqui.</div>`}</div>`;
      home.appendChild(box);
    }catch(e){console.warn("v0.31 aluno",e)}
    return r;
  };
  // Diário direto na aula aberta
  const baseCheckin=window.renderCheckin;
  window.renderCheckin=async function(...a){
    const r=await baseCheckin.apply(this,a);
    try{
      if(!(await isStaffRole()))return r;
      const card=document.querySelector("#checkin .session-card .actions");const s=activeSession(await getSessions());
      if(card&&s&&!card.querySelector("[data-ll]"))card.insertAdjacentHTML("beforeend",`<button class="btn secondary" data-ll="1" onclick="lessonLogEditV031('${esc(s.id)}')">📝 ${s.lesson?.topic?"Diário ✅":"Diário"}</button>`);
    }catch(e){}
    return r;
  };
})();
