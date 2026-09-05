// ============================================================================
//  canvasKit.js — सभी poster editors के साझा औज़ार
//  ---------------------------------------------------------------------------
//  नौ editors (PromoEditor, MegaOffer, Booking, Delivery, Multibike, LuckyDraw,
//  Hiring, AIPosterCanvas, AIDelivery) में एक ही code बार-बार लिखा था — और
//  उसी दोहराव में तीन असली गड़बड़ियाँ छिपी थीं। तीनों यहाँ ठीक की गई हैं।
//
//  ─────────────────────────────────────────────────────────────────────────
//  🔴 गड़बड़ी 1 — render का अंतहीन चक्कर (memory खा जाने की असली वजह)
//
//     पुराना code हर editor में ऐसा था:
//
//         if (bikeImg) {
//           const im = new Image(); im.src = bikeImg;
//           if (im.complete) ctx.drawImage(im, ...);
//           else im.onload = () => render();      // ← यहीं गड़बड़ है
//         }
//
//     `new Image()` render() के *अंदर* बनती है। src देते ही `complete` झूठ
//     होता है (data: URL पर भी), तो `onload` लगता है → वह render() बुलाता है
//     → render फिर से नई Image बनाता है → उसका onload फिर render बुलाता है…
//
//     हर चक्कर में 1080×1080 की पूरी तस्वीर दोबारा decode होती है। दो-तीन
//     गाड़ियाँ लगी हों तो phone गरम होने लगता है और editor अटक जाता है।
//
//     ✅ अब: तस्वीर एक बार load होकर याद रख ली जाती है (cache)। दोबारा
//        कभी load नहीं होती, और render एक ही बार चलता है।
//
//  🔴 गड़बड़ी 2 — पुराने iPhone पर poster बनता ही नहीं
//
//     37 जगह सीधे `ctx.roundRect(...)` लिखा है, बिना जाँचे कि यह मौजूद भी है
//     या नहीं। iOS 16.4 से पुराने iPhone और पुराने Android में `roundRect`
//     होता ही नहीं → TypeError → canvas ख़ाली, कुछ नहीं बनता।
//
//     (मज़े की बात: brands.js के `drawBrandLogo` में यह जाँच पहले से है —
//      यानी पता था, पर सिर्फ़ एक जगह ठीक किया गया था।)
//
//     ✅ अब: `roundRect(ctx, …)` — न हो तो ख़ुद कोने बना देता है।
//
//  🔴 गड़बड़ी 3 — गाड़ी की तस्वीर खिंचकर चौड़ी/पतली हो जाती है
//
//     `ctx.drawImage(im, x, y, w, h)` तस्वीर को डिब्बे में ठूँस देता है।
//     अगर आपकी photo 4:3 की है और डिब्बा चौकोर, तो गाड़ी दबी हुई दिखती है।
//     poster सस्ता लगने की एक बड़ी वजह यही है।
//
//     ✅ अब: `drawFit()` — तस्वीर का अनुपात बना रहता है, डिब्बे के बीच में
//        सही बैठती है।
// ============================================================================

import { useRef, useState, useCallback, useEffect } from "react";

// ── हल्का कम्पन ───────────────────────────────────────────────────────────
export const vib = (ms = 40) => {
  try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {}
};

// ══════════════════════════════════════════════════════════════════════════
//  1. तस्वीरों का cache — गड़बड़ी 1 का हल
// ══════════════════════════════════════════════════════════════════════════
/**
 * इस्तेमाल:
 *
 *     const imgCache = useImageCache();
 *
 *     // render() के अंदर:
 *     const bike = imgCache.get(bikeImg);
 *
 *     // और render की deps में `imgCache.tick` ज़रूर जोड़ें
 *     if (bike) drawFit(ctx, bike, x, y, w, h);
 *     else  // अभी load हो रही है — खाली डिब्बा दिखा दो
 *
 * `get()` तुरन्त लौटता है। तस्वीर तैयार न हो तो `null` देता है और तैयार
 * होने पर **एक बार** component को दोबारा render करा देता है।
 */
export function useImageCache() {
  const cache = useRef(new Map());      // src → { img, state }
  const [tick, bump] = useState(0);
  const alive = useRef(true);

  useEffect(() => () => {
    alive.current = false;
    // सब कुछ छोड़ दो — अधूरी load होती तस्वीरें memory में न अटकें
    for (const e of cache.current.values()) {
      if (e.img) { e.img.onload = null; e.img.onerror = null; }
    }
    cache.current.clear();
  }, []);

  const get = useCallback((src) => {
    if (!src) return null;
    const hit = cache.current.get(src);
    if (hit) return hit.state === "ready" ? hit.img : null;

    const img = new Image();
    const entry = { img, state: "loading" };
    cache.current.set(src, entry);

    img.onload = () => {
      entry.state = "ready";
      if (alive.current) bump((k) => k + 1);      // सिर्फ़ एक बार दोबारा render
    };
    img.onerror = () => {
      // ⚠️ पुराने code में onerror था ही नहीं — तस्वीर न खुले तो editor
      //    हमेशा के लिए अटका रह जाता था, कोई सन्देश भी नहीं आता था
      entry.state = "error";
      entry.img = null;
      if (alive.current) bump((k) => k + 1);
    };

    // ⚠️ बाहर की तस्वीर (backend/library से) बिना crossOrigin लगाने पर canvas
    //    "tainted" हो जाता है और Download / "Review में भेजें" SecurityError
    //    से fail होता है। data: URL पर crossOrigin नहीं लगाना चाहिए।
    if (!/^data:/i.test(src) && !/^blob:/i.test(src)) img.crossOrigin = "anonymous";

    // ⚠️ "...com//vehicle-photo/abc" जैसा दोहरा slash Express के रास्ते से
    //    मेल नहीं खाता और 404 देता है। http:// वाले हिस्से को छोड़कर बाक़ी
    //    में दोहरे slash एक कर दो।
    img.src = src.replace(/([^:]\/)\/+/g, "$1");

    return null;
  }, []);

  /** तस्वीर खुल नहीं पाई? (ख़राब file या इंटरनेट) */
  const failed = useCallback((src) => cache.current.get(src)?.state === "error", []);

  /** सब भूल जाओ — brand बदलने पर काम आता है */
  const clear = useCallback(() => { cache.current.clear(); bump((k) => k + 1); }, []);

  // ⚠️ ज़रूरी: editors का `render` एक useCallback है जिसकी deps में
  //    logoTick / ownerTick रहते हैं। इस `tick` को भी वहाँ डालना पड़ता है,
  //    वरना गाड़ी की तस्वीर आने पर poster दोबारा नहीं बनता।
  return { get, failed, clear, tick };
}

// ══════════════════════════════════════════════════════════════════════════
//  2. गोल कोने — गड़बड़ी 2 का हल
// ══════════════════════════════════════════════════════════════════════════
/**
 * `ctx.roundRect` की जगह यह इस्तेमाल करें। पुराने phone पर भी चलता है।
 * path बनाता है — भरने के लिए बाद में ctx.fill() / ctx.stroke() करें।
 */
export function roundRect(ctx, x, y, w, h, r = 8) {
  // ⚠️ r एक अंक भी हो सकता है और चार कोनों का array भी — जैसे [8,8,0,0]
  //    (सिर्फ़ ऊपर के दो कोने गोल)। दोनों तरह से चलना चाहिए।
  const cap = Math.min(Math.abs(w) / 2, Math.abs(h) / 2);
  const clamp = (v) => Math.max(0, Math.min(Number(v) || 0, cap));
  let tl, tr, br, bl;
  if (Array.isArray(r)) {
    const a = r.map(clamp);
    // CSS वाला नियम: 1 अंक = चारों, 2 = [ऊपर-बाएँ/नीचे-दाएँ, बाक़ी दो], 4 = चारों अलग
    if (a.length === 1) { tl = tr = br = bl = a[0]; }
    else if (a.length === 2) { tl = br = a[0]; tr = bl = a[1]; }
    else if (a.length === 3) { tl = a[0]; tr = bl = a[1]; br = a[2]; }
    else { [tl, tr, br, bl] = a; }
  } else {
    tl = tr = br = bl = clamp(r);
  }

  ctx.beginPath();
  if (typeof ctx.roundRect === "function") {
    ctx.roundRect(x, y, w, h, [tl, tr, br, bl]);
    return;
  }
  // पुराने iPhone (iOS 16.4 से नीचे) और पुराने Android के लिए ख़ुद कोने बनाओ
  ctx.moveTo(x + tl, y);
  ctx.lineTo(x + w - tr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
  ctx.lineTo(x + w, y + h - br);
  ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
  ctx.lineTo(x + bl, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
  ctx.lineTo(x, y + tl);
  ctx.quadraticCurveTo(x, y, x + tl, y);
  ctx.closePath();
}

/** भरा हुआ गोल डिब्बा — सबसे ज़्यादा यही चाहिए होता है */
export function fillRound(ctx, x, y, w, h, r, fill) {
  ctx.save();
  if (fill) ctx.fillStyle = fill;
  roundRect(ctx, x, y, w, h, r);
  ctx.fill();
  ctx.restore();
}

/** किनारे वाला गोल डिब्बा */
export function strokeRound(ctx, x, y, w, h, r, stroke, lw = 2) {
  ctx.save();
  if (stroke) ctx.strokeStyle = stroke;
  ctx.lineWidth = lw;
  roundRect(ctx, x, y, w, h, r);
  ctx.stroke();
  ctx.restore();
}

// ══════════════════════════════════════════════════════════════════════════
//  3. तस्वीर सही अनुपात में — गड़बड़ी 3 का हल
// ══════════════════════════════════════════════════════════════════════════
/**
 * तस्वीर को डिब्बे में बिठाओ, खींचो मत।
 * @param mode "contain" = पूरी दिखे (गाड़ी के लिए यही सही है)
 *             "cover"   = डिब्बा पूरा भरे, किनारे कट जाएँ (background के लिए)
 */
export function drawFit(ctx, img, x, y, w, h, mode = "contain") {
  if (!img || !img.naturalWidth || !img.naturalHeight) return false;
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const k = mode === "cover"
    ? Math.max(w / iw, h / ih)
    : Math.min(w / iw, h / ih);
  const dw = iw * k, dh = ih * k;
  const dx = x + (w - dw) / 2, dy = y + (h - dh) / 2;

  if (mode === "cover") {
    ctx.save();
    roundRect(ctx, x, y, w, h, 0);
    ctx.clip();
    ctx.drawImage(img, dx, dy, dw, dh);
    ctx.restore();
  } else {
    ctx.drawImage(img, dx, dy, dw, dh);
  }
  return true;
}

/** तस्वीर के नीचे हल्की परछाईं — गाड़ी ज़मीन पर खड़ी लगती है, चिपकी हुई नहीं */
export function drawShadowFit(ctx, img, x, y, w, h) {
  if (!img || !img.naturalWidth) return false;
  ctx.save();
  ctx.globalAlpha = 0.22;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(x + w / 2, y + h * 0.97, w * 0.34, h * 0.045, 0, 0, Math.PI * 2);
  ctx.filter = "blur(6px)";
  ctx.fill();
  ctx.restore();
  return drawFit(ctx, img, x, y, w, h, "contain");
}

// ══════════════════════════════════════════════════════════════════════════
//  4. text के औज़ार
// ══════════════════════════════════════════════════════════════════════════
/** लम्बी लाइन को डिब्बे की चौड़ाई में तोड़ो */
export function wrapText(ctx, text, maxW) {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";
  for (const wd of words) {
    const test = line ? line + " " + wd : wd;
    if (ctx.measureText(test).width > maxW && line) { lines.push(line); line = wd; }
    else line = test;
  }
  if (line) lines.push(line);
  return lines;
}

/** डिब्बे में फ़िट होने तक font छोटा करो — text कभी बाहर न निकले */
export function fitFont(ctx, text, maxW, startPx, fontTpl, minPx = 12) {
  let px = startPx;
  while (px > minPx) {
    ctx.font = fontTpl.replace("{px}", px);
    if (ctx.measureText(text).width <= maxW) break;
    px -= 2;
  }
  return px;
}

/** पढ़ने लायक़ रहे — गहरे background पर हल्का text, हल्के पर गहरा */
export function readableOn(hex) {
  try {
    const n = parseInt(String(hex).replace("#", ""), 16);
    const L = (((n >> 16) & 255) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000;
    return L > 150 ? "#111111" : "#FFFFFF";
  } catch (_) { return "#FFFFFF"; }
}

// ══════════════════════════════════════════════════════════════════════════
//  5. canvas से तस्वीर निकालना — साफ़ सन्देश के साथ
// ══════════════════════════════════════════════════════════════════════════
/**
 * पुराना code सीधे `toDataURL()` बुलाता था। कोई बाहर की तस्वीर बिना
 * crossOrigin लगी हो तो यह SecurityError फेंकता है और उपयोगकर्ता को
 * बस "कुछ गड़बड़ है" दिखता था। अब वजह साफ़ बताई जाती है।
 */
export function exportCanvas(canvas, { type = "image/jpeg", quality = 0.9 } = {}) {
  if (!canvas) throw new Error("poster अभी तैयार नहीं है");
  try {
    return canvas.toDataURL(type, quality);
  } catch (e) {
    if (String(e.name) === "SecurityError" || /tainted/i.test(e.message || "")) {
      throw new Error("कोई तस्वीर बाहर से आई है जिसे canvas छू नहीं सकता — उसे हटाकर अपने phone से दोबारा डालें");
    }
    throw e;
  }
}

/** फ़ाइल के रूप में उतारो */
export function downloadCanvas(canvas, filename = "poster.jpg", quality = 0.9) {
  return new Promise((resolve, reject) => {
    if (!canvas) return reject(new Error("poster अभी तैयार नहीं है"));
    try {
      canvas.toBlob((blob) => {
        if (!blob) return reject(new Error("तस्वीर नहीं बन पाई"));
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        // ⚠️ तुरन्त revoke करने पर कुछ phone में download अधूरा रह जाता है
        setTimeout(() => URL.revokeObjectURL(url), 4000);
        resolve(true);
      }, "image/jpeg", quality);
    } catch (e) { reject(e); }
  });
}

/** भेजने से पहले तस्वीर छोटी करो — बड़ी file 413 error देती है */
export function downscaleDataUrl(dataUrl, maxSide = 1400, quality = 0.88) {
  return new Promise((resolve) => {
    if (!dataUrl) return resolve(null);
    const im = new Image();
    im.onload = () => {
      try {
        const s = Math.min(maxSide / im.naturalWidth, maxSide / im.naturalHeight, 1);
        if (s >= 1) return resolve(dataUrl);
        const c = document.createElement("canvas");
        c.width = Math.round(im.naturalWidth * s);
        c.height = Math.round(im.naturalHeight * s);
        const cx = c.getContext("2d");
        cx.imageSmoothingQuality = "high";
        cx.drawImage(im, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", quality));
      } catch (_) { resolve(dataUrl); }
    };
    im.onerror = () => resolve(null);
    im.src = dataUrl;
  });
}

// ══════════════════════════════════════════════════════════════════════════
//  6. canvas को साफ़ (crisp) रखना
// ══════════════════════════════════════════════════════════════════════════
/**
 * मोबाइल पर canvas धुँधला दिखता है क्योंकि screen की असली pixel गिनती
 * ज़्यादा होती है। यह उसे ठीक करता है — poster की असली नाप वही रहती है।
 */
export function setupCanvas(canvas, W, H) {
  if (!canvas) return null;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.textBaseline = "alphabetic";
  return ctx;
}
