# Como atualizar o app

O `index.html` **não é editado à mão**: ele é montado a partir da pasta `src/`.

- `src/index.template.html` — a página (cabeçalho, menus, abas)
- `src/styles.css` — as cores e o visual
- `src/modules/*.js` — cada parte do app (banco, login, sincronização, telas, apresentação…)
- `features-v032-family.js` — família e dependentes (carregado à parte)

## Ao salvar algo em `src/`
A automação **Montar o app** roda sozinha, monta o `index.html`, ajusta a versão do cache no `sw.js` e salva. Em cerca de 1 minuto o site já está no ar.

## Ao salvar o `regras-firestore.txt`
A automação **Publicar regras do Firestore** publica as regras no Firebase sozinha.

## Rodar à mão
GitHub → aba **Actions** → escolha a automação → **Run workflow**.

## No computador (opcional)
```
node build.js
```
