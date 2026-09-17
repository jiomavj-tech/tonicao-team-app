const P=require("./permissions");const assert=require('assert');
const db={};const A={get:async(s,id)=>db[s]?.[id]||null,find:async(s,f)=>Object.values(db[s]||{}).filter(f),put:async(s,v)=>{(db[s]??={})[v.id]=v},remove:async(s,id)=>{delete db[s]?.[id]}};
const now=Date.parse("2026-09-16T20:00:00Z");
db.students={s1:{id:"s1",name:"Ana",phone:"4899",birth:"2000-01-01",payment:"liberado",points:10,streak:4,classesInBelt:2},s2:{id:"s2",name:"Bia",phone:"1",payment:"pendente"}};
db.classSessions={c1:{id:"c1",code:"123456",date:"2026-09-16",createdAt:"2026-09-16T19:00:00Z",expiresAt:"2026-09-16T20:30:00Z",status:"open"}};
db.scoreRules={"score-base-attendance":{id:"score-base-attendance",points:5}};
db.sequenceRules={q5:{id:"q5",classes:5,points:3,active:true}};
db.gradingAssignments={g1:{id:"g1",studentId:"s1",status:"x",progress:{},evaluation:{privateNote:"segredo",overall:"draft"}}};
const aluno={id:"u1",role:"aluno",studentId:"s1",academyId:"a"}, prof={id:"u2",role:"professor",academyId:"a"}, adm={id:"u3",role:"admin",academyId:"a"};
(async()=>{
 let r=await P.processIncoming(aluno,{changes:[
  {changeId:"1",store:"attendance",op:"put",recordId:"at1",value:{id:"at1",studentId:"s1",sessionId:"c1",checkinCode:"000000"}},
  {changeId:"2",store:"attendance",op:"put",recordId:"at2",value:{id:"at2",studentId:"s1",sessionId:"c1",checkinCode:"123456",status:"approved"}},
  {changeId:"3",store:"students",op:"put",recordId:"s1",value:{id:"s1",name:"Ana",points:9999}},
  {changeId:"4",store:"pointsLedger",op:"put",recordId:"p1",value:{id:"p1",studentId:"s1",points:5}},
  {changeId:"5",store:"users",op:"put",recordId:"u1",value:{id:"u1",role:"admin"}},
  {changeId:"6",store:"attendance",op:"put",recordId:"at3",value:{id:"at3",studentId:"s2",sessionId:"c1",checkinCode:"123456"}},
  {changeId:"7",store:"gradingAssignments",op:"put",recordId:"g1",value:{id:"g1",studentId:"s1",status:"aprovado",progress:{t1:true}}},
  {changeId:"8",store:"attendance",op:"put",recordId:"at4",value:{id:"at4",studentId:"s1",sessionId:"c1",checkinCode:"123456"}},
 ]},A,now);
 console.log(JSON.stringify(r,null,1));
 assert.deepEqual(r.acceptedIds,["2","7"]);
 assert.equal(db.students.s1.points,18); assert.equal(db.students.s1.streak,5);
 assert.equal(db.gradingAssignments.g1.status,"x"); assert.equal(db.gradingAssignments.g1.progress.t1,true);
 assert.equal(r.rejected.find(x=>x.changeId==="3").server.value.points,18);
 assert.equal(r.rejected.find(x=>x.changeId==="4").server.value,null);
 assert.equal(r.rejected.find(x=>x.changeId==="5").server,undefined);
 // pull
 assert.equal(P.filterOutgoing(aluno,{store:"classSessions",op:"put",value:db.classSessions.c1}).value.code,undefined);
 assert.equal(P.filterOutgoing(aluno,{store:"students",op:"put",value:db.students.s2}).value.phone,undefined);
 assert.equal(P.filterOutgoing(aluno,{store:"gradingAssignments",op:"put",value:db.gradingAssignments.g1}).value.evaluation.privateNote,undefined);
 assert.equal(db.gradingAssignments.g1.evaluation.privateNote,"segredo");
 assert.equal(P.filterOutgoing(aluno,{store:"registrationRequests",op:"put",value:{id:"r"}}),null);
 assert.equal(P.filterOutgoing(prof,{store:"users",op:"put",value:{id:"u",passwordHash:"h"}}).value.passwordHash,undefined);
 // professor/admin
 r=await P.processIncoming(prof,{changes:[{changeId:"a",store:"students",op:"put",recordId:"s9",value:{id:"s9",name:"X"}},{changeId:"b",store:"users",op:"put",recordId:"u2",value:{id:"u2",role:"admin"}}]},A,now);
 assert.deepEqual(r.acceptedIds,["a"]);
 r=await P.processIncoming(adm,{changes:[{changeId:"c",store:"pointsLedger",op:"put",recordId:"z",value:{id:"z"}},{changeId:"d",store:"academyContent",op:"put",recordId:"main",value:{id:"main"}}]},A,now);
 assert.deepEqual(r.acceptedIds,["d"]);
 await assert.rejects(P.processIncoming(prof,{academyId:"outra",changes:[]},A,now));
 assert.equal(P.checkRoute(prof,"GET","/api/users").status,403);
 assert.equal(P.checkRoute(adm,"GET","/api/users"),null);
 assert.equal(P.checkRoute(null,"POST","/api/sync").status,401);
 assert.equal(P.checkRoute(aluno,"POST","/api/registration/decision").status,403);
 console.log("TODOS OS TESTES PASSARAM");
})().catch(e=>{console.error(e);process.exit(1)});
