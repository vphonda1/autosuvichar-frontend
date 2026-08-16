/* ============================================================================
 *  Auto Suvichar — Service Worker
 *  ------------------------------------------------------------------------
 *  ⚠️ सबसे ज़रूरी नियम: API calls कभी cache से नहीं दी जातीं।
 *     वरना पुरानी posts दिखतीं, approve/reject गलत चलता, और आपको लगता
 *     कि app में गड़बड़ है। सिर्फ़ app की अपनी files (JS/CSS/icons) cache होती हैं।
 * ========================================================================== */

const VERSION = "v1";
const SHELL = `suvichar-shell-${VERSION}`;   // app की files
const MEDIA = `suvichar-media-${VERSION}`;   // बनी हुई posters (देखने के लिए)

// पहली बार खुलने पर ये चीज़ें रख लो
const PRECACHE = ["/", "/index.html", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

// ── install: shell रख लो ──────────────────────────────────────────
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(SHELL)
      .then((c) => c.addAll(PRECACHE).catch(() => {}))   // कोई file न मिले तो भी रुको मत
      .then(() => self.skipWaiting())
  );
});

// ── activate: पुरानी version की cache हटा दो ──────────────────────
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== SHELL && k !== MEDIA).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// नया version तैयार होने पर app इसे भेजता है
self.addEventListener("message", (e) => {
  if (e.data === "SKIP_WAITING") self.skipWaiting();
});

// ── fetch ─────────────────────────────────────────────────────────
self.addEventListener("fetch", (event) => {
  const req = event.request;

  // सिर्फ़ GET संभालो — POST/PATCH/DELETE सीधे network पर जाएँ
  if (req.method !== "GET") return;

  let url;
  try { url = new URL(req.url); } catch (_) { return; }

  // दूसरी site (chrome-extension आदि) को हाथ मत लगाओ
  if (!url.protocol.startsWith("http")) return;

  const isAPI = url.pathname.startsWith("/api/");
  const isMedia = url.pathname.startsWith("/generated/")
    || url.pathname.startsWith("/logos/")
    || url.pathname.startsWith("/vehicles/");

  // ⚠️ 1) API — हमेशा network. cache बिल्कुल नहीं।
  //    offline हो तो साफ़ हिंदी में बताओ, चुपचाप पुराना डेटा मत दिखाओ।
  if (isAPI) {
    event.respondWith(
      fetch(req).catch(() =>
        new Response(
          JSON.stringify({ error: "इंटरनेट नहीं है — कनेक्शन जाँचकर दोबारा कोशिश करें", offline: true }),
          { status: 503, headers: { "Content-Type": "application/json" } }
        )
      )
    );
    return;
  }

  // 2) बनी हुई posters/logos — पहले cache (तेज़), पीछे-पीछे ताज़ा भी ले आओ
  if (isMedia) {
    event.respondWith(
      caches.open(MEDIA).then(async (cache) => {
        const hit = await cache.match(req);
        const fresh = fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone()).catch(() => {});
          return res;
        }).catch(() => hit);
        return hit || fresh;
      })
    );
    return;
  }

  // 3) पेज खोलना — पहले network, न चले तो cache से app दिखा दो
  if (req.mode === "navigate") {
    event.respondWith(
      fetch(req)
        .then((res) => {
          caches.open(SHELL).then((c) => c.put("/index.html", res.clone())).catch(() => {});
          return res;
        })
        .catch(() => caches.match("/index.html").then((r) => r || caches.match("/")))
    );
    return;
  }

  // 4) app की बाक़ी files (JS/CSS/fonts) — cache से तुरंत, पीछे update
  event.respondWith(
    caches.open(SHELL).then(async (cache) => {
      const hit = await cache.match(req);
      const fresh = fetch(req).then((res) => {
        if (res && res.ok && res.type === "basic") cache.put(req, res.clone()).catch(() => {});
        return res;
      }).catch(() => hit);
      return hit || fresh;
    })
  );
});

// ── Push notification (आगे के लिए तैयार) ──────────────────────────
self.addEventListener("push", (event) => {
  let data = { title: "Auto Suvichar", body: "नया content तैयार है" };
  try { if (event.data) data = { ...data, ...event.data.json() }; } catch (_) {}
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: "/icon-192.png",
      badge: "/icon-192.png",
      tag: data.tag || "suvichar",
      data: { url: data.url || "/" },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = event.notification.data?.url || "/";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && "focus" in c) return c.focus();
      }
      return self.clients.openWindow(target);
    })
  );
});
