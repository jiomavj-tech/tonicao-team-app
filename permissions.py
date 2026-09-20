"""Tonicão Team — permissões do servidor (v0.22).

Port fiel das regras de permissions.js para o servidor Python de referência.
O usuário SEMPRE vem da sessão/token autenticado, nunca do corpo da requisição.
"""
from __future__ import annotations

import copy
import re
import time
import os
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

ROLES = {"admin", "professor", "aluno"}

NEVER_SYNC = {
    "users", "auditLog", "settings", "authSession", "syncQueue", "syncMeta",
    "syncLog", "devices", "invites", "remoteAuth", "documents", "academies", "reportPresets",
}

PROFESSOR_WRITE = {
    "students", "classSessions", "attendance", "gradingHistory", "gradingPlans",
    "gradingAssignments", "gradingReminders", "pointsLedger", "events", "techniques", "notifications",
    "paymentStatus", "timerPresets", "sequenceRules", "scoreRules", "academyRules", "registrationRequests",
    "academyContent", "academyTimeline", "academyGallery", "referenceMaterials",
}

ADMIN_WRITE = {"academyContent", "academyTimeline", "academyGallery", "referenceMaterials", "notifications"}

STUDENT_OWN = {"attendance", "gradingHistory", "gradingAssignments", "gradingReminders", "pointsLedger", "paymentStatus"}
SHARED = {
    "techniques", "gradingPlans", "events", "academyContent", "academyTimeline", "academyGallery",
    "academyRules", "scoreRules", "referenceMaterials", "timerPresets", "sequenceRules",
}
STUDENT_PUBLIC_FIELDS = ["id", "name", "nickname", "belt", "stripes", "points", "graduationTrack", "photo", "active", "updatedAt"]

BLOCKED_PAYMENT = {"pendente", "verificar", "bloqueado"}
CHECKIN_GRACE_MS = 6 * 60 * 60 * 1000
try:
    ACADEMY_TZ=ZoneInfo(os.getenv("TONICAO_TIMEZONE","America/Sao_Paulo"))
except Exception:
    ACADEMY_TZ=timezone.utc

_ROUTE_RULES = [
    ("GET", re.compile(r"^/health$"), "public"),
    ("GET", re.compile(r"^/api/auth/google/config$"), "public"),
    ("POST", re.compile(r"^/api/auth/(login|google|bootstrap)$"), "public"),
    ("GET", re.compile(r"^/api/auth/(me|permissions)$"), "auth"),
    ("POST", re.compile(r"^/api/auth/logout$"), "auth"),
    ("POST", re.compile(r"^/api/sync$"), "auth"),
    ("GET", re.compile(r"^/api/users$"), {"admin"}),
    ("POST", re.compile(r"^/api/users/(create|update|password|approve)$"), {"admin"}),
    ("POST", re.compile(r"^/api/registration/invite$"), {"professor"}),
    ("GET", re.compile(r"^/api/registration/invite$"), "public"),
    ("POST", re.compile(r"^/api/registration/complete$"), "public"),
    ("POST", re.compile(r"^/api/registration/request$"), "public"),
    ("GET", re.compile(r"^/api/registration/requests$"), {"professor"}),
    ("POST", re.compile(r"^/api/registration/decision$"), {"professor"}),
    ("GET", re.compile(r"^/api/academy/access$"), "auth"),
    ("POST", re.compile(r"^/api/academy/access$"), {"admin"}),
    ("GET", re.compile(r"^/api/notifications$"), "auth"),
    ("POST", re.compile(r"^/api/notifications/read$"), "auth"),
    ("GET", re.compile(r"^/api/push/config$"), "auth"),
    ("POST", re.compile(r"^/api/push/(subscribe|unsubscribe)$"), "auth"),
]


def _role(user):
    return (user or {}).get("role")


def check_route(user, method: str, path: str):
    """Return None when allowed or {'status', 'error'} when blocked."""
    method = str(method or "").upper()
    for m, pattern, who in _ROUTE_RULES:
        if m == method and pattern.match(path):
            if who == "public":
                return None
            if not user or user.get("active") is False:
                return {"status": 401, "error": "Faça login novamente."}
            if who == "auth":
                return None
            if user.get("role") not in who:
                return {"status": 403, "error": "Sem permissão para esta ação."}
            return None
    return {"status": 404, "error": "Rota não encontrada."}


def can_read_notification(user, n):
    if not n:
        return False
    if user.get("role") != "aluno":
        return True
    if n.get("targetUserId"):
        return n.get("targetUserId") == user.get("id")
    if n.get("targetStudentId"):
        return n.get("targetStudentId") == user.get("studentId")
    if n.get("targetRole"):
        return n.get("targetRole") == "aluno"
    return True


def filter_outgoing(user, change):
    if not user or user.get("active") is False:
        return None
    store = change.get("store")
    if store in {"authSession", "syncQueue", "settings", "remoteAuth"}:
        return None
    out = copy.deepcopy(change)
    value = out.get("value")

    if store == "users":
        if user.get("role") == "aluno":
            return None
        if value:
            for k in ("passwordHash", "passwordSalt", "passwordIterations"):
                value.pop(k, None)
        return out

    if user.get("role") != "aluno":
        return out

    if out.get("op") == "delete":
        return out if store == "students" or store in STUDENT_OWN or store in SHARED or store == "classSessions" else None
    if store in SHARED:
        return out
    if store == "students":
        if not value:
            return None
        if value.get("id") == user.get("studentId"):
            return out
        out["value"] = {k: value[k] for k in STUDENT_PUBLIC_FIELDS if k in value}
        return out
    if store == "classSessions":
        if value:
            value.pop("code", None)
        return out
    if store in STUDENT_OWN:
        if not value or value.get("studentId") != user.get("studentId"):
            return None
        if store == "gradingAssignments" and value.get("evaluation"):
            value["evaluation"].pop("privateNote", None)
        return out
    if store == "notifications":
        return out if can_read_notification(user, value) else None
    return None


def _parse_ms(value):
    if not value:
        return None
    if isinstance(value, (int, float)):
        return int(value)
    s = str(value).strip()
    try:
        if s.endswith("Z"):
            s = s[:-1] + "+00:00"
        dt = datetime.fromisoformat(s)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return int(dt.timestamp() * 1000)
    except Exception:
        return None


def _today_iso(ms):
    return datetime.fromtimestamp(ms / 1000, tz=ACADEMY_TZ).date().isoformat()


def _new_id(prefix):
    import secrets
    return f"{prefix}-srv-{int(time.time()*1000)}-{secrets.token_hex(3)}"


def server_version(user, adapter, store, record_id):
    value = adapter.get(store, record_id)
    if not value:
        return {"value": None}
    f = filter_outgoing(user, {"store": store, "op": "put", "recordId": record_id, "value": value})
    return {"value": f.get("value")} if f else None


def score_points(adapter, rule_id, fallback):
    r = adapter.get("scoreRules", rule_id)
    try:
        return float(r.get("points", fallback)) if r else float(fallback)
    except Exception:
        return float(fallback)


def accept_student_attendance(user, change, adapter, now_ms):
    v = change.get("value") or {}
    if change.get("op") != "put":
        return {"reject": "Aluno não pode apagar presenças."}
    if adapter.get("attendance", change.get("recordId")):
        return {"reject": "Presença já registrada."}
    if not user.get("studentId") or v.get("studentId") != user.get("studentId"):
        return {"reject": "Presença de outro aluno."}
    student = adapter.get("students", user.get("studentId"))
    if not student or student.get("active") is False:
        return {"reject": "Ficha de aluno inativa."}
    if student.get("payment") in BLOCKED_PAYMENT:
        return {"reject": "Pagamento precisa ser liberado pelo Professor."}
    session = adapter.get("classSessions", v.get("sessionId")) if v.get("sessionId") else None
    if not session:
        return {"reject": "Aula não encontrada."}
    start = _parse_ms(session.get("createdAt"))
    end = _parse_ms(session.get("closedAt") or session.get("expiresAt"))
    if start is None or end is None or not (now_ms >= start and now_ms <= end + CHECKIN_GRACE_MS):
        return {"reject": "Aula encerrada."}
    if str(v.get("checkinCode") or "") != str(session.get("code") or ""):
        return {"reject": "Código da aula inválido."}
    dup = adapter.find("attendance", lambda a: a.get("studentId") == user.get("studentId") and a.get("sessionId") == session.get("id"))
    if dup:
        return {"reject": "Presença já registrada nesta aula."}

    at = datetime.fromtimestamp(now_ms / 1000, tz=ACADEMY_TZ)
    tm = str(v.get("time") or "")
    if not re.match(r"^\d\d:\d\d$", tm):
        tm = at.strftime("%H:%M")
    attendance = {
        "id": change.get("recordId"), "studentId": user.get("studentId"),
        "date": session.get("date") or _today_iso(now_ms), "time": tm,
        "source": "qr-codigo", "sessionId": session.get("id"), "status": "approved", "validatedBy": "server",
    }
    writes = [("attendance", attendance)]

    s = copy.deepcopy(student)
    pts = score_points(adapter, "score-base-attendance", 5)
    pts = int(pts) if float(pts).is_integer() else pts
    s["classesInBelt"] = (s.get("classesInBelt") or 0) + 1
    s["streak"] = (s.get("streak") or 0) + 1
    s["points"] = (s.get("points") or 0) + pts
    writes.append(("pointsLedger", {
        "id": _new_id("pts"), "studentId": s.get("id"), "date": attendance["date"], "type": "presenca", "points": pts,
        "note": f"Presença no treino (+{pts})", "sessionId": session.get("id"), "ruleId": "score-base-attendance",
    }))
    rules = sorted(adapter.find("sequenceRules", lambda r: r.get("active") is not False and float(r.get("classes") or 0) > 0), key=lambda x: float(x.get("classes") or 0))
    s["sequenceAwards"] = list(s.get("sequenceAwards") or [])
    for r in rules:
        if s["streak"] >= float(r.get("classes") or 0) and r.get("id") not in s["sequenceAwards"]:
            s["sequenceAwards"].append(r.get("id"))
            bonus = float(r.get("points") or 0)
            bonus = int(bonus) if bonus.is_integer() else bonus
            if bonus:
                s["points"] += bonus
                writes.append(("pointsLedger", {
                    "id": _new_id("pts"), "studentId": s.get("id"), "date": attendance["date"], "type": "sequencia", "points": bonus,
                    "note": f"Bônus: {r.get('label') or str(r.get('classes'))+' treinos seguidos'} (+{bonus})", "ruleId": r.get("id"),
                }))
    writes.append(("students", s))
    rems = adapter.find("gradingReminders", lambda r: r.get("studentId") == s.get("id") and r.get("status") == "active" and r.get("mode") == "classes" and float(r.get("remaining") or 0) > 0)
    if rems:
        rem = copy.deepcopy(rems[0])
        rem["remaining"] = max(0, float(rem.get("remaining") or 0) - 1)
        if float(rem["remaining"]).is_integer():
            rem["remaining"] = int(rem["remaining"])
        writes.append(("gradingReminders", rem))
    return {"writes": writes}


def accept_student_progress(user, change, adapter):
    if change.get("op") != "put":
        return {"reject": "Sem permissão."}
    cur = adapter.get("gradingAssignments", change.get("recordId"))
    if not cur or cur.get("studentId") != user.get("studentId"):
        return {"reject": "Preparação não encontrada."}
    incoming = change.get("value") or {}
    progress = {}
    for k, val in (incoming.get("progress") or {}).items():
        if not re.match(r"^[\w-]{1,40}$", str(k)):
            continue
        if isinstance(val, (bool, int, float)):
            progress[k] = val
        elif isinstance(val, str):
            progress[k] = val[:200]
    value = copy.deepcopy(cur)
    value["progress"] = progress
    return {"writes": [("gradingAssignments", value)]}


def evaluate_change(user, change, adapter, now_ms):
    if not user or user.get("active") is False or user.get("role") not in ROLES:
        return {"reject": "Sessão inválida."}
    if not change or not isinstance(change.get("store"), str) or not change.get("recordId") or change.get("op") not in {"put", "delete"}:
        return {"reject": "Alteração malformada."}
    if change.get("op") == "put" and (not change.get("value") or str(change["value"].get("id")) != str(change.get("recordId"))):
        return {"reject": "Alteração malformada."}
    if change.get("store") in NEVER_SYNC:
        return {"reject": "Tabela gerenciada apenas pelo servidor.", "silent": True}

    role = user.get("role")
    if role == "professor" and change.get("store") in PROFESSOR_WRITE:
        return {"writes": [(change.get("store"), change.get("value") if change.get("op") == "put" else None)]}
    if role == "admin" and change.get("store") in ADMIN_WRITE:
        return {"writes": [(change.get("store"), change.get("value") if change.get("op") == "put" else None)]}
    if role == "aluno":
        if change.get("store") == "attendance":
            return accept_student_attendance(user, change, adapter, now_ms)
        if change.get("store") == "gradingAssignments":
            return accept_student_progress(user, change, adapter)
    return {"reject": "Sem permissão para alterar esta informação."}


def process_incoming(user, payload, adapter, now_ms=None):
    now_ms = int(now_ms if now_ms is not None else time.time() * 1000)
    if payload.get("academyId") and user.get("academyId") and payload.get("academyId") != user.get("academyId"):
        err = PermissionError("Academia diferente da sua conta.")
        err.status = 403
        raise err
    accepted_ids, rejected = [], []
    for ch in (payload.get("changes") or [])[:500]:
        try:
            result = evaluate_change(user, ch, adapter, now_ms)
        except Exception:
            result = {"reject": "Erro ao validar alteração."}
        if result.get("writes") is not None:
            for store, value in result.get("writes"):
                if value is None:
                    adapter.remove(store, ch.get("recordId"), now_ms=now_ms)
                else:
                    v = copy.deepcopy(value)
                    v["updatedAt"] = datetime.fromtimestamp(now_ms / 1000, tz=timezone.utc).isoformat().replace("+00:00", "Z")
                    adapter.put(store, v, now_ms=now_ms)
            accepted_ids.append(ch.get("changeId"))
        else:
            item = {"changeId": ch.get("changeId"), "store": ch.get("store"), "recordId": ch.get("recordId"), "reason": result.get("reject")}
            if not result.get("silent") and ch.get("store") and ch.get("recordId"):
                sv = server_version(user, adapter, ch.get("store"), ch.get("recordId"))
                if sv is not None:
                    item["server"] = sv
            rejected.append(item)
    return {"acceptedIds": accepted_ids, "rejected": rejected}
