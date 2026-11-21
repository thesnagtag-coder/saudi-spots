/* Saudi Spots - offline support. Bump CACHE when files change. */
var CACHE = "saudi-spots-v1";
var FILES = ["./", "./index.html", "./manifest.webmanifest", "./apple-touch-icon.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(FILES); }).then(function(){ return self.skipWaiting(); }));
});

self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return; /* maps, WhatsApp etc. go straight to the internet */
  if (req.mode === "navigate"){
    /* App page: newest version when online, saved copy when offline */
    e.respondWith(fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put("./index.html", copy); });
      return res;
    }).catch(function(){
      return caches.match("./index.html").then(function(r){ return r || caches.match("./"); });
    }));
    return;
  }
  e.respondWith(caches.match(req, {ignoreSearch:true}).then(function(hit){
    return hit || fetch(req).then(function(res){
      var copy = res.clone();
      caches.open(CACHE).then(function(c){ c.put(req, copy); });
      return res;
    });
  }));
});
