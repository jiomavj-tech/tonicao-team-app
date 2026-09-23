/* Monta o index.html a partir de src/. Rode: node build.js  (ou deixe a automação do GitHub fazer) */
const fs=require("fs"),path=require("path");
const SRC="src",OUT="index.html";
let html=fs.readFileSync(path.join(SRC,"index.template.html"),"utf8");
html=html.replace("{{STYLES}}",()=>fs.readFileSync(path.join(SRC,"styles.css"),"utf8"));
html=html.replace(/\{\{MOD:([\w.\-]+)\}\}/g,(m,name)=>{
  const file=path.join(SRC,"modules",name);
  if(!fs.existsSync(file))throw new Error("Módulo não encontrado: "+file);
  return fs.readFileSync(file,"utf8").replace(/<\/script/g,"<\\/script");
});
fs.writeFileSync(OUT,html);
// o cache do Service Worker acompanha a versão do app
const v=(html.match(/offline-first • (v0\.\d+(?:\.\d+)?)/)||[])[1];
if(v){
  const sw=fs.readFileSync("sw.js","utf8").replace(/tonicao-v[\d.]+/g,"tonicao-"+v+".0");
  fs.writeFileSync("sw.js",sw);
}
console.log("index.html montado:",Math.round(html.length/1024)+" KB",v||"");
