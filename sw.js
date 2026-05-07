/* ═══════════════════════════════════════════════
   FLOPPY WINGS — SERVICE WORKER
   Version du cache : incrémente ce numéro à chaque
   mise à jour pour forcer le rechargement chez tous.
   ═══════════════════════════════════════════════ */
const CACHE_NAME = 'floppy-wings-v11';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://www.paypalobjects.com/api/checkout.js',
];

/* ── INSTALLATION : mise en cache des ressources ── */
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {
        // On ignore les erreurs sur les ressources externes
        return cache.add('./');
      });
    }).then(() => self.skipWaiting())
  );
});

/* ── ACTIVATION : suppression des anciens caches ── */
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames
          .filter(name => name !== CACHE_NAME)
          .map(name => caches.delete(name))
      );
    }).then(() => self.clients.claim())
  );
});

/* ── FETCH : réseau en priorité, cache en fallback ── */
self.addEventListener('fetch', event => {
  // On laisse passer les requêtes PayPal et Supabase sans interception
  const url = event.request.url;
  if (
    url.includes('paypal.com') ||
    url.includes('supabase.co') ||
    url.includes('googleapis.com')
  ) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la réponse réseau est ok, on met à jour le cache
        if (response && response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Pas de réseau → on sert depuis le cache
        return caches.match(event.request);
      })
  );
});
