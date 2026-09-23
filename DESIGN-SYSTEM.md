# Padrão visual — App Tonicão Team Sul da Ilha

Documento de referência para quem mexer na aparência do app.
Escrito na v0.41. **Nada aqui está aplicado ainda** — é a especificação do que vem pela frente.

Regra de ouro: **este documento descreve aparência, não comportamento.**
Nenhuma mudança visual pode alterar cadastro, check-in, Firebase, família ou graduação.

---

## 1. Cores

### Como está hoje (v0.41)

| Papel | Valor atual | Problema |
|---|---|---|
| Cor principal | `--accent:#2563eb` (azul) | Não é a cor da marca |
| Cor principal escura | `--accent-2:#0f3fa9` | Idem |
| Fundo | `--bg:#f4f5f7` | Ok |
| Card | `--card:#ffffff` | Ok |
| Texto | `--ink:#151515` | Ok |
| Texto fraco | `--muted:#70737a` | Ok |
| Linha | `--line:#e4e6ea` | Ok |
| Cabeçalho | `--dark:#111213` | Ok |
| Sucesso | `--green:#16a34a` | Ok |
| Atenção | `--amber:#d97706` | Ok |
| Perigo | `--red:#dc2626` | Ok |

### Como deve ficar

A marca Fernando Carvalho / Tonicão é **preto e vermelho**. O azul entrou como padrão de desenvolvimento e nunca foi trocado.

| Papel | Valor novo | Onde aparece |
|---|---|---|
| `--accent` | vermelho da marca | Botão principal, item ativo do rodapé, links |
| `--accent-2` | vermelho escuro | Botão pressionado, gradiente do hero |
| `--dark` | `#111213` (mantém) | Cabeçalho e hero |
| `--red` | `#dc2626` (mantém) | **Só perigo**: excluir, bloquear, mensalidade vencida |

⚠️ **Ponto de atenção:** vermelho de ação e vermelho de perigo ficam parecidos. Regra: perigo nunca é botão preenchido, é botão de contorno vermelho. Assim "Abrir aula" e "Excluir aluno" não se confundem.

Faixas (branca, azul, roxa, marrom, preta) mantêm as cores reais do Jiu-Jitsu. **Não são cores do sistema**, são dado.

### Onde mexer
Só no bloco `:root` de `src/styles.css`. Trocar a variável muda o app inteiro de uma vez.

---

## 2. Espaçamento e formas

### Como está hoje
Os cantos arredondados estão sem padrão: 8, 10, 12, 16, 18, 22 e 24px convivendo.

### Como deve ficar

| Uso | Valor |
|---|---|
| Botão, campo, pílula pequena | `12px` |
| Card, caixa de aviso | `16px` |
| Hero (bloco preto do topo) | `22px` |
| Pílula de status, avatar | `999px` / `50%` |

Espaçamento: usar só **4, 8, 12, 16, 24 e 32px**. Nada de 6, 11, 14, 20.

Sombra: **uma só**, a que já existe (`--shadow`). Card não leva sombra forte; hero leva.

---

## 3. Tipografia

Fonte do sistema, como já é hoje (não carregar fonte de fora: o app precisa abrir sem internet).

| Papel | Tamanho | Peso |
|---|---|---|
| Título de tela | 20px | 700 |
| Título de card | 16px | 700 |
| Texto | 15px | 400 |
| Texto fraco (`.small muted`) | 13px | 400 |
| Rodapé de navegação | 11px | 600 |

---

## 4. Ícones

### Como está hoje
23 emojis diferentes só no arquivo principal: 🎂 💳 📥 🥋 📊 😴 🎯 📝 🔐 📋 ➕ e outros.

### Como deve ficar
Trocar por SVG embutido no próprio arquivo (nada carregado de fora), **em duas etapas**:

1. **Primeiro:** barra de navegação (5 ícones) e botões principais. É onde o olho bate.
2. **Depois, sem pressa:** o resto.

Emoji continua válido em **conteúdo**, não em interface: mensagem de WhatsApp, texto de aviso, comemoração de graduação.

---

## 5. Cabeçalho

Hoje: `Professor • offline-first • v0.41`

Depois do piloto, vira:
```
Tonicão Team • Sul da Ilha
Professor
```
A versão passa para **Mais → Sobre**.

⚠️ **Durante o piloto a versão fica onde está.** É como se confere se o celular pegou a atualização. Só tirar quando a Rose e os alunos estiverem estáveis.

---

## 6. A regra que evita o app inchar de novo

**Função nova não ganha card na Home automaticamente.**

Foi assim que a Home do Professor chegou a 9 blocos empilhados: painel, cronômetro, prontos para avaliar, alunos sumidos, diário, indicadores, precisa de atenção, aniversários, ranking. Cada versão pendurou mais um no fim.

Antes de criar qualquer tela nova, responder:

| Pergunta | Vai para |
|---|---|
| É ação de todo dia? | Home |
| É pendência que precisa de resposta? | Seção "Precisa da sua atenção" |
| É consulta de vez em quando? | Mais |
| É configuração? | Administração |
| É detalhe de um aluno? | Ficha do aluno |

---

## 7. Estrutura alvo da Home do Professor

```
┌─────────────────────────────┐
│ LOGO  Tonicão Team          │
│ Professor                   │
├─────────────────────────────┤
│ Bom dia, Rose               │
│ Terça, 23 de setembro       │
│ [ Abrir aula das 07:00 ]    │
├─────────────────────────────┤
│ AÇÕES RÁPIDAS               │
│ Alunos · QR · Graduação     │
│ Convidar · Cronômetro       │
├─────────────────────────────┤
│ HOJE                        │
│ 5 alunos · 1 check-in       │
├─────────────────────────────┤
│ PRECISA DA SUA ATENÇÃO      │
│ Cadastro aguardando     1 › │
│ Prontos para avaliar    0 › │
│ Sem treinar há 14 dias  0 › │
├─────────────────────────────┤
│ [ ver mais ]  ← o resto     │
└─────────────────────────────┘
```

**Aviso de custo, para não haver surpresa:** isso não é troca de cor. Os blocos de hoje estão espalhados por 4 arquivos (`app.js`, `extras-v030.js`, `features-v031.js`, `features-v034.js`), cada um pendurado no fim do anterior. Reorganizar exige desmontar e remontar essa cadeia. É a parte mais cara de todo o redesign e a que mais pode quebrar coisa que hoje funciona. **Deixar por último.**

---

## 8. Funciona com 1 aluno e com 150

O piloto tem 5 alunos. O app não pode parecer vazio agora nem travar depois.

| Situação | O que mostrar |
|---|---|
| Nenhum aluno | Convite grande: "Comece convidando seu primeiro aluno" |
| 1 a 9 | Lista simples, sem busca |
| 10 a 49 | Busca + contador |
| 50+ | Busca + filtro por faixa/turma + lista paginada |

A aba Alunos é a que mais sofre: hoje empilha cadastro rápido, auto-cadastro, aguardando confirmação, convites, alunos ativos e contas de acesso na mesma página. **Separar em abas: Alunos · Solicitações · Convites · Acessos.**

---

## 9. Ordem de execução

| # | Etapa | Risco | Quando |
|---|---|---|---|
| 0 | Este documento | nenhum | feito |
| 1 | Cores e formas (`:root` + raios) | baixo | depois do piloto estabilizar |
| 2 | Ícones da navegação | baixo | junto com a 1 |
| 3 | Abas na tela de Alunos | médio | quando passar de ~20 alunos |
| 4 | Home do Professor | alto | por último, com teste antes |

**Nada disso começa enquanto a Rose estiver aprendendo o app.** Mudar de lugar o que ela acabou de aprender atrapalha o feedback do piloto, que hoje vale mais que aparência.

---

## 10. Quem publica

Só uma pessoa dá commit no repositório `jiomavj-tech/tonicao-team-app`. Hoje é o Claude.
Análises e sugestões de outras fontes entram como **texto para avaliar**, não como código aplicado direto.
