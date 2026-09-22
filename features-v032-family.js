/* Tonicão Team v0.32 — Família e Dependentes */
(()=>{
  "use strict";
  const F=()=>window.TonicaoFirebase;
  const demo=()=>!!window.TONICAO_DEMO;
  const escF=s=>typeof esc==="function"?esc(s):String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
  const norm=s=>String(s||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").trim().toLowerCase().replace(/\s+/g," ");
  const rid=p=>globalThis.crypto?.randomUUID?`${p}-${crypto.randomUUID()}`:`${p}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  const acad=()=>F()?.acad?.();
  const meta=()=>({_srv:firebase.firestore.FieldValue.serverTimestamp(),_by:F()?.auth?.currentUser?.uid||"public"});

  async function me(){try{return await TonicaoAuth.currentUser()}catch{return null}}
  async function settings(){return (await DB.getOne("settings","app"))||{id:"app"}}
  async function saveSettings(p){const s=await settings();Object.assign(s,p);await DB.rawPut("settings",s);return s}
  function parseDoc(d){const x=d.data()||{};if(x._deleted)return null;let v;if(x.json){try{v=JSON.parse(x.json)}catch{v={}}}else{v={...x};delete v._srv;delete v._by;delete v._deleted;delete v.json}v.id=v.id||d.id;if(x.progress)v.progress=x.progress;if(x.status)v.status=x.status;return v}

  async function ensureDemoFamily(user){
    if(!demo()||user?.role!=="aluno")return null;
    const s=await settings();let ids=Array.isArray(s.familyDependentStudentIds)?s.familyDependentStudentIds:[];
    if(!ids.length){
      const id=`family-demo-child-${user.id||"aluno"}`;
      if(!(await DB.getOne("students",id)))await DB.rawPut("students",{id,name:"Filho Demo",nickname:"Filho",birth:"2017-06-12",graduationTrack:"kids",belt:"Branca",stripes:1,classesInBelt:18,targetClasses:60,streak:3,points:95,dueDay:10,payment:"liberado",active:true,photo:"",guardianName:user.name||"Responsável Demo",familyGuardianUid:user.id||"",privacyConsentAt:new Date().toISOString(),guardianConsentAt:new Date().toISOString()});
      ids=[id];await saveSettings({familyDependentStudentIds:ids});
    }
    return {ids,member:{id:user.id,name:user.name,studentId:user.studentId||"",dependentStudentIds:ids}};
  }

  let cache={at:0,ids:null,member:null};
  async function familyAccess(force=false){
    const user=await me();if(!user||user.role!=="aluno")return {ids:[],member:null};
    const d=await ensureDemoFamily(user);if(d)return d;
    const s=await settings();let ids=Array.isArray(s.familyDependentStudentIds)?s.familyDependentStudentIds:[],member=null;
    if(!force&&cache.ids&&Date.now()-cache.at<60000)return {ids:cache.ids,member:cache.member};
    if(F()?.configured&&F()?.auth?.currentUser&&navigator.onLine){
      try{const snap=await acad().collection("members").doc(F().auth.currentUser.uid).get();if(snap.exists){member={id:snap.id,...snap.data()};ids=Array.isArray(member.dependentStudentIds)?member.dependentStudentIds.filter(Boolean):[];await saveSettings({familyDependentStudentIds:ids,familyLastSyncAt:new Date().toISOString()})}}catch(e){console.warn("family access",e)}
    }
    cache={at:Date.now(),ids,member};return {ids,member};
  }

  async function pullStore(store,studentId){
    if(!F()?.configured||!F()?.auth?.currentUser||!navigator.onLine)return;
    try{const snap=await acad().collection(store).where("studentId","==",studentId).limit(300).get();for(const d of snap.docs){const v=parseDoc(d);if(v)await DB.rawPut(store,v);else await DB.rawDelete(store,d.id)}}catch(e){console.warn("family sync",store,e)}
  }
  async function syncDependent(id){
    if(!id||!F()?.configured||!F()?.auth?.currentUser||!navigator.onLine)return;
    try{const d=await acad().collection("students").doc(id).get();if(d.exists){const v=parseDoc(d);if(v)await DB.rawPut("students",v)}for(const st of ["attendance","gradingHistory","gradingAssignments","gradingReminders","pointsLedger","paymentStatus","classBookings"])await pullStore(st,id);try{const ns=await acad().collection("notifications").where("targetStudentId","==",id).limit(100).get();for(const d of ns.docs){const v=parseDoc(d);if(v)await DB.rawPut("notifications",v)}}catch{}}catch(e){console.warn("family child",e)}
  }
  async function syncFamily(force=false){const a=await familyAccess(force);for(const id of a.ids)await syncDependent(id);return a}
  window.syncFamilyV032=syncFamily;

  async function profiles(force=false){
    const user=await me();if(!user||user.role!=="aluno")return [];
    const {ids}=await syncFamily(force),wanted=[user.studentId,...ids].filter(Boolean),seen=new Set(),out=[];
    for(const id of wanted){if(seen.has(id))continue;seen.add(id);const s=await DB.getOne("students",id);if(s&&s.active!==false)out.push({...s,isOwn:id===user.studentId,isDependent:id!==user.studentId})}
    return out;
  }
  window.familyProfilesV032=profiles;

  const baseCurrent=window.getCurrentStudent;
  window.getCurrentStudent=async function(){
    const user=await me();if(user?.role!=="aluno")return baseCurrent();
    const s=await settings(),ids=Array.isArray(s.familyDependentStudentIds)?s.familyDependentStudentIds:[],allowed=[user.studentId,...ids].filter(Boolean);
    let id=s.familySelectedStudentId;if(!allowed.includes(id))id=user.studentId||ids[0]||"";
    if(id){let st=await DB.getOne("students",id);if(!st&&ids.includes(id)){await syncDependent(id);st=await DB.getOne("students",id)}if(st&&st.active!==false)return st}
    return baseCurrent();
  };

  window.selectFamilyProfileV032=async id=>{
    const list=await profiles(true);if(!list.some(x=>x.id===id)){toast("Perfil sem vínculo autorizado.");return}
    await saveSettings({familySelectedStudentId:id});closeModal?.();await renderAll();toast(`Perfil ativo: ${list.find(x=>x.id===id)?.name||"Aluno"}.`)
  };
  window.familyProfilePickerV032=async()=>{
    const list=await profiles(true),cur=await getCurrentStudent();if(!list.length){toast("Nenhum perfil vinculado.");return}
    showModal(`<h3>👨‍👩‍👧 Escolher perfil</h3><div class="list">${list.map(p=>`<div class="list-item" onclick="selectFamilyProfileV032('${escF(p.id)}')">${studentAvatar(p)}<div class="meta"><strong>${escF(p.name)}</strong><span class="small muted">${p.isDependent?"Dependente":"Meu perfil"} • ${escF(p.belt||"")}</span></div><span class="pill ${cur?.id===p.id?"green":""}">${cur?.id===p.id?"ATIVO":"Abrir"}</span></div>`).join("")}</div><button class="btn secondary full" style="margin-top:10px" onclick="closeModal();goPage('more');renderMore('family')">Gerenciar família</button>`)
  };

  window.newDependentV032=async()=>{
    const user=await me();if(user?.role!=="aluno"){toast("Entre com a conta do responsável.");return}
    showModal(`<h3>➕ Adicionar filho/dependente</h3><p class="small muted">A criança não precisa de e-mail ou senha. O Professor confirma o vínculo.</p>
      <div class="field"><label>Nome completo</label><input id="famChildName"></div><div class="field"><label>Data de nascimento</label><input id="famChildBirth" type="date"></div>
      <div class="field"><label>Relação</label><select id="famRelation"><option value="filho">Filho</option><option value="filha">Filha</option><option value="dependente">Dependente</option></select></div>
      <div class="field"><label>Faixa atual</label><select id="famBelt"><option>Branca</option><option>Cinza</option><option>Amarela</option><option>Laranja</option><option>Verde</option></select></div>
      <div class="field"><label>Graus</label><input id="famStripes" type="number" min="0" max="4" value="0"></div>
      <div class="notice"><strong>Já está cadastrado?</strong><div class="small">O Professor poderá vincular esta solicitação à ficha existente e evitar duplicidade.</div></div>
      <label class="notice" style="display:block;margin-top:10px"><input id="famConsent" type="checkbox" style="margin-right:8px"> Confirmo que sou responsável/autorizado por este menor.</label>
      <button class="btn primary full" onclick="submitDependentV032()">Enviar ao Professor</button>`)
  };

  window.submitDependentV032=async()=>{
    const user=await me(),name=document.getElementById("famChildName")?.value.trim(),birth=document.getElementById("famChildBirth")?.value;
    if(!name||!birth){toast("Informe nome e nascimento.");return}if(!document.getElementById("famConsent")?.checked){toast("Confirme a autorização.");return}
    const own=user?.studentId?await DB.getOne("students",user.studentId):null,now=new Date().toISOString(),id=rid("famreq");
    const req={name,phone:"",birth,graduationTrack:"kids",belt:document.getElementById("famBelt").value||"Branca",stripes:Number(document.getElementById("famStripes").value||0),guardianName:user?.name||own?.name||"Responsável",guardianPhone:own?.phone||"",guardianUserId:F()?.auth?.currentUser?.uid||user?.id||"",guardianStudentId:user?.studentId||"",relationship:document.getElementById("famRelation").value,status:"pending",source:"family",inviteToken:id,privacyConsentAt:now,guardianConsentAt:now,createdAt:now};
    if(demo()){const s=await settings(),a=Array.isArray(s.familyRequestCache)?s.familyRequestCache:[];a.push({...req,id});await saveSettings({familyRequestCache:a});closeModal();toast("Solicitação criada no modo demonstração.");return renderMore("family")}
    if(!F()?.configured||!F()?.auth?.currentUser||!navigator.onLine){toast("Conecte-se à internet para enviar.");return}
    try{await acad().collection("registrationInvites").doc(id).set({...req,...meta()});const s=await settings(),ids=Array.isArray(s.familyRequestIds)?s.familyRequestIds:[],c=Array.isArray(s.familyRequestCache)?s.familyRequestCache:[];if(!ids.includes(id))ids.push(id);c.push({...req,id});await saveSettings({familyRequestIds:ids,familyRequestCache:c});closeModal();toast("Solicitação enviada ao Professor.");renderMore("family")}catch(e){toast(e.message||"Falha ao enviar.")}
  };

  async function ownRequests(){const s=await settings(),ids=Array.isArray(s.familyRequestIds)?s.familyRequestIds:[],cache=Array.isArray(s.familyRequestCache)?s.familyRequestCache:[];if(F()?.configured&&F()?.auth?.currentUser&&navigator.onLine){const fresh=[];for(const id of ids)try{const d=await acad().collection("registrationInvites").doc(id).get();if(d.exists)fresh.push({id:d.id,...d.data()})}catch{}if(fresh.length){await saveSettings({familyRequestCache:fresh});return fresh}}return cache}
  async function staffRequests(){if(demo()||!F()?.configured||!F()?.auth?.currentUser||!navigator.onLine)return [];try{const s=await acad().collection("registrationInvites").where("source","==","family").limit(100).get();return s.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")))}catch{return []}}
  async function staffFamilies(){if(demo()||!F()?.configured||!F()?.auth?.currentUser||!navigator.onLine)return [];try{const s=await acad().collection("members").get();return s.docs.map(d=>({id:d.id,...d.data()})).filter(x=>Array.isArray(x.dependentStudentIds)&&x.dependentStudentIds.length)}catch{return []}}

  window.familyRequestDecisionV032=async id=>{
    const user=await me();if(user?.role!=="professor"){toast("A confirmação é do Professor.");return}if(demo()){toast("No modo apresentação, veja a família pela visão Aluno.");return}
    const d=await acad().collection("registrationInvites").doc(id).get();if(!d.exists){toast("Solicitação não encontrada.");return}const r={id:d.id,...d.data()},all=(await getStudents()).filter(s=>s.active!==false),matches=all.filter(s=>(s.birth&&r.birth&&s.birth===r.birth)||norm(s.name)===norm(r.name));
    showModal(`<h3>👨‍👩‍👧 Confirmar dependente</h3><p><strong>${escF(r.name)}</strong><br><span class="small muted">${escF(r.birth||"")} • ${escF(r.relationship||"dependente")}</span></p><div class="notice"><strong>Responsável:</strong> ${escF(r.guardianName||"")}</div>
      <div class="field"><label>Ficha do aluno</label><select id="famExisting"><option value="">Criar nova ficha</option>${matches.map(s=>`<option value="${escF(s.id)}">Possível correspondência: ${escF(s.name)} • ${escF(s.birth||"")}</option>`).join("")}${all.filter(s=>!matches.some(m=>m.id===s.id)).slice(0,100).map(s=>`<option value="${escF(s.id)}">${escF(s.name)} • ${escF(s.birth||"")}</option>`).join("")}</select></div>
      <p class="small muted">Se a criança já estiver cadastrada, selecione a ficha existente.</p><button class="btn primary full" onclick="approveFamilyRequestV032('${escF(id)}')">✓ Confirmar vínculo</button><button class="btn danger full" style="margin-top:8px" onclick="rejectFamilyRequestV032('${escF(id)}')">Recusar</button>`)
  };

  function studentDoc(s){return {id:String(s.id),json:JSON.stringify(s),payment:s.payment,active:s.active,...meta()}}
  function publicDoc(s){const p={};for(const k of ["id","name","nickname","belt","stripes","points","graduationTrack","photo","active","updatedAt"])if(s[k]!==undefined)p[k]=s[k];return {id:String(s.id),json:JSON.stringify(p),...meta()}}
  window.approveFamilyRequestV032=async requestId=>{
    const user=await me();if(user?.role!=="professor"){toast("Somente o Professor.");return}if(!navigator.onLine){toast("Conecte-se à internet.");return}
    try{const ref=acad().collection("registrationInvites").doc(requestId),snap=await ref.get();if(!snap.exists)throw new Error("Solicitação não encontrada.");const r=snap.data();if(r.source!=="family"||r.status!=="pending")throw new Error("Solicitação já encerrada.");const existing=document.getElementById("famExisting")?.value||"";let child=existing?await DB.getOne("students",existing):null;if(existing&&!child){const x=await acad().collection("students").doc(existing).get();child=x.exists?parseDoc(x):null}if(!child){const id=rid("s"),belt=r.belt||"Branca";child={id,name:r.name,nickname:String(r.name||"").split(/\s+/)[0],phone:"",email:"",birth:r.birth||"",graduationTrack:"kids",belt,stripes:Number(r.stripes||0),classesInBelt:0,targetClasses:typeof targetClassesFor==="function"?targetClassesFor("kids",belt):60,streak:0,points:0,guardianName:r.guardianName||"",guardianPhone:r.guardianPhone||"",privacyConsentAt:r.privacyConsentAt||"",guardianConsentAt:r.guardianConsentAt||"",familyGuardianUid:r.guardianUserId||"",familyGuardianStudentId:r.guardianStudentId||"",relationship:r.relationship||"dependente",dueDay:10,payment:"verificar",active:true,photo:"",createdAt:new Date().toISOString(),familyRequestId:requestId}}
      const member=acad().collection("members").doc(r.guardianUserId),ms=await member.get();if(!ms.exists)throw new Error("Conta do responsável não encontrada.");const b=F().db.batch();if(!existing){b.set(acad().collection("students").doc(child.id),studentDoc(child));b.set(acad().collection("studentsPublic").doc(child.id),publicDoc(child))}b.update(member,{dependentStudentIds:firebase.firestore.FieldValue.arrayUnion(child.id),familyRole:"guardian",...meta()});b.update(ref,{status:"approved",studentId:child.id,decidedAt:new Date().toISOString(),...meta()});await b.commit();await DB.rawPut("students",child);closeModal();toast(existing?"Vínculo confirmado com a ficha existente.":"Dependente criado e vinculado.");await renderAll();goPage("more");renderMore("family")
    }catch(e){toast(e.message||"Falha ao confirmar vínculo.")}
  };
  window.rejectFamilyRequestV032=async id=>{const user=await me();if(user?.role!=="professor")return;try{await acad().collection("registrationInvites").doc(id).update({status:"rejected",studentId:"",decidedAt:new Date().toISOString(),...meta()});closeModal();toast("Solicitação recusada.");renderMore("family")}catch(e){toast(e.message||"Falha ao recusar.")}};
  window.unlinkFamilyV032=async(uid,sid)=>{const user=await me();if(user?.role!=="professor")return;if(!confirm("Remover o vínculo? A ficha do aluno será preservada."))return;try{await acad().collection("members").doc(uid).update({dependentStudentIds:firebase.firestore.FieldValue.arrayRemove(sid),...meta()});toast("Vínculo removido.");renderMore("family")}catch(e){toast(e.message||"Falha ao remover.")}};

  window.newGuardianAccountV032=()=>showModal(`<h3>👤 Criar conta de responsável</h3><p class="small muted">Para pai/mãe que não treina. Não cria ficha esportiva para o responsável.</p><div class="field"><label>Nome</label><input id="gaName"></div><div class="field"><label>E-mail</label><input id="gaEmail" type="email"></div><div class="field"><label>Senha inicial</label><input id="gaPass" type="password"></div><button class="btn primary full" onclick="saveGuardianAccountV032()">Criar responsável</button>`);
  window.saveGuardianAccountV032=async()=>{const user=await me();if(!["professor","admin"].includes(user?.role))return;const name=document.getElementById("gaName").value.trim(),email=document.getElementById("gaEmail").value.trim(),password=document.getElementById("gaPass").value;if(!name||!email||!password){toast("Preencha os campos.");return}try{await TonicaoRemoteAuth.createRemoteUser({name,username:email,password,role:"aluno",studentId:""});closeModal();toast("Conta do responsável criada.");renderMore("family")}catch(e){toast(e.message||"Falha ao criar conta.")}};
  window.directFamilyLinkModalV032=async()=>{const user=await me();if(user?.role!=="professor"){toast("Somente o Professor.");return}try{const users=(await TonicaoRemoteAuth.listRemoteUsers()).users.filter(u=>u.role==="aluno"),students=await getStudents();showModal(`<h3>🔗 Vincular aluno existente</h3><div class="field"><label>Responsável</label><select id="dfGuardian"><option value="">Selecione</option>${users.map(u=>`<option value="${escF(u.id)}">${escF(u.name)} • ${escF(u.email||u.username||"")}</option>`).join("")}</select></div><div class="field"><label>Aluno</label><select id="dfStudent"><option value="">Selecione</option>${students.map(s=>`<option value="${escF(s.id)}">${escF(s.name)} • ${escF(s.birth||"")}</option>`).join("")}</select></div><button class="btn primary full" onclick="saveDirectFamilyLinkV032()">Vincular</button>`)}catch(e){toast(e.message||"Falha ao carregar.")}};
  window.saveDirectFamilyLinkV032=async()=>{const uid=document.getElementById("dfGuardian")?.value,sid=document.getElementById("dfStudent")?.value;if(!uid||!sid){toast("Selecione responsável e aluno.");return}try{await acad().collection("members").doc(uid).update({dependentStudentIds:firebase.firestore.FieldValue.arrayUnion(sid),familyRole:"guardian",...meta()});closeModal();toast("Aluno vinculado ao responsável.");renderMore("family")}catch(e){toast(e.message||"Falha ao vincular.")}};

  function scan(raw){let code=String(raw||"").trim(),sessionId="";try{const u=new URL(code,location.href);sessionId=u.searchParams.get("ci")||"";code=u.searchParams.get("c")||code}catch{}const m=code.match(/\b(\d{6})\b/);if(m)code=m[1];return {sessionId,code}}
  async function eligible(list,sessionId){const sess=sessionId?await DB.getOne("classSessions",sessionId):activeSession(await getSessions());if(!sess?.scheduleId)return list;const sc=await DB.getOne("classSchedule",sess.scheduleId);if(!sc||!sc.track||sc.track==="todos")return list;return list.filter(p=>sc.track==="kids"?p.graduationTrack==="kids":p.graduationTrack!=="kids")}
  async function checkOne(id,sessionId,code){const s=await DB.getOne("students",id);if(!s)return {name:"Aluno",ok:false,reason:"perfil não carregado"};if(["pendente","verificar","bloqueado"].includes(s.payment))return {name:s.name,ok:false,reason:"pagamento precisa ser verificado pelo Professor"};const a=await DB.getAll("attendance");if(a.some(x=>x.studentId===id&&x.sessionId===sessionId))return {name:s.name,ok:false,reason:"check-in já realizado"};await registerAttendance(id,"qr-codigo",sessionId,{checkinCode:code});return {name:s.name,ok:true}}
  window.familyCheckinEntryV032=async(sessionId,raw)=>{const user=await me();if(user?.role!=="aluno"){toast("Este QR é para aluno/responsável.");return}const p=scan(raw);sessionId=p.sessionId||sessionId||activeSession(await getSessions())?.id||"";if(!sessionId){toast("Aula não encontrada.");return}if(!/^\d{6}$/.test(p.code)){toast("Código inválido.");return}let list=await eligible(await profiles(true),sessionId);if(!list.length){toast("Nenhum perfil da família é elegível para esta aula.");return}if(list.length===1)return confirmFamilyCheckinV032(sessionId,p.code,[list[0].id]);showModal(`<h3>✅ Quem vai fazer check-in?</h3><p class="small muted">Marque quem está entrando nesta aula.</p><div class="list">${list.map(s=>`<label class="list-item" style="cursor:pointer"><input type="checkbox" class="famCheck" value="${escF(s.id)}" style="width:22px;height:22px">${studentAvatar(s)}<div><strong>${escF(s.name)}</strong><span class="small muted">${s.isDependent?"Dependente":"Meu perfil"}</span></div></label>`).join("")}</div><button class="btn primary full" onclick="confirmFamilyCheckinV032('${escF(sessionId)}','${escF(p.code)}')">Confirmar check-in</button>`)};
  window.confirmFamilyCheckinV032=async(sessionId,code,ids=null)=>{const selected=ids||[...document.querySelectorAll(".famCheck:checked")].map(x=>x.value);if(!selected.length){toast("Selecione pelo menos uma pessoa.");return}const results=[];for(const id of selected)try{results.push(await checkOne(id,sessionId,code))}catch(e){const s=await DB.getOne("students",id);results.push({name:s?.name||"Aluno",ok:false,reason:e.message||"falha"})}try{if(F()?.configured&&navigator.onLine)await TonicaoCloud.syncNow({silent:true})}catch{}closeModal();const ok=results.filter(x=>x.ok),bad=results.filter(x=>!x.ok);showModal(`<div style="text-align:center"><div style="font-size:58px">${ok.length?"✅":"⚠️"}</div><h3>${ok.length?`${ok.length} check-in(s) enviado(s)`:"Nenhum check-in realizado"}</h3>${ok.length?`<p>${ok.map(x=>escF(x.name)).join(", ")}</p>`:""}${bad.length?`<div class="notice payment" style="text-align:left">${bad.map(x=>`<div><strong>${escF(x.name)}:</strong> ${escF(x.reason)}</div>`).join("")}</div>`:""}<button class="btn primary full" onclick="closeModal()">OK</button></div>`)};

  const baseCheck=window.studentCheckinByCode;
  window.studentCheckinByCode=async(_id,value)=>{const user=await me();if(user?.role==="aluno"){const p=scan(value);return familyCheckinEntryV032(p.sessionId||activeSession(await getSessions())?.id||"",value)}return baseCheck(_id,value)};
  window.studentCheckinWithInput=async()=>familyCheckinEntryV032(activeSession(await getSessions())?.id||"",(document.getElementById("studentClassCode")?.value||"").trim());

  window.bookClass=async(scheduleId,date)=>{const s=await getCurrentStudent();if(!s){toast("Escolha um perfil.");return}const id=`${scheduleId}_${date}_${s.id}`,cur=await DB.getOne("classBookings",id);if(cur&&cur.status!=="pending"){toast("Aula já confirmada.");return}await DB.put("classBookings",{id,scheduleId,date,studentId:s.id,status:"pending",createdAt:new Date().toISOString()});toast(`Aula marcada para ${s.name}.`);renderAll()};
  window.unbookClass=async(scheduleId,date)=>{const s=await getCurrentStudent();if(!s)return;const id=`${scheduleId}_${date}_${s.id}`,cur=await DB.getOne("classBookings",id);if(!cur)return;if(cur.status!=="pending"){toast("Já confirmada pelo Professor.");return}await DB.removeOne("classBookings",id);toast(`Marcação de ${s.name} cancelada.`);renderAll()};

  const baseTarget=window.notificationTargetsCurrentUser;
  window.notificationTargetsCurrentUser=async n=>{const user=await me();if(user?.role==="aluno"&&n?.targetStudentId){const {ids}=await familyAccess();if(ids.includes(n.targetStudentId))return true}return baseTarget(n)};

  async function parentPage(){const list=await profiles(true),cur=await getCurrentStudent(),req=await ownRequests();return `<div class="section-title"><h2>👨‍👩‍👧 Minha família</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div><div class="card"><h3>Perfis vinculados</h3><p class="small muted">Uma conta do responsável pode cuidar de vários filhos. Criança não precisa de e-mail.</p><div class="list">${list.length?list.map(p=>`<div class="list-item" onclick="selectFamilyProfileV032('${escF(p.id)}')">${studentAvatar(p)}<div class="meta"><strong>${escF(p.name)}</strong><span class="small muted">${p.isDependent?"Dependente":"Meu perfil"} • ${escF(p.belt||"")}</span></div><span class="pill ${cur?.id===p.id?"green":""}">${cur?.id===p.id?"ATIVO":"Abrir"}</span></div>`).join(""):`<div class="notice">Nenhum perfil esportivo vinculado.</div>`}</div><button class="btn primary full" style="margin-top:10px" onclick="newDependentV032()">+ Adicionar filho/dependente</button></div><div class="section-title"><h2>Solicitações</h2></div><div class="list">${req.length?req.map(r=>`<div class="list-item" style="cursor:default"><div class="icon">👶</div><div><strong>${escF(r.name)}</strong><span class="small muted">${r.status==="approved"?"✅ vínculo aprovado":r.status==="rejected"?"❌ recusado":"⏳ aguardando o Professor"}</span></div></div>`).join(""):`<div class="notice small">Nenhuma solicitação.</div>`}</div><div class="notice" style="margin-top:10px"><strong>QR familiar</strong><div class="small">Ao ler o QR da aula, o app pergunta quem da família está treinando.</div></div>`}
  async function staffPage(){const user=await me(),req=(await staffRequests()).filter(x=>x.status==="pending"),fam=await staffFamilies(),students=await getStudents(),name=id=>students.find(s=>s.id===id)?.name||"Aluno";return `<div class="section-title"><h2>👨‍👩‍👧 Famílias</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div><div class="actions" style="margin-bottom:10px"><button class="btn primary" onclick="newGuardianAccountV032()">+ Responsável</button>${user?.role==="professor"?`<button class="btn secondary" onclick="directFamilyLinkModalV032()">🔗 Vincular existente</button>`:""}</div><div class="section-title"><h2>Solicitações ${req.length?`(${req.length})`:""}</h2></div><div class="list">${req.length?req.map(r=>`<div class="list-item" ${user?.role==="professor"?`onclick="familyRequestDecisionV032('${escF(r.id)}')"`:""}><div class="icon">👶</div><div><strong>${escF(r.name)}</strong><span class="small muted">${escF(r.guardianName||"")} • ${escF(r.birth||"")}</span></div><span class="pill amber">Revisar</span></div>`).join(""):`<div class="notice">Nenhuma solicitação pendente.</div>`}</div><div class="section-title"><h2>Vínculos ativos</h2></div><div class="list">${fam.length?fam.map(m=>`<div class="card"><strong>👤 ${escF(m.name||m.email||"Responsável")}</strong><div class="small muted">${escF(m.email||"")}</div>${(m.dependentStudentIds||[]).map(id=>`<div class="list-item" style="cursor:default"><div class="icon">🥋</div><div style="flex:1"><strong>${escF(name(id))}</strong></div>${user?.role==="professor"?`<button class="btn danger" onclick="unlinkFamilyV032('${escF(m.id)}','${escF(id)}')">Remover vínculo</button>`:""}</div>`).join("")}</div>`).join(""):`<div class="notice">Nenhuma família vinculada.</div>`}</div>`}

  const baseMore=window.renderMore;
  window.renderMore=async function(mode="menu"){if(mode==="family"){currentMoreMode="family";updateGlobalBack?.();const user=await me();document.getElementById("more").innerHTML=user?.role==="aluno"?await parentPage():await staffPage();return}const r=await baseMore(mode);if(mode==="menu"){const user=await me(),host=document.getElementById("more")?.querySelector(".list");if(host&&!host.querySelector("[data-family-v032]")){const item=document.createElement("div");item.className="list-item";item.dataset.familyV032="1";item.onclick=()=>renderMore("family");item.innerHTML=`<div class="icon">👨‍👩‍👧</div><div><strong>${user?.role==="aluno"?"Minha família":"Famílias e responsáveis"}</strong><span class="small muted">${user?.role==="aluno"?"Filhos, dependentes e troca de perfil.":"Vínculos familiares e responsáveis."}</span></div>`;host.prepend(item)}}return r};

  const baseStudentHome=window.renderStudentHome;
  window.renderStudentHome=async function(...a){try{await syncFamily()}catch{}const r=await baseStudentHome.apply(this,a),user=await me();if(user?.role!=="aluno")return r;const cur=await getCurrentStudent(),list=await profiles(),home=document.getElementById("home");if(home&&!home.querySelector("[data-family-home]")){const box=document.createElement("div");box.dataset.familyHome="1";box.innerHTML=`<div class="card" style="display:flex;align-items:center;gap:12px;cursor:pointer" onclick="familyProfilePickerV032()"><div style="font-size:30px">👨‍👩‍👧</div><div style="flex:1"><strong>${escF(cur?.name||"Minha família")}</strong><div class="small muted">${list.length>1?`${list.length} perfis vinculados • toque para trocar`:list.some(x=>x.isDependent)?"Perfil de dependente":"Gerenciar dependentes"}</div></div><button class="btn secondary">Trocar</button></div>`;const hero=home.querySelector(".hero");if(hero)hero.insertAdjacentElement("afterend",box);else home.prepend(box)}return r};

  const baseProfHome=window.renderProfessorHome;
  window.renderProfessorHome=async function(...a){const r=await baseProfHome.apply(this,a),user=await me();if(!["professor","admin"].includes(user?.role))return r;const home=document.getElementById("home");if(!home||home.querySelector("[data-family-staff]"))return r;const n=(await staffRequests()).filter(x=>x.status==="pending").length,box=document.createElement("div");box.dataset.familyStaff="1";box.innerHTML=`<div class="card" style="display:flex;align-items:center;gap:12px;cursor:pointer" onclick="goPage('more');renderMore('family')"><div style="font-size:30px">👨‍👩‍👧</div><div style="flex:1"><strong>Famílias e responsáveis</strong><div class="small muted">${n?`${n} solicitação(ões) aguardando`:"Nenhuma solicitação pendente"}</div></div><span class="pill ${n?"amber":"green"}">${n}</span></div>`;const hero=home.querySelector(".hero");if(hero)hero.insertAdjacentElement("afterend",box);else home.prepend(box);return r};

  setTimeout(()=>{(async()=>{const user=await me();if(user?.role==="aluno"){try{await syncFamily(true);const s=await settings(),list=await profiles();if(!user.studentId&&list[0]&&!s.familySelectedStudentId){await saveSettings({familySelectedStudentId:list[0].id});await renderAll()}}catch{}}})()},900);
})();
