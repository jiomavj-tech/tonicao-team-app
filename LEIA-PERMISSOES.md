# Permissões no servidor — como encaixar

O arquivo `permissions.js` não depende de framework. O servidor atual só precisa chamar 3 funções.

## 1. Em todas as rotas (antes de executar)
```js
const P = require("./permissions");
app.use((req, res, next) => {
  const erro = P.checkRoute(req.user, req.method, req.path); // req.user vem do token
  if (erro) return res.status(erro.status).json({ error: erro.error });
  next();
});
```

## 2. No POST /api/sync
```js
app.post("/api/sync", async (req, res) => {
  const user = req.user;                        // do token, NUNCA do corpo
  const adapter = criarAdapter(user.academyId); // get / find / put / remove da academia do usuário
  try {
    const { acceptedIds, rejected } = await P.processIncoming(user, req.body, adapter);
    const { changes, cursor } = await lerAlteracoesDepois(user.academyId, req.body.cursor);
    const visiveis = changes.map(c => P.filterOutgoing(user, c)).filter(Boolean);
    res.json({ acceptedIds, rejected, changes: visiveis, cursor });
  } catch (e) { res.status(e.status || 500).json({ error: e.message }); }
});
```
Importante: o pull usa o mesmo filtro nas alterações antigas, então aluno nunca recebe dado que não pode ver.

## 3. Quem pode fazer o quê

| Tabela | Professor | Admin/Dono | Aluno (grava) | Aluno (recebe) |
|---|---|---|---|---|
| students | ✅ | — | ❌ | própria ficha completa; outros só nome/faixa/pontos (ranking) |
| attendance | ✅ | — | só check-in próprio, validado | só as próprias |
| pointsLedger, gradingHistory, gradingReminders, paymentStatus | ✅ | — | ❌ | só as próprias |
| gradingAssignments | ✅ | — | só o campo `progress` da própria | própria, sem `privateNote` |
| classSessions | ✅ | — | ❌ | sem o `code` |
| techniques, gradingPlans, events, regras, pontuação, timer | ✅ | — | ❌ | ✅ |
| academyContent, timeline, galeria, materiais | ✅ | ✅ | ❌ | ✅ |
| notifications | ✅ | ✅ | ❌ | só as destinadas a ele |
| registrationRequests | ✅ | — | ❌ (usa rotas de convite) | ❌ |
| users, auditLog, settings | só pelas rotas `/api/users` | idem | ❌ | ❌ |

## Check-in do aluno (validado no servidor)
O servidor só aceita a presença se o aluno está ativo e com o pagamento liberado. A aula também precisa existir, e o check-in tem que chegar até 6h depois do fim dela (isso cobre quem ficou sem internet). O código precisa bater, e não pode haver presença repetida. Os pontos, a sequência e os lembretes de graduação são calculados **pelo servidor**. O que o celular do aluno calculou é descartado e substituído pela versão oficial.

## Resposta de recusa
```json
{ "changeId": "...", "store": "students", "recordId": "s1", "reason": "Sem permissão...", "server": { "value": { ...versão oficial } } }
```
`server.value = null` significa "apague a cópia local". Se não houver `server`, o app só tira a alteração da fila. O app v0.21 já trata os dois casos.

Testes: `node test.js`
