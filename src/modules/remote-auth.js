/* ===== remote-auth.js ===== */
/* v0.22 — Contas e cadastros usando Firebase Authentication + Firestore (plano gratuito).
   Mantém a mesma interface usada pelo app (TonicaoRemoteAuth). */
const TonicaoFirebase=(()=>{
  const cfg=window.TONICAO_FIREBASE||{};
  const configured=!!(window.firebase&&cfg.apiKey&&!/COLE_AQUI/.test(cfg.apiKey)&&cfg.projectId);
  let app=null,auth=null,db=null,storage=null,readyPromise=null;
  if(configured){
    try{
      app=firebase.apps.length?firebase.app():firebase.initializeApp(cfg);
      auth=firebase.auth();db=firebase.firestore();try{storage=firebase.storage()}catch(e){storage=null}
      readyPromise=new Promise(res=>{const off=auth.onAuthStateChanged(u=>{off();res(u)})});
    }catch(e){console.warn("Firebase não iniciou",e)}
  }
  function academyId(){return new URLSearchParams(location.search).get("academy")||cfg.academyId||"tonicao-sul-ilha"}
  function acad(){return db.collection("academies").doc(academyId())}
  function meta(){return {_srv:firebase.firestore.FieldValue.serverTimestamp(),_by:auth.currentUser?.uid||"public"}}
  return {
    configured:configured&&!!db,cfg,academyId,acad,meta,
    get auth(){return auth},get db(){return db},get storage(){return storage},
    ready:()=>readyPromise?readyPromise.then(()=>auth.currentUser):Promise.resolve(null)
  };
})();
window.TonicaoFirebase=TonicaoFirebase;

const TonicaoRemoteAuth=(()=>{
  const F=TonicaoFirebase;
  const ERR={
    "auth/invalid-email":"E-mail inválido.","auth/user-not-found":"E-mail ou senha incorretos.","auth/wrong-password":"E-mail ou senha incorretos.",
    "auth/invalid-credential":"E-mail ou senha incorretos.","auth/invalid-login-credentials":"E-mail ou senha incorretos.",
    "auth/email-already-in-use":"Este e-mail já tem conta.","auth/weak-password":"A senha precisa ter pelo menos 6 caracteres.",
    "auth/network-request-failed":"Sem internet.","auth/popup-closed-by-user":"Login cancelado.","auth/too-many-requests":"Muitas tentativas. Aguarde alguns minutos.",
    "permission-denied":"Sem permissão para esta ação.","unavailable":"Servidor indisponível. Verifique a internet."
  };
  function friendly(e){return new Error(ERR[e?.code]||e?.message||"Falha no servidor.")}
  function need(){if(!F.configured)throw new Error("Firebase não configurado (firebase-config.js).")}
  async function settings(){return (await DB.getOne("settings","app"))||{id:"app"}}
  async function markConnected(user){
    const s=await settings();
    s.cloudEnabled=true;s.cloudEndpoint="firebase";s.cloudSessionToken="firebase";s.remoteUser=user;
    s.academyId=F.academyId();
    await DB.put("settings",s);
  }
  function mapMember(uid,m){return {id:uid,name:m.name||m.email||"Usuário",email:m.email||"",username:m.email||uid,role:m.role||"aluno",studentId:m.studentId||"",active:m.active===true,provider:m.provider||"password",picture:m.picture||""}}
  async function memberOf(uid){const d=await F.acad().collection("members").doc(uid).get();return d.exists?mapMember(uid,d.data()):null}

  async function finishSignIn(fbUser,{provider="password"}={}){
    let m=null;
    try{m=await memberOf(fbUser.uid)}catch(e){if(e.code!=="permission-denied")throw friendly(e)}
    if(!m){
      // primeira vez: fica aguardando aprovação do Professor/Administrador
      await F.acad().collection("members").doc(fbUser.uid).set({uid:fbUser.uid,name:fbUser.displayName||fbUser.email||"",email:fbUser.email||"",picture:fbUser.photoURL||"",provider,role:"aluno",studentId:"",active:false,createdAt:new Date().toISOString(),...F.meta()});
      await F.auth.signOut();
      return {pending:true};
    }
    if(!m.active){await F.auth.signOut();return {pending:true}}
    await markConnected(m);
    return {token:"firebase",user:m};
  }

  async function login({username,password}){
    need();
    try{const c=await F.auth.signInWithEmailAndPassword(String(username).trim(),password);const r=await finishSignIn(c.user);
      if(r.pending)throw new Error("Conta aguardando liberação do Professor ou Administrador.");return r}
    catch(e){throw e.code?friendly(e):e}
  }
  async function firstSetup({name,email,password,academyName}){
    need();
    {const prob=TonicaoAuth.passwordProblem?TonicaoAuth.passwordProblem(password):"";if(prob)throw new Error(prob)}
    let cred;
    try{cred=await F.auth.createUserWithEmailAndPassword(email.trim(),password)}
    catch(e){if(e.code==="auth/email-already-in-use")cred=await F.auth.signInWithEmailAndPassword(email.trim(),password).catch(x=>{throw friendly(x)});else throw friendly(e)}
    const uid=cred.user.uid;
    try{await cred.user.updateProfile({displayName:name})}catch(e){}
    const ref=F.acad();
    try{
      await ref.set({name:academyName||"Tonicão Team Sul da Ilha",ownerUid:uid,accessStatus:"active",accessReason:"",createdAt:new Date().toISOString(),...F.meta()});
    }catch(e){
      if(e.code==="permission-denied"){await F.auth.signOut();throw new Error("Esta academia já foi configurada por outro Dono. Entre com sua conta.")}
      throw friendly(e);
    }
    await ref.collection("members").doc(uid).set({uid,name,email:email.trim(),provider:"password",role:"admin",studentId:"",active:true,createdAt:new Date().toISOString(),...F.meta()});
    const user=mapMember(uid,{name,email,role:"admin",active:true});
    await markConnected(user);
    return {token:"firebase",user};
  }
  async function googleSignIn(){
    need();
    const provider=new firebase.auth.GoogleAuthProvider();
    try{provider.setCustomParameters({prompt:"select_account"})}catch(e){} // sempre deixa escolher qual conta Google
    try{
      // janela (popup) funciona também no app instalado; o redirecionamento só entra se o popup for bloqueado
      const c=await F.auth.signInWithPopup(provider);
      return await finishSignIn(c.user,{provider:"google"});
    }catch(e){
      if(e.code==="auth/popup-blocked"){await F.auth.signInWithRedirect(provider);return {redirect:true}}
      throw friendly(e);
    }
  }
  async function googleRedirectResult(){
    if(!F.configured)return null;
    try{const c=await F.auth.getRedirectResult();if(!c?.user)return null;return await finishSignIn(c.user,{provider:"google"})}
    catch(e){throw friendly(e)}
  }
  async function sendPasswordReset(email){need();try{await F.auth.sendPasswordResetEmail(String(email).trim())}catch(e){throw friendly(e)}}
  async function me(){
    if(!F.configured)return null;
    const u=await F.ready();if(!u)return null;
    try{return await memberOf(u.uid)}catch(e){return null}
  }
  async function logout(){
    if(F.configured){try{await F.auth.signOut()}catch(e){}}
    const s=await settings();delete s.cloudSessionToken;delete s.remoteUser;await DB.put("settings",s);
  }

  // ---- Usuários (Administrador; Professor pode liberar alunos) ----
  async function listRemoteUsers(){
    need();
    try{const snap=await F.acad().collection("members").get();return {users:snap.docs.map(d=>mapMember(d.id,d.data()))}}
    catch(e){throw friendly(e)}
  }
  async function updateRemoteUser({userId,role,studentId="",active=true,name=""}){
    need();
    const patch={role,studentId:role==="aluno"?studentId:"",active:!!active,...F.meta()};
    if(name)patch.name=name;
    try{await F.acad().collection("members").doc(userId).update(patch);return {ok:true}}catch(e){throw friendly(e)}
  }
  async function approveGoogleUser({userId,role,studentId=""}){return updateRemoteUser({userId,role,studentId,active:true})}
  async function createRemoteUser({name,username,password,role,studentId=""}){
    need();
    {const prob=TonicaoAuth.passwordProblem?TonicaoAuth.passwordProblem(password):"";if(prob)throw new Error(prob)}
    // app secundário: criar a conta sem desconectar quem está logado
    const second=firebase.apps.find(a=>a.name==="criar-usuario")||firebase.initializeApp(F.cfg,"criar-usuario");
    try{
      const c=await second.auth().createUserWithEmailAndPassword(String(username).trim(),password);
      await F.acad().collection("members").doc(c.user.uid).set({uid:c.user.uid,name,email:String(username).trim(),provider:"password",role,studentId:role==="aluno"?studentId:"",active:true,createdAt:new Date().toISOString(),...F.meta()});
      await second.auth().signOut();
      return {user:{id:c.user.uid}};
    }catch(e){try{await second.auth().signOut()}catch(_){};throw friendly(e)}
  }
  async function resetRemotePassword({userId}){
    const list=(await listRemoteUsers()).users;const u=list.find(x=>x.id===userId);
    if(!u?.email)throw new Error("Usuário sem e-mail.");
    await sendPasswordReset(u.email);return {ok:true,emailSent:true};
  }
  async function remotePermissions(){
    const m=await me();if(!m)throw new Error("Entre na conta da academia.");
    const map={professor:["alunos","presenças","graduação","pontos","eventos","técnicas","regras","conteúdo","convites"],admin:["conteúdo da academia","usuários","bloqueio do sistema"],aluno:["check-in próprio","progresso da própria graduação"]};
    return {role:m.role,writeStores:map[m.role]||[]};
  }

  // ---- Convites e pré-cadastros ----
  const inv=()=>F.acad().collection("registrationInvites");
  function randomToken(){const b=crypto.getRandomValues(new Uint8Array(18));return Array.from(b,x=>x.toString(16).padStart(2,"0")).join("")}
  const docToReq=d=>{const x=d.data();delete x._srv;delete x._by;return {...x,id:d.id,inviteToken:x.inviteToken||d.id}};
  async function createRegistrationInvite({name,phone}){
    need();const token=randomToken();
    const req={name,phone,status:"invited",source:"professor_invite",inviteToken:token,createdAt:new Date().toISOString(),expiresAtMs:Date.now()+72*3600e3};
    try{await inv().doc(token).set({...req,...F.meta()});return {request:{...req,id:token}}}catch(e){throw friendly(e)}
  }
  async function getRegistrationInvite(token){
    need();
    try{
      const d=await inv().doc(token).get();if(!d.exists)return {};
      const req=docToReq(d);
      if(req.status==="invited"&&Number(req.expiresAtMs||0)>0&&Date.now()>Number(req.expiresAtMs))req.status="expired";
      return {request:req}
    }catch(e){throw friendly(e)}
  }
  const COMPLETE_FIELDS=["name","phone","email","birth","graduationTrack","belt","stripes","guardianName","guardianPhone","emergencyName","emergencyPhone","note","privacyConsentAt","guardianConsentAt"];
  async function completeRegistrationInvite(token,payload){
    need();
    try{
      const ref=inv().doc(token),snap=await ref.get();
      if(!snap.exists)throw new Error("Convite não encontrado.");
      const current=snap.data()||{};
      if(current.status!=="invited")throw new Error("Este convite já foi utilizado ou encerrado.");
      if(Number(current.expiresAtMs||0)>0&&Date.now()>Number(current.expiresAtMs))throw new Error("Este convite venceu. Peça um novo link ao Professor.");
      const patch={status:"awaiting_approval",completedAt:new Date().toISOString(),...F.meta()};
      for(const k of COMPLETE_FIELDS)patch[k]=k==="stripes"?Number(payload[k]||0):String(payload[k]??"").slice(0,300);
      await ref.update(patch);return getRegistrationInvite(token)
    }catch(e){throw e?.code?friendly(e):e}
  }
  async function submitRegistrationRequest(payload){
    need();const id=randomToken();
    const req={name:String(payload.name||"").slice(0,120),phone:String(payload.phone||"").slice(0,40),birth:String(payload.birth||"").slice(0,10),graduationTrack:payload.graduationTrack==="kids"?"kids":"adulto",guardianName:String(payload.guardianName||"").slice(0,120),guardianPhone:String(payload.guardianPhone||"").slice(0,40),note:String(payload.note||"").slice(0,300),privacyConsentAt:String(payload.privacyConsentAt||"").slice(0,40),guardianConsentAt:String(payload.guardianConsentAt||"").slice(0,40),status:"pending",source:"self",inviteToken:id,createdAt:new Date().toISOString()};
    try{await inv().doc(id).set({...req,...F.meta()});return {request:{...req,id}}}catch(e){throw friendly(e)}
  }
  async function listRegistrationRequests(){
    need();
    try{const snap=await inv().where("status","in",["invited","awaiting_approval","pending"]).get();return {requests:snap.docs.map(docToReq)}}catch(e){throw friendly(e)}
  }
  async function decideRegistrationRequest({requestId,status,studentId=""}){
    need();
    try{await inv().doc(requestId).update({status,studentId,decidedAt:new Date().toISOString(),...F.meta()});return {ok:true}}catch(e){throw friendly(e)}
  }

  // ---- Bloqueio da academia ----
  async function getAcademyAccess(){need();const d=await F.acad().get();const x=d.data()||{};return {status:x.accessStatus||"active",reason:x.accessReason||""}}
  async function setAcademyAccess({status,reason=""}){need();try{await F.acad().update({accessStatus:status,accessReason:reason,...F.meta()});return {ok:true}}catch(e){throw friendly(e)}}

  // ---- Compatibilidade (push remoto exige servidor pago; avisos chegam pela sincronização) ----
  async function googleConfig(){return {enabled:F.configured}}
  async function googleLogin(){return googleSignIn()}
  async function bootstrap(){throw new Error("Use a Primeira configuração na tela de entrada.")}
  async function listRemoteNotifications(after=0){return {notifications:[],cursor:after}}
  async function markRemoteNotificationsRead(){return {ok:true}}
  async function pushConfig(){return {enabled:false}}
  async function savePushSubscription(){return {ok:false}}
  async function removePushSubscription(){return {ok:false}}

  return {login,firstSetup,googleSignIn,googleRedirectResult,sendPasswordReset,me,logout,listRemoteUsers,approveGoogleUser,createRemoteUser,updateRemoteUser,resetRemotePassword,remotePermissions,
    createRegistrationInvite,getRegistrationInvite,completeRegistrationInvite,submitRegistrationRequest,listRegistrationRequests,decideRegistrationRequest,
    getAcademyAccess,setAcademyAccess,googleConfig,googleLogin,bootstrap,listRemoteNotifications,markRemoteNotificationsRead,pushConfig,savePushSubscription,removePushSubscription};
})();
window.TonicaoRemoteAuth=TonicaoRemoteAuth;
