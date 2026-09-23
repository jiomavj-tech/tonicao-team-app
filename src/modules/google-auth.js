/* ===== google-auth.js ===== */
/* v0.22 — Login com Google pelo Firebase Authentication (sem Client ID manual). */
const TonicaoGoogle=(()=>{
  async function afterResult(result){
    if(!result)return;
    if(result.redirect)return;
    if(result.pending){toast("Cadastro Google enviado. Aguarde a liberação do Professor ou Administrador.");return}
    await TonicaoAuth.loginFederated(result.user);
    toast(`Bem-vindo, ${result.user.name||"usuário"}.`);
    await renderAuthGate();await renderAll();TonicaoCloud.schedule(300);
  }
  async function signIn(){
    try{await afterResult(await TonicaoRemoteAuth.googleSignIn())}catch(e){toast(e.message||"Falha no acesso com Google.")}
  }
  async function renderButton(containerId){
    const host=document.getElementById(containerId);if(!host)return false;
    if(!TonicaoFirebase.configured){host.innerHTML=`<div class="small muted google-help">Login Google disponível depois de configurar o Firebase.</div>`;return false}
    host.innerHTML=`<button class="google-fallback" type="button" onclick="TonicaoGoogle.signIn()"><span class="google-g">G</span> Continuar com Google</button>`;
    return true;
  }
  async function checkRedirect(){try{await afterResult(await TonicaoRemoteAuth.googleRedirectResult())}catch(e){toast(e.message||"Falha no acesso com Google.")}}
  async function saveClientId(){return {}}
  async function loadConfigFromServer(){return {enabled:TonicaoFirebase.configured}}
  window.addEventListener("load",()=>setTimeout(checkRedirect,600));
  return {signIn,renderButton,saveClientId,loadConfigFromServer,handleCredential:signIn};
})();
window.TonicaoGoogle=TonicaoGoogle;
