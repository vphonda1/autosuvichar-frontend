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
//  2क. विज्ञापन वाले हिंदी अक्षर — सबसे बड़ा फ़र्क़ यही डालता है
// ══════════════════════════════════════════════════════════════════════════
//  ⚠️ अब तक canvas "Noto Sans Devanagari" इस्तेमाल कर रहा था। वह app और
//     website के लिए बना सादा font है — साफ़ है, पर विज्ञापन वाला दम नहीं।
//     इसीलिए poster सादा लगता था, चाहे बाक़ी सजावट कितनी भी कर दें।
//
//  अब "Baloo 2" (मोटा, चौड़ा — poster के लिए सबसे माना हुआ) और भारी वज़न
//  वाला "Mukta" लाते हैं। दोनों Google Fonts से मुफ़्त हैं।
//
//  ⚠️ ज़रूरी बात: canvas उस font को तभी इस्तेमाल करता है जब वह पूरी तरह आ
//     चुका हो। इसीलिए यह hook एक "tick" देता है — font आते ही poster अपने
//     आप दोबारा बनता है। tick को render की deps में डालना ज़रूरी है, वरना
//     पहली बार सादा ही बनेगा।

const FONT_HREF =
  "https://fonts.googleapis.com/css2" +
  "?family=Baloo+2:wght@600;700;800" +
  "&family=Mukta:wght@600;700;800" +
  "&display=swap";

let fontsAsked = false;

export function usePosterFonts() {
  const [ready, setReady] = useState(0);

  useEffect(() => {
    let dead = false;

    if (!fontsAsked) {
      fontsAsked = true;
      try {
        const l = document.createElement("link");
        l.rel = "stylesheet"; l.href = FONT_HREF;
        document.head.appendChild(l);
      } catch (_) {}
    }

    // हर वज़न अलग से माँगना पड़ता है — सिर्फ़ link लगाने से canvas को नहीं मिलता
    const want = [
      '800 80px "Baloo 2"', '700 40px "Baloo 2"', '600 30px "Baloo 2"',
      '800 40px "Mukta"', '700 30px "Mukta"', '600 24px "Mukta"',
    ];
    try {
      Promise.all(want.map((f) => document.fonts.load(f, "अआइकखगहॐ०१२")))
        .then(() => document.fonts.ready)
        .then(() => { if (!dead) setReady((k) => k + 1); })
        .catch(() => { if (!dead) setReady((k) => k + 1); });   // न आए तो भी बनने दो
    } catch (_) { setReady(1); }

    return () => { dead = true; };
  }, []);

  return ready;
}

/** poster के अक्षर — पहला नाम न मिले तो अगला अपने आप चलेगा */
export const FONT_HEAD = '"Baloo 2", "Mukta", "Noto Sans Devanagari", system-ui, sans-serif';
export const FONT_BODY = '"Mukta", "Noto Sans Devanagari", system-ui, sans-serif';

// ══════════════════════════════════════════════════════════════════════════
//  3क. उभरी हुई (3D) सजावट — poster को महँगा दिखाने वाली चीज़ें
// ══════════════════════════════════════════════════════════════════════════
//  ⚠️ सादा रंग और सपाट अक्षर poster को सस्ता दिखाते हैं। असली designer तीन
//     चीज़ें लगाता है: ऊपर हल्की चमक, नीचे गहरी परछाईं, और किनारे पर रेखा।
//     ये तीनों canvas में हो सकती हैं — बस लगानी पड़ती हैं।

/** ऊपर से नीचे रंग बदलती पट्टी — जैसे धातु पर रोशनी पड़ रही हो */
export function bevelBar(ctx, x, y, w, h, { top, bottom, shine = 0.22, r = 0 } = {}) {
  ctx.save();
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, top);
  g.addColorStop(0.5, bottom);
  g.addColorStop(1, top);
  ctx.fillStyle = g;
  if (r > 0) { roundRect(ctx, x, y, w, h, r); ctx.fill(); }
  else ctx.fillRect(x, y, w, h);

  // ऊपर की चमक — यही "उभरा हुआ" दिखाती है
  ctx.globalAlpha = shine;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(x, y, w, Math.max(2, h * 0.16));
  // नीचे की गहराई
  ctx.globalAlpha = shine * 0.9;
  ctx.fillStyle = "#000000";
  ctx.fillRect(x, y + h - Math.max(2, h * 0.12), w, Math.max(2, h * 0.12));
  ctx.restore();
}

/** उभरे हुए अक्षर — परछाईं + किनारा + ऊपर से नीचे रंग */
export function solidText(ctx, text, x, y, {
  font, fill = "#111", fill2, stroke, strokeW = 0,
  shadow = "rgba(0,0,0,0.35)", shadowY = 4, shadowBlur = 6, align = "left",
} = {}) {
  ctx.save();
  if (font) ctx.font = font;
  ctx.textAlign = align;

  const m = ctx.measureText(text);
  const asc = m.actualBoundingBoxAscent || parseInt(ctx.font, 10) * 0.8;

  // 1) नीचे परछाईं — अक्षर काग़ज़ से उठे हुए लगें
  if (shadow) {
    ctx.save();
    ctx.shadowColor = shadow; ctx.shadowOffsetY = shadowY; ctx.shadowBlur = shadowBlur;
    ctx.fillStyle = fill; ctx.fillText(text, x, y);
    ctx.restore();
  }
  // 2) किनारे की रेखा — अक्षर पृष्ठभूमि से अलग दिखें
  if (stroke && strokeW > 0) {
    ctx.lineJoin = "round"; ctx.lineWidth = strokeW; ctx.strokeStyle = stroke;
    ctx.strokeText(text, x, y);
  }
  // 3) ऊपर से नीचे रंग — धातु जैसा असर
  if (fill2) {
    const g = ctx.createLinearGradient(0, y - asc, 0, y + asc * 0.25);
    g.addColorStop(0, fill); g.addColorStop(1, fill2);
    ctx.fillStyle = g;
  } else ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/** रिबन — दोनों सिरे मुड़े हुए, जैसे कपड़े की पट्टी */
export function ribbon(ctx, x, y, w, h, { fill = "#C1121F", dark = "#7A0016", notch = 0 } = {}) {
  const n = notch || h * 0.4;
  ctx.save();
  // पीछे मुड़े हुए सिरे
  ctx.fillStyle = dark;
  ctx.beginPath();
  ctx.moveTo(x - n * 0.6, y + h * 0.18); ctx.lineTo(x + n * 0.4, y + h * 0.18);
  ctx.lineTo(x + n * 0.4, y + h * 0.82); ctx.lineTo(x - n * 0.6, y + h * 0.82);
  ctx.lineTo(x - n * 0.2, y + h / 2); ctx.closePath(); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x + w + n * 0.6, y + h * 0.18); ctx.lineTo(x + w - n * 0.4, y + h * 0.18);
  ctx.lineTo(x + w - n * 0.4, y + h * 0.82); ctx.lineTo(x + w + n * 0.6, y + h * 0.82);
  ctx.lineTo(x + w + n * 0.2, y + h / 2); ctx.closePath(); ctx.fill();

  // मुख्य पट्टी
  const g = ctx.createLinearGradient(x, y, x, y + h);
  g.addColorStop(0, fill); g.addColorStop(0.5, dark); g.addColorStop(1, fill);
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.moveTo(x, y); ctx.lineTo(x + w, y);
  ctx.lineTo(x + w - n * 0.35, y + h / 2); ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h); ctx.lineTo(x + n * 0.35, y + h / 2);
  ctx.closePath(); ctx.fill();
  ctx.restore();
}

/** नीचे ज़मीन जैसी परछाईं — गाड़ी हवा में तैरती न लगे */
export function groundShadow(ctx, cx, cy, w, h, alpha = 0.25) {
  ctx.save();
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w / 2);
  g.addColorStop(0, `rgba(0,0,0,${alpha})`);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.ellipse(cx, cy, w / 2, h / 2, 0, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
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
