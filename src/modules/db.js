/* ===== db.js ===== */
const __TENANT_DB_SUFFIX=String(window.TONICAO_ACADEMY_ID||"tonicao-sul-ilha").replace(/[^a-z0-9_-]/g,"-");
const DB_NAME=window.TONICAO_DEMO
  ? (__TENANT_DB_SUFFIX==="tonicao-sul-ilha" ? "tonicao_demo" : "tonicao_demo_"+__TENANT_DB_SUFFIX)
  : (__TENANT_DB_SUFFIX==="tonicao-sul-ilha" ? "tonicao_app" : "tonicao_app_"+__TENANT_DB_SUFFIX); // v0.27: um IndexedDB por academia

/* v0.21 — Proteção contra injeção de HTML/JS.
   Todo texto gravado no banco passa por cleanValue():
   - campos de texto: < > removidos; aspas " ' ` trocadas por tipográficas (” ’ ´)
   - campos técnicos (id, url, token, hash, foto, data:/http...): só remove < > " ' `
   Assim nomes e observações digitados pelo aluno nunca viram código na tela do Professor. */
const TECH_KEY=/(^id$|id$|Id$|url$|Url$|URL$|token$|Token$|hash$|Hash$|salt$|Salt$|secret$|Secret$|credential$|endpoint$|Endpoint$|photo$|Photo$|picture$|src$|logo$|Logo$|image$|Image$|pdf$|Pdf$|dataUrl$|DataUrl$|username$|email$|Email$|sub$|Sub$|code$)/;
function cleanString(str,key=""){
  const v=String(str);
  if(TECH_KEY.test(key)||/^(data:|https?:|blob:)/i.test(v)) return v.replace(/[<>"'`]/g,"");
  return v.replace(/[<>]/g,"").replace(/"/g,"”").replace(/'/g,"’").replace(/`/g,"´");
}
function cleanValue(value,key=""){
  if(typeof value==="string") return cleanString(value,key);
  if(Array.isArray(value)) return value.map(v=>cleanValue(v,key));
  if(value && typeof value==="object" && Object.getPrototypeOf(value)===Object.prototype){
    const out={};
    for(const [k,v] of Object.entries(value)) out[k]=cleanValue(v,k);
    return out;
  }
  return value; // Blob, Date, números etc. ficam como estão
}
const DB_VERSION = 14; // v0.28: grade de horários e reservas

const STORE_DEFS = [
  ["students","id"], ["classSessions","id"], ["attendance","id"],
  ["gradingHistory","id"], ["gradingPlans","id"], ["gradingAssignments","id"],
  ["gradingReminders","id"], ["pointsLedger","id"], ["events","id"],
  ["techniques","id"], ["notifications","id"], ["paymentStatus","id"],
  ["documents","id"], ["settings","id"], ["academies","id"], ["devices","id"],
  ["invites","id"], ["syncLog","id"], ["academyContent","id"], ["timerPresets","id"],
  ["sequenceRules","id"], ["syncQueue","id"], ["syncMeta","id"], ["users","id"], ["authSession","id"], ["auditLog","id"], ["academyTimeline","id"], ["academyGallery","id"], ["reportPresets","id"], ["remoteAuth","id"], ["registrationRequests","id"], ["academyRules","id"], ["scoreRules","id"], ["referenceMaterials","id"], ["classSchedule","id"], ["classBookings","id"]
];

const SYNCABLE_STORES = new Set([
  "students","classSessions","attendance","gradingHistory","gradingPlans",
  "gradingAssignments","gradingReminders","pointsLedger","events","techniques",
  "notifications","paymentStatus","academyContent","timerPresets","sequenceRules","users","auditLog","academyTimeline","academyGallery","registrationRequests","academyRules","scoreRules","referenceMaterials","classSchedule","classBookings"
]);

let __dbPromise=null;
function openDB(){
  if(__dbPromise) return __dbPromise;
  __dbPromise=new Promise((resolve,reject)=>{
    const req=indexedDB.open(DB_NAME,DB_VERSION);
    req.onupgradeneeded=()=>{
      const db=req.result;
      STORE_DEFS.forEach(([name,keyPath])=>{
        if(!db.objectStoreNames.contains(name)) db.createObjectStore(name,{keyPath});
      });
    };
    req.onsuccess=()=>{const db=req.result;db.onversionchange=()=>{db.close();__dbPromise=null};resolve(db)};
    req.onerror=()=>{__dbPromise=null;reject(req.error)};
  });
  return __dbPromise;
}

async function rawPut(storeName,value){
  value=cleanValue(value);
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,"readwrite");
    tx.objectStore(storeName).put(value);
    tx.oncomplete=()=>resolve(value);
    tx.onerror=()=>reject(tx.error);
  });
}

async function rawDelete(storeName,id){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,"readwrite");
    tx.objectStore(storeName).delete(id);
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
}

async function getAll(storeName){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,"readonly");
    const req=tx.objectStore(storeName).getAll();
    req.onsuccess=()=>resolve(req.result||[]);
    req.onerror=()=>reject(req.error);
  });
}

async function getOne(storeName,id){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,"readonly");
    const req=tx.objectStore(storeName).get(id);
    req.onsuccess=()=>resolve(req.result||null);
    req.onerror=()=>reject(req.error);
  });
}

function changeId(){
  return globalThis.crypto?.randomUUID ? crypto.randomUUID() :
    "chg-"+Date.now()+"-"+Math.random().toString(36).slice(2,10);
}

async function queueChange(storeName,op,recordId,value,updatedAt){
  if(!SYNCABLE_STORES.has(storeName) || window.__TONICAO_REMOTE_APPLY__) return;
  // id determinístico: a alteração mais recente do mesmo registro substitui a anterior
  const item={
    id:`q:${storeName}:${String(recordId)}`,
    store:storeName,
    op,
    recordId:String(recordId),
    value:op==="put"?value:null,
    updatedAt:updatedAt||new Date().toISOString(),
    queuedAt:new Date().toISOString()
  };
  await rawPut("syncQueue",item);
  try{window.dispatchEvent(new CustomEvent("tonicao:queue-change",{detail:item}))}catch(e){}
}

async function put(storeName,value,opts={}){
  const copy=(value && typeof value==="object") ? {...value} : value;
  if(copy && typeof copy==="object" && !window.__TONICAO_REMOTE_APPLY__ && !(opts.preserveUpdatedAt && copy.updatedAt)){
    copy.updatedAt=new Date().toISOString();
  }
  const saved=await rawPut(storeName,copy);
  if(saved?.id!==undefined && saved?.id!==null){
    await queueChange(storeName,"put",saved.id,saved,saved.updatedAt);
  }
  return saved;
}

async function removeOne(storeName,id){
  await rawDelete(storeName,id);
  await queueChange(storeName,"delete",id,null,new Date().toISOString());
}

async function clearStore(storeName){
  const db=await openDB();
  return new Promise((resolve,reject)=>{
    const tx=db.transaction(storeName,"readwrite");
    tx.objectStore(storeName).clear();
    tx.oncomplete=()=>resolve();
    tx.onerror=()=>reject(tx.error);
  });
}

async function bulkPut(storeName,values){
  for(const value of values||[]) await put(storeName,value);
}

async function getPendingChanges(){
  return (await getAll("syncQueue")).sort((a,b)=>String(a.queuedAt).localeCompare(String(b.queuedAt)));
}

async function ackChanges(ids){
  // ids no formato "q:store:registro@queuedAt": só apaga se não houve alteração nova depois do envio
  for(const raw of ids||[]){
    const str=String(raw), at=str.lastIndexOf("@");
    if(at<0){await rawDelete("syncQueue",str);continue}
    const id=str.slice(0,at), queuedAt=str.slice(at+1);
    const cur=await getOne("syncQueue",id);
    if(cur && cur.queuedAt===queuedAt) await rawDelete("syncQueue",id);
  }
}

async function applyRemoteChange(change){
  if(!change?.store || !SYNCABLE_STORES.has(change.store) || !change.recordId) return false;
  const local=await getOne(change.store,change.recordId);
  const remoteUpdated=change.updatedAt || change.value?.updatedAt || "";
  const localUpdated=local?.updatedAt || "";
  if(local && localUpdated && remoteUpdated && localUpdated > remoteUpdated) return false;

  window.__TONICAO_REMOTE_APPLY__=true;
  try{
    if(change.op==="delete"){
      await rawDelete(change.store,change.recordId);
    }else if(change.op==="put" && change.value){
      const value={...change.value};
      if(remoteUpdated && !value.updatedAt) value.updatedAt=remoteUpdated;
      await rawPut(change.store,value);
    }
  } finally {
    window.__TONICAO_REMOTE_APPLY__=false;
  }
  return true;
}

async function sanitizeAllStores(){
  // Limpa dados antigos uma única vez (sem gerar fila de sincronização)
  for(const [name] of STORE_DEFS){
    if(["syncQueue","authSession","documents"].includes(name)) continue;
    let rows=[];try{rows=await getAll(name)}catch(e){continue}
    for(const r of rows){
      const c=cleanValue(r);
      if(JSON.stringify(c)!==JSON.stringify(r)) await rawPut(name,c);
    }
  }
}

window.DB={
  put,getAll,getOne,removeOne,clearStore,bulkPut,dumpStore:getAll,rawPut,rawDelete,
  getPendingChanges,ackChanges,applyRemoteChange,clean:cleanValue,sanitizeAllStores,
  syncableStores:[...SYNCABLE_STORES]
};
