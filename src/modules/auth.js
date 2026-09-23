/* ===== auth.js ===== */
const TonicaoAuth=(()=>{
  const ROLE_LABEL={admin:"Administrador/Dono",professor:"Professor",aluno:"Aluno"};
  const ACADEMIC_PERMS=new Set(["manage_students","attendance","manage_graduation","manage_points","manage_events","manage_techniques","payments","approve_students"]);
  const PERMS={
    admin:new Set([
      "view_dashboard","view_all_academic","view_ranking","view_history","timer","notifications",
      "manage_users","manage_system","manage_subscription","manage_branding","view_audit","sync","backup"
    ]),
    professor:new Set([
      "view_dashboard","manage_students","attendance","manage_graduation","manage_points",
      "manage_events","manage_techniques","view_ranking","view_history","timer","notifications",
      "payments","approve_students","sync","backup"
    ]),
    aluno:new Set([
      "view_dashboard","attendance_self","view_own_profile","view_own_graduation",
      "view_ranking","view_history","timer","view_own_points","notifications"
    ])
  };

  function uid(prefix="usr"){
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  }
  function bytesToB64(bytes){
    let s=""; for(const b of bytes)s+=String.fromCharCode(b); return btoa(s);
  }
  function b64ToBytes(s){
    const bin=atob(s); return Uint8Array.from(bin,c=>c.charCodeAt(0));
  }
  async function deriveHash(password,saltB64,iterations=180000){
    const enc=new TextEncoder();
    const material=await crypto.subtle.importKey("raw",enc.encode(password),"PBKDF2",false,["deriveBits"]);
    const bits=await crypto.subtle.deriveBits({
      name:"PBKDF2",hash:"SHA-256",salt:b64ToBytes(saltB64),iterations
    },material,256);
    return bytesToB64(new Uint8Array(bits));
  }
  // v0.23: mínimo 9 caracteres com maiúscula, minúscula, número e símbolo, em qualquer ordem.
  function passwordProblem(password){
    const p=String(password||"");
    if(p.length<9) return "A senha precisa ter pelo menos 9 caracteres.";
    if(!/[A-Z]/.test(p)) return "A senha precisa ter pelo menos uma letra MAIÚSCULA.";
    if(!/[a-z]/.test(p)) return "A senha precisa ter pelo menos uma letra minúscula.";
    if(!/[0-9]/.test(p)) return "A senha precisa ter pelo menos um número.";
    if(!/[^A-Za-z0-9]/.test(p)) return "A senha precisa ter pelo menos um símbolo, como . ! @ # ou *";
    return "";
  }
  async function makePassword(password){
    const problem=passwordProblem(password);
    if(problem) throw new Error(problem);
    const salt=crypto.getRandomValues(new Uint8Array(16));
    const saltB64=bytesToB64(salt);
    return {salt:saltB64,hash:await deriveHash(password,saltB64),iterations:180000};
  }
  async function verifyPassword(user,password){
    const hash=await deriveHash(password,user.passwordSalt,user.passwordIterations||180000);
    return hash===user.passwordHash;
  }
  async function allUsers(){
    return await DB.getAll("users");
  }
  async function users(){
    return (await allUsers()).filter(u=>u.active!==false);
  }
  async function hasAnyUser(){
    return (await users()).length>0;
  }
  async function hasOwner(){
    return (await users()).some(u=>u.role==="admin");
  }
  async function bootstrapAdmin({name,username,password}){
    if(await hasOwner()) throw new Error("O Administrador/Dono já foi configurado.");
    const pw=await makePassword(password);
    const user={
      id:uid("usr"),name:name.trim(),username:username.trim().toLowerCase().replace(/[<>"'`]/g,""),role:"admin",isOwner:true,
      active:true,passwordSalt:pw.salt,passwordHash:pw.hash,passwordIterations:pw.iterations,
      createdAt:new Date().toISOString()
    };
    await DB.put("users",user);
    await setSession(user);
    await audit("auth.bootstrap","Configuração inicial do administrador",null,{userId:user.id});
    return user;
  }
  async function createUser({name,username,password,role,studentId=""}){
    const current=await currentUser();
    if(!current || !["admin","professor"].includes(current.role)) throw new Error("Sem permissão para criar usuários.");
    if(current.role==="professor" && role!=="aluno") throw new Error("Professor pode criar apenas conta de Aluno.");
    const list=await allUsers();
    const normalized=username.trim().toLowerCase().replace(/[<>"'`]/g,"");
    if(list.some(u=>u.username===normalized)) throw new Error("Este usuário já existe, mesmo que esteja desativado.");
    if(!["admin","professor","aluno"].includes(role)) throw new Error("Perfil inválido.");
    if(role==="admin" && current.role!=="admin") throw new Error("Somente o Administrador/Dono pode criar outro Administrador.");
    if(role==="aluno"&&!studentId) throw new Error("Aluno precisa estar vinculado a uma ficha.");
    const pw=await makePassword(password);
    const user={
      id:uid("usr"),name:name.trim(),username:normalized,role,studentId:role==="aluno"?studentId||"": "",
      active:true,passwordSalt:pw.salt,passwordHash:pw.hash,passwordIterations:pw.iterations,
      createdAt:new Date().toISOString(),createdBy:current.id
    };
    await DB.put("users",user);
    await audit("user.create",`Usuário ${user.username} criado`,studentId||null,{role:user.role,userId:user.id});
    return user;
  }
  async function changePassword(userId,newPassword){
    const current=await currentUser();
    if(!current || (current.role!=="admin" && current.id!==userId)) throw new Error("Sem permissão.");
    const u=await DB.getOne("users",userId); if(!u)throw new Error("Usuário não encontrado.");
    const pw=await makePassword(newPassword);
    u.passwordSalt=pw.salt;u.passwordHash=pw.hash;u.passwordIterations=pw.iterations;
    await DB.put("users",u);
    await audit("user.password","Senha alterada",u.studentId||null,{userId:u.id});
  }
  async function setActive(userId,active){
    const current=await currentUser();
    if(!current || current.role!=="admin") throw new Error("Somente o Administrador/Dono.");
    if(current.id===userId && !active) throw new Error("Você não pode desativar sua própria conta.");
    const u=await DB.getOne("users",userId);if(!u)throw new Error("Usuário não encontrado.");
    if(u.role==="admin"&&!active){
      const admins=(await allUsers()).filter(x=>x.role==="admin"&&x.active!==false);
      if(admins.length<=1)throw new Error("A academia precisa manter pelo menos um Administrador/Dono ativo.");
    }
    u.active=!!active;await DB.put("users",u);
    await audit("user.status",`${active?"Ativou":"Desativou"} usuário ${u.username}`,u.studentId||null,{userId:u.id});
  }

  async function loginFederated(remoteUser){
    if(!remoteUser?.id)throw new Error("Usuário remoto inválido.");
    let local=await DB.getOne("users",remoteUser.id);
    const role=["admin","professor","aluno"].includes(remoteUser.role)?remoteUser.role:"aluno";
    local={
      ...(local||{}),
      id:remoteUser.id,
      name:remoteUser.name||remoteUser.email||"Usuário Google",
      username:remoteUser.username||remoteUser.email||remoteUser.id,
      email:remoteUser.email||"",
      role,
      studentId:remoteUser.studentId||"",
      provider:remoteUser.provider||"remote",
      googleSub:remoteUser.googleSub||"",
      pictureUrl:remoteUser.picture||"",
      active:true,
      createdAt:local?.createdAt||new Date().toISOString()
    };
    await DB.put("users",local);
    await setSession(local);
    await audit("auth.federated","Login remoto realizado",local.studentId||null,{userId:local.id,email:local.email,provider:local.provider});
    return local;
  }

  async function login(username,password){
    const normalized=String(username||"").trim().toLowerCase().replace(/[<>"'`]/g,"");
    const list=await users();
    const user=list.find(u=>u.username===normalized);
    if(!user || !(await verifyPassword(user,password))) throw new Error("Usuário ou senha incorretos.");
    await setSession(user);
    await audit("auth.login","Login realizado",user.studentId||null,{userId:user.id});
    return user;
  }
  async function setSession(user){
    await DB.rawPut?.("authSession",{id:"current",userId:user.id,createdAt:new Date().toISOString()});
    if(!DB.rawPut){
      window.__TONICAO_REMOTE_APPLY__=true;
      try{
        const db=await openDB();
        await new Promise((resolve,reject)=>{
          const tx=db.transaction("authSession","readwrite");
          tx.objectStore("authSession").put({id:"current",userId:user.id,createdAt:new Date().toISOString()});
          tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
        });
      } finally {window.__TONICAO_REMOTE_APPLY__=false;}
    }
    const s=(await DB.getOne("settings","app"))||{id:"app"};
    s.role=user.role==="aluno"?"aluno":"professor";
    s.authUserId=user.id;
    if(user.role==="aluno" && user.studentId)s.linkedStudentId=user.studentId;
    await DB.put("settings",s);
  }
  async function logout(){
    window.__TONICAO_REMOTE_APPLY__=true;
    try{
      const db=await openDB();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction("authSession","readwrite");
        tx.objectStore("authSession").delete("current");
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
      });
    } finally {window.__TONICAO_REMOTE_APPLY__=false;}
  }
  async function currentUser(){
    const session=await DB.getOne("authSession","current");
    if(!session)return null;
    const user=await DB.getOne("users",session.userId);
    return user?.active===false?null:user;
  }
  async function audit(action,message,studentId=null,details={}){
    const user=await currentUser();
    const entry={
      id:uid("audit"),at:new Date().toISOString(),action,message,studentId,
      userId:user?.id||null,userName:user?.name||"Sistema",userRole:user?.role||"system",
      details
    };
    window.__TONICAO_REMOTE_APPLY__=true;
    try{
      const db=await openDB();
      await new Promise((resolve,reject)=>{
        const tx=db.transaction("auditLog","readwrite");
        tx.objectStore("auditLog").put(entry);
        tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);
      });
    } finally {window.__TONICAO_REMOTE_APPLY__=false;}
    return entry;
  }
  function can(user,perm){
    if(!user)return false;
    const set=PERMS[user.role]||new Set();
    return set.has("*")||set.has(perm);
  }
  async function requirePerm(perm){
    const u=await currentUser();
    if(!can(u,perm)){
      if(u?.role==="admin"&&ACADEMIC_PERMS.has(perm)) throw new Error("Administrador/Dono tem acesso de visualização e manutenção, mas decisões acadêmicas pertencem ao Professor.");
      throw new Error("Sem permissão para esta ação.");
    }
    return u;
  }
  return {
    ROLE_LABEL,hasAnyUser,hasOwner,bootstrapAdmin,createUser,changePassword,setActive,login,logout,passwordProblem,
    currentUser,users,allUsers,can,requirePerm,audit,loginFederated
  };
})();
window.TonicaoAuth=TonicaoAuth;
