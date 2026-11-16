const CACHE = "maktaba-v3";
const FILES = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)));
  self.skipWaiting();
});

self.addEventListener("activate", e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  if (new URL(req.url).origin !== location.origin) return; // let the browser handle it

  e.respondWith(
    fetch(req).then(r => {
      if (r.ok && r.status === 200) {
        const cp = r.clone();
        e.waitUntil(caches.open(CACHE).then(c => c.put(req, cp)));
      }
      return r;
    }).catch(async () => {
      const isNav = req.mode === "navigate";
      const cached = await caches.match(req, { ignoreSearch: isNav });
      if (cached) return cached;
      if (isNav) return caches.match("index.html");
      return new Response("", { status: 404 });
    })
  );
});
