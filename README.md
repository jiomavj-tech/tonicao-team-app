# Tonicão Team Sul da Ilha — v0.22

Versão de **hardening para homologação**.

O objetivo desta versão é estabilizar publicação, segurança, identidade, convites e datas antes de usar dados reais.

## Configuração principal
Edite `config.js` depois que o backend estiver publicado:

```js
apiBase: "https://SEU-SERVIDOR.onrender.com"
```

Não coloque `/api/sync` no final.

## Modos
- `mode: "production"`: não cria alunos/eventos fictícios.
- `mode: "demo"`: permite dados de demonstração.

## Backend
Variáveis recomendadas:
- `TONICAO_BOOTSTRAP_SECRET` (obrigatória para criar o primeiro Admin remoto)
- `TONICAO_ALLOWED_ORIGINS=https://jiomavj-tech.github.io`
- `TONICAO_TIMEZONE=America/Sao_Paulo`
- `TONICAO_INVITE_TTL_HOURS=72`
- `TONICAO_DB=/var/data/tonicao_sync.sqlite3` em produção persistente

Veja `HARDENING-v0.22.md`.
