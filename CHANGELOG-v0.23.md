# v0.23 — Ajuda "?" e senha forte

## Ajuda passo a passo
- Novo `help.js`: botão **?** azul em todas as telas.
- Mostra o que fazer em cada tela, passo a passo, com o **porquê** de cada ação.
- Conteúdo diferente para **Administrador/Dono**, **Professor** e **Aluno**.
- Botão **Manual completo** reúne a ajuda de todas as telas do perfil.
- Na primeira vez que cada perfil entra no aparelho, a ajuda abre sozinha.
- Também funciona na tela de login.

## Senha
- Novas senhas precisam de **9 caracteres ou mais**, com letra MAIÚSCULA,
  letra minúscula, número e símbolo — **em qualquer ordem**.
- Regra aplicada no aparelho (`auth.js`) e no servidor (`server/server.py`),
  com a mesma mensagem de erro.
- Contas antigas continuam entrando; a regra vale ao criar ou trocar senha.
- Rótulos "Senha/PIN" viraram "Senha".

## Login com Google
- Já existia (`google-auth.js`). Aparece na tela de login quando o servidor
  estiver publicado com `TONICAO_GOOGLE_CLIENT_ID` configurado.
- Cadastro novo pelo Google fica pendente até o Administrador aprovar.

## Outros
- Versão v0.23 no app e no cache do service worker (celulares recebem a atualização).
- Removida a pasta `server/__pycache__` do pacote.

## Validação
- `node --check` em todos os JS: PASS
- `node test.js`: PASS
- `server/test_permissions.py`: PASS
- Regra de senha testada com casos válidos e inválidos no servidor.
