/* ===== remote-sync.js ===== */
/* v0.22 — Sincronização direta com o Firestore (plano gratuito, sem servidor).
   As permissões são garantidas pelas regras do Firestore (firestore.rules).
   Tudo continua salvo primeiro no aparelho (IndexedDB). */
const TonicaoCloud=(()=>{
  const F=TonicaoFirebase;
  let syncing=false,debounceTimer=null,periodicTimer=null;

  const NEVER_PUSH=new Set(["users","auditLog","registrationRequests","settings"]);
  const SHARED=["techniques","gradingPlans","events","academyContent","academyTimeline","academyGallery","academyRules","scoreRules","referenceMaterials","timerPresets","sequenceRules","classSessions","classSchedule"];
  const STUDENT_OWN=["attendance","gradingHistory","gradingAssignments","gradingReminders","pointsLedger","paymentStatus","classBookings"];
  const PROF_WRITE=new Set(["students","classSessions","attendance","gradingHistory","gradingPlans","gradingAssignments","gradingReminders","pointsLedger","events","techniques","notifications","paymentStatus","timerPresets","sequenceRules","scoreRules","academyRules","academyContent","academyTimeline","academyGallery","referenceMaterials","classSchedule","classBookings"]);
  const ADMIN_WRITE=new Set(["academyContent","academyTimeline","academyGallery","referenceMaterials","notifications"]);
  const INDEX_FIELDS=["studentId","status","sessionId","targetStudentId","targetRole","payment","active"];
  const PUBLIC_STUDENT=["id","name","nickname","belt","stripes","points","graduationTrack","photo","active","updatedAt"];

  async function settings(){return (await DB.getOne("settings","app"))||{id:"app"}}
  async function saveSettings(patch){const s=await settings();Object.assign(s,patch);await DB.rawPut("settings",s);return s}
  const col=name=>F.acad().collection(name);
  const clone=v=>JSON.parse(JSON.stringify(v??null));

  // ---------- conversão local <-> Firestore ----------
  function toDoc(store,value){
    const v=clone(value)||{};
    const doc={id:String(v.id),json:"",...F.meta()};
    for(const k of INDEX_FIELDS)if(v[k]!==undefined&&v[k]!==null)doc[k]=v[k];
    if(store==="classSessions"){delete v.code;delete v.prevCode;delete v.nextCode}
    if(store==="gradingAssignments"){if(v.evaluation)delete v.evaluation.privateNote;doc.progress=v.progress||{}}
    doc.json=JSON.stringify(v);
    return doc;
  }
  function fromDoc(store,snap){
    const d=snap.data()||{};
    let value;
    if(d.json){try{value=JSON.parse(d.json)}catch(e){value={}}}
    else{value={...d};delete value._srv;delete value._by;delete value._deleted;delete value.json}
    if(store==="gradingAssignments"&&d.progress)value.progress=d.progress;
    if(store==="attendance"&&d.status)value.status=d.status;
    value.id=value.id||snap.id;
    const srv=d._srv?.toMillis?d._srv.toMillis():0;
    return {store,op:d._deleted?"delete":"put",recordId:snap.id,value:d._deleted?null:value,updatedAt:value?.updatedAt||"",srv};
  }
  function extraWrites(store,value,batch,deleting){
    const id=String(value.id);
    if(store==="students"){
      const pub={};for(const k of PUBLIC_STUDENT)if(value[k]!==undefined)pub[k]=value[k];
      batch.set(col("studentsPublic").doc(id),deleting?{_deleted:true,...F.meta()}:{id,json:JSON.stringify(pub),...F.meta()},{merge:deleting});
    }
    if(store==="classSessions"&&!deleting&&value.code){
      const start=Date.parse(value.createdAt)||Date.now();
      const exp=Date.parse(value.expiresAt)||start+3*3600e3;
      const closed=value.status==="closed"?(Date.parse(value.closedAt)||Date.now()):null;
      batch.set(col("sessionCodes").doc(id),{id,code:String(value.code),prevCode:String(value.prevCode||""),nextCode:String(value.nextCode||""),startMs:start,endMs:closed?Math.min(closed,exp):exp,...F.meta()});
    }
    if(store==="gradingAssignments"&&!deleting){
      batch.set(col("gradingPrivate").doc(id),{id,privateNote:value.evaluation?.privateNote||"",...F.meta()});
    }
  }

  async function applyLocal(change){
    window.__TONICAO_REMOTE_APPLY__=true;
    try{
      if(change.op==="delete")await DB.rawDelete(change.store,change.recordId);
      else await DB.rawPut(change.store,change.value);
    }finally{window.__TONICAO_REMOTE_APPLY__=false}
  }
  async function patchLocal(store,id,fn){
    const cur=await DB.getOne(store,id);if(!cur)return;
    window.__TONICAO_REMOTE_APPLY__=true;try{await DB.rawPut(store,fn({...cur}))}finally{window.__TONICAO_REMOTE_APPLY__=false}
  }

  // ---------- envio ----------
  async function push(me){
    const pending=await DB.getPendingChanges();
    const rejected=[];let pushed=0;
    for(const q of pending){
      const ackId=`${q.id}@${q.queuedAt}`;
      const allowed=me.role==="professor"?PROF_WRITE.has(q.store):me.role==="admin"?ADMIN_WRITE.has(q.store):["attendance","gradingAssignments","classBookings"].includes(q.store);
      if(NEVER_PUSH.has(q.store)||!DB.syncableStores.includes(q.store)){await DB.ackChanges([ackId]);continue}
      if(!allowed){await DB.ackChanges([ackId]);await revert(q.store,q.recordId);continue} // volta à versão oficial
      try{
        if(me.role==="aluno"){
          if(q.store==="classBookings"){
            // reserva do aluno: cria/cancela só a própria, enquanto pendente
            if(q.op==="delete")await col("classBookings").doc(q.recordId).set({_deleted:true,...F.meta()},{merge:true});
            else{const v=q.value;await col("classBookings").doc(q.recordId).set({id:q.recordId,scheduleId:v.scheduleId,date:v.date,studentId:v.studentId,status:"pending",createdAt:v.createdAt||new Date().toISOString(),...F.meta()})}
            await DB.ackChanges([ackId]);pushed++;continue;
          }
          if(q.op!=="put")throw {code:"permission-denied"};
          const v=q.value;
          if(q.store==="attendance"){
            // check-in: o Firestore confere código, horário da aula e pagamento
            await col("attendance").doc(q.recordId).set({id:q.recordId,studentId:v.studentId,sessionId:v.sessionId,date:v.date,time:v.time,source:"qr-codigo",status:"pending",checkinCode:String(v.checkinCode||""),...F.meta()});
          }else{
            await col("gradingAssignments").doc(q.recordId).update({progress:v.progress||{},...F.meta()});
          }
        }else{
          const batch=F.db.batch();
          if(q.op==="delete"){
            batch.set(col(q.store).doc(q.recordId),{_deleted:true,...F.meta()},{merge:true});
            extraWrites(q.store,{id:q.recordId},batch,true);
          }else{
            batch.set(col(q.store).doc(q.recordId),toDoc(q.store,q.value));
            extraWrites(q.store,q.value,batch,false);
          }
          await batch.commit();
        }
        await DB.ackChanges([ackId]);pushed++;
      }catch(e){
        if(e?.code==="permission-denied"||e?.code==="not-found"){
          await DB.ackChanges([ackId]);
          const reason=q.store==="attendance"?"código inválido, aula encerrada ou pagamento pendente":"sem permissão";
          rejected.push({changeId:ackId,store:q.store,recordId:q.recordId,reason});
          await revert(q.store,q.recordId);
        }else throw e; // sem internet etc.: fica na fila
      }
    }
    return {pushed,rejected};
  }
  async function revert(store,id){
    try{
      const snap=await col(store).doc(id).get();
      if(!snap.exists){await applyLocal({store,op:"delete",recordId:id});return}
      await applyLocal(fromDoc(store,snap));
    }catch(e){
      if(e?.code==="permission-denied"&&store==="attendance")await applyLocal({store,op:"delete",recordId:id});
    }
  }

  // ---------- recebimento ----------
  async function pullQuery(key,query,store,cursors,onChange){
    try{return await pullQueryIndexed(key,query,store,cursors,onChange)}
    catch(e){
      if(e?.code!=="failed-precondition")throw e;
      // índice ainda não criado no Firestore: baixa tudo desta consulta (funciona, só gasta mais leituras)
      const link=(String(e.message||"").match(/https:\/\/console\.firebase\.google\.com\S+/)||[])[0];
      if(link)try{await saveSettings({cloudIndexHint:link})}catch(_){}
      const snap=await query.limit(1000).get();let max=cursors[key]||0;
      for(const d of snap.docs){const ch=fromDoc(store,d);max=Math.max(max,ch.srv);await onChange(ch)}
      cursors[key]=max;return snap.size;
    }
  }
  async function pullQueryIndexed(key,query,store,cursors,onChange){
    const since=firebase.firestore.Timestamp.fromMillis(Math.max(0,(cursors[key]||0)-120000));
    let q=query.where("_srv",">=",since).orderBy("_srv").limit(300),last=null,max=cursors[key]||0,count=0;
    for(;;){
      const snap=await(last?q.startAfter(last):q).get();
      for(const d of snap.docs){const ch=fromDoc(store,d);max=Math.max(max,ch.srv);await onChange(ch);count++}
      if(snap.size<300)break;last=snap.docs[snap.docs.length-1];
    }
    cursors[key]=max;return count;
  }
  async function pull(me,cursors){
    let applied=0;
    const apply=async ch=>{if(await DB.applyRemoteChange(ch))applied++};
    if(me.role==="aluno"){
      const sid=me.studentId;
      for(const st of SHARED)await pullQuery(st,col(st),st,cursors,apply);
      await pullQuery("studentsPublic",col("studentsPublic"),"students",cursors,async ch=>{if(ch.recordId!==sid)await apply(ch)});
      if(sid){
        const own=await col("students").doc(sid).get();
        if(own.exists)await apply(fromDoc("students",own));
        for(const st of STUDENT_OWN)await pullQuery(st,col(st).where("studentId","==",sid),st,cursors,apply);
        await pullQuery("notif-student",col("notifications").where("targetStudentId","==",sid),"notifications",cursors,apply);
      }
      await pullQuery("notif-role",col("notifications").where("targetRole","==","aluno"),"notifications",cursors,apply);
      return applied;
    }
    const stores=DB.syncableStores.filter(s=>!NEVER_PUSH.has(s));
    for(const st of stores)await pullQuery(st,col(st),st,cursors,apply);
    await pullQuery("sessionCodes",col("sessionCodes"),"sessionCodes",cursors,async ch=>{if(ch.value?.code)await patchLocal("classSessions",ch.recordId,s=>({...s,code:ch.value.code,prevCode:ch.value.prevCode||"",nextCode:ch.value.nextCode||""}))});
    await pullQuery("gradingPrivate",col("gradingPrivate"),"gradingPrivate",cursors,async ch=>{if(ch.value)await patchLocal("gradingAssignments",ch.recordId,a=>({...a,evaluation:{...(a.evaluation||{}),privateNote:ch.value.privateNote||""}}))});
    if(me.role==="professor"){
      // inclui check-ins que ficaram pendentes em sincronizações anteriores
      const pend=(await DB.getAll("attendance")).filter(a=>a.status==="pending");
      for(const a of pend)await confirmPendingAttendance(a.id);
    }
    return applied;
  }

  // Professor confirma (uma única vez, mesmo com vários celulares) e lança os pontos
  async function confirmPendingAttendance(id){
    const ref=col("attendance").doc(id);
    let data=null;
    try{
      await F.db.runTransaction(async tx=>{
        const snap=await tx.get(ref);const d=snap.data();
        if(!d||d.status!=="pending"){data=null;return}
        data={id,studentId:d.studentId,sessionId:d.sessionId,date:d.date,time:d.time,source:d.source,status:"approved",validatedBy:"firestore"};
        tx.set(ref,{id,studentId:d.studentId,sessionId:d.sessionId,status:"approved",json:JSON.stringify(data),...F.meta()});
      });
    }catch(e){console.warn("Confirmação de presença",e);return}
    if(!data)return;
    window.__TONICAO_REMOTE_APPLY__=true;try{await DB.rawPut("attendance",data)}finally{window.__TONICAO_REMOTE_APPLY__=false}
    if(typeof window.awardAttendancePoints==="function")await window.awardAttendancePoints(data.studentId,data.sessionId);
  }

  // ---------- conta e academia ----------
  async function refreshMembership(){
    const fbUser=await F.ready();
    if(!fbUser)return null;
    const snap=await F.acad().collection("members").doc(fbUser.uid).get();
    const m=snap.exists?snap.data():null;
    if(!m||m.active!==true){try{window.dispatchEvent(new CustomEvent("tonicao:cloud-revoked"))}catch(e){};return null}
    const me={id:fbUser.uid,name:m.name||m.email||"Usuário",email:m.email||"",username:m.email||fbUser.uid,role:m.role,studentId:m.studentId||"",picture:m.picture||""};
    const local=await TonicaoAuth.currentUser();
    if(local&&local.id===me.id&&(local.role!==me.role||(local.studentId||"")!==me.studentId||local.name!==me.name))await TonicaoAuth.loginFederated(me);
    try{
      const ac=(await F.acad().get()).data()||{};
      const s=await settings();
      if(s.academyAccessStatus!==(ac.accessStatus||"active")||s.academyAccessReason!==(ac.accessReason||""))await saveSettings({academyAccessStatus:ac.accessStatus||"active",academyAccessReason:ac.accessReason||""});
      if(ac.accessStatus==="blocked"&&me.role!=="admin")return {...me,blocked:true};
    }catch(e){}
    return me;
  }

  async function getStatus(){
    const s=await settings();
    return {enabled:!!(F.configured&&s.cloudSessionToken),endpoint:"Firebase",pending:(await DB.getPendingChanges()).length,lastSync:s.cloudLastSync||"",lastError:s.cloudLastError||"",cursor:0,online:navigator.onLine,configured:F.configured};
  }
  async function saveConfig(){return getStatus()}
  async function testConnection(){if(!F.configured)throw new Error("Preencha o firebase-config.js.");await F.acad().collection("members").limit(1).get().catch(e=>{if(e.code!=="permission-denied")throw e});return {ok:true}}

  async function syncNow({silent=false}={}){
    if(syncing)return getStatus();
    const fail=msg=>{if(!silent)throw new Error(msg);return getStatus()};
    if(!F.configured)return fail("Firebase não configurado.");
    if(!navigator.onLine)return fail("Sem internet. Os dados permanecem salvos no aparelho.");
    const s=await settings();
    if(!s.cloudSessionToken)return fail("Entre com a conta da academia.");
    syncing=true;
    try{
      const me=await refreshMembership();
      if(!me)throw new Error("Conta desativada ou aguardando liberação.");
      if(me.blocked)throw new Error("Academia bloqueada pelo Administrador.");
      const {pushed,rejected}=await push(me);
      const cursors={...(s.cloudCursors||{})};
      if(s.cloudCursorsOwner!==me.id+":"+me.role+":"+me.studentId){for(const k in cursors)delete cursors[k]} // troca de conta/perfil: baixa tudo de novo
      const applied=await pull(me,cursors);
      await saveSettings({cloudCursors:cursors,cloudCursorsOwner:me.id+":"+me.role+":"+me.studentId,cloudLastSync:new Date().toISOString(),cloudLastError:rejected.length?`${rejected.length} alteração(ões) recusada(s) pelas regras do servidor.`:""});
      await DB.rawPut("syncLog",{id:"cloud-"+Date.now(),direction:"cloud",at:new Date().toISOString(),pushed,applied});
      if(rejected.length){try{window.dispatchEvent(new CustomEvent("tonicao:sync-rejected",{detail:rejected}))}catch(e){}}
      const out={...await getStatus(),pushed,applied,rejected:rejected.length};
      if(pushed||applied||rejected.length){try{window.dispatchEvent(new CustomEvent("tonicao:data-synced",{detail:out}))}catch(e){}}
      return out;
    }catch(err){
      const msg=err?.code==="permission-denied"?"Sem permissão no servidor.":(err?.message||String(err));
      await saveSettings({cloudLastError:msg});
      if(!silent)throw new Error(msg);
      return {...await getStatus(),error:msg};
    }finally{syncing=false}
  }
  function schedule(delay=1800){clearTimeout(debounceTimer);debounceTimer=setTimeout(()=>syncNow({silent:true}),delay)}
  function start(){
    if(!F.configured)return;
    window.addEventListener("online",()=>schedule(500));
    window.addEventListener("tonicao:queue-change",()=>schedule(1600));
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)schedule(800)});
    clearInterval(periodicTimer);
    periodicTimer=setInterval(()=>{if(navigator.onLine&&!document.hidden)syncNow({silent:true})},60000);
    setTimeout(()=>syncNow({silent:true}),2500);
  }
  async function uploadAll(){
    // Professor: coloca na fila todos os registros deste aparelho (migração da versão sem servidor)
    let n=0;
    for(const st of PROF_WRITE){
      if(st==="attendance"){for(const a of await DB.getAll(st))if(a.status!=="pending"){await DB.put(st,a,{preserveUpdatedAt:true});n++};continue}
      for(const v of await DB.getAll(st)){await DB.put(st,v,{preserveUpdatedAt:true});n++}
    }
    return n;
  }
  // Professor com a tela do QR aberta: recebe cada check-in em tempo real (1 leitura por aluno)
  function watchSession(sessionId,onChange){
    try{
      if(!F.configured)return null;
      const q=col("attendance").where("sessionId","==",sessionId);
      if(typeof q.onSnapshot!=="function")return null;
      return q.onSnapshot(async snap=>{
        for(const d of snap.docs){
          const ch=fromDoc("attendance",d);await DB.applyRemoteChange(ch);
          if(ch.value?.status==="pending")await confirmPendingAttendance(ch.recordId);
        }
        try{onChange&&onChange()}catch(e){}
      },err=>console.warn("watchSession",err));
    }catch(e){console.warn("watchSession",e);return null}
  }
  return {getStatus,saveConfig,testConnection,syncNow,schedule,start,confirmPendingAttendance,uploadAll,watchSession};
})();
window.TonicaoCloud=TonicaoCloud;
window.addEventListener("load",()=>TonicaoCloud.start());
