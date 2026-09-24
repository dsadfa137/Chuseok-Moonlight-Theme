'use strict';
const PREFIX='moon-postoffice:'+self.registration.scope+':',CACHE=PREFIX+"9e80144f94e5de0e";
const URLS=["./","./index.html","./admin.html","./styles.css","./ranked.css","./config.js","./data.js","./answer-validation.js","./server-api.js","./ranked-session.js","./app.js","./admin.js","./boot.js","./assets/lallastars-group.png","./assets/chuseok-village.png","./assets/rabbit-chick-sticker.png"].map(p=>new URL(p,self.registration.scope).href),ALLOWED=new Set(URLS);
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(URLS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const req=e.request,url=new URL(req.url);url.hash='';if(req.method!=='GET'||url.origin!==self.location.origin||!ALLOWED.has(url.href))return;
 e.respondWith((async()=>{const cache=await caches.open(CACHE);try{const res=await fetch(req);if(res.ok){await cache.put(url.href,res.clone());return res;}return (await cache.match(url.href))||res;}catch(_){return (await cache.match(url.href))||Response.error();}})());
});
