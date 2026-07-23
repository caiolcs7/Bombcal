const NOME_CACHE = 'bombonacalc-pages-v4.2.1';
const ARQUIVOS_APP = [
    './',
    './index.html',
    './style.css',
    './manifest.json',
    './assets/logo-bombonacalc.png',
    './assets/icons/icon-192.png',
    './assets/icons/icon-512.png',
    './assets/icons/icon-maskable-512.png',
    './js/aplicacao.js',
    './js/armazenamento.js',
    './js/autenticacao.js',
    './js/calculadora.js',
    './js/configuracao.js',
    './js/interface.js',
    './js/utilitarios.js'
];

self.addEventListener('install', (evento) => {
    evento.waitUntil(caches.open(NOME_CACHE).then((cache) => cache.addAll(ARQUIVOS_APP)));
});

self.addEventListener('activate', (evento) => {
    evento.waitUntil(
        caches.keys()
            .then((nomes) => Promise.all(
                nomes.filter((nome) => nome !== NOME_CACHE).map((nome) => caches.delete(nome))
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('message', (evento) => {
    if (evento.data?.tipo === 'ATIVAR_AGORA') self.skipWaiting();
});

self.addEventListener('fetch', (evento) => {
    if (evento.request.method !== 'GET') return;

    if (evento.request.mode === 'navigate') {
        evento.respondWith(
            fetch(evento.request)
                .then((resposta) => {
                    const copia = resposta.clone();
                    caches.open(NOME_CACHE).then((cache) => cache.put('./index.html', copia));
                    return resposta;
                })
                .catch(() => caches.match('./index.html'))
        );
        return;
    }

    evento.respondWith(
        caches.match(evento.request).then((cacheado) => {
            const atualizacao = fetch(evento.request)
                .then((resposta) => {
                    if (resposta.ok && new URL(evento.request.url).origin === self.location.origin) {
                        caches.open(NOME_CACHE).then((cache) => cache.put(evento.request, resposta.clone()));
                    }
                    return resposta;
                })
                .catch(() => cacheado);

            return cacheado ?? atualizacao;
        })
    );
});
