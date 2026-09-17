# v0.21 — Correções

Substituir estes arquivos na pasta do app: app.js, db.js, sw.js, sync.js, auth.js, remote-sync.js, index.html.

## Bugs críticos
- Check-in: criada `applySequenceBonuses()` (bônus de treinos seguidos, lançado uma vez por regra).
- Graduação: criado "Reavaliar depois" (`deferGrading`) com lembrete por nº de aulas ou por data.
- Check-in: criada `drawSessionQR()` (QR da aula com o código de 6 dígitos).
- Check-in não quebra mais quando a conta do aluno não tem ficha vinculada.
- Service Worker: rotas /api/ e outros domínios não passam mais pelo cache; HTML/JS/CSS buscam a versão nova primeiro (atualizações chegam aos celulares).

## Segurança / LGPD
- Todo texto gravado é limpo (< > removidos, aspas trocadas por tipográficas). Dados antigos são limpos uma vez na abertura.
- Exportação do aluno leva só os dados dele + conteúdo da academia (sem usuários, auditoria, pré-cadastros de terceiros).
- Backups não levam mais tokens do servidor; importar backup mantém a conexão do aparelho.

## Sincronização / desempenho
- Conexão com o IndexedDB reaproveitada.
- Fila de sincronização sem leitura completa a cada gravação.
- Confirmação do servidor não apaga alteração feita durante o envio.
- Importar backup preserva as datas originais (não sobrescreve dados mais novos do servidor).

## Pendente (depende de decisão / servidor)
- Quando a "sequência" (streak) deve zerar.
- Código da aula chega ao aluno pela sincronização — validar presença no servidor.
- Servidor precisa validar permissões de cada alteração.

## Permissões (2ª parte)
- Novo `server/permissions.js`: regras por rota, por tabela e por papel; check-in do aluno validado e pontuado no servidor; filtro do que cada um recebe.
- App: trata alterações recusadas (tira da fila e volta para a versão oficial) e avisa o aluno quando o check-in não é confirmado.
- App: código da aula não precisa estar no celular do aluno — vai junto na presença para o servidor validar.
- App: guardas de permissão adicionadas em agendar/avaliar prova, PDF/técnicas do plano, abrir/encerrar aula, conteúdo da academia e bloqueio do sistema.
- App: dados de demonstração e migrações ficam só no aparelho (não sobem mais para o servidor).
