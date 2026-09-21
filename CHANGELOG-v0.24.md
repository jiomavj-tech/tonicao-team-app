# v0.24 — Compartilhamento, apresentação e cadastro unificado

## Compartilhar aplicativo
- Botão de compartilhamento no topo para Administrador/Dono, Professor e Aluno.
- Item “Compartilhar aplicativo” na tela Mais.
- Usa o compartilhamento nativo do celular; quando indisponível, copia o link público.

## Modo Apresentação do Dono
- Nova opção “Apresentar aplicativo” visível apenas ao Administrador/Dono.
- Três visões: Dono, Professor e Aluno.
- Não altera dados acadêmicos reais.
- Inclui Aluno Demo e comunicação demonstrativa Professor → Aluno.
- Indicado para apresentação comercial e gravação de vídeos/tutoriais.

## Cadastro unificado
- O botão normal “+ Novo usuário” passa a criar, em uma única etapa:
  1. conta local no aparelho;
  2. conta remota no servidor.
- Usa o mesmo nome de usuário, senha, perfil e vínculo de aluno.
- Se o Administrador não estiver conectado ao servidor, o app orienta a conectar.
- Continua existindo a opção de criar somente no aparelho para uso offline.
- A antiga área de usuários remotos permanece como ferramenta avançada/reparo.

## Segurança
- O Modo Apresentação usa apenas dados demonstrativos separados.
- Não troca o perfil real do usuário.
- Não registra presença, graduação, pagamento ou pontos reais durante a demonstração.
- As permissões reais continuam sendo validadas pela arquitetura existente.

## Cache
- Service Worker atualizado para `tonicao-v0.24.0`.
