# BombonaCalc — GitHub Pages

Versão estática para GitHub Pages. Não utiliza Node.js, API ou PostgreSQL. Os dados ficam no navegador de cada dispositivo.

## Publicação

1. Envie **o conteúdo desta pasta** para a raiz da branch `main`.
2. Confirme que `index.html`, `style.css`, `sw.js`, `js/` e `assets/` aparecem na página inicial do repositório.
3. Em **Settings → Pages**, escolha **Deploy from a branch**.
4. Selecione **main** e **/(root)**.
5. Salve e aguarde o deploy.

## Atualização de versão antiga

Se o navegador ainda mostrar a versão antiga, limpe os dados do site ou remova o Service Worker antigo em DevTools → Application → Service Workers → Unregister.
