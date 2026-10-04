/* Static assets only. Never intercept credentials or Supabase responses. */
const WEEKLY_CACHE = 'weekly-shell-v1';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', event => event.waitUntil(self.clients.claim()));
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);
    if (event.request.method !== 'GET' || url.origin !== self.location.origin) return;
    const shell = url.pathname === '/' || url.pathname.endsWith('/index.html');
    if (!shell && !url.pathname.startsWith('/src/') && !url.pathname.startsWith('/public/')) return;
    event.respondWith(fetch(event.request).catch(async () => {
        const cache = await caches.open(WEEKLY_CACHE);
        const saved = await cache.match(shell ? '/index.html' : event.request);
        return saved || Response.error();
    }));
});
