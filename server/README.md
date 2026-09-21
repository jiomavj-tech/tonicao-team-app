# Servidor Tonicão Team — v0.21

Servidor Python padrão do projeto, com SQLite, autenticação, convites, notificações e sincronização.

## Permissões integradas

`permissions.py` aplica no servidor as mesmas regras definidas em `permissions.js`:

- Professor: operação acadêmica;
- Administrador/Dono: manutenção institucional, usuários e bloqueio da academia;
- Aluno: check-in próprio e progresso próprio de estudo.

No check-in do Aluno, o servidor valida:

- ficha ativa;
- situação de pagamento;
- aula existente;
- horário da aula + tolerância offline de 6h;
- código da aula;
- presença duplicada.

Se aprovado, o servidor grava presença, pontuação, sequência e decrementa lembrete por aulas. O celular do aluno não decide a própria pontuação.

## Testes

Na raiz do projeto:

```bash
node test.js
```

Na pasta `server`:

```bash
python test_permissions.py
```

## Iniciar

Linux/macOS:

```bash
python server.py
```

Windows:

```bat
python server.py
```

Variáveis opcionais incluem `TONICAO_PORT`, `TONICAO_DB`, `TONICAO_BOOTSTRAP_SECRET`, Google e VAPID.

### Token legado

Por segurança, o token antigo de sincronização só funciona se `TONICAO_ALLOW_LEGACY_SYNC=1`. Para uso real, deixe desativado.
