/* Órbita IA: guarda o app no celular para abrir na hora, mesmo sem internet.
   A versão abaixo é atualizada pelo build.py a cada publicação. */
const VERSION = 'orbita-ia-20261113d';
const CORE = [
  './',
  'index.html',
  'assistente.js?v=20261113d',
  'manifest.webmanifest',
  'assets/logo192.png',
  'assets/app/icon-192.png',
  'assets/app/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k.startsWith('orbita-ia-') && k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Página: tenta a versão nova; sem internet, abre a cópia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(res => {
      const copy = res.clone(); caches.open(VERSION).then(c => c.put('./', copy));
      return res;
    }).catch(() => caches.match('./')));
    return;
  }

  // Arquivos do app e fontes: usa a cópia guardada e atualiza por trás.
  const proprio = url.origin === location.origin;
  const fontes = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (!proprio && !fontes) return;
  e.respondWith(caches.open(VERSION).then(async c => {
    const hit = await c.match(req);
    const net = fetch(req).then(res => { if (res.ok || res.type === 'opaque') c.put(req, res.clone()); return res; }).catch(() => hit);
    return hit || net;
  }));
});

