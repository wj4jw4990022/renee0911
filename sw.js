// 孤勇者 App 模式（v17.28）
// 策略：有網路一律拿最新版（不會卡在舊版，適合還在改遊戲的時候）；沒網路才用上次成功載入時存下來的那份。
const CACHE = 'guyongzhe-app';
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;   // 字型等外部資源照瀏覽器原本的方式
  e.respondWith((async () => {
    try {
      const res = await fetch(req, { cache: 'no-store' });
      if (res.ok) { const c = await caches.open(CACHE); c.put(req, res.clone()); }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      if (req.mode === 'navigate') { const home = await caches.match('./', { ignoreSearch: true }) || await caches.match('index.html', { ignoreSearch: true }); if (home) return home; }
      throw err;
    }
  })());
});
