/* ===== app.js ===== */
const APP_CONFIG=window.TONICAO_APP_CONFIG||{};
const APP_MODE=APP_CONFIG.mode==="demo"?"demo":"production";
function localISODate(d=new Date()){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,"0"),day=String(d.getDate()).padStart(2,"0");return `${y}-${m}-${day}`}
function officialApiBase(){
  const raw=String(APP_CONFIG.apiBase||"").trim().replace(/\/+$/,"");
  if(!raw)return "";
  try{const u=new URL(raw);if(u.protocol!=="https:"&&!(["localhost","127.0.0.1"].includes(u.hostname)&&u.protocol==="http:"))return "";
    const allowed=Array.isArray(APP_CONFIG.allowedApiHosts)?APP_CONFIG.allowedApiHosts.filter(Boolean):[];
    if(allowed.length&&!allowed.includes(u.hostname))return "";return u.origin+(u.pathname==="/"?"":u.pathname.replace(/\/+$/,"") )
  }catch(e){return ""}
}
const EXAM_BLUE = [
  "4 Quedas com os respectivos nomes","1 Postura e abertura de Guarda","3 Raspagens partindo da Guarda fechada",
  "1 Imobilização no 100Kg e 1 saída","1 Imobilização no Norte / Sul e 1 saída","1 Ataque de Kimura partindo do 100 Kg",
  "2 Montadas partindo do 100Kg","1 Saída da Montada","3 Ataques da Montada","1 Armlock na guarda",
  "1 Finalização com joelho na barriga","1 Saída do joelho na barriga","1 Montada partindo da Meia-guarda",
  "1 Reposição de Meia-guarda","3 Ataques nas costas com os Ganchos","1 Saída do Ataque nas costas",
  "1 Triângulo e 1 Saída","1 Saída do Armlock","1 Chave de pé e 1 saída","2 Finalizações da Guarda fechada",
  "2 Finalizações partindo do Quatro Apoio"
];
const EXAM_PURPLE = [
  "3 passagens de guarda diferentes","3 raspagens a partir da guarda aberta ou laçada","2 entradas para queda com encadeamento",
  "2 ataques partindo da meia-guarda","2 saídas de raspagem do adversário","2 transições para as costas",
  "3 ataques nas costas","2 finalizações saindo da montada","2 ataques de joelho na barriga",
  "2 ataques de kimura/americana em sequências","2 defesas de estrangulamentos","2 defesas de armlock",
  "2 combinações de raspagem + finalização","1 ataque saindo da guarda aranha ou similar","1 ataque saindo da guarda de laço",
  "1 saída de leg drag ou controle de passador","1 chave de pé com controle","1 sequência livre demonstrando encadeamento técnico"
];
const EXAM_BROWN = [
  "2 sequências completas de passagem de guarda","2 sequências de queda + controle no chão","2 raspagens com reação do adversário",
  "2 transições avançadas para montada ou costas","2 ataques partindo da 50/50 ou posição equivalente",
  "2 ataques partindo da meia-guarda por cima","2 ataques partindo da meia-guarda por baixo","2 saídas de situações de pressão",
  "2 combinações de estrangulamentos","2 combinações de chaves de braço","2 controles táticos para pontuar em campeonato",
  "2 defesas com contra-ataque","1 plano de luta explicando estratégia","1 condução técnica curta para colega",
  "1 sequência de queda, passagem, estabilização e finalização"
];
const EXAM_BLACK = [
  "Demonstração de 3 sequências autorais do jogo do atleta","2 soluções técnicas para defesa de guarda moderna",
  "2 soluções técnicas para retenção de guarda","2 ataques encadeados a partir das costas",
  "2 ataques encadeados a partir da montada","2 ataques encadeados a partir da meia-guarda",
  "2 combinações de finalização em pé ou transição","2 estudos de situação com leitura tática",
  "1 aula curta demonstrando didática e correção técnica","1 explicação sobre pontuação e arbitragem",
  "1 explicação sobre segurança do treino e conduta","1 apresentação resumida da linhagem e referências técnicas",
  "1 plano de evolução pessoal e contribuição para a equipe"
];
const PLAN_STYLE = {Azul:"blue",Roxa:"purple",Marrom:"brown",Preta:"dark",Cinza:"gray",Amarela:"yellow",Laranja:"orange",Verde:"green"};
const BELTS_BY_TRACK = {
  adulto:["Branca","Azul","Roxa","Marrom","Preta"],
  kids:["Branca","Cinza","Amarela","Laranja","Verde"]
};
const TRACK_LABEL = {adulto:"Adulto",kids:"Kids"};
const DEFAULT_TARGET_CLASSES = {
  adulto:{Branca:120,Azul:140,Roxa:160,Marrom:180,Preta:999},
  kids:{Branca:80,Cinza:90,Amarela:100,Laranja:110,Verde:999}
};
function beltsForTrack(track="adulto"){return BELTS_BY_TRACK[track]||BELTS_BY_TRACK.adulto}
function targetClassesFor(track,belt){return DEFAULT_TARGET_CLASSES[track]?.[belt]||120}


const TONICAO_SCORE_PRESETS = [
  {id:"score-world-cbjj",name:"Campeonato Mundial da CBJJ",participacao:120,categoria:{primeiro:240,segundo:200,terceiro:180},absoluto:{primeiro:400,segundo:340,terceiro:290},order:1},
  {id:"score-europe-pan-emirates",name:"Europeu, Panamericano e Emirados Árabes",participacao:80,categoria:{primeiro:120,segundo:100,terceiro:90},absoluto:{primeiro:200,segundo:160,terceiro:140},order:2},
  {id:"score-brasileiro-cbjje",name:"Brasileiro e Mundial da CBJJE",participacao:50,categoria:{primeiro:85,segundo:75,terceiro:60},absoluto:{primeiro:130,segundo:110,terceiro:90},order:3},
  {id:"score-out-state",name:"Campeonatos fora do Estado",participacao:30,categoria:{primeiro:60,segundo:50,terceiro:35},absoluto:{primeiro:120,segundo:100,terceiro:70},order:4},
  {id:"score-sc-cbjj-ajp",name:"Campeonatos da CBJJ e AJP em SC",participacao:20,categoria:{primeiro:45,segundo:35,terceiro:25},absoluto:{primeiro:90,segundo:70,terceiro:50},order:5},
  {id:"score-local-regional",name:"Campeonatos locais e regionais",participacao:10,categoria:{primeiro:35,segundo:25,terceiro:15},absoluto:{primeiro:70,segundo:50,terceiro:30},order:6}
];
const TONICAO_DOJO_RULES = [
  "Cumprimente o Dojô antes de entrar.",
  "Cumprimente o Dojô antes de sair.",
  "Mantenha uma atitude respeitosa dentro do Dojô.",
  "As aulas devem ser iniciadas com cumprimento frontal ao instrutor. Os alunos devem ser alinhados no lado oposto ao do professor, em ordem de graduação.",
  "Durante a aula, quando o instrutor estiver demonstrando uma técnica, os alunos devem sentar-se ou ajoelhar-se.",
  "Caso você esteja atrasado, aguarde a permissão do instrutor para entrar no Dojô.",
  "Caso você precise sair do Dojô antes do término da aula, peça permissão ao instrutor.",
  "Cumprimente o seu parceiro antes e após o treino.",
  "Conversas devem ser mantidas em tom silencioso e restritas ao assunto sendo discutido em aula.",
  "Não é permitido o uso de linguagem agressiva ou palavrões dentro do Dojô.",
  "Mantenha suas unhas cortadas.",
  "Mantenha seu uniforme limpo. Um kimono sujo é considerado desrespeito aos seus parceiros de treino.",
  "A sua faixa representa o seu progresso; mantenha-a amarrada.",
  "Refira-se aos instrutores Faixa-Preta como Professor.",
  "Todos os objetos de metal, joias, piercing, cordões ou afins devem ser removidos.",
  "Sapatos, alimentos e bebidas são proibidos dentro do Dojô."
];
const FERNANDO_CT_RULES = [
  "Traga sua toalha pessoal.",
  "Traga diariamente sua garrafa ou copo.",
  "Não coma no tatame.",
  "Não é permitido crianças no tatame em horários de aula.",
  "Não é permitido subir com calçado no tatame.",
  "Não é permitido uso de celular com áudio.",
  "Falar baixo durante as aulas."
];

const seed={
  students:[
    {id:"s1",name:"João Silva",nickname:"João",birth:"1992-09-16",phone:"",belt:"Branca",stripes:4,classesInBelt:112,targetClasses:120,streak:8,points:438,dueDay:10,payment:"verificar",active:true,photo:""},
    {id:"s2",name:"Carlos Souza",nickname:"Carlos",birth:"1988-04-22",phone:"",belt:"Azul",stripes:2,classesInBelt:86,targetClasses:140,streak:14,points:411,dueDay:10,payment:"liberado",active:true,photo:""},
    {id:"s3",name:"Pedro Lima",nickname:"Pedro",birth:"2001-11-03",phone:"",belt:"Branca",stripes:3,classesInBelt:74,targetClasses:120,streak:6,points:387,dueDay:15,payment:"liberado",active:true,photo:""},
    {id:"s4",name:"Marcos Vieira",nickname:"Marcos",birth:"1995-02-12",phone:"",belt:"Branca",stripes:4,classesInBelt:98,targetClasses:120,streak:3,points:344,dueDay:10,payment:"pendente",active:true,photo:""}
  ],
  gradingPlans:[
    {id:"gp-blue-2026",graduationTrack:"adulto",name:"Exame para Faixa Azul",targetBelt:"Azul",version:"2026",practical:EXAM_BLUE,theory:[],pdfAssetUrl:"./assets/exame-faixa-azul-2026.pdf",pdfDocId:"",links:{p2:["t2"],p9:["t1"]},active:true,pilot:true},
    {id:"gp-purple-2026",graduationTrack:"adulto",name:"Exame para Faixa Roxa",targetBelt:"Roxa",version:"2026",practical:EXAM_PURPLE,theory:["Pontuação e vantagens","Estratégia básica de campeonato","Higiene, segurança e etiqueta no tatame"],pdfAssetUrl:"./assets/exame-faixa-roxa-2026.pdf",pdfDocId:"",links:{},active:true,pilot:true},
    {id:"gp-brown-2026",graduationTrack:"adulto",name:"Exame para Faixa Marrom",targetBelt:"Marrom",version:"2026",practical:EXAM_BROWN,theory:["Estratégia de luta","Arbitragem e leitura de combate","Postura como graduado"],pdfAssetUrl:"./assets/exame-faixa-marrom-2026.pdf",pdfDocId:"",links:{},active:true,pilot:true},
    {id:"gp-black-2026",name:"Exame para Faixa Preta",targetBelt:"Preta",graduationTrack:"adulto",version:"2026",practical:EXAM_BLACK,theory:["Didática e liderança","Segurança e responsabilidade na condução de treino","História, linhagem e arbitragem"],pdfAssetUrl:"./assets/exame-faixa-preta-2026.pdf",pdfDocId:"",links:{},active:true,pilot:true},
    {id:"gp-kids-gray-2026",name:"Graduação Kids para Faixa Cinza",targetBelt:"Cinza",graduationTrack:"kids",version:"2026",practical:["Queda segura e postura","Saída de montada","Saída do controle lateral","Reposição de guarda","Raspagem simples","Passagem de guarda simples","Controle da montada","Sequência técnica definida pelo professor"],theory:["Respeito e comportamento no tatame","Segurança durante o treino"],pdfAssetUrl:"",pdfDocId:"",links:{},active:true,pilot:true},
    {id:"gp-kids-yellow-2026",name:"Graduação Kids para Faixa Amarela",targetBelt:"Amarela",graduationTrack:"kids",version:"2026",practical:["2 quedas com segurança","2 raspagens","2 passagens de guarda","Saída de montada e controle lateral","Reposição de guarda","Controle de costas","Montada e estabilização","2 combinações técnicas definidas pelo professor"],theory:["Pontuação básica","Conduta e segurança"],pdfAssetUrl:"",pdfDocId:"",links:{},active:true,pilot:true},
    {id:"gp-kids-orange-2026",name:"Graduação Kids para Faixa Laranja",targetBelt:"Laranja",graduationTrack:"kids",version:"2026",practical:["2 entradas de queda","3 raspagens","3 passagens de guarda","2 saídas de posições dominantes","2 transições para costas","2 ataques permitidos definidos pelo professor","Sequência de pontuação","Sequência livre com encadeamento"],theory:["Pontuação e vantagens","Estratégia básica de competição","Segurança"],pdfAssetUrl:"",pdfDocId:"",links:{},active:true,pilot:true},
    {id:"gp-kids-green-2026",name:"Graduação Kids para Faixa Verde",targetBelt:"Verde",graduationTrack:"kids",version:"2026",practical:["Sequência de queda + estabilização","3 passagens de guarda","3 raspagens com reação","Transição para montada e costas","Defesa com contra-ataque","Combinação de ataques permitidos","Plano de luta simples","Demonstração técnica para colega"],theory:["Regras e estratégia","Responsabilidade como graduado","Conduta e segurança"],pdfAssetUrl:"",pdfDocId:"",links:{},active:true,pilot:true}
  ],
  gradingReminders:[{id:"gr1",studentId:"s4",mode:"classes",remaining:3,note:"Reavaliar defesa de montada e raspagem.",status:"active"}],
  techniques:[
    {id:"t1",title:"Armlock na guarda",category:"Finalização",level:"Branca/Azul",week:"Semana atual",url:"",note:"Vinculado ao exame de faixa azul."},
    {id:"t2",title:"Raspagem tesoura",category:"Raspagem",level:"Branca/Azul",week:"Biblioteca",url:"",note:"Exemplo de raspagem para a preparação."}
  ],
  events:[{id:"ev-demo-1",title:"Mini campeonato interno",date:"2026-09-20",type:"campeonato",scoring:{participacao:2,primeiro:10,segundo:7,terceiro:5},note:"Evento de demonstração do motor de pontuação."}]
};

let qrStream=null, qrTimer=null, cropState={studentId:null,img:null,zoom:1,x:0,y:0};
function uid(prefix="id"){return prefix+"-"+Date.now()+"-"+Math.random().toString(36).slice(2,7)}
function todayISO(){return localISODate()}
function monthKey(){return todayISO().slice(0,7)}
function fmtDate(iso){if(!iso)return"";return new Date(iso+"T12:00:00").toLocaleDateString("pt-BR")}
async function guard(perm){try{await TonicaoAuth.requirePerm(perm);return true}catch(e){toast(e.message||"Sem permissão.");return false}}
async function guardRoles(roles){const u=await TonicaoAuth.currentUser();if(u&&roles.includes(u.role))return true;toast("Sem permissão para esta ação.");return false}
function esc(v){return String(v??"").replace(/[&<>"'`]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;","`":"&#96;"}[c]))}
function drawSessionQR(session){
  const box=document.getElementById("sessionQr");if(!box||!session)return;
  box.innerHTML="";
  if(window.QRCode){new QRCode(box,{text:String(session.code),width:220,height:220,correctLevel:QRCode.CorrectLevel.M})}
  else box.innerHTML=`<div class="small muted">QR indisponível neste aparelho. Use o código abaixo.</div>`;
}
async function applySequenceBonuses(s){
  // Bônus por treinos seguidos: cada regra é lançada uma única vez por aluno
  const rules=(await DB.getAll("sequenceRules")).filter(r=>r.active!==false&&Number(r.classes)>0).sort((a,b)=>a.classes-b.classes);
  s.sequenceAwards=Array.isArray(s.sequenceAwards)?s.sequenceAwards:[];
  let total=0;
  for(const r of rules){
    if((s.streak||0)>=Number(r.classes)&&!s.sequenceAwards.includes(r.id)){
      s.sequenceAwards.push(r.id);
      const pts=Number(r.points||0);
      if(pts){
        s.points=(s.points||0)+pts;total+=pts;
        await DB.put("pointsLedger",{id:uid("pts"),studentId:s.id,date:todayISO(),type:"sequencia",points:pts,note:`Bônus: ${r.label||r.classes+" treinos seguidos"} (+${pts})`,ruleId:r.id});
      }
    }
  }
  return total;
}
function toast(msg){const el=document.getElementById("toast");el.textContent=msg;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2300)}
function studentAvatar(s){return s.photo?`<img src="${s.photo}" alt="">`:`<div class="avatar small-avatar">🥋</div>`}
function stopQrCamera(){if(qrTimer){clearTimeout(qrTimer);qrTimer=null}if(qrStream){qrStream.getTracks().forEach(t=>t.stop());qrStream=null}}
function closeModal(){stopQrCamera();document.getElementById("modal").classList.remove("show")}
function showModal(html){
  stopQrCamera();
  document.getElementById("modalContent").innerHTML=`<button class="modal-back-btn" onclick="closeModal()">← Voltar</button>${html}`;
  document.getElementById("modal").classList.add("show");
}
document.getElementById("modal").addEventListener("click",e=>{if(e.target.id==="modal")closeModal()});

async function ensureSeed(){
  // Em produção nunca criamos alunos, presenças, lembretes ou eventos fictícios.
  if(APP_MODE==="demo"){
    if(!(await DB.getAll("students")).length) for(const x of seed.students) await DB.rawPut("students",x);
    if(!(await DB.getAll("gradingReminders")).length) for(const x of seed.gradingReminders) await DB.rawPut("gradingReminders",x);
    if(!(await DB.getAll("techniques")).length) for(const x of seed.techniques) await DB.rawPut("techniques",x);
    if(!(await DB.getAll("events")).length) for(const x of seed.events) await DB.rawPut("events",x);
  }
  const existingPlans=await DB.getAll("gradingPlans");
  for(const x of seed.gradingPlans){
    const current=existingPlans.find(p=>p.id===x.id);
    if(!current) await DB.rawPut("gradingPlans",x);
    else await DB.rawPut("gradingPlans",{...x,...current,pdfAssetUrl:current.pdfAssetUrl||x.pdfAssetUrl,links:current.links||x.links||{},active:current.active!==false});
  }
  let set=await DB.getOne("settings","app");
  if(!set)set={id:"app",role:"professor",academy:"Tonicão Team",unit:"Sul da Ilha"};
  if(!set.academyId)set.academyId=APP_CONFIG.academyId||"tonicao-sul-ilha";
  if(!set.publicAppUrl&&APP_CONFIG.publicAppUrl)set.publicAppUrl=APP_CONFIG.publicAppUrl;
  await DB.rawPut("settings",set);
}
async function ensureProductionCleanV22(){
  if(APP_MODE!=="production")return;
  const s=await getSettings();if(s.productionCleanV22)return;
  for(const id of ["s1","s2","s3","s4"])await DB.rawDelete("students",id);
  for(const id of ["gr1"])await DB.rawDelete("gradingReminders",id);
  for(const id of ["ev-demo-1"])await DB.rawDelete("events",id);
  for(const id of ["t1","t2"])await DB.rawDelete("techniques",id);
  for(const pid of ["gp-blue-2026"]){const p=await DB.getOne("gradingPlans",pid);if(p&&p.links){p.links={};await DB.rawPut("gradingPlans",p)}}
  s.productionCleanV22=true;await DB.rawPut("settings",s);
}

async function ensureDefaultV05Data(){
  const rules=await DB.getAll("sequenceRules");
  if(!rules.length){
    for(const r of [
      {id:"seq-5",classes:5,points:2,active:true,label:"5 treinos seguidos"},
      {id:"seq-10",classes:10,points:5,active:true,label:"10 treinos seguidos"},
      {id:"seq-20",classes:20,points:10,active:true,label:"20 treinos seguidos"}
    ]) await DB.rawPut("sequenceRules",r);
  }
  const presets=await DB.getAll("timerPresets");
  if(!presets.length){
    for(const p of [
      {id:"timer-rolamento",name:"Rolamento",workSec:300,restSec:60,rounds:5},
      {id:"timer-competicao",name:"Competição adulto",workSec:300,restSec:60,rounds:1},
      {id:"timer-kids",name:"Kids",workSec:180,restSec:60,rounds:3},
      {id:"timer-drill",name:"Drill",workSec:120,restSec:30,rounds:5}
    ]) await DB.rawPut("timerPresets",p);
  }
  const content=await DB.getOne("academyContent","main");
  if(!content){
    await DB.rawPut("academyContent",{
      id:"main",
      teamHistory:"Área para registrar a história geral da equipe.",
      unitHistory:"Área para registrar a história específica da unidade.",
      lineage:"Linhagem do Jiu-Jitsu da equipe.",
      professors:"Professores e responsáveis pela unidade."
    });
  }
}


async function ensurePilotHistoryV08(){if(window.TonicaoFirebase?.configured)return;
  const settings=await getSettings();
  if((settings.academyId||"tonicao-sul-ilha")!=="tonicao-sul-ilha")return;
  const content=await DB.getOne("academyContent","main");
  const placeholder=!content ||
    String(content.teamHistory||"").startsWith("Área para registrar") ||
    String(content.unitHistory||"").startsWith("Área para registrar");
  if(placeholder || !content?.pilotHistoryVersion){
    await DB.rawPut("academyContent",{
      id:"main",
      pilotHistoryVersion:"v0.20-tonicao",
      teamHistory:"A Tonicão Team carrega o nome e o legado de Antônio Claudio Collares Moreira, conhecido no Jiu-Jitsu como Mestre Tonicão. Registros históricos de Santa Catarina o apresentam como um dos pioneiros da expansão do Jiu-Jitsu no Sul do Brasil.\n\nNascido no Rio de Janeiro, Tonicão iniciou sua trajetória no Jiu-Jitsu com Rolls Gracie. Após a morte de Rolls, continuou sua formação com Rickson Gracie, com quem chegou à faixa-preta. Em 1970 esteve pela primeira vez no Sul do Brasil. Entre 1985 e 1986 mudou-se para a região e passou a trabalhar também com o ensino da arte suave.\n\nEm Florianópolis, um dos primeiros pontos de divulgação e ensino citados nas fontes foi a Universidade Federal de Santa Catarina (UFSC). Com o crescimento do esporte, Mestre Tonicão também montou um tatame na região da Lagoa da Conceição.\n\nEm 1996, dois de seus principais faixas-pretas, Sérgio Sá e Murilo Rupp, criaram a equipe Ataque Duplo. Mais tarde, em 2012, Mestre Tonicão e o professor Christophoros Constantinidis iniciaram uma nova etapa com a criação da Tonicão Team Jiu-Jitsu.\n\nA proposta associada à equipe valoriza não apenas a técnica e o desempenho esportivo, mas também os princípios éticos, a disciplina, o respeito e a transformação proporcionada pelo Jiu-Jitsu. Este texto é uma versão piloto para o aplicativo e poderá ser ampliado com fotos, datas, depoimentos e documentos do acervo da própria equipe.",
      unitHistory:"A Tonicão Team Sul da Ilha é a unidade utilizada como piloto deste aplicativo. O trabalho é desenvolvido no Sul de Florianópolis, no Ribeirão da Ilha, tendo o professor Fernando Carvalho como responsável pelo CT.\n\nA unidade reúne alunos adultos, juvenis e crianças, mantendo o Jiu-Jitsu como prática esportiva, formação técnica, disciplina e convivência em equipe. A participação em campeonatos também faz parte da rotina do grupo.\n\nRegistros públicos de competições de 2026 mostram atletas inscritos com o nome Tônicão TEAM Sul da Ilha em diferentes faixas e categorias, incluindo divisões adultas e infantis na Copa Desterro Litoral, além de participação no Circuito Mormaii GI & NOGI.\n\nEsta parte da história ainda será completada com o acervo da própria unidade: data de início do CT, primeiros alunos, locais de treino anteriores, graduações importantes, conquistas em campeonatos, seminários e outros marcos. Por enquanto, o aplicativo apresenta este resumo como texto institucional provisório para os testes.",
      lineage:"Base histórica registrada para esta versão piloto:\n\n• Mestre Tonicão iniciou seus treinos com Rolls Gracie.\n• Depois da morte de Rolls Gracie, continuou sua formação com Rickson Gracie até a faixa-preta.\n• Em 2012, Mestre Tonicão e o professor Christophoros Constantinidis criaram a Tonicão Team Jiu-Jitsu.\n• A Tonicão Team Sul da Ilha integra essa história e mantém o trabalho da equipe no Sul de Florianópolis.\n\nA linhagem técnica completa da unidade — incluindo a cadeia de graduações até o professor Fernando Carvalho — será acrescentada depois da confirmação direta com o professor e com os registros da equipe.",
      professors:"Professor responsável pela unidade piloto:\n\nFernando Carvalho\nTonicão Team Sul da Ilha / CT Fernando Carvalho\nRibeirão da Ilha — Florianópolis/SC\n\nA biografia completa do professor, faixa atual, datas de graduação, professores responsáveis por suas graduações, títulos e trajetória dentro da Tonicão Team serão adicionados a partir das informações fornecidas pela própria academia.",
      sourcesNote:"Fontes utilizadas no texto piloto:\n• EsporteSC — “Primórdios do Jiu-Jitsu em Santa Catarina” (21/01/2016).\n• Registros públicos de competições de 2026 em BJJCompFinder/Smoothcomp para a Tônicão TEAM Sul da Ilha.\n• Informações sobre o CT Fernando Carvalho e sua localização foram fornecidas pela própria unidade durante o desenvolvimento do aplicativo."
    });
  }
}


async function ensurePilotTimelineV09(){
  const settings=await getSettings();
  if((settings.academyId||"tonicao-sul-ilha")!=="tonicao-sul-ilha")return;
  const rows=await DB.getAll("academyTimeline");
  if(rows.length)return;
  const items=[{"id": "tl-1", "year": "1970", "title": "Primeira passagem de Tonicão pelo Sul", "text": "Registros históricos citam a primeira vinda de Mestre Tonicão ao Sul do Brasil em 1970.", "order": 1}, {"id": "tl-2", "year": "1985–1986", "title": "Mudança para a região", "text": "Mestre Tonicão passa a atuar na região e a difundir o Jiu-Jitsu em Santa Catarina.", "order": 2}, {"id": "tl-3", "year": "Anos 1980", "title": "Ensino em Florianópolis", "text": "A UFSC e a região da Lagoa da Conceição aparecem entre os primeiros pontos associados ao ensino e à divulgação da arte suave.", "order": 3}, {"id": "tl-4", "year": "1996", "title": "Ataque Duplo", "text": "Dois importantes faixas-pretas de Tonicão, Sérgio Sá e Murilo Rupp, criam a equipe Ataque Duplo.", "order": 4}, {"id": "tl-5", "year": "2012", "title": "Criação da Tonicão Team", "text": "Mestre Tonicão e o professor Christophoros Constantinidis iniciam uma nova etapa com a Tonicão Team Jiu-Jitsu.", "order": 5}, {"id": "tl-6", "year": "2026", "title": "Tonicão Team Sul da Ilha", "text": "A unidade piloto aparece em registros públicos de competições com atletas adultos e infantis representando a equipe.", "order": 6}];
  for(const item of items)await DB.rawPut("academyTimeline",item);
}


async function ensureOfficialMaterialsV18(){
  const settings=await getSettings();
  if((settings.academyId||"tonicao-sul-ilha")!=="tonicao-sul-ilha")return;
  if(settings.officialMaterialsV18)return;

  // Pontuação fotografada na unidade.
  const baseRules=[
    {id:"score-base-attendance",kind:"base",name:"Pontuação por aula",points:5,active:true,order:0},
    {id:"score-base-payment",kind:"base",name:"Mensalidade em dia",points:20,active:true,order:0.1}
  ];
  for(const r of [...baseRules,...TONICAO_SCORE_PRESETS])await DB.rawPut("scoreRules",{...r,source:"Tabela fotografada na academia",active:r.active!==false});

  // Retira bônus de demonstração que não constam na tabela fotografada.
  for(const r of await DB.getAll("sequenceRules")){
    if(["seq-5","seq-10","seq-20"].includes(r.id)){r.active=false;r.note="Desativado na v0.20 para seguir a tabela de pontuação da academia.";await DB.rawPut("sequenceRules",r)}
  }

  // Regras institucionais.
  for(const [i,text] of TONICAO_DOJO_RULES.entries())await DB.rawPut("academyRules",{id:`dojo-${i+1}`,group:"dojo",groupTitle:"Etiqueta no Dojô (Tatame)",text,order:i+1,active:true,source:"Placa fotografada da Tonicão Team"});
  for(const [i,text] of FERNANDO_CT_RULES.entries())await DB.rawPut("academyRules",{id:`ct-${i+1}`,group:"ct",groupTitle:"Regras do CT Fernando Carvalho",text,order:i+1,active:true,source:"Placa fotografada no CT"});

  // Materiais visuais de referência.
  for(const r of [
    {id:"ref-scoring",type:"scoring",title:"Sistema de pontuação",assetUrl:"./assets/institucional-sistema-pontuacao.jpg",note:"Registro fotográfico da tabela usada na academia.",order:1},
    {id:"ref-dojo",type:"rules",title:"Etiqueta no Dojô",assetUrl:"./assets/institucional-etiqueta-dojo.jpg",note:"Registro fotográfico das regras da equipe.",order:2},
    {id:"ref-ibjjf",type:"graduation",title:"Sistema de graduação IBJJF",assetUrl:"./assets/referencia-graduacao-ibjjf.jpg",note:"Material de referência exposto no CT. Não substitui nem altera automaticamente a política interna de graduação.",order:3},
    {id:"ref-ct-rules",type:"rules",title:"Regras do CT Fernando Carvalho",assetUrl:"./assets/institucional-regras-ct.jpg",note:"Registro fotográfico das regras práticas da unidade.",order:4}
  ])await DB.rawPut("referenceMaterials",r);

  // Galeria institucional. Não identifica pessoas fotografadas automaticamente.
  const gallerySeed=[
    {id:"gal-v18-01",assetUrl:"./assets/galeria-retratos-ct-01.jpg",caption:"Galeria histórica — retratos expostos no CT",category:"historia",order:1},
    {id:"gal-v18-02",assetUrl:"./assets/galeria-retratos-ct-02.jpg",caption:"Galeria histórica — referências expostas no CT",category:"historia",order:2},
    {id:"gal-v18-03",assetUrl:"./assets/galeria-retrato-ct-03.jpg",caption:"Retrato institucional exposto no CT",category:"historia",order:3},
    {id:"gal-v18-04",assetUrl:"./assets/identidade-lutar-e-crescer.jpg",caption:"Projeto Lutar e Crescer — Ribeirão da Ilha",category:"projeto",order:4},
    {id:"gal-v18-05",assetUrl:"./assets/identidade-fernando-carvalho-bjj.jpg",caption:"Identidade visual — Fernando Carvalho Brazilian Jiu Jitsu",category:"identidade",order:5},
    {id:"gal-v18-06",assetUrl:"./assets/institucional-sistema-pontuacao.jpg",caption:"Sistema de pontuação da academia",category:"documento",order:6},
    {id:"gal-v18-07",assetUrl:"./assets/institucional-etiqueta-dojo.jpg",caption:"Etiqueta no Dojô",category:"documento",order:7},
    {id:"gal-v18-08",assetUrl:"./assets/referencia-graduacao-ibjjf.jpg",caption:"Material de referência de graduação IBJJF exposto no CT",category:"referencia",order:8},
    {id:"gal-v18-09",assetUrl:"./assets/institucional-regras-ct.jpg",caption:"Regras práticas do CT",category:"documento",order:9}
  ];
  for(const g of gallerySeed)if(!(await DB.getOne("academyGallery",g.id)))await DB.rawPut("academyGallery",{...g,createdAt:"2026-09-16T22:18:00-03:00"});

  const content=(await DB.getOne("academyContent","main"))||{id:"main"};
  if(!String(content.unitHistory||"").includes("Lutar e Crescer")){
    content.unitHistory=(content.unitHistory||"")+"\n\nNo espaço da unidade também aparece a identidade “Lutar e Crescer — Ribeirão da Ilha”, registrada fotograficamente para o acervo institucional do aplicativo.";
    await DB.rawPut("academyContent",content);
  }

  settings.officialMaterialsV18=true;
  settings.officialScoreVersion="v18-2026";
  await DB.rawPut("settings",settings);
}
async function scoreBaseRule(id,fallback){
  const r=await DB.getOne("scoreRules",id);return Number(r?.points??fallback)
}

async function ensureGraduationTracksV14(){
  const students=await DB.getAll("students");
  for(const s of students){
    if(!s.graduationTrack){
      s.graduationTrack="adulto";
      s.targetClasses=s.targetClasses||targetClassesFor("adulto",s.belt);
      await DB.rawPut("students",s);
    }
  }
  const plans=await DB.getAll("gradingPlans");
  for(const p of plans){
    if(!p.graduationTrack){p.graduationTrack="adulto";await DB.rawPut("gradingPlans",p)}
  }
}


async function ensureRoleHierarchyV16(){
  const settings=await getSettings();
  if(settings.roleHierarchyV16)return;
  const users=await DB.getAll("users");
  if(users.length){
    for(const u of users){
      if(u.role==="admin"){
        u.role="professor";
        u.legacyRoleMigrated=true;
        delete u.isOwner;
        await DB.put("users",u);
      }
    }
  }
  settings.roleHierarchyV16=true;
  settings.academyAccessStatus=settings.academyAccessStatus||"active";
  settings.publicAppUrl=settings.publicAppUrl||"";
  await DB.put("settings",settings);
}
async function ensureV027Migrations(){
  const settings=await getSettings();
  if(settings.v027Migration)return;
  const blue=await DB.getOne("gradingPlans","gp-blue-2026");
  if(blue){
    const old=Array.isArray(blue.theory)&&blue.theory.length===2&&blue.theory[0]==="Regras e pontuação"&&blue.theory[1]==="Conduta e segurança no tatame";
    if(old){blue.theory=[];blue.theoryNote="Conteúdo teórico a definir pela academia.";await DB.rawPut("gradingPlans",blue)}
  }
  for(const r of await DB.getAll("sequenceRules")){
    if(["seq-5","seq-10","seq-20"].includes(r.id)&&r.active!==false){
      r.active=false;r.note="Desativado: não consta na tabela oficial de pontuação da unidade.";await DB.rawPut("sequenceRules",r)
    }
  }
  settings.academyId=window.TONICAO_ACADEMY_ID||settings.academyId||"tonicao-sul-ilha";
  settings.v027Migration=true;
  await DB.rawPut("settings",settings);
}
function currentAcademyIdV027(){
  return String(window.TONICAO_ACADEMY_ID||"tonicao-sul-ilha").replace(/[^a-z0-9_-]/g,"-")||"tonicao-sul-ilha"
}
function tenantUrlV027(base,params={}){
  const u=new URL(base,location.href);
  u.search="";u.hash="";
  u.searchParams.set("academy",currentAcademyIdV027());
  for(const [k,v] of Object.entries(params))if(v!==undefined&&v!==null&&v!=="")u.searchParams.set(k,String(v));
  return u.href
}
function phoneForWhatsApp(phone){
  let d=String(phone||"").replace(/\D/g,"");
  if((d.length===10||d.length===11)&&!d.startsWith("55"))d="55"+d;
  return d
}
async function getPublicAppUrl(){
  const s=await getSettings();
  if(s.publicAppUrl)return s.publicAppUrl.replace(/\/+$/,"");
  if(location.protocol==="http:"||location.protocol==="https:")return location.href.split("?")[0].split("#")[0];
  return ""
}
async function buildInviteShareData(student){
  const settings=await getSettings();
  const token=await TonicaoSync.buildInviteToken(student,settings);
  const base=await getPublicAppUrl();
  const link=base?tenantUrlV027(base,{invite:token}):"";
  const academy=settings.academyName||settings.academy||"academia";
  const text=`Olá, ${student.name}! Você foi cadastrado na ${academy}. ${link?`Acesse o aplicativo: ${link}`:`Use o convite abaixo no aplicativo:`}${link?"":`\n\n${token}`}`;
  return {token,link,text}
}
async function shareStudentInvite(studentId){
  const student=await DB.getOne("students",studentId);if(!student)return;
  const data=await buildInviteShareData(student);
  if(navigator.share&&data.link){
    try{await navigator.share({title:"Convite da academia",text:data.text,url:data.link});return}catch(e){}
  }
  const phone=phoneForWhatsApp(student.phone);
  if(phone){window.open(`https://wa.me/${phone}?text=${encodeURIComponent(data.text)}`,"_blank");return}
  if(data.link)await navigator.clipboard?.writeText(data.link);else await navigator.clipboard?.writeText(data.token);
  toast("Convite copiado.")
}

function localInviteToken(){return crypto?.randomUUID?.()||(`invite-${Date.now()}-${Math.random().toString(36).slice(2)}`)}
async function buildCompletionLink(request){
  const base=await getPublicAppUrl();
  if(!base)return "";
  return tenantUrlV027(base,{complete:request.inviteToken})
}
async function inviteMessageForRequest(request){
  const settings=await getSettings(),link=await buildCompletionLink(request);
  const academy=settings.academyName||settings.academy||"academia";
  const text=`Olá, ${request.name}! O Professor iniciou seu cadastro na ${academy}. Para concluir, abra o link e preencha seus dados: ${link||"[link público ainda não configurado]"}. Depois o Professor apenas confirma seu cadastro.`;
  return {link,text}
}
async function shareRegistrationInvite(requestId){
  const r=await DB.getOne("registrationRequests",requestId);if(!r)return;
  const data=await inviteMessageForRequest(r);
  if(!data.link){toast("Configure o link público do aplicativo no Administrador/Dono.");return}
  if(navigator.share){
    try{await navigator.share({title:"Concluir cadastro na academia",text:data.text,url:data.link});return}catch(e){}
  }
  const phone=phoneForWhatsApp(r.phone);
  if(phone){window.open(`https://wa.me/${phone}?text=${encodeURIComponent(data.text)}`,"_blank");return}
  await navigator.clipboard?.writeText(data.text);toast("Mensagem de convite copiada.")
}

async function shareSelfRegistrationLink(){
  const settings=await getSettings(),base=await getPublicAppUrl();
  if(!base){toast("O Administrador/Dono precisa configurar o link público do aplicativo.");return}
  const link=tenantUrlV027(base,{join:"1"});
  const text=`Faça seu pré-cadastro na ${settings.academyName||"academia"}: ${link}`;
  if(navigator.share){try{await navigator.share({title:"Cadastro na academia",text,url:link});return}catch(e){}}
  await navigator.clipboard?.writeText(link);toast("Link de auto-cadastro copiado.")
}

function inviteServerFromUrl(){return new URLSearchParams(location.search).get("server")||(window.TonicaoFirebase?.configured?"firebase":"")}
async function findInviteByToken(token){
  const local=(await DB.getAll("registrationRequests")).find(r=>r.inviteToken===token);
  if(local){
    if(local.status==="invited"&&Number(local.expiresAtMs||0)>0&&Date.now()>Number(local.expiresAtMs))return {...local,status:"expired"};
    return local
  }
  const endpoint=inviteServerFromUrl();
  if(endpoint&&navigator.onLine){
    try{
      const data=DB.clean(await TonicaoRemoteAuth.getRegistrationInvite(token,endpoint));
      if(data?.request){
        const r={...data.request,remoteId:data.request.id,source:"student_completion_remote"};
        await DB.put("registrationRequests",r);return r
      }
    }catch(e){}
  }
  return null
}
function publicBeltOptions(track,current=""){
  return beltsForTrack(track).map(b=>`<option ${b===current?"selected":""}>${b}</option>`).join("")
}
async function renderStudentCompletionGate(token){
  const gate=document.getElementById("authGate"),host=document.getElementById("authGateContent");
  gate.classList.add("show");document.body.classList.add("auth-locked");
  const r=await findInviteByToken(token);
  if(!r){
    host.innerHTML=`<h2>Convite de cadastro</h2><div class="notice payment"><strong>Convite indisponível</strong><div class="small">O convite pode ter vencido, já ter sido usado ou o servidor oficial ainda não estar configurado.</div></div>`;
    return false
  }
  if(r.status==="approved"){
    host.innerHTML=`<h2>✅ Cadastro aprovado</h2><p><strong>${r.name}</strong>, seu cadastro foi confirmado pelo Professor.</p><p class="small muted">Agora você pode entrar no aplicativo com a conta disponibilizada pela academia ou usar a opção Google quando estiver configurada.</p><button class="btn primary full" onclick="clearCompletionLink()">Ir para o login</button>`;
    return false
  }
  if(r.status==="rejected"){
    host.innerHTML=`<h2>Cadastro não aprovado</h2><p>Entre em contato com o Professor para verificar seu cadastro.</p>`;
    return false
  }
  if(r.status==="expired"){
    host.innerHTML=`<h2>Convite vencido</h2><div class="notice payment"><strong>Este link expirou.</strong><div class="small">Por segurança, peça ao Professor um novo convite de cadastro.</div></div>`;
    return false
  }
  if(["awaiting_approval","pending"].includes(r.status)){
    host.innerHTML=`<h2>Cadastro enviado</h2><div class="notice grade"><strong>⏳ Aguardando confirmação do Professor</strong><div class="small">Seus dados já foram enviados. O Professor precisa apenas confirmar.</div></div><p><strong>${r.name}</strong><br>${r.phone||""}</p><button class="btn secondary full" onclick="refreshCompletionStatus('${token}')">Atualizar status</button>`;
    return false
  }

  const track=r.graduationTrack||"adulto";
  host.innerHTML=`<h2>Complete seu cadastro</h2>
    <p class="muted">O Professor já iniciou seu cadastro. Agora complete seus dados e envie para confirmação.</p>
    <div class="field"><label>Nome completo</label><input id="icName" value="${r.name||""}"></div>
    <div class="field"><label>Telefone / WhatsApp</label><input id="icPhone" inputmode="tel" value="${r.phone||""}"></div>
    <div class="field"><label>E-mail</label><input id="icEmail" type="email" value="${r.email||""}" placeholder="Opcional"></div>
    <div class="field"><label>Data de nascimento</label><input id="icBirth" type="date" value="${r.birth||""}"></div>
    <div class="field"><label>Trilha</label><select id="icTrack" onchange="updateCompletionBelts()"><option value="adulto" ${track==="adulto"?"selected":""}>Adulto</option><option value="kids" ${track==="kids"?"selected":""}>Kids</option></select></div>
    <div class="field"><label>Faixa atual</label><select id="icBelt">${publicBeltOptions(track,r.belt||"Branca")}</select></div>
    <div class="field"><label>Graus</label><input id="icStripes" type="number" min="0" max="4" value="${r.stripes||0}"></div>
    <div id="guardianFields" style="${track==="kids"?"":"display:none"}">
      <div class="field"><label>Nome do responsável</label><input id="icGuardianName" value="${r.guardianName||""}"></div>
      <div class="field"><label>Telefone do responsável</label><input id="icGuardianPhone" inputmode="tel" value="${r.guardianPhone||""}"></div>
    </div>
    <div class="field"><label>Contato de emergência</label><input id="icEmergencyName" value="${r.emergencyName||""}" placeholder="Nome"></div>
    <div class="field"><label>Telefone de emergência</label><input id="icEmergencyPhone" inputmode="tel" value="${r.emergencyPhone||""}"></div>
    <div class="field"><label>Observação</label><textarea id="icNote" placeholder="Alguma informação importante para o Professor">${r.note||""}</textarea></div>
    <label class="notice" style="display:block"><input id="icPrivacyConsent" type="checkbox" style="margin-right:8px"> Autorizo o uso destes dados para cadastro, comunicação, presença, graduação e gestão da academia, conforme a política de privacidade.</label>
    <button class="btn primary full" onclick="submitInvitedStudentCompletion('${token}')">Enviar para confirmação do Professor</button>`;
  return false
}
function updateCompletionBelts(){
  const track=document.getElementById("icTrack")?.value||"adulto",sel=document.getElementById("icBelt");if(sel)sel.innerHTML=publicBeltOptions(track,"Branca");
  const guardian=document.getElementById("guardianFields");if(guardian)guardian.style.display=track==="kids"?"block":"none"
}
async function submitInvitedStudentCompletion(token){
  const name=document.getElementById("icName").value.trim(),phone=document.getElementById("icPhone").value.trim(),birth=document.getElementById("icBirth").value;
  if(!name||!phone||!birth){toast("Preencha nome, telefone e data de nascimento.");return}
  const track=document.getElementById("icTrack").value;
  if(!document.getElementById("icPrivacyConsent")?.checked){toast("Confirme o consentimento de privacidade para continuar.");return}
  const gName=track==="kids"?document.getElementById("icGuardianName").value.trim():"";
  const gPhone=track==="kids"?document.getElementById("icGuardianPhone").value.trim():"";
  if(track==="kids"&&(!gName||!gPhone)){toast("Para Kids, informe nome e telefone do responsável.");return}
  const consentAt=new Date().toISOString();
  const payload={
    name,phone,email:document.getElementById("icEmail").value.trim(),birth,
    graduationTrack:track,belt:document.getElementById("icBelt").value,stripes:Number(document.getElementById("icStripes").value||0),
    guardianName:gName,
    guardianPhone:gPhone,
    emergencyName:document.getElementById("icEmergencyName").value.trim(),
    emergencyPhone:document.getElementById("icEmergencyPhone").value.trim(),
    note:document.getElementById("icNote").value.trim(),privacyConsentAt:consentAt,guardianConsentAt:track==="kids"?consentAt:""
  };
  const endpoint=inviteServerFromUrl();
  let req=await findInviteByToken(token);
  try{
    if(endpoint&&navigator.onLine){
      const remote=await TonicaoRemoteAuth.completeRegistrationInvite(token,payload,endpoint);
      if(remote?.request)req={...req,...remote.request,remoteId:remote.request.id}
    }else req={...req,...payload,status:"awaiting_approval",completedAt:new Date().toISOString()};
  }catch(e){toast(e.message||"Não foi possível enviar o cadastro.");return}
  await DB.put("registrationRequests",{...req,...payload,status:"awaiting_approval",completedAt:req.completedAt||new Date().toISOString()});
  await createTargetedNotification("registration",`Cadastro completo: ${name}`,`O aluno terminou de preencher os dados. Falta apenas sua confirmação.`,{targetRole:"professor",refId:req.id});
  await renderStudentCompletionGate(token)
}
async function refreshCompletionStatus(token){
  const endpoint=inviteServerFromUrl();
  if(endpoint){
    const old=(await DB.getAll("registrationRequests")).find(r=>r.inviteToken===token);
    if(old)await DB.removeOne("registrationRequests",old.id);
  }
  await renderStudentCompletionGate(token)
}
function clearCompletionLink(){
  const u=new URL(location.href);u.searchParams.delete("complete");history.replaceState(null,"",u.pathname+(u.search||"")+u.hash);location.reload()
}

async function studentSelfRegistrationModal(){
  showModal(`<h3>Quero me cadastrar</h3><p class="small muted">Envie seus dados. O Professor precisa aprovar antes da liberação do cadastro.</p>
    <div class="field"><label>Nome completo</label><input id="srName"></div>
    <div class="field"><label>Telefone / WhatsApp</label><input id="srPhone" inputmode="tel" placeholder="(48) 99999-9999"></div>
    <div class="field"><label>Data de nascimento</label><input id="srBirth" type="date"></div>
    <div class="field"><label>Trilha</label><select id="srTrack" onchange="toggleSelfRegGuardianV027()"><option value="adulto">Adulto</option><option value="kids">Kids</option></select></div>
    <div id="srGuardianWrap" style="display:none">
      <div class="field"><label>Nome do responsável</label><input id="srGuardianName"></div>
      <div class="field"><label>Telefone do responsável</label><input id="srGuardianPhone" inputmode="tel"></div>
    </div>
    <div class="field"><label>Observação</label><textarea id="srNote" placeholder="Opcional"></textarea></div>
    <label class="notice" style="display:block"><input id="srPrivacyConsent" type="checkbox" style="margin-right:8px"> Autorizo o uso destes dados para o pré-cadastro e gestão da academia. Para Kids, esta confirmação deve ser feita pelo responsável.</label>
    <button class="btn primary full" onclick="submitStudentRegistration()">Enviar para o Professor</button>`)
}
function toggleSelfRegGuardianV027(){
  const wrap=document.getElementById("srGuardianWrap");if(wrap)wrap.style.display=document.getElementById("srTrack")?.value==="kids"?"block":"none"
}
async function submitStudentRegistration(){
  const name=document.getElementById("srName").value.trim(),phone=document.getElementById("srPhone").value.trim(),birth=document.getElementById("srBirth").value;
  if(!name||!phone||!birth){toast("Informe nome, telefone e data de nascimento.");return}
  if(!document.getElementById("srPrivacyConsent")?.checked){toast("Confirme o consentimento de privacidade para continuar.");return}
  const track=document.getElementById("srTrack").value;
  const guardianName=track==="kids"?document.getElementById("srGuardianName").value.trim():"";
  const guardianPhone=track==="kids"?document.getElementById("srGuardianPhone").value.trim():"";
  if(track==="kids"&&(!guardianName||!guardianPhone)){toast("Para Kids, informe nome e telefone do responsável.");return}
  const consentAt=new Date().toISOString(),settings=await getSettings();
  const req={id:uid("reg"),academyId:settings.academyId||currentAcademyIdV027(),name,phone,birth,graduationTrack:track,guardianName,guardianPhone,note:document.getElementById("srNote").value.trim(),privacyConsentAt:consentAt,guardianConsentAt:track==="kids"?consentAt:"",status:"pending",source:"self",createdAt:new Date().toISOString()};
  try{
    if((settings.cloudEndpoint||window.TonicaoFirebase?.configured)&&navigator.onLine){
      const remote=await TonicaoRemoteAuth.submitRegistrationRequest(req);
      if(remote?.request?.id)req.remoteId=remote.request.id;
    }
  }catch(e){toast(e.message||"Não foi possível enviar agora. O pedido ficou salvo neste aparelho.")}
  await DB.put("registrationRequests",req);
  await createTargetedNotification("registration",`Novo pré-cadastro: ${name}`,`${phone} enviou uma solicitação para entrar na academia.`,{targetRole:"professor",refId:req.id});
  closeModal();toast("Pré-cadastro enviado. Aguarde a aprovação do Professor.")
}
async function refreshRemoteRegistrationRequests(){
  const settings=await getSettings();
  if(!settings.cloudSessionToken||!navigator.onLine)return;
  try{
    const r=await TonicaoRemoteAuth.listRegistrationRequests();
    for(const x of r.requests||[])await DB.put("registrationRequests",{...x,id:x.id,remoteId:x.id,academyId:x.academyId,name:x.name,phone:x.phone,email:x.email||"",birth:x.birth||"",graduationTrack:x.graduationTrack||"adulto",belt:x.belt||"Branca",stripes:Number(x.stripes||0),guardianName:x.guardianName||"",guardianPhone:x.guardianPhone||"",emergencyName:x.emergencyName||"",emergencyPhone:x.emergencyPhone||"",note:x.note||"",inviteToken:x.inviteToken||"",status:x.status||"pending",source:x.source||"remote",createdAt:x.createdAt,completedAt:x.completedAt||""});
  }catch(e){}
}
async function approveRegistrationRequest(requestId){
  await TonicaoAuth.requirePerm("approve_students");
  const r=await DB.getOne("registrationRequests",requestId);if(!r)return;
  const duplicate=(await getStudents()).find(s=>phoneForWhatsApp(s.phone)===phoneForWhatsApp(r.phone));
  if(duplicate){toast("Já existe um aluno com este telefone.");return}
  const track=r.graduationTrack||"adulto",belt=r.belt||"Branca";
  const student={
    id:uid("s"),name:r.name,nickname:r.name.split(" ")[0],phone:r.phone||"",email:r.email||"",birth:r.birth||"",
    graduationTrack:track,belt,stripes:Number(r.stripes||0),classesInBelt:0,targetClasses:targetClassesFor(track,belt),streak:0,points:0,
    guardianName:r.guardianName||"",guardianPhone:r.guardianPhone||"",emergencyName:r.emergencyName||"",emergencyPhone:r.emergencyPhone||"",privacyConsentAt:r.privacyConsentAt||"",guardianConsentAt:r.guardianConsentAt||"",
    dueDay:10,payment:"verificar",active:true,photo:"",registrationRequestId:r.id,note:r.note||""
  };
  await DB.put("students",student);
  r.status="approved";r.studentId=student.id;r.decidedAt=new Date().toISOString();await DB.put("registrationRequests",r);
  try{if(r.remoteId)await TonicaoRemoteAuth.decideRegistrationRequest({requestId:r.remoteId,status:"approved",studentId:student.id})}catch(e){}
  await TonicaoAuth.audit("student.request.approve","Cadastro de aluno confirmado pelo Professor",student.id,{requestId});
  await createTargetedNotification("student_approved","Cadastro aprovado","Seu cadastro foi confirmado pelo Professor.",{targetStudentId:student.id,refId:r.id});
  toast("✓ Cadastro confirmado.");await renderAll()
}
async function rejectRegistrationRequest(requestId){
  await TonicaoAuth.requirePerm("approve_students");
  const r=await DB.getOne("registrationRequests",requestId);if(!r)return;
  r.status="rejected";r.decidedAt=new Date().toISOString();await DB.put("registrationRequests",r);
  try{if(r.remoteId)await TonicaoRemoteAuth.decideRegistrationRequest({requestId:r.remoteId,status:"rejected"})}catch(e){}
  toast("Solicitação recusada.");renderStudents()
}
async function renderAcademyAccessGate(user){
  const gate=document.getElementById("academyBlockGate"),host=document.getElementById("academyBlockContent"),settings=await getSettings();
  if(user?.role==="admin"||settings.academyAccessStatus!=="blocked"){
    gate?.classList.remove("show");document.body.classList.remove("academy-locked");return true
  }
  host.innerHTML=`<div class="block-icon">🔒</div><h2>Acesso da academia suspenso</h2><p>${settings.academyAccessReason||"Acesso temporariamente suspenso. Fale com o responsável pelo aplicativo."}</p><p class="small muted">Nenhum dado foi apagado.</p><button class="btn secondary full" onclick="logoutAuth()">Sair</button>`;
  gate.classList.add("show");document.body.classList.add("academy-locked");return false
}

async function getSettings(){return(await DB.getOne("settings","app"))||{id:"app",role:"professor",academyId:"tonicao-sul-ilha",academyName:"Tonicão Team",unitName:"Sul da Ilha"}}
async function getStudents(){return(await DB.getAll("students")).filter(s=>s.active!==false)}
async function getAttendance(){return await DB.getAll("attendance")}
async function getLedger(){return await DB.getAll("pointsLedger")}
async function getSessions(){return await DB.getAll("classSessions")}
async function getCurrentStudent(){
  const settings=await getSettings();applyBranding(settings);
  const students=await getStudents();
  if(settings.linkedStudentId){
    const found=students.find(s=>s.id===settings.linkedStudentId);
    if(found) return found;
  }
  const me=await TonicaoAuth.currentUser();
  if(me?.role==="aluno"||settings.role==="aluno")return null;
  return students[0]||null;
}
async function setRole(role){const s=await getSettings();s.role=role;await DB.put("settings",s);await renderAll()}
function sixDigitCode(){return String(Math.floor(100000+Math.random()*900000))}
function activeSession(sessions){const now=Date.now();return sessions.filter(s=>s.status==="open"&&(!s.expiresAt||new Date(s.expiresAt).getTime()>now)).sort((a,b)=>new Date(b.createdAt)-new Date(a.createdAt))[0]||null}
function currentMonthAttendance(att,studentId){return att.filter(a=>a.studentId===studentId&&a.date.startsWith(monthKey())&&a.status==="approved").length}
function birthdaysToday(students){const d=new Date(),md=String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");return students.filter(s=>s.birth&&s.birth.slice(5)===md)}
function paymentsToday(students){const day=new Date().getDate();return students.filter(s=>Number(s.dueDay)===day&&s.payment!=="liberado")}
async function dueGradingReminders(){const all=(await DB.getAll("gradingReminders")).filter(r=>r.status==="active");return all.filter(r=>(r.mode==="classes"&&Number(r.remaining)<=0)||(r.mode==="date"&&r.date&&r.date<=todayISO()))}

function notificationIcon(kind){
  const icons={birthday:"🎂",payment:"💳",grading:"🥋",registration:"📥",student_approved:"✅",material:"📚",exam:"📅",evaluation:"📝",graduated:"🏅",system:"🔔"};
  return icons[kind]||"🔔"
}
async function notificationTargetsCurrentUser(n){
  const me=await TonicaoAuth.currentUser();if(!me)return false;
  if(n.targetUserId&&n.targetUserId===me.id)return true;
  if(n.targetRole&&n.targetRole===me.role)return true;
  if(me.role==="aluno"){
    const s=await getCurrentStudent();
    return !!s && n.targetStudentId===s.id;
  }
  return !n.targetRole&&!n.targetStudentId&&!n.targetUserId;
}
async function storeLocalNotification(n){
  const value={
    id:n.id||uid("noti"),kind:n.kind||"system",title:n.title||"Aviso",body:n.body||"",
    targetRole:n.targetRole||"",targetStudentId:n.targetStudentId||"",targetUserId:n.targetUserId||"",
    refId:n.refId||"",createdAt:n.createdAt||new Date().toISOString(),date:n.date||todayISO(),read:!!n.read,remoteId:n.remoteId||""
  };
  if(await DB.getOne("notifications",value.id))return value;
  await DB.rawPut("notifications",value);
  return value;
}
async function createTargetedNotification(kind,title,body,target={}){
  const n=await storeLocalNotification({kind,title,body,...target});
  if(await notificationTargetsCurrentUser(n))await TonicaoNotifications?.notifyDevice?.(n);
  return n
}
async function visibleNotifications(){
  const all=(await DB.getAll("notifications")).sort((a,b)=>String(b.createdAt||b.date||"").localeCompare(String(a.createdAt||a.date||"")));
  const out=[];for(const n of all)if(await notificationTargetsCurrentUser(n))out.push(n);return out
}
async function markNotificationRead(id){
  const n=await DB.getOne("notifications",id);if(!n)return;
  n.read=true;n.readAt=new Date().toISOString();await DB.rawPut("notifications",n);
  try{if(n.remoteId)await TonicaoRemoteAuth.markRemoteNotificationsRead([n.remoteId])}catch(e){}
  renderMore("notifications")
}
async function markAllNotificationsRead(){
  const ns=await visibleNotifications(),remote=[];
  for(const n of ns){if(!n.read){n.read=true;n.readAt=new Date().toISOString();await DB.rawPut("notifications",n);if(n.remoteId)remote.push(n.remoteId)}}
  try{if(remote.length)await TonicaoRemoteAuth.markRemoteNotificationsRead(remote)}catch(e){}
  renderMore("notifications")
}

async function buildProfessorAlerts(){
  const students=await getStudents(), alerts=[];
  birthdaysToday(students).forEach(s=>alerts.push({id:`birthday-${s.id}-${todayISO()}`,kind:"birthday",title:`Aniversário de ${s.name}`,body:"Hoje é aniversário deste aluno.",targetRole:"professor",refId:s.id}));
  paymentsToday(students).forEach(s=>alerts.push({id:`payment-${s.id}-${todayISO()}`,kind:"payment",title:`Verificar pagamento: ${s.name}`,body:`Vencimento configurado para o dia ${s.dueDay}.`,targetRole:"professor",refId:s.id}));
  for(const r of await dueGradingReminders()){const s=students.find(x=>x.id===r.studentId);if(s)alerts.push({id:`grading-${r.id}-${todayISO()}`,kind:"grading",title:`Reavaliar graduação: ${s.name}`,body:r.note||"O prazo de reavaliação chegou.",targetRole:"professor",refId:s.id})}
  for(const a of alerts)await storeLocalNotification({...a,date:todayISO(),read:false});
  return alerts;
}
async function enableDeviceNotifications(){
  try{
    const status=await TonicaoNotifications.enable();
    toast(status.remotePush?"Notificações e push remoto ativados.":status.permission==="granted"?"Notificações ativadas. Push remoto ainda não configurado no servidor.":"Permissão não concedida.");
    await dispatchDeviceAlerts(true)
  }catch(e){toast(e.message||"Não foi possível ativar notificações.")}
}
async function dispatchDeviceAlerts(force=false){
  const me=await TonicaoAuth.currentUser();if(me?.role!=="professor")return;
  const alerts=await buildProfessorAlerts();if(!alerts.length)return;
  const settings=await getSettings(),key=todayISO()+":"+alerts.map(a=>a.id).join("|");if(!force&&settings.lastDeviceAlertKey===key)return;
  const visible=[];for(const a of alerts)if(await notificationTargetsCurrentUser(a))visible.push(a);
  if(!visible.length)return;
  const n=visible.length===1?visible[0]:{kind:"system",title:`${visible.length} avisos da academia`,body:"Abra o aplicativo para ver aniversários, pagamentos e reavaliações.",id:"tonicao-daily-"+todayISO()};
  await TonicaoNotifications.notifyDevice(n);
  settings.lastDeviceAlertKey=key;await DB.put("settings",settings);
}

async function renderProfessorHome(){
  const students=await getStudents();
  const attendance=await getAttendance();
  const sessions=await getSessions();
  const today=todayISO();
  const todayCount=attendance.filter(a=>a.date===today&&a.status==="approved").length;
  const birthdays=birthdaysToday(students);
  const payments=students.filter(s=>s.payment!=="liberado");
  const me=await TonicaoAuth.currentUser();
  const pendingRegistrations=(await DB.getAll("registrationRequests")).filter(r=>["pending","awaiting_approval","invited"].includes(r.status));
  const reminders=(await DB.getAll("gradingReminders")).filter(r=>r.status==="active");
  const gradingAssignments=await DB.getAll("gradingAssignments");
  const scheduled=gradingAssignments.filter(a=>a.examDate&&a.status!=="graduado").sort((a,b)=>String(a.examDate).localeCompare(String(b.examDate)));
  const openSession=activeSession(sessions);
  const top=[...students].sort((a,b)=>(b.points||0)-(a.points||0)).slice(0,3);
  const monthTotal=attendance.filter(a=>String(a.date||"").startsWith(monthKey())).length;

  document.getElementById("home").innerHTML=`
    ${me?.role==="admin"?`<div class="notice owner-mode"><strong>🛠 Administrador/Dono — modo de manutenção</strong><div class="small">Você pode visualizar toda a operação, mas presença, pontuação e decisões de graduação pertencem ao Professor.</div></div>`:""}
    <div class="hero dashboard-hero">
      <div class="hero-row">
        <img class="avatar" src="${(await getSettings()).logoDataUrl||"./assets/logo-tonicao.jpg"}" alt="">
        <div>
          <h2>Painel do professor</h2>
          <p>${new Date().toLocaleDateString("pt-BR",{weekday:"long",day:"2-digit",month:"long"})}</p>
        </div>
      </div>
      <div class="dashboard-actions">
        <button class="btn primary" onclick="goPage('checkin')">${openSession?"Abrir check-in":"Iniciar aula"}</button>
        <button class="btn secondary" onclick="goPage('students')">Alunos</button>
        <button class="btn secondary" onclick="goPage('graduation')">Graduações</button>
      </div>
    </div>

    ${openSession?`
      <div class="notice grade">
        <strong>🥋 Aula aberta agora: ${openSession.title}</strong>
        <div class="small">Código ${openSession.code} • ${todayCount} presença(s)</div>
        <div class="actions"><button class="btn primary" onclick="goPage('checkin')">Ver aula</button></div>
      </div>`:""}

    <div class="dashboard-kpis">
      <div class="card dash-kpi"><span>Hoje</span><strong>${todayCount}</strong><small>check-ins</small></div>
      <div class="card dash-kpi"><span>No mês</span><strong>${monthTotal}</strong><small>presenças</small></div>
      <div class="card dash-kpi"><span>Ativos</span><strong>${students.length}</strong><small>alunos</small></div>
      <div class="card dash-kpi"><span>Atenção</span><strong>${payments.length+reminders.length+scheduled.length+pendingRegistrations.length}</strong><small>pendências/provas</small></div>
    </div>

    <div class="section-title"><h2>Precisa de atenção</h2></div>
    <div class="attention-grid">
      <div class="card attention-card" onclick="renderMore('notifications');goPage('more')">
        <div class="attention-icon">🎂</div><strong>${birthdays.length}</strong><span>Aniversário(s) hoje</span>
      </div>
      <div class="card attention-card" onclick="goPage('students')">
        <div class="attention-icon">💳</div><strong>${payments.length}</strong><span>Pagamento(s) a verificar</span>
      </div>
      <div class="card attention-card" onclick="goPage('students')">
        <div class="attention-icon">📥</div><strong>${pendingRegistrations.length}</strong><span>Pré-cadastro(s)</span>
      </div>
      <div class="card attention-card" onclick="goPage('graduation')">
        <div class="attention-icon">🥋</div><strong>${reminders.length+scheduled.length}</strong><span>Graduação / prova(s)</span>
      </div>
      <div class="card attention-card" onclick="goPage('more');renderMore('reports')">
        <div class="attention-icon">📊</div><strong>→</strong><span>Relatórios</span>
      </div>
    </div>

    ${birthdays.map(s=>`<div class="notice birthday"><strong>🎂 ${s.name}</strong><div class="small">Aniversariante de hoje.</div><div class="actions"><button class="btn secondary" onclick="birthdayMessage('${s.id}')">Mensagem de parabéns</button></div></div>`).join("")}

    ${scheduled.length?`<div class="section-title"><h2>📅 Próximas avaliações</h2><button class="btn secondary" onclick="goPage('graduation')">Abrir graduações</button></div><div class="list">${scheduled.slice(0,4).map(a=>{const s=students.find(x=>x.id===a.studentId);return `<div class="list-item"><div class="icon">🥋</div><div><strong>${s?.name||"Aluno"}</strong><span class="small muted">${examWhenText(a)}</span></div></div>`}).join("")}</div>`:""}

    <div class="section-title"><h2>🏆 Destaques anuais</h2><button class="btn secondary" onclick="goPage('more');renderMore('ranking')">Ranking completo</button></div>
    <div class="list">${top.map((s,i)=>`
      <div class="list-item rank"><div class="pos">${i+1}º</div><div><strong>${s.name}</strong><span class="small muted">${s.belt} • ${s.stripes||0} grau(s)</span></div><strong>${s.points||0} pts</strong></div>
    `).join("")}</div>
  `;
}

async function renderStudentHome(){
  const s=await getCurrentStudent();
  if(!s){document.getElementById("home").innerHTML=`<div class="card"><h3>Nenhum aluno vinculado</h3><p class="muted">Peça ao Administrador para vincular esta conta à ficha correta.</p></div>`;return}
  const settings=await getSettings(),progress=Math.min(100,Math.round(((s.classesInBelt||0)/(s.targetClasses||1))*100));
  document.getElementById("home").innerHTML=`<div class="hero"><div class="hero-row">${studentAvatar(s)}<div><h2>${s.name}</h2><p>${settings.academyName||"Tonicão Team"} • ${settings.unitName||"Sul da Ilha"}</p></div></div><div class="belt">${s.belt} • ${s.stripes} grau(s) • ${TRACK_LABEL[s.graduationTrack||"adulto"]}</div></div>
  <div class="grid"><div class="card"><div class="muted small">Treinos na faixa</div><div class="kpi">${s.classesInBelt||0}</div></div><div class="card"><div class="muted small">Sequência</div><div class="kpi">🔥 ${s.streak||0}</div></div><div class="card"><div class="muted small">Pontos</div><div class="kpi">${s.points||0}</div></div><div class="card"><div class="muted small">Progresso</div><div class="kpi">${progress}%</div></div></div>
  <div class="card"><h3>Referência para avaliação</h3><div class="progress"><span style="width:${progress}%"></span></div><p class="small muted">Presença e tempo são referências. A graduação é sempre decisão do professor.</p></div>`
}

async function renderCheckin(){
  const students=await getStudents(),settings=await getSettings(),session=activeSession(await getSessions()),currentStudent=await getCurrentStudent();
  if(settings.role==="aluno"){
    document.getElementById("checkin").innerHTML=`<div class="section-title"><h2>Check-in</h2><span class="pill ${session?"green":"amber"}">${session?"aula aberta":"aguardando aula"}</span></div>${session?`<div class="card"><h3>${session.title}</h3><p class="small muted">Código válido até ${new Date(session.expiresAt).toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}</p><div class="field"><label>Código da aula</label><input id="studentClassCode" inputmode="numeric" maxlength="6" placeholder="000000"></div><div class="actions"><button class="btn primary" onclick="studentCheckinWithInput('${currentStudent?.id||''}')">Confirmar</button><button class="btn secondary" onclick="startQrScanner('${currentStudent?.id||''}')">📷 Ler QR</button></div></div>`:`<div class="card"><h3>Nenhuma aula aberta</h3><p class="muted">Quando o professor iniciar a aula, você poderá usar o código ou ler o QR.</p></div>`}`;return;
  }
  const att=await getAttendance();
  document.getElementById("checkin").innerHTML=`<div class="section-title"><h2>Check-in do treino</h2><span class="pill green">${att.filter(a=>a.date===todayISO()&&a.status==="approved").length} presente(s)</span></div>${session?`<div class="card session-card"><div class="small muted">AULA ABERTA</div><h3>${session.title}</h3><div id="sessionQr" class="qr-host"></div><div class="session-code">${session.code}</div><p class="small muted">O aluno pode ler este QR com o próprio celular ou digitar o código.</p><div class="actions"><button class="btn danger" onclick="closeClassSession('${session.id}')">Encerrar</button><button class="btn secondary" onclick="copySessionCode('${session.code}')">Copiar código</button></div></div>`:`<div class="card"><h3>Iniciar aula</h3><div class="field"><label>Nome da aula</label><input id="classTitle" value="Jiu-Jitsu - Treino ${new Date().toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"})}"></div><div class="field"><label>Validade</label><select id="classDuration"><option value="60">1 hora</option><option value="90" selected>1h30</option><option value="120">2 horas</option></select></div><button class="btn primary full" onclick="openClassSession()">Abrir aula e gerar QR</button></div>`}
  <div class="section-title"><h2>Presença manual</h2></div><div class="list">${students.map(s=>`<div class="list-item student-row">${studentAvatar(s)}<div class="meta"><strong>${s.name}</strong><span class="small muted">${s.belt} • ${s.stripes} grau(s) • ${TRACK_LABEL[s.graduationTrack||"adulto"]}</span></div><button class="btn primary" onclick="profCheckin('${s.id}')">Presente</button></div>`).join("")}</div>`;
  if(session)setTimeout(()=>drawSessionQR(session),0);
}
async function openClassSession(){if(!(await guard("attendance")))return;const title=document.getElementById("classTitle")?.value?.trim()||"Treino de Jiu-Jitsu",duration=+(document.getElementById("classDuration")?.value||90),now=new Date(),exp=new Date(now.getTime()+duration*60000),cur=activeSession(await getSessions());if(cur)await closeClassSession(cur.id,true);await DB.put("classSessions",{id:uid("cls"),title,code:sixDigitCode(),date:todayISO(),startTime:now.toTimeString().slice(0,5),createdAt:now.toISOString(),expiresAt:exp.toISOString(),status:"open"});toast("Aula aberta e QR gerado.");renderAll()}
async function closeClassSession(id,silent=false){if(!(await guard("attendance")))return;const s=await DB.getOne("classSessions",id);if(s){s.status="closed";s.closedAt=new Date().toISOString();await DB.put("classSessions",s)}if(!silent)toast("Aula encerrada.");renderAll()}
function copySessionCode(code){navigator.clipboard?.writeText(code);toast("Código copiado.")}
async function studentCheckinWithInput(id){await studentCheckinByCode(id,(document.getElementById("studentClassCode")?.value||"").trim())}
async function studentCheckinByCode(id,code){const session=activeSession(await getSessions());if(!session){toast("Não há aula aberta.");return}if(!/^\d{6}$/.test(code)){toast("Digite os 6 números do código.");return}if(session.code&&code!==session.code){toast("Código inválido.");return}const s=await DB.getOne("students",id);if(!s){toast("Sua conta ainda não está vinculada a uma ficha de aluno. Fale com o Professor.");return}if(["pendente","verificar","bloqueado"].includes(s.payment)){showModal(`<h3>⚠️ Autorização necessária</h3><p>Situação de pagamento: <strong>${s.payment}</strong>.</p><p class="small muted">O professor pode liberar o mês ou registrar a presença manualmente.</p><button class="btn secondary full" onclick="closeModal()">Fechar</button>`);return}await registerAttendance(id,"qr-codigo",session.id,{checkinCode:code})}
async function startQrScanner(studentId){
  if(!navigator.mediaDevices?.getUserMedia){toast("Câmera não disponível.");return}
  if(typeof BarcodeDetector==="undefined"){toast("Leitor QR nativo indisponível. Digite o código.");return}
  showModal(`<h3>Ler QR da aula</h3><video id="qrVideo" autoplay playsinline class="qr-video"></video><p class="small muted">Aponte para o QR exibido no celular do professor.</p><button class="btn secondary full" onclick="closeModal()">Cancelar</button>`);
  try{qrStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}},audio:false});const v=document.getElementById("qrVideo");v.srcObject=qrStream;await v.play();const detector=new BarcodeDetector({formats:["qr_code"]});const tick=async()=>{if(!qrStream)return;try{const codes=await detector.detect(v);if(codes[0]?.rawValue){const value=codes[0].rawValue.trim();closeModal();await studentCheckinByCode(studentId,value);return}}catch{}qrTimer=setTimeout(tick,350)};tick()}catch(e){closeModal();toast("Não foi possível abrir a câmera.")}
}
async function awardAttendanceEffectsV027(studentId,sessionId,attendanceId){
  const ledgerId=`pts-att-${attendanceId}`;
  if(await DB.getOne("pointsLedger",ledgerId))return false;
  const s=await DB.getOne("students",studentId);if(!s)return false;
  const pts=await scoreBaseRule("score-base-attendance",5);
  await DB.put("pointsLedger",{id:ledgerId,studentId,date:todayISO(),type:"presenca",points:pts,note:`Presença no treino (+${pts})`,sessionId,attendanceId,ruleId:"score-base-attendance"});
  s.classesInBelt=(s.classesInBelt||0)+1;s.streak=(s.streak||0)+1;s.points=(s.points||0)+pts;
  await applySequenceBonuses(s);await DB.put("students",s);
  const rem=(await DB.getAll("gradingReminders")).find(r=>r.studentId===studentId&&r.status==="active"&&r.mode==="classes"&&r.remaining>0);
  if(rem){rem.remaining=Math.max(0,rem.remaining-1);await DB.put("gradingReminders",rem)}
  return true
}
async function registerAttendance(id,source="professor",sessionId=null,extra={}){
  const s=await DB.getOne("students",id),att=await getAttendance();
  if(!s){toast("Aluno não encontrado.");return}
  if(att.some(a=>a.studentId===id&&a.date===todayISO()&&(!sessionId||a.sessionId===sessionId))){toast("Este aluno já tem presença nesta aula.");return}
  const me=await TonicaoAuth.currentUser(),cfg=await getSettings();
  const attendanceId=sessionId?`${sessionId}_${id}`:uid("att");
  if(me?.role==="aluno"&&cfg.cloudSessionToken&&sessionId){
    await DB.put("attendance",{id:attendanceId,studentId:id,date:todayISO(),time:new Date().toTimeString().slice(0,5),source:"qr-codigo",sessionId,status:"pending",checkinCode:extra.checkinCode||""});
    toast(navigator.onLine?"Check-in enviado. Os pontos entram quando o Professor sincronizar.":"Check-in salvo. Será enviado quando houver internet.");
    TonicaoCloud.schedule(300);renderAll();return;
  }
  await DB.put("attendance",{id:attendanceId,studentId:id,date:todayISO(),time:new Date().toTimeString().slice(0,5),source,sessionId,status:"approved",...(extra.checkinCode?{checkinCode:extra.checkinCode}:{})});
  const added=await awardAttendanceEffectsV027(id,sessionId,attendanceId);
  const pts=await scoreBaseRule("score-base-attendance",5);
  const rem=(await DB.getAll("gradingReminders")).find(r=>r.studentId===id&&r.status==="active"&&r.mode==="classes"&&r.remaining===0);
  toast(added?(rem?`Presença registrada (+${pts}). Reavaliar graduação!`:`Presença registrada (+${pts} pts).`):"Presença já contabilizada.");
  renderAll()
}
window.awardAttendancePoints=async function(studentId,sessionId){
  return await awardAttendanceEffectsV027(studentId,sessionId,`${sessionId}_${studentId}`)
};
async function profCheckin(id){if(!(await guard("attendance")))return;await registerAttendance(id,"professor",activeSession(await getSessions())?.id||null)}

async function renderStudents(){
  const students=await getStudents(),settings=await getSettings(),me=await TonicaoAuth.currentUser();
  if(settings.role==="aluno"){
    const current=await getCurrentStudent();
    document.getElementById("students").innerHTML=current?`<div class="section-title"><h2>Minha ficha</h2></div>${studentCard(current,true)}`:`<div class="empty">Nenhum aluno vinculado.</div>`;return
  }
  await refreshRemoteRegistrationRequests();
  const allReq=(await DB.getAll("registrationRequests")).sort((a,b)=>String(b.createdAt).localeCompare(String(a.createdAt)));
  const invited=allReq.filter(r=>r.status==="invited");
  const ready=allReq.filter(r=>["awaiting_approval","pending"].includes(r.status));
  const professor=me?.role==="professor";
  document.getElementById("students").innerHTML=`
    <div class="section-title"><h2>Alunos</h2>${professor?`<div class="actions"><button class="btn secondary" onclick="shareSelfRegistrationLink()">🔗 Auto-cadastro</button><button class="btn primary" onclick="newStudentModal()">+ Cadastro rápido</button></div>`:`<span class="pill">Somente leitura</span>`}</div>

    ${ready.length?`<div class="section-title"><h2>✓ Aguardando confirmação</h2><span class="pill amber">${ready.length}</span></div>
    <div class="list">${ready.map(r=>`<div class="card request-card ready-approval">
      <div class="request-head"><div><strong>${r.name}</strong><div class="small muted">${r.phone||""}${r.birth?` • ${fmtDate(r.birth)}`:""} • ${TRACK_LABEL[r.graduationTrack||"adulto"]} • ${r.belt||"Branca"} ${r.stripes||0} grau(s)</div></div><span class="pill green">Aluno concluiu</span></div>
      ${r.email?`<div class="small">E-mail: ${r.email}</div>`:""}${r.guardianName?`<div class="small">Responsável: ${r.guardianName} • ${r.guardianPhone||""}</div>`:""}${r.emergencyName?`<div class="small">Emergência: ${r.emergencyName} • ${r.emergencyPhone||""}</div>`:""}${r.note?`<p class="small">${r.note}</p>`:""}
      ${professor?`<button class="btn green full" onclick="approveRegistrationRequest('${r.id}')">✓ Confirmar cadastro</button><button class="btn secondary full" style="margin-top:8px" onclick="rejectRegistrationRequest('${r.id}')">Recusar</button>`:`<div class="small muted">Somente o Professor confirma.</div>`}
    </div>`).join("")}</div>`:""}

    ${invited.length?`<div class="section-title"><h2>Convites enviados</h2><span class="pill">${invited.length}</span></div>
    <div class="list">${invited.map(r=>`<div class="list-item"><div class="icon">📲</div><div style="flex:1"><strong>${r.name}</strong><div class="small muted">${r.phone||""} • aguardando o aluno completar</div></div>${professor?`<button class="mini-btn" onclick="shareRegistrationInvite('${r.id}')">Reenviar</button><button class="mini-btn" title="Excluir convite" onclick="cancelInviteV033('${r.id}')">🗑️</button>`:""}</div>`).join("")}</div>`:""}

    <div class="section-title"><h2>Alunos ativos</h2><span class="pill">${students.length}</span></div>
    <div class="list">${students.map(s=>`<div class="list-item student-row" onclick="studentDetails('${s.id}')">${studentAvatar(s)}<div class="meta"><strong>${s.name}</strong><span class="small muted">${s.belt} • ${s.stripes} grau(s) • ${s.phone||"sem telefone"} • ${s.payment}</span></div><span>›</span></div>`).join("")}</div>`
}
function studentCard(s,compact=false){return `<div class="card"><div class="student-row">${studentAvatar(s)}<div class="meta"><strong>${s.name}</strong><span class="small muted">${s.belt} • ${s.stripes} grau(s)</span></div></div><div class="grid" style="margin-top:14px"><div><span class="small muted">Nascimento</span><strong>${fmtDate(s.birth)}</strong></div><div><span class="small muted">Telefone</span><strong>${s.phone||"-"}</strong></div><div><span class="small muted">Vencimento</span><strong>Dia ${s.dueDay||"-"}</strong></div></div>${compact?"":`<div class="actions"><button class="btn secondary" onclick="photoModal('${s.id}')">📷 Foto</button><button class="btn secondary" onclick="gradingAction('${s.id}')">🥋 Graduação</button><button class="btn secondary" onclick="editStudentTrackModal('${s.id}')">🎯 Trilha/Faixa</button><button class="btn secondary" onclick="quickInvite('${s.id}')">🔗 Convite</button></div>`}</div>`}
function newStudentModal(){
  showModal(`<h3>Cadastro rápido de aluno</h3>
    <p class="small muted">O Professor informa somente nome e telefone. O próprio aluno completa o restante pelo link recebido.</p>
    <div class="contact-import-box">
      <button class="btn secondary full" onclick="importStudentFromContacts()">📇 Escolher dos contatos do celular</button>
      <p class="small muted" id="contactImportHint">Escolha o contato e depois toque em “Cadastrar e enviar link”.</p>
    </div>
    <div class="field"><label>Nome</label><input id="nsName" placeholder="Nome do aluno"></div>
    <div class="field"><label>Telefone / WhatsApp</label><input id="nsPhone" inputmode="tel" placeholder="(48) 99999-9999"></div>
    <button class="btn primary full" onclick="saveQuickStudentInvite()">Cadastrar e enviar link</button>
    <button class="btn secondary full" style="margin-top:10px" onclick="fullStudentModal()">Preencher cadastro completo manualmente</button>`)
}
async function saveQuickStudentInvite(){
  await TonicaoAuth.requirePerm("manage_students");
  const me=await TonicaoAuth.currentUser();
  if(me?.role!=="professor"){toast("O cadastro de aluno é responsabilidade do Professor.");return}
  const name=document.getElementById("nsName").value.trim(),phone=document.getElementById("nsPhone").value.trim();
  if(!name||!phone){toast("Informe nome e telefone.");return}
  const normalized=phoneForWhatsApp(phone);
  const existingStudents=(await getStudents()).find(s=>phoneForWhatsApp(s.phone)===normalized);
  if(existingStudents){toast("Já existe um aluno cadastrado com este telefone.");return}
  const existingReq=(await DB.getAll("registrationRequests")).find(r=>["invited","awaiting_approval","pending"].includes(r.status)&&phoneForWhatsApp(r.phone)===normalized);
  if(existingReq){closeModal();toast("Já existe um cadastro em andamento para este telefone.");setTimeout(()=>shareRegistrationInvite(existingReq.id),120);return}

  const settings=await getSettings();
  let req={id:uid("reg"),academyId:settings.academyId||"tonicao-sul-ilha",name,phone,status:"invited",source:"professor_invite",inviteToken:localInviteToken(),createdAt:new Date().toISOString(),invitedBy:me.id};
  try{
    if(settings.cloudEndpoint&&settings.cloudSessionToken&&navigator.onLine){
      const remote=await TonicaoRemoteAuth.createRegistrationInvite({name,phone});
      if(remote?.request){
        req={...req,...remote.request,id:remote.request.id,remoteId:remote.request.id,inviteToken:remote.request.inviteToken||req.inviteToken,source:"professor_invite_remote"};
      }
    }
  }catch(e){toast("Convite criado localmente. O servidor não respondeu; em outro celular será necessário o servidor online.")}
  await DB.put("registrationRequests",req);
  await TonicaoAuth.audit("student.invite","Convite de cadastro criado",null,{requestId:req.id,phone:req.phone});
  closeModal();await renderStudents();setTimeout(()=>shareRegistrationInvite(req.id),120)
}
function fullStudentModal(){
  showModal(`<h3>Cadastro completo manual</h3>
    <div class="field"><label>Nome completo</label><input id="nsName"></div>
    <div class="field"><label>Telefone / WhatsApp</label><input id="nsPhone" inputmode="tel" placeholder="(48) 99999-9999"></div>
    <div class="field"><label>Data de nascimento</label><input id="nsBirth" type="date"></div>
    <div class="field"><label>Trilha de graduação</label><select id="nsTrack" onchange="updateNewStudentBelts()"><option value="adulto">Adulto</option><option value="kids">Kids</option></select></div>
    <div class="field"><label>Faixa</label><select id="nsBelt"></select></div>
    <div class="field"><label>Graus</label><input id="nsStripes" type="number" min="0" max="4" value="0"></div>
    <div class="field"><label>Dia de vencimento</label><input id="nsDue" type="number" min="1" max="31" value="10"></div>
    <button class="btn primary full" onclick="saveNewStudent()">Salvar aluno</button>
    <button class="btn secondary full" style="margin-top:10px" onclick="newStudentModal()">Voltar ao cadastro rápido</button>`);
  updateNewStudentBelts()
}

async function importStudentFromContacts(){
  try{
    if(navigator.contacts?.select){
      const props=["name","tel"];
      const contacts=await navigator.contacts.select(props,{multiple:false});
      const c=contacts?.[0];
      if(!c){toast("Nenhum contato selecionado.");return}
      const name=Array.isArray(c.name)?c.name[0]:c.name;
      const tel=Array.isArray(c.tel)?c.tel[0]:c.tel;
      if(name)document.getElementById("nsName").value=String(name).trim();
      if(tel)document.getElementById("nsPhone").value=String(tel).trim();
      const hint=document.getElementById("contactImportHint");
      if(hint)hint.textContent="Contato carregado. Confira nome e telefone e envie o link ao aluno.";
      toast("Contato carregado.")
      return
    }
    showContactImportFallback()
  }catch(e){
    if(String(e?.name||"").toLowerCase().includes("abort"))return;
    showContactImportFallback(e?.message||"")
  }
}
function showContactImportFallback(detail=""){
  showModal(`<h3>Contatos do celular</h3>
    <div class="notice"><strong>Este navegador não liberou acesso aos contatos.</strong>
      <div class="small">Por segurança, o aplicativo só pode acessar um contato quando o próprio usuário escolhe. Em alguns navegadores ou ao abrir o arquivo HTML diretamente, esse recurso não fica disponível.</div>
    </div>
    ${detail?`<p class="small muted">${detail}</p>`:""}
    <p>Você pode continuar digitando apenas nome e telefone manualmente. O aluno preencherá os demais dados pelo link.</p>
    <button class="btn secondary full" onclick="closeModal();setTimeout(newStudentModal,80)">Voltar ao cadastro</button>`)
}

function updateNewStudentBelts(){
  const track=document.getElementById("nsTrack")?.value||"adulto",sel=document.getElementById("nsBelt");if(!sel)return;
  sel.innerHTML=beltsForTrack(track).map(b=>`<option>${b}</option>`).join("")
}
async function saveNewStudent(){
  await TonicaoAuth.requirePerm("manage_students");
  const name=document.getElementById("nsName").value.trim();if(!name){toast("Informe o nome.");return}
  const graduationTrack=document.getElementById("nsTrack").value||"adulto",belt=document.getElementById("nsBelt").value;
  const student={id:uid("s"),name,nickname:name.split(" ")[0],phone:document.getElementById("nsPhone").value.trim(),birth:document.getElementById("nsBirth").value,graduationTrack,belt,stripes:+document.getElementById("nsStripes").value||0,classesInBelt:0,targetClasses:targetClassesFor(graduationTrack,belt),streak:0,points:0,dueDay:+document.getElementById("nsDue").value||10,payment:"verificar",active:true,photo:""};
  await DB.put("students",student);
  closeModal();await TonicaoAuth.audit("student.create","Aluno cadastrado",student.id,{graduationTrack,phone:student.phone});toast("Aluno cadastrado.");await renderAll();setTimeout(()=>quickInvite(student.id),120)
}
async function studentDetails(id){const s=await DB.getOne("students",id);showModal(`<h3>${s.name}</h3>${studentCard(s)}<div class="section-title"><h2>Situação</h2></div><div class="pill ${s.payment==="liberado"?"green":s.payment==="pendente"?"red":"amber"}">Pagamento: ${s.payment}</div><div class="actions"><button class="btn green" onclick="setPayment('${s.id}','liberado');closeModal()">Liberar</button><button class="btn secondary" onclick="setPayment('${s.id}','pendente');closeModal()">Pendente</button></div><button class="btn secondary full" style="margin-top:14px" onclick="closeModal()">Fechar</button>`)}
async function setPayment(id,status){
  await TonicaoAuth.requirePerm("payments");
  const s=await DB.getOne("students",id),before=s.payment;s.payment=status;await DB.put("students",s);
  if(status==="liberado"&&before!=="liberado"){
    const key=monthKey(),ledgerId=`pts-pay-${id}-${key}`;
    const already=await DB.getOne("pointsLedger",ledgerId);
    if(!already){
      const pts=await scoreBaseRule("score-base-payment",20);
      await DB.put("pointsLedger",{id:ledgerId,studentId:id,date:todayISO(),monthKey:key,type:"mensalidade",points:pts,note:`Mensalidade em dia — ${key} (+${pts})`,ruleId:"score-base-payment"});
      s.points=(s.points||0)+pts;await DB.put("students",s);
      toast(`Aluno liberado e +${pts} pontos pela mensalidade em dia.`);renderAll();return
    }
  }
  toast(status==="liberado"?"Aluno liberado. Pontuação mensal já registrada.":"Situação pendente.");renderAll()
}
async function birthdayMessage(id){const s=await DB.getOne("students",id),msg=`Feliz aniversário, ${s.nickname||s.name}! A Tonicão Team Sul da Ilha deseja muita saúde, evolução e muitos treinos no tatame! 🥋`;showModal(`<h3>🎉 Mensagem de aniversário</h3><p id="birthdayText">${msg}</p><button class="btn primary full" onclick="navigator.clipboard?.writeText(document.getElementById('birthdayText').textContent);toast('Mensagem copiada');closeModal()">Copiar mensagem</button>`)}

async function editStudentTrackModal(id){
  const s=await DB.getOne("students",id);
  const track=s.graduationTrack||"adulto";
  showModal(`<h3>Trilha e faixa</h3><p><strong>${s.name}</strong></p>
    <div class="field"><label>Trilha</label><select id="esTrack" onchange="updateEditStudentBelts('${s.belt}')"><option value="adulto" ${track==="adulto"?"selected":""}>Adulto</option><option value="kids" ${track==="kids"?"selected":""}>Kids</option></select></div>
    <div class="field"><label>Faixa</label><select id="esBelt"></select></div>
    <div class="field"><label>Graus</label><input id="esStripes" type="number" min="0" max="4" value="${s.stripes||0}"></div>
    <div class="field"><label>Meta de treinos</label><input id="esTarget" type="number" min="1" value="${s.targetClasses||targetClassesFor(track,s.belt)}"></div>
    <button class="btn primary full" onclick="saveStudentTrack('${id}')">Salvar</button>`);
  updateEditStudentBelts(s.belt)
}
function updateEditStudentBelts(preferred=""){
  const track=document.getElementById("esTrack")?.value||"adulto",sel=document.getElementById("esBelt");if(!sel)return;
  const belts=beltsForTrack(track);sel.innerHTML=belts.map(b=>`<option ${b===preferred?"selected":""}>${b}</option>`).join("");
  if(!belts.includes(preferred))sel.value=belts[0]
}
async function saveStudentTrack(id){
  await TonicaoAuth.requirePerm("manage_students");
  const s=await DB.getOne("students",id);
  s.graduationTrack=document.getElementById("esTrack").value;
  s.belt=document.getElementById("esBelt").value;
  s.stripes=Number(document.getElementById("esStripes").value||0);
  s.targetClasses=Number(document.getElementById("esTarget").value||targetClassesFor(s.graduationTrack,s.belt));
  await DB.put("students",s);closeModal();toast("Trilha e faixa atualizadas.");renderAll()
}

async function photoModal(id){cropState={studentId:id,img:null,zoom:1,x:0,y:0};showModal(`<h3>Foto do aluno</h3><div class="field"><label>Tirar foto ou escolher da galeria</label><input id="photoInput" type="file" accept="image/*" capture="user" onchange="loadCropImage(event)"></div><div id="cropWrap" style="display:none"><canvas id="cropCanvas" width="320" height="320" class="crop-canvas"></canvas><div class="field"><label>Zoom</label><input type="range" min="1" max="3" step="0.05" value="1" oninput="cropState.zoom=+this.value;renderCrop()"></div><div class="field"><label>Posição horizontal</label><input type="range" min="-100" max="100" value="0" oninput="cropState.x=+this.value;renderCrop()"></div><div class="field"><label>Posição vertical</label><input type="range" min="-100" max="100" value="0" oninput="cropState.y=+this.value;renderCrop()"></div><button class="btn primary full" onclick="saveCroppedPhoto()">Salvar recorte</button></div><p class="small muted">A foto final é quadrada, comprimida e salva localmente.</p>`)}
function loadCropImage(ev){const f=ev.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{const img=new Image();img.onload=()=>{cropState.img=img;document.getElementById("cropWrap").style.display="block";renderCrop()};img.src=r.result};r.readAsDataURL(f)}
function renderCrop(){const c=document.getElementById("cropCanvas"),img=cropState.img;if(!c||!img)return;const ctx=c.getContext("2d"),base=Math.max(c.width/img.width,c.height/img.height),scale=base*cropState.zoom,w=img.width*scale,h=img.height*scale,ox=(cropState.x/100)*(Math.max(0,w-c.width)/2),oy=(cropState.y/100)*(Math.max(0,h-c.height)/2),x=(c.width-w)/2-ox,y=(c.height-h)/2-oy;ctx.fillStyle="#ddd";ctx.fillRect(0,0,c.width,c.height);ctx.drawImage(img,x,y,w,h)}
async function saveCroppedPhoto(){await TonicaoAuth.requirePerm("manage_students");const c=document.getElementById("cropCanvas");if(!c||!cropState.img){toast("Escolha uma foto.");return}const s=await DB.getOne("students",cropState.studentId);s.photo=c.toDataURL("image/jpeg",.84);await DB.put("students",s);closeModal();toast("Foto recortada e salva.");renderAll()}
function gradingAction(){closeModal();goPage("graduation")}


async function getGraduationHistoryFor(studentId){
  return (await DB.getAll("gradingHistory"))
    .filter(x=>x.studentId===studentId)
    .sort((a,b)=>String(b.date).localeCompare(String(a.date)));
}
function nextBelt(current,track="adulto"){
  const order=beltsForTrack(track);
  const i=order.indexOf(current);
  return i>=0 && i<order.length-1 ? order[i+1] : current;
}
function planThemeClass(plan){return PLAN_STYLE[plan?.targetBelt]||"blue"}
function planToneText(plan){return `${TRACK_LABEL[plan?.graduationTrack||"adulto"]||"Adulto"} • ${plan?.pilot?"Plano piloto editável":"Plano ativo"}`}
async function recommendedPlanForStudent(student){
  const plans=(await DB.getAll("gradingPlans")).filter(p=>p.active!==false);
  const track=student.graduationTrack||"adulto";
  const target=nextBelt(student.belt,track);
  return plans.find(p=>(p.graduationTrack||"adulto")===track&&p.targetBelt===target)
    || plans.find(p=>(p.graduationTrack||"adulto")==="adulto"&&p.targetBelt===target)
    || null;
}
function formatPlanCard(plan){
  return `<div class="card plan-card ${planThemeClass(plan)}"><div class="exam-title">${plan.name}</div><p class="small muted">${plan.practical.length} requisito(s) prático(s) • ${plan.theory.length} tópico(s) teórico(s)</p><div class="pill ${planThemeClass(plan)}" style="margin:8px 0 12px;width:max-content">${planToneText(plan)}</div><div class="actions"><button class="btn secondary" onclick="planEditorModal('${plan.id}')">⚙️ Editar plano</button><button class="btn secondary" onclick="showPlanChecklist('${plan.id}')">Checklist</button><button class="btn secondary" onclick="openPlanPdf('${plan.id}')">📄 PDF</button><button class="btn secondary" onclick="attachPlanPdfModal('${plan.id}')">Anexar PDF</button></div></div>`;
}
function gradingAssignmentStatus(a){
  const map={material_liberado:"Material liberado",prova_agendada:"Prova agendada",prova_realizada:"Avaliação realizada",aprovado:"Aprovado na avaliação",revisar:"Reavaliar depois",graduado:"Graduado"};
  return map[a?.status]||"Preparação"
}
function gradingStatusClass(a){if(a?.status==="aprovado"||a?.status==="graduado")return "green";if(a?.status==="revisar")return "amber";return "blue"}
function examWhenText(a){if(!a?.examDate)return "Sem data agendada";return `${fmtDate(a.examDate)}${a.examTime?` • ${a.examTime}`:""}${a.examLocation?` • ${a.examLocation}`:""}`}
async function scheduleExamModal(assignmentId){
  await TonicaoAuth.requirePerm("manage_graduation");
  const a=await DB.getOne("gradingAssignments",assignmentId),s=await DB.getOne("students",a.studentId),p=await DB.getOne("gradingPlans",a.planId);
  showModal(`<h3>Agendar avaliação</h3><p><strong>${s.name}</strong><br><span class="small muted">${p?.name||"Plano de graduação"}</span></p><div class="field"><label>Data</label><input id="examDate" type="date" value="${a.examDate||todayISO()}"></div><div class="field"><label>Horário</label><input id="examTime" type="time" value="${a.examTime||""}"></div><div class="field"><label>Local</label><input id="examLocation" value="${a.examLocation||"CT / Tatame"}"></div><div class="field"><label>Observação para o aluno</label><textarea id="examPublicNote">${a.examPublicNote||""}</textarea></div><button class="btn primary full" onclick="saveExamSchedule('${assignmentId}')">Salvar agendamento</button>`)
}
async function saveExamSchedule(assignmentId){if(!(await guard("manage_graduation")))return;
  const a=await DB.getOne("gradingAssignments",assignmentId);a.examDate=document.getElementById("examDate").value;a.examTime=document.getElementById("examTime").value;a.examLocation=document.getElementById("examLocation").value.trim();a.examPublicNote=document.getElementById("examPublicNote").value.trim();a.status="prova_agendada";a.scheduledAt=new Date().toISOString();await DB.put("gradingAssignments",a);await TonicaoAuth.audit("grading.schedule","Avaliação de graduação agendada",a.studentId,{assignmentId,date:a.examDate});closeModal();toast("Avaliação agendada.");renderAll()
}
async function evaluateExamModal(assignmentId){
  await TonicaoAuth.requirePerm("manage_graduation");
  const a=await DB.getOne("gradingAssignments",assignmentId),s=await DB.getOne("students",a.studentId),p=await DB.getOne("gradingPlans",a.planId),ev=a.evaluation||{items:{}};
  const row=(key,label)=>`<div class="evaluation-item"><div><strong>${label}</strong></div><select id="eval-${key}"><option value="pending" ${(ev.items[key]||"pending")==="pending"?"selected":""}>Não avaliado</option><option value="ok" ${ev.items[key]==="ok"?"selected":""}>✓ OK</option><option value="review" ${ev.items[key]==="review"?"selected":""}>Rever</option></select></div>`;
  showModal(`<h3>Avaliação de graduação</h3><p><strong>${s.name}</strong><br><span class="small muted">${p.name} • ${examWhenText(a)}</span></p><div class="section-title"><h2>Prático</h2></div><div class="evaluation-list">${p.practical.map((x,i)=>row("p"+i,x)).join("")}</div><div class="section-title"><h2>Teórico</h2></div><div class="evaluation-list">${p.theory.map((x,i)=>row("t"+i,x)).join("")}</div><div class="field"><label>Resultado do professor</label><select id="evalOverall"><option value="draft" ${!ev.overall||ev.overall==="draft"?"selected":""}>Salvar como rascunho</option><option value="approved" ${ev.overall==="approved"?"selected":""}>Aprovado</option><option value="review" ${ev.overall==="review"?"selected":""}>Reavaliar depois</option></select></div><div class="field"><label>Observação visível ao aluno</label><textarea id="evalPublic">${ev.publicNote||""}</textarea></div><div class="field"><label>Observação privada do professor</label><textarea id="evalPrivate">${ev.privateNote||""}</textarea></div><button class="btn primary full" onclick="saveExamEvaluation('${assignmentId}')">Salvar avaliação</button>`)
}
async function saveExamEvaluation(assignmentId){if(!(await guard("manage_graduation")))return;
  const a=await DB.getOne("gradingAssignments",assignmentId),p=await DB.getOne("gradingPlans",a.planId),me=await TonicaoAuth.currentUser(),items={};p.practical.forEach((_,i)=>items["p"+i]=document.getElementById("eval-p"+i).value);p.theory.forEach((_,i)=>items["t"+i]=document.getElementById("eval-t"+i).value);const overall=document.getElementById("evalOverall").value;a.evaluation={items,overall,publicNote:document.getElementById("evalPublic").value.trim(),privateNote:document.getElementById("evalPrivate").value.trim(),evaluatedAt:new Date().toISOString(),evaluatedBy:me?.name||"Professor"};a.status=overall==="approved"?"aprovado":overall==="review"?"revisar":"prova_realizada";await DB.put("gradingAssignments",a);await TonicaoAuth.audit("grading.evaluate","Avaliação de graduação registrada",a.studentId,{assignmentId,overall});closeModal();toast(overall==="approved"?"Avaliação aprovada. A graduação ainda precisa ser confirmada pelo professor.":overall==="review"?"Marcado para reavaliação.":"Rascunho da avaliação salvo.");renderAll()
}

async function completeGraduationModal(studentId){
  const s=await DB.getOne("students",studentId);
  const assignments=(await DB.getAll("gradingAssignments")).filter(a=>a.studentId===studentId);
  const active=assignments.sort((a,b)=>String(b.releasedAt).localeCompare(String(a.releasedAt)))[0];
  const evaluationWarning=active?.status!=="aprovado"?`<div class="notice payment"><strong>Atenção</strong><div class="small">A avaliação ainda não está marcada como aprovada. A decisão final continua sendo do professor.</div></div>`:"";
  const track=s.graduationTrack||"adulto";
  const suggested=nextBelt(s.belt,track);
  showModal(`<h3>Confirmar graduação</h3>
    <p><strong>${s.name}</strong></p><p class="small muted">Trilha: ${TRACK_LABEL[track]||track}${active?` • ${gradingAssignmentStatus(active)}`:""}</p>${evaluationWarning}
    <div class="field"><label>Tipo</label>
      <select id="gradType"><option value="faixa">Troca de faixa</option><option value="grau">Novo grau</option></select>
    </div>
    <div class="field"><label>Nova faixa</label>
      <select id="gradBelt">${beltsForTrack(track).map(b=>`<option ${b===suggested?"selected":""}>${b}</option>`).join("")}</select>
    </div>
    <div class="field"><label>Novo grau</label><input id="gradStripe" type="number" min="0" max="4" value="${s.stripes<4?s.stripes+1:0}"></div>
    <div class="field"><label>Data</label><input id="gradDate" type="date" value="${todayISO()}"></div>
    <div class="field"><label>Professor responsável</label><input id="gradProfessor" placeholder="Nome do professor"></div>
    <div class="field"><label>Observação</label><textarea id="gradNote" placeholder="Ex.: aprovado na prova prática e teórica"></textarea></div>
    <button class="btn primary full" onclick="saveGraduation('${studentId}','${active?.id||""}')">Confirmar graduação</button>`);
}
async function saveGraduation(studentId,assignmentId=""){await TonicaoAuth.requirePerm("manage_graduation");
  const s=await DB.getOne("students",studentId);
  const type=document.getElementById("gradType").value;
  const newBelt=document.getElementById("gradBelt").value;
  const newStripe=Math.max(0,Math.min(4,Number(document.getElementById("gradStripe").value||0)));
  const date=document.getElementById("gradDate").value||todayISO();
  const professor=document.getElementById("gradProfessor").value.trim();
  const note=document.getElementById("gradNote").value.trim();

  const previous={belt:s.belt,stripes:s.stripes};
  if(type==="faixa"){
    s.belt=newBelt;s.stripes=newStripe;s.classesInBelt=0;s.targetClasses=targetClassesFor(s.graduationTrack||"adulto",newBelt);
  }else{
    s.stripes=newStripe;
  }
  await DB.put("students",s);
  const historyId=uid("gh");
  await DB.put("gradingHistory",{
    id:historyId,studentId,date,type,assignmentId:assignmentId||null,
    fromBelt:previous.belt,fromStripes:previous.stripes,
    toBelt:s.belt,toStripes:s.stripes,
    professor,note
  });
  if(assignmentId){
    const a=await DB.getOne("gradingAssignments",assignmentId);
    if(a){a.status="graduado";a.completedAt=date;a.gradingHistoryId=historyId;await DB.put("gradingAssignments",a);}
  }
  // Graduação não gera pontos automáticos: a tabela da academia não prevê este bônus.
  closeModal();await TonicaoAuth.audit("grading.complete","Graduação registrada",studentId,{belt:s.belt,stripes:s.stripes});await createTargetedNotification("graduated","Graduação registrada",`Parabéns! Sua graduação foi registrada: ${s.belt} • ${s.stripes} grau(s).`,{targetStudentId:studentId,refId:historyId});toast("Graduação registrada no histórico.");renderAll();
}

async function renderGraduation(){
  const students=await getStudents(),plans=(await DB.getAll("gradingPlans")).filter(p=>p.active!==false),reminders=await DB.getAll("gradingReminders"),assignments=await DB.getAll("gradingAssignments"),settings=await getSettings();
  if(settings.role==="aluno"){const current=await getCurrentStudent();document.getElementById("graduation").innerHTML=`<div class="section-title"><h2>Minha graduação</h2></div><div id="studentGradPrep"></div><div class="section-title"><h2>Meu histórico</h2></div><div id="studentGradHistory"></div>`;if(current){await renderStudentGraduationPrep(current.id);await renderStudentGraduationHistory(current.id)}return}
  const activeAssignments=assignments.filter(a=>a.status!=="graduado").sort((a,b)=>String(a.examDate||"9999").localeCompare(String(b.examDate||"9999")));
  const assignmentCards=(await Promise.all(activeAssignments.map(async a=>({a,s:await DB.getOne("students",a.studentId),p:await DB.getOne("gradingPlans",a.planId)})))).filter(x=>x.s&&x.p);
  const eligible=students.filter(s=>s.stripes>=4&&nextBelt(s.belt,s.graduationTrack||"adulto")!==s.belt);const rows=await Promise.all(eligible.map(async s=>({student:s,plan:await recommendedPlanForStudent(s)})));
  document.getElementById("graduation").innerHTML=`<div class="section-title"><h2>Preparações e provas</h2><span class="pill">${assignmentCards.length}</span></div><div class="list">${assignmentCards.map(({a,s,p})=>`<div class="card exam-workflow-card"><div class="student-row">${studentAvatar(s)}<div class="meta"><strong>${s.name}</strong><span class="small muted">${p.name}</span></div><span class="pill ${gradingStatusClass(a)}">${gradingAssignmentStatus(a)}</span></div><p class="small muted" style="margin:10px 0">${examWhenText(a)}</p>${a.evaluation?.overall?`<div class="small"><strong>Resultado:</strong> ${a.evaluation.overall==="approved"?"Aprovado":a.evaluation.overall==="review"?"Reavaliar":"Rascunho"}</div>`:""}<div class="actions"><button class="btn secondary" onclick="scheduleExamModal('${a.id}')">📅 Agendar</button><button class="btn primary" onclick="evaluateExamModal('${a.id}')">📝 Avaliar</button>${a.status==="aprovado"?`<button class="btn green" onclick="completeGraduationModal('${s.id}')">Confirmar graduação</button>`:""}</div></div>`).join("")||`<div class="empty">Nenhuma preparação liberada ainda.</div>`}</div><div class="section-title"><h2>Elegíveis para avaliação</h2></div><div class="list">${rows.map(({student:s,plan})=>{const r=reminders.find(x=>x.studentId===s.id&&x.status==="active"),has=activeAssignments.some(a=>a.studentId===s.id);return `<div class="list-item"><div class="icon">🥋</div><div style="flex:1"><strong>${s.name}</strong><div class="small muted">${s.belt} • ${s.stripes} graus • ${s.classesInBelt} treinos • ${TRACK_LABEL[s.graduationTrack||"adulto"]}</div><div class="small muted" style="margin-top:4px">Plano sugerido: <strong>${plan?.name||"Sem plano"}</strong></div>${r?(r.mode==="date"?`<div class="pill ${r.date<=todayISO()?"green":"amber"}" style="margin-top:8px">${r.date<=todayISO()?"Reavaliar agora":`Reavaliar em ${esc(fmtDate(r.date))}`}</div>`:`<div class="pill ${r.remaining<=0?"green":"amber"}" style="margin-top:8px">${r.remaining<=0?"Reavaliar agora":`Reavaliar após ${r.remaining} aula(s)`}</div>`):`<div class="pill green" style="margin-top:8px">Elegível para avaliação</div>`}<div class="actions">${has?`<button class="btn secondary" disabled>Preparação já liberada</button>`:`<button class="btn primary" onclick="releaseExam('${s.id}')">Liberar preparação</button>`}<button class="btn secondary" onclick="deferGrading('${s.id}')">Reavaliar depois</button><button class="btn green" onclick="completeGraduationModal('${s.id}')">Confirmar graduação</button></div></div></div>`}).join("")||`<div class="empty">Nenhum aluno próximo de troca de faixa.</div>`}</div><div class="section-title"><h2>Planos de graduação</h2><button class="btn primary" onclick="planEditorModal()">+ Novo plano</button></div><div class="list">${plans.map(plan=>formatPlanCard(plan)).join("")}</div>`
}

async function deferGrading(studentId){
  await TonicaoAuth.requirePerm("manage_graduation");
  const s=await DB.getOne("students",studentId);if(!s)return;
  const cur=(await DB.getAll("gradingReminders")).find(r=>r.studentId===studentId&&r.status==="active");
  showModal(`<h3>Reavaliar depois</h3><p class="small muted">${esc(s.name)} • ${esc(s.belt)} • ${Number(s.stripes||0)} grau(s)</p>
    <div class="field"><label>Lembrar por</label><select id="dgMode" onchange="document.getElementById('dgClassesWrap').style.display=this.value==='classes'?'':'none';document.getElementById('dgDateWrap').style.display=this.value==='date'?'':'none'">
      <option value="classes" ${cur?.mode!=="date"?"selected":""}>Quantidade de aulas</option><option value="date" ${cur?.mode==="date"?"selected":""}>Data</option></select></div>
    <div class="field" id="dgClassesWrap" style="${cur?.mode==="date"?"display:none":""}"><label>Reavaliar após quantas aulas?</label><input id="dgClasses" type="number" min="1" value="${cur?.mode==="classes"?Math.max(1,Number(cur.remaining||1)):10}"></div>
    <div class="field" id="dgDateWrap" style="${cur?.mode==="date"?"":"display:none"}"><label>Reavaliar em</label><input id="dgDate" type="date" value="${esc(cur?.date||"")}"></div>
    <div class="field"><label>O que precisa melhorar</label><textarea id="dgNote" placeholder="Ex.: defesa de montada, raspagens">${esc(cur?.note||"")}</textarea></div>
    <button class="btn primary full" onclick="saveDeferGrading('${esc(studentId)}')">Salvar lembrete</button>`);
}
async function saveDeferGrading(studentId){
  await TonicaoAuth.requirePerm("manage_graduation");
  const mode=document.getElementById("dgMode").value;
  const classes=Math.max(1,Number(document.getElementById("dgClasses").value||1));
  const date=document.getElementById("dgDate").value;
  if(mode==="date"&&!date){toast("Escolha a data da reavaliação.");return}
  for(const r of (await DB.getAll("gradingReminders")).filter(r=>r.studentId===studentId&&r.status==="active")){r.status="replaced";await DB.put("gradingReminders",r)}
  const rem={id:uid("gr"),studentId,mode,remaining:mode==="classes"?classes:null,date:mode==="date"?date:"",note:document.getElementById("dgNote").value.trim(),status:"active",createdAt:new Date().toISOString()};
  await DB.put("gradingReminders",rem);
  await TonicaoAuth.audit("grading.defer","Graduação adiada para reavaliação",studentId,{mode,classes:rem.remaining,date:rem.date});
  closeModal();toast(mode==="classes"?`Lembrete: reavaliar após ${classes} aula(s).`:`Lembrete: reavaliar em ${fmtDate?fmtDate(date):date}.`);renderAll();
}
async function releaseExam(studentId){
  await TonicaoAuth.requirePerm("manage_graduation");const ex=(await DB.getAll("gradingAssignments")).find(a=>a.studentId===studentId&&a.status!=="graduado");if(ex){toast("Este aluno já possui uma preparação ou avaliação em andamento.");return}const student=await DB.getOne("students",studentId),plan=await recommendedPlanForStudent(student);if(!plan){toast("Nenhum plano disponível para a próxima faixa deste aluno.");return}await DB.put("gradingAssignments",{id:uid("ga"),studentId,planId:plan.id,status:"material_liberado",releasedAt:todayISO(),progress:{},evaluation:{items:{},overall:"draft"}});await TonicaoAuth.audit("grading.release","Preparação de graduação liberada",studentId,{planId:plan.id});toast(`Preparação liberada: ${plan.name}.`);renderAll()
}

async function renderStudentGraduationHistory(studentId){
  const host=document.getElementById("studentGradHistory");if(!host)return;const hist=await getGraduationHistoryFor(studentId);host.innerHTML=hist.length?hist.map(h=>`<div class="history-line"><div class="card"><strong>${h.type==="faixa"?"Troca de faixa":"Novo grau"} — ${h.toBelt} ${h.toStripes||0} grau(s)</strong><p class="small muted">${fmtDate(h.date)}${h.professor?` • ${h.professor}`:""}</p>${h.note?`<p class="small">${h.note}</p>`:""}<button class="btn secondary" onclick="printGraduationCertificate('${h.id}')">🖨️ Certificado / registro</button></div></div>`).join(""):`<div class="card"><p class="muted">Nenhuma graduação registrada no histórico ainda.</p></div>`
}
async function printGraduationCertificate(historyId){
  const h=await DB.getOne("gradingHistory",historyId),s=await DB.getOne("students",h.studentId),settings=await getSettings(),w=window.open("","_blank");if(!w){toast("Permita a abertura da janela para imprimir.");return}const logo=settings.logoDataUrl||"./assets/logo-tonicao.jpg";w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>Registro de Graduação</title><style>body{font-family:Arial,sans-serif;padding:48px;text-align:center;color:#111}.box{max-width:760px;margin:auto;border:3px solid #111;padding:48px;border-radius:18px}img{max-width:120px;max-height:120px}h1{font-size:34px}.belt{font-size:28px;font-weight:800;margin:22px}.small{color:#555}@media print{button{display:none}}</style></head><body><div class="box"><img src="${logo}"><h1>Registro de Graduação</h1><p>${settings.academyName||"Academia de Jiu-Jitsu"} • ${settings.unitName||"Unidade"}</p><p>Certificamos o registro de graduação de</p><h2>${s.name}</h2><div class="belt">${h.toBelt} • ${h.toStripes||0} grau(s)</div><p>Data: ${fmtDate(h.date)}</p>${h.professor?`<p>Professor responsável: ${h.professor}</p>`:""}${h.note?`<p class="small">${h.note}</p>`:""}<br><button onclick="window.print()">Imprimir</button></div></body></html>`);w.document.close()
}

async function renderStudentGraduationPrep(studentId){
  const host=document.getElementById("studentGradPrep");if(!host)return;const assignments=(await DB.getAll("gradingAssignments")).filter(a=>a.studentId===studentId).sort((a,b)=>String(b.releasedAt).localeCompare(String(a.releasedAt))),active=assignments[0];if(!active){host.innerHTML=`<div class="card"><span class="pill amber">Ainda não liberado</span><h3 style="margin-top:12px">Material da próxima graduação</h3><p class="muted">Quando o professor liberar, o PDF, checklist e vídeos aparecerão aqui.</p></div>`;return}const plan=await DB.getOne("gradingPlans",active.planId),techs=await DB.getAll("techniques"),progress=active.progress||{},links=plan?.links||{},result=active.evaluation?.overall;host.innerHTML=`<div class="card"><span class="pill ${gradingStatusClass(active)}">${gradingAssignmentStatus(active)}</span><h3 style="margin-top:12px">${plan.name}</h3><p class="small muted">Versão ${plan.version} • liberado em ${fmtDate(active.releasedAt)}</p>${active.examDate?`<div class="notice grade"><strong>📅 Avaliação agendada</strong><div class="small">${examWhenText(active)}</div>${active.examPublicNote?`<div class="small" style="margin-top:5px">${active.examPublicNote}</div>`:""}</div>`:""}${result&&result!=="draft"?`<div class="notice ${result==="approved"?"grade":"payment"}"><strong>${result==="approved"?"Avaliação aprovada":"Reavaliar depois"}</strong>${active.evaluation.publicNote?`<div class="small">${active.evaluation.publicNote}</div>`:""}<div class="small muted">A graduação só é efetivada quando o professor confirmar.</div></div>`:""}<button class="btn secondary" onclick="openPlanPdf('${plan.id}')">📄 Abrir material PDF offline</button><div class="section-title"><h2>Conteúdo prático</h2></div><div class="checklist">${plan.practical.map((x,i)=>{const linked=(links["p"+i]||[]).map(id=>techs.find(t=>t.id===id)).filter(Boolean);return `<div class="check-item"><input type="checkbox" ${progress["p"+i]?"checked":""} onchange="saveGradProgress('${active.id}','p${i}',this.checked)"><div style="flex:1"><strong>${x}</strong>${linked.map(t=>`<div class="tech-link">🎥 ${t.title}${t.url?` <button class="mini-btn" onclick="event.preventDefault();window.open('${t.url}','_blank')">Assistir</button>`:` <span class="small muted">(vídeo ainda sem link)</span>`}</div>`).join("")}</div></div>`}).join("")}</div><div class="section-title"><h2>Conteúdo teórico</h2></div><div class="checklist">${plan.theory.map((x,i)=>`<label class="check-item"><input type="checkbox" ${progress["t"+i]?"checked":""} onchange="saveGradProgress('${active.id}','t${i}',this.checked)"><span><strong>${x}</strong></span></label>`).join("")}</div></div>`
}

async function saveGradProgress(id,key,value){{const me=await TonicaoAuth.currentUser(),ga=await DB.getOne("gradingAssignments",id);if(!ga||!me||(me.role==="aluno"?me.studentId!==ga.studentId:!TonicaoAuth.can(me,"manage_graduation"))){toast("Sem permissão.");return}}const a=await DB.getOne("gradingAssignments",id);a.progress=a.progress||{};a.progress[key]=value;await DB.put("gradingAssignments",a);toast("Progresso salvo.")}
async function openPlanPdf(planId){const p=await DB.getOne("gradingPlans",planId);if(!p)return;if(p.pdfDocId){const d=await DB.getOne("documents",p.pdfDocId);if(d?.blob){const url=URL.createObjectURL(d.blob);window.open(url,"_blank");setTimeout(()=>URL.revokeObjectURL(url),60000);return}}if(p.pdfAssetUrl){window.open(p.pdfAssetUrl,"_blank");return}toast("Nenhum PDF anexado.")}
function attachPlanPdfModal(planId){showModal(`<h3>Anexar PDF da graduação</h3><p class="small muted">O arquivo será armazenado no banco local e continuará disponível sem internet neste aparelho.</p><input id="planPdfFile" type="file" accept="application/pdf"><button class="btn primary full" style="margin-top:12px" onclick="savePlanPdf('${planId}')">Salvar PDF offline</button>`)}
async function savePlanPdf(planId){if(!(await guard("manage_graduation")))return;const f=document.getElementById("planPdfFile").files[0];if(!f){toast("Escolha um PDF.");return}const id=uid("doc");await DB.put("documents",{id,name:f.name,type:f.type||"application/pdf",blob:f,createdAt:new Date().toISOString()});const p=await DB.getOne("gradingPlans",planId);p.pdfDocId=id;await DB.put("gradingPlans",p);closeModal();toast("PDF salvo para uso offline.")}
async function planEditorModal(planId=""){
  await TonicaoAuth.requirePerm("manage_graduation");
  const plan=planId?await DB.getOne("gradingPlans",planId):null;
  const track=plan?.graduationTrack||"adulto";
  const belt=plan?.targetBelt||nextBelt("Branca",track);
  showModal(`<h3>${plan?"Editar":"Novo"} plano de graduação</h3>
    <div class="field"><label>Nome</label><input id="peName" value="${plan?.name||""}" placeholder="Ex.: Exame para Faixa Azul"></div>
    <div class="field"><label>Trilha</label><select id="peTrack" onchange="updatePlanEditorBelts('${belt}')"><option value="adulto" ${track==="adulto"?"selected":""}>Adulto</option><option value="kids" ${track==="kids"?"selected":""}>Kids</option></select></div>
    <div class="field"><label>Faixa de destino</label><select id="peBelt"></select></div>
    <div class="field"><label>Versão</label><input id="peVersion" value="${plan?.version||new Date().getFullYear()}"></div>
    <div class="field"><label>Itens práticos — um por linha</label><textarea id="pePractical" class="tall-textarea">${(plan?.practical||[]).join("\n")}</textarea></div>
    <div class="field"><label>Conteúdo teórico — um por linha</label><textarea id="peTheory">${(plan?.theory||[]).join("\n")}</textarea></div>
    <div class="field"><label>Status</label><select id="peActive"><option value="true" ${plan?.active!==false?"selected":""}>Ativo</option><option value="false" ${plan?.active===false?"selected":""}>Desativado</option></select></div>
    <div class="field"><label>Tipo</label><select id="pePilot"><option value="true" ${plan?.pilot!==false?"selected":""}>Piloto/editável</option><option value="false" ${plan?.pilot===false?"selected":""}>Definido pela academia</option></select></div>
    <button class="btn primary full" onclick="savePlanEditor('${planId||""}')">Salvar plano</button>`);
  updatePlanEditorBelts(belt)
}
function updatePlanEditorBelts(preferred=""){
  const track=document.getElementById("peTrack")?.value||"adulto",sel=document.getElementById("peBelt");if(!sel)return;
  const belts=beltsForTrack(track).slice(1);sel.innerHTML=belts.map(b=>`<option ${b===preferred?"selected":""}>${b}</option>`).join("");
  if(!belts.includes(preferred)&&belts.length)sel.value=belts[0]
}
async function savePlanEditor(planId=""){
  await TonicaoAuth.requirePerm("manage_graduation");
  const old=planId?await DB.getOne("gradingPlans",planId):null;
  const practical=document.getElementById("pePractical").value.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const theory=document.getElementById("peTheory").value.split(/\n+/).map(x=>x.trim()).filter(Boolean);
  const value={
    ...(old||{}),
    id:planId||uid("gp"),
    name:document.getElementById("peName").value.trim()||"Plano de graduação",
    graduationTrack:document.getElementById("peTrack").value,
    targetBelt:document.getElementById("peBelt").value,
    version:document.getElementById("peVersion").value.trim()||String(new Date().getFullYear()),
    practical,theory,
    active:document.getElementById("peActive").value==="true",
    pilot:document.getElementById("pePilot").value==="true",
    links:old?.links||{},
    pdfAssetUrl:old?.pdfAssetUrl||"",
    pdfDocId:old?.pdfDocId||""
  };
  await DB.put("gradingPlans",value);
  await TonicaoAuth.audit("grading.plan","Plano de graduação salvo",null,{planId:value.id,targetBelt:value.targetBelt,track:value.graduationTrack});
  closeModal();toast("Plano de graduação salvo.");renderGraduation()
}

async function showPlanChecklist(planId){
  const p=await DB.getOne("gradingPlans",planId),techs=await DB.getAll("techniques"),links=p.links||{};
  showModal(`<div class="exam-title">${p.name}</div><p class="small muted">Professor: vincule uma técnica da Biblioteca a cada item.</p><div class="checklist">${p.practical.map((x,i)=>{const linked=(links["p"+i]||[]).map(id=>techs.find(t=>t.id===id)).filter(Boolean);return `<div class="check-item"><div style="flex:1"><strong>${x}</strong><div class="small muted">${linked.length?"Vinculado: "+linked.map(t=>t.title).join(", "):"Sem vídeo vinculado"}</div><button class="mini-btn" onclick="linkTechniqueModal('${planId}',${i})">Vincular técnica</button></div></div>`}).join("")}</div><button class="btn secondary full" style="margin-top:14px" onclick="closeModal()">Fechar</button>`)
}
async function linkTechniqueModal(planId,index){
  const techs=await DB.getAll("techniques"),p=await DB.getOne("gradingPlans",planId),current=(p.links?.["p"+index]||[])[0]||"";
  showModal(`<h3>Vincular técnica</h3><p><strong>${p.practical[index]}</strong></p><div class="field"><label>Biblioteca Técnica</label><select id="linkTech"><option value="">Sem vínculo</option>${techs.map(t=>`<option value="${t.id}" ${t.id===current?"selected":""}>${t.title} • ${t.level}</option>`).join("")}</select></div><button class="btn primary full" onclick="saveTechniqueLink('${planId}',${index})">Salvar vínculo</button>`)
}
async function saveTechniqueLink(planId,index){if(!(await guard("manage_graduation")))return;
  const p=await DB.getOne("gradingPlans",planId),id=document.getElementById("linkTech").value;
  p.links=p.links||{};p.links["p"+index]=id?[id]:[];await DB.put("gradingPlans",p);closeModal();toast("Vínculo salvo.")
}


async function ruleEditorModal(id=""){
  await TonicaoAuth.requirePerm("manage_students");
  const r=id?await DB.getOne("academyRules",id):{group:"ct",groupTitle:"Regras do CT",text:"",active:true,order:99};
  showModal(`<h3>${id?"Editar":"Nova"} regra</h3>
    <div class="field"><label>Grupo</label><select id="ruleGroup"><option value="dojo" ${r.group==="dojo"?"selected":""}>Etiqueta no Dojô</option><option value="ct" ${r.group==="ct"?"selected":""}>Regras do CT</option></select></div>
    <div class="field"><label>Texto</label><textarea id="ruleText">${r.text||""}</textarea></div>
    <div class="field"><label>Ordem</label><input id="ruleOrder" type="number" value="${r.order||1}"></div>
    <div class="field"><label>Status</label><select id="ruleActive"><option value="true" ${r.active!==false?"selected":""}>Ativa</option><option value="false" ${r.active===false?"selected":""}>Desativada</option></select></div>
    <button class="btn primary full" onclick="saveAcademyRule('${id}')">Salvar regra</button>`)
}
async function saveAcademyRule(id=""){
  await TonicaoAuth.requirePerm("manage_students");
  const group=document.getElementById("ruleGroup").value;
  await DB.put("academyRules",{id:id||uid("rule"),group,groupTitle:group==="dojo"?"Etiqueta no Dojô (Tatame)":"Regras do CT Fernando Carvalho",text:document.getElementById("ruleText").value.trim(),order:Number(document.getElementById("ruleOrder").value||1),active:document.getElementById("ruleActive").value==="true",source:"Editado pelo Professor"});
  closeModal();toast("Regra salva.");renderMore("rules")
}

function downloadJsonV027(name,obj){
  const blob=new Blob([JSON.stringify(obj,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1500)
}
async function exportMyDataV027(){
  const me=await TonicaoAuth.currentUser(),settings=await getSettings();
  const out={exportedAt:new Date().toISOString(),academyId:settings.academyId||currentAcademyIdV027(),account:me?{id:me.id,name:me.name,email:me.email||"",username:me.username||"",role:me.role,studentId:me.studentId||""}:null};
  if(me?.role==="aluno"&&me.studentId){
    out.student=await DB.getOne("students",me.studentId);
    for(const st of ["attendance","gradingHistory","gradingAssignments","gradingReminders","pointsLedger","paymentStatus","notifications"]){
      out[st]=(await DB.getAll(st)).filter(x=>x.studentId===me.studentId||x.targetStudentId===me.studentId||(!x.studentId&&!x.targetStudentId&&st==="notifications"))
    }
  }
  downloadJsonV027(`meus-dados-${out.academyId}-${todayISO()}.json`,out);
  toast("Arquivo com seus dados preparado.")
}

async function renderMore(mode="menu"){
  currentMoreMode=mode;
  updateGlobalBack();
  const settings=await getSettings();
  
if(mode==="reports"){
  const me=await TonicaoAuth.currentUser();
  if(!me || !["admin","professor"].includes(me.role)){toast("Sem permissão.");renderMore();return}
  const now=new Date();
  const first=new Date(now.getFullYear(),now.getMonth(),1);
  const defaultStart=first.toISOString().slice(0,10);
  const defaultEnd=todayISO();
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Relatórios</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="card">
      <div class="grid">
        <div class="field"><label>De</label><input id="reportStart" type="date" value="${defaultStart}"></div>
        <div class="field"><label>Até</label><input id="reportEnd" type="date" value="${defaultEnd}"></div>
      </div>
      <div class="field"><label>Tipo</label><select id="reportType">
        <option value="attendance">Presença e pontuação</option>
        <option value="graduations">Graduações</option>
      </select></div>
      <button class="btn primary full" onclick="buildReport()">Gerar relatório</button>
    </div>
    <div id="reportResult" style="margin-top:14px"></div>`;
  await buildReport();
  return
}

if(mode==="rules"){
  const me=await TonicaoAuth.currentUser(),rules=(await DB.getAll("academyRules")).filter(r=>r.active!==false).sort((a,b)=>(a.group||"").localeCompare(b.group||"")||(a.order||0)-(b.order||0)),refs=await DB.getAll("referenceMaterials");
  const dojo=rules.filter(r=>r.group==="dojo"),ct=rules.filter(r=>r.group==="ct");
  const canEdit=me?.role==="professor";
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Regras da Academia</h2><div class="actions"><button class="btn secondary" onclick="renderMore()">Voltar</button>${canEdit?`<button class="btn primary" onclick="ruleEditorModal()">+ Regra</button>`:""}</div></div>
    <div class="card rules-intro"><strong>🥋 Etiqueta no Dojô</strong><p class="small muted">Conduta, respeito, higiene e segurança no tatame.</p></div>
    <ol class="rules-list">${dojo.map(r=>`<li><span>${r.text}</span>${canEdit?`<button class="mini-btn" onclick="ruleEditorModal('${r.id}')">Editar</button>`:""}</li>`).join("")}</ol>
    <div class="section-title"><h2>Regras práticas do CT</h2></div>
    <ol class="rules-list">${ct.map(r=>`<li><span>${r.text}</span>${canEdit?`<button class="mini-btn" onclick="ruleEditorModal('${r.id}')">Editar</button>`:""}</li>`).join("")}</ol>
    <div class="section-title"><h2>Registros originais</h2></div>
    <div class="reference-grid">${refs.filter(r=>r.type==="rules").map(r=>`<figure class="reference-card"><img src="${r.assetUrl}" alt="${r.title}"><figcaption><strong>${r.title}</strong><span>${r.note||""}</span></figcaption></figure>`).join("")}</div>`;
  return
}
if(mode==="graduationref"){
  const refs=(await DB.getAll("referenceMaterials")).filter(r=>r.type==="graduation");
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Referência de graduação</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="notice"><strong>Material de referência</strong><div class="small">A imagem abaixo é um registro do material IBJJF exposto no CT. Ela não muda automaticamente os critérios internos definidos pelo Professor.</div></div>
    <div class="reference-grid">${refs.map(r=>`<figure class="reference-card wide"><img src="${r.assetUrl}" alt="${r.title}"><figcaption><strong>${r.title}</strong><span>${r.note||""}</span></figcaption></figure>`).join("")}</div>`;
  return
}

if(mode==="ranking"){const students=await getStudents(),att=await getAttendance(),ranked=[...students].sort((a,b)=>(b.points||0)-(a.points||0)),monthly=[...students].map(s=>({...s,m:currentMonthAttendance(att,s.id)})).sort((a,b)=>b.m-a.m);document.getElementById("more").innerHTML=`<div class="section-title"><h2>Ranking</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div><div class="tabs"><button class="active" onclick="toggleRanking('general')">Pontuação geral</button><button onclick="toggleRanking('monthly')">Presença mensal</button></div><div id="rankingGeneral" class="list">${ranked.map((s,i)=>`<div class="list-item rank"><div class="pos">${i+1}º</div><div><strong>${s.name}</strong><span class="small muted">${s.belt}</span></div><strong>${s.points||0} pts</strong></div>`).join("")}</div><div id="rankingMonthly" class="list" style="display:none">${monthly.map((s,i)=>`<div class="list-item rank"><div class="pos">${i+1}º</div><div><strong>${s.name}</strong><span class="small muted">${s.belt}</span></div><strong>${s.m} check-in(s)</strong></div>`).join("")}</div>`;return}
  if(mode==="events"){
  const events=(await DB.getAll("events")).sort((a,b)=>String(b.date).localeCompare(String(a.date))),students=await getStudents(),me=await TonicaoAuth.currentUser(),rules=(await DB.getAll("scoreRules")).filter(r=>r.active!==false).sort((a,b)=>(a.order||0)-(b.order||0));
  if(settings.role==="aluno"){
    const current=await getCurrentStudent();const ledger=(await getLedger()).filter(x=>x.studentId===current?.id).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    document.getElementById("more").innerHTML=`<div class="section-title"><h2>Minha pontuação</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div><div class="card"><div class="kpi">${current?.points||0}</div><div class="muted">pontos acumulados</div></div><div class="notice"><strong>Regra atual</strong><div class="small">${rules.filter(r=>r.kind==="base").map(r=>`${r.name}: ${r.points} pts`).join(" • ")}</div></div><div class="section-title"><h2>Extrato</h2></div><div class="list">${ledger.map(x=>`<div class="list-item"><div class="icon">⭐</div><div style="flex:1"><strong>${x.note}</strong><div class="small muted">${x.date} • ${x.type}</div></div><strong>${x.points>0?"+":""}${x.points}</strong></div>`).join("")||`<div class="empty">Nenhum lançamento.</div>`}</div>`;return
  }
  const canEdit=me?.role==="professor";
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Sistema de Pontuação</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="score-base-grid">${rules.filter(r=>r.kind==="base").map(scoreRuleTable).join("")}</div>
    <div class="notice"><strong>Tabela da academia</strong><div class="small">Valores carregados a partir do sistema de pontuação fotografado no CT. Bônus de sequência e graduação de demonstração foram desativados para não somar pontos fora desta tabela.</div></div>
    ${canEdit?`<button class="btn secondary" onclick="editBaseScoringModal()">Editar pontos básicos</button>`:""}
    <div class="section-title"><h2>Campeonatos</h2></div>
    <div class="score-rules">${rules.filter(r=>r.kind!=="base").map(scoreRuleTable).join("")}</div>
    <div class="reference-grid">${(await DB.getAll("referenceMaterials")).filter(r=>r.type==="scoring").map(r=>`<figure class="reference-card wide"><img src="${r.assetUrl}" alt="${r.title}"><figcaption><strong>${r.title}</strong><span>${r.note}</span></figcaption></figure>`).join("")}</div>
    <div class="section-title"><h2>Eventos e lançamentos</h2>${canEdit?`<div class="actions"><button class="btn primary" onclick="newEventModal()">+ Campeonato</button><button class="btn secondary" onclick="manualPointsModal()">+ Ajuste manual</button></div>`:""}</div>
    <div class="list">${events.map(e=>`<div class="list-item"><div class="icon">${e.type==="campeonato"?"🏆":"🎯"}</div><div style="flex:1"><strong>${e.title}</strong><div class="small muted">${e.date} • ${e.presetName||e.type}</div><p class="small">${e.note||""}</p>${canEdit?`<button class="btn secondary" onclick="scoreEventModal('${e.id}')">Lançar resultados</button>`:""}</div></div>`).join("")||`<div class="empty">Nenhum evento cadastrado.</div>`}</div>`;
  return
}
  if(mode==="techniques"){const ts=await DB.getAll("techniques");document.getElementById("more").innerHTML=`<div class="section-title"><h2>Biblioteca Técnica</h2><div class="actions"><button class="btn secondary" onclick="renderMore()">Voltar</button>${settings.role==="professor"?`<button class="btn primary" onclick="newTechniqueModal()">+ Técnica</button>`:""}</div></div><div class="list">${ts.map(t=>`<div class="list-item"><div class="icon">🎥</div><div style="flex:1"><strong>${t.title}</strong><div class="small muted">${t.category} • ${t.level}</div><p class="small">${t.note||""}</p><div class="actions">${t.url?`<button class="btn secondary" onclick="window.open('${t.url}','_blank')">Assistir</button>`:`<span class="pill amber">sem link</span>`}${settings.role==="professor"?`<button class="btn secondary" onclick="editTechniqueModal('${t.id}')">Editar</button>`:""}</div></div></div>`).join("")}</div>`;return}
  

if(mode==="sequences"){
  const settings=await getSettings();if(settings.role!=="professor"){renderMore();return}
  const rules=(await DB.getAll("sequenceRules")).sort((a,b)=>a.classes-b.classes);
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Regras de sequência</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="card"><p class="small muted">Quando o aluno atinge uma sequência, o bônus entra automaticamente no extrato de pontos. A mesma conquista não é lançada duas vezes.</p></div>
    <div class="list" style="margin-top:12px">${rules.map(r=>`
      <div class="list-item"><div class="icon">🔥</div><div style="flex:1">
        <strong>${r.label||r.classes+" treinos seguidos"}</strong>
        <div class="small muted">${r.classes} treinos • +${r.points} pontos • ${r.active!==false?"ativa":"desativada"}</div>
        <div class="actions"><button class="btn secondary" onclick="editSequenceRule('${r.id}')">Editar</button></div>
      </div></div>`).join("")}</div>
    <button class="btn primary full" style="margin-top:14px" onclick="newSequenceRule()">+ Nova regra</button>`;
  return
}


if(mode==="newacademy"){
  const me=await TonicaoAuth.currentUser();
  if(me?.role!=="admin"){toast("Somente o Administrador.");renderMore();return}
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Nova academia</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="card">
      <h3>Criar estrutura limpa</h3>
      <p class="small muted">Use isso quando o app for implantado em outra escola. A história, professores, galeria e identidade institucional começam em branco.</p>
      <div class="field"><label>Nome da equipe</label><input id="newAcademyName" placeholder="Ex.: Equipe Exemplo"></div>
      <div class="field"><label>Nome da unidade</label><input id="newUnitName" placeholder="Ex.: Centro"></div>
      <div class="field"><label>ID interno</label><input id="newAcademyId" placeholder="ex.: equipe-exemplo-centro"></div>
      <div class="field"><label>Cor principal</label><input id="newAcademyColor" type="color" value="#2563eb"></div>
      <div class="notice payment"><strong>Atenção</strong><div class="small">O assistente limpa apenas conteúdo institucional e identidade. Alunos, presenças e graduações não são apagados automaticamente.</div></div>
      <button class="btn primary full" onclick="createBlankAcademyTemplate()">Criar estrutura limpa</button>
    </div>`;
  return
}

if(mode==="academy"){
  const settings=await getSettings();
  const me=await TonicaoAuth.currentUser();
  if(me?.role!=="admin"){toast("Somente o Administrador pode alterar a identidade da academia.");renderMore();return}
  const content=(await DB.getOne("academyContent","main"))||{id:"main"};
  const currentLogo=settings.logoDataUrl||"./assets/logo-tonicao.jpg";
  const timeline=(await DB.getAll("academyTimeline")).sort((a,b)=>(a.order||0)-(b.order||0));
  const gallery=(await DB.getAll("academyGallery")).sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Configurar academia</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>

    <div class="card">
      <h3>Identidade visual</h3>
      <img class="admin-logo-preview" src="${currentLogo}" alt="Logo atual">
      <div class="field"><label>Nome da equipe</label><input id="cfgAcademyName" value="${settings.academyName||settings.academy||"Tonicão Team"}"></div>
      <div class="field"><label>Nome da unidade</label><input id="cfgUnitName" value="${settings.unitName||settings.unit||"Sul da Ilha"}"></div>
      <div class="field"><label>ID interno</label><input id="cfgAcademyId" value="${settings.academyId||"tonicao-sul-ilha"}"></div>
      <div class="field"><label>Cor principal</label><input id="cfgAccent" type="color" value="${settings.accentColor||"#2563eb"}"></div>
      <div class="field"><label>Link público do aplicativo</label><input id="cfgPublicUrl" value="${settings.publicAppUrl||""}" placeholder="https://seu-app.com/"></div>
      <div class="field"><label>Trocar logo</label><input id="cfgLogo" type="file" accept="image/*"></div>
      <div class="actions"><button class="btn primary" onclick="saveAcademySettings()">Salvar identidade</button><button class="btn secondary" onclick="restoreDefaultLogo()">Restaurar logo padrão</button></div>
    </div>

    <div class="section-title"><h2>Conteúdo institucional</h2></div>
    <div class="card">
      <div class="field"><label>História da equipe</label><textarea id="histTeam" class="tall-textarea">${content.teamHistory||""}</textarea></div>
      <div class="field"><label>História da unidade</label><textarea id="histUnit" class="tall-textarea">${content.unitHistory||""}</textarea></div>
      <div class="field"><label>Linhagem</label><textarea id="histLineage" class="tall-textarea">${content.lineage||""}</textarea></div>
      <div class="field"><label>Professores / responsáveis</label><textarea id="histProfessors" class="tall-textarea">${content.professors||""}</textarea></div>
      <div class="field"><label>Fontes / observações</label><textarea id="histSources" class="tall-textarea">${content.sourcesNote||""}</textarea></div>
      <button class="btn secondary full" onclick="saveAcademyContent()">Salvar história</button>
    </div>

    <div class="section-title"><h2>Linha do tempo</h2><button class="btn primary" onclick="newTimelineItemModal()">+ Marco</button></div>
    <div class="list">${timeline.map(i=>`
      <div class="list-item"><div class="icon">📍</div><div style="flex:1"><strong>${i.year||""} — ${i.title||""}</strong><div class="small muted">${i.text||""}</div>
      <div class="actions"><button class="btn secondary" onclick="editTimelineItemModal('${i.id}')">Editar</button><button class="btn danger" onclick="deleteTimelineItem('${i.id}')">Excluir</button></div></div></div>`).join("")||`<div class="empty">Nenhum marco.</div>`}</div>

    <div class="section-title"><h2>Galeria histórica</h2></div>
    <div class="card">
      <div class="field"><label>Foto</label><input id="galleryFile" type="file" accept="image/*"></div>
      <div class="field"><label>Legenda</label><input id="galleryCaption" placeholder="Ex.: Primeira turma da unidade"></div>
      <button class="btn primary full" onclick="saveGalleryPhoto()">Adicionar foto</button>
    </div>
    <div class="gallery-grid admin-gallery">${gallery.map(g=>`
      <figure class="gallery-item"><img src="${g.dataUrl||g.assetUrl}" alt=""><figcaption>${g.caption||""}${g.category?`<br><span class="small muted">${g.category}</span>`:""}<br><button class="btn danger" onclick="deleteGalleryPhoto('${g.id}')">Excluir</button></figcaption></figure>`).join("")}</div>

    <div class="notice"><strong>Para outras academias</strong><div class="small">Use “Nova academia” para começar com estes campos em branco.</div></div>`;
  return
}
if(mode==="timer"){
  const presets=await DB.getAll("timerPresets");
  const first=presets[0]||{workSec:300,restSec:60,rounds:5};
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Cronômetro</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="timer-display">
      <div class="timer-phase" id="timerPhase">Pronto</div>
      <div class="timer-time" id="timerTime">${fmtTimer(first.workSec)}</div>
      <div class="timer-round" id="timerRound">Round 1 / ${first.rounds}</div>
    </div>
    <div class="card">
      <div class="field"><label>Preset</label><select id="timerPreset" onchange="loadTimerPreset(this.value)">
        ${presets.map(p=>`<option value="${p.id}">${p.name}</option>`).join("")}
      </select></div>
      <div class="grid">
        <div class="field"><label>Treino (seg)</label><input id="timerWork" type="number" min="1" value="${first.workSec}"></div>
        <div class="field"><label>Descanso (seg)</label><input id="timerRest" type="number" min="0" value="${first.restSec}"></div>
        <div class="field"><label>Rounds</label><input id="timerRounds" type="number" min="1" value="${first.rounds}"></div>
      </div>
      <div class="actions">
        <button class="btn primary" onclick="startTimer()">▶ Iniciar</button>
        <button class="btn secondary" onclick="pauseTimer()">⏸ Pausar</button>
        <button class="btn danger" onclick="resetTimer()">↺ Zerar</button>
      </div>
      <p class="small muted">Funciona offline. O aparelho pode vibrar e emitir um sinal no fim de cada período.</p>
    </div>`;
  timerState={running:false,phase:"work",remaining:first.workSec,round:1,totalRounds:first.rounds,work:first.workSec,rest:first.restSec,timer:null};
  updateTimerUI();
  return
}

if(mode==="history"){
  const settings=await getSettings();
  const content=(await DB.getOne("academyContent","main"))||{};
  const logo=settings.logoDataUrl||"./assets/logo-tonicao.jpg";
  const timeline=(await DB.getAll("academyTimeline")).sort((a,b)=>(a.order||0)-(b.order||0));
  const gallery=(await DB.getAll("academyGallery")).sort((a,b)=>String(b.createdAt||"").localeCompare(String(a.createdAt||"")));
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Nossa História</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="card">
      <img class="logo-history" src="${logo}" alt="Logo">
      <span class="pill">História da equipe</span>
      <h3 style="margin-top:12px">${settings.academyName||settings.academy||"Equipe"}</h3>
      <div class="history-text">${content.teamHistory||"História da equipe ainda não cadastrada."}</div>
    </div>

    <div class="section-title"><h2>${settings.unitName||settings.unit||"Unidade"}</h2>${(settings.academyId||"")==="tonicao-sul-ilha"?`<span class="pill amber">texto piloto</span>`:""}</div>
    <div class="card"><div class="history-text">${content.unitHistory||"História da unidade ainda não cadastrada."}</div></div>

    <div class="section-title"><h2>Linha do tempo</h2></div>
    <div class="timeline">${timeline.map(i=>`
      <div class="timeline-item">
        <div class="timeline-dot"></div>
        <div class="timeline-card">
          <span class="timeline-year">${i.year||""}</span>
          <strong>${i.title||""}</strong>
          <p class="small">${i.text||""}</p>
        </div>
      </div>`).join("")||`<div class="card"><p class="muted">Nenhum marco histórico cadastrado.</p></div>`}
    </div>

    <div class="section-title"><h2>Linhagem</h2></div>
    <div class="card"><div class="history-text">${content.lineage||"Linhagem ainda não cadastrada."}</div></div>

    <div class="section-title"><h2>Professor responsável</h2></div>
    <div class="card"><div class="history-text">${content.professors||"Professores ainda não cadastrados."}</div></div>

    <div class="section-title"><h2>Galeria histórica</h2></div>
    <div class="gallery-grid">${gallery.map(g=>`
      <figure class="gallery-item"><img src="${g.dataUrl||g.assetUrl}" alt="${g.caption||"Foto histórica"}"><figcaption>${g.caption||""}${g.category?`<br><span class="small muted">${g.category}</span>`:""}</figcaption></figure>`).join("")||`<div class="card"><p class="muted">Nenhuma foto histórica cadastrada ainda.</p></div>`}
    </div>

    <div class="section-title"><h2>Fontes e observações</h2></div>
    <div class="card"><div class="history-text small muted">${content.sourcesNote||"Conteúdo institucional editável pelo administrador."}</div></div>`;
  return
}
if(mode==="access"){
  const settings=await getSettings();
  const students=await getStudents();
  const current=await getCurrentStudent();
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Acesso e aparelhos</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="card">
      <h3>${settings.role==="professor"?"Modo professor":"Celular do aluno"}</h3>
      <p class="small muted">${settings.role==="aluno"&&current?`Vinculado a ${current.name}.`:"O protótipo mantém a troca de perfil para testes."}</p>
    </div>
    ${settings.role==="professor"?`
      <div class="section-title"><h2>Gerar convite do aluno</h2></div>
      <div class="card">
        <div class="field"><label>Aluno</label><select id="inviteStudent">${students.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select></div>
        <button class="btn primary full" onclick="generateStudentInvite()">Gerar convite e QR</button>
      </div>`:`
      <div class="section-title"><h2>Vincular este aparelho</h2></div>
      <div class="card">
        <p class="small muted">Cole o convite gerado no celular do professor. Depois, este aparelho passa a abrir o perfil correto do aluno.</p>
        <div class="field"><label>Convite</label><textarea id="inviteTokenInput" placeholder="TONICAO1...."></textarea></div>
        <button class="btn primary full" onclick="acceptStudentInvite()">Vincular aluno</button><button class="btn secondary full" style="margin-top:8px" onclick="scanInviteQr()">📷 Ler convite por QR</button>
      </div>`}
    <div class="section-title"><h2>Academia</h2></div>
    <div class="card">
      <strong>${settings.academyName||settings.academy||"Tonicão Team"}</strong>
      <p class="small muted">${settings.unitName||settings.unit||"Sul da Ilha"} • ID ${settings.academyId||"tonicao-sul-ilha"}</p>
    </div>`;
  return
}
if(mode==="backup"){
  const settings=await getSettings();
  const students=await getStudents();
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Backup e sincronização</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="card">
      <h3>Backup completo</h3>
      <p class="small muted">Gera um arquivo JSON com todos os dados locais da academia.</p>
      <button class="btn primary full" onclick="TonicaoSync.downloadBackup()">⬇ Exportar backup</button>
    </div>
    <div class="section-title"><h2>Restaurar / importar</h2></div>
    <div class="card">
      <input id="syncFileInput" type="file" accept=".json,application/json">
      <div class="actions">
        <button class="btn secondary" onclick="importSyncFile('merge')">Mesclar dados</button>
        <button class="btn danger" onclick="confirmReplaceImport()">Substituir dados locais</button>
      </div>
    </div>
    ${settings.role==="professor"?`
    <div class="section-title"><h2>Pacote de um aluno</h2></div>
    <div class="card">
      <p class="small muted">Serve como primeira sincronização manual enquanto o servidor remoto ainda não foi escolhido.</p>
      <div class="field"><label>Aluno</label><select id="syncStudent">${students.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select></div>
      <button class="btn secondary full" onclick="downloadSelectedStudentSync()">Exportar pacote do aluno</button>
    </div>`:""}
    <div class="notice"><strong>Como será a sincronização final</strong><div class="small">O app já separa os dados por IDs. Quando conectarmos Firebase/Supabase/outro servidor, essa tela passa a sincronizar automaticamente sem mudar a lógica do restante do aplicativo.</div></div>`;
  return
}




if(mode==="privacy"){
  const me=await TonicaoAuth.currentUser(),settings=await getSettings();
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Privacidade e dados</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="card">
      <h3>Como o aplicativo usa os dados</h3>
      <p class="small muted">O app utiliza dados necessários para cadastro, comunicação da academia, presença, graduação, pontuação, situação de acesso e segurança. Parte fica disponível offline no aparelho e, quando a conta está conectada, é sincronizada com o Firebase da academia.</p>
      <p class="small muted"><strong>Kids:</strong> cadastro de menor deve ser realizado com ciência/autorização do responsável. Nome e telefone do responsável são registrados junto à ficha.</p>
      <p class="small muted"><strong>Decisões de graduação:</strong> presença, tempo e checklist são referências; a decisão continua sendo do Professor.</p>
      <button class="btn primary full" onclick="exportMyDataV027()">⬇️ Exportar meus dados</button>
    </div>
    <div class="notice" style="margin-top:12px"><strong>Correção ou exclusão</strong><div class="small">Para corrigir ou solicitar exclusão de dados, procure o Administrador/Dono da academia. A exclusão deve respeitar registros que a academia precise manter por obrigação legal ou para resolver pendências.</div></div>
    <div class="notice" style="margin-top:12px"><strong>Academia atual</strong><div class="small">${esc(settings.academyName||"Academia")} • ${esc(settings.unitName||"Unidade")} • ID ${esc(settings.academyId||currentAcademyIdV027())}</div></div>`;
  return
}

if(mode==="users"){
  const me=await TonicaoAuth.currentUser();
  if(me?.role!=="admin"){toast("Somente o Administrador/Dono pode gerenciar usuários.");renderMore();return}
  const users=await TonicaoAuth.users();
  const students=await getStudents();
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Usuários e permissões</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <button class="btn primary full" onclick="newUserModal()">+ Novo usuário</button>
    <div class="list" style="margin-top:12px">${users.map(u=>`
      <div class="list-item">
        <div class="icon">${u.role==="admin"?"🛡️":u.role==="professor"?"🥋":"👤"}</div>
        <div style="flex:1"><strong>${u.name}</strong><div class="small muted">@${u.username} • ${TonicaoAuth.ROLE_LABEL[u.role]||u.role}${u.studentId?` • aluno vinculado`:""}</div>
        <div class="actions">
          <button class="btn secondary" onclick="changeUserPasswordModal('${u.id}')">Trocar senha</button>
          <button class="btn ${u.active!==false?"danger":"green"}" onclick="toggleUserActive('${u.id}',${u.active===false})">${u.active!==false?"Desativar":"Ativar"}</button>
        </div></div>
      </div>`).join("")}</div>
    <div class="section-title"><h2>Usuários do servidor</h2><div class="actions"><button class="btn primary" onclick="newRemoteUserModal()">+ Remoto</button><button class="btn secondary" onclick="renderRemoteGoogleUsers()">Atualizar</button></div></div>
    <div id="remoteGoogleUsersBox"><div class="card"><p class="small muted">Carregando contas da academia…</p></div></div>
    <div class="notice"><strong>Perfis</strong><div class="small"><b>Aluno:</b> somente sua área. <b>Professor:</b> autoridade acadêmica e operacional — cadastro/aprovação, check-in, presença, graduação, pontos e conteúdo. <b>Administrador/Dono:</b> manutenção, usuários, identidade e acesso da academia; visualiza o acadêmico, mas não altera decisões do Professor.</div></div>`;
  setTimeout(()=>renderRemoteGoogleUsers(),50);
  return
}
if(mode==="audit"){
  const me=await TonicaoAuth.currentUser();
  if(me?.role!=="admin"){toast("Somente administrador.");renderMore();return}
  const logs=(await DB.getAll("auditLog")).sort((a,b)=>String(b.at).localeCompare(String(a.at))).slice(0,200);
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Auditoria</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="list">${logs.map(l=>`
      <div class="list-item"><div class="icon">🧾</div><div><strong>${l.message}</strong><div class="small muted">${new Date(l.at).toLocaleString("pt-BR")} • ${l.userName} • ${l.userRole}</div></div></div>`).join("")||`<div class="empty">Nenhuma ação registrada.</div>`}</div>`;
  return
}


if(mode==="systemaccess"){
  const me=await TonicaoAuth.currentUser();if(me?.role!=="admin"){toast("Somente o Administrador/Dono.");renderMore();return}
  const settings=await getSettings();
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Status da academia</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="card">
      <span class="pill ${settings.academyAccessStatus==="blocked"?"amber":"green"}">${settings.academyAccessStatus==="blocked"?"BLOQUEADO":"ATIVO"}</span>
      <h3 style="margin-top:12px">Acesso do aplicativo</h3>
      <p class="small muted">O Administrador/Dono da academia pode consultar a situação, mas não consegue alterar a assinatura/bloqueio comercial. Esse controle pertence ao Administrador da Plataforma.</p>
      ${settings.academyAccessReason?`<div class="notice payment"><strong>Mensagem da plataforma</strong><div class="small">${esc(settings.academyAccessReason)}</div></div>`:""}
      <a class="btn secondary full" style="display:block;text-align:center;text-decoration:none;margin-top:12px" href="./platform.html" target="_blank" rel="noopener">Abrir Central da Plataforma</a>
    </div>`;
  return
}
if(mode==="cloud"){
    const settings=await getSettings();
    const status=await TonicaoCloud.getStatus();
    const remoteUser=settings.remoteUser||null;
    document.getElementById("more").innerHTML=`
      <div class="section-title"><h2>Sincronização</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
      <div class="cloud-status ${status.online?"online":"offline"}">
        <div><strong>${status.online?"🟢 Com internet":"⚪ Sem internet"}</strong><div class="small muted">${status.pending} alteração(ões) aguardando envio</div></div>
        <span class="pill ${status.pending?"amber":"green"}">${status.pending?"pendente":"em dia"}</span>
      </div>
      <div class="card">
        <h3>Firebase</h3>
        ${status.configured?`<p class="small muted">Projeto: <strong>${esc(TonicaoFirebase.cfg.projectId)}</strong> • Academia: <strong>${esc(TonicaoFirebase.academyId())}</strong></p>`:`<div class="notice payment"><strong>Não configurado</strong><div class="small">Preencha o arquivo firebase-config.js e publique novamente.</div></div>`}
        ${remoteUser?`<p class="small">Conectado como <strong>${esc(remoteUser.name)}</strong> • ${esc(TonicaoAuth.ROLE_LABEL[remoteUser.role]||remoteUser.role)}</p>`:""}
        <div class="actions"><button class="btn green" onclick="syncCloudNow()">Sincronizar agora</button><button class="btn secondary" onclick="showRemotePermissions()">Minhas permissões</button></div>
        ${remoteUser?.role==="professor"?`<button class="btn secondary full" style="margin-top:10px" onclick="cloudUploadAll()">Enviar todos os dados deste aparelho</button><p class="small muted">Use uma vez, no celular do Professor que já tem os alunos cadastrados. Apague antes os alunos de exemplo.</p>`:""}
        <div id="remotePermResult" class="small muted" style="margin-top:8px"></div>
      </div>
      <div class="section-title"><h2>Estado</h2></div>
      <div class="card">
        <div class="cloud-row"><span>Última sincronização</span><strong>${status.lastSync?new Date(status.lastSync).toLocaleString("pt-BR"):"Nunca"}</strong></div>
        <div class="cloud-row"><span>Fila local</span><strong>${status.pending}</strong></div>
        ${status.lastError?`<div class="notice payment" style="margin-top:12px"><strong>Último aviso</strong><div class="small">${esc(status.lastError)}</div></div>`:""}
      </div>
      <div class="notice"><strong>Offline continua sendo prioridade</strong><div class="small">Tudo é salvo no aparelho primeiro e enviado quando houver internet. Quem pode ver e alterar cada dado é decidido pelas regras do Firestore.</div></div>`;
    return
  }
if(mode==="notifications"){
  await TonicaoNotifications.syncInbox({showDevice:false});
  const ns=await visibleNotifications(),unread=ns.filter(n=>!n.read).length,status=await TonicaoNotifications.status();
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Avisos</h2><button class="btn secondary" onclick="renderMore()">Voltar</button></div>
    <div class="card notification-status-card">
      <div><strong>${status.permission==="granted"?"🔔 Notificações permitidas":"🔕 Notificações do aparelho desativadas"}</strong><div class="small muted">${status.remotePush?"Push remoto configurado — pode chegar com o app fechado.":"Avisos internos funcionam; push com o app fechado depende da configuração do servidor."}</div></div>
      <div class="actions"><button class="btn primary" onclick="enableDeviceNotifications()">Ativar notificações</button><button class="btn secondary" onclick="TonicaoNotifications.syncInbox({showDevice:true}).then(()=>renderMore('notifications'))">Atualizar</button></div>
    </div>
    <div class="section-title"><h2>Caixa de avisos</h2><div class="actions"><span class="pill ${unread?"amber":"green"}">${unread} não lido(s)</span>${unread?`<button class="btn secondary" onclick="markAllNotificationsRead()">Marcar lidos</button>`:""}</div></div>
    <div class="list">${ns.map(n=>`<div class="list-item notification-row ${n.read?"":"unread"}" onclick="markNotificationRead('${n.id}')"><div class="icon">${notificationIcon(n.kind)}</div><div style="flex:1"><strong>${n.title}</strong><div class="small muted">${n.createdAt?new Date(n.createdAt).toLocaleString("pt-BR"):n.date||""}</div><p class="small">${n.body}</p></div>${n.read?"":`<span class="unread-dot"></span>`}</div>`).join("")||`<div class="empty">Nenhum aviso para esta conta.</div>`}</div>
    <div class="notice"><strong>Como funciona</strong><div class="small">Com o app aberto, o servidor é consultado periodicamente. Para receber com o app totalmente fechado, o servidor precisa ter Web Push/VAPID configurado.</div></div>`;
  return
}
  document.getElementById("more").innerHTML=`
    <div class="section-title"><h2>Mais</h2></div>
    <div class="list">
      <div class="list-item" onclick="renderMore('ranking')"><div class="icon">🏆</div><div><strong>Ranking</strong><span class="small muted">Pontuação anual e presença mensal.</span></div></div>
      ${["admin","professor"].includes((await TonicaoAuth.currentUser())?.role)?`<div class="list-item" onclick="renderMore('reports')"><div class="icon">📊</div><div><strong>Relatórios</strong><span class="small muted">Presença, pontos e exportação CSV.</span></div></div>`:""}
      <div class="list-item" onclick="renderMore('events')"><div class="icon">⭐</div><div><strong>Sistema de Pontuação</strong><span class="small muted">Aulas, mensalidade, campeonatos, ranking e extrato.</span></div></div>
      <div class="list-item" onclick="renderMore('rules')"><div class="icon">📋</div><div><strong>Regras da Academia</strong><span class="small muted">Etiqueta no Dojô e regras práticas do CT.</span></div></div>
      <div class="list-item" onclick="renderMore('graduationref')"><div class="icon">🥋</div><div><strong>Referência de Graduação</strong><span class="small muted">Material IBJJF exposto no CT, separado da regra interna.</span></div></div>
      <div class="list-item" onclick="renderMore('techniques')"><div class="icon">🎥</div><div><strong>Biblioteca Técnica</strong><span class="small muted">Vídeos e níveis recomendados.</span></div></div>
      <div class="list-item" onclick="renderMore('notifications')"><div class="icon">🔔</div><div><strong>Avisos</strong><span class="small muted">Cadastros, graduação, aniversário, pagamento e mensagens do sistema.</span></div></div>
      <div class="list-item" onclick="renderMore('history')"><div class="icon">📖</div><div><strong>Nossa História</strong><span class="small muted">Equipe, unidade, linhagem e professores.</span></div></div>
      <div class="list-item" onclick="renderMore('timer')"><div class="icon">⏱️</div><div><strong>Cronômetro</strong><span class="small muted">Rounds, descanso e presets.</span></div></div>
      <div class="list-item" onclick="renderMore('access')"><div class="icon">🔐</div><div><strong>Acesso e aparelhos</strong><span class="small muted">Convite e vínculo do aluno.</span></div></div>
      <div class="list-item" onclick="renderMore('privacy')"><div class="icon">🔏</div><div><strong>Privacidade e dados</strong><span class="small muted">Consentimento, exportação e orientações de exclusão.</span></div></div>
      <div class="list-item" onclick="renderMore('backup')"><div class="icon">💾</div><div><strong>Backup e sincronização</strong><span class="small muted">Exportar, importar e transferir dados.</span></div></div>
      <div class="list-item" onclick="renderMore('cloud')"><div class="icon">☁️</div><div><strong>Sincronização automática</strong><span class="small muted">Fila offline e atualização entre aparelhos.</span></div></div>
      ${settings.role==="professor"?`
        <div class="list-item" onclick="renderMore('sequences')"><div class="icon">🔥</div><div><strong>Regras de sequência</strong><span class="small muted">Bônus por treinos consecutivos.</span></div></div>
      `:""}
      ${(await TonicaoAuth.currentUser())?.role==="admin"?`
        <div class="list-item" onclick="renderMore('academy')"><div class="icon">⚙️</div><div><strong>Configurar academia</strong><span class="small muted">Logo, nome, cor e história institucional.</span></div></div>
        <div class="list-item" onclick="renderMore('newacademy')"><div class="icon">🏫</div><div><strong>Nova academia</strong><span class="small muted">Criar identidade e conteúdo institucional em branco.</span></div></div>
        <div class="list-item" onclick="renderMore('users')"><div class="icon">🛡️</div><div><strong>Usuários e permissões</strong><span class="small muted">Administrador, professores e alunos.</span></div></div>
        <div class="list-item" onclick="renderMore('systemaccess')"><div class="icon">🔒</div><div><strong>Status da academia</strong><span class="small muted">Situação de acesso definida pela plataforma.</span></div></div>
        <div class="list-item" onclick="renderMore('audit')"><div class="icon">🧾</div><div><strong>Auditoria</strong><span class="small muted">Histórico de ações importantes.</span></div></div>
      `:""}
      <div class="list-item" onclick="accountMenu()"><div class="icon">🔄</div><div><strong>Trocar de conta / Sair</strong><span class="small muted">Entrar com outro usuário neste aparelho.</span></div></div>
    </div>`
}
function toggleRanking(which){const g=document.getElementById("rankingGeneral"),m=document.getElementById("rankingMonthly");if(!g||!m)return;g.style.display=which==="general"?"flex":"none";m.style.display=which==="monthly"?"flex":"none";document.querySelectorAll(".tabs button").forEach((b,i)=>b.classList.toggle("active",(which==="general"&&i===0)||(which==="monthly"&&i===1)))}
function newTechniqueModal(){techniqueModal({id:"",title:"",category:"Finalização",level:"Branca/Azul",week:"Biblioteca",url:"",note:""})}
async function editTechniqueModal(id){techniqueModal(await DB.getOne("techniques",id))}
function techniqueModal(t){showModal(`<h3>${t.id?"Editar":"Nova"} técnica</h3><div class="field"><label>Nome</label><input id="techTitle" value="${t.title||""}"></div><div class="field"><label>Categoria</label><input id="techCategory" value="${t.category||""}"></div><div class="field"><label>Nível/faixa recomendado</label><input id="techLevel" value="${t.level||""}" placeholder="Ex.: Branca/Azul"></div><div class="field"><label>Link do vídeo</label><input id="techUrl" value="${t.url||""}" placeholder="YouTube não listado"></div><div class="field"><label>Observações</label><textarea id="techNote">${t.note||""}</textarea></div><button class="btn primary full" onclick="saveTechnique('${t.id||""}')">Salvar</button>`)}
async function saveTechnique(id){await TonicaoAuth.requirePerm("manage_techniques");const title=document.getElementById("techTitle").value.trim();if(!title){toast("Informe o nome.");return}await DB.put("techniques",{id:id||uid("t"),title,category:document.getElementById("techCategory").value.trim(),level:document.getElementById("techLevel").value.trim(),week:"Biblioteca",url:document.getElementById("techUrl").value.trim(),note:document.getElementById("techNote").value.trim()});closeModal();toast("Técnica salva.");goPage("more");renderMore("techniques")}

function scoreRuleTable(rule){
  if(rule.kind==="base")return `<div class="score-base"><strong>${rule.name}</strong><span>${rule.points} pontos</span></div>`;
  return `<div class="card score-rule-card">
    <h3>${rule.name}</h3><div class="score-columns">
      <div><strong>Categoria</strong><span>1º — ${rule.categoria.primeiro}</span><span>2º — ${rule.categoria.segundo}</span><span>3º — ${rule.categoria.terceiro}</span></div>
      <div><strong>Absoluto</strong><span>1º — ${rule.absoluto.primeiro}</span><span>2º — ${rule.absoluto.segundo}</span><span>3º — ${rule.absoluto.terceiro}</span></div>
    </div><div class="score-participation">Participação sem pódio — <strong>${rule.participacao} pontos</strong></div>
  </div>`
}
async function getCompetitionScoreRules(){return (await DB.getAll("scoreRules")).filter(r=>r.kind!=="base"&&r.active!==false).sort((a,b)=>(a.order||0)-(b.order||0))}
async function editBaseScoringModal(){
  await TonicaoAuth.requirePerm("manage_points");
  const a=await scoreBaseRule("score-base-attendance",5),m=await scoreBaseRule("score-base-payment",20);
  showModal(`<h3>Pontos básicos</h3><div class="field"><label>Por aula</label><input id="scoreAttendance" type="number" value="${a}"></div><div class="field"><label>Mensalidade em dia</label><input id="scorePayment" type="number" value="${m}"></div><button class="btn primary full" onclick="saveBaseScoring()">Salvar</button>`)
}
async function saveBaseScoring(){
  await TonicaoAuth.requirePerm("manage_points");
  await DB.put("scoreRules",{id:"score-base-attendance",kind:"base",name:"Pontuação por aula",points:Number(document.getElementById("scoreAttendance").value||0),active:true,order:0,source:"Configuração da academia"});
  await DB.put("scoreRules",{id:"score-base-payment",kind:"base",name:"Mensalidade em dia",points:Number(document.getElementById("scorePayment").value||0),active:true,order:.1,source:"Configuração da academia"});
  closeModal();toast("Pontuação básica atualizada.");renderMore("events")
}
async function scorePresetChanged(){
  const id=document.getElementById("evPreset")?.value,box=document.getElementById("evPresetPreview");if(!box)return;
  if(id==="custom"){box.innerHTML='<div class="notice"><strong>Evento personalizado</strong><div class="small">A pontuação será informada manualmente.</div></div>';document.getElementById("customScoringFields").style.display="grid";return}
  document.getElementById("customScoringFields").style.display="none";
  const r=await DB.getOne("scoreRules",id);box.innerHTML=r?scoreRuleTable(r):""
}

async function newEventModal(){
  await TonicaoAuth.requirePerm("manage_events");
  const presets=await getCompetitionScoreRules();
  showModal(`<h3>Novo evento / campeonato</h3>
    <div class="field"><label>Nome</label><input id="evTitle"></div>
    <div class="field"><label>Data</label><input id="evDate" type="date" value="${todayISO()}"></div>
    <div class="field"><label>Tabela de pontuação</label><select id="evPreset" onchange="scorePresetChanged()">${presets.map(r=>`<option value="${r.id}">${r.name}</option>`).join("")}<option value="custom">Personalizado</option></select></div>
    <div id="evPresetPreview"></div>
    <div class="grid" id="customScoringFields" style="display:none">
      <div class="field"><label>Participação</label><input id="evP" type="number" value="0"></div>
      <div class="field"><label>1º Categoria</label><input id="ev1" type="number" value="0"></div>
      <div class="field"><label>2º Categoria</label><input id="ev2" type="number" value="0"></div>
      <div class="field"><label>3º Categoria</label><input id="ev3" type="number" value="0"></div>
    </div>
    <div class="field"><label>Observação</label><textarea id="evNote"></textarea></div>
    <button class="btn primary full" onclick="saveEvent()">Salvar</button>`);
  setTimeout(scorePresetChanged,20)
}
async function saveEvent(){
  await TonicaoAuth.requirePerm("manage_events");
  const title=document.getElementById("evTitle").value.trim();if(!title){toast("Informe o nome.");return}
  const presetId=document.getElementById("evPreset").value;
  let scoring=null,presetName="Personalizado";
  if(presetId!=="custom"){
    const r=await DB.getOne("scoreRules",presetId);scoring={participacao:r.participacao,categoria:{...r.categoria},absoluto:{...r.absoluto}};presetName=r.name
  }else{
    scoring={participacao:+document.getElementById("evP").value||0,categoria:{primeiro:+document.getElementById("ev1").value||0,segundo:+document.getElementById("ev2").value||0,terceiro:+document.getElementById("ev3").value||0},absoluto:{primeiro:0,segundo:0,terceiro:0}}
  }
  await DB.put("events",{id:uid("ev"),title,date:document.getElementById("evDate").value||todayISO(),type:"campeonato",presetId,presetName,scoring,note:document.getElementById("evNote").value});
  closeModal();await TonicaoAuth.audit("event.create","Evento criado",null,{title,presetId});toast("Evento criado.");renderMore("events")
}
function eventScoreOptions(e){
  const s=e.scoring||{},c=s.categoria||{},a=s.absoluto||{};
  return `<option value="">Sem lançamento</option><option value="participacao">Participação sem pódio (+${s.participacao||0})</option>
    <optgroup label="Categoria"><option value="categoria:primeiro">1º Categoria (+${c.primeiro||0})</option><option value="categoria:segundo">2º Categoria (+${c.segundo||0})</option><option value="categoria:terceiro">3º Categoria (+${c.terceiro||0})</option></optgroup>
    <optgroup label="Absoluto"><option value="absoluto:primeiro">1º Absoluto (+${a.primeiro||0})</option><option value="absoluto:segundo">2º Absoluto (+${a.segundo||0})</option><option value="absoluto:terceiro">3º Absoluto (+${a.terceiro||0})</option></optgroup>`
}
async function scoreEventModal(id){
  const e=await DB.getOne("events",id),students=await getStudents();
  // Compatibilidade com eventos antigos.
  if(e.scoring&&!e.scoring.categoria)e.scoring={participacao:e.scoring.participacao||0,categoria:{primeiro:e.scoring.primeiro||0,segundo:e.scoring.segundo||0,terceiro:e.scoring.terceiro||0},absoluto:{primeiro:0,segundo:0,terceiro:0}};
  showModal(`<h3>${e.title}</h3><p class="small muted">${e.presetName||"Pontuação do evento"} • resultados geram lançamentos permanentes.</p><div class="list">${students.map(s=>`<div class="list-item student-row">${studentAvatar(s)}<div class="meta"><strong>${s.name}</strong></div><select id="score-${s.id}">${eventScoreOptions(e)}</select></div>`).join("")}</div><button class="btn primary full" style="margin-top:12px" onclick="applyEventScores('${id}')">Aplicar resultados</button>`)
}
async function applyEventScores(eventId){
  await TonicaoAuth.requirePerm("manage_points");
  const e=await DB.getOne("events",eventId),students=await getStudents(),ledger=await getLedger();let count=0;
  if(e.scoring&&!e.scoring.categoria)e.scoring={participacao:e.scoring.participacao||0,categoria:{primeiro:e.scoring.primeiro||0,segundo:e.scoring.segundo||0,terceiro:e.scoring.terceiro||0},absoluto:{primeiro:0,segundo:0,terceiro:0}};
  for(const s of students){
    const result=document.getElementById("score-"+s.id)?.value;
    if(!result||ledger.some(x=>x.eventId===eventId&&x.studentId===s.id))continue;
    let pts=0,label="";
    if(result==="participacao"){pts=Number(e.scoring.participacao||0);label="participação sem pódio"}
    else{const [division,place]=result.split(":");pts=Number(e.scoring?.[division]?.[place]||0);label=`${division} — ${place}`}
    s.points=(s.points||0)+pts;await DB.put("students",s);
    await DB.put("pointsLedger",{id:`pts-event-${eventId}-${s.id}`,studentId:s.id,date:e.date,type:"campeonato",points:pts,eventId,presetId:e.presetId||"",note:`${e.title} — ${label}`});count++
  }
  closeModal();toast(`${count} lançamento(s) aplicado(s).`);renderAll();goPage("more");renderMore("events")
}

async function manualPointsModal(){const students=await getStudents();showModal(`<h3>Pontuação manual</h3><div class="field"><label>Aluno</label><select id="mpStudent">${students.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select></div><div class="field"><label>Pontos</label><input id="mpPoints" type="number" value="5"></div><div class="field"><label>Categoria</label><select id="mpType"><option value="merito">Mérito</option><option value="graduacao">Graduação</option><option value="sequencia">Sequência</option><option value="ajuste">Ajuste</option></select></div><div class="field"><label>Motivo</label><textarea id="mpNote"></textarea></div><button class="btn primary full" onclick="saveManualPoints()">Registrar</button>`)}
async function saveManualPoints(){await TonicaoAuth.requirePerm("manage_points");const id=document.getElementById("mpStudent").value,pts=Number(document.getElementById("mpPoints").value||0),type=document.getElementById("mpType").value,note=document.getElementById("mpNote").value.trim()||"Lançamento manual",s=await DB.getOne("students",id);s.points=(s.points||0)+pts;await DB.put("students",s);await DB.put("pointsLedger",{id:uid("pts"),studentId:id,date:todayISO(),type,points:pts,note});closeModal();await TonicaoAuth.audit("points.manual","Pontuação manual registrada",id,{points:pts,type,note});toast("Pontuação registrada.");renderAll();goPage("more");renderMore("events")}


async function generateStudentInvite(){
  const id=document.getElementById("inviteStudent")?.value;
  if(id)await quickInvite(id);else toast("Selecione um aluno.")
}

async function acceptStudentInvite(){
  const token=document.getElementById("inviteTokenInput")?.value?.trim();
  if(!token){toast("Cole o convite.");return}
  try{
    const body=await TonicaoSync.acceptInviteToken(token);
    toast(`Aparelho vinculado a ${body.student.name}.`);
    await renderAll();goPage("home");
  }catch(e){toast(e.message||"Convite inválido.")}
}
async function importSyncFile(mode="merge"){
  const file=document.getElementById("syncFileInput")?.files?.[0];
  if(!file){toast("Escolha um arquivo JSON.");return}
  try{
    const result=await TonicaoSync.importDatabasePackage(file,mode);
    toast(`Importação concluída (${result.scope||"dados"}).`);
    await renderAll();goPage("home");
  }catch(e){toast(e.message||"Falha ao importar.")}
}
function confirmReplaceImport(){
  showModal(`<h3>Substituir dados locais?</h3><p>Esta opção apaga os dados deste aparelho antes da importação.</p>
    <div class="notice payment"><strong>Atenção</strong><div class="small">Use apenas com um backup válido.</div></div>
    <button class="btn danger full" onclick="closeModal();importSyncFile('replace')">Sim, substituir</button>
    <button class="btn secondary full" style="margin-top:8px" onclick="closeModal()">Cancelar</button>`);
}
async function downloadSelectedStudentSync(){
  const id=document.getElementById("syncStudent")?.value;
  if(id) await TonicaoSync.downloadStudentSync(id);
}


async function scanInviteQr(){
  if(!("BarcodeDetector" in window)){toast("Leitura de QR não disponível neste navegador. Cole o convite.");return}
  showModal(`<h3>Ler convite</h3><video id="inviteQrVideo" playsinline autoplay muted style="width:100%;border-radius:16px;background:#111"></video><p class="small muted">Aponte para o QR gerado no aparelho do professor.</p><button class="btn secondary full" onclick="closeModal()">Cancelar</button>`);
  try{
    qrStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:"environment"}}});
    const video=document.getElementById("inviteQrVideo");video.srcObject=qrStream;await video.play();
    const detector=new BarcodeDetector({formats:["qr_code"]});
    const tick=async()=>{
      if(!document.getElementById("inviteQrVideo"))return;
      try{
        const codes=await detector.detect(video);
        const token=codes?.[0]?.rawValue;
        if(token&&token.startsWith("TONICAO1.")){
          stopQrCamera();
          try{
            const body=await TonicaoSync.acceptInviteToken(token);
            closeModal();toast(`Aparelho vinculado a ${body.student.name}.`);await renderAll();goPage("home");return;
          }catch(e){toast(e.message||"Convite inválido.")}
        }
      }catch(e){}
      qrTimer=setTimeout(tick,350);
    };tick();
  }catch(e){toast("Não foi possível abrir a câmera.");closeModal()}
}


async function quickInvite(id){
  const student=await DB.getOne("students",id),data=await buildInviteShareData(student);
  showModal(`<h3>Convidar ${student.name}</h3><div id="quickInviteQr" class="qr-box"></div>
  <div class="field"><label>Telefone / WhatsApp</label><input value="${student.phone||""}" readonly></div>
  <div class="field"><label>Link do aplicativo</label><textarea id="quickInviteLink" readonly>${data.link||"Configure o link público no Administrador/Dono."}</textarea></div>
  <div class="field"><label>Convite técnico</label><textarea id="quickInviteToken" readonly>${data.token}</textarea></div>
  <div class="actions"><button class="btn primary" onclick="shareStudentInvite('${student.id}')">📲 Enviar convite</button><button class="btn secondary" onclick="navigator.clipboard?.writeText(document.getElementById('quickInviteLink').value);toast('Link copiado')">Copiar link</button></div>
  <p class="small muted">No celular, “Enviar convite” usa o compartilhamento do aparelho ou abre o WhatsApp quando houver telefone cadastrado.</p>`);
  setTimeout(()=>{const box=document.getElementById("quickInviteQr");if(box&&window.QRCode){box.innerHTML="";new QRCode(box,{text:data.link||data.token,width:220,height:220,correctLevel:QRCode.CorrectLevel.M})}},50);
}


async function saveAcademySettings(){if(!(await guardRoles(["admin","professor"])))return;
  const me=await TonicaoAuth.currentUser();
  if(me?.role!=="admin"){toast("Somente o Administrador pode alterar a academia.");return}
  const requested=String(document.getElementById("cfgAcademyId").value||"").trim().toLowerCase().replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"");
  const official=currentAcademyIdV027();
  if(requested&&requested!==official){toast("O ID da academia não pode ser trocado nesta tela. Use “Nova academia” para criar outra unidade sem misturar dados.");return}
  const s=await getSettings();
  s.academyName=document.getElementById("cfgAcademyName").value.trim()||"Academia";
  s.unitName=document.getElementById("cfgUnitName").value.trim()||"Unidade";
  s.academyId=official;
  s.accentColor=document.getElementById("cfgAccent").value||"#2563eb";
  s.publicAppUrl=document.getElementById("cfgPublicUrl")?.value.trim()||s.publicAppUrl||"";
  const file=document.getElementById("cfgLogo")?.files?.[0];
  if(file){
    s.logoDataUrl=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file)});
  }
  localStorage.setItem("tonicao_academy_id",official);
  await DB.put("settings",s);
  applyBranding(s);
  await TonicaoAuth.audit("academy.identity","Identidade visual da academia atualizada",null,{academyId:s.academyId});
  toast("Identidade salva.");await renderAll();goPage("more");renderMore("academy");
}
let timerState={running:false,phase:"work",remaining:300,round:1,totalRounds:5,work:300,rest:60,timer:null};
function fmtTimer(sec){sec=Math.max(0,Math.floor(sec));return `${String(Math.floor(sec/60)).padStart(2,"0")}:${String(sec%60).padStart(2,"0")}`}
function updateTimerUI(){
  const t=document.getElementById("timerTime"),p=document.getElementById("timerPhase"),r=document.getElementById("timerRound");
  if(t)t.textContent=fmtTimer(timerState.remaining);
  if(p)p.textContent=timerState.phase==="work"?"Treino":timerState.phase==="rest"?"Descanso":"Finalizado";
  if(r)r.textContent=`Round ${Math.min(timerState.round,timerState.totalRounds)} / ${timerState.totalRounds}`;
  document.body.classList.toggle("timer-rest",timerState.phase==="rest");
}
async function loadTimerPreset(id){
  const p=await DB.getOne("timerPresets",id);if(!p)return;
  document.getElementById("timerWork").value=p.workSec;
  document.getElementById("timerRest").value=p.restSec;
  document.getElementById("timerRounds").value=p.rounds;
  resetTimer();
}
function readTimerFields(){
  timerState.work=Math.max(1,Number(document.getElementById("timerWork")?.value||300));
  timerState.rest=Math.max(0,Number(document.getElementById("timerRest")?.value||60));
  timerState.totalRounds=Math.max(1,Number(document.getElementById("timerRounds")?.value||5));
}
function timerSignal(){
  try{navigator.vibrate?.([200,100,200])}catch(e){}
  try{
    const ctx=new (window.AudioContext||window.webkitAudioContext)();
    const osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.connect(gain);gain.connect(ctx.destination);osc.frequency.value=880;gain.gain.value=.08;osc.start();osc.stop(ctx.currentTime+.25);
  }catch(e){}
}
function tickTimer(){
  timerState.remaining--;
  if(timerState.remaining<=0){
    timerSignal();
    if(timerState.phase==="work"){
      if(timerState.round>=timerState.totalRounds){
        timerState.phase="done";timerState.running=false;clearInterval(timerState.timer);timerState.remaining=0;updateTimerUI();return;
      }
      timerState.phase="rest";timerState.remaining=timerState.rest;
      if(timerState.rest===0){timerState.phase="work";timerState.round++;timerState.remaining=timerState.work}
    }else if(timerState.phase==="rest"){
      timerState.phase="work";timerState.round++;timerState.remaining=timerState.work;
    }
  }
  updateTimerUI();
}
function startTimer(){
  if(timerState.running)return;
  readTimerFields();
  if(timerState.phase==="done"){timerState.phase="work";timerState.round=1;timerState.remaining=timerState.work}
  if(!timerState.remaining||timerState.remaining<=0)timerState.remaining=timerState.phase==="rest"?timerState.rest:timerState.work;
  timerState.running=true;timerState.timer=setInterval(tickTimer,1000);updateTimerUI();
}
function pauseTimer(){timerState.running=false;if(timerState.timer)clearInterval(timerState.timer);timerState.timer=null}
function resetTimer(){
  pauseTimer();readTimerFields();timerState.phase="work";timerState.round=1;timerState.remaining=timerState.work;updateTimerUI();
}


function newSequenceRule(){
  showModal(`<h3>Nova regra de sequência</h3>
    <div class="field"><label>Nome</label><input id="seqLabel" placeholder="Ex.: 30 treinos seguidos"></div>
    <div class="field"><label>Treinos consecutivos</label><input id="seqClasses" type="number" value="5"></div>
    <div class="field"><label>Pontos de bônus</label><input id="seqPoints" type="number" value="2"></div>
    <button class="btn primary full" onclick="saveSequenceRule()">Salvar</button>`);
}
async function editSequenceRule(id){
  const r=await DB.getOne("sequenceRules",id);
  showModal(`<h3>Editar regra</h3>
    <div class="field"><label>Nome</label><input id="seqLabel" value="${r.label||""}"></div>
    <div class="field"><label>Treinos consecutivos</label><input id="seqClasses" type="number" value="${r.classes||5}"></div>
    <div class="field"><label>Pontos</label><input id="seqPoints" type="number" value="${r.points||0}"></div>
    <div class="field"><label>Ativa</label><select id="seqActive"><option value="true" ${r.active!==false?"selected":""}>Sim</option><option value="false" ${r.active===false?"selected":""}>Não</option></select></div>
    <button class="btn primary full" onclick="saveSequenceRule('${id}')">Salvar</button>`);
}
async function saveSequenceRule(id=""){await TonicaoAuth.requirePerm("manage_points");
  const value={
    id:id||uid("seq"),
    label:document.getElementById("seqLabel").value.trim()||`${document.getElementById("seqClasses").value} treinos seguidos`,
    classes:Math.max(1,Number(document.getElementById("seqClasses").value||1)),
    points:Number(document.getElementById("seqPoints").value||0),
    active:document.getElementById("seqActive")?document.getElementById("seqActive").value==="true":true
  };
  await DB.put("sequenceRules",value);closeModal();toast("Regra salva.");renderMore("sequences");
}


async function saveAcademyContent(){if(!(await guardRoles(["admin","professor"])))return;
  const me=await TonicaoAuth.currentUser();
  if(me?.role!=="admin"){toast("Somente o Administrador pode editar a história.");return}
  const old=(await DB.getOne("academyContent","main"))||{id:"main"};
  await DB.put("academyContent",{
    ...old,
    id:"main",
    teamHistory:document.getElementById("histTeam").value,
    unitHistory:document.getElementById("histUnit").value,
    lineage:document.getElementById("histLineage").value,
    professors:document.getElementById("histProfessors").value,
    sourcesNote:document.getElementById("histSources")?.value||""
  });
  await TonicaoAuth.audit("academy.content","Conteúdo institucional atualizado",null,{});
  toast("Conteúdo institucional salvo.");
}

async function restoreDefaultLogo(){if(!(await guardRoles(["admin","professor"])))return;
  const me=await TonicaoAuth.currentUser();
  if(me?.role!=="admin"){toast("Somente o Administrador.");return}
  const s=await getSettings();
  delete s.logoDataUrl;
  await DB.put("settings",s);
  applyBranding(s);
  await TonicaoAuth.audit("academy.logo","Logo padrão restaurada",null,{});
  toast("Logo padrão restaurada.");
  renderMore("academy");
}

function applyBranding(settings){
  const accent=settings?.accentColor||"#2563eb";
  document.documentElement.style.setProperty("--accent",accent);
  const logo=document.querySelector(".brand-logo");
  if(logo&&settings?.logoDataUrl)logo.src=settings.logoDataUrl;
}


async function saveCloudConfig(){
  try{
    await TonicaoCloud.saveConfig({
      enabled:document.getElementById("cloudEnabled").value==="true",
      endpoint:document.getElementById("cloudEndpoint").value.trim(),
      token:document.getElementById("cloudToken").value.trim()
    });
    toast("Configuração salva.");
    renderMore("cloud");
  }catch(e){toast(e.message||"Falha ao salvar.");}
}
async function testCloud(){
  try{
    const r=await TonicaoCloud.testConnection(
      document.getElementById("cloudEndpoint").value.trim(),
      document.getElementById("cloudToken").value.trim()
    );
    toast(r?.ok?"Servidor conectado.":"Servidor respondeu.");
  }catch(e){toast(e.message||"Falha ao conectar.");}
}
async function cloudUploadAll(){
  if(!(await guard("manage_students")))return;
  if(!confirm("Enviar todos os alunos, presenças, graduações e conteúdos deste aparelho para o Firebase?"))return;
  try{const n=await TonicaoCloud.uploadAll();toast(`${n} registro(s) na fila. Sincronizando…`);await syncCloudNow()}catch(e){toast(e.message||"Falha ao enviar.")}
}
async function syncCloudNow(){
  try{
    const r=await TonicaoCloud.syncNow();
    toast(`Sincronizado: ${r.pushed||0} enviado(s), ${r.applied||0} recebido(s).`);
    await renderAll();goPage("more");renderMore("cloud");
  }catch(e){toast(e.message||"Falha na sincronização.");}
}


async function newUserModal(){
  const me=await TonicaoAuth.currentUser();
  if(!["admin","professor"].includes(me?.role)){toast("Sem permissão.");return}
  const students=await getStudents();
  const options=me.role==="admin"?`<option value="professor">Professor</option><option value="aluno">Aluno</option><option value="admin">Administrador/Dono</option>`:`<option value="aluno">Aluno</option>`;
  showModal(`<h3>Novo usuário</h3>
    <div class="field"><label>Nome</label><input id="usrName"></div>
    <div class="field"><label>Usuário</label><input id="usrUsername" autocomplete="off"></div>
    <div class="field"><label>Senha</label><input id="usrPass" type="password" autocomplete="new-password"></div>
    <div class="field"><label>Perfil</label><select id="usrRole" onchange="toggleStudentUserField()">${options}</select></div>
    <div class="field" id="usrStudentWrap" style="${me.role==="professor"?"":"display:none"}"><label>Aluno vinculado</label><select id="usrStudent"><option value="">Selecione</option>${students.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select></div>
    <button class="btn primary full" onclick="saveNewUser()">Criar usuário</button>`);
}
function toggleStudentUserField(){
  const role=document.getElementById("usrRole")?.value;
  const wrap=document.getElementById("usrStudentWrap");
  if(wrap)wrap.style.display=role==="aluno"?"block":"none";
}
async function saveNewUser(){
  try{
    const role=document.getElementById("usrRole").value;
    const studentId=document.getElementById("usrStudent")?.value||"";
    if(role==="aluno"&&!studentId)throw new Error("Selecione o aluno vinculado.");
    await TonicaoAuth.createUser({
      name:document.getElementById("usrName").value.trim(),
      username:document.getElementById("usrUsername").value.trim(),
      password:document.getElementById("usrPass").value,
      role,studentId
    });
    closeModal();toast("Usuário criado.");renderMore("users");
  }catch(e){toast(e.message||"Falha ao criar usuário.");}
}
async function changeUserPasswordModal(id){
  const u=await DB.getOne("users",id);
  showModal(`<h3>Trocar senha</h3><p><strong>${u?.name||""}</strong></p>
    <div class="field"><label>Nova senha/PIN</label><input id="newUserPass" type="password"></div>
    <button class="btn primary full" onclick="saveUserPassword('${id}')">Salvar nova senha</button>`);
}
async function saveUserPassword(id){
  try{
    await TonicaoAuth.changePassword(id,document.getElementById("newUserPass").value);
    closeModal();toast("Senha alterada.");
  }catch(e){toast(e.message||"Falha ao alterar senha.");}
}
async function toggleUserActive(id,active){
  try{await TonicaoAuth.setActive(id,active);toast(active?"Usuário ativado.":"Usuário desativado.");renderMore("users")}
  catch(e){toast(e.message||"Falha.");}
}

let currentMainPage="home";
let currentMoreMode="menu";

function updateGlobalBack(){
  const btn=document.getElementById("globalBackBtn");
  if(!btn)return;
  const show=currentMainPage!=="home" || (currentMainPage==="more" && currentMoreMode!=="menu");
  btn.classList.toggle("show",show);
}
async function appBack(){
  const modal=document.getElementById("modal");
  if(modal?.classList.contains("show")){closeModal();return}
  if(currentMainPage==="more" && currentMoreMode!=="menu"){
    await renderMore("menu");
    currentMoreMode="menu";
    updateGlobalBack();
    return;
  }
  if(currentMainPage!=="home"){
    goPage("home");
    return;
  }
}

async function createBlankAcademyTemplate(){if(!(await guardRoles(["admin","professor"])))return;
  const me=await TonicaoAuth.currentUser();
  if(me?.role!=="admin"){toast("Somente o Administrador.");return}
  const name=document.getElementById("newAcademyName").value.trim();
  const unit=document.getElementById("newUnitName").value.trim();
  const raw=document.getElementById("newAcademyId").value.trim().toLowerCase();
  const id=raw.replace(/[^a-z0-9_-]+/g,"-").replace(/^-+|-+$/g,"");
  if(!name||!unit||!id){toast("Preencha nome, unidade e um ID válido.");return}
  if(id===currentAcademyIdV027()){toast("Este ID já é a academia atual.");return}
  localStorage.setItem("tonicao_pending_academy_id",id);
  localStorage.setItem("tonicao_pending_academy_name",name);
  localStorage.setItem("tonicao_pending_unit_name",unit);
  localStorage.setItem("tonicao_pending_academy_color",document.getElementById("newAcademyColor").value||"#2563eb");
  localStorage.setItem("tonicao_academy_id",id);
  const base=await getPublicAppUrl(),u=new URL(base,location.href);
  u.search="";u.searchParams.set("academy",id);
  location.href=u.href;
}
function newTimelineItemModal(){
  showModal(`<h3>Novo marco histórico</h3>
    <div class="field"><label>Ano/período</label><input id="tlYear" placeholder="Ex.: 2012"></div>
    <div class="field"><label>Título</label><input id="tlTitle"></div>
    <div class="field"><label>Descrição</label><textarea id="tlText"></textarea></div>
    <div class="field"><label>Ordem</label><input id="tlOrder" type="number" value="1"></div>
    <button class="btn primary full" onclick="saveTimelineItem()">Salvar</button>`);
}
async function editTimelineItemModal(id){
  const i=await DB.getOne("academyTimeline",id);
  showModal(`<h3>Editar marco histórico</h3>
    <div class="field"><label>Ano/período</label><input id="tlYear" value="${i.year||""}"></div>
    <div class="field"><label>Título</label><input id="tlTitle" value="${i.title||""}"></div>
    <div class="field"><label>Descrição</label><textarea id="tlText">${i.text||""}</textarea></div>
    <div class="field"><label>Ordem</label><input id="tlOrder" type="number" value="${i.order||1}"></div>
    <button class="btn primary full" onclick="saveTimelineItem('${id}')">Salvar</button>`);
}
async function saveTimelineItem(id=""){if(!(await guardRoles(["admin","professor"])))return;
  const me=await TonicaoAuth.currentUser();if(me?.role!=="admin"){toast("Somente Administrador.");return}
  const item={id:id||uid("tl"),year:document.getElementById("tlYear").value.trim(),title:document.getElementById("tlTitle").value.trim(),text:document.getElementById("tlText").value.trim(),order:Number(document.getElementById("tlOrder").value||1)};
  await DB.put("academyTimeline",item);
  await TonicaoAuth.audit("academy.timeline","Marco histórico salvo",null,{id:item.id});
  closeModal();toast("Marco salvo.");renderMore("academy");
}
async function deleteTimelineItem(id){if(!(await guardRoles(["admin","professor"])))return;
  const me=await TonicaoAuth.currentUser();if(me?.role!=="admin"){return}
  await DB.removeOne("academyTimeline",id);toast("Marco excluído.");renderMore("academy");
}
async function compressGalleryImageV027(file,maxSide=1600,quality=.82){
  const src=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=()=>reject(r.error);r.readAsDataURL(file)});
  const img=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src=src});
  const scale=Math.min(1,maxSide/Math.max(img.width,img.height)),w=Math.max(1,Math.round(img.width*scale)),h=Math.max(1,Math.round(img.height*scale));
  const c=document.createElement("canvas");c.width=w;c.height=h;c.getContext("2d").drawImage(img,0,0,w,h);
  const blob=await new Promise(resolve=>c.toBlob(resolve,"image/jpeg",quality));
  return {blob,dataUrl:c.toDataURL("image/jpeg",quality)}
}
async function saveGalleryPhoto(){if(!(await guardRoles(["admin","professor"])))return;
  const me=await TonicaoAuth.currentUser();if(me?.role!=="admin"){toast("Somente Administrador.");return}
  const file=document.getElementById("galleryFile")?.files?.[0];if(!file){toast("Escolha uma foto.");return}
  if(!String(file.type||"").startsWith("image/")){toast("Escolha um arquivo de imagem.");return}
  if(file.size>12*1024*1024){toast("A foto é muito grande. Use uma imagem de até 12 MB.");return}
  const id=uid("gal"),img=await compressGalleryImageV027(file),record={id,caption:document.getElementById("galleryCaption").value.trim(),category:"acervo",createdAt:new Date().toISOString()};
  let stored=false;
  if(window.TonicaoFirebase?.storage&&navigator.onLine){
    try{
      const path=`academies/${currentAcademyIdV027()}/gallery/${id}.jpg`,ref=TonicaoFirebase.storage.ref().child(path);
      await ref.put(img.blob,{contentType:"image/jpeg",customMetadata:{academyId:currentAcademyIdV027()}});
      record.assetUrl=await ref.getDownloadURL();record.storagePath=path;stored=true
    }catch(e){console.warn("Storage indisponível; usando fallback comprimido.",e)}
  }
  if(!stored){
    if(img.dataUrl.length>700000){toast("Não foi possível enviar ao Storage e a imagem ainda ficou grande demais.");return}
    record.dataUrl=img.dataUrl
  }
  await DB.put("academyGallery",record);
  toast(stored?"Foto enviada ao acervo.":"Foto adicionada em modo compatível.");renderMore("academy");
}
async function deleteGalleryPhoto(id){if(!(await guardRoles(["admin","professor"])))return;
  const me=await TonicaoAuth.currentUser();if(me?.role!=="admin"){return}
  const g=await DB.getOne("academyGallery",id);
  if(g?.storagePath&&window.TonicaoFirebase?.storage&&navigator.onLine){try{await TonicaoFirebase.storage.ref().child(g.storagePath).delete()}catch(e){}}
  await DB.removeOne("academyGallery",id);toast("Foto excluída.");renderMore("academy");
}
async function buildReport(){
  const host=document.getElementById("reportResult");if(!host)return;
  const start=document.getElementById("reportStart")?.value||"1900-01-01";
  const end=document.getElementById("reportEnd")?.value||"2999-12-31";
  const type=document.getElementById("reportType")?.value||"attendance";
  const inRange=d=>String(d||"")>=start&&String(d||"")<=end;

  if(type==="graduations"){
    const students=await getStudents();
    const hist=(await DB.getAll("gradingHistory")).filter(h=>inRange(h.date)).sort((a,b)=>String(b.date).localeCompare(String(a.date)));
    const map=Object.fromEntries(students.map(s=>[s.id,s]));
    const rows=hist.map(h=>({
      date:h.date,
      student:map[h.studentId]?.name||"Aluno",
      type:h.type==="faixa"?"Faixa":"Grau",
      from:`${h.fromBelt||"-"} ${h.fromStripes||0}`,
      to:`${h.toBelt||"-"} ${h.toStripes||0}`,
      professor:h.professor||"-",
      note:h.note||""
    }));
    window.__LAST_REPORT_ROWS__=rows;
    window.__LAST_REPORT_TYPE__="graduations";
    host.innerHTML=`
      <div class="grid">
        <div class="card"><div class="muted small">Graduações</div><div class="kpi">${rows.length}</div></div>
        <div class="card"><div class="muted small">Trocas de faixa</div><div class="kpi">${rows.filter(r=>r.type==="Faixa").length}</div></div>
      </div>
      <div class="section-title"><h2>Histórico do período</h2><button class="btn secondary" onclick="exportReportCSV()">Exportar CSV</button></div>
      <div class="report-table-wrap"><table class="report-table"><thead><tr><th>Data</th><th>Aluno</th><th>Tipo</th><th>De</th><th>Para</th><th>Professor</th></tr></thead>
      <tbody>${rows.map(r=>`<tr><td>${fmtDate(r.date)}</td><td>${r.student}</td><td>${r.type}</td><td>${r.from}</td><td>${r.to}</td><td>${r.professor}</td></tr>`).join("")||`<tr><td colspan="6">Nenhuma graduação no período.</td></tr>`}</tbody></table></div>`;
    return;
  }

  const students=await getStudents();
  const attendance=(await getAttendance()).filter(a=>inRange(a.date)&&a.status==="approved");
  const ledger=(await getLedger()).filter(x=>inRange(x.date));
  const rows=students.map(s=>({
    name:s.name,belt:s.belt,stripes:s.stripes||0,
    attendance:attendance.filter(a=>a.studentId===s.id).length,
    points:ledger.filter(x=>x.studentId===s.id).reduce((a,x)=>a+Number(x.points||0),0),
    streak:s.streak||0
  })).sort((a,b)=>b.attendance-a.attendance);
  window.__LAST_REPORT_ROWS__=rows;
  window.__LAST_REPORT_TYPE__="attendance";

  host.innerHTML=`
    <div class="grid">
      <div class="card"><div class="muted small">Presenças</div><div class="kpi">${attendance.length}</div></div>
      <div class="card"><div class="muted small">Pontos lançados</div><div class="kpi">${ledger.reduce((a,x)=>a+Number(x.points||0),0)}</div></div>
    </div>
    <div class="section-title"><h2>Alunos</h2><button class="btn secondary" onclick="exportReportCSV()">Exportar CSV</button></div>
    <div class="report-table-wrap"><table class="report-table"><thead><tr><th>Aluno</th><th>Faixa</th><th>Presenças</th><th>Pontos</th><th>Sequência atual</th></tr></thead>
    <tbody>${rows.map(r=>`<tr><td>${r.name}</td><td>${r.belt} ${r.stripes}</td><td>${r.attendance}</td><td>${r.points}</td><td>${r.streak}</td></tr>`).join("")}</tbody></table></div>`;
}
function exportReportCSV(){
  const rows=window.__LAST_REPORT_ROWS__||[];
  const type=window.__LAST_REPORT_TYPE__||"attendance";
  let matrix;
  if(type==="graduations"){
    matrix=[["Data","Aluno","Tipo","De","Para","Professor","Observação"],...rows.map(r=>[r.date,r.student,r.type,r.from,r.to,r.professor,r.note])];
  }else{
    matrix=[["Aluno","Faixa","Presenças","Pontos","Sequência"],...rows.map(r=>[r.name,`${r.belt} ${r.stripes}`,r.attendance,r.points,r.streak])];
  }
  const lines=matrix.map(cols=>cols.map(v=>`"${String(v??"").replace(/"/g,'""')}"`).join(";"));
  const blob=new Blob(["\ufeff"+lines.join("\n")],{type:"text/csv;charset=utf-8"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);
  a.download=`relatorio-${type}-${todayISO()}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500);
}


async function remoteBootstrap(){
  try{
    await saveCloudConfig();
    const r=await TonicaoRemoteAuth.bootstrap({
      username:document.getElementById("remoteBootUser").value.trim(),
      password:document.getElementById("remoteBootPass").value,
      secret:document.getElementById("remoteBootSecret").value
    });
    toast(`Administrador remoto ${r.user.username} criado.`);
    renderMore("cloud");
  }catch(e){toast(e.message||"Falha na criação remota.");}
}
async function remoteLogin(){
  try{
    await saveCloudConfig();
    const r=await TonicaoRemoteAuth.login({
      username:document.getElementById("remoteUserName").value.trim(),
      password:document.getElementById("remotePassword").value
    });
    toast(`Conectado como ${r.user.name||r.user.username}.`);
    renderMore("cloud");
  }catch(e){toast(e.message||"Falha no login remoto.");}
}
async function remoteLogout(){
  await TonicaoRemoteAuth.logout();
  toast("Sessão remota encerrada.");
  renderMore("cloud");
}


async function saveGoogleClientId(){
  try{
    await TonicaoGoogle.saveClientId(document.getElementById("googleClientId").value.trim());
    toast("Configuração do Google salva.");
    renderMore("cloud");
  }catch(e){toast(e.message||"Falha ao salvar Google.");}
}
async function loadGoogleConfig(){
  try{
    await saveCloudConfig();
    const cfg=await TonicaoGoogle.loadConfigFromServer();
    if(!cfg?.enabled)throw new Error("Google Sign-In ainda não está configurado no servidor.");
    toast("Client ID do Google carregado do servidor.");
    renderMore("cloud");
  }catch(e){toast(e.message||"Falha ao carregar Google.");}
}


async function renderRemoteGoogleUsers(){
  const host=document.getElementById("remoteGoogleUsersBox");if(!host)return;
  const settings=await getSettings();
  if(!settings.cloudSessionToken){host.innerHTML=`<div class="card"><p class="small muted">Faça login remoto como Administrador em Mais → Sincronização automática.</p></div>`;return;}
  try{
    const result=DB.clean(await TonicaoRemoteAuth.listRemoteUsers());
    const students=await getStudents();
    const pending=(result.users||[]).filter(u=>u.provider==="google"&&u.active===false);
    const active=(result.users||[]).filter(u=>u.active!==false);
    host.innerHTML=`
      ${pending.length?`<div class="subsection-label">Aguardando aprovação</div>${pending.map(u=>`
        <div class="card google-pending-card">
          <div class="google-profile-row">${u.picture?`<img src="${u.picture}" class="google-profile-photo" alt="">`:`<div class="google-profile-photo google-placeholder">G</div>`}<div><strong>${u.name||u.email}</strong><div class="small muted">${u.email||""}</div><span class="pill amber">Google • pendente</span></div></div>
          <div class="field"><label>Perfil</label><select id="grole-${u.id}" onchange="toggleGoogleStudent('${u.id}')"><option value="aluno">Aluno</option><option value="professor">Professor</option><option value="admin">Administrador</option></select></div>
          <div class="field" id="gstudentwrap-${u.id}"><label>Vincular à ficha</label><select id="gstudent-${u.id}"><option value="">Selecione o aluno</option>${students.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select></div>
          <button class="btn primary full" onclick="approveGoogleRegistration('${u.id}')">Aprovar cadastro</button>
        </div>`).join("")}`:""}
      <div class="subsection-label">Contas ativas</div>
      <div class="list">${active.map(u=>`
        <div class="list-item"><div class="icon">${u.provider==="google"?"G":u.role==="admin"?"🛡️":u.role==="professor"?"🥋":"👤"}</div><div style="flex:1">
          <strong>${u.name||u.username}</strong><div class="small muted">${u.email||("@"+u.username)} • ${u.role} • ${u.provider||"password"}</div>
          ${u.studentId?`<div class="small muted">Ficha: ${students.find(s=>s.id===u.studentId)?.name||u.studentId}</div>`:""}
          <div class="actions"><button class="btn secondary" onclick="editRemoteUserModal('${u.id}')">Editar</button>${u.provider!=="google"?`<button class="btn secondary" onclick="resetRemotePasswordModal('${u.id}')">Senha</button>`:""}<button class="btn danger" onclick="toggleRemoteUser('${u.id}',false)">Desativar</button></div>
        </div></div>`).join("")||`<div class="empty">Nenhum usuário remoto.</div>`}</div>`;
    window.__REMOTE_USERS_CACHE__=result.users||[];
  }catch(e){host.innerHTML=`<div class="notice payment"><strong>Servidor</strong><div class="small">${esc(e.message||"Não foi possível carregar os usuários.")}</div></div>`;}
}
function toggleGoogleStudent(id){
  const role=document.getElementById("grole-"+id)?.value;
  const wrap=document.getElementById("gstudentwrap-"+id);
  if(wrap)wrap.style.display=role==="aluno"?"block":"none";
}
async function approveGoogleRegistration(userId){
  try{
    const role=document.getElementById("grole-"+userId).value;
    const studentId=document.getElementById("gstudent-"+userId)?.value||"";
    if(role==="aluno"&&!studentId)throw new Error("Selecione a ficha do aluno.");
    await TonicaoRemoteAuth.approveGoogleUser({userId,role,studentId});
    toast("Cadastro Google aprovado.");
    renderRemoteGoogleUsers();
  }catch(e){toast(e.message||"Falha ao aprovar cadastro.");}
}


async function newRemoteUserModal(){
  const students=await getStudents();
  showModal(`<h3>Nova conta da academia</h3><div class="field"><label>Nome</label><input id="ruName"></div><div class="field"><label>E-mail</label><input id="ruUsername" type="email"></div><div class="field"><label>Senha inicial (9+ caracteres, maiúscula, número e símbolo)</label><input id="ruPassword" type="password"></div><div class="field"><label>Perfil</label><select id="ruRole" onchange="toggleRemoteStudentField()"><option value="professor">Professor</option><option value="aluno">Aluno</option><option value="admin">Administrador</option></select></div><div class="field" id="ruStudentWrap" style="display:none"><label>Ficha do aluno</label><select id="ruStudent"><option value="">Selecione</option>${students.map(s=>`<option value="${s.id}">${s.name}</option>`).join("")}</select></div><button class="btn primary full" onclick="saveNewRemoteUser()">Criar no servidor</button>`);
}
function toggleRemoteStudentField(){const role=document.getElementById("ruRole")?.value;const wrap=document.getElementById("ruStudentWrap");if(wrap)wrap.style.display=role==="aluno"?"block":"none";}
async function saveNewRemoteUser(){try{const role=document.getElementById("ruRole").value;const studentId=document.getElementById("ruStudent")?.value||"";if(role==="aluno"&&!studentId)throw new Error("Selecione a ficha do aluno.");await TonicaoRemoteAuth.createRemoteUser({name:document.getElementById("ruName").value.trim(),username:document.getElementById("ruUsername").value.trim(),password:document.getElementById("ruPassword").value,role,studentId});closeModal();toast("Usuário remoto criado.");renderRemoteGoogleUsers();}catch(e){toast(e.message||"Falha ao criar usuário remoto.");}}
async function editRemoteUserModal(id){const users=window.__REMOTE_USERS_CACHE__||[];const u=users.find(x=>x.id===id);if(!u)return;const students=await getStudents();showModal(`<h3>Editar usuário remoto</h3><div class="field"><label>Nome</label><input id="reuName" value="${u.name||""}"></div><div class="field"><label>Perfil</label><select id="reuRole" onchange="toggleEditRemoteStudent()">${["admin","professor","aluno"].map(r=>`<option value="${r}" ${u.role===r?"selected":""}>${r}</option>`).join("")}</select></div><div class="field" id="reuStudentWrap" style="${u.role==="aluno"?"":"display:none"}"><label>Ficha do aluno</label><select id="reuStudent"><option value="">Selecione</option>${students.map(s=>`<option value="${s.id}" ${u.studentId===s.id?"selected":""}>${s.name}</option>`).join("")}</select></div><button class="btn primary full" onclick="saveEditRemoteUser('${id}')">Salvar alterações</button>`);}
function toggleEditRemoteStudent(){const role=document.getElementById("reuRole")?.value;const wrap=document.getElementById("reuStudentWrap");if(wrap)wrap.style.display=role==="aluno"?"block":"none";}
async function saveEditRemoteUser(id){try{const role=document.getElementById("reuRole").value;const studentId=document.getElementById("reuStudent")?.value||"";if(role==="aluno"&&!studentId)throw new Error("Selecione a ficha do aluno.");await TonicaoRemoteAuth.updateRemoteUser({userId:id,role,studentId,active:true,name:document.getElementById("reuName").value.trim()});closeModal();toast("Usuário remoto atualizado.");renderRemoteGoogleUsers();}catch(e){toast(e.message||"Falha ao atualizar.");}}
async function toggleRemoteUser(id,active){try{const u=(window.__REMOTE_USERS_CACHE__||[]).find(x=>x.id===id);if(!u)return;await TonicaoRemoteAuth.updateRemoteUser({userId:id,role:u.role,studentId:u.studentId||"",active,name:u.name||""});toast(active?"Usuário remoto ativado.":"Usuário remoto desativado.");renderRemoteGoogleUsers();}catch(e){toast(e.message||"Falha ao alterar status.");}}
async function resetRemotePasswordModal(id){showModal(`<h3>Redefinir senha</h3><p class="small muted">A pessoa recebe um e-mail com o link para criar uma nova senha.</p><button class="btn primary full" onclick="saveRemotePassword('${esc(id)}')">Enviar e-mail de redefinição</button>`);}
async function saveRemotePassword(id){try{await TonicaoRemoteAuth.resetRemotePassword({userId:id});closeModal();toast("E-mail de redefinição enviado.");}catch(e){toast(e.message||"Falha ao redefinir senha.");}}


async function showRemotePermissions(){try{const r=await TonicaoRemoteAuth.remotePermissions();const host=document.getElementById("remotePermResult");if(host)host.innerHTML=`Perfil remoto: <strong>${r.role}</strong><br>Stores que pode alterar: ${(r.writeStores||[]).join(", ")||"nenhum"}`;}catch(e){toast(e.message||"Falha ao consultar permissões.");}}


async function saveSystemAccess(){
  toast("O status da academia agora é gerenciado somente pela Central da Plataforma.")
}
function goPage(id){
  currentMainPage=id;
  document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id===id));
  document.querySelectorAll(".nav button").forEach(b=>b.classList.toggle("active",b.dataset.page===id));
  if(id!=="more") currentMoreMode="menu";
  updateGlobalBack();
}
document.querySelectorAll(".nav button").forEach(btn=>btn.addEventListener("click",async()=>{
  goPage(btn.dataset.page);
  if(btn.dataset.page==="more")await renderMore("menu");
}));

async function renderAuthGate(){
  setTimeout(updateAccountButton,0);
  const completionToken=new URLSearchParams(location.search).get("complete");
  if(completionToken){
    if(!officialApiBase()&&!window.TonicaoFirebase?.configured&&!((await DB.getAll("registrationRequests")).some(r=>r.inviteToken===completionToken))){
      const gate=document.getElementById("authGate"),host=document.getElementById("authGateContent");gate.classList.add("show");document.body.classList.add("auth-locked");
      host.innerHTML=`<h2>Servidor ainda não configurado</h2><div class="notice payment"><strong>O link é válido, mas o aplicativo publicado ainda não tem a API oficial configurada.</strong><div class="small">Configure <code>apiBase</code> no arquivo config.js com a URL HTTPS do servidor e publique novamente.</div></div>`;return false
    }
    return await renderStudentCompletionGate(completionToken)
  }

  const gate=document.getElementById("authGate"),host=document.getElementById("authGateContent");
  if(window.TonicaoFirebase?.configured)return await renderCloudAuthGate(gate,host);
  const hasUsers=await TonicaoAuth.hasAnyUser(),hasOwner=await TonicaoAuth.hasOwner(),current=await TonicaoAuth.currentUser();
  if(hasOwner&&current){
    gate.classList.remove("show");document.body.classList.remove("auth-locked");return true
  }
  gate.classList.add("show");document.body.classList.add("auth-locked");
  if(!hasOwner){
    host.innerHTML=`
      <h2>Administrador/Dono</h2>
      <p class="muted">${hasUsers?"A hierarquia mudou: as contas administrativas antigas agora são Professor. Crie a conta do Dono do aplicativo.":"Crie a conta do Administrador/Dono do aplicativo."}</p>
      <div class="field"><label>Nome</label><input id="bootName" placeholder="Nome do dono"></div>
      <div class="field"><label>Usuário</label><input id="bootUser" autocomplete="username" placeholder="dono"></div>
      <div class="field"><label>Senha</label><input id="bootPass" type="password" autocomplete="new-password" placeholder="9+ caracteres: Aa, número e símbolo"></div>
      <button class="btn primary full" onclick="bootstrapAuth()">Criar Administrador/Dono</button>`;
  }else{
    const invite=new URLSearchParams(location.search).get("invite");
    host.innerHTML=`
      <h2>Entrar</h2>
      <p class="muted">Acesse com sua conta da academia.</p>
      ${invite?`<div class="notice grade"><strong>Você recebeu um convite</strong><div class="small">Entre na sua conta para concluir o vínculo.</div></div>`:""}
      <div class="field"><label>Usuário</label><input id="loginUser" autocomplete="username"></div>
      <div class="field"><label>Senha</label><input id="loginPass" type="password" autocomplete="current-password"></div>
      <button class="btn primary full" onclick="loginAuth()">Entrar</button>
      <div class="auth-divider"><span>ou</span></div>
      <div id="googleLoginArea" class="google-login-area"></div>
      <button class="btn secondary full" style="margin-top:12px" onclick="studentSelfRegistrationModal()">Quero me cadastrar como aluno</button>`;
  }
  if(hasOwner)setTimeout(()=>TonicaoGoogle?.renderButton?.("googleLoginArea"),50);
  if(hasOwner&&new URLSearchParams(location.search).has("join")&&!sessionStorage.getItem("join-opened-v16")){
    sessionStorage.setItem("join-opened-v16","1");setTimeout(()=>studentSelfRegistrationModal(),180)
  }
  return false
}
async function updateAccountButton(){
  const btn=document.getElementById("accountBtn");if(!btn)return;
  const me=await TonicaoAuth.currentUser();
  btn.style.display=me?"inline-flex":"none";btn.style.alignItems="center";btn.style.justifyContent="center";
  if(me)btn.title=`${me.name||"Minha conta"} — trocar de conta`;
}
async function renderCloudAuthGate(gate,host){
  const current=await TonicaoAuth.currentUser(),settings=await getSettings();
  if(current&&settings.cloudSessionToken){gate.classList.remove("show");document.body.classList.remove("auth-locked");return true}
  gate.classList.add("show");document.body.classList.add("auth-locked");
  host.innerHTML=`
    <h2>Entrar</h2>
    <p class="muted">Acesse com a conta da academia.</p>
    <div class="field"><label>E-mail</label><input id="cloudEmail" type="email" autocomplete="username"></div>
    <div class="field"><label>Senha</label><input id="cloudPass" type="password" autocomplete="current-password"></div>
    <button class="btn primary full" onclick="cloudLoginAuth()">Entrar</button>
    <button class="btn secondary full" style="margin-top:8px" onclick="cloudForgotPassword()">Esqueci a senha</button>
    <div class="auth-divider"><span>ou</span></div>
    <div id="googleLoginArea" class="google-login-area"></div>
    <button class="btn secondary full" style="margin-top:12px" onclick="studentSelfRegistrationModal()">Quero me cadastrar como aluno</button>
    <p class="small muted" style="margin-top:18px;text-align:center"><a href="#" onclick="cloudFirstSetupModal();return false">Primeira configuração da academia (Dono)</a></p>`;
  setTimeout(()=>TonicaoGoogle.renderButton("googleLoginArea"),30);
  return false;
}
async function cloudLoginAuth(){
  try{
    const r=await TonicaoRemoteAuth.login({username:document.getElementById("cloudEmail").value,password:document.getElementById("cloudPass").value});
    await TonicaoAuth.loginFederated(r.user);
    toast(`Bem-vindo, ${r.user.name}.`);await renderAuthGate();await renderAll();TonicaoCloud.schedule(300);
  }catch(e){toast(e.message||"Falha no login.")}
}
async function cloudForgotPassword(){
  const email=document.getElementById("cloudEmail")?.value.trim();
  if(!email){toast("Digite seu e-mail no campo acima.");return}
  try{await TonicaoRemoteAuth.sendPasswordReset(email);toast("Enviamos um link para criar nova senha no seu e-mail.")}catch(e){toast(e.message)}
}
function cloudFirstSetupModal(){
  showModal(`<h3>Primeira configuração</h3><p class="small muted">Use só uma vez, para criar a conta do Dono. Depois disso ninguém mais consegue usar esta opção.</p>
    <div class="field"><label>Nome da academia</label><input id="fsAcademy" value="${esc(localStorage.getItem("tonicao_pending_academy_name")||"Tonicão Team Sul da Ilha")}"></div>
    <div class="field"><label>Seu nome</label><input id="fsName"></div>
    <div class="field"><label>E-mail</label><input id="fsEmail" type="email" autocomplete="username"></div>
    <div class="field"><label>Senha forte (9+ caracteres, com maiúscula, minúscula, número e símbolo)</label><input id="fsPass" type="password" autocomplete="new-password"></div>
    <div class="field"><label>Repita a senha</label><input id="fsPass2" type="password" autocomplete="new-password"></div>
    <button class="btn primary full" onclick="cloudFirstSetup()">Criar conta do Dono</button>`);
}
async function cloudFirstSetup(){
  const name=document.getElementById("fsName").value.trim(),email=document.getElementById("fsEmail").value.trim(),pass=document.getElementById("fsPass").value;
  if(!name||!email){toast("Preencha nome e e-mail.");return}
  {const prob=TonicaoAuth.passwordProblem?TonicaoAuth.passwordProblem(pass):(pass.length<6?"A senha precisa ter pelo menos 6 caracteres.":"");if(prob){toast(prob);return}}
  if(pass!==document.getElementById("fsPass2").value){toast("As senhas não conferem.");return}
  try{
    const r=await TonicaoRemoteAuth.firstSetup({name,email,password:pass,academyName:document.getElementById("fsAcademy").value.trim()});
    await TonicaoAuth.loginFederated(r.user);
    {const _s=await getSettings(),_pid=localStorage.getItem("tonicao_pending_academy_id");
      _s.academyId=currentAcademyIdV027();
      if(_pid===currentAcademyIdV027()){
        _s.academyName=localStorage.getItem("tonicao_pending_academy_name")||document.getElementById("fsAcademy").value.trim();
        _s.unitName=localStorage.getItem("tonicao_pending_unit_name")||"Unidade";
        _s.accentColor=localStorage.getItem("tonicao_pending_academy_color")||"#2563eb";
      }
      await DB.rawPut("settings",_s);
      ["tonicao_pending_academy_id","tonicao_pending_academy_name","tonicao_pending_unit_name","tonicao_pending_academy_color"].forEach(k=>localStorage.removeItem(k));
    }
    closeModal();toast("Academia configurada. Você é o Administrador/Dono.");await renderAuthGate();await renderAll();TonicaoCloud.schedule(300);
  }catch(e){toast(e.message||"Falha na configuração.")}
}
async function bootstrapAuth(){
  try{
    await TonicaoAuth.bootstrapAdmin({
      name:document.getElementById("bootName").value.trim(),
      username:document.getElementById("bootUser").value.trim(),
      password:document.getElementById("bootPass").value
    });
    toast("Administrador/Dono criado.");
    await renderAuthGate();await renderAll();
  }catch(e){toast(e.message||"Falha na configuração.");}
}
async function loginAuth(){
  try{
    await TonicaoAuth.login(
      document.getElementById("loginUser").value,
      document.getElementById("loginPass").value
    );
    toast("Acesso liberado.");
    await renderAuthGate();await renderAll();
  }catch(e){toast(e.message||"Falha no login.");}
}
async function accountMenu(){
  const me=await TonicaoAuth.currentUser();if(!me)return;
  const settings=await getSettings(),cloud=!!(window.TonicaoFirebase?.configured&&settings.cloudSessionToken);
  const pending=cloud?(await DB.getPendingChanges()).length:0;
  showModal(`<h3>Minha conta</h3>
    <div class="list-item" style="cursor:default"><div class="icon">${me.role==="admin"?"🛡️":me.role==="professor"?"🥋":"👤"}</div>
      <div><strong>${esc(me.name||"Usuário")}</strong><span class="small muted">${esc(TonicaoAuth.ROLE_LABEL[me.role]||me.role)}${me.email||me.username?` • ${esc(me.email||me.username)}`:""}</span></div></div>
    ${pending?`<div class="notice grade" style="margin-top:10px"><strong>${pending} alteração(ões) ainda não enviada(s)</strong><div class="small">Vou tentar enviar antes de sair.</div></div>`:""}
    <button class="btn primary full" style="margin-top:12px" onclick="logoutAuth({switchAccount:true})">🔄 Trocar de conta</button>
    <button class="btn secondary full" style="margin-top:8px" onclick="logoutAuth()">🚪 Sair</button>`);
}
async function logoutAuth(opts={}){
  const settings=await getSettings();
  const cloud=!!(window.TonicaoFirebase?.configured&&settings.cloudSessionToken);
  if(cloud){
    // 1) tenta enviar o que ainda está no aparelho
    let pending=(await DB.getPendingChanges()).length;
    if(pending&&navigator.onLine){try{await TonicaoCloud.syncNow({silent:true})}catch(e){};pending=(await DB.getPendingChanges()).length}
    if(pending&&!opts.force&&!confirm(`${pending} alteração(ões) ainda não foram enviadas${navigator.onLine?"":" (sem internet)"}.\nSe sair agora, elas serão perdidas.\n\nSair mesmo assim?`))return;
  }
  try{closeModal()}catch(e){}
  try{await TonicaoRemoteAuth.logout()}catch(e){}
  await TonicaoAuth.logout();
  if(cloud){
    // 2) limpa os dados da academia deste aparelho: a próxima conta só vê o que tem permissão
    for(const st of [...DB.syncableStores,"syncQueue","syncLog"]){try{await DB.clearStore(st)}catch(e){}}
    const s=await getSettings();
    for(const k of ["cloudCursors","cloudCursorsOwner","remoteUser","cloudSessionToken","cloudLastSync","cloudLastError","authUserId"])delete s[k];
    await DB.rawPut("settings",s);
    sessionStorage.setItem("tonicaoAfterLogout",opts.switchAccount?"switch":"logout");
    location.reload();return;
  }
  await renderAuthGate();
  toast(opts.switchAccount?"Entre com a outra conta.":"Você saiu.");
}

async function processInviteFromUrl(){
  const token=new URLSearchParams(location.search).get("invite");
  if(!token)return;
  const u=await TonicaoAuth.currentUser();
  if(u?.role!=="aluno")return;
  try{
    await TonicaoSync.acceptInviteToken(token);
    {const _u=new URL(location.href);_u.searchParams.delete("invite");history.replaceState(null,"",_u.pathname+(_u.search||"")+_u.hash);}
    toast("Convite aplicado à sua conta.")
  }catch(e){}
}

async function applyAuthRole(){
  const u=await TonicaoAuth.currentUser();
  if(!u)return null;
  const s=await getSettings();
  s.role=u.role==="aluno"?"aluno":"professor";
  s.authUserId=u.id;
  if(u.role==="aluno"&&u.studentId)s.linkedStudentId=u.studentId;
  await DB.put("settings",s);
  return u;
}
function authRoleLabel(u){return TonicaoAuth.ROLE_LABEL[u?.role]||"Usuário";}

async function renderAll(){const authUser=await applyAuthRole();if(!authUser)return;await processInviteFromUrl();const settings=await getSettings();if(!(await renderAcademyAccessGate(authUser)))return;document.getElementById("roleSelect").value=settings.role;document.querySelector(".brand h1").textContent=`${settings.academyName||settings.academy||"Tonicão Team"} ${settings.unitName||settings.unit?"• "+(settings.unitName||settings.unit):""}`;
document.getElementById("topSubtitle").textContent=`${authRoleLabel(authUser)} • offline-first • v0.34`;if(settings.role==="professor")await renderProfessorHome();else await renderStudentHome();await renderCheckin();await renderStudents();await renderGraduation();await renderMore();updateGlobalBack();await TonicaoNotifications?.syncInbox?.({showDevice:true});if(settings.role==="professor")dispatchDeviceAlerts(false)}
document.getElementById("roleSelect").addEventListener("change",()=>{});
if("serviceWorker" in navigator)window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js").catch(()=>{}));
(async()=>{await ensureSeed();await ensureProductionCleanV22();try{const _s=await getSettings();if(!_s.sanitizedV021){await DB.sanitizeAllStores();const s2=await getSettings();s2.sanitizedV021=true;await DB.rawPut("settings",s2)}}catch(e){console.warn("Limpeza v0.23",e)}await ensureDefaultV05Data();await ensurePilotHistoryV08();await ensurePilotTimelineV09();await ensureGraduationTracksV14();await ensureOfficialMaterialsV18();await ensureRoleHierarchyV16();await ensureV027Migrations();if(await renderAuthGate())await renderAll()})();

window.addEventListener("tonicao:data-synced",async()=>{try{await renderAll()}catch(e){}});
window.addEventListener("load",()=>{const a=sessionStorage.getItem("tonicaoAfterLogout");if(a){sessionStorage.removeItem("tonicaoAfterLogout");setTimeout(()=>{toast(a==="switch"?"Entre com a outra conta.":"Você saiu.");document.getElementById("cloudEmail")?.focus()},900)}});
window.addEventListener("tonicao:cloud-revoked",async()=>{toast("Sua conta foi desativada ou ainda aguarda liberação.");await logoutAuth({force:true})});
window.addEventListener("tonicao:sync-rejected",e=>{const list=e.detail||[];const att=list.find(r=>r&&r.store==="attendance");if(att){toast(`Check-in não confirmado: ${att.reason||"recusado pelo servidor"}`);return}if(list.length)toast(`${list.length} alteração(ões) recusada(s) pelo servidor.`)});

if("serviceWorker" in navigator){
  navigator.serviceWorker.addEventListener("message",e=>{if(e.data?.type==="OPEN_NOTIFICATIONS"){goPage("more");renderMore("notifications")}});
}
window.addEventListener("load",()=>setTimeout(async()=>{
  if(new URLSearchParams(location.search).get("open")==="notifications" && await TonicaoAuth.currentUser()){goPage("more");renderMore("notifications")}
},1000));

/* ===== class-schedule.js ===== */
/* v0.28 — Grade de horários fixa, reservas de presença e QR da aula que muda a cada minuto.
   - Professor cadastra as turmas da semana (dia, horário, duração, trilha).
   - Aluno marca "Vou nesta aula" (fica pendente) e o Professor confirma depois (Veio / Faltou).
   - Aula aberta: QR em tela cheia; o código muda a cada 60 s; ler o QR (pelo app ou pela câmera
     do celular) faz o check-in automático. */
(()=>{
  "use strict";
  const DAYS=["Dom","Seg","Ter","Qua","Qui","Sex","Sáb"];
  const DAYS_LONG=["Domingo","Segunda","Terça","Quarta","Quinta","Sexta","Sábado"];
  const ROTATE_MS=60000;
  const DEVICE_KEY="tonicaoDeviceId";
  const deviceId=(()=>{try{let d=localStorage.getItem(DEVICE_KEY);if(!d){d="dev-"+Math.random().toString(36).slice(2,10);localStorage.setItem(DEVICE_KEY,d)}return d}catch(e){return "dev-x"}})();

  // ---------------- utilidades ----------------
  const isoOf=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
  const dateOffset=n=>{const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+n);return d};
  const weekdayOf=iso=>new Date(iso+"T12:00:00").getDay();
  const dayLabel=iso=>{const t=todayISO();if(iso===t)return "Hoje";if(iso===isoOf(dateOffset(1)))return "Amanhã";const d=new Date(iso+"T12:00:00");return `${DAYS_LONG[d.getDay()]} ${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}`};
  const endTime=(start,min)=>{const [h,m]=String(start||"00:00").split(":").map(Number);const t=h*60+m+Number(min||0);return `${String(Math.floor(t/60)%24).padStart(2,"0")}:${String(t%60).padStart(2,"0")}`};
  const trackOk=(sched,track)=>!sched.track||sched.track==="todos"||sched.track===(track||"adulto");
  const bookingId=(scheduleId,date,studentId)=>`${scheduleId}_${date}_${studentId}`;
  async function me(){try{return await TonicaoAuth.currentUser()}catch(e){return null}}
  async function isCloud(){const s=await getSettings();return !!(window.TonicaoFirebase?.configured&&s.cloudSessionToken)}
  async function schedules(){return (await DB.getAll("classSchedule")).filter(s=>s.active!==false).sort((a,b)=>String(a.start).localeCompare(String(b.start)))}
  async function bookings(){return await DB.getAll("classBookings")}
  const STATUS={pending:["⏳ aguardando confirmação","amber"],confirmed:["✅ presença confirmada","green"],absent:["❌ faltou","red"]};

  // ---------------- link do QR ----------------
  async function checkinLink(session,code){
    let base="";try{base=await getPublicAppUrl()}catch(e){}
    base=(base||location.href.split("?")[0].split("#")[0]).replace(/\/+$/,"/");
    const u=new URL(base,location.href);u.search="";u.hash="";
    u.searchParams.set("ci",session.id);u.searchParams.set("c",code);
    return u.href;
  }
  function parseScanned(value){
    const v=String(value||"").trim();
    if(/^\d{6}$/.test(v))return {code:v,sessionId:""};
    try{const u=new URL(v);const c=u.searchParams.get("c")||"";if(/^\d{6}$/.test(c))return {code:c,sessionId:u.searchParams.get("ci")||""}}catch(e){}
    return {code:v,sessionId:""};
  }
  window.parseScannedCheckinV028=parseScanned;

  // Desenha o QR com o LINK (funciona pela câmera normal do celular)
  window.drawSessionQR=async function(session,hostId="sessionQr",size=220){
    const box=document.getElementById(hostId);if(!box||!session)return;
    box.innerHTML="";
    if(!session.code){box.innerHTML=`<div class="small muted">Código disponível só no aparelho do Professor.</div>`;return}
    const link=await checkinLink(session,session.code);
    if(window.QRCode){try{new QRCode(box,{text:link,width:size,height:size,correctLevel:QRCode.CorrectLevel.M});return}catch(e){}}
    box.innerHTML=`<div class="small muted">QR indisponível neste aparelho. Use o código abaixo.</div>`;
  };

  // ---------------- abrir aula (manual ou pela grade) ----------------
  async function createSession({title,duration,scheduleId=""}){
    if(!(await guard("attendance")))return null;
    const now=new Date(),exp=new Date(now.getTime()+Number(duration||90)*60000);
    const cur=activeSession(await getSessions());if(cur)await closeClassSession(cur.id,true);
    const s={id:uid("cls"),title,code:sixDigitCode(),prevCode:"",nextCode:sixDigitCode(),codeChangedAt:now.toISOString(),hostDevice:deviceId,
      scheduleId,date:todayISO(),startTime:now.toTimeString().slice(0,5),createdAt:now.toISOString(),expiresAt:exp.toISOString(),status:"open"};
    await DB.put("classSessions",s);
    try{TonicaoCloud.schedule(200)}catch(e){}
    return s;
  }
  window.openClassSession=async function(){
    const title=document.getElementById("classTitle")?.value?.trim()||"Treino de Jiu-Jitsu";
    const duration=+(document.getElementById("classDuration")?.value||90);
    const s=await createSession({title,duration});if(!s)return;
    toast("Aula aberta. O código muda a cada minuto.");await renderAll();
  };
  window.openScheduledClass=async function(scheduleId){
    const sc=await DB.getOne("classSchedule",scheduleId);if(!sc)return;
    const s=await createSession({title:`${sc.name} • ${sc.start}`,duration:sc.duration||90,scheduleId});if(!s)return;
    toast("Aula aberta. Deixe o QR à vista dos alunos.");await renderAll();showQrFullscreen();
  };

  // ---------------- código que muda a cada minuto ----------------
  async function rotateIfNeeded(){
    const s=activeSession(await getSessions());if(!s||!s.code||s.hostDevice!==deviceId)return;
    const cloud=await isCloud();
    if(cloud&&!navigator.onLine)return; // sem internet o servidor não saberia o código novo: mantém o atual
    if(Date.now()-Date.parse(s.codeChangedAt||s.createdAt)<ROTATE_MS)return;
    // o próximo código já está no servidor, então o novo QR vale no mesmo instante
    s.prevCode=s.code;s.code=s.nextCode||sixDigitCode();s.nextCode=sixDigitCode();s.codeChangedAt=new Date().toISOString();
    await DB.put("classSessions",s);
    try{TonicaoCloud.schedule(300)}catch(e){}
    refreshCodeViews(s);
  }
  function refreshCodeViews(s){
    document.querySelectorAll(".session-code").forEach(el=>el.textContent=s.code);
    if(document.getElementById("sessionQr"))drawSessionQR(s,"sessionQr",220);
    if(document.getElementById("fsQr"))drawSessionQR(s,"fsQr",Math.min(window.innerWidth*0.8,window.innerHeight*0.5,520));
    const c=document.getElementById("fsCode");if(c)c.textContent=s.code;
  }
  setInterval(()=>{rotateIfNeeded().catch(()=>{});tickCountdown().catch(()=>{})},1000);
  async function tickCountdown(){
    const el=document.getElementById("fsCountdown")||document.getElementById("codeCountdown");if(!el)return;
    const s=activeSession(await getSessions());if(!s)return;
    const left=Math.max(0,Math.ceil((ROTATE_MS-(Date.now()-Date.parse(s.codeChangedAt||s.createdAt)))/1000));
    const txt=s.hostDevice===deviceId?`novo código em ${left}s`:"código controlado por outro aparelho";
    document.querySelectorAll("#fsCountdown,#codeCountdown").forEach(x=>x.textContent=txt);
  }

  // ---------------- tela cheia para a porta do tatame ----------------
  let unwatch=null;
  window.showQrFullscreen=async function(){
    const s=activeSession(await getSessions());if(!s){toast("Abra uma aula primeiro.");return}
    let o=document.getElementById("qrFull");
    if(!o){o=document.createElement("div");o.id="qrFull";document.body.appendChild(o)}
    o.setAttribute("style","position:fixed;inset:0;z-index:2500;background:#fff;color:#111;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;padding:calc(16px + env(safe-area-inset-top,0px)) 16px 16px;overflow:auto;text-align:center");
    o.innerHTML=`<div style="font:800 22px system-ui,sans-serif">${esc(s.title)}</div>
      <div style="font:600 15px system-ui,sans-serif;color:#555;margin:4px 0 8px">Aponte a câmera do celular para fazer o check-in</div>
      <div id="fsQr" style="background:#fff;padding:8px"></div>
      <div id="fsCode" style="font:800 44px ui-monospace,monospace;letter-spacing:8px;margin-top:6px">${esc(s.code||"")}</div>
      <div id="fsCountdown" style="font:600 14px system-ui,sans-serif;color:#b45309"></div>
      <div id="fsPresent" style="margin-top:12px;width:100%;max-width:560px;text-align:left"></div>
      <button class="btn secondary" style="margin-top:14px" onclick="closeQrFullscreen()">Fechar tela cheia</button>`;
    try{await navigator.wakeLock?.request("screen")}catch(e){}
    drawSessionQR(s,"fsQr",Math.min(window.innerWidth*0.8,window.innerHeight*0.5,520));
    renderPresent(s.id);tickCountdown();
    if(unwatch)unwatch();
    unwatch=TonicaoCloud.watchSession?TonicaoCloud.watchSession(s.id,()=>renderPresent(s.id)):null;
  };
  window.closeQrFullscreen=function(){document.getElementById("qrFull")?.remove();if(unwatch){unwatch();unwatch=null}renderAll()};
  async function renderPresent(sessionId){
    const host=document.getElementById("fsPresent");if(!host)return;
    const att=(await DB.getAll("attendance")).filter(a=>a.sessionId===sessionId);
    const students=await DB.getAll("students");const name=id=>students.find(s=>s.id===id)?.name||"Aluno";
    host.innerHTML=`<div style="font:800 16px system-ui,sans-serif;margin-bottom:6px">✅ Presentes: ${att.filter(a=>a.status==="approved").length}${att.some(a=>a.status==="pending")?` • ⏳ confirmando: ${att.filter(a=>a.status==="pending").length}`:""}</div>`+
      att.sort((a,b)=>String(b.time).localeCompare(String(a.time))).slice(0,12).map(a=>`<div style="padding:6px 10px;border-radius:10px;background:#f3f4f6;margin:3px 0;font:600 15px system-ui,sans-serif">${a.status==="approved"?"✅":"⏳"} ${esc(name(a.studentId))} <span style="color:#777;font-weight:400">${esc(a.time||"")}</span></div>`).join("");
  }
  window.addEventListener("tonicao:data-synced",()=>{if(!document.getElementById("qrFull"))return;getSessions().then(ss=>{const s=activeSession(ss);if(s)renderPresent(s.id)})});

  // ---------------- check-in pelo link (câmera do celular) ----------------
  (function captureLink(){
    const p=new URLSearchParams(location.search);const ci=p.get("ci"),c=p.get("c");
    if(ci&&/^\d{6}$/.test(c||"")){
      sessionStorage.setItem("tonicaoPendingCheckin",JSON.stringify({sessionId:ci,code:c,at:Date.now()}));
      const u=new URL(location.href);u.searchParams.delete("ci");u.searchParams.delete("c");history.replaceState(null,"",u.pathname+(u.search||"")+u.hash);
    }
  })();
  async function processPendingLink(){
    const raw=sessionStorage.getItem("tonicaoPendingCheckin");if(!raw)return false;
    const p=JSON.parse(raw);if(Date.now()-p.at>30*60000){sessionStorage.removeItem("tonicaoPendingCheckin");return false}
    const u=await me();if(!u)return false; // espera o login
    sessionStorage.removeItem("tonicaoPendingCheckin");
    if(u.role!=="aluno"){toast("Este QR é para o check-in dos alunos.");return true}
    if(typeof window.familyCheckinEntryV032==="function")await window.familyCheckinEntryV032(p.sessionId,p.code);
    else await checkinBySession(u.studentId,p.sessionId,p.code);
    return true;
  }
  (async()=>{for(let i=0;i<600;i++){try{if(await processPendingLink())return}catch(e){console.warn(e)}await new Promise(r=>setTimeout(r,1000))}})();

  async function checkinBySession(studentId,sessionId,code){
    if(!studentId){toast("Sua conta ainda não está ligada a uma ficha de aluno. Fale com o Professor.");return}
    const s=await DB.getOne("students",studentId);
    if(s&&["pendente","verificar","bloqueado"].includes(s.payment)){toast("Check-in bloqueado: pagamento precisa ser verificado pelo Professor.");return}
    if(await isCloud()){
      const att=await DB.getAll("attendance");
      if(att.some(a=>a.studentId===studentId&&a.sessionId===sessionId)){toast("Você já fez check-in nesta aula. ✅");return}
      await registerAttendance(studentId,"qr-codigo",sessionId,{checkinCode:code});
      try{await TonicaoCloud.syncNow({silent:true})}catch(e){}
      const done=(await DB.getAll("attendance")).find(a=>a.studentId===studentId&&a.sessionId===sessionId);
      if(done)showBigOk("Check-in feito!","Sua presença foi registrada nesta aula.");
      return;
    }
    await studentCheckinByCode(studentId,code);
  }
  function showBigOk(title,sub){
    showModal(`<div style="text-align:center;padding:10px 0"><div style="font-size:64px">✅</div><h3 style="margin:6px 0">${esc(title)}</h3><p class="muted">${esc(sub)}</p><button class="btn primary full" onclick="closeModal()">OK</button></div>`);
  }

  // leitor de QR do app: aceita o código ou o link
  const baseStudentCheckin=window.studentCheckinByCode;
  window.studentCheckinByCode=async function(id,value){
    const {code,sessionId}=parseScanned(value);
    if(sessionId&&(await isCloud()))return checkinBySession(id,sessionId,code);
    const session=activeSession(await getSessions());
    if(session&&session.code&&code!==session.code&&[session.prevCode,session.nextCode].includes(code))return baseStudentCheckin(id,session.code);
    return baseStudentCheckin(id,code);
  };

  // ---------------- confirmar reservas quando a presença é lançada ----------------
  async function confirmBookingFor(studentId,sessionId,date){
    const sess=sessionId?await DB.getOne("classSessions",sessionId):null;
    const d=date||sess?.date||todayISO();
    const list=(await bookings()).filter(b=>b.studentId===studentId&&b.date===d&&b.status==="pending"&&(!sess?.scheduleId||b.scheduleId===sess.scheduleId));
    for(const b of list){b.status="confirmed";b.confirmedAt=new Date().toISOString();b.sessionId=sessionId||"";await DB.put("classBookings",b)}
  }
  const baseAward=window.awardAttendancePoints;
  window.awardAttendancePoints=async function(studentId,sessionId){
    await baseAward(studentId,sessionId);
    try{await confirmBookingFor(studentId,sessionId)}catch(e){}
  };
  const baseRegister=window.registerAttendance;
  window.registerAttendance=async function(id,source="professor",sessionId=null,extra={}){
    const r=await baseRegister(id,source,sessionId,extra);
    const u=await me();
    if(u&&u.role!=="aluno"){try{await confirmBookingFor(id,sessionId)}catch(e){}}
    return r;
  };

  // ---------------- grade de horários (Professor) ----------------
  window.scheduleManagerModal=async function(){
    if(!(await guard("attendance")))return;
    const list=(await DB.getAll("classSchedule")).sort((a,b)=>(a.days?.[0]??9)-(b.days?.[0]??9)||String(a.start).localeCompare(String(b.start)));
    showModal(`<h3>📅 Grade de horários</h3><p class="small muted">Turmas fixas da semana. Valem daqui para frente até você mudar.</p>
      <div class="list">${list.length?list.map(s=>`<div class="list-item" onclick="scheduleEditModal('${esc(s.id)}')" style="${s.active===false?"opacity:.5":""}"><div class="icon">🥋</div><div><strong>${esc(s.start)}–${esc(endTime(s.start,s.duration))} • ${esc(s.name)}</strong><span class="small muted">${(s.days||[]).map(d=>DAYS[d]).join(", ")} • ${s.track==="kids"?"Kids":s.track==="adulto"?"Adulto":"Todos"}${s.active===false?" • pausada":""}</span></div></div>`).join(""):`<div class="notice">Nenhuma turma cadastrada ainda.</div>`}</div>
      <button class="btn primary full" style="margin-top:12px" onclick="scheduleEditModal('')">+ Nova turma</button>`);
  };
  window.scheduleEditModal=async function(id){
    if(!(await guard("attendance")))return;
    const s=id?await DB.getOne("classSchedule",id):{name:"Jiu-Jitsu",days:[1,3,5],start:"19:00",duration:90,track:"todos",active:true};
    showModal(`<h3>${id?"Editar turma":"Nova turma"}</h3>
      <div class="field"><label>Nome da turma</label><input id="scName" value="${esc(s.name||"")}" placeholder="Ex.: Adulto, Kids, Competição"></div>
      <div class="field"><label>Dias da semana</label><div style="display:flex;flex-wrap:wrap;gap:6px">${DAYS.map((d,i)=>`<label style="display:flex;align-items:center;gap:4px;padding:8px 10px;border:1px solid #ddd;border-radius:999px"><input type="checkbox" class="scDay" value="${i}" ${(s.days||[]).includes(i)?"checked":""}> ${d}</label>`).join("")}</div></div>
      <div class="field"><label>Horário de início</label><input id="scStart" type="time" value="${esc(s.start||"19:00")}"></div>
      <div class="field"><label>Duração</label><select id="scDuration">${[45,60,75,90,120].map(m=>`<option value="${m}" ${Number(s.duration)===m?"selected":""}>${m>=60?`${Math.floor(m/60)}h${m%60?String(m%60).padStart(2,"0"):""}`:m+" min"}</option>`).join("")}</select></div>
      <div class="field"><label>Para quem</label><select id="scTrack"><option value="todos" ${s.track==="todos"||!s.track?"selected":""}>Todos</option><option value="adulto" ${s.track==="adulto"?"selected":""}>Adulto</option><option value="kids" ${s.track==="kids"?"selected":""}>Kids</option></select></div>
      <div class="field"><label>Situação</label><select id="scActive"><option value="1" ${s.active!==false?"selected":""}>Ativa</option><option value="0" ${s.active===false?"selected":""}>Pausada</option></select></div>
      <button class="btn primary full" onclick="scheduleSave('${esc(id||"")}')">Salvar</button>
      ${id?`<button class="btn danger full" style="margin-top:8px" onclick="scheduleDelete('${esc(id)}')">Excluir turma</button>`:""}
      <button class="btn secondary full" style="margin-top:8px" onclick="scheduleManagerModal()">Voltar</button>`);
  };
  window.scheduleSave=async function(id){
    if(!(await guard("attendance")))return;
    const days=[...document.querySelectorAll(".scDay:checked")].map(x=>Number(x.value)).sort();
    const name=document.getElementById("scName").value.trim(),start=document.getElementById("scStart").value;
    if(!name||!start||!days.length){toast("Informe nome, horário e pelo menos um dia.");return}
    const rec={...(id?await DB.getOne("classSchedule",id):{}),id:id||uid("sch"),name,days,start,duration:Number(document.getElementById("scDuration").value),track:document.getElementById("scTrack").value,active:document.getElementById("scActive").value==="1"};
    await DB.put("classSchedule",rec);toast("Turma salva.");await renderAll();scheduleManagerModal();
  };
  window.scheduleDelete=async function(id){
    if(!(await guard("attendance")))return;
    if(!confirm("Excluir esta turma da grade? As presenças já registradas continuam."))return;
    await DB.removeOne("classSchedule",id);toast("Turma excluída.");await renderAll();scheduleManagerModal();
  };

  // ---------------- reservas (Aluno) ----------------
  window.bookClass=async function(scheduleId,date){
    const u=await me();if(!u?.studentId){toast("Sua conta ainda não está ligada a uma ficha de aluno.");return}
    const id=bookingId(scheduleId,date,u.studentId);
    const cur=await DB.getOne("classBookings",id);
    if(cur&&cur.status!=="pending"){toast("Esta aula já foi confirmada pelo Professor.");return}
    await DB.put("classBookings",{id,scheduleId,date,studentId:u.studentId,status:"pending",createdAt:new Date().toISOString()});
    toast("Presença marcada. O Professor confirma depois da aula.");renderAll();
  };
  window.unbookClass=async function(scheduleId,date){
    const u=await me();if(!u?.studentId)return;
    const id=bookingId(scheduleId,date,u.studentId),cur=await DB.getOne("classBookings",id);
    if(!cur)return;if(cur.status!=="pending"){toast("Já confirmada pelo Professor.");return}
    await DB.removeOne("classBookings",id);toast("Marcação cancelada.");renderAll();
  };

  // ---------------- confirmar presenças (Professor) ----------------
  window.bookingsModal=async function(scheduleId,date){
    if(!(await guard("attendance")))return;
    const sc=await DB.getOne("classSchedule",scheduleId);const students=await DB.getAll("students");
    const list=(await bookings()).filter(b=>b.scheduleId===scheduleId&&b.date===date);
    const name=id=>students.find(s=>s.id===id)?.name||"Aluno";
    showModal(`<h3>Presenças • ${esc(sc?.name||"Turma")} ${esc(sc?.start||"")}</h3><p class="small muted">${esc(dayLabel(date))} • ${list.length} aluno(s) marcaram</p>
      <div class="list">${list.length?list.sort((a,b)=>name(a.studentId).localeCompare(name(b.studentId))).map(b=>`<div class="list-item" style="cursor:default"><div class="meta"><strong>${esc(name(b.studentId))}</strong><span class="small muted">${STATUS[b.status]?.[0]||b.status}</span></div>${b.status==="pending"?`<div class="actions" style="flex-wrap:nowrap"><button class="btn green" onclick="decideBooking('${esc(b.id)}',true)">✅ Veio</button><button class="btn secondary" onclick="decideBooking('${esc(b.id)}',false)">❌</button></div>`:""}</div>`).join(""):`<div class="notice">Ninguém marcou presença para esta aula.</div>`}</div>
      ${list.some(b=>b.status==="pending")?`<button class="btn primary full" style="margin-top:12px" onclick="confirmAllBookings('${esc(scheduleId)}','${esc(date)}')">✅ Confirmar todos os pendentes</button>`:""}`);
  };
  async function decide(b,came){
    if(b.status!=="pending")return;
    if(came){
      const att=await DB.getAll("attendance"),sess=await getSessions();
      const schedOf=a=>a.scheduleId||sess.find(x=>x.id===a.sessionId)?.scheduleId||"";
      const has=att.some(a=>a.studentId===b.studentId&&a.date===b.date&&a.status!=="rejected"&&(a.bookingId===b.id||schedOf(a)===b.scheduleId));
      if(!has){
        const sc=await DB.getOne("classSchedule",b.scheduleId);
        await DB.put("attendance",{id:"att-bk-"+b.id,studentId:b.studentId,date:b.date,time:sc?.start||"",source:"reserva",scheduleId:b.scheduleId,bookingId:b.id,status:"approved"});
        // pontos com id fixo por reserva: nunca contam duas vezes
        if(typeof window.awardAttendanceEffectsV027==="function")await window.awardAttendanceEffectsV027(b.studentId,null,"att-bk-"+b.id);
        else await baseAward(b.studentId,null);
      }
      b.status="confirmed";
    }else b.status="absent";
    b.decidedAt=new Date().toISOString();await DB.put("classBookings",b);
  }
  window.decideBooking=async function(id,came){
    if(!(await guard("attendance")))return;
    const b=await DB.getOne("classBookings",id);if(!b)return;
    await decide(b,came);toast(came?"Presença confirmada.":"Marcado como falta.");
    await renderAll();bookingsModal(b.scheduleId,b.date);
  };
  window.confirmAllBookings=async function(scheduleId,date){
    if(!(await guard("attendance")))return;
    const list=(await bookings()).filter(b=>b.scheduleId===scheduleId&&b.date===date&&b.status==="pending");
    for(const b of list)await decide(b,true);
    toast(`${list.length} presença(s) confirmada(s).`);await renderAll();bookingsModal(scheduleId,date);
  };
  window.pendingBookingsModal=async function(){
    if(!(await guard("attendance")))return;
    const today=todayISO();const sch=await DB.getAll("classSchedule");
    const groups={};for(const b of (await bookings()).filter(b=>b.status==="pending"&&b.date<=today)){const k=b.scheduleId+"|"+b.date;(groups[k]=groups[k]||[]).push(b)}
    const keys=Object.keys(groups).sort().reverse();
    showModal(`<h3>⏳ Presenças para confirmar</h3><div class="list">${keys.length?keys.map(k=>{const [sid,date]=k.split("|");const sc=sch.find(x=>x.id===sid);return `<div class="list-item" onclick="bookingsModal('${esc(sid)}','${esc(date)}')"><div class="icon">📋</div><div><strong>${esc(dayLabel(date))} • ${esc(sc?.start||"")} ${esc(sc?.name||"Turma")}</strong><span class="small muted">${groups[k].length} aluno(s) aguardando</span></div></div>`}).join(""):`<div class="notice">Nada pendente. 👍</div>`}</div>`);
  };

  // ---------------- telas ----------------
  async function professorSection(){
    const today=todayISO(),wd=weekdayOf(today);
    const sch=(await schedules()).filter(s=>(s.days||[]).includes(wd));
    const bk=await bookings();const session=activeSession(await getSessions());
    const pend=bk.filter(b=>b.status==="pending"&&b.date<=today).length;
    return `<div class="section-title"><h2>📅 Aulas de hoje</h2><button class="btn secondary" onclick="scheduleManagerModal()">⚙️ Grade</button></div>
      ${pend?`<div class="notice grade" onclick="pendingBookingsModal()" style="cursor:pointer"><strong>⏳ ${pend} presença(s) marcada(s) para confirmar</strong><div class="small">Toque para ver e confirmar.</div></div>`:""}
      <div class="list">${sch.length?sch.map(s=>{const n=bk.filter(b=>b.scheduleId===s.id&&b.date===today).length;const open=session&&session.scheduleId===s.id;
        return `<div class="list-item" style="cursor:default"><div class="icon">🥋</div><div class="meta"><strong>${esc(s.start)}–${esc(endTime(s.start,s.duration))} • ${esc(s.name)}</strong><span class="small muted">${n} aluno(s) marcaram presença</span></div>
          <div class="actions" style="flex-wrap:nowrap">${open?`<button class="btn green" onclick="showQrFullscreen()">📺 QR</button>`:`<button class="btn primary" onclick="openScheduledClass('${esc(s.id)}')">Abrir aula</button>`}<button class="btn secondary" onclick="bookingsModal('${esc(s.id)}','${today}')">📋</button></div></div>`}).join("")
        :`<div class="notice">${(await schedules()).length?"Nenhuma turma na grade para hoje.":"Cadastre as turmas fixas da semana em ⚙️ Grade."}</div>`}</div>`;
  }
  async function studentSection(){
    const cur=await getCurrentStudent();if(!cur)return "";
    const sch=(await schedules()).filter(s=>trackOk(s,cur.graduationTrack));
    if(!sch.length)return `<div class="section-title"><h2>📅 Aulas da semana</h2></div><div class="notice">O Professor ainda não cadastrou a grade de horários.</div>`;
    const bk=(await bookings()).filter(b=>b.studentId===cur.id);
    const now=new Date(),nowHM=now.toTimeString().slice(0,5);
    let rows="";
    for(let i=0;i<7;i++){
      const iso=isoOf(dateOffset(i)),wd=weekdayOf(iso);
      const day=sch.filter(s=>(s.days||[]).includes(wd)).filter(s=>i>0||endTime(s.start,s.duration)>=nowHM);
      if(!day.length)continue;
      rows+=`<div class="small muted" style="margin:10px 2px 4px;font-weight:700">${esc(dayLabel(iso))}</div>`+day.map(s=>{
        const b=bk.find(x=>x.scheduleId===s.id&&x.date===iso);const st=b?STATUS[b.status]:null;
        return `<div class="list-item" style="cursor:default"><div class="icon">🥋</div><div class="meta"><strong>${esc(s.start)} • ${esc(s.name)}</strong><span class="small muted">${st?st[0]:"até "+esc(endTime(s.start,s.duration))}</span></div>
          ${!b?`<button class="btn primary" onclick="bookClass('${esc(s.id)}','${iso}')">Vou</button>`:b.status==="pending"?`<button class="btn secondary" onclick="unbookClass('${esc(s.id)}','${iso}')">Cancelar</button>`:""}</div>`}).join("");
    }
    return `<div class="section-title"><h2>📅 Aulas da semana</h2></div><p class="small muted" style="margin:0 2px 6px">Marque as aulas em que você vai. Na aula, leia o QR para confirmar na hora.</p><div class="list">${rows||`<div class="notice">Sem aulas nos próximos dias.</div>`}</div>`;
  }
  const baseRenderCheckin=window.renderCheckin;
  window.renderCheckin=async function(){
    await baseRenderCheckin();
    const host=document.getElementById("checkin");if(!host)return;
    const settings=await getSettings();
    try{
      if(settings.role==="aluno"){host.insertAdjacentHTML("beforeend",await studentSection());return}
      host.insertAdjacentHTML("afterbegin",await professorSection());
      const session=activeSession(await getSessions());
      const card=host.querySelector(".session-card");
      if(session&&card&&!card.querySelector("#codeCountdown")){
        card.querySelector(".session-code")?.insertAdjacentHTML("afterend",`<div id="codeCountdown" class="small" style="color:#b45309;font-weight:700"></div>`);
        card.querySelector(".actions")?.insertAdjacentHTML("afterbegin",`<button class="btn green" onclick="showQrFullscreen()">📺 Tela cheia</button>`);
      }
    }catch(e){console.warn("Grade",e)}
  };
})();
