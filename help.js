/* =====================================================================
   Tonicão Team — Ajuda "?" (v0.23)
   Botão flutuante que explica a tela atual, passo a passo, com o porquê
   de cada ação. Também abre o manual completo do perfil logado.
   Não altera dados: só lê a tela atual e o perfil do usuário.
   ===================================================================== */
(function () {
  "use strict";

  /* Cada passo: [o que fazer, por que fazer] */
  const LOGIN = {
    title: "Entrar no aplicativo",
    steps: [
      ["Primeiro acesso: crie a conta de Administrador/Dono com nome, usuário e senha.",
       "O Dono é quem cria as contas dos professores e controla o acesso da academia. Só existe um."],
      ["A senha precisa ter 9 caracteres ou mais, com letra MAIÚSCULA, letra minúscula, número e símbolo (. ! @ #), em qualquer ordem.",
       "Senha longa e variada é muito mais difícil de adivinhar. Evite nome e data de nascimento."],
      ["Já tem conta? Digite usuário e senha e toque em Entrar.",
       "Cada pessoa usa a própria conta — assim o app sabe o que ela pode ver e fazer."],
      ["Aluno novo sem conta: toque em \"Quero me cadastrar como aluno\".",
       "O cadastro vai para o professor aprovar. Ninguém entra na academia sem aprovação."],
      ["Botão do Google: aparece quando o servidor estiver publicado e configurado.",
       "Com Google, o aluno não precisa decorar senha — e a conta dele já é verificada pelo Google."]
    ]
  };

  const PROF = {
    home: {
      title: "Início — Painel do professor",
      steps: [
        ["Toque em \"Iniciar aula\" no começo de cada treino.",
         "Sem aula aberta, os alunos não conseguem fazer check-in."],
        ["Olhe o quadro \"Precisa de atenção\".",
         "Mostra quem está com pagamento pendente, sumido dos treinos ou perto de graduar — dá pra agir antes do aluno desistir."],
        ["Confira \"Próximas avaliações\" e toque em \"Abrir graduações\" para ver os detalhes.",
         "Você não esquece nenhuma prova marcada."],
        ["\"Ranking completo\" mostra os destaques do ano.",
         "Reconhecer quem treina com frequência motiva a turma toda."]
      ]
    },
    checkin: {
      title: "Check-in — Abrir aula e registrar presença",
      steps: [
        ["Toque em \"Iniciar aula\", dê um nome (ex.: Gi Fundamentos), escolha a validade e toque em \"Abrir aula e gerar QR\".",
         "O código da aula é a prova de que o aluno estava no treino. Sem ele, qualquer um marcaria presença de casa."],
        ["Mostre o QR na tela ou dite o código de 6 dígitos. Use \"Copiar código\" para mandar no grupo, se preferir.",
         "Cada aluno registra a própria presença pelo celular — você não perde tempo fazendo chamada."],
        ["Aluno sem celular? Use \"Presença manual\" e marque \"Presente\".",
         "Ninguém fica sem presença por falta de aparelho."],
        ["No fim do treino, toque em \"Encerrar\".",
         "Fecha a aula. Quem ficou sem internet ainda consegue confirmar até 6 horas depois — e ninguém marca presença em aula que já passou."]
      ]
    },
    students: {
      title: "Alunos — Cadastro e fichas",
      steps: [
        ["Toque em \"+ Cadastro rápido\", coloque nome e WhatsApp e toque em \"Cadastrar e enviar link\".",
         "O aluno recebe um link e preenche os próprios dados. Você digita o mínimo."],
        ["Em \"Aguardando confirmação\", toque em \"Confirmar cadastro\" ou \"Recusar\".",
         "Só entra na academia quem você aprovou."],
        ["Toque no aluno para abrir a ficha: Foto, Graduação, Trilha/Faixa e Convite.",
         "A ficha é o histórico oficial do aluno: faixa, graus, treinos e pagamento."],
        ["Em \"Situação\", use \"Liberar\" ou \"Pendente\".",
         "Aluno com mensalidade Pendente não consegue fazer check-in até ser liberado."],
        ["Aniversariante? Use \"Mensagem de aniversário\" e \"Copiar mensagem\".",
         "Um detalhe que faz o aluno se sentir parte da equipe."]
      ]
    },
    graduation: {
      title: "Graduação — Do preparo à faixa nova",
      steps: [
        ["Veja \"Elegíveis para avaliação\": são os alunos que bateram a meta de treinos da faixa.",
         "O app conta os treinos por você — a decisão continua sendo sua."],
        ["Toque em \"Liberar preparação\".",
         "O aluno passa a ver o conteúdo prático, teórico e o PDF do próximo exame para estudar."],
        ["Toque em \"📅 Agendar\" e defina data, horário, local e um recado.",
         "O aluno recebe o aviso e se prepara com antecedência."],
        ["No dia, toque em \"📝 Avaliar\", marque o checklist e depois \"Confirmar graduação\".",
         "Fica registrado quem aprovou, quando e o que foi avaliado."],
        ["Não foi dessa vez? Use \"Reavaliar depois\": escolha por número de aulas ou por data e escreva o que precisa melhorar.",
         "O app te lembra na hora certa e o aluno sabe exatamente no que focar."],
        ["Em \"Planos de graduação\" você edita os itens de cada exame e anexa o PDF.",
         "Todos os alunos da mesma faixa são avaliados pelo mesmo critério."]
      ]
    },
    more: {
      title: "Mais — Todas as ferramentas",
      steps: [
        ["Ranking e Relatórios: pontuação do ano, presença do mês e exportação em planilha (CSV).",
         "Números ajudam a ver quem está evoluindo e quem está sumindo."],
        ["Sistema de Pontuação: lance campeonatos, resultados e ajustes manuais.",
         "A pontuação fica justa e transparente — o aluno vê o próprio extrato."],
        ["Regras de sequência: crie bônus para quem treina vários dias seguidos.",
         "Recompensa a constância, que é o que mais faz o aluno evoluir."],
        ["Cronômetro: rounds e descanso com presets.",
         "Não precisa de outro app durante o treino."],
        ["Backup e sincronização: exporte os dados de tempos em tempos.",
         "Se o celular quebrar ou for roubado, você não perde nada."]
      ]
    },
    "more:timer": {
      title: "Cronômetro",
      steps: [
        ["Escolha um preset ou ajuste tempo de luta, descanso e número de rounds.",
         "Treino com tempo marcado é mais parecido com competição."],
        ["Deixe o celular à vista de todos durante os rounds.",
         "Todo mundo troca de parceiro no mesmo momento."]
      ]
    },
    "more:events": {
      title: "Sistema de Pontuação e campeonatos",
      steps: [
        ["Toque em \"+ Campeonato\" e cadastre o evento.",
         "Os pontos de competição entram no ranking com o peso certo."],
        ["Depois do evento, use \"Lançar resultados\".",
         "Cada colocação gera pontos automaticamente."],
        ["\"+ Ajuste manual\" corrige ou premia algo fora da regra — sempre com justificativa.",
         "Fica registrado no extrato do aluno, sem mistério."]
      ]
    },
    "more:sequences": {
      title: "Regras de sequência (bônus)",
      steps: [
        ["Toque em \"+ Nova regra\" e defina quantos treinos seguidos dão bônus.",
         "Incentiva o aluno a não faltar."],
        ["O bônus é lançado uma vez por regra atingida.",
         "Ninguém ganha o mesmo prêmio duas vezes."]
      ]
    },
    "more:backup": {
      title: "Backup",
      steps: [
        ["Exporte um backup pelo menos uma vez por semana e guarde no Google Drive ou e-mail.",
         "Os dados moram no aparelho. Sem backup, perder o celular é perder tudo."],
        ["O backup não leva senhas nem tokens do servidor.",
         "Mesmo que o arquivo vaze, ninguém entra na sua conta com ele."]
      ]
    },
    "more:ranking": {
      title: "Ranking",
      steps: [
        ["\"Pontuação geral\" mostra o acumulado do ano; \"Presença mensal\", quem mais treinou no mês.",
         "Dois jeitos de reconhecer: resultado e dedicação."]
      ]
    }
  };

  const ALUNO = {
    home: {
      title: "Início — Sua evolução",
      steps: [
        ["Aqui aparecem sua faixa, seus graus e quantos treinos faltam para a meta.",
         "Você acompanha a própria evolução sem precisar perguntar ao professor."],
        ["Apareceu \"Nenhum aluno vinculado\"? Peça ao professor para ligar sua conta à sua ficha.",
         "A conta de login e a ficha de aluno são coisas separadas — o professor faz essa ligação uma vez."]
      ]
    },
    checkin: {
      title: "Check-in — Marcar presença",
      steps: [
        ["Quando o professor abrir a aula, toque em \"📷 Ler QR\" e aponte para o QR da tela dele.",
         "É o jeito mais rápido: um toque e pronto."],
        ["Ou digite o código de 6 dígitos em \"Código da aula\" e toque em \"Confirmar\".",
         "Serve quando a câmera não ajuda."],
        ["Sem internet? Faça o check-in assim mesmo.",
         "Ele é enviado sozinho quando a conexão voltar, até 6 horas depois da aula."],
        ["Check-in recusado? Confira o código ou fale com o professor.",
         "Os motivos mais comuns são código errado ou mensalidade pendente."]
      ]
    },
    students: {
      title: "Minha ficha",
      steps: [
        ["Confira seus dados e mantenha o telefone atualizado.",
         "É por ele que você recebe avisos de aula, prova e pagamento."]
      ]
    },
    graduation: {
      title: "Minha graduação",
      steps: [
        ["\"Meu histórico\" mostra todas as suas faixas e graus, com data.",
         "É o seu currículo no Jiu-Jitsu."],
        ["Quando o professor liberar, aparece o \"Material da próxima graduação\": conteúdo prático, teórico e o PDF.",
         "Você sabe exatamente o que vai ser cobrado na prova."],
        ["Toque em \"📄 Abrir material PDF offline\" para estudar mesmo sem internet.",
         "Dá pra revisar no ônibus ou antes do treino."],
        ["Se tiver prova marcada, aparece em \"📅 Avaliação agendada\".",
         "Data, horário e local ficam sempre à mão."]
      ]
    },
    more: {
      title: "Mais",
      steps: [
        ["Ranking: veja sua posição e o extrato de pontos em \"Minha pontuação\".",
         "Você entende de onde veio cada ponto."],
        ["Regras da Academia e Etiqueta no Dojô.",
         "Respeito e segurança no tatame são parte do treino."],
        ["Biblioteca Técnica: vídeos recomendados para a sua faixa.",
         "Revisar a técnica em casa acelera o aprendizado."],
        ["Avisos: graduação, pagamento e mensagens da academia.",
         "Nada importante passa despercebido."]
      ]
    }
  };

  const ADMIN_NOTE =
    "Como Administrador/Dono você acompanha tudo, mas presença, pontuação e graduação são decisões do Professor. " +
    "Isso separa quem administra o sistema de quem dá aula e deixa a auditoria clara.";

  const ADMIN = {
    home: {
      title: "Início — Modo de manutenção",
      steps: [
        ["Você vê o painel completo da academia, em modo de leitura para a parte técnica.",
         ADMIN_NOTE],
        ["Seu trabalho principal fica em Mais: usuários, acesso da academia, identidade visual e auditoria.",
         "São as tarefas que só o Dono pode fazer."]
      ]
    },
    "more:users": {
      title: "Usuários e permissões",
      steps: [
        ["Toque em \"+ Novo usuário\": nome, usuário, senha e perfil.",
         "Cada pessoa com a própria conta — assim dá pra saber quem fez o quê."],
        ["Para criar um PROFESSOR, é só escolher o perfil Professor e salvar.",
         "O professor passa a abrir aulas, aprovar alunos e graduar."],
        ["Para criar um ALUNO, primeiro o professor cadastra a ficha em Alunos. Depois você escolhe essa ficha em \"Aluno vinculado\".",
         "A conta é só o login. A ficha guarda faixa, treinos e pagamento — por isso uma precisa apontar para a outra."],
        ["\"Trocar senha\" redefine a senha de alguém que esqueceu.",
         "Você resolve na hora, sem perder histórico."],
        ["\"Desativar\" bloqueia o login sem apagar nada.",
         "Se a pessoa voltar, é só reativar — o histórico continua lá."],
        ["\"Usuários do servidor\" e \"+ Remoto\" só funcionam com o servidor publicado.",
         "São as contas que entram de qualquer celular, com os dados sincronizados."]
      ]
    },
    "more:systemaccess": {
      title: "Acesso da academia",
      steps: [
        ["Suspenda ou reative o acesso de Professores e Alunos de uma vez.",
         "Útil em inadimplência ou manutenção — os dados não são apagados."]
      ]
    },
    "more:academy": {
      title: "Configurar academia",
      steps: [
        ["Troque logo, nome, cor principal e a história institucional.",
         "É o que todos os alunos veem ao abrir o app."]
      ]
    },
    "more:newacademy": {
      title: "Nova academia — cuidado",
      steps: [
        ["Cria uma estrutura em branco com outra identidade.",
         "Use só para montar uma unidade nova. Faça backup antes."]
      ]
    },
    "more:audit": {
      title: "Auditoria",
      steps: [
        ["Lista as ações importantes: quem fez, o quê e quando.",
         "Se algo mudar sem explicação, é aqui que você descobre."]
      ]
    },
    more: {
      title: "Mais — Ferramentas do Dono",
      steps: [
        ["Usuários e permissões: crie professores e alunos, troque senhas, desative contas.",
         "Controle total de quem entra no app."],
        ["Acesso da academia: suspenda ou libere a academia inteira.",
         "Sem apagar nenhum dado."],
        ["Configurar academia: logo, nome, cor e história.",
         "A cara da sua equipe no app."],
        ["Auditoria: histórico de ações.",
         "Transparência e segurança."],
        ["Backup: exporte os dados com frequência.",
         "Proteção contra perda do aparelho."]
      ]
    }
  };

  const ROLE_LABEL = { admin: "Administrador/Dono", professor: "Professor", aluno: "Aluno" };
  const ORDER = ["home", "checkin", "students", "graduation", "more"];

  function table(role) { return role === "aluno" ? ALUNO : role === "professor" ? PROF : ADMIN; }

  function pick(role, key) {
    if (!role) return LOGIN;
    const own = table(role)[key];
    if (own) return own;
    if (role === "admin") {
      const p = PROF[key] || PROF[key.split(":")[0]];
      if (p) return { title: p.title, steps: [["Modo de manutenção", ADMIN_NOTE]].concat(p.steps) };
    }
    return table(role)[key.split(":")[0]] || LOGIN;
  }

  function currentKey() {
    let page = "home", mode = "menu";
    try { page = currentMainPage; } catch (e) {}
    try { mode = currentMoreMode; } catch (e) {}
    return page === "more" && mode && mode !== "menu" ? "more:" + mode : page;
  }

  async function currentRole() {
    try {
      if (document.body.classList.contains("auth-locked")) return null;
      const u = await TonicaoAuth.currentUser();
      return u && u.role ? u.role : null;
    } catch (e) { return null; }
  }

  /* ------------------------------------------------------------ interface */
  const css = `
  .hlp-btn{position:fixed;right:14px;bottom:calc(86px + env(safe-area-inset-bottom,0px));z-index:60;
    width:48px;height:48px;border-radius:50%;border:0;background:#2563EB;color:#fff;font-size:24px;font-weight:800;
    box-shadow:0 6px 20px rgba(37,99,235,.45);cursor:pointer;display:flex;align-items:center;justify-content:center}
  .hlp-btn:active{transform:scale(.94)}
  body.auth-locked .hlp-btn{z-index:1050;bottom:calc(20px + env(safe-area-inset-bottom,0px))}
  body.hlp-hidden .hlp-btn{display:none}
  .hlp-back{position:fixed;inset:0;z-index:1200;background:rgba(0,0,0,.55);display:none;align-items:flex-end;justify-content:center;padding:14px}
  .hlp-back.show{display:flex}
  .hlp-sheet{background:#fff;color:#111;border-radius:22px 22px 12px 12px;width:min(640px,100%);max-height:86vh;overflow:auto;
    padding:18px 18px calc(18px + env(safe-area-inset-bottom,0px));font-size:15px;line-height:1.45}
  .hlp-role{display:inline-block;font-size:12px;font-weight:700;color:#2563EB;background:#EFF6FF;border-radius:999px;padding:3px 10px}
  .hlp-sheet h3{margin:10px 0 14px;font-size:20px}
  .hlp-step{display:flex;gap:12px;margin-bottom:14px}
  .hlp-n{flex:none;width:28px;height:28px;border-radius:50%;background:#2563EB;color:#fff;font-weight:800;font-size:14px;
    display:flex;align-items:center;justify-content:center}
  .hlp-what{font-weight:600}
  .hlp-why{color:#555;font-size:14px;margin-top:3px}
  .hlp-why b{color:#16A34A}
  .hlp-actions{display:flex;gap:10px;margin-top:8px;position:sticky;bottom:0;background:#fff;padding-top:8px}
  .hlp-actions button{flex:1;height:46px;border-radius:12px;border:0;font-weight:700;font-size:15px;cursor:pointer}
  .hlp-primary{background:#2563EB;color:#fff}
  .hlp-secondary{background:#F1F5F9;color:#111}
  .hlp-sec{border:1px solid #E5E7EB;border-radius:14px;margin-bottom:10px;overflow:hidden}
  .hlp-sec summary{padding:12px 14px;font-weight:700;cursor:pointer;list-style:none}
  .hlp-sec summary::after{content:"＋";float:right;color:#2563EB}
  .hlp-sec[open] summary::after{content:"－"}
  .hlp-sec .hlp-body{padding:4px 14px 6px}
  .hlp-tip{font-size:13px;color:#555;background:#F8FAFC;border-radius:12px;padding:10px 12px;margin-bottom:14px}`;

  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const btn = document.createElement("button");
  btn.className = "hlp-btn";
  btn.type = "button";
  btn.setAttribute("aria-label", "Ajuda desta tela");
  btn.textContent = "?";
  document.body.appendChild(btn);

  const back = document.createElement("div");
  back.className = "hlp-back";
  back.innerHTML = '<div class="hlp-sheet" role="dialog" aria-modal="true"></div>';
  document.body.appendChild(back);
  const sheet = back.firstChild;

  function esc(s) {
    return String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  }

  function stepsHtml(steps) {
    return steps.map((s, i) =>
      '<div class="hlp-step"><div class="hlp-n">' + (i + 1) + '</div><div>' +
      '<div class="hlp-what">' + esc(s[0]) + '</div>' +
      '<div class="hlp-why"><b>Por quê:</b> ' + esc(s[1]) + '</div></div></div>'
    ).join("");
  }

  function close() { back.classList.remove("show"); }
  back.addEventListener("click", e => { if (e.target === back) close(); });

  async function openPage() {
    const role = await currentRole();
    const h = pick(role, currentKey());
    sheet.innerHTML =
      '<span class="hlp-role">' + esc(role ? ROLE_LABEL[role] || role : "Antes de entrar") + '</span>' +
      '<h3>' + esc(h.title) + '</h3>' + stepsHtml(h.steps) +
      '<div class="hlp-actions">' +
      (role ? '<button class="hlp-secondary" data-h="manual">Manual completo</button>' : "") +
      '<button class="hlp-primary" data-h="close">Entendi</button></div>';
    back.classList.add("show");
    sheet.scrollTop = 0;
  }

  async function openManual() {
    const role = await currentRole();
    if (!role) return openPage();
    const t = table(role);
    const keys = ORDER.filter(k => t[k] || role === "admin")
      .concat(Object.keys(t).filter(k => k.includes(":")));
    const seen = new Set();
    const secs = keys.filter(k => !seen.has(k) && seen.add(k)).map(k => {
      const h = pick(role, k);
      return '<details class="hlp-sec"><summary>' + esc(h.title) + '</summary><div class="hlp-body">' +
        stepsHtml(h.steps) + '</div></details>';
    }).join("");
    sheet.innerHTML =
      '<span class="hlp-role">' + esc(ROLE_LABEL[role] || role) + '</span>' +
      '<h3>Manual completo</h3>' +
      '<div class="hlp-tip">Toque em cada tema para abrir. Em qualquer tela, o botão <b>?</b> mostra só a ajuda daquela tela.</div>' +
      secs +
      '<div class="hlp-actions"><button class="hlp-secondary" data-h="page">Voltar</button>' +
      '<button class="hlp-primary" data-h="close">Fechar</button></div>';
    sheet.scrollTop = 0;
  }

  sheet.addEventListener("click", e => {
    const a = e.target.closest("[data-h]");
    if (!a) return;
    if (a.dataset.h === "close") close();
    else if (a.dataset.h === "manual") openManual();
    else if (a.dataset.h === "page") openPage();
  });
  btn.addEventListener("click", openPage);

  /* Primeira vez em cada perfil, neste aparelho: abre o passo a passo sozinho. */
  let lastRole = undefined;
  setInterval(async () => {
    const role = await currentRole();
    if (role === lastRole) return;
    lastRole = role;
    if (!role) return;
    let seen = "1";
    try { seen = localStorage.getItem("tonicao-help-seen-" + role); } catch (e) {}
    if (!seen) {
      try { localStorage.setItem("tonicao-help-seen-" + role, "1"); } catch (e) {}
      setTimeout(openPage, 600);
    }
  }, 1500);

  window.TonicaoHelp = { open: openPage, manual: openManual };
})();
