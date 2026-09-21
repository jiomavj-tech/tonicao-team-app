# v0.22 — Hardening de homologação

Esta versão prioriza segurança e publicação, sem ampliar o escopo funcional.

## Corrigido
- link de convite não carrega mais endereço do servidor;
- API pública vem apenas de `config.js`;
- produção não cria alunos/eventos fictícios;
- migração remove registros demo conhecidos;
- data do aplicativo usa o dia local;
- validação de presença no servidor usa `America/Sao_Paulo` por padrão;
- bootstrap remoto exige `TONICAO_BOOTSTRAP_SECRET`;
- CORS usa allowlist;
- rate limit para login/cadastro/sync;
- convites expiram (72h por padrão) e usam token maior;
- login remoto passa a sincronizar a identidade local;
- sync bloqueia identidade local/remota divergente;
- sessão remota padrão reduzida para 7 dias;
- templates Render para teste e produção persistente.

## Antes do teste em dois celulares
1. Publique o backend.
2. Edite `config.js` e coloque a URL HTTPS do backend em `apiBase`.
3. Faça commit/push.
4. Aguarde GitHub Pages atualizar.
5. Abra `/health` e confirme `bootstrapReady: true`.

## Dados reais
Use dados reais apenas com banco persistente. Para Render, use `render-production.yaml` ou configure um Persistent Disk manualmente.
