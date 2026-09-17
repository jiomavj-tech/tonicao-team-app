# Tonicão Team Sul da Ilha — v0.21 integrada

Esta versão consolida os arquivos v0.21 enviados para o projeto e integra as regras de permissão ao servidor Python de referência.

## O que entrou

- correções de check-in, QR e reavaliação de graduação;
- higienização de textos antes de gravar no IndexedDB;
- backup sem tokens do servidor e importação preservando a conexão do aparelho;
- pacote do aluno limitado aos próprios dados + conteúdo compartilhado da academia;
- fila de sincronização otimizada e tratamento de alterações recusadas;
- permissões por papel: Aluno → Professor → Administrador/Dono;
- check-in do Aluno validado no servidor;
- pontuação, sequência e lembretes calculados no servidor quando o check-in vem do Aluno;
- filtro do pull: o Aluno não recebe código da aula, observação privada do Professor, pré-cadastros ou credenciais;
- proteção contra o Aluno tentar alterar pontos, ficha, usuários ou dados de terceiros;
- usuários locais desativados continuam visíveis ao Administrador e não podem ser duplicados pelo mesmo nome de usuário;
- proteção para manter ao menos um Administrador/Dono ativo.

## Servidor

O servidor principal continua em Python (`server/server.py`). As regras do arquivo `permissions.js` foram portadas para `server/permissions.py` e são aplicadas de verdade no `/api/sync` e nas rotas HTTP.

O arquivo original `permissions.js` foi mantido no projeto como especificação executável e teste de paridade.

### Rodar servidor

```bash
cd server
python server.py
```

### Testes de permissão

```bash
node test.js
cd server
python test_permissions.py
```

Os dois conjuntos devem terminar com mensagem de sucesso.

## Segurança importante

O token legado `TONICAO_SYNC_TOKEN` não é aceito por padrão na sincronização segura. Só é habilitado explicitamente com:

```bash
TONICAO_ALLOW_LEGACY_SYNC=1
```

Para produção, mantenha o modo legado desligado e use login/sessão por usuário.

## Teste em celulares diferentes

O fluxo Professor → link → Aluno → confirmação precisa de:

1. app publicado em HTTPS;
2. `publicAppUrl` configurado;
3. servidor acessível pelos dois aparelhos;
4. Professor autenticado remotamente.

O arquivo `TESTE_UNICO.html` é ótimo para validar telas e lógica local, mas não substitui o servidor quando Professor e Aluno estão em celulares diferentes.
