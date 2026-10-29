/* Service worker : rend le site installable et disponible hors ligne.
   Toutes les pages sont mises en cache dès la première visite ; ensuite, le réseau est
   essayé d'abord (pour avoir la dernière version) et le cache sert de secours.
   VERSION et FICHIERS sont générés par outils/construire.js : ne pas les modifier à la main. */
// <généré>
const VERSION = '45804febd8';
const FICHIERS = [
  './',
  '404.html',
  'algo/cycle1.html',
  'algo/cycle2.html',
  'algo/index.html',
  'assets/algo.css',
  'assets/apple-touch-icon.png',
  'assets/base.css',
  'assets/common.js',
  'assets/favicon.svg',
  'assets/fonts/atkinson-hyperlegible-400-latin-ext.woff2',
  'assets/fonts/atkinson-hyperlegible-400-latin.woff2',
  'assets/fonts/atkinson-hyperlegible-700-latin-ext.woff2',
  'assets/fonts/atkinson-hyperlegible-700-latin.woff2',
  'assets/fonts/atkinson-hyperlegible-italic-400-latin-ext.woff2',
  'assets/fonts/atkinson-hyperlegible-italic-400-latin.woff2',
  'assets/fonts/bricolage-grotesque-latin-ext.woff2',
  'assets/fonts/bricolage-grotesque-latin.woff2',
  'assets/fonts/bricolage-grotesque-vietnamese.woff2',
  'assets/fonts/fonts.css',
  'assets/fonts/jetbrains-mono-cyrillic-ext.woff2',
  'assets/fonts/jetbrains-mono-cyrillic.woff2',
  'assets/fonts/jetbrains-mono-greek.woff2',
  'assets/fonts/jetbrains-mono-latin-ext.woff2',
  'assets/fonts/jetbrains-mono-latin.woff2',
  'assets/fonts/jetbrains-mono-vietnamese.woff2',
  'assets/hub.css',
  'assets/hub.js',
  'assets/icon-192.png',
  'assets/icon-512.png',
  'assets/icon-maskable-512.png',
  'assets/management.css',
  'assets/maths.css',
  'assets/recherche-index.js',
  'assets/recherche.js',
  'assets/sauvegarde.js',
  'assets/sql.css',
  'assets/systeme.css',
  'index.html',
  'management/chapitre1.html',
  'management/index.html',
  'management/introduction.html',
  'manifest.webmanifest',
  'maths/app.js',
  'maths/arithmetique.html',
  'maths/index.html',
  'maths/logique.html',
  'maths/recurrence.html',
  'maths/revision.html',
  'maths/second-degre.html',
  'sql/index.html',
  'sql/sql-requetes-simples.html',
  'systeme/index.html',
  'systeme/intro-systeme.html'
];
// </généré>
const CACHE = 'mes-cours-' + VERSION;
const DELAI = 4000; // au-delà, on sert la copie en cache si elle existe

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE)
    .then(c => Promise.all(FICHIERS.map(f => c.add(new Request(f, { cache: 'reload' })).catch(() => {}))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith('mes-cours-') && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(new URL(req.url).pathname.includes('/assets/fonts/') ? cacheDAbord(req) : reseauDAbord(req));
});

async function cacheDAbord(req) {
  const hit = await caches.match(req);
  return hit || fetchEtGarde(req);
}

async function reseauDAbord(req) {
  const reseau = fetchEtGarde(req);
  reseau.catch(() => {}); // évite une erreur non gérée si le cache a déjà répondu
  const delai = new Promise(r => setTimeout(r, DELAI, 'delai'));
  try {
    const res = await Promise.race([reseau, delai]);
    if (res !== 'delai') return res;
    return (await enCache(req)) || await reseau;
  } catch (err) {
    const hit = await enCache(req);
    if (hit) return hit;
    if (req.mode === 'navigate') { const p = await caches.match('404.html'); if (p) return p; }
    throw err;
  }
}

async function fetchEtGarde(req) {
  const res = await fetch(req);
  if (res.ok && res.type === 'basic') { const c = await caches.open(CACHE); c.put(req, res.clone()); }
  return res;
}

function enCache(req) { return caches.match(req, { ignoreSearch: true }); }
