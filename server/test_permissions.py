import permissions as P

class Adapter:
    def __init__(self): self.db={}
    def get(self,s,i): return self.db.get(s,{}).get(i)
    def find(self,s,f): return [v for v in self.db.get(s,{}).values() if f(v)]
    def put(self,s,v,now_ms=None): self.db.setdefault(s,{})[v['id']]=v
    def remove(self,s,i,now_ms=None): self.db.get(s,{}).pop(i,None)

A=Adapter()
A.db['students']={'s1':{'id':'s1','name':'Ana','phone':'4899','birth':'2000-01-01','payment':'liberado','points':10,'streak':4,'classesInBelt':2},'s2':{'id':'s2','name':'Bia','phone':'1','payment':'pendente'}}
A.db['classSessions']={'c1':{'id':'c1','code':'123456','date':'2026-09-16','createdAt':'2026-09-16T19:00:00Z','expiresAt':'2026-09-16T20:30:00Z','status':'open'}}
A.db['scoreRules']={'score-base-attendance':{'id':'score-base-attendance','points':5}}
A.db['sequenceRules']={'q5':{'id':'q5','classes':5,'points':3,'active':True}}
A.db['gradingAssignments']={'g1':{'id':'g1','studentId':'s1','status':'x','progress':{},'evaluation':{'privateNote':'segredo','overall':'draft'}}}
aluno={'id':'u1','role':'aluno','studentId':'s1','academyId':'a','active':True}
prof={'id':'u2','role':'professor','academyId':'a','active':True}
adm={'id':'u3','role':'admin','academyId':'a','active':True}
now=1758052800000 # 2025 placeholder? overwritten below
from datetime import datetime, timezone
now=int(datetime(2026,9,16,20,0,tzinfo=timezone.utc).timestamp()*1000)

r=P.process_incoming(aluno,{'changes':[
 {'changeId':'1','store':'attendance','op':'put','recordId':'at1','value':{'id':'at1','studentId':'s1','sessionId':'c1','checkinCode':'000000'}},
 {'changeId':'2','store':'attendance','op':'put','recordId':'at2','value':{'id':'at2','studentId':'s1','sessionId':'c1','checkinCode':'123456','status':'approved'}},
 {'changeId':'3','store':'students','op':'put','recordId':'s1','value':{'id':'s1','name':'Ana','points':9999}},
 {'changeId':'4','store':'pointsLedger','op':'put','recordId':'p1','value':{'id':'p1','studentId':'s1','points':5}},
 {'changeId':'5','store':'users','op':'put','recordId':'u1','value':{'id':'u1','role':'admin'}},
 {'changeId':'6','store':'attendance','op':'put','recordId':'at3','value':{'id':'at3','studentId':'s2','sessionId':'c1','checkinCode':'123456'}},
 {'changeId':'7','store':'gradingAssignments','op':'put','recordId':'g1','value':{'id':'g1','studentId':'s1','status':'aprovado','progress':{'t1':True}}},
 {'changeId':'8','store':'attendance','op':'put','recordId':'at4','value':{'id':'at4','studentId':'s1','sessionId':'c1','checkinCode':'123456'}},
]},A,now)
assert r['acceptedIds']==['2','7'],r
assert A.db['students']['s1']['points']==18
assert A.db['students']['s1']['streak']==5
assert A.db['gradingAssignments']['g1']['status']=='x'
assert A.db['gradingAssignments']['g1']['progress']['t1'] is True
assert next(x for x in r['rejected'] if x['changeId']=='3')['server']['value']['points']==18
assert next(x for x in r['rejected'] if x['changeId']=='4')['server']['value'] is None
assert 'server' not in next(x for x in r['rejected'] if x['changeId']=='5')
assert 'code' not in P.filter_outgoing(aluno,{'store':'classSessions','op':'put','value':A.db['classSessions']['c1']})['value']
assert 'phone' not in P.filter_outgoing(aluno,{'store':'students','op':'put','value':A.db['students']['s2']})['value']
assert 'privateNote' not in P.filter_outgoing(aluno,{'store':'gradingAssignments','op':'put','value':A.db['gradingAssignments']['g1']})['value']['evaluation']
assert A.db['gradingAssignments']['g1']['evaluation']['privateNote']=='segredo'
assert P.filter_outgoing(aluno,{'store':'registrationRequests','op':'put','value':{'id':'r'}}) is None
assert 'passwordHash' not in P.filter_outgoing(prof,{'store':'users','op':'put','value':{'id':'u','passwordHash':'h'}})['value']
r=P.process_incoming(prof,{'changes':[{'changeId':'a','store':'students','op':'put','recordId':'s9','value':{'id':'s9','name':'X'}},{'changeId':'b','store':'users','op':'put','recordId':'u2','value':{'id':'u2','role':'admin'}}]},A,now)
assert r['acceptedIds']==['a']
r=P.process_incoming(adm,{'changes':[{'changeId':'c','store':'pointsLedger','op':'put','recordId':'z','value':{'id':'z'}},{'changeId':'d','store':'academyContent','op':'put','recordId':'main','value':{'id':'main'}}]},A,now)
assert r['acceptedIds']==['d']
try:
    P.process_incoming(prof,{'academyId':'outra','changes':[]},A,now)
    raise AssertionError('academia divergente deveria falhar')
except PermissionError: pass
assert P.check_route(prof,'GET','/api/users')['status']==403
assert P.check_route(adm,'GET','/api/users') is None
assert P.check_route(None,'POST','/api/sync')['status']==401
assert P.check_route(aluno,'POST','/api/registration/decision')['status']==403
print('TODOS OS TESTES PYTHON PASSARAM')
