/* Ekadashi — One Fast Companion · service worker */
var CACHE = 'ekadashi-v2.2.0';
var ASSETS = ['./', './index.html', './manifest.webmanifest', './version.json',
  './book-cover.jpg', './icon-192.png', './icon-512.png', './icon-512-maskable.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if (e.request.method !== 'GET') return;
  var u = new URL(e.request.url);
  if (u.origin !== location.origin) return; /* YouTube etc. straight to network */

  var isDoc = e.request.mode === 'navigate' || u.pathname.endsWith('/') || u.pathname.endsWith('index.html');
  var isVer = u.pathname.endsWith('version.json');

  if (isDoc || isVer) {
    /* NETWORK-FIRST so layout/version updates reach users immediately */
    e.respondWith(
      fetch(e.request).then(function(resp){
        var copy = resp.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return resp;
      }).catch(function(){ return caches.match(e.request).then(function(r){ return r || caches.match('./index.html'); }); })
    );
    return;
  }
  /* other assets: cache-first, then network */
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request).then(function(resp){
        var copy = resp.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copy); });
        return resp;
      }).catch(function(){ return caches.match('./index.html'); });
    })
  );
});
