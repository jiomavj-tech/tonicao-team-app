const TonicaoNotifications=(()=>{
  let interval=null,syncing=false;
  async function settings(){return (await DB.getOne("settings","app"))||{id:"app"}}
  function b64urlToUint8Array(value){
    const padding="=".repeat((4-value.length%4)%4),base64=(value+padding).replace(/-/g,"+").replace(/_/g,"/");
    const raw=atob(base64);return Uint8Array.from([...raw].map(c=>c.charCodeAt(0)));
  }
  async function notifyDevice(n){
    if(!("Notification" in window)||Notification.permission!=="granted")return false;
    const options={body:n.body||"",tag:n.remoteId||n.id||("tonicao-"+Date.now()),data:{open:"notifications",refId:n.refId||""},icon:"./assets/icon-192.png",badge:"./assets/icon-192.png"};
    const reg=await navigator.serviceWorker?.ready.catch(()=>null);
    if(reg){await reg.showNotification(n.title||"Tonicão Team",options);return true}
    try{new Notification(n.title||"Tonicão Team",options);return true}catch(e){return false}
  }
  async function subscribeRemote(){
    const s=await settings();
    if(!s.cloudSessionToken||!s.cloudEndpoint||location.protocol==="file:")return false;
    if(!("serviceWorker" in navigator)||!("PushManager" in window))return false;
    const cfg=await TonicaoRemoteAuth.pushConfig();
    if(!cfg?.enabled||!cfg.publicKey)return false;
    const reg=await navigator.serviceWorker.ready;
    let sub=await reg.pushManager.getSubscription();
    if(!sub)sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:b64urlToUint8Array(cfg.publicKey)});
    await TonicaoRemoteAuth.savePushSubscription(sub.toJSON());
    s.remotePushSubscribed=true;s.remotePushEndpoint=sub.endpoint;await DB.put("settings",s);return true
  }
  async function enable(){
    if(!("Notification" in window))throw new Error("Notificações não são suportadas neste aparelho.");
    const permission=await Notification.requestPermission();let remotePush=false;
    if(permission==="granted"){try{remotePush=await subscribeRemote()}catch(e){remotePush=false};await syncInbox({showDevice:true})}
    return {permission,remotePush}
  }
  async function status(){
    const s=await settings();return {permission:("Notification" in window)?Notification.permission:"unsupported",remotePush:!!s.remotePushSubscribed}
  }
  async function syncInbox({showDevice=true}={}){
    if(syncing)return {count:0};
    const s=await settings();if(!navigator.onLine||!s.cloudSessionToken||!s.cloudEndpoint)return {count:0};
    syncing=true;
    try{
      const r=await TonicaoRemoteAuth.listRemoteNotifications(Number(s.remoteNotificationCursor||0));let count=0;
      for(const x of r.notifications||[]){
        const id="remote-"+x.id;if(await DB.getOne("notifications",id))continue;
        const n={id,remoteId:x.id,kind:x.kind||"system",title:x.title||"Aviso",body:x.body||"",targetRole:x.targetRole||"",targetStudentId:x.targetStudentId||"",targetUserId:x.targetUserId||"",refId:x.refId||"",createdAt:x.createdAtISO||new Date((x.createdAt||Date.now()/1000)*1000).toISOString(),date:(x.createdAtISO||new Date().toISOString()).slice(0,10),read:!!x.read};
        await DB.rawPut("notifications",n);count++;if(showDevice&&!n.read)await notifyDevice(n)
      }
      s.remoteNotificationCursor=Math.max(Number(s.remoteNotificationCursor||0),Number(r.cursor||0));await DB.put("settings",s);
      return {count,cursor:s.remoteNotificationCursor}
    }finally{syncing=false}
  }
  function start(){
    window.addEventListener("online",()=>setTimeout(()=>syncInbox({showDevice:true}),800));
    window.addEventListener("tonicao:data-synced",()=>syncInbox({showDevice:true}));
    document.addEventListener("visibilitychange",()=>{if(!document.hidden)syncInbox({showDevice:true})});
    clearInterval(interval);interval=setInterval(()=>{if(!document.hidden)syncInbox({showDevice:true})},45000);
    setTimeout(()=>syncInbox({showDevice:true}),3500)
  }
  return {enable,status,notifyDevice,syncInbox,subscribeRemote,start};
})();
window.TonicaoNotifications=TonicaoNotifications;
window.addEventListener("load",()=>TonicaoNotifications.start());