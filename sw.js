/* Roadie offline helper. Bump VERSION when you change this file. */
const VERSION='roadie-v2';
const CORE=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
const LIBS='roadie-libs';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==VERSION&&k!==LIBS).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const req=e.request;if(req.method!=='GET')return;
  const url=new URL(req.url);
  /* The map library never changes for a version: cache first */
  if(url.hostname==='cdn.jsdelivr.net'&&url.pathname.startsWith('/npm/maplibre-gl@')){
    e.respondWith(caches.open(LIBS).then(c=>c.match(req).then(hit=>hit||fetch(req).then(r=>{if(r.ok)c.put(req,r.clone());return r}))));
    return;
  }
  if(url.origin!==self.location.origin)return; /* map tiles, road data, search and directions always go to the network */
  /* App files: network first so updates show at once, cache when offline */
  e.respondWith(fetch(req).then(r=>{if(r.ok&&r.type==='basic'){const cp=r.clone();caches.open(VERSION).then(c=>c.put(req,cp))}return r})
    .catch(()=>caches.open(VERSION).then(c=>c.match(req,{ignoreSearch:true})).then(hit=>hit||Response.error())));
});
