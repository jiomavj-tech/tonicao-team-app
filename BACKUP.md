# Backup diário automático

Um robô do GitHub acorda todo dia às **3h da manhã**, lê o Firebase e guarda uma cópia de tudo num repositório **privado**.

Ninguém precisa abrir o app. Roda com todo mundo dormindo.

## Por que num repositório privado

O arquivo tem nome, telefone e data de nascimento de aluno. **Ele nunca pode ficar no repositório do app, que é público.** Por isso o destino é outro repositório, fechado, só seu.

## O que o backup guarda

Tudo que está no Firebase da academia: fichas de alunos, presenças, graduações, pontos, mensalidades, turmas, convites, diários de aula e as configurações da academia.

Senhas **não** entram — elas ficam guardadas embaralhadas no Firebase e ninguém consegue lê-las, nem esse robô.

## Como ficam os arquivos

No repositório de backup:

- `backup-atual.json` — a cópia de hoje
- `backup-anterior.json` — a de ontem

Todo dia o atual vira anterior e entra um novo, como um rodízio.

Além disso, o GitHub guarda o **histórico completo** por conta própria. Se precisar da cópia de três semanas atrás, ela está lá, na aba de commits.

## Como restaurar

1. Abre o repositório de backup no celular
2. Baixa o `backup-atual.json` (ou a versão do dia que quiser, pelo histórico)
3. No app: **Mais → Backup → Importar**
4. Escolhe **juntar** (mantém o que existe) ou **substituir** (apaga e põe o arquivo no lugar)

⚠️ **Substituir apaga os dados do aparelho antes de importar.** Use só com um backup que você sabe que está bom.

## Se der erro

O GitHub manda e-mail quando o robô falha. Os motivos possíveis:

| Erro no log | O que é |
|---|---|
| "Segredo FIREBASE_SERVICE_ACCOUNT não encontrado" | Falta o segredo no repositório do app |
| "Falha ao autenticar no Google" | A chave da conta de robô foi revogada ou trocada |
| "Backup vazio" | Não achou dados. **Nada é gravado**, para não apagar um backup bom por cima |
| "Firestore respondeu 403" | A conta de robô perdeu a permissão de leitura no Firebase |

O robô também pode ser disparado na mão, sem esperar as 3h: aba **Actions → Backup diário → Run workflow**.

## Custo

Zero. Repositório público tem minutos de robô ilimitados no GitHub, e o repositório privado de backup não roda nada, só guarda arquivo.

## O arquivo da automação

Está em `.github/workflows/backup-diario.yml`.

O horário fica na linha do `cron`. `0 6 * * *` quer dizer 6h no horário de Londres, que é **3h da manhã em Brasília**. Para mudar para meia-noite, por exemplo, seria `0 3 * * *`.
