const CACHE="tonicao-v0.23.0";
const ASSETS=["./","./index.html","./config.js","./styles.css","./app.js","./help.js","./db.js",
  "./sync.js",
  "./auth.js",
  "./remote-sync.js",
  "./remote-auth.js",
  "./google-auth.js",
  "./notifications-client.js","./assets/icon-192.png",
  "./assets/icon-512.png",
  "./manifest.json","./vendor/qrcode-bundle.js","./assets/logo-tonicao.jpg","./assets/exame-faixa-azul-2026.pdf","./assets/exame-faixa-roxa-2026.pdf","./assets/exame-faixa-marrom-2026.pdf","./assets/exame-faixa-preta-2026.pdf","./assets/institucional-sistema-pontuacao.jpg","./assets/institucional-etiqueta-dojo.jpg","./assets/referencia-graduacao-ibjjf.jpg","./assets/galeria-retratos-ct-01.jpg","./assets/galeria-retratos-ct-02.jpg","./assets/galeria-retrato-ct-03.jpg","./assets/identidade-lutar-e-crescer.jpg","./assets/identidade-fernando-carvalho-bjj.jpg","./assets/institucional-regras-ct.jpg"];
// v0.22: API e outros domínios NUNCA passam pelo cache; HTML/JS/CSS buscam a versão nova primeiro.
self.addEventListener("install",e=>{
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(ASSETS.map(a=>c.add(a).catch(()=>null)))));
  self.skipWaiting();
});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
  const req=e.request;
  if(req.method!=="GET")return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin)return;                 // Google, servidor externo etc.
  if(url.pathname.includes("/api/")||url.pathname.endsWith("/health"))return; // dados sempre ao vivo
  const isCode=req.mode==="navigate"||/\.(html|js|css|json)$/i.test(url.pathname);
  if(isCode){
    e.respondWith(fetch(req).then(resp=>{
      if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
      return resp;
    }).catch(()=>caches.match(req,{ignoreSearch:req.mode==="navigate"}).then(r=>r||caches.match("./index.html"))));
    return;
  }
  e.respondWith(caches.match(req).then(cached=>cached||fetch(req).then(resp=>{
    if(resp.ok){const copy=resp.clone();caches.open(CACHE).then(c=>c.put(req,copy))}
    return resp;
  })));
});
self.addEventListener("notificationclick",e=>{
  e.notification.close();
  e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(async list=>{
    if(list[0]){await list[0].focus();try{list[0].postMessage({type:"OPEN_NOTIFICATIONS"})}catch(_){};return}
    return clients.openWindow("./index.html?open=notifications")
  }))
});

self.addEventListener("push",e=>{
  let data={title:"Tonicão Team",body:"Você tem um novo aviso.",kind:"system",refId:""};
  try{if(e.data)data={...data,...e.data.json()}}catch(err){try{data.body=e.data.text()}catch(_){}}
  e.waitUntil(self.registration.showNotification(data.title,{body:data.body,tag:data.id||("tonicao-"+Date.now()),icon:"./assets/icon-192.png",badge:"./assets/icon-192.png",data:{open:"notifications",refId:data.refId||""}}))
});
