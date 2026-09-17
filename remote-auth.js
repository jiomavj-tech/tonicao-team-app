const TonicaoRemoteAuth=(()=>{
  async function settings(){return (await DB.getOne("settings","app"))||{id:"app"}}
  function base(url){
    return String(url||"").trim().replace(/\/+$/,"").replace(/\/api\/sync$/i,"");
  }
  async function request(path,{method="GET",body=null,token=null,endpoint=null}={}){
    const s=await settings();
    const root=base(endpoint??s.cloudEndpoint);
    if(!root)throw new Error("Configure o servidor.");
    const headers={};
    if(body!==null)headers["Content-Type"]="application/json";
    const t=token??s.cloudSessionToken;
    if(t)headers.Authorization=`Bearer ${t}`;
    const res=await fetch(root+path,{method,headers,body:body===null?null:JSON.stringify(body),cache:"no-store"});
    let data={};try{data=await res.json()}catch(e){}
    if(!res.ok)throw new Error(data.error||`Servidor respondeu ${res.status}.`);
    return data;
  }
  async function bootstrap({username,password,secret}){
    const s=await settings();
    const local=await TonicaoAuth.currentUser();
    if(local?.role!=="admin")throw new Error("Somente o Administrador.");
    const data=await request("/api/auth/bootstrap",{
      method:"POST",endpoint:s.cloudEndpoint,
      body:{academyId:s.academyId||"tonicao-sul-ilha",name:local.name,username,password,bootstrapSecret:secret}
    });
    s.cloudSessionToken=data.token;
    s.remoteUser=data.user;
    await DB.put("settings",s);
    return data;
  }
  async function login({username,password}){
    const s=await settings();
    const data=await request("/api/auth/login",{
      method:"POST",endpoint:s.cloudEndpoint,
      body:{academyId:s.academyId||"tonicao-sul-ilha",username,password}
    });
    s.cloudSessionToken=data.token;
    s.remoteUser=data.user;
    await DB.put("settings",s);
    return data;
  }
  async function me(){
    const s=await settings();
    if(!s.cloudSessionToken)return null;
    try{return await request("/api/auth/me",{token:s.cloudSessionToken,endpoint:s.cloudEndpoint})}
    catch(e){return null}
  }
  async function logout(){
    const s=await settings();
    try{
      if(s.cloudSessionToken)await request("/api/auth/logout",{method:"POST",token:s.cloudSessionToken,endpoint:s.cloudEndpoint});
    }catch(e){}
    delete s.cloudSessionToken;delete s.remoteUser;
    await DB.put("settings",s);
  }

  async function googleConfig(){
    const s=await settings();
    return await request("/api/auth/google/config",{endpoint:s.cloudEndpoint});
  }
  async function googleLogin(credential){
    const s=await settings();
    return await request("/api/auth/google",{
      method:"POST",endpoint:s.cloudEndpoint,
      body:{academyId:s.academyId||"tonicao-sul-ilha",credential}
    });
  }
  async function listRemoteUsers(){
    const s=await settings();
    if(!s.cloudSessionToken)throw new Error("Entre no servidor como Administrador.");
    return await request("/api/users",{token:s.cloudSessionToken,endpoint:s.cloudEndpoint});
  }
  async function approveGoogleUser({userId,role,studentId=""}){
    const s=await settings();
    return await request("/api/users/approve",{
      method:"POST",token:s.cloudSessionToken,endpoint:s.cloudEndpoint,
      body:{userId,role,studentId}
    });
  }


  async function createRemoteUser({name,username,password,role,studentId=""}){
    const s=await settings();
    return await request("/api/users/create",{method:"POST",token:s.cloudSessionToken,endpoint:s.cloudEndpoint,body:{name,username,password,role,studentId}});
  }
  async function updateRemoteUser({userId,role,studentId="",active=true,name=""}){
    const s=await settings();
    return await request("/api/users/update",{method:"POST",token:s.cloudSessionToken,endpoint:s.cloudEndpoint,body:{userId,role,studentId,active,name}});
  }
  async function resetRemotePassword({userId,password}){
    const s=await settings();
    return await request("/api/users/password",{method:"POST",token:s.cloudSessionToken,endpoint:s.cloudEndpoint,body:{userId,password}});
  }
  async function remotePermissions(){
    const s=await settings();
    return await request("/api/auth/permissions",{token:s.cloudSessionToken,endpoint:s.cloudEndpoint});
  }



  async function createRegistrationInvite({name,phone}){
    const s=await settings();
    return await request("/api/registration/invite",{method:"POST",token:s.cloudSessionToken,endpoint:s.cloudEndpoint,body:{name,phone}});
  }
  async function getRegistrationInvite(token,endpointOverride=""){
    const s=await settings();
    return await request(`/api/registration/invite?token=${encodeURIComponent(token)}`,{endpoint:endpointOverride||s.cloudEndpoint,token:""});
  }
  async function completeRegistrationInvite(token,payload,endpointOverride=""){
    const s=await settings();
    return await request("/api/registration/complete",{method:"POST",endpoint:endpointOverride||s.cloudEndpoint,token:"",body:{token,...payload}});
  }

  async function submitRegistrationRequest(payload){
    const s=await settings();
    return await request("/api/registration/request",{method:"POST",endpoint:s.cloudEndpoint,body:{academyId:s.academyId||"tonicao-sul-ilha",...payload}});
  }
  async function listRegistrationRequests(){
    const s=await settings();
    return await request("/api/registration/requests",{token:s.cloudSessionToken,endpoint:s.cloudEndpoint});
  }
  async function decideRegistrationRequest({requestId,status,studentId=""}){
    const s=await settings();
    return await request("/api/registration/decision",{method:"POST",token:s.cloudSessionToken,endpoint:s.cloudEndpoint,body:{requestId,status,studentId}});
  }
  async function getAcademyAccess(){
    const s=await settings();
    return await request("/api/academy/access",{token:s.cloudSessionToken,endpoint:s.cloudEndpoint});
  }
  async function setAcademyAccess({status,reason=""}){
    const s=await settings();
    return await request("/api/academy/access",{method:"POST",token:s.cloudSessionToken,endpoint:s.cloudEndpoint,body:{status,reason}});
  }


  async function listRemoteNotifications(after=0){
    const s=await settings();if(!s.cloudSessionToken)return {notifications:[],cursor:after};
    return await request(`/api/notifications?after=${encodeURIComponent(after||0)}`,{token:s.cloudSessionToken,endpoint:s.cloudEndpoint});
  }
  async function markRemoteNotificationsRead(ids){
    const s=await settings();if(!s.cloudSessionToken)return {ok:false};
    return await request("/api/notifications/read",{method:"POST",token:s.cloudSessionToken,endpoint:s.cloudEndpoint,body:{ids}});
  }
  async function pushConfig(){
    const s=await settings();return await request("/api/push/config",{token:s.cloudSessionToken,endpoint:s.cloudEndpoint});
  }
  async function savePushSubscription(subscription){
    const s=await settings();return await request("/api/push/subscribe",{method:"POST",token:s.cloudSessionToken,endpoint:s.cloudEndpoint,body:{subscription}});
  }
  async function removePushSubscription(endpoint){
    const s=await settings();return await request("/api/push/unsubscribe",{method:"POST",token:s.cloudSessionToken,endpoint:s.cloudEndpoint,body:{endpoint}});
  }

  return {bootstrap,login,me,logout,googleConfig,googleLogin,listRemoteUsers,approveGoogleUser,createRemoteUser,updateRemoteUser,resetRemotePassword,remotePermissions,createRegistrationInvite,getRegistrationInvite,completeRegistrationInvite,submitRegistrationRequest,listRegistrationRequests,decideRegistrationRequest,getAcademyAccess,setAcademyAccess,listRemoteNotifications,markRemoteNotificationsRead,pushConfig,savePushSubscription,removePushSubscription};
})();
window.TonicaoRemoteAuth=TonicaoRemoteAuth;