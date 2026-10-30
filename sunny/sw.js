const C="sunny-v27";const A=["./","index.html","manifest.webmanifest","icon-192.png","icon-512.png"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(C).then(c=>c.addAll(A)));self.skipWaiting();});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==C&&x!=="sunny-media").map(x=>caches.delete(x))))) ;self.clients.claim();});
self.addEventListener("fetch",e=>{const u=new URL(e.request.url);if(e.request.method!=="GET")return;
if(/upload\.wikimedia\.org|fonts\.(googleapis|gstatic)\.com/.test(u.host)){e.respondWith(caches.open("sunny-media").then(c=>c.match(e.request.url).then(hit=>hit||fetch(e.request).then(r=>{if(/fonts/.test(u.host))c.put(e.request.url,r.clone());return r;}))));return;}
if(u.origin!==location.origin)return;
e.respondWith(fetch(e.request.url,{cache:"no-store"}).then(r=>{const cp=r.clone();caches.open(C).then(c=>c.put(e.request,cp));return r;}).catch(()=>caches.match(e.request).then(r=>r||caches.match("index.html"))));});
