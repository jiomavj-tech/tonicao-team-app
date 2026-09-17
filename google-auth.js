const TonicaoGoogle=(()=>{
  let initializedClientId="";

  async function settings(){
    return (await DB.getOne("settings","app"))||{id:"app"};
  }
  async function saveClientId(clientId){
    const s=await settings();
    s.googleClientId=String(clientId||"").trim();
    s.googleAuthEnabled=!!s.googleClientId;
    await DB.put("settings",s);
    return s;
  }
  async function waitForGIS(timeoutMs=8000){
    const start=Date.now();
    while(Date.now()-start<timeoutMs){
      if(window.google?.accounts?.id)return true;
      await new Promise(r=>setTimeout(r,120));
    }
    return false;
  }
  async function loadConfigFromServer(){
    const cfg=await TonicaoRemoteAuth.googleConfig();
    if(cfg?.clientId)await saveClientId(cfg.clientId);
    return cfg;
  }
  async function handleCredential(response){
    try{
      if(!response?.credential)throw new Error("O Google não retornou a credencial.");
      const result=await TonicaoRemoteAuth.googleLogin(response.credential);
      if(result.pending){
        toast("Cadastro Google enviado. Aguarde a aprovação do Administrador.");
        return;
      }
      if(!result.user)throw new Error("Usuário não retornado pelo servidor.");
      await TonicaoAuth.loginFederated(result.user);
      const s=await settings();
      s.cloudSessionToken=result.token||s.cloudSessionToken;
      s.remoteUser=result.user;
      await DB.put("settings",s);
      toast(`Bem-vindo, ${result.user.name||result.user.email||"usuário"}.`);
      await renderAuthGate();
      await renderAll();
    }catch(e){
      toast(e.message||"Falha no acesso com Google.");
    }
  }
  async function renderButton(containerId){
    const host=document.getElementById(containerId);
    if(!host)return false;
    const s=await settings();
    if(!s.googleAuthEnabled||!s.googleClientId){
      host.innerHTML=`<div class="small muted google-help">Login Google ainda não configurado pelo Administrador.</div>`;
      return false;
    }
    if(location.protocol==="file:"){
      host.innerHTML=`<button class="google-fallback" type="button" onclick="toast('Para testar o login Google, abra o app por localhost ou HTTPS. O arquivo único continua servindo para testar o restante do app.')">
        <span class="google-g">G</span> Continuar com Google
      </button><div class="small muted google-help">O botão real do Google exige localhost ou HTTPS.</div>`;
      return false;
    }
    const ok=await waitForGIS();
    if(!ok){
      host.innerHTML=`<div class="small muted google-help">Não foi possível carregar o Google Sign-In. Verifique a internet.</div>`;
      return false;
    }
    if(initializedClientId!==s.googleClientId){
      google.accounts.id.initialize({
        client_id:s.googleClientId,
        callback:handleCredential,
        auto_select:false,
        cancel_on_tap_outside:true
      });
      initializedClientId=s.googleClientId;
    }
    host.innerHTML="";
    google.accounts.id.renderButton(host,{
      type:"standard",theme:"outline",size:"large",text:"continue_with",
      shape:"rectangular",logo_alignment:"left",width:320
    });
    return true;
  }
  return {saveClientId,loadConfigFromServer,renderButton,handleCredential};
})();
window.TonicaoGoogle=TonicaoGoogle;