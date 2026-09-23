#!/usr/bin/env node
/* Backup diário do Firestore → arquivo JSON.
   Roda no GitHub Actions. Lê tudo que está em academies/<ACADEMY_ID> e salva num arquivo.
   Não imprime nenhum dado de aluno no log: só a contagem por coleção. */
"use strict";
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const ACADEMY_ID = process.env.ACADEMY_ID || "tonicao-sul-ilha";
const OUT = process.env.OUT_FILE || "backup-atual.json";

function b64url(buf) {
  return Buffer.from(buf).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/* Troca a chave da conta de robô por um passe temporário do Google. */
async function getAccessToken(sa) {
  const now = Math.floor(Date.now() / 1000);
  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const claim = b64url(JSON.stringify({
    iss: sa.client_email,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600
  }));
  const signature = b64url(
    crypto.createSign("RSA-SHA256").update(`${header}.${claim}`).sign(sa.private_key)
  );
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${header}.${claim}.${signature}`
    })
  });
  if (!res.ok) throw new Error(`Falha ao autenticar no Google (${res.status}). Confira o segredo FIREBASE_SERVICE_ACCOUNT.`);
  return (await res.json()).access_token;
}

async function api(url, token, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) }
  });
  if (!res.ok) throw new Error(`Firestore respondeu ${res.status} em ${url.split("/documents")[1] || url}`);
  return res.json();
}

/* Converte o formato do Firestore para JSON comum. */
function fromFs(value) {
  if (value === null || value === undefined) return null;
  if ("nullValue" in value) return null;
  if ("booleanValue" in value) return value.booleanValue;
  if ("integerValue" in value) return Number(value.integerValue);
  if ("doubleValue" in value) return value.doubleValue;
  if ("stringValue" in value) return value.stringValue;
  if ("timestampValue" in value) return value.timestampValue;
  if ("bytesValue" in value) return { __bytes: value.bytesValue };
  if ("referenceValue" in value) return { __ref: value.referenceValue };
  if ("geoPointValue" in value) return value.geoPointValue;
  if ("arrayValue" in value) return (value.arrayValue.values || []).map(fromFs);
  if ("mapValue" in value) {
    const out = {};
    for (const [k, v] of Object.entries(value.mapValue.fields || {})) out[k] = fromFs(v);
    return out;
  }
  return null;
}

async function main() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Segredo FIREBASE_SERVICE_ACCOUNT não encontrado no repositório.");
  const sa = JSON.parse(raw);
  const projectId = sa.project_id;
  const base = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
  const academyPath = `${base}/academies/${ACADEMY_ID}`;

  console.log(`Projeto: ${projectId} | Academia: ${ACADEMY_ID}`);
  const token = await getAccessToken(sa);

  /* Quais coleções existem dentro da academia. */
  const idsRes = await api(`${academyPath}:listCollectionIds`, token, { method: "POST", body: "{}" });
  const collections = idsRes.collectionIds || [];
  if (!collections.length) throw new Error("Nenhuma coleção encontrada. A academia existe nesse projeto?");

  const payload = {
    formato: "tonicao-backup-firestore",
    versao: 1,
    geradoEm: new Date().toISOString(),
    projectId,
    academyId: ACADEMY_ID,
    colecoes: {}
  };

  let total = 0;
  for (const col of collections.sort()) {
    const docs = [];
    let pageToken = "";
    do {
      const url = `${academyPath}/${encodeURIComponent(col)}?pageSize=300${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ""}`;
      const page = await api(url, token);
      for (const d of page.documents || []) {
        const obj = {};
        for (const [k, v] of Object.entries(d.fields || {})) obj[k] = fromFs(v);
        obj.__id = d.name.split("/").pop();
        docs.push(obj);
      }
      pageToken = page.nextPageToken || "";
    } while (pageToken);
    payload.colecoes[col] = docs;
    total += docs.length;
    console.log(`  ${col}: ${docs.length} registro(s)`);
  }

  /* Também guarda o documento da própria academia (nome, logo, configurações). */
  try {
    const doc = await api(academyPath, token);
    const obj = {};
    for (const [k, v] of Object.entries(doc.fields || {})) obj[k] = fromFs(v);
    payload.academia = obj;
  } catch (e) {
    console.log(`  (documento da academia não lido: ${e.message})`);
  }

  if (total === 0) throw new Error("Backup vazio — nada foi gravado, para não apagar um backup bom.");

  fs.mkdirSync(path.dirname(path.resolve(OUT)), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2));
  const kb = Math.round(fs.statSync(OUT).size / 1024);
  console.log(`\nBackup pronto: ${total} registro(s) em ${collections.length} coleção(ões) — ${kb} KB`);
}

main().catch(e => { console.error("ERRO:", e.message); process.exit(1); });
