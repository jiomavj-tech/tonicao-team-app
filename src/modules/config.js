/* Tonicão Team v0.27 — configuração única da aplicação.
   Firebase é o backend oficial. Cada link carrega explicitamente ?academy=<id>.
   Para a unidade piloto sem parâmetro, preserva tonicao-sul-ilha. */
document.addEventListener("error",e=>{
  if(e.target&&e.target.tagName==="IMG"&&!e.target.dataset.fallback){
    e.target.dataset.fallback="1";e.target.style.visibility="hidden";
  }
},true);

const __tonicaoParams=new URLSearchParams(location.search);
const __tonicaoRawAcademy=String(
  __tonicaoParams.get("academy")||
  localStorage.getItem("tonicao_academy_id")||
  "tonicao-sul-ilha"
).trim().toLowerCase();
window.TONICAO_ACADEMY_ID=(
  __tonicaoRawAcademy.replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"")||
  "tonicao-sul-ilha"
);
if(__tonicaoParams.get("academy")) localStorage.setItem("tonicao_academy_id",window.TONICAO_ACADEMY_ID);

window.TONICAO_DEMO=__tonicaoParams.get("demo")==="1";
if(!window.TONICAO_DEMO){
  window.TONICAO_FIREBASE={
    apiKey:"AIzaSyBTtxivTRHEPj5CjsVwUdtcngb0_St5yX0",
    authDomain:"tonicao-sul-ilha.firebaseapp.com",
    projectId:"tonicao-sul-ilha",
    storageBucket:"tonicao-sul-ilha.firebasestorage.app",
    messagingSenderId:"803430406523",
    appId:"1:803430406523:web:9e24cfef4c7f6f676e45de",
    academyId:window.TONICAO_ACADEMY_ID
  };
}
window.TONICAO_APP_CONFIG=Object.freeze({
  mode:window.TONICAO_DEMO?"demo":"production",
  apiBase:"",
  academyId:window.TONICAO_ACADEMY_ID,
  publicAppUrl:"https://jiomavj-tech.github.io/tonicao-team-app/",
  allowedApiHosts:[]
});
