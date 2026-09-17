const TonicaoCloud=(()=>{
  let syncing=false, debounceTimer=null, periodicTimer=null;

  async function settings(){
    return (await DB.getOne("settings","app"))||{id:"app"};
  }
  function endpoint(url){
    const u=String(url||"").trim().replace(/\/+$/,"");
    if(!u)return "";
    return /\/api\/sync$/i.test(u)?u:u+"/api/sync";
  }
  async function getStatus(){
    const s=await settings();
    return {
      enabled:!!s.cloudEnabled,
      endpoint:s.cloudEndpoint||"",
      pending:(await DB.getPendingChanges()).length,
      lastSync:s.cloudLastSync||"",
      lastError:s.cloudLastError||"",
      cursor:Number(s.cloudCursor||0),
      online:navigator.onLine
    };
  }
  async function saveConfig(cfg){
    const s=await settings();
    s.cloudEnabled=!!cfg.enabled;
    s.cloudEndpoint=String(cfg.endpoint||"").trim();
    if(cfg.token!==undefined)s.cloudToken=String(cfg.token||"").trim();
    await DB.put("settings",s);
    schedule(300);
    return getStatus();
  }
  async function testConnection(customEndpoint,customToken){
    const s=await settings();
    const syncUrl=endpoint(customEndpoint??s.cloudEndpoint);
    if(!syncUrl)throw new Error("Informe o endereço do servidor.");
    const health=syncUrl.replace(/\/api\/sync$/i,"/health");
    const headers={};
    const token=customToken??s.cloudToken;
    if(token)headers.Authorization=`Bearer ${token}`;
    const res=await fetch(health,{headers,cache:"no-store"});
    if(!res.ok)throw new Error(`Servidor respondeu ${res.status}.`);
    return await res.json();
  }
  async function syncNow({silent=false}={}){
    if(syncing)return getStatus();
    const s=await settings();
    if(!s.cloudEnabled){
      if(!silent)throw new Error("Sincronização automática está desativada.");
      return getStatus();
    }
    if(!navigator.onLine){
      if(!silent)throw new Error("Sem internet. Os dados permanecem salvos no aparelho.");
      return getStatus();
    }
    const url=endpoint(s.cloudEndpoint);
    if(!url){
      if(!silent)throw new Error("Configure o servidor de sincronização.");
      return getStatus();
    }

    syncing=true;
    try{
      const pending=await DB.getPendingChanges();
      if(!s.deviceId){
        s.deviceId="device-"+Date.now()+"-"+Math.random().toString(36).slice(2,8);
        await DB.put("settings",s);
      }
      const payload={
        protocol:1,
        academyId:s.academyId||"tonicao-sul-ilha",
        deviceId:s.deviceId,
        cursor:Number(s.cloudCursor||0),
        changes:pending.map(q=>({
          changeId:`${q.id}@${q.queuedAt}`,store:q.store,op:q.op,recordId:q.recordId,
          value:q.value,updatedAt:q.updatedAt
        }))
      };
      const headers={"Content-Type":"application/json"};
      if(s.cloudSessionToken)headers.Authorization=`Bearer ${s.cloudSessionToken}`;else if(s.cloudToken)headers.Authorization=`Bearer ${s.cloudToken}`;
      const res=await fetch(url,{
        method:"POST",headers,body:JSON.stringify(payload),cache:"no-store"
      });
      if(!res.ok){
        let msg="";
        try{msg=(await res.json()).error||""}catch(e){}
        throw new Error(msg||`Falha no servidor (${res.status}).`);
      }
      const data=await res.json();
      let applied=0;
      for(const ch of data.changes||[]){
        if(await DB.applyRemoteChange(ch))applied++;
      }
      await DB.ackChanges(data.acceptedIds||[]);
      // v0.21: alterações recusadas saem da fila e a cópia local volta à versão oficial do servidor
      const rejected=Array.isArray(data.rejected)?data.rejected:[];
      for(const r of rejected){
        const id=typeof r==="string"?r:r?.changeId;
        if(id)await DB.ackChanges([id]);
        if(r&&typeof r==="object"&&r.server&&r.store&&r.recordId&&DB.syncableStores.includes(r.store)){
          window.__TONICAO_REMOTE_APPLY__=true;
          try{
            if(r.server.value)await DB.rawPut(r.store,r.server.value);
            else await DB.rawDelete(r.store,r.recordId);
          }finally{window.__TONICAO_REMOTE_APPLY__=false}
        }
      }
      if(rejected.length){try{window.dispatchEvent(new CustomEvent("tonicao:sync-rejected",{detail:rejected}))}catch(e){}}

      const latest=await settings();
      latest.cloudCursor=Number(data.cursor||latest.cloudCursor||0);
      latest.cloudLastSync=new Date().toISOString();
      latest.cloudLastError=rejected.length?`${rejected.length} alteração(ões) recusada(s) pelo servidor.`:"";
      await DB.put("settings",latest);
      await DB.put("syncLog",{
        id:"cloud-"+Date.now(),direction:"cloud",at:latest.cloudLastSync,
        pushed:pending.length,pulled:(data.changes||[]).length,applied
      });
      const out={...await getStatus(),pushed:pending.length,pulled:(data.changes||[]).length,applied,rejected:rejected.length};
      try{window.dispatchEvent(new CustomEvent("tonicao:data-synced",{detail:out}))}catch(e){}
      return out;
    }catch(err){
      const latest=await settings();
      latest.cloudLastError=err.message||String(err);
      await DB.put("settings",latest);
      if(!silent)throw err;
      return {...await getStatus(),error:latest.cloudLastError};
    }finally{
      syncing=false;
    }
  }
  function schedule(delay=1800){
    clearTimeout(debounceTimer);
    debounceTimer=setTimeout(()=>syncNow({silent:true}),delay);
  }
  function start(){
    window.addEventListener("online",()=>schedule(500));
    window.addEventListener("tonicao:queue-change",()=>schedule(1600));
    clearInterval(periodicTimer);
    periodicTimer=setInterval(async()=>{
      const s=await settings();
      if(s.cloudEnabled&&navigator.onLine&&!document.hidden)syncNow({silent:true});
    },60000);
    setTimeout(()=>syncNow({silent:true}),2500);
  }
  return {getStatus,saveConfig,testConnection,syncNow,schedule,start};
})();
window.TonicaoCloud=TonicaoCloud;
window.addEventListener("load",()=>TonicaoCloud.start());
