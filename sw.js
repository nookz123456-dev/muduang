// Service worker ของดาวเล่า: ให้เปิดได้แม้ไม่มีเน็ต และติดตั้งเป็นแอปได้
// โค้ด/หน้าเว็บ = ลองเน็ตก่อน (ได้ของใหม่เสมอ กันปัญหา ES module เก่าปนใหม่) เน็ตล่มค่อยใช้ของในแคช
// รูป/ฟอนต์ = ใช้แคชก่อน (ไม่ค่อยเปลี่ยน ประหยัดเน็ต)
const CACHE = "daolao-v1";
const SHELL = ["./", "./index.html", "./style.css", "./js/app.js", "./manifest.webmanifest", "./img/icon-192.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const res = await fetch(req);
    if (res.ok) cache.put(req, res.clone());
    return res;
  } catch {
    return (await cache.match(req)) || (req.mode === "navigate" ? cache.match("./index.html") : Response.error());
  }
}

async function cacheFirst(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  if (hit) return hit;
  const res = await fetch(req);
  if (res.ok || res.type === "opaque") cache.put(req, res.clone());
  return res;
}

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.pathname.startsWith("/_vercel/")) return; // สถิติผู้เข้าชม ไม่เก็บแคช
  const font = url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com";
  if (url.origin !== location.origin && !font) return;
  const isAsset = font || /\.(jpg|jpeg|png|webp|svg|woff2?|ttf)$/i.test(url.pathname);
  e.respondWith(isAsset ? cacheFirst(req) : networkFirst(req));
});
