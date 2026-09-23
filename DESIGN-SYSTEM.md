# Padrão visual — App Tonicão Team Sul da Ilha

Versão 2 do documento. Escrito na v0.41 do app.
**Nada aqui está aplicado ainda** — é a especificação do que vem pela frente.

## Regras de trabalho

1. **Este documento descreve aparência, não comportamento.** Nenhuma mudança visual pode alterar cadastro, check-in, Firebase, família ou graduação.
2. **Função nova não ganha card na Home automaticamente.** Ver seção 6. É a regra mais importante daqui.
3. **Quem precisar de uma cor, botão, card, ícone, espaçamento ou navegação que não esteja neste documento, atualiza o documento primeiro e implementa depois.** Padrão inventado no meio do código é o que produz duas caras diferentes no mesmo app.
4. **Só uma IA escreve código por vez.** A outra revisa, aponta risco e propõe. Não existem duas implementações concorrentes da mesma tela.
5. **Nunca editar `index.html` à mão.** Ele é **gerado** pelo `node build.js`, que injeta o `src/styles.css` e os módulos de `src/modules/` dentro dele. Quem editar o `index.html` direto perde o trabalho no build seguinte. Fonte oficial: `src/`.

---

## 1. Cores

### De onde vem o vermelho

**CT Fernando Carvalho** usa preto e branco. **Tonicão Team**, a matriz, é quem tem o vermelho — o círculo do samurai, EST. 1987. O app é da Tonicão Team Sul da Ilha, então o vermelho é a cor de ação.

O vermelho exato da logo foi medido no arquivo digital: **`#F3030E`** (24.677 pixels do círculo, todos na mesma cor).

### Por que a cor de ação não é o vermelho da logo

Contraste de texto branco sobre a cor, mínimo aceitável 4,5:

| Cor | Branco em cima | Serve para botão? |
|---|---|---|
| `#F3030E` — logo | 4,35 | ❌ abaixo do mínimo |
| `#D91E22` — ação | 5,05 | ✅ |
| `#2563eb` — azul atual | 5,17 | ✅ (mas não é a marca) |

Um tom mais fechado resolve. Lado a lado ninguém percebe a diferença, e o texto para de cansar a vista no sol do tatame ou com o brilho baixo.

### Tabela oficial

| Variável | Valor | Uso |
|---|---|---|
| `--brand` | `#F3030E` | Logo, faixa do cabeçalho, detalhe de identidade. **Nunca como fundo de texto.** |
| `--accent` | `#D91E22` | Botão principal, item ativo do rodapé, links |
| `--accent-2` | `#B00710` | Botão pressionado, gradiente do hero |
| `--danger` | `#DC2626` | Excluir, bloquear, vencido. **Só em contorno, nunca preenchido.** |
| `--info` | `#2563eb` | Aviso informativo e link neutro. Deixa de ser a cor principal. |
| `--dark` | `#111213` | Cabeçalho e hero |
| `--bg` | `#f4f5f7` | Fundo |
| `--card` | `#ffffff` | Card |
| `--ink` | `#151515` | Texto |
| `--muted` | `#70737a` | Texto fraco |
| `--line` | `#e4e6ea` | Borda |
| `--green` | `#16a34a` | Sucesso, sincronizado |
| `--amber` | `#d97706` | Atenção, pendente |

**Ação e perigo não podem se confundir.** Por isso perigo nunca é botão preenchido: "Abrir aula" é vermelho cheio, "Excluir aluno" é contorno vermelho.

Faixas de Jiu-Jitsu (branca, azul, roxa, marrom, preta) mantêm as cores reais. **Não são cores do sistema, são dado.**

### Onde mexer
Só no bloco `:root` de `src/styles.css`, depois `node build.js`. Trocar a variável muda o app inteiro de uma vez.

---

## 2. Espaçamento e formas

Hoje convivem 8 raios diferentes: 8, 10, 12, 16, 18, 22 e 24px. Passa a ser:

| Uso | Raio |
|---|---|
| Botão, campo, pílula | `12px` |
| Card, caixa de aviso | `16px` |
| Hero (bloco preto do topo) | `22px` |
| Pílula de status, avatar | `999px` / `50%` |

Espaçamento só em **4, 8, 12, 16, 24 e 32px**. Nada de 6, 11, 14, 20.
Sombra: **uma só** (`--shadow`). Card sem sombra pesada; hero com.

---

## 3. Tipografia

Fonte do sistema. **Não carregar fonte de fora** — o app precisa abrir sem internet.

| Papel | Tamanho | Peso |
|---|---|---|
| Título de tela | 20px | 700 |
| Título de card | 16px | 700 |
| Texto | 15px | 400 |
| Texto fraco | 13px | 400 |
| Rodapé de navegação | 11px | 600 |

Mínimo absoluto: **13px**. Nada essencial abaixo disso.

---

## 4. Componentes oficiais

| Componente | Como é |
|---|---|
| **Botão principal** | Preenchido em `--accent`, texto branco. **Um por bloco.** |
| **Botão secundário** | Fundo cinza claro, texto escuro |
| **Ação destrutiva** | Fundo transparente, contorno e texto em `--danger` |
| **Card** | Branco, borda `--line`, raio 16px, sombra leve |
| **Card clicável** | Igual, com `›` à direita |
| **Status** | Pílula pequena: verde, âmbar, vermelho ou neutro |
| **Aviso** | Caixa com barra colorida à esquerda |

Se um botão novo não couber em nenhum desses, atualiza esta tabela antes de criar.

---

## 5. Ícones

Hoje há 23 emojis diferentes só no arquivo principal: 🎂 💳 📥 🥋 📊 😴 🎯 📝 🔐 📋 e outros. Dá cara de protótipo.

Padrão novo, em SVG embutido no próprio arquivo (nada carregado de fora):

- **22 a 24px** na navegação
- mesma espessura de traço em todos
- **sem misturar** ícone cheio, contorno e emoji
- vermelho só no ativo; cinza nos inativos

**Em duas etapas:**
1. Barra de navegação (5 ícones) e botões principais. É onde o olho bate.
2. O resto, sem pressa.

Emoji continua válido em **conteúdo**: mensagem de WhatsApp, texto de aviso, comemoração de graduação. Sai só da interface.

---

## 6. A regra que evita o app inchar de novo

**Função nova não ganha card na Home automaticamente.**

Foi assim que a Home do Professor chegou a 9 blocos empilhados: painel, cronômetro, prontos para avaliar, alunos sumidos, diário, indicadores, precisa de atenção, aniversários, ranking. Cada versão pendurou mais um no fim.

| Pergunta | Vai para |
|---|---|
| É ação de todo dia? | Home |
| É pendência que precisa de resposta? | "Precisa da sua atenção" |
| É consulta de vez em quando? | Mais |
| É configuração? | Administração |
| É detalhe de um aluno? | Ficha do aluno |

**Regra de densidade:** uma tela não deve exigir que a pessoa entenda mais de **3 níveis de prioridade** ao mesmo tempo. Na Home do Professor: (1) aula agora, (2) precisa de atenção, (3) o resto.

---

## 7. Estados de sincronização

O app é offline-first, então isso é parte do visual, não detalhe técnico. Quatro estados, e só isso aparece no uso normal:

| Estado | Cor | O que mostra |
|---|---|---|
| Sincronizado | verde | ponto discreto, sem texto |
| Alterações pendentes | âmbar | "3 alterações para enviar" |
| Sem internet | cinza | "Pode continuar usando o app" |
| Erro | vermelho | mensagem + botão "Tentar de novo" |

**Servidor, token, Firebase e fila não aparecem para Professor nem Aluno.** Ficam na tela de Sincronização, em Mais, para diagnóstico.

---

## 8. Prioridade por perfil

| Perfil | A pergunta que a tela responde |
|---|---|
| **Professor** | O que eu preciso fazer agora? |
| **Aluno** | Quando é meu próximo treino e como está minha evolução? |
| **Responsável** | Qual filho eu estou vendo? |
| **Dono** | Como está a academia? |

**Responsável:** o seletor fica sempre visível no topo — `Vendo: Pedro ▾`. Trocar de filho é parte natural do app, não função escondida.

**Dono:** precisa de Home própria. Hoje ele é "Professor com mais botões", e não é a mesma pergunta.

---

## 9. Regras de celular

O alvo real é Android comum, não iPhone grande de mockup.

- Desenhar primeiro para **360px de largura**
- Área de toque mínima **44px**. ⚠️ Hoje o botão comum tem `padding:10px 13px`, o que dá cerca de **40px**. Está abaixo e precisa subir.
- Nada essencial depende de passar o mouse por cima
- Respeitar a área segura do Android e do iPhone (entalhe e barra de baixo)
- Ação principal cabendo em uma linha

---

## 10. Funciona com 1 aluno e com 150

| Situação | O que mostrar |
|---|---|
| Nenhum | "Comece convidando seu primeiro aluno" |
| 1 a 9 | Lista simples, sem busca. Texto orientando, não vários zeros |
| 10 a 49 | Busca + contador |
| 50+ | Busca + filtro por faixa e turma + lista paginada |

Com 5 alunos, tela cheia de "0" parece app vazio. Melhor uma frase que oriente o próximo passo.

A aba **Alunos** é a que mais sofre: hoje empilha cadastro rápido, auto-cadastro, aguardando confirmação, convites, alunos ativos e contas de acesso na mesma página. Vira abas: **Alunos · Solicitações · Convites · Acessos** — mas só quando fizer falta, por volta de 20 alunos. Criar abas vazias agora é estrutura sem uso.

---

## 11. Cabeçalho

Hoje: `Professor • offline-first • v0.41`

Depois do piloto:
```
Tonicão Team • Sul da Ilha
Professor
```
Versão passa para **Mais → Sobre**.

⚠️ **Durante o piloto a versão fica onde está.** É como se confere se o celular pegou a atualização — usada várias vezes no primeiro dia de teste.

---

## 12. Estrutura alvo da Home do Professor

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
│ [ ver mais ]                │
└─────────────────────────────┘
```

**Aviso de custo, para não haver surpresa:** isso não é troca de cor. Os blocos estão espalhados por 4 arquivos (`app.js`, `extras-v030.js`, `features-v031.js`, `features-v034.js`), cada um pendurado no fim do anterior por `window.renderProfessorHome` sendo substituído por uma função que chama a anterior. Reorganizar exige desmontar e remontar essa cadeia. É a parte mais cara do redesign e a que mais pode quebrar o que funciona hoje. **Por último.**

---

## 13. Ordem de execução

| # | Etapa | Risco | Quando |
|---|---|---|---|
| 0 | Este documento | nenhum | feito |
| 1 | Cores, raios, espaçamento, tipografia (`:root`) | baixo | piloto estabilizado |
| 2 | Ícones + barra de baixo + cabeçalho | baixo | junto com a 1 |
| 3 | Botões, cards, avisos, formulários + toque de 44px | baixo | junto com a 1 |
| 4 | Aplicar numa tela-piloto, **sem mexer em função** | médio | depois da 3 |
| 5 | Testar com Professor e Aluno | — | depois da 4 |
| 6 | Demais telas | médio | depois da 5 |
| 7 | Home do Professor reorganizada | **alto** | por último |

**A tela-piloto não pode ser Check-in nem Alunos** — são as que a Rose usa todo dia no piloto. Usar **Graduação**, que tem pouco uso agora e mostra bem o padrão novo.

**Nada disso começa enquanto a Rose estiver aprendendo o app.** Mudar de lugar o que ela acabou de aprender atrapalha o feedback do piloto, que hoje vale mais que aparência.

---

## 14. Quem publica

Repositório `jiomavj-tech/tonicao-team-app`. Só o Claude dá commit.
Análises de outras fontes entram como **texto para avaliar**, nunca como código aplicado direto.
