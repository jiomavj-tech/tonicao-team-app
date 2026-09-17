/* Tonicão Team — Permissões do servidor (v0.21)
 * Módulo independente de framework. Encaixe no endpoint POST /api/sync e nas demais rotas.
 *
 * O servidor precisa fornecer um "adapter" com a base JÁ FILTRADA pela academia do usuário logado:
 *   adapter.get(store, id)          -> Promise<objeto|null>
 *   adapter.find(store, filtroFn)   -> Promise<objeto[]>
 *   adapter.put(store, value)       -> Promise<void>   (grava e registra no log de alterações)
 *   adapter.remove(store, id)       -> Promise<void>
 *
 * O usuário vem do token (NUNCA do corpo da requisição):
 *   { id, role: "admin"|"professor"|"aluno", studentId, academyId, active }
 */
"use strict";

const ROLES = ["admin", "professor", "aluno"];

// Tabelas que nunca são aceitas pela sincronização (têm rotas próprias ou são só do aparelho)
const NEVER_SYNC = new Set(["users", "auditLog", "settings", "authSession", "syncQueue", "syncMeta",
  "syncLog", "devices", "invites", "remoteAuth", "documents", "academies", "reportPresets"]);

// Quem pode gravar o quê (put e delete)
const PROFESSOR_WRITE = new Set(["students", "classSessions", "attendance", "gradingHistory", "gradingPlans",
  "gradingAssignments", "gradingReminders", "pointsLedger", "events", "techniques", "notifications",
  "paymentStatus", "timerPresets", "sequenceRules", "scoreRules", "academyRules", "registrationRequests",
  "academyContent", "academyTimeline", "academyGallery", "referenceMaterials"]);
// Administrador/Dono: manutenção institucional. Decisões acadêmicas pertencem ao Professor.
const ADMIN_WRITE = new Set(["academyContent", "academyTimeline", "academyGallery", "referenceMaterials", "notifications"]);

// Leitura do aluno
const STUDENT_OWN = new Set(["attendance", "gradingHistory", "gradingAssignments", "gradingReminders", "pointsLedger", "paymentStatus"]);
const SHARED = new Set(["techniques", "gradingPlans", "events", "academyContent", "academyTimeline", "academyGallery",
  "academyRules", "scoreRules", "referenceMaterials", "timerPresets", "sequenceRules"]);
const STUDENT_PUBLIC_FIELDS = ["id", "name", "nickname", "belt", "stripes", "points", "graduationTrack", "photo", "active", "updatedAt"];

const BLOCKED_PAYMENT = ["pendente", "verificar", "bloqueado"];
const CHECKIN_GRACE_MS = 6 * 60 * 60 * 1000; // aceita check-in feito offline e enviado até 6h após o fim da aula

const clone = v => (v == null ? v : JSON.parse(JSON.stringify(v)));
const todayISO = ms => new Date(ms).toISOString().slice(0, 10);
const newId = p => `${p}-srv-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

/* ---------------- Rotas HTTP ---------------- */
// Retorna null se permitido, ou {status, error}
const ROUTES = [
  // [método, caminho (regex), papéis permitidos | "public" | "auth"]
  ["GET",  /^\/health$/, "public"],
  ["GET",  /^\/api\/auth\/google\/config$/, "public"],
  ["POST", /^\/api\/auth\/(login|google|bootstrap)$/, "public"], // bootstrap exige TONICAO_BOOTSTRAP_SECRET na própria rota
  ["GET",  /^\/api\/auth\/(me|permissions)$/, "auth"],
  ["POST", /^\/api\/auth\/logout$/, "auth"],
  ["POST", /^\/api\/sync$/, "auth"],
  ["GET",  /^\/api\/users$/, ["admin"]],
  ["POST", /^\/api\/users\/(create|update|password|approve)$/, ["admin"]],
  ["POST", /^\/api\/registration\/invite$/, ["professor"]],
  ["GET",  /^\/api\/registration\/invite$/, "public"],   // protegido pelo token do convite
  ["POST", /^\/api\/registration\/complete$/, "public"], // protegido pelo token do convite
  ["POST", /^\/api\/registration\/request$/, "public"],  // autocadastro: aplicar limite de requisições
  ["GET",  /^\/api\/registration\/requests$/, ["professor"]],
  ["POST", /^\/api\/registration\/decision$/, ["professor"]],
  ["GET",  /^\/api\/academy\/access$/, "auth"],
  ["POST", /^\/api\/academy\/access$/, ["admin"]],
  ["GET",  /^\/api\/notifications$/, "auth"],
  ["POST", /^\/api\/notifications\/read$/, "auth"],
  ["GET",  /^\/api\/push\/config$/, "auth"],
  ["POST", /^\/api\/push\/(subscribe|unsubscribe)$/, "auth"],
];
function checkRoute(user, method, path) {
  const rule = ROUTES.find(([m, re]) => m === method.toUpperCase() && re.test(path));
  if (!rule) return { status: 404, error: "Rota não encontrada." };
  const who = rule[2];
  if (who === "public") return null;
  if (!user || user.active === false) return { status: 401, error: "Faça login novamente." };
  if (who === "auth") return null;
  if (!who.includes(user.role)) return { status: 403, error: "Sem permissão para esta ação." };
  return null;
}
// Regras extras para rotas com dono:
//  - /api/users/create e /update: somente admin cria admin/professor; conta "aluno" exige studentId existente.
//  - /api/users/update: admin não pode desativar a própria conta nem remover o último admin.
//  - /api/notifications/read: marcar só notificações destinadas ao próprio usuário (use canReadNotification).
//  - /api/academy/access: professor e aluno de academia bloqueada recebem 403 em /api/sync.

/* ---------------- Leitura (o que cada um recebe no pull) ---------------- */
function canReadNotification(user, n) {
  if (!n) return false;
  if (user.role !== "aluno") return true;
  if (n.targetUserId) return n.targetUserId === user.id;
  if (n.targetStudentId) return n.targetStudentId === user.studentId;
  if (n.targetRole) return n.targetRole === "aluno";
  return true;
}

function filterOutgoing(user, change) {
  if (!user || user.active === false) return null;
  const { store } = change;
  if (["authSession", "syncQueue", "settings", "remoteAuth"].includes(store)) return null;
  const out = clone(change);
  const v = out.value;

  if (store === "users") {
    if (user.role === "aluno") return null;
    if (v) { delete v.passwordHash; delete v.passwordSalt; delete v.passwordIterations; }
    return out;
  }
  if (user.role !== "aluno") return out;

  // ----- Aluno -----
  if (out.op === "delete") return (store === "students" || STUDENT_OWN.has(store) || SHARED.has(store) || store === "classSessions") ? out : null;
  if (SHARED.has(store)) return out;
  if (store === "students") {
    if (v.id === user.studentId) return out;
    out.value = Object.fromEntries(STUDENT_PUBLIC_FIELDS.filter(k => k in v).map(k => [k, v[k]])); // ranking
    return out;
  }
  if (store === "classSessions") { delete v.code; return out; } // o código não sai do aparelho do Professor
  if (STUDENT_OWN.has(store)) {
    if (v.studentId !== user.studentId) return null;
    if (store === "gradingAssignments" && v.evaluation) delete v.evaluation.privateNote;
    return out;
  }
  if (store === "notifications") return canReadNotification(user, v) ? out : null;
  return null; // registrationRequests, auditLog, users...
}

/* ---------------- Escrita (o que cada um pode enviar) ---------------- */
async function serverVersion(user, adapter, store, recordId) {
  // Devolve a versão do servidor apenas se o usuário puder lê-la (para o app corrigir a cópia local)
  const value = await adapter.get(store, recordId);
  if (!value) return { value: null };
  const f = filterOutgoing(user, { store, op: "put", recordId, value });
  return f ? { value: f.value } : undefined;
}

async function scorePoints(adapter, ruleId, fallback) {
  const r = await adapter.get("scoreRules", ruleId);
  return Number(r?.points ?? fallback);
}

// Presença enviada pelo aluno: validada e pontuada NO SERVIDOR
async function acceptStudentAttendance(user, ch, adapter, nowMs) {
  const v = ch.value || {};
  if (ch.op !== "put") return { reject: "Aluno não pode apagar presenças." };
  if (await adapter.get("attendance", ch.recordId)) return { reject: "Presença já registrada." };
  if (!user.studentId || v.studentId !== user.studentId) return { reject: "Presença de outro aluno." };
  const student = await adapter.get("students", user.studentId);
  if (!student || student.active === false) return { reject: "Ficha de aluno inativa." };
  if (BLOCKED_PAYMENT.includes(student.payment)) return { reject: "Pagamento precisa ser liberado pelo Professor." };
  const session = v.sessionId && await adapter.get("classSessions", v.sessionId);
  if (!session) return { reject: "Aula não encontrada." };
  const start = new Date(session.createdAt).getTime();
  const end = new Date(session.closedAt || session.expiresAt).getTime();
  if (!(nowMs >= start && nowMs <= end + CHECKIN_GRACE_MS)) return { reject: "Aula encerrada." };
  if (String(v.checkinCode || "") !== String(session.code)) return { reject: "Código da aula inválido." };
  const dup = await adapter.find("attendance", a => a.studentId === user.studentId && a.sessionId === session.id);
  if (dup.length) return { reject: "Presença já registrada nesta aula." };

  const at = new Date(nowMs);
  const attendance = { id: ch.recordId, studentId: user.studentId, date: session.date || todayISO(nowMs),
    time: /^\d\d:\d\d$/.test(v.time || "") ? v.time : at.toISOString().slice(11, 16),
    source: "qr-codigo", sessionId: session.id, status: "approved", validatedBy: "server" };
  const writes = [["attendance", attendance]];

  // Pontuação (mesma regra do app)
  const s = clone(student);
  const pts = await scorePoints(adapter, "score-base-attendance", 5);
  s.classesInBelt = (s.classesInBelt || 0) + 1; s.streak = (s.streak || 0) + 1; s.points = (s.points || 0) + pts;
  writes.push(["pointsLedger", { id: newId("pts"), studentId: s.id, date: attendance.date, type: "presenca", points: pts,
    note: `Presença no treino (+${pts})`, sessionId: session.id, ruleId: "score-base-attendance" }]);
  const rules = (await adapter.find("sequenceRules", r => r.active !== false && Number(r.classes) > 0)).sort((a, b) => a.classes - b.classes);
  s.sequenceAwards = Array.isArray(s.sequenceAwards) ? s.sequenceAwards : [];
  for (const r of rules) {
    if (s.streak >= Number(r.classes) && !s.sequenceAwards.includes(r.id)) {
      s.sequenceAwards.push(r.id);
      const bonus = Number(r.points || 0);
      if (bonus) { s.points += bonus; writes.push(["pointsLedger", { id: newId("pts"), studentId: s.id, date: attendance.date, type: "sequencia", points: bonus, note: `Bônus: ${r.label || r.classes + " treinos seguidos"} (+${bonus})`, ruleId: r.id }]); }
    }
  }
  writes.push(["students", s]);
  const rem = (await adapter.find("gradingReminders", r => r.studentId === s.id && r.status === "active" && r.mode === "classes" && r.remaining > 0))[0];
  if (rem) writes.push(["gradingReminders", { ...rem, remaining: Math.max(0, rem.remaining - 1) }]);
  return { writes };
}

// Aluno só marca o próprio progresso de estudo da graduação
async function acceptStudentProgress(user, ch, adapter) {
  if (ch.op !== "put") return { reject: "Sem permissão." };
  const cur = await adapter.get("gradingAssignments", ch.recordId);
  if (!cur || cur.studentId !== user.studentId) return { reject: "Preparação não encontrada." };
  const incoming = ch.value || {}; // qualquer outro campo enviado é ignorado
  const progress = Object.fromEntries(Object.entries(incoming.progress || {})
    .filter(([k, val]) => /^[\w-]{1,40}$/.test(k) && ["boolean", "number", "string"].includes(typeof val))
    .map(([k, val]) => [k, typeof val === "string" ? val.slice(0, 200) : val]));
  return { writes: [["gradingAssignments", { ...cur, progress }]] };
}

async function evaluateChange(user, ch, adapter, nowMs) {
  if (!user || user.active === false || !ROLES.includes(user.role)) return { reject: "Sessão inválida." };
  if (!ch || typeof ch.store !== "string" || !ch.recordId || !["put", "delete"].includes(ch.op)) return { reject: "Alteração malformada." };
  if (ch.op === "put" && (!ch.value || String(ch.value.id) !== String(ch.recordId))) return { reject: "Alteração malformada." };
  if (NEVER_SYNC.has(ch.store)) return { reject: "Tabela gerenciada apenas pelo servidor.", silent: true };

  if (user.role === "professor" && PROFESSOR_WRITE.has(ch.store)) return { writes: [[ch.store, ch.op === "put" ? ch.value : null]] };
  if (user.role === "admin" && ADMIN_WRITE.has(ch.store)) return { writes: [[ch.store, ch.op === "put" ? ch.value : null]] };
  if (user.role === "aluno") {
    if (ch.store === "attendance") return acceptStudentAttendance(user, ch, adapter, nowMs);
    if (ch.store === "gradingAssignments") return acceptStudentProgress(user, ch, adapter);
  }
  return { reject: "Sem permissão para alterar esta informação." };
}

/* ---------------- Orquestração do /api/sync ---------------- */
// Retorna { acceptedIds, rejected } — em seguida o servidor monta o pull normalmente,
// passando cada alteração por filterOutgoing(user, change).
async function processIncoming(user, payload, adapter, nowMs = Date.now()) {
  if (payload?.academyId && user.academyId && payload.academyId !== user.academyId)
    throw Object.assign(new Error("Academia diferente da sua conta."), { status: 403 });
  const acceptedIds = [], rejected = [];
  for (const ch of (payload?.changes || []).slice(0, 500)) {
    let result;
    try { result = await evaluateChange(user, ch, adapter, nowMs); }
    catch (e) { result = { reject: "Erro ao validar alteração." }; }
    if (result.writes) {
      for (const [store, value] of result.writes) {
        if (value === null) await adapter.remove(store, ch.recordId);
        else await adapter.put(store, { ...value, updatedAt: new Date(nowMs).toISOString() });
      }
      acceptedIds.push(ch.changeId);
      // Se o servidor alterou o registro (ex.: presença validada), o app recebe a versão oficial no pull.
    } else {
      const item = { changeId: ch?.changeId, store: ch?.store, recordId: ch?.recordId, reason: result.reject };
      if (!result.silent && ch?.store && ch?.recordId) {
        const sv = await serverVersion(user, adapter, ch.store, ch.recordId);
        if (sv) item.server = sv; // { value: objeto | null } — o app substitui/apaga a cópia local
      }
      rejected.push(item);
    }
  }
  return { acceptedIds, rejected };
}

module.exports = { checkRoute, filterOutgoing, processIncoming, evaluateChange, canReadNotification,
  PROFESSOR_WRITE, ADMIN_WRITE, NEVER_SYNC, STUDENT_OWN, SHARED };
