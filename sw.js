const CACHE = 'daftarcha-v19';
const STATIC = [
  '/',
  '/404.html',
  '/manifest.json',
  'https://unpkg.com/react@18/umd/react.production.min.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/dist/umd/supabase.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js',
];

const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="theme-color" content="#0F172A"/>
<title>Daftarcha</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,'Inter',sans-serif;background:#0F172A;min-height:100vh;display:flex;align-items:center;justify-content:center;color:#fff;text-align:center;padding:24px}
.wrap{max-width:320px;width:100%}
.icon{font-size:72px;margin-bottom:20px;display:block;animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:.7}50%{opacity:1}}
h1{font-size:22px;font-weight:800;margin-bottom:10px;letter-spacing:-.02em}
.sub{font-size:14px;color:rgba(255,255,255,.45);line-height:1.7;margin-bottom:28px}
.btn{display:inline-flex;align-items:center;gap:8px;padding:13px 28px;background:linear-gradient(135deg,#2563EB,#7C3AED);color:#fff;border:none;border-radius:14px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;width:100%;justify-content:center;box-shadow:0 8px 24px rgba(37,99,235,.4)}
.logo{font-size:11px;font-weight:800;letter-spacing:.15em;color:rgba(255,255,255,.2);margin-top:28px}
.langs{display:flex;flex-direction:column;gap:4px;margin-bottom:16px;font-size:13px;color:rgba(255,255,255,.4)}
</style>
</head>
<body>
<div class="wrap">
  <span class="icon">📡</span>
  <h1>Daftarcha</h1>
  <div class="langs">
    <div>Нет соединения с интернетом</div>
    <div>Пайвандӣ бо интернет нест</div>
    <div>Internet aloqasi yo'q</div>
  </div>
  <p class="sub">Проверьте подключение и попробуйте снова.<br/>Санҷед ва дубора кӯшиш кунед.</p>
  <button class="btn" onclick="location.reload()">🔄 Попробовать снова</button>
  <div class="logo">DAFTARCHA</div>
</div>
</body>
</html>`;

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(STATIC)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.hostname.includes('supabase.co')) return;
  if (url.hostname.includes('googletagmanager.com') || url.hostname.includes('google-analytics.com')) return;

  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) return cached;
      return fetch(e.request).then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE).then(c => c.put(e.request, clone)).catch(() => {});
        }
        return resp;
      }).catch(() => {
        if (e.request.headers.get('accept')?.includes('text/html')) {
          return new Response(OFFLINE_HTML, {
            status: 200,
            headers: { 'Content-Type': 'text/html; charset=utf-8' }
          });
        }
        return caches.match('/404.html');
      });
    })
  );
});

self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || 'Daftarcha', {
      body: data.body || '',
      icon: '/icon-512.png',
      badge: '/icon-512.png',
      tag: data.tag || 'daftarcha',
      data: data,
      vibrate: [200, 100, 200],
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const client of list) {
        if (client.url.includes('daftarcha.tj') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('https://daftarcha.tj');
    })
  );
});
