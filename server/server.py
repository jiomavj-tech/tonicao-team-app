#!/usr/bin/env python3
import json, os, sqlite3, sys, hashlib, hmac, secrets, time, urllib.request, urllib.parse, threading
from http.server import ThreadingHTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs
import permissions as perms

HOST=os.getenv("TONICAO_HOST","0.0.0.0")
PORT=int(os.getenv("TONICAO_PORT",os.getenv("PORT","8787")))
DB_PATH=os.getenv("TONICAO_DB",os.path.join(os.path.dirname(__file__),"tonicao_sync.sqlite3"))
LEGACY_TOKEN=os.getenv("TONICAO_SYNC_TOKEN","")
ALLOW_LEGACY_SYNC=os.getenv("TONICAO_ALLOW_LEGACY_SYNC","")=="1"
BOOTSTRAP_SECRET=os.getenv("TONICAO_BOOTSTRAP_SECRET","").strip()
GOOGLE_CLIENT_ID=os.getenv("TONICAO_GOOGLE_CLIENT_ID","").strip()
SESSION_HOURS=int(os.getenv("TONICAO_SESSION_HOURS","168"))
VAPID_PUBLIC_KEY=os.getenv("TONICAO_VAPID_PUBLIC_KEY","").strip()
VAPID_PRIVATE_KEY=os.getenv("TONICAO_VAPID_PRIVATE_KEY","").strip()
VAPID_SUBJECT=os.getenv("TONICAO_VAPID_SUBJECT","mailto:admin@example.com").strip()
ALLOWED_ORIGINS={x.strip().rstrip("/") for x in os.getenv("TONICAO_ALLOWED_ORIGINS","https://jiomavj-tech.github.io,http://localhost:8000,http://127.0.0.1:8000").split(",") if x.strip()}
INVITE_TTL_HOURS=max(1,min(168,int(os.getenv("TONICAO_INVITE_TTL_HOURS","72"))))
RATE_LOCK=threading.Lock()
RATE_STATE={}
try:
    from pywebpush import webpush
    WEBPUSH_AVAILABLE=True
except Exception:
    WEBPUSH_AVAILABLE=False

OWNER_STORES={"academyContent","academyTimeline","academyGallery","auditLog"}
PROFESSOR_STORES={"students","classSessions","attendance","gradingHistory","gradingPlans","gradingAssignments","gradingReminders","pointsLedger","events","techniques","notifications","paymentStatus","auditLog","academyTimeline","academyGallery","registrationRequests","academyRules","scoreRules","referenceMaterials"}
STUDENT_WRITE_STORES={"attendance"}

def connect():
    db=sqlite3.connect(DB_PATH,timeout=30);db.row_factory=sqlite3.Row
    db.execute("""CREATE TABLE IF NOT EXISTS current_records(
      academy_id TEXT NOT NULL,store_name TEXT NOT NULL,record_id TEXT NOT NULL,
      op TEXT NOT NULL,value_json TEXT,updated_at TEXT NOT NULL,
      PRIMARY KEY(academy_id,store_name,record_id))""")
    db.execute("""CREATE TABLE IF NOT EXISTS change_log(
      seq INTEGER PRIMARY KEY AUTOINCREMENT,change_id TEXT UNIQUE NOT NULL,
      academy_id TEXT NOT NULL,store_name TEXT NOT NULL,record_id TEXT NOT NULL,
      op TEXT NOT NULL,value_json TEXT,updated_at TEXT NOT NULL,created_at TEXT DEFAULT CURRENT_TIMESTAMP)""")
    db.execute("""CREATE TABLE IF NOT EXISTS processed_changes(
      academy_id TEXT NOT NULL,change_id TEXT NOT NULL,processed_at INTEGER NOT NULL,
      PRIMARY KEY(academy_id,change_id))""")
    db.execute("""CREATE TABLE IF NOT EXISTS app_users(
      id TEXT PRIMARY KEY,academy_id TEXT NOT NULL,username TEXT NOT NULL,name TEXT NOT NULL,
      role TEXT NOT NULL,student_id TEXT,password_salt TEXT,password_hash TEXT,iterations INTEGER,
      active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,provider TEXT NOT NULL DEFAULT 'password',
      google_sub TEXT,google_email TEXT,picture_url TEXT,approved_at INTEGER,
      UNIQUE(academy_id,username))""")
    db.execute("""CREATE TABLE IF NOT EXISTS auth_sessions(
      token TEXT PRIMARY KEY,academy_id TEXT NOT NULL,user_id TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL)""")
    db.execute("""CREATE TABLE IF NOT EXISTS academy_access(
      academy_id TEXT PRIMARY KEY,status TEXT NOT NULL DEFAULT 'active',reason TEXT,updated_at INTEGER,updated_by TEXT)""")
    db.execute("""CREATE TABLE IF NOT EXISTS registration_requests(
      id TEXT PRIMARY KEY,academy_id TEXT NOT NULL,name TEXT NOT NULL,phone TEXT NOT NULL,birth TEXT,
      graduation_track TEXT,note TEXT,status TEXT NOT NULL DEFAULT 'pending',student_id TEXT,
      created_at INTEGER NOT NULL,decided_at INTEGER,decided_by TEXT)""")
    reg_cols={r["name"] for r in db.execute("PRAGMA table_info(registration_requests)").fetchall()}
    for name,typ,default in [
      ("invite_token","TEXT","NULL"),("email","TEXT","NULL"),("belt","TEXT","NULL"),("stripes","INTEGER","0"),
      ("guardian_name","TEXT","NULL"),("guardian_phone","TEXT","NULL"),("emergency_name","TEXT","NULL"),("emergency_phone","TEXT","NULL"),
      ("invited_by","TEXT","NULL"),("completed_at","INTEGER","NULL"),("source","TEXT","NULL"),("invite_expires_at","INTEGER","NULL")
    ]:
        if name not in reg_cols:db.execute(f"ALTER TABLE registration_requests ADD COLUMN {name} {typ} DEFAULT {default}")
    db.execute("CREATE UNIQUE INDEX IF NOT EXISTS idx_registration_invite_token ON registration_requests(invite_token)")
    db.execute("""CREATE TABLE IF NOT EXISTS app_notifications(
      seq INTEGER PRIMARY KEY AUTOINCREMENT,id TEXT UNIQUE NOT NULL,academy_id TEXT NOT NULL,
      target_role TEXT,target_user_id TEXT,target_student_id TEXT,kind TEXT NOT NULL,title TEXT NOT NULL,body TEXT NOT NULL,
      ref_id TEXT,data_json TEXT,created_at INTEGER NOT NULL)""")
    db.execute("""CREATE TABLE IF NOT EXISTS notification_reads(
      notification_id TEXT NOT NULL,user_id TEXT NOT NULL,read_at INTEGER NOT NULL,
      PRIMARY KEY(notification_id,user_id))""")
    db.execute("""CREATE TABLE IF NOT EXISTS push_subscriptions(
      id TEXT PRIMARY KEY,academy_id TEXT NOT NULL,user_id TEXT NOT NULL,endpoint TEXT UNIQUE NOT NULL,
      subscription_json TEXT NOT NULL,created_at INTEGER NOT NULL,updated_at INTEGER NOT NULL)""")
    cols={r["name"] for r in db.execute("PRAGMA table_info(app_users)").fetchall()}
    for name,typ,default in [("provider","TEXT","'password'"),("google_sub","TEXT","NULL"),("google_email","TEXT","NULL"),("picture_url","TEXT","NULL"),("approved_at","INTEGER","NULL")]:
        if name not in cols:db.execute(f"ALTER TABLE app_users ADD COLUMN {name} {typ} DEFAULT {default}")
    db.execute("CREATE INDEX IF NOT EXISTS idx_google_sub ON app_users(academy_id,google_sub)")
    db.commit();return db

def password_problem(password):
    """v0.23: mínimo 9 caracteres com maiúscula, minúscula, número e símbolo, em qualquer ordem."""
    p=str(password or "")
    if len(p)<9:return "A senha precisa ter pelo menos 9 caracteres."
    if not any(c.isascii() and c.isupper() for c in p):return "A senha precisa ter pelo menos uma letra MAIÚSCULA."
    if not any(c.isascii() and c.islower() for c in p):return "A senha precisa ter pelo menos uma letra minúscula."
    if not any(c.isdigit() for c in p):return "A senha precisa ter pelo menos um número."
    if all(c.isascii() and c.isalnum() for c in p):return "A senha precisa ter pelo menos um símbolo, como . ! @ # ou *"
    return ""

def make_password(password,iterations=180000):
    import base64
    problem=password_problem(password)
    if problem:raise ValueError(problem)
    salt=secrets.token_bytes(16);digest=hashlib.pbkdf2_hmac("sha256",password.encode(),salt,iterations,dklen=32)
    return base64.b64encode(salt).decode(),base64.b64encode(digest).decode(),iterations

def verify_password(password,salt_b64,hash_b64,iterations):
    if not salt_b64 or not hash_b64:return False
    import base64
    salt=base64.b64decode(salt_b64);expected=base64.b64decode(hash_b64)
    actual=hashlib.pbkdf2_hmac("sha256",password.encode(),salt,int(iterations or 180000),dklen=len(expected))
    return hmac.compare_digest(actual,expected)

def verify_google_id_token(credential):
    if not GOOGLE_CLIENT_ID:raise ValueError("Google Sign-In não configurado no servidor.")
    url="https://oauth2.googleapis.com/tokeninfo?id_token="+urllib.parse.quote(credential,safe="")
    try:
        with urllib.request.urlopen(url,timeout=8) as resp:claims=json.loads(resp.read().decode())
    except Exception:raise ValueError("Não foi possível validar a credencial Google.")
    if claims.get("aud")!=GOOGLE_CLIENT_ID:raise ValueError("Client ID do Google não corresponde ao servidor.")
    if claims.get("iss") not in ("accounts.google.com","https://accounts.google.com"):raise ValueError("Emissor Google inválido.")
    if int(claims.get("exp","0"))<=int(time.time()):raise ValueError("Credencial Google expirada.")
    if str(claims.get("email_verified","")).lower()!="true":raise ValueError("E-mail Google não verificado.")
    if not claims.get("sub"):raise ValueError("Identificador Google ausente.")
    return claims

def bearer(h):
    x=h.headers.get("Authorization","");return x[7:] if x.startswith("Bearer ") else ""

def session_user(db,t):
    if not t:return None
    return db.execute("""SELECT u.*,s.expires_at FROM auth_sessions s JOIN app_users u ON u.id=s.user_id
                         WHERE s.token=? AND s.expires_at>? AND u.active=1""",(t,int(time.time()))).fetchone()

def require_owner(db,t):
    u=session_user(db,t);return u if u and u["role"]=="admin" else None

def require_professor(db,t):
    u=session_user(db,t);return u if u and u["role"]=="professor" else None

def access_row(db,academy):
    row=db.execute("SELECT * FROM academy_access WHERE academy_id=?",(academy,)).fetchone()
    return row or {"academy_id":academy,"status":"active","reason":""}

def access_allowed(db,user):
    if not user or user["role"]=="admin":return True
    return access_row(db,user["academy_id"])["status"]!="blocked"

def issue_session(db,u):
    token=secrets.token_urlsafe(32);now=int(time.time());exp=now+SESSION_HOURS*3600
    db.execute("INSERT INTO auth_sessions(token,academy_id,user_id,expires_at,created_at) VALUES(?,?,?,?,?)",(token,u["academy_id"],u["id"],exp,now))
    db.commit();return token,exp

def user_json(u):
    return {"id":u["id"],"academyId":u["academy_id"],"username":u["username"],"name":u["name"],"role":u["role"],"studentId":u["student_id"],"provider":u["provider"],"googleSub":u["google_sub"],"email":u["google_email"],"picture":u["picture_url"],"active":bool(u["active"])}

def actor_json(u, academy_override=None):
    if not u:return None
    if isinstance(u,dict):
        if u.get("role")=="legacy":
            return {"id":"legacy","role":"professor","studentId":None,"academyId":academy_override or u.get("academy_id"),"active":True}
        return {"id":u.get("id"),"role":u.get("role"),"studentId":u.get("studentId") or u.get("student_id"),"academyId":u.get("academyId") or u.get("academy_id") or academy_override,"active":u.get("active",True)}
    return {"id":u["id"],"role":u["role"],"studentId":u["student_id"],"academyId":u["academy_id"],"active":bool(u["active"])}

def write_stores_for(role):
    if role=="admin":return perms.ADMIN_WRITE
    if role=="professor":return perms.PROFESSOR_WRITE
    if role=="aluno":return {"attendance","gradingAssignments"}
    return set()


def notification_matches_user(n,u):
    if n["target_user_id"] and n["target_user_id"]==u["id"]:return True
    if n["target_role"] and n["target_role"]==u["role"]:return True
    if n["target_student_id"] and u["student_id"] and n["target_student_id"]==u["student_id"]:return True
    return not n["target_user_id"] and not n["target_role"] and not n["target_student_id"]

def push_enabled():
    return bool(WEBPUSH_AVAILABLE and VAPID_PUBLIC_KEY and VAPID_PRIVATE_KEY)

def _vapid_private():
    if not VAPID_PRIVATE_KEY:return ""
    if os.path.exists(VAPID_PRIVATE_KEY):return open(VAPID_PRIVATE_KEY,"r",encoding="utf-8").read()
    return VAPID_PRIVATE_KEY.replace("\\n","\n")

def push_notification(db,n):
    if not push_enabled():return 0
    if n.get("target_user_id"):
        users=db.execute("SELECT * FROM app_users WHERE id=? AND academy_id=? AND active=1",(n["target_user_id"],n["academy_id"])).fetchall()
    elif n.get("target_student_id"):
        users=db.execute("SELECT * FROM app_users WHERE student_id=? AND academy_id=? AND active=1",(n["target_student_id"],n["academy_id"])).fetchall()
    elif n.get("target_role"):
        users=db.execute("SELECT * FROM app_users WHERE role=? AND academy_id=? AND active=1",(n["target_role"],n["academy_id"])).fetchall()
    else:
        users=db.execute("SELECT * FROM app_users WHERE academy_id=? AND active=1",(n["academy_id"],)).fetchall()
    sent=0
    for u in users:
        for s in db.execute("SELECT * FROM push_subscriptions WHERE user_id=?",(u["id"],)).fetchall():
            try:
                webpush(subscription_info=json.loads(s["subscription_json"]),data=json.dumps({"id":n["id"],"title":n["title"],"body":n["body"],"kind":n["kind"],"refId":n.get("ref_id") or ""},ensure_ascii=False),vapid_private_key=_vapid_private(),vapid_claims={"sub":VAPID_SUBJECT})
                sent+=1
            except Exception as e:
                status=getattr(getattr(e,"response",None),"status_code",None)
                if status in (404,410):db.execute("DELETE FROM push_subscriptions WHERE id=?",(s["id"],));db.commit()
    return sent

def create_notification(db,academy,kind,title,body,target_role="",target_user_id="",target_student_id="",ref_id=""):
    nid="noti-"+secrets.token_hex(10);now=int(time.time())
    db.execute("""INSERT INTO app_notifications(id,academy_id,target_role,target_user_id,target_student_id,kind,title,body,ref_id,data_json,created_at)
                  VALUES(?,?,?,?,?,?,?,?,?,'{}',?)""",(nid,academy,target_role or None,target_user_id or None,target_student_id or None,kind,title,body,ref_id or None,now))
    db.commit()
    n={"id":nid,"academy_id":academy,"target_role":target_role,"target_user_id":target_user_id,"target_student_id":target_student_id,"kind":kind,"title":title,"body":body,"ref_id":ref_id}
    push_notification(db,n);return n

def maybe_notify_grading_change(db,academy,old_value,new_value):
    if not new_value:return
    sid=new_value.get("studentId") or ""
    if not sid:return
    old_value=old_value or {};old_status=old_value.get("status");status=new_value.get("status");aid=new_value.get("id") or ""
    if status=="material_liberado" and old_status!="material_liberado":
        create_notification(db,academy,"material","Material de graduação liberado","Seu material de preparação já está disponível.",target_student_id=sid,ref_id=aid)
    if status=="prova_agendada" and (old_status!="prova_agendada" or old_value.get("examDate")!=new_value.get("examDate") or old_value.get("examTime")!=new_value.get("examTime")):
        body=f"Avaliação em {new_value.get('examDate') or 'data definida'}"
        if new_value.get("examTime"):body+=f" às {new_value.get('examTime')}"
        if new_value.get("examLocation"):body+=f" • {new_value.get('examLocation')}"
        create_notification(db,academy,"exam","Avaliação de graduação agendada",body,target_student_id=sid,ref_id=aid)
    if status=="aprovado" and old_status!="aprovado":
        create_notification(db,academy,"evaluation","Avaliação aprovada","Sua avaliação foi aprovada. A graduação ainda será confirmada pelo Professor.",target_student_id=sid,ref_id=aid)
    if status=="revisar" and old_status!="revisar":
        note=((new_value.get("evaluation") or {}).get("publicNote") or "O Professor marcou sua avaliação para revisão.")
        create_notification(db,academy,"evaluation","Reavaliar graduação",note,target_student_id=sid,ref_id=aid)
    if status=="graduado" and old_status!="graduado":
        create_notification(db,academy,"graduated","Graduação registrada","Sua graduação foi registrada no aplicativo.",target_student_id=sid,ref_id=aid)

class SyncAdapter:
    def __init__(self,db,academy_id):
        self.db=db;self.academy_id=academy_id
    def get(self,store,record_id):
        row=self.db.execute("SELECT op,value_json FROM current_records WHERE academy_id=? AND store_name=? AND record_id=?",(self.academy_id,store,str(record_id))).fetchone()
        if not row or row["op"]=="delete" or not row["value_json"]:return None
        try:return json.loads(row["value_json"])
        except Exception:return None
    def find(self,store,predicate):
        rows=self.db.execute("SELECT value_json FROM current_records WHERE academy_id=? AND store_name=? AND op='put' AND value_json IS NOT NULL",(self.academy_id,store)).fetchall()
        out=[]
        for row in rows:
            try:v=json.loads(row["value_json"])
            except Exception:continue
            try:
                if predicate(v):out.append(v)
            except Exception:continue
        return out
    def _log(self,store,record_id,op,value,updated_at):
        cid="srv-"+secrets.token_urlsafe(14)
        value_json=json.dumps(value,ensure_ascii=False,separators=(",",":")) if op=="put" else None
        self.db.execute("""INSERT INTO current_records(academy_id,store_name,record_id,op,value_json,updated_at) VALUES(?,?,?,?,?,?)
                           ON CONFLICT(academy_id,store_name,record_id) DO UPDATE SET op=excluded.op,value_json=excluded.value_json,updated_at=excluded.updated_at""",(self.academy_id,store,str(record_id),op,value_json,updated_at))
        self.db.execute("INSERT INTO change_log(change_id,academy_id,store_name,record_id,op,value_json,updated_at) VALUES(?,?,?,?,?,?,?)",(cid,self.academy_id,store,str(record_id),op,value_json,updated_at))
    def put(self,store,value,now_ms=None):
        if not value or value.get("id") is None:return
        old=self.get(store,value.get("id"))
        updated=value.get("updatedAt") or time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime((now_ms or int(time.time()*1000))/1000))
        self._log(store,value.get("id"),"put",value,updated)
        if store=="gradingAssignments":maybe_notify_grading_change(self.db,self.academy_id,old,value)
    def remove(self,store,record_id,now_ms=None):
        updated=time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime((now_ms or int(time.time()*1000))/1000))
        self._log(store,record_id,"delete",None,updated)

def rate_allowed(key,limit,window_seconds):
    now=time.time()
    with RATE_LOCK:
        arr=[t for t in RATE_STATE.get(key,[]) if now-t<window_seconds]
        if len(arr)>=limit:
            RATE_STATE[key]=arr
            return False
        arr.append(now);RATE_STATE[key]=arr
        if len(RATE_STATE)>5000:
            cutoff=now-3600
            for k in list(RATE_STATE)[:1000]:
                RATE_STATE[k]=[t for t in RATE_STATE[k] if t>cutoff]
                if not RATE_STATE[k]:RATE_STATE.pop(k,None)
        return True

def invite_expired(row,now=None):
    if not row:return True
    now=int(now or time.time())
    exp=row["invite_expires_at"] if "invite_expires_at" in row.keys() else None
    if not exp:exp=int(row["created_at"] or 0)+INVITE_TTL_HOURS*3600
    return now>int(exp)

class Handler(BaseHTTPRequestHandler):
    server_version="TonicaoSync/0.22"
    def request_origin(self):
        return (self.headers.get("Origin") or "").rstrip("/")
    def client_key(self):
        f=(self.headers.get("X-Forwarded-For") or "").split(",")[0].strip()
        return f or (self.client_address[0] if self.client_address else "unknown")
    def cors(self):
        origin=self.request_origin()
        if origin and origin in ALLOWED_ORIGINS:
            self.send_header("Access-Control-Allow-Origin",origin)
            self.send_header("Vary","Origin")
        self.send_header("Access-Control-Allow-Headers","Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods","GET, POST, OPTIONS")
    def rate(self,bucket,limit,window):
        if rate_allowed(f"{bucket}:{self.client_key()}",limit,window):return True
        self.send_json(429,{"ok":False,"error":"Muitas tentativas. Aguarde alguns minutos e tente novamente."});return False
    def origin_allowed(self):
        origin=self.request_origin()
        if not origin or origin in ALLOWED_ORIGINS:return True
        self.send_json(403,{"ok":False,"error":"Origem não autorizada."});return False
    def send_json(self,status,payload):
        b=json.dumps(payload,ensure_ascii=False).encode()
        self.send_response(status);self.cors();self.send_header("Content-Type","application/json; charset=utf-8")
        self.send_header("Cache-Control","no-store")
        self.send_header("X-Content-Type-Options","nosniff")
        self.send_header("Content-Length",str(len(b)));self.end_headers();self.wfile.write(b)
    def read_json(self):
        return json.loads(self.rfile.read(int(self.headers.get("Content-Length","0") or "0")) or b"{}")
    def auth_for_academy(self,db,a):
        tok=bearer(self)
        if ALLOW_LEGACY_SYNC and LEGACY_TOKEN and tok==LEGACY_TOKEN:return {"id":"legacy","role":"legacy","academy_id":a,"student_id":None,"active":1}
        u=session_user(db,tok);return u if u and u["academy_id"]==a else None
    def route_user(self,db):
        return actor_json(session_user(db,bearer(self)))
    def enforce_route(self,db,method,path):
        err=perms.check_route(self.route_user(db),method,path)
        if err:self.send_json(err["status"],{"ok":False,"error":err["error"]});return False
        return True
    def do_OPTIONS(self):
        origin=self.request_origin()
        if origin and origin not in ALLOWED_ORIGINS:
            self.send_response(403);self.end_headers();return
        self.send_response(204);self.cors();self.end_headers()

    def do_GET(self):
        if not self.origin_allowed():return
        parsed=urlparse(self.path);path=parsed.path;qs=parse_qs(parsed.query);db=connect()
        try:
            if not self.enforce_route(db,"GET",path):return
            if path=="/health":return self.send_json(200,{"ok":True,"service":"tonicao-sync","version":22,"googleEnabled":bool(GOOGLE_CLIENT_ID),"pushEnabled":push_enabled(),"webPushLibrary":WEBPUSH_AVAILABLE,"bootstrapReady":bool(BOOTSTRAP_SECRET),"dbPersistentPath":DB_PATH.startswith("/var/data/"),"inviteTtlHours":INVITE_TTL_HOURS})
            if path=="/api/auth/google/config":return self.send_json(200,{"ok":True,"enabled":bool(GOOGLE_CLIENT_ID),"clientId":GOOGLE_CLIENT_ID})
            if path=="/api/auth/me":
                u=session_user(db,bearer(self))
                if not u:return self.send_json(401,{"ok":False,"error":"Sessão inválida."})
                if not access_allowed(db,u):return self.send_json(403,{"ok":False,"error":access_row(db,u["academy_id"])["reason"] or "Acesso da academia suspenso."})
                return self.send_json(200,{"ok":True,"user":user_json(u)})
            if path=="/api/auth/permissions":
                u=session_user(db,bearer(self))
                if not u:return self.send_json(401,{"ok":False,"error":"Sessão inválida."})
                return self.send_json(200,{"ok":True,"role":u["role"],"writeStores":sorted(write_stores_for(u["role"])),"studentId":u["student_id"]})
            if path=="/api/users":
                a=require_owner(db,bearer(self))
                if not a:return self.send_json(403,{"ok":False,"error":"Administrador/Dono remoto necessário."})
                rows=db.execute("SELECT * FROM app_users WHERE academy_id=? ORDER BY active ASC,created_at DESC",(a["academy_id"],)).fetchall()
                return self.send_json(200,{"ok":True,"users":[user_json(u) for u in rows]})
            if path=="/api/academy/access":
                u=session_user(db,bearer(self))
                if not u:return self.send_json(401,{"ok":False,"error":"Sessão inválida."})
                a=access_row(db,u["academy_id"])
                return self.send_json(200,{"ok":True,"status":a["status"],"reason":a["reason"] or ""})
            if path=="/api/registration/invite":
                if not self.rate("registration-get",30,60):return
                token=str((qs.get("token") or [""])[0] or "")
                if not token:return self.send_json(400,{"ok":False,"error":"Convite inválido."})
                r=db.execute("SELECT * FROM registration_requests WHERE invite_token=?",(token,)).fetchone()
                if not r:return self.send_json(404,{"ok":False,"error":"Convite não encontrado."})
                if invite_expired(r):return self.send_json(410,{"ok":False,"error":"Convite expirado. Peça um novo link ao Professor."})
                return self.send_json(200,{"ok":True,"request":{"id":r["id"],"academyId":r["academy_id"],"name":r["name"],"phone":r["phone"],"email":r["email"] or "","birth":r["birth"] or "","graduationTrack":r["graduation_track"] or "adulto","belt":r["belt"] or "Branca","stripes":r["stripes"] or 0,"guardianName":r["guardian_name"] or "","guardianPhone":r["guardian_phone"] or "","emergencyName":r["emergency_name"] or "","emergencyPhone":r["emergency_phone"] or "","note":r["note"] or "","inviteToken":r["invite_token"],"status":r["status"],"source":r["source"] or "professor_invite","createdAt":r["created_at"],"completedAt":r["completed_at"] or ""}})
            if path=="/api/registration/requests":
                u=session_user(db,bearer(self))
                if not u or u["role"]!="professor":return self.send_json(403,{"ok":False,"error":"Professor necessário."})
                rows=db.execute("SELECT * FROM registration_requests WHERE academy_id=? ORDER BY created_at DESC",(u["academy_id"],)).fetchall()
                return self.send_json(200,{"ok":True,"requests":[{"id":r["id"],"academyId":r["academy_id"],"name":r["name"],"phone":r["phone"],"email":r["email"] or "","birth":r["birth"] or "","graduationTrack":r["graduation_track"] or "adulto","belt":r["belt"] or "Branca","stripes":r["stripes"] or 0,"guardianName":r["guardian_name"] or "","guardianPhone":r["guardian_phone"] or "","emergencyName":r["emergency_name"] or "","emergencyPhone":r["emergency_phone"] or "","note":r["note"] or "","inviteToken":r["invite_token"] or "","status":r["status"],"studentId":r["student_id"],"source":r["source"] or "","createdAt":r["created_at"],"completedAt":r["completed_at"] or ""} for r in rows]})
            if path=="/api/push/config":
                u=session_user(db,bearer(self))
                if not u:return self.send_json(401,{"ok":False,"error":"Sessão inválida."})
                return self.send_json(200,{"ok":True,"enabled":push_enabled(),"publicKey":VAPID_PUBLIC_KEY,"libraryAvailable":WEBPUSH_AVAILABLE})
            if path=="/api/notifications":
                u=session_user(db,bearer(self))
                if not u:return self.send_json(401,{"ok":False,"error":"Sessão inválida."})
                after=int((qs.get("after") or ["0"])[0] or 0)
                rows=db.execute("""SELECT n.*,CASE WHEN r.notification_id IS NULL THEN 0 ELSE 1 END AS is_read
                                   FROM app_notifications n LEFT JOIN notification_reads r ON r.notification_id=n.id AND r.user_id=?
                                   WHERE n.academy_id=? AND n.seq>? ORDER BY n.seq ASC LIMIT 500""",(u["id"],u["academy_id"],after)).fetchall()
                au=actor_json(u)
                matched=[]
                for r in rows:
                    nv={"targetUserId":r["target_user_id"] or "","targetRole":r["target_role"] or "","targetStudentId":r["target_student_id"] or ""}
                    if perms.can_read_notification(au,nv):matched.append(r)
                cursor=max([after]+[r["seq"] for r in rows])
                return self.send_json(200,{"ok":True,"cursor":cursor,"notifications":[{"id":r["id"],"seq":r["seq"],"kind":r["kind"],"title":r["title"],"body":r["body"],"targetRole":r["target_role"] or "","targetUserId":r["target_user_id"] or "","targetStudentId":r["target_student_id"] or "","refId":r["ref_id"] or "","createdAt":r["created_at"],"createdAtISO":time.strftime("%Y-%m-%dT%H:%M:%SZ",time.gmtime(r["created_at"])),"read":bool(r["is_read"])} for r in matched]})
            return self.send_json(404,{"ok":False,"error":"Rota não encontrada."})
        finally:db.close()

    def do_POST(self):
        if not self.origin_allowed():return
        path=urlparse(self.path).path
        try:p=self.read_json()
        except Exception:return self.send_json(400,{"ok":False,"error":"JSON inválido."})
        db=connect()
        try:
            # /api/sync may optionally use the explicitly-enabled legacy token; every other route follows the authenticated role table.
            if path=="/api/sync" and ALLOW_LEGACY_SYNC and LEGACY_TOKEN and bearer(self)==LEGACY_TOKEN:
                pass
            elif not self.enforce_route(db,"POST",path):return
            if path=="/api/auth/bootstrap":
                if not self.rate("bootstrap",5,600):return
                if not BOOTSTRAP_SECRET:return self.send_json(503,{"ok":False,"error":"Servidor sem TONICAO_BOOTSTRAP_SECRET. Configure o segredo antes do primeiro Administrador."})
                a=str(p.get("academyId") or "").strip();un=str(p.get("username") or "").strip().lower();pw=str(p.get("password") or "");name=str(p.get("name") or un).strip();sec=str(p.get("bootstrapSecret") or "")
                if not hmac.compare_digest(sec,BOOTSTRAP_SECRET):return self.send_json(403,{"ok":False,"error":"Segredo de implantação inválido."})
                if not a or not un:return self.send_json(400,{"ok":False,"error":"Dados inválidos."})
                if db.execute("SELECT 1 FROM app_users WHERE academy_id=? AND role='admin'",(a,)).fetchone():return self.send_json(409,{"ok":False,"error":"A academia já possui Administrador/Dono remoto."})
                try:salt,h,it=make_password(pw)
                except ValueError as e:return self.send_json(400,{"ok":False,"error":str(e)})
                uid="usr-"+secrets.token_hex(8);now=int(time.time())
                db.execute("INSERT INTO app_users(id,academy_id,username,name,role,password_salt,password_hash,iterations,active,created_at,provider,approved_at) VALUES(?,?,?,?,?,?,?,?,1,?,'password',?)",(uid,a,un,name,"admin",salt,h,it,now,now))
                db.execute("INSERT OR IGNORE INTO academy_access(academy_id,status,reason,updated_at,updated_by) VALUES(?,'active','',?,?)",(a,now,uid))
                db.commit();u=db.execute("SELECT * FROM app_users WHERE id=?",(uid,)).fetchone();tok,exp=issue_session(db,u)
                return self.send_json(200,{"ok":True,"token":tok,"expiresAt":exp,"user":user_json(u)})
            if path=="/api/auth/login":
                if not self.rate("login",10,300):return
                a=str(p.get("academyId") or "").strip();un=str(p.get("username") or "").strip().lower();pw=str(p.get("password") or "")
                u=db.execute("SELECT * FROM app_users WHERE academy_id=? AND username=? AND active=1",(a,un)).fetchone()
                if not u or not verify_password(pw,u["password_salt"],u["password_hash"],u["iterations"]):return self.send_json(401,{"ok":False,"error":"Usuário ou senha incorretos."})
                if not access_allowed(db,u):return self.send_json(403,{"ok":False,"error":access_row(db,a)["reason"] or "Acesso da academia suspenso."})
                tok,exp=issue_session(db,u);return self.send_json(200,{"ok":True,"token":tok,"expiresAt":exp,"user":user_json(u)})
            if path=="/api/auth/google":
                a=str(p.get("academyId") or "").strip();cred=str(p.get("credential") or "")
                try:c=verify_google_id_token(cred)
                except ValueError as e:return self.send_json(401,{"ok":False,"error":str(e)})
                sub=c["sub"];email=c.get("email","");name=c.get("name") or email or "Conta Google";pic=c.get("picture")
                u=db.execute("SELECT * FROM app_users WHERE academy_id=? AND google_sub=?",(a,sub)).fetchone()
                if not u:
                    uid="usr-"+secrets.token_hex(8);un=("google-"+sub[-12:]).lower()
                    db.execute("INSERT INTO app_users(id,academy_id,username,name,role,student_id,active,created_at,provider,google_sub,google_email,picture_url) VALUES(?,?,?,?, 'aluno',NULL,0,?,'google',?,?,?)",(uid,a,un,name,int(time.time()),sub,email,pic));db.commit()
                    return self.send_json(202,{"ok":True,"pending":True,"message":"Cadastro Google aguardando aprovação.","email":email,"name":name})
                db.execute("UPDATE app_users SET name=?,google_email=?,picture_url=? WHERE id=?",(name,email,pic,u["id"]));db.commit();u=db.execute("SELECT * FROM app_users WHERE id=?",(u["id"],)).fetchone()
                if not u["active"]:return self.send_json(202,{"ok":True,"pending":True,"message":"Cadastro aguardando aprovação.","email":email,"name":name})
                if not access_allowed(db,u):return self.send_json(403,{"ok":False,"error":access_row(db,a)["reason"] or "Acesso da academia suspenso."})
                tok,exp=issue_session(db,u);return self.send_json(200,{"ok":True,"token":tok,"expiresAt":exp,"user":user_json(u)})
            if path=="/api/registration/invite":
                if not self.rate("registration-invite",30,600):return
                prof=require_professor(db,bearer(self))
                if not prof:return self.send_json(403,{"ok":False,"error":"Somente o Professor pode iniciar o cadastro."})
                name=str(p.get("name") or "").strip();phone=str(p.get("phone") or "").strip()
                if not name or not phone:return self.send_json(400,{"ok":False,"error":"Nome e telefone são obrigatórios."})
                old=db.execute("SELECT * FROM registration_requests WHERE academy_id=? AND phone=? AND status IN ('invited','awaiting_approval','pending') ORDER BY created_at DESC LIMIT 1",(prof["academy_id"],phone)).fetchone()
                if old and not invite_expired(old):
                    return self.send_json(200,{"ok":True,"request":{"id":old["id"],"academyId":old["academy_id"],"name":old["name"],"phone":old["phone"],"inviteToken":old["invite_token"] or "","inviteExpiresAt":old["invite_expires_at"],"status":old["status"],"createdAt":old["created_at"]}})
                if old and invite_expired(old):db.execute("UPDATE registration_requests SET status='expired',invite_token=NULL WHERE id=?",(old["id"],));db.commit()
                rid="reg-"+secrets.token_hex(8);token=secrets.token_urlsafe(32);now=int(time.time());expires=now+INVITE_TTL_HOURS*3600
                db.execute("""INSERT INTO registration_requests(id,academy_id,name,phone,graduation_track,status,created_at,invite_token,invite_expires_at,invited_by,source)
                              VALUES(?,?,?,?,?,'invited',?,?,?,?,?)""",(rid,prof["academy_id"],name,phone,"adulto",now,token,expires,prof["id"],"professor_invite"))
                db.commit()
                return self.send_json(200,{"ok":True,"request":{"id":rid,"academyId":prof["academy_id"],"name":name,"phone":phone,"inviteToken":token,"inviteExpiresAt":expires,"status":"invited","source":"professor_invite","createdAt":now}})
            if path=="/api/registration/complete":
                if not self.rate("registration-complete",10,600):return
                token=str(p.get("token") or "")
                r=db.execute("SELECT * FROM registration_requests WHERE invite_token=?",(token,)).fetchone()
                if not r:return self.send_json(404,{"ok":False,"error":"Convite não encontrado."})
                if invite_expired(r):return self.send_json(410,{"ok":False,"error":"Convite expirado. Peça um novo link ao Professor."})
                if r["status"] in ("approved","rejected","expired"):return self.send_json(409,{"ok":False,"error":"Este cadastro já foi encerrado."})
                name=str(p.get("name") or r["name"]).strip();phone=str(p.get("phone") or r["phone"]).strip();birth=str(p.get("birth") or "")
                if not name or not phone or not birth:return self.send_json(400,{"ok":False,"error":"Nome, telefone e nascimento são obrigatórios."})
                track=str(p.get("graduationTrack") or "adulto");belt=str(p.get("belt") or "Branca");stripes=int(p.get("stripes") or 0);now=int(time.time())
                db.execute("""UPDATE registration_requests SET name=?,phone=?,email=?,birth=?,graduation_track=?,belt=?,stripes=?,
                              guardian_name=?,guardian_phone=?,emergency_name=?,emergency_phone=?,note=?,status='awaiting_approval',completed_at=?
                              WHERE id=?""",(name,phone,str(p.get("email") or ""),birth,track,belt,stripes,str(p.get("guardianName") or ""),str(p.get("guardianPhone") or ""),str(p.get("emergencyName") or ""),str(p.get("emergencyPhone") or ""),str(p.get("note") or ""),now,r["id"]))
                db.commit()
                create_notification(db,r["academy_id"],"registration",f"Cadastro completo: {name}","O aluno terminou de preencher os dados. Falta apenas sua confirmação.",target_role="professor",ref_id=r["id"])
                rr=db.execute("SELECT * FROM registration_requests WHERE id=?",(r["id"],)).fetchone()
                return self.send_json(200,{"ok":True,"request":{"id":rr["id"],"academyId":rr["academy_id"],"name":rr["name"],"phone":rr["phone"],"email":rr["email"] or "","birth":rr["birth"] or "","graduationTrack":rr["graduation_track"] or "adulto","belt":rr["belt"] or "Branca","stripes":rr["stripes"] or 0,"guardianName":rr["guardian_name"] or "","guardianPhone":rr["guardian_phone"] or "","emergencyName":rr["emergency_name"] or "","emergencyPhone":rr["emergency_phone"] or "","note":rr["note"] or "","inviteToken":rr["invite_token"],"status":rr["status"],"source":rr["source"] or "professor_invite","createdAt":rr["created_at"],"completedAt":rr["completed_at"] or ""}})
            if path=="/api/registration/request":
                if not self.rate("registration-request",10,600):return
                a=str(p.get("academyId") or "").strip();name=str(p.get("name") or "").strip();phone=str(p.get("phone") or "").strip()
                if not a or not name or not phone:return self.send_json(400,{"ok":False,"error":"Nome, telefone e academia são obrigatórios."})
                acc=access_row(db,a)
                if acc["status"]=="blocked":return self.send_json(403,{"ok":False,"error":acc["reason"] or "Cadastros temporariamente suspensos."})
                rid="reg-"+secrets.token_hex(8);now=int(time.time())
                db.execute("INSERT INTO registration_requests(id,academy_id,name,phone,birth,graduation_track,note,status,created_at) VALUES(?,?,?,?,?,?,?,'pending',?)",(rid,a,name,phone,str(p.get("birth") or ""),str(p.get("graduationTrack") or "adulto"),str(p.get("note") or ""),now));db.commit()
                create_notification(db,a,"registration",f"Novo pré-cadastro: {name}",f"{phone} enviou uma solicitação para entrar na academia.",target_role="professor",ref_id=rid)
                return self.send_json(200,{"ok":True,"request":{"id":rid,"status":"pending"}})
            if path=="/api/registration/decision":
                prof=require_professor(db,bearer(self))
                if not prof:return self.send_json(403,{"ok":False,"error":"Somente o Professor pode aprovar ou recusar cadastro de aluno."})
                rid=str(p.get("requestId") or "");status=str(p.get("status") or "")
                if status not in ("approved","rejected"):return self.send_json(400,{"ok":False,"error":"Decisão inválida."})
                row=db.execute("SELECT * FROM registration_requests WHERE id=? AND academy_id=?",(rid,prof["academy_id"])).fetchone()
                if not row:return self.send_json(404,{"ok":False,"error":"Solicitação não encontrada."})
                sid=str(p.get("studentId") or "") or None
                db.execute("UPDATE registration_requests SET status=?,student_id=?,decided_at=?,decided_by=?,invite_token=NULL WHERE id=?",(status,sid,int(time.time()),prof["id"],rid));db.commit()
                if status=="approved" and sid:create_notification(db,prof["academy_id"],"student_approved","Cadastro aprovado","Seu cadastro na academia foi aprovado.",target_student_id=sid,ref_id=rid)
                return self.send_json(200,{"ok":True})
            if path=="/api/academy/access":
                owner=require_owner(db,bearer(self))
                if not owner:return self.send_json(403,{"ok":False,"error":"Somente o Administrador/Dono pode alterar o acesso da academia."})
                status=str(p.get("status") or "active")
                if status not in ("active","blocked"):return self.send_json(400,{"ok":False,"error":"Status inválido."})
                reason=str(p.get("reason") or "");now=int(time.time())
                db.execute("""INSERT INTO academy_access(academy_id,status,reason,updated_at,updated_by) VALUES(?,?,?,?,?)
                              ON CONFLICT(academy_id) DO UPDATE SET status=excluded.status,reason=excluded.reason,updated_at=excluded.updated_at,updated_by=excluded.updated_by""",(owner["academy_id"],status,reason,now,owner["id"]));db.commit()
                return self.send_json(200,{"ok":True,"status":status,"reason":reason})
            if path=="/api/notifications/read":
                u=session_user(db,bearer(self))
                if not u:return self.send_json(401,{"ok":False,"error":"Sessão inválida."})
                now=int(time.time())
                au=actor_json(u)
                for nid in p.get("ids") or []:
                    row=db.execute("SELECT * FROM app_notifications WHERE id=? AND academy_id=?",(str(nid),u["academy_id"])).fetchone()
                    if row:
                        nv={"targetUserId":row["target_user_id"] or "","targetRole":row["target_role"] or "","targetStudentId":row["target_student_id"] or ""}
                        if perms.can_read_notification(au,nv):db.execute("INSERT OR REPLACE INTO notification_reads(notification_id,user_id,read_at) VALUES(?,?,?)",(str(nid),u["id"],now))
                db.commit();return self.send_json(200,{"ok":True})
            if path=="/api/push/subscribe":
                u=session_user(db,bearer(self))
                if not u:return self.send_json(401,{"ok":False,"error":"Sessão inválida."})
                sub=p.get("subscription") or {};endpoint=str(sub.get("endpoint") or "")
                if not endpoint:return self.send_json(400,{"ok":False,"error":"Subscription inválida."})
                now=int(time.time());existing=db.execute("SELECT id FROM push_subscriptions WHERE endpoint=?",(endpoint,)).fetchone()
                if existing:db.execute("UPDATE push_subscriptions SET user_id=?,academy_id=?,subscription_json=?,updated_at=? WHERE endpoint=?",(u["id"],u["academy_id"],json.dumps(sub,separators=(",",":")),now,endpoint))
                else:db.execute("INSERT INTO push_subscriptions(id,academy_id,user_id,endpoint,subscription_json,created_at,updated_at) VALUES(?,?,?,?,?,?,?)",("push-"+secrets.token_hex(8),u["academy_id"],u["id"],endpoint,json.dumps(sub,separators=(",",":")),now,now))
                db.commit();return self.send_json(200,{"ok":True,"pushEnabled":push_enabled()})
            if path=="/api/push/unsubscribe":
                u=session_user(db,bearer(self))
                if not u:return self.send_json(401,{"ok":False,"error":"Sessão inválida."})
                db.execute("DELETE FROM push_subscriptions WHERE endpoint=? AND user_id=?",(str(p.get("endpoint") or ""),u["id"]));db.commit();return self.send_json(200,{"ok":True})
            if path=="/api/users/create":
                owner=require_owner(db,bearer(self))
                if not owner:return self.send_json(403,{"ok":False,"error":"Administrador/Dono remoto necessário."})
                name=str(p.get("name") or "").strip();un=str(p.get("username") or "").strip().lower();pw=str(p.get("password") or "");role=str(p.get("role") or "aluno");sid=str(p.get("studentId") or "") or None
                if role not in ("admin","professor","aluno"):return self.send_json(400,{"ok":False,"error":"Perfil inválido."})
                if role=="aluno" and not sid:return self.send_json(400,{"ok":False,"error":"Aluno precisa de ficha vinculada."})
                if role=="aluno" and sid:
                    st=SyncAdapter(db,owner["academy_id"]).get("students",sid)
                    if not st:return self.send_json(400,{"ok":False,"error":"Ficha de aluno vinculada não existe nesta academia."})
                if db.execute("SELECT 1 FROM app_users WHERE academy_id=? AND username=?",(owner["academy_id"],un)).fetchone():return self.send_json(409,{"ok":False,"error":"Usuário já existe."})
                try:salt,h,it=make_password(pw)
                except ValueError as e:return self.send_json(400,{"ok":False,"error":str(e)})
                uid="usr-"+secrets.token_hex(8);now=int(time.time())
                db.execute("INSERT INTO app_users(id,academy_id,username,name,role,student_id,password_salt,password_hash,iterations,active,created_at,provider,approved_at) VALUES(?,?,?,?,?,?,?,?,?,1,?,'password',?)",(uid,owner["academy_id"],un,name,role,sid,salt,h,it,now,now));db.commit()
                return self.send_json(200,{"ok":True,"user":user_json(db.execute("SELECT * FROM app_users WHERE id=?",(uid,)).fetchone())})
            if path=="/api/users/update":
                owner=require_owner(db,bearer(self))
                if not owner:return self.send_json(403,{"ok":False,"error":"Administrador/Dono remoto necessário."})
                uid=str(p.get("userId") or "");u=db.execute("SELECT * FROM app_users WHERE id=? AND academy_id=?",(uid,owner["academy_id"])).fetchone()
                if not u:return self.send_json(404,{"ok":False,"error":"Usuário não encontrado."})
                role=str(p.get("role") or u["role"]);sid=str(p.get("studentId") or "") or None;active=1 if p.get("active",True) else 0;name=str(p.get("name") or u["name"]).strip()
                if role not in ("admin","professor","aluno"):return self.send_json(400,{"ok":False,"error":"Perfil inválido."})
                if role=="aluno":
                    if not sid:return self.send_json(400,{"ok":False,"error":"Aluno precisa de ficha vinculada."})
                    if not SyncAdapter(db,owner["academy_id"]).get("students",sid):return self.send_json(400,{"ok":False,"error":"Ficha de aluno vinculada não existe nesta academia."})
                else:sid=None
                if uid==owner["id"] and active==0:return self.send_json(400,{"ok":False,"error":"Você não pode desativar sua própria conta."})
                if u["role"]=="admin" and (active==0 or role!="admin"):
                    admins=db.execute("SELECT COUNT(*) AS n FROM app_users WHERE academy_id=? AND role='admin' AND active=1",(owner["academy_id"],)).fetchone()["n"]
                    if admins<=1:return self.send_json(400,{"ok":False,"error":"A academia precisa manter pelo menos um Administrador/Dono ativo."})
                db.execute("UPDATE app_users SET name=?,role=?,student_id=?,active=? WHERE id=?",(name,role,sid,active,uid));db.commit()
                if not active:db.execute("DELETE FROM auth_sessions WHERE user_id=?",(uid,));db.commit()
                return self.send_json(200,{"ok":True,"user":user_json(db.execute("SELECT * FROM app_users WHERE id=?",(uid,)).fetchone())})
            if path=="/api/users/password":
                owner=require_owner(db,bearer(self))
                if not owner:return self.send_json(403,{"ok":False,"error":"Administrador/Dono remoto necessário."})
                uid=str(p.get("userId") or "");pw=str(p.get("password") or "");u=db.execute("SELECT * FROM app_users WHERE id=? AND academy_id=?",(uid,owner["academy_id"])).fetchone()
                if not u:return self.send_json(404,{"ok":False,"error":"Usuário não encontrado."})
                if u["provider"]=="google":return self.send_json(400,{"ok":False,"error":"Conta Google não usa senha deste servidor."})
                try:salt,h,it=make_password(pw)
                except ValueError as e:return self.send_json(400,{"ok":False,"error":str(e)})
                db.execute("UPDATE app_users SET password_salt=?,password_hash=?,iterations=? WHERE id=?",(salt,h,it,uid));db.execute("DELETE FROM auth_sessions WHERE user_id=?",(uid,));db.commit();return self.send_json(200,{"ok":True})
            if path=="/api/users/approve":
                owner=require_owner(db,bearer(self))
                if not owner:return self.send_json(403,{"ok":False,"error":"Administrador/Dono remoto necessário."})
                uid=str(p.get("userId") or "");role=str(p.get("role") or "aluno");sid=str(p.get("studentId") or "") or None
                u=db.execute("SELECT * FROM app_users WHERE id=? AND academy_id=?",(uid,owner["academy_id"])).fetchone()
                if not u:return self.send_json(404,{"ok":False,"error":"Cadastro não encontrado."})
                if role not in ("admin","professor","aluno"):return self.send_json(400,{"ok":False,"error":"Perfil inválido."})
                if role=="aluno":
                    if not sid or not SyncAdapter(db,owner["academy_id"]).get("students",sid):return self.send_json(400,{"ok":False,"error":"Aluno precisa estar vinculado a uma ficha existente."})
                else:sid=None
                db.execute("UPDATE app_users SET role=?,student_id=?,active=1,approved_at=? WHERE id=?",(role,sid,int(time.time()),uid));db.commit()
                return self.send_json(200,{"ok":True,"user":user_json(db.execute("SELECT * FROM app_users WHERE id=?",(uid,)).fetchone())})
            if path=="/api/auth/logout":
                tok=bearer(self)
                if tok:db.execute("DELETE FROM auth_sessions WHERE token=?",(tok,));db.commit()
                return self.send_json(200,{"ok":True})
            if path=="/api/sync":
                if not self.rate("sync",60,60):return
                academy=str(p.get("academyId") or "").strip()
                if ALLOW_LEGACY_SYNC and LEGACY_TOKEN and bearer(self)==LEGACY_TOKEN:
                    actor_row={"id":"legacy","role":"legacy","academy_id":academy,"student_id":None,"active":1}
                else:
                    actor_row=session_user(db,bearer(self))
                    if not actor_row:return self.send_json(401,{"ok":False,"error":"Autenticação necessária."})
                    if actor_row["academy_id"]!=academy:return self.send_json(403,{"ok":False,"error":"Academia diferente da sua conta."})
                actor=actor_json(actor_row,academy)
                actor_role=actor_row.get("role") if isinstance(actor_row,dict) else actor_row["role"]
                if actor_role!="legacy" and not access_allowed(db,actor_row):return self.send_json(403,{"ok":False,"error":access_row(db,academy)["reason"] or "Acesso da academia suspenso."})
                adapter=SyncAdapter(db,academy)
                cursor=int(p.get("cursor") or 0)
                incoming=list(p.get("changes") or [])[:500]
                already=[];fresh=[]
                for ch in incoming:
                    cid=str(ch.get("changeId") or "")
                    if cid and db.execute("SELECT 1 FROM processed_changes WHERE academy_id=? AND change_id=?",(academy,cid)).fetchone():already.append(cid)
                    else:fresh.append(ch)
                payload={**p,"changes":fresh}
                try:result=perms.process_incoming(actor,payload,adapter,int(time.time()*1000))
                except PermissionError as e:return self.send_json(getattr(e,"status",403),{"ok":False,"error":str(e)})
                for cid in result.get("acceptedIds") or []:
                    if cid:db.execute("INSERT OR IGNORE INTO processed_changes(academy_id,change_id,processed_at) VALUES(?,?,?)",(academy,str(cid),int(time.time())))
                db.commit()
                rows=db.execute("SELECT seq,store_name,record_id,op,value_json,updated_at FROM change_log WHERE academy_id=? AND seq>? ORDER BY seq ASC LIMIT 5000",(academy,cursor)).fetchall()
                out=[];new_cursor=cursor
                for r in rows:
                    new_cursor=max(new_cursor,r["seq"]);val=json.loads(r["value_json"]) if r["value_json"] else None
                    ch={"serverSeq":r["seq"],"store":r["store_name"],"recordId":r["record_id"],"op":r["op"],"value":val,"updatedAt":r["updated_at"]}
                    visible=perms.filter_outgoing(actor,ch)
                    if visible:out.append(visible)
                return self.send_json(200,{"ok":True,"protocol":1,"cursor":new_cursor,"acceptedIds":already+(result.get("acceptedIds") or []),"rejected":result.get("rejected") or [],"changes":out})
            return self.send_json(404,{"ok":False,"error":"Rota não encontrada."})
        finally:db.close()
    def log_message(self,fmt,*args):sys.stdout.write("[%s] %s\n"%(self.log_date_time_string(),fmt%args))

if __name__=="__main__":
    connect().close()
    print(f"Tonicão Sync/Auth/Notifications v0.22 em http://{HOST}:{PORT}")
    print("Web Push:", "ATIVO" if push_enabled() else "INATIVO — inbox/polling continua funcionando")
    print("Bootstrap:", "PRONTO" if BOOTSTRAP_SECRET else "BLOQUEADO — configure TONICAO_BOOTSTRAP_SECRET")
    print("Banco:", DB_PATH, "(persistente)" if DB_PATH.startswith("/var/data/") else "(atenção: confirme persistência do host)")
    print("CORS:", ", ".join(sorted(ALLOWED_ORIGINS)))
    ThreadingHTTPServer((HOST,PORT),Handler).serve_forever()
