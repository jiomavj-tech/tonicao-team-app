const TONICAO_STORES = [
  "students","classSessions","attendance","gradingHistory","gradingPlans",
  "gradingAssignments","gradingReminders","pointsLedger","events","techniques",
  "notifications","paymentStatus","documents","settings","academies","devices",
  "invites","syncLog","academyContent","timerPresets","sequenceRules","syncMeta",
  "users","auditLog","academyTimeline","academyGallery","reportPresets","registrationRequests","academyRules","scoreRules","referenceMaterials"
];

const STUDENT_OWN_STORES = new Set(["attendance","gradingHistory","gradingAssignments","gradingReminders","pointsLedger","paymentStatus"]);
const STUDENT_SHARED_STORES = new Set(["academies","techniques","gradingPlans","events","documents","academyContent","timerPresets","sequenceRules","academyTimeline","academyGallery","academyRules","scoreRules","referenceMaterials"]);
const CONNECTION_KEYS = ["cloudEnabled","cloudEndpoint","cloudToken","cloudSessionToken","cloudCursor","cloudLastSync","cloudLastError","deviceId","remotePushSubscribed","remotePushEndpoint","remoteNotificationCursor"];

function b64EncodeUnicode(str){
  const bytes = new TextEncoder().encode(str);let binary="";bytes.forEach(b=>binary+=String.fromCharCode(b));return btoa(binary)
}
function b64DecodeUnicode(str){
  const binary=atob(str),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return new TextDecoder().decode(bytes)
}
function downloadBlob(filename,blob){
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=filename;document.body.appendChild(a);a.click();
  setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},500)
}
async function blobToDataUrl(blob){return await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(blob)})}
function dataUrlToBlob(dataUrl){
  const [meta,b64]=String(dataUrl).split(","),mime=(meta.match(/data:([^;]+)/)||[])[1]||"application/octet-stream",binary=atob(b64||""),arr=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)arr[i]=binary.charCodeAt(i);return new Blob([arr],{type:mime})
}
async function serializeValues(store,values){
  if(store!=="documents")return values;const out=[];
  for(const v of values||[]){const copy={...v};if(copy.blob instanceof Blob){copy.blobDataUrl=await blobToDataUrl(copy.blob);delete copy.blob}out.push(copy)}return out
}
async function deserializeValues(store,values){
  if(store!=="documents")return values;
  return (values||[]).map(v=>{const copy={...v};if(copy.blobDataUrl){copy.blob=dataUrlToBlob(copy.blobDataUrl);delete copy.blobDataUrl}return copy})
}
function stripServerSecrets(value){
  if(Array.isArray(value))return value.map(stripServerSecrets);
  if(!value||typeof value!=="object")return value;
  const out={};
  for(const [k,v] of Object.entries(value)){
    if(/^(cloudToken|cloudSessionToken|token|accessToken|refreshToken|idToken|credential|secret)$/i.test(k))continue;
    out[k]=stripServerSecrets(v)
  }
  return out
}
function studentSettings(settings,studentId){
  const allowed=["id","academy","unit","academyId","academyName","unitName","accent","logoDataUrl","publicAppUrl","officialScoreVersion"];
  const out={};for(const k of allowed)if(settings&&settings[k]!==undefined)out[k]=settings[k];
  out.id="app";out.role="aluno";out.linkedStudentId=studentId;return out
}
function studentNotificationVisible(n,studentId){
  if(!n)return false;if(n.targetStudentId)return n.targetStudentId===studentId;if(n.targetUserId)return false;if(n.targetRole)return n.targetRole==="aluno";return true
}

async function exportDatabasePackage(scope="full",studentId=null){
  const payload={format:"tonicao-sync",version:2,generatedAt:new Date().toISOString(),scope,studentId:studentId||null,data:{}};
  for(const store of TONICAO_STORES){
    let values=[];try{values=await DB.getAll(store)}catch(e){values=[]}
    if(scope==="student"&&studentId){
      if(store==="students")values=values.filter(x=>x.id===studentId);
      else if(STUDENT_OWN_STORES.has(store))values=values.filter(x=>x.studentId===studentId);
      else if(store==="notifications")values=values.filter(x=>studentNotificationVisible(x,studentId));
      else if(store==="settings")values=values.map(v=>studentSettings(v,studentId));
      else if(STUDENT_SHARED_STORES.has(store)){
        // Conteúdo institucional/técnico compartilhado com o aluno.
      }else values=[]; // sem usuários, auditoria, pré-cadastros, convites, dispositivos ou sessões de terceiros
    }else if(store==="settings"){
      values=values.map(stripServerSecrets); // backup completo nunca exporta token de servidor
    }
    payload.data[store]=await serializeValues(store,values)
  }
  return payload
}
async function downloadBackup(){
  const payload=await exportDatabasePackage("full"),date=new Date().toISOString().slice(0,10);
  downloadBlob(`tonicao-backup-${date}.json`,new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}))
}
async function downloadStudentSync(studentId){
  const payload=await exportDatabasePackage("student",studentId),st=(payload.data.students||[])[0],safe=(st?.name||"aluno").replace(/[^\w\-]+/g,"-").toLowerCase();
  downloadBlob(`tonicao-sync-${safe}.json`,new Blob([JSON.stringify(payload,null,2)],{type:"application/json"}))
}
async function importDatabasePackage(file,mode="merge"){
  const txt=await file.text(),payload=JSON.parse(txt);if(payload.format!=="tonicao-sync")throw new Error("Arquivo não reconhecido.");
  const currentSettings=(await DB.getOne("settings","app"))||{id:"app"},connection={};
  for(const k of CONNECTION_KEYS)if(currentSettings[k]!==undefined)connection[k]=currentSettings[k];
  if(mode==="replace")for(const store of TONICAO_STORES){try{await DB.clearStore(store)}catch(e){}}
  for(const [store,values] of Object.entries(payload.data||{})){
    if(!TONICAO_STORES.includes(store))continue;const restored=await deserializeValues(store,values||[]);
    for(const value of restored)await DB.put(store,value,{preserveUpdatedAt:true}); // mantém a data original para não vencer dado mais novo do servidor
  }
  const importedSettings=(await DB.getOne("settings","app"))||{id:"app"};Object.assign(importedSettings,connection);await DB.put("settings",importedSettings,{preserveUpdatedAt:true});
  await DB.put("syncLog",{id:"sync-"+Date.now(),direction:"import",scope:payload.scope||"unknown",at:new Date().toISOString(),count:Object.values(payload.data||{}).reduce((a,v)=>a+(v?.length||0),0)});
  return payload
}
async function buildInviteToken(student,settings){
  const academy={academyName:settings.academyName||settings.academy||"Tonicão Team",unitName:settings.unitName||settings.unit||"Sul da Ilha",academyId:settings.academyId||"tonicao-sul-ilha"};
  const secret=crypto.getRandomValues(new Uint32Array(2)).join("");
  const body={v:1,type:"student-invite",createdAt:new Date().toISOString(),secret,academy,student:{id:student.id,name:student.name,nickname:student.nickname||student.name.split(" ")[0],birth:student.birth||"",belt:student.belt||"Branca",stripes:student.stripes||0,classesInBelt:student.classesInBelt||0,targetClasses:student.targetClasses||120,points:student.points||0,rank:student.rank||null}};
  const token="TONICAO1."+b64EncodeUnicode(JSON.stringify(body));
  await DB.put("invites",{id:"inv-"+student.id,studentId:student.id,secret,token,createdAt:body.createdAt,status:"active"});return token
}
function decodeInviteToken(token){
  const t=String(token||"").trim();if(!t.startsWith("TONICAO1."))throw new Error("Convite inválido.");
  const body=JSON.parse(b64DecodeUnicode(t.slice("TONICAO1.".length)));if(body.type!=="student-invite"||!body.student?.id)throw new Error("Convite inválido.");return body
}
async function acceptInviteToken(token){
  const body=decodeInviteToken(token),old=await DB.getOne("students",body.student.id),merged={...(old||{}),...body.student,active:true,payment:old?.payment||"liberado",dueDay:old?.dueDay||10,streak:old?.streak||0};
  await DB.put("students",merged);const settings=(await DB.getOne("settings","app"))||{id:"app"};settings.role="aluno";settings.linkedStudentId=body.student.id;settings.academyId=body.academy.academyId;settings.academyName=body.academy.academyName;settings.unitName=body.academy.unitName;settings.linkedAt=new Date().toISOString();await DB.put("settings",settings);await DB.put("devices",{id:"device-local",role:"aluno",studentId:body.student.id,academyId:body.academy.academyId,linkedAt:settings.linkedAt});return body
}

window.TonicaoSync={exportDatabasePackage,downloadBackup,downloadStudentSync,importDatabasePackage,buildInviteToken,decodeInviteToken,acceptInviteToken};
