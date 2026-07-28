const C='ys-v1',U=['.','index.html','manifest.json'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(U)));self.skipWaiting();});
self.addEventListener('activate',e=>{e.waitUntil(clients.claim());});
self.addEventListener('fetch',e=>{e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));});
