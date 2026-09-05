// ============================================================================
//  CompareEditor.jsx — तुलना वाला poster (⚖️ हम बनाम बाक़ी)
//  ---------------------------------------------------------------------------
//  ठीक वैसा poster जैसा आपने भेजा था — बड़ा शीर्षक, तुलना की तालिका,
//  तीन ख़ूबियाँ, और दाईं तरफ़ आपकी अपनी गाड़ियों की photo।
//
//  ⭐ इसमें कुछ भी चित्रित (artwork) नहीं है — सब typography और आकार हैं।
//     इसीलिए यह code से हूबहू बन सकता है, और हर शब्द आप बदल सकते हैं।
//
//  Studio.jsx में जोड़ें —
//     TEMPLATES में (समूह "ऑफ़र"):
//       { id: "compare", group: "ऑफ़र", icon: "⚖️", name: "तुलना वाला poster",
//         desc: "दाम/सर्विस की तालिका — हम बनाम बाक़ी" },
//     RENDER में:
//       compare: <CompareEditor {...P} />,
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from "react";
import { useImageCache, roundRect, drawFit,
         bevelBar, solidText, ribbon, groundShadow,
         usePosterFonts, FONT_HEAD, FONT_BODY } from "./canvasKit.js";
import { useBrandLogo, useOwnerLogo, drawBothLogos } from "./brands.js";
import VehiclePicker from "./VehiclePicker.jsx";

const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

const W = 1080, H = 1350;   // 4:5 — Instagram पर सबसे बड़ा दिखने वाला नाप

// तैयार रंग-रूप
const SKINS = {
  green:  { name: "🟢 हरा",   accent: "#0B7A3B", dark: "#111111", soft: "#EEF7F1", bg: "#FFFFFF" },
  red:    { name: "🔴 लाल",   accent: "#C1121F", dark: "#111111", soft: "#FDEEEF", bg: "#FFFFFF" },
  blue:   { name: "🔵 नीला",  accent: "#12508F", dark: "#111111", soft: "#EDF3FA", bg: "#FFFFFF" },
  purple: { name: "🟣 बैंगनी", accent: "#5B2A86", dark: "#111111", soft: "#F3EEF8", bg: "#FFFFFF" },
};

// ख़ूबियों के निशान — canvas पर बनते हैं, कोई file नहीं
const ICONS = {
  rupee:  { label: "₹ बचत",   draw: (c, x, y, r, col) => { c.fillStyle = col; c.font = `700 ${r * 1.15}px system-ui`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("₹", x, y + r * 0.04); } },
  tools:  { label: "🔧 सर्विस", draw: (c, x, y, r, col) => { c.strokeStyle = col; c.lineWidth = r * 0.17; c.lineCap = "round";
              c.beginPath(); c.moveTo(x - r * .48, y + r * .48); c.lineTo(x + r * .34, y - r * .34); c.stroke();
              c.beginPath(); c.arc(x + r * .46, y - r * .46, r * .26, Math.PI * .2, Math.PI * 1.5); c.stroke();
              c.beginPath(); c.moveTo(x + r * .48, y + r * .48); c.lineTo(x - r * .34, y - r * .34); c.stroke();
              c.beginPath(); c.arc(x - r * .46, y - r * .46, r * .26, Math.PI * 1.5, Math.PI * 2.8); c.stroke(); } },
  shield: { label: "🛡️ भरोसा", draw: (c, x, y, r, col) => { c.fillStyle = col;
              c.beginPath(); c.moveTo(x, y - r * .72); c.lineTo(x + r * .58, y - r * .42);
              c.lineTo(x + r * .5, y + r * .3); c.lineTo(x, y + r * .74); c.lineTo(x - r * .5, y + r * .3);
              c.lineTo(x - r * .58, y - r * .42); c.closePath(); c.fill();
              c.strokeStyle = "#fff"; c.lineWidth = r * .16; c.lineCap = "round"; c.lineJoin = "round";
              c.beginPath(); c.moveTo(x - r * .24, y); c.lineTo(x - r * .05, y + r * .2); c.lineTo(x + r * .28, y - r * .22); c.stroke(); } },
  clock:  { label: "⏱️ समय",   draw: (c, x, y, r, col) => { c.strokeStyle = col; c.lineWidth = r * .13;
              c.beginPath(); c.arc(x, y, r * .62, 0, 7); c.stroke(); c.lineCap = "round";
              c.beginPath(); c.moveTo(x, y - r * .34); c.lineTo(x, y); c.lineTo(x + r * .28, y + r * .14); c.stroke(); } },
  star:   { label: "⭐ ख़ासियत", draw: (c, x, y, r, col) => { c.fillStyle = col; c.beginPath();
              for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5; const rr = i % 2 ? r * .32 : r * .72;
                i ? c.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr) : c.moveTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); }
              c.closePath(); c.fill(); } },
};

export default function CompareEditor({ apiBase, token, brandId, onSent, draft }) {
  const cvRef = useRef(null);
  const imgCache = useImageCache();
  // ⚠️ font आते ही poster दोबारा बने — वरना पहली बार सादे अक्षरों में बनेगा
  const fontTick = usePosterFonts();
  // ⚠️ ये hooks array लौटाते हैं — [ref, tick]। मैंने पहले object मान लिया था
  //    ({logo, tick}), इसलिए logo हमेशा ख़ाली रहता और poster पर आता ही नहीं।
  //    बाक़ी editors में यही सही तरीक़ा लगा है।
  const [logoRef, logoTick] = useBrandLogo(apiBase, brandId);
  const [ownerRef, ownerTick] = useOwnerLogo(apiBase);

  const [skin, setSkin] = useState("green");

  // ── हर लिखने लायक़ चीज़ ──────────────────────────────────────
  const [h1, setH1] = useState("स्मार्ट चुनाव,");
  const [h2, setH2] = useState("कम खर्च।");
  const [body, setBody] = useState("स्मार्ट सर्विस, बेहतरीन माइलेज\nHonda के साथ हर सफ़र\nबने आसान और भरोसेमंद।");
  const [badge, setBadge] = useState("कम सर्विस चार्ज, ज़्यादा भरोसा।");
  const [colA, setColA] = useState("कंपनी");
  const [colB, setColB] = useState("सर्विस चार्ज (₹)");
  const [rows, setRows] = useState([
    { a: "हीरो", b: "350", hi: false },
    { a: "बजाज", b: "332", hi: false },
    { a: "टीवीएस", b: "350", hi: false },
    { a: "Honda", b: "300", hi: true },
  ]);
  const [feats, setFeats] = useState([
    { icon: "rupee", l1: "कम खर्च,", l2: "ज़्यादा बचत" },
    { icon: "tools", l1: "बेहतरीन देखभाल,", l2: "वाहन चले सालों साल" },
    { icon: "shield", l1: "ओरिजिनल क्वालिटी,", l2: "हर बार" },
  ]);
  const [footLine, setFootLine] = useState("कम सर्विस चार्ज, ज़्यादा बचत, हर बार।");
  const [shopName, setShopName] = useState("VP Honda");
  const [shopSub, setShopSub] = useState("अधिकृत Honda डीलर · भोपाल");
  const [shopPlace, setShopPlace] = useState("परवलिया");
  const [shopAddr, setShopAddr] = useState("नरसिंहगढ़ रोड, परवलिया सड़क, भोपाल - 462030");
  const [phone, setPhone] = useState("9713394738");

  // ── दो गाड़ियाँ ──────────────────────────────────────────────
  const [v1, setV1] = useState({ img: "", name: "", noPhoto: false });
  const [v2, setV2] = useState({ img: "", name: "", noPhoto: false });

  const [caption, setCaption] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("text");   // text | table | feat | veh

  // ── AI से बनी पृष्ठभूमि ────────────────────────────────────
  //  आपके server में यह पहले से है (/api/ai-bg) — बस यहाँ से बुलाया नहीं
  //  जा रहा था। सादे सफ़ेद के बजाय असली दिखने वाली पृष्ठभूमि आ जाएगी।
  const [bgImg, setBgImg] = useState("");
  const [bgBusy, setBgBusy] = useState(false);
  const [bgMsg, setBgMsg] = useState("");        // AI का अपना हाल — अलग दिखे
  const [bgErr, setBgErr] = useState("");
  const [bgSaved, setBgSaved] = useState([]);    // सेव की हुई पृष्ठभूमियाँ
  const [bgSource, setBgSource] = useState("");  // अभी वाली किससे बनी
  const [savingBg, setSavingBg] = useState(false);

  // ── नीचे गाड़ियों की पट्टी (आपके नमूने वाली "हर ज़रूरत के लिए Honda") ──
  const [strip, setStrip] = useState([]);          // { img, name }
  const [stripText, setStripText] = useState("हर ज़रूरत के लिए Honda");
  const [showStrip, setShowStrip] = useState(true);

  // ── बोलकर बनवाया हुआ draft ─────────────────────────────────
  //  Studio से आता है — गाड़ी, दाम, दुकान का नाम सब भरा हुआ।
  //  सिर्फ़ वही खाने भरते हैं जो draft में सचमुच आए हों, बाक़ी अपने रहते हैं।
  useEffect(() => {
    if (!draft) return;
    const put = (v, set) => { if (v !== undefined && v !== null && v !== "") set(v); };
    put(draft.h1, setH1); put(draft.h2, setH2); put(draft.body, setBody);
    put(draft.badge, setBadge); put(draft.colA, setColA); put(draft.colB, setColB);
    put(draft.footLine, setFootLine);
    put(draft.shopName, setShopName); put(draft.shopSub, setShopSub); put(draft.phone, setPhone);
    if (Array.isArray(draft.rows) && draft.rows.length) setRows(draft.rows);
    if (draft.v1) setV1({ img: "", name: "", noPhoto: false, ...draft.v1 });
    if (draft.v2) setV2({ img: "", name: "", noPhoto: false, ...draft.v2 });
    vib(30);
  }, [draft]);

  // ⚠️ phone से डाली photo का पता (blob URL) छोड़ना पड़ता है, वरना memory में
  //    पड़ा रह जाता है। editor बंद होते ही दोनों छूट जाएँ।
  useEffect(() => () => {
    [v1, v2].forEach((v) => { if (v?.img?.startsWith("blob:")) { try { URL.revokeObjectURL(v.img); } catch (_) {} } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const S = SKINS[skin];

  // ── canvas बनाना ─────────────────────────────────────────────
  const render = useCallback(() => {
    const cv = cvRef.current; if (!cv) return;
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    c.imageSmoothingQuality = "high";
    const COL_W = W * 0.50;            // बाईं तरफ़ लिखाई कितनी चौड़ी
    c.fillStyle = S.bg; c.fillRect(0, 0, W, H);

    // ऊपर बाएँ बिन्दुओं का हल्का नमूना — छपे हुए poster जैसा एहसास
    c.save();
    c.fillStyle = S.accent; c.globalAlpha = 0.10;
    for (let r = 0; r < 9; r++) {
      for (let q = 0; q < 14; q++) {
        const dx = 24 + q * 22, dy = 22 + r * 20;
        const fade = 1 - (q / 14) * 0.75 - (r / 9) * 0.55;
        if (fade <= 0.05) continue;
        c.globalAlpha = 0.14 * fade;
        c.beginPath(); c.arc(dx, dy, 3.6 * fade + 1.1, 0, 7); c.fill();
      }
    }
    c.restore();

    // AI वाली पृष्ठभूमि — ऊपर हल्का सफ़ेद पर्दा, ताकि लिखाई साफ़ पढ़ी जाए
    const bg = bgImg ? imgCache.get(bgImg) : null;
    if (bg) {
      drawFit(c, bg, 0, 0, W, H, "cover");

      // ⚠️ पहले पूरे बाएँ हिस्से पर 80% सफ़ेद पर्दा था — पृष्ठभूमि इतनी ढँक
      //    जाती थी कि लगता ही नहीं कि कुछ लगा है। अब सिर्फ़ उतनी जगह ढँकती है
      //    जहाँ सचमुच लिखाई है, और दाईं तरफ़ पृष्ठभूमि साफ़ दिखती है।
      const gv = c.createLinearGradient(0, 0, 0, H);
      gv.addColorStop(0, "rgba(255,255,255,0.90)");
      gv.addColorStop(0.72, "rgba(255,255,255,0.90)");
      gv.addColorStop(1, "rgba(255,255,255,0.55)");
      c.fillStyle = gv;
      c.fillRect(0, 0, COL_W + 40, H);

      // बीच में धीरे-धीरे ख़त्म होता पर्दा
      const g = c.createLinearGradient(COL_W + 40, 0, W * 0.66, 0);
      g.addColorStop(0, "rgba(255,255,255,0.90)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      c.fillStyle = g; c.fillRect(COL_W + 40, 0, W * 0.66 - COL_W - 40, H);

      // गाड़ियों के पीछे हल्की सफ़ेदी, ताकि वे उभरकर दिखें
      c.fillStyle = "rgba(255,255,255,0.22)";
      c.fillRect(W * 0.66, 0, W * 0.34, H);
    }

    const L = 62;                      // बायाँ हाशिया
    const RX = W * 0.585;              // दाईं तरफ़ गाड़ियों का हिस्सा शुरू
    const RW = W - RX - 46;
    const BAR = 172;                   // नीचे की पट्टी — बाएँ पता, दाएँ फ़ोन
    const ADDR_H = 0;                  // अब अलग पट्टी नहीं, पता बाईं तरफ़ ही है

    c.textAlign = "left"; c.textBaseline = "alphabetic";
    // शीर्षक के लिए मोटा display font, बाक़ी के लिए साफ़ font
    const D = FONT_HEAD;      // बड़े अक्षर — विज्ञापन वाला दम
    const B = FONT_BODY;      // पैरा, तालिका, छोटी लिखाई

    // डिब्बे में फ़िट होने तक font छोटा करो
    const fit = (t, max, start, wt) => {
      let p = start;
      while (p > 20) { c.font = `${wt} ${p}px ${D}`; if (c.measureText(t).width <= max) break; p -= 2; }
      return p;
    };

    // ⚠️ देवनागरी में मात्रा अक्षर के ऊपर (ि ी ै) और नीचे (ु ू) दोनों जाती है।
    //    इसलिए दो लाइनों के बीच font का 1.35 गुना जगह चाहिए। पहले 1.02 था —
    //    इसी से "स्मार्ट चुनाव," और "कम खर्च।" आपस में टकरा रहे थे।
    const LH = 1.35;

    let y = 78;                        // ऊपर पूरी जगह, वरना मात्रा कट जाती है

    // ── बड़ा शीर्षक ──────────────────────────────────────────
    // ⚠️ पहले सपाट अक्षर थे — इसीलिए poster सस्ता लगता था। अब परछाईं,
    //    किनारे की सफ़ेद रेखा और ऊपर-नीचे रंग बदलाव, तीनों लगे हैं।
    const p1 = fit(h1, COL_W, 74, 900);
    y += p1;
    solidText(c, h1, L, y, {
      font: `900 ${p1}px ${D}`, fill: S.dark, fill2: "#3a3a3a",
      stroke: "#ffffff", strokeW: Math.max(3, p1 * 0.06),
      shadow: "rgba(0,0,0,0.32)", shadowY: 5, shadowBlur: 8,
    });

    const p2 = fit(h2, COL_W, 84, 900);
    y += Math.round(p2 * LH);
    solidText(c, h2, L, y, {
      font: `900 ${p2}px ${D}`, fill: S.accent, fill2: S.dark2 || S.accent,
      stroke: "#ffffff", strokeW: Math.max(3, p2 * 0.06),
      shadow: "rgba(0,0,0,0.34)", shadowY: 6, shadowBlur: 10,
    });

    // नीचे मोटी लकीर
    y += 24;
    c.fillStyle = S.accent; c.fillRect(L, y, Math.round(W * 0.185), 7);
    y += 52;

    // ── बीच का पैरा ─────────────────────────────────────────
    const lines = String(body || "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 4);
    const bp = 33;
    c.font = `700 ${bp}px ${B}`;
    for (const ln of lines) {
      y += Math.round(bp * LH);
      const [pre, hi] = ln.split("|");
      c.fillStyle = S.dark; c.fillText(pre, L, y);
      if (hi) { c.fillStyle = S.accent; c.fillText(hi, L + c.measureText(pre).width, y); }
    }

    // ── बैज ─────────────────────────────────────────────────
    y += 40;
    const bp2 = fit(badge, COL_W - 48, 28, 700);
    c.font = `700 ${bp2}px ${B}`;
    const bw = Math.min(c.measureText(badge).width + 44, COL_W);
    c.strokeStyle = S.accent; c.lineWidth = 2.5;
    roundRect(c, L, y, bw, 54, 10); c.stroke();
    c.fillStyle = S.dark; c.fillText(badge, L + 22, y + 36);
    y += 54 + 28;

    // ── तालिका — आपके नमूने जैसी ───────────────────────────
    //  ⚠️ पहले सादे चौकोर डिब्बे थे। अब गोल कोने, गहरा शीर्ष, बीच में
    //     बँटवारे की लकीर, और उभरी हुई पंक्ति — छपी हुई तालिका जैसी।
    const tRows = rows.slice(0, 6);
    const tw = COL_W, hh = 56, rh = 54;
    const tTop = y, splitX = L + tw * 0.55;
    const tH = hh + rh * tRows.length;

    c.save();
    // पूरी तालिका का गोल डिब्बा
    roundRect(c, L, tTop, tw, tH, 12);
    c.save(); c.clip();

    // शीर्ष पंक्ति — बाएँ गहरा, दाएँ brand का रंग
    c.fillStyle = "#1a1a1a"; c.fillRect(L, y, tw * 0.55, hh);
    const ghd = c.createLinearGradient(splitX, y, splitX, y + hh);
    ghd.addColorStop(0, S.accent); ghd.addColorStop(1, S.dark);
    c.fillStyle = ghd; c.fillRect(splitX, y, tw * 0.45, hh);

    c.fillStyle = "#fff"; c.textAlign = "center";
    c.font = `800 ${fit(colA, tw * 0.5, 25, 800)}px ${B}`;
    c.fillText(colA, L + tw * 0.275, y + 37);
    c.font = `800 ${fit(colB, tw * 0.4, 25, 800)}px ${B}`;
    c.fillText(colB, splitX + tw * 0.225, y + 37);
    y += hh;

    // पंक्तियाँ
    tRows.forEach((r, i) => {
      const hl = r.hi;
      if (hl) {
        const gh = c.createLinearGradient(L, y, L, y + rh);
        gh.addColorStop(0, S.soft); gh.addColorStop(1, "#ffffff");
        c.fillStyle = gh;
      } else c.fillStyle = i % 2 ? "#FAFAFA" : "#FFFFFF";
      c.fillRect(L, y, tw, rh);

      c.strokeStyle = "#E8E8E8"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(L, y + rh); c.lineTo(L + tw, y + rh); c.stroke();

      c.fillStyle = hl ? S.accent : "#333";
      c.font = `${hl ? 800 : 600} ${hl ? 31 : 27}px ${B}`;
      c.fillText(r.a, L + tw * 0.275, y + rh * 0.66);
      c.font = `${hl ? 900 : 700} ${hl ? 33 : 28}px system-ui`;
      c.fillText(r.b, splitX + tw * 0.225, y + rh * 0.66);
      y += rh;
    });

    // बीच की खड़ी लकीर
    c.strokeStyle = "#DDD"; c.lineWidth = 1.5;
    c.beginPath(); c.moveTo(splitX, tTop + hh); c.lineTo(splitX, tTop + tH); c.stroke();
    c.restore();

    // बाहरी किनारा
    c.strokeStyle = S.dark; c.lineWidth = 2.5;
    roundRect(c, L, tTop, tw, tH, 12); c.stroke();
    c.restore();
    c.textAlign = "left";

    // ── तीन ख़ूबियाँ ────────────────────────────────────────
    //  ⚠️ ये सिर्फ़ बाईं चौड़ाई में रहें — पहले पूरी चौड़ाई ले रही थीं और
    //     तीसरी ख़ूबी गाड़ी के डिब्बे के नीचे दब जाती थी।
    y += 54;
    const fList = feats.slice(0, 3);
    const fw = COL_W / Math.max(1, fList.length);
    c.textAlign = "center";
    fList.forEach((f, i) => {
      const cx = L + fw * i + fw / 2;
      const def = ICONS[f.icon] || ICONS.star;
      c.fillStyle = S.soft; c.beginPath(); c.arc(cx, y, 33, 0, 7); c.fill();
      c.strokeStyle = S.accent; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, y, 33, 0, 7); c.stroke();
      def.draw(c, cx, y, 25, S.accent);
      c.fillStyle = "#333";
      c.font = `700 ${fit(f.l1 || "", fw - 12, 21, 700)}px ${B}`;
      c.fillText(f.l1 || "", cx, y + 58);
      c.font = `700 ${fit(f.l2 || "", fw - 12, 21, 700)}px ${B}`;
      c.fillText(f.l2 || "", cx, y + 82);
      if (i < fList.length - 1) {
        c.strokeStyle = "#E4E4E4"; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(L + fw * (i + 1), y - 38); c.lineTo(L + fw * (i + 1), y + 90); c.stroke();
      }
    });
    // ⚠️ पहले 122 था — दूसरी लाइन की मात्रा y+98 तक जाती है और आख़िरी लाइन
    //    का ऊपरी सिरा y+93 पर आ जाता था। दोनों टकराते थे, इसीलिए वो लाइन
    //    ख़ूबियों पर चढ़ी दिखती थी। अब पूरी जगह छोड़ी है।
    y += 145;

    // ── आख़िरी लाइन ─────────────────────────────────────────
    c.textAlign = "left";
    const [fa, fb] = String(footLine).split("|");
    const fp = fit(String(footLine).replace("|", ""), W - L * 2, 29, 700);
    c.font = `700 ${fp}px ${D}`;
    c.fillStyle = S.dark; c.fillText(fa, L, y);
    if (fb) { c.fillStyle = S.accent; c.fillText(fb, L + c.measureText(fa).width, y); }

    // ── दाईं तरफ़ दो गाड़ियाँ ────────────────────────────────
    // ⚠️ यह लाइन slots से पहले ही चाहिए। पहले यह नीचे बनी थी और यहाँ इस्तेमाल
    //    हो रही थी — JavaScript में const अपनी लाइन से पहले छुआ नहीं जा सकता,
    //    इसलिए पूरा पन्ना ख़ाली आ जाता था ("Cannot access 'R' before
    //    initialization" — minify होने पर useStrip का नाम R बन गया था)।
    const useStrip = showStrip && strip.filter((x) => x.img).length >= 2;

    // पट्टी लगी हो तो ऊपर वाली दोनों गाड़ियाँ थोड़ी छोटी, ताकि टकराएँ नहीं
    const slots = useStrip
      ? [{ v: v1, top: 84, h: 320 }, { v: v2, top: 470, h: 330 }]
      : [{ v: v1, top: 88, h: 380 }, { v: v2, top: 560, h: 400 }];
    for (const s of slots) {
      const im = s.v.img ? imgCache.get(s.v.img) : null;
      const failed = s.v.img && imgCache.failed(s.v.img);
      if (im) {
        drawFit(c, im, RX, s.top, RW, s.h, "contain");
      } else {
        c.fillStyle = "#F6F6F6";
        roundRect(c, RX + 10, s.top + 10, RW - 20, s.h - 20, 16); c.fill();
        c.fillStyle = "#B0B0B0"; c.textAlign = "center";
        c.font = `600 22px ${B}`;
        if (failed) {
          c.fillText("photo नहीं खुली", RX + RW / 2, s.top + s.h / 2);
        } else if (s.v.img) {
          c.fillText("आ रही है…", RX + RW / 2, s.top + s.h / 2);
        } else {
          c.fillText("गाड़ी चुनें", RX + RW / 2, s.top + s.h / 2 - 14);
          c.font = `600 17px ${B}`; c.fillStyle = "#C8C8C8";
          c.fillText("नीचे \"गाड़ियाँ\" में", RX + RW / 2, s.top + s.h / 2 + 16);
        }
        c.textAlign = "left";
      }
      if (s.v.name) {
        c.textAlign = "center";
        const np = fit(s.v.name, RW - 20, 38, 900);
        c.font = `900 ${np}px system-ui`;
        c.fillStyle = S.dark;
        c.fillText(s.v.name, RX + RW / 2, s.top + s.h + np * 0.9);
        c.textAlign = "left";
      }
    }

    // ── गाड़ियों की पट्टी + रिबन ────────────────────────────
    //  आपके नमूने में जो 4 गाड़ियों की कतार और उसके नीचे रिबन है, वही।
    if (useStrip) {
      const items = strip.filter((x) => x.img).slice(0, 5);
      const sw = RW, sx = RX, sh = 128;
      const sy = H - BAR - (shopAddr ? ADDR_H : 0) - sh - 62;   // रिबन की जगह समेत

      // सुनहरे किनारे वाला डिब्बा
      c.save();
      c.fillStyle = "#FFFDF3";
      roundRect(c, sx, sy, sw, sh, 14); c.fill();
      c.strokeStyle = "#D4A017"; c.lineWidth = 3;
      roundRect(c, sx, sy, sw, sh, 14); c.stroke();
      c.restore();

      const cw = sw / items.length;
      items.forEach((it, i) => {
        const im = imgCache.get(it.img);
        if (!im) return;
        const bx = sx + cw * i + 6, bw2 = cw - 12, bh2 = sh - 26;
        groundShadow(c, bx + bw2 / 2, sy + sh - 16, bw2 * 0.7, 12, 0.22);
        drawFit(c, im, bx, sy + 8, bw2, bh2, "contain");
      });

      // ⚠️ यह लाइन ग़ायब हो गई थी — रिबन पट्टी के ठीक बीच में बैठ रहा था।
      //    अब पट्टी और रिबन दोनों की अपनी जगह है।
      if (stripText) {
        const rw = Math.min(sw * 0.9, 320), rh = 38;
        const rx2 = sx + (sw - rw) / 2, ry2 = sy + sh + 6;   // पट्टी के नीचे, बीच में नहीं
        ribbon(c, rx2, ry2, rw, rh, { fill: S.accent, dark: S.dark });
        c.textAlign = "center";
        solidText(c, stripText, rx2 + rw / 2, ry2 + rh * 0.68, {
          font: `800 ${fit(stripText, rw - 40, 21, 800)}px ${D}`,
          fill: "#ffffff", shadow: "rgba(0,0,0,0.5)", shadowY: 2, shadowBlur: 3,
          align: "center",
        });
        c.textAlign = "left";
      }
    }

    // ══════════════════════════════════════════════════════════
    //  नीचे की पट्टी — बीच से दो हिस्सों में बँटी
    // ══════════════════════════════════════════════════════════
    //  ⚠️ पिछली बार ग़लत समझा था: मैंने ऊपर-नीचे बाँट दिया था और पते को
    //     अलग पतली पट्टी में डाल दिया — इतना पतला कि पढ़ा ही न जाए।
    //
    //     सही यह है — पट्टी बीच से बाएँ-दाएँ बँटे:
    //        बायाँ  0 → 58%  : दुकान का नाम, जगह, पूरा पता (तीनों साथ)
    //        दायाँ 58% → 100% : सिर्फ़ फ़ोन, अपने अलग सफ़ेद डिब्बे में
    const by = H - BAR;
    const MID = W * 0.58;               // बीच की बँटवारे की रेखा

    // बायाँ हिस्सा — brand के रंग का
    const gL = c.createLinearGradient(0, by, MID, H);
    gL.addColorStop(0, S.accent); gL.addColorStop(1, S.dark);
    c.fillStyle = gL; c.fillRect(0, by, MID, BAR);

    // दायाँ हिस्सा — हरा
    const gR = c.createLinearGradient(MID, by, W, H);
    gR.addColorStop(0, "#0B7A3B"); gR.addColorStop(1, "#064d25");
    c.fillStyle = gR; c.fillRect(MID, by, W - MID, BAR);

    // बीच में तिरछी सफ़ेद धार — दोनों हिस्से साफ़ अलग दिखें
    c.save();
    c.fillStyle = "#FFFFFF";
    c.beginPath();
    c.moveTo(MID - 16, by); c.lineTo(MID + 16, by);
    c.lineTo(MID + 2, H); c.lineTo(MID - 30, H);
    c.closePath(); c.fill();
    c.restore();

    // ऊपर सुनहरी रेखा
    bevelBar(c, 0, by - 6, W, 6, { top: "#FFD24A", bottom: "#C9971A", shine: 0.4 });

    // ── बायाँ हिस्सा : नाम + जगह + पता ─────────────────────
    const LX = 44;
    const LW = MID - LX - 50;

    // दुकान का नाम — सफ़ेद, बड़ा
    const snp = fit(shopName, LW, 46, 800);
    solidText(c, shopName, LX, by + 54, {
      font: `800 ${snp}px ${D}`, fill: "#FFFFFF", fill2: "#F2F2F2",
      shadow: "rgba(0,0,0,0.45)", shadowY: 3, shadowBlur: 4,
    });

    // 📍 जगह
    if (shopPlace) {
      c.save();
      c.fillStyle = "#FFD24A";
      const px2 = LX + 10, py2 = by + 88;
      c.beginPath();
      c.moveTo(px2, py2 + 10);
      c.bezierCurveTo(px2 - 9, py2 - 4, px2 - 8, py2 - 15, px2, py2 - 15);
      c.bezierCurveTo(px2 + 8, py2 - 15, px2 + 9, py2 - 4, px2, py2 + 10);
      c.closePath(); c.fill();
      c.fillStyle = S.dark;
      c.beginPath(); c.arc(px2, py2 - 7, 3.2, 0, 7); c.fill();
      c.restore();

      c.fillStyle = "#FFD24A";
      c.font = `800 ${fit(shopPlace, LW - 34, 26, 800)}px ${D}`;
      c.fillText(shopPlace, LX + 26, by + 92);
    }

    // पूरा पता — मोटा और साफ़, पतला नहीं
    if (shopAddr) {
      c.fillStyle = "#FFFFFF";
      c.font = `700 ${fit(shopAddr, LW + 30, 21, 700)}px ${B}`;
      c.fillText(shopAddr, LX, by + 128);
    }

    // ── दायाँ हिस्सा : सिर्फ़ फ़ोन ──────────────────────────
    const phones = String(phone).split(/[\n,]/).map((x) => x.trim()).filter(Boolean).slice(0, 2);
    const pbX = MID + 34, pbW = W - pbX - 34;
    const pbH = phones.length > 1 ? 112 : 88;
    const pbY = by + (BAR - pbH) / 2;

    c.save();
    c.fillStyle = "#FFFFFF";
    roundRect(c, pbX, pbY, pbW, pbH, 18); c.fill();
    c.strokeStyle = "#FFD24A"; c.lineWidth = 3;
    roundRect(c, pbX, pbY, pbW, pbH, 18); c.stroke();

    // फ़ोन का गोल निशान
    const icr = pbH * 0.30;
    const icx = pbX + icr + 16, icy = pbY + pbH / 2;
    c.fillStyle = "#0B7A3B";
    c.beginPath(); c.arc(icx, icy, icr, 0, 7); c.fill();
    c.fillStyle = "#fff";
    c.font = `700 ${Math.round(icr * 1.05)}px system-ui`;
    c.textAlign = "center"; c.textBaseline = "middle";
    c.fillText("✆", icx, icy + 1);
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    c.restore();

    const tx = icx + icr + 16;
    c.fillStyle = "#0B7A3B"; c.font = `700 16px ${B}`;
    c.fillText("Call Us :", tx, pbY + 28);
    c.fillStyle = "#111";
    const php = phones.length > 1 ? 29 : 36;
    c.font = `900 ${php}px system-ui`;
    phones.forEach((p, i) => c.fillText(p, tx, pbY + (phones.length > 1 ? 60 + i * 34 : 66)));

    // ── logo — बाएँ मालिक का, दाएँ brand का (बाक़ी editors जैसा) ──
    drawBothLogos(c, ownerRef, logoRef, brandId, W, 26, 84);
  }, [h1, h2, body, badge, colA, colB, rows, feats, footLine, shopName, shopSub, shopPlace, shopAddr, phone,
      v1, v2, strip, stripText, showStrip, skin, brandId, bgImg, logoTick, ownerTick, imgCache.tick, fontTick]);

  useEffect(() => { render(); }, [render]);

  // ── भेजना ────────────────────────────────────────────────────
  async function sendToReview() {
    vib(60); setBusy(true); setNote("भेज रहे हैं…");
    try {
      const b64 = cvRef.current.toDataURL("image/jpeg", 0.9);
      const res = await fetch(apiBase + "/api/mega-offer/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          brand: brandId,
          text: caption || `${h1} ${h2}\n${String(body).replace(/\|/g, "")}\n${footLine.replace("|", "")}`,
          imageData: b64, type: "vigyapan",
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      setNote("✅ Review में भेज दिया!"); vib([30, 30, 60]);
      setTimeout(() => { setNote(""); onSent && onSent(); }, 3000);
    } catch (e) { setNote("❌ " + e.message); }
    setBusy(false);
  }

  // सेव की हुई पृष्ठभूमियाँ लाओ
  useEffect(() => {
    fetch(`${apiBase}/api/bg?brand=${brandId}`, { headers: { Authorization: "Bearer " + token } })
      .then((r) => r.json()).then((d) => setBgSaved(d.rows || [])).catch(() => {});
  }, [apiBase, token, brandId]);

  // ⚠️ यही सबसे ज़रूरी है — AI हर बार पैसे लेता है (≈₹4)। पसंद आई तो सेव
  //    कर लीजिए, फिर जब चाहें मुफ़्त में लगाइए।
  async function sahejo() {
    if (!bgImg) return;
    vib(30); setSavingBg(true); setBgErr("");
    try {
      const r = await fetch(`${apiBase}/api/bg/save`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          dataUrl: bgImg, brand: brandId, source: bgSource || "ai",
          name: `पृष्ठभूमि ${(bgSaved.length || 0) + 1}`,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "सेव नहीं हुई");
      setBgSaved((p) => [d.bg, ...p]);
      setBgMsg(`💾 सेव हो गई — ${d.note}`);
      vib([30, 40, 60]);
    } catch (e) { setBgErr(e.message); }
    setSavingBg(false);
  }

  // सेव की हुई लगाओ — कोई पैसा नहीं
  function lagao(b) {
    vib(20);
    setBgImg(b.url);
    setBgMsg(`✅ "${b.name}" लगा दी — कोई ख़र्च नहीं`);
    setBgErr("");
    fetch(`${apiBase}/api/bg/${b._id}/used`, {
      method: "POST", headers: { Authorization: "Bearer " + token },
    }).catch(() => {});
  }

  async function banaoBg() {
    vib(40); setBgBusy(true); setBgErr(""); setBgMsg("AI तस्वीर बना रहा है… 20–40 सेकंड लगते हैं, रुकिए");
    try {
      const r = await fetch(apiBase + "/api/ai-bg", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          brand: brandId, w: 1080, h: 1080,     // ⚠️ server 1080 से बड़ा नहीं लेता
          prompt: "clean modern two-wheeler showroom backdrop, soft blurred city skyline, " +
                  "bright daylight, subtle diagonal geometric pattern on the left, " +
                  "large empty bright area, professional advertising background",
        }),
      });

      // ⚠️ पहले सिर्फ़ "नहीं बनी" दिखता था। अब server जो असली वजह भेजता है
      //    (key नहीं मिली / Google का कोटा शून्य) वही सामने आएगी।
      let d = null;
      try { d = await r.json(); } catch (_) {}

      if (!r.ok || !d?.dataUrl) {
        throw new Error(d?.error || `AI ने जवाब नहीं दिया (${r.status})`);
      }

      setBgImg(d.dataUrl);
      // ⚠️ किस रास्ते से बनी, यह साफ़ बताओ — "pollinations" का मतलब है
      //    Gemini key ने काम नहीं किया और मुफ़्त वाले से बनी है।
      setBgSource(d.source || "ai");
      if (d.source === "gemini") {
        setBgMsg("✅ Gemini से बनी — पसंद आए तो 💾 दबाकर सेव कर लीजिए");
      } else {
        setBgMsg("✅ मुफ़्त वाली सेवा से बनी — पसंद आए तो 💾 सेव कर लीजिए");
        if (d.geminiFailed) setBgErr("Gemini नहीं चला — " + d.geminiFailed);
      }
      vib([30, 40, 60]);
    } catch (e) {
      setBgMsg("");
      setBgErr(e.message);
    }
    setBgBusy(false);
  }

  function download() {
    vib(40);
    cvRef.current.toBlob((b) => {
      const u = URL.createObjectURL(b);
      const a = document.createElement("a");
      a.href = u; a.download = "tulna-poster.jpg";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(u), 4000);
    }, "image/jpeg", 0.92);
  }

  const inp = "w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-2 text-sm text-white outline-none focus:border-neutral-500";
  const lbl = "text-[11px] text-neutral-400 mb-1 block";

  return (
    <div className="space-y-3 pb-10">

      {/* ⚠️ पहले पता ही नहीं चलता था कि पृष्ठभूमि लगी है या नहीं — अब canvas
          के ऊपर ही साफ़ लिखा रहता है */}
      <div className="flex items-center justify-between px-1">
        <span className="text-[11px]" style={{ color: bgImg ? S.accent : "#525252" }}>
          {bgImg ? "🖼️ AI पृष्ठभूमि लगी है" : "⬜ सादा सफ़ेद पृष्ठभूमि"}
        </span>
        {bgImg && (
          <button type="button" onClick={() => { vib(15); setBgImg(""); setBgMsg(""); }}
            className="text-[11px] text-neutral-500 underline">हटाएँ</button>
        )}
      </div>

      <canvas ref={cvRef} className="w-full rounded-xl border border-neutral-800 bg-white" />

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={sendToReview} disabled={busy}
          className="rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40" style={{ background: S.accent }}>
          {busy ? "…" : "✅ Review में भेजें"}
        </button>
        <button type="button" onClick={download}
          className="rounded-xl py-3 text-sm font-bold text-neutral-200 border border-neutral-700">
          ⬇️ Download
        </button>
      </div>

      {note && <div className="rounded-xl px-3 py-2.5 text-sm font-semibold bg-neutral-800 text-neutral-200">{note}</div>}

      {/* पृष्ठभूमि — सादा सफ़ेद या AI से बनी */}
      <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3 space-y-2">
        <p className="text-xs font-bold text-white">पृष्ठभूमि</p>
        {/* ── सेव की हुई — यहीं से चुन लीजिए, कोई ख़र्च नहीं ── */}
        {bgSaved.length > 0 && (
          <div>
            <p className="text-[11px] text-neutral-400 mb-1.5">
              सेव की हुई ({bgSaved.length}) — दबाइए, कोई ख़र्च नहीं
            </p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {bgSaved.map((b) => (
                <button key={b._id} type="button" onClick={() => lagao(b)}
                  className="flex-shrink-0 rounded-lg overflow-hidden border-2"
                  style={{ borderColor: bgImg === b.url ? S.accent : "#333", width: 86 }}>
                  <img src={b.url} alt="" className="w-full h-14 object-cover" />
                  <span className="block text-[9px] text-neutral-500 py-0.5 truncate px-1">{b.name}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => { vib(15); setBgImg(""); setBgMsg(""); setBgErr(""); }}
            className="rounded-lg py-2.5 text-xs border"
            style={{ borderColor: !bgImg ? S.accent : "#333", color: !bgImg ? S.accent : "#888" }}>
            सादा सफ़ेद
          </button>
          <button type="button" onClick={banaoBg} disabled={bgBusy}
            className="rounded-lg py-2.5 text-xs font-semibold text-white disabled:opacity-40"
            style={{ background: S.accent }}>
            {bgBusy ? "बन रही है…" : "✨ AI से बनवाएँ"}
          </button>
        </div>

        {/* ⚠️ AI हर बार ≈₹4 लेता है। सेव कर लीजिए तो दोबारा मुफ़्त। */}
        {bgImg && !bgImg.startsWith("http") && (
          <button type="button" onClick={sahejo} disabled={savingBg}
            className="w-full rounded-lg py-2.5 text-xs font-semibold border-2 disabled:opacity-40"
            style={{ borderColor: "#F59E0B", color: "#FBBF24" }}>
            {savingBg ? "सेव हो रही है…" : "💾 यह पृष्ठभूमि सेव कर लें — दोबारा मुफ़्त लगेगी"}
          </button>
        )}
        {/* ⚠️ हाल यहीं दिखे — पहले यह सन्देश पर्दे में बहुत नीचे था, इसलिए
            बटन दबाने पर "कुछ हुआ ही नहीं" लगता था। */}
        {bgBusy && (
          <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: S.accent, background: S.accent + "18" }}>
            <p className="text-[11px]" style={{ color: S.accent }}>⏳ {bgMsg}</p>
          </div>
        )}
        {!bgBusy && bgMsg && (
          <div className="rounded-lg bg-emerald-900/40 border border-emerald-800 px-2.5 py-2">
            <p className="text-[11px] text-emerald-300">{bgMsg}</p>
          </div>
        )}
        {/* ⚠️ अब बनी हुई तस्वीर की झलक यहीं दिखती है — पहले सिर्फ़ canvas में
            जाती थी और canvas ऊपर था, इसलिए "कुछ हुआ ही नहीं" लगता था। */}
        {bgImg && !bgBusy && (
          <div className="rounded-lg overflow-hidden border" style={{ borderColor: S.accent }}>
            <img src={bgImg} alt="" className="w-full h-24 object-cover" />
            <p className="text-[10px] text-center py-1" style={{ color: S.accent }}>
              ↑ यही पृष्ठभूमि poster पर लगी है — ऊपर देखिए
            </p>
          </div>
        )}
        {bgErr && (
          <div className="rounded-lg bg-amber-900/40 border border-amber-800 px-2.5 py-2">
            <p className="text-[11px] text-amber-300 leading-relaxed">⚠️ {bgErr}</p>
            <p className="text-[10px] text-neutral-500 mt-1">
              AI तस्वीर के बिना भी poster पूरा बनता है — "सादा सफ़ेद" चुन लीजिए।
            </p>
          </div>
        )}

        <p className="text-[10px] text-neutral-600 leading-relaxed">
          AI शोरूम जैसी असली दिखने वाली पृष्ठभूमि बना देगा। लिखाई वाले हिस्से पर
          हल्का सफ़ेद पर्दा रहेगा ताकि सब साफ़ पढ़ा जाए।
          {" "}हर बार दबाने पर नई बनेगी।
        </p>
      </div>

      {/* रंग */}
      <div className="flex gap-1.5">
        {Object.entries(SKINS).map(([id, s]) => (
          <button key={id} type="button" onClick={() => { vib(15); setSkin(id); }}
            className="flex-1 rounded-lg py-2 text-[11px] border"
            style={{ borderColor: skin === id ? s.accent : "#333", color: skin === id ? s.accent : "#888" }}>
            {s.name}
          </button>
        ))}
      </div>

      {/* कौन-सा हिस्सा बदलें */}
      <div className="flex gap-1.5">
        {[["text", "लिखाई"], ["table", "तालिका"], ["feat", "ख़ूबियाँ"], ["veh", "गाड़ियाँ"]].map(([id, l]) => (
          <button key={id} type="button" onClick={() => { vib(15); setTab(id); }}
            className="flex-1 rounded-lg py-2 text-xs font-medium border"
            style={{ borderColor: tab === id ? S.accent : "#262626", background: tab === id ? S.accent + "22" : "transparent", color: tab === id ? S.accent : "#737373" }}>
            {l}
          </button>
        ))}
      </div>

      {/* ══ लिखाई ══ */}
      {tab === "text" && (
        <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3 space-y-2.5">
          <div><span className={lbl}>शीर्षक — पहली लाइन (काली)</span>
            <input value={h1} onChange={(e) => setH1(e.target.value)} className={inp} /></div>
          <div><span className={lbl}>शीर्षक — दूसरी लाइन (रंगीन)</span>
            <input value={h2} onChange={(e) => setH2(e.target.value)} className={inp} /></div>
          <div><span className={lbl}>बीच का पैरा (हर लाइन अलग · "|" के बाद वाला हिस्सा रंगीन होगा)</span>
            <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={4} className={inp + " resize-none"} /></div>
          <div><span className={lbl}>बैज</span>
            <input value={badge} onChange={(e) => setBadge(e.target.value)} className={inp} /></div>
          <div><span className={lbl}>आख़िरी लाइन ("|" से रंग बदलेगा)</span>
            <input value={footLine} onChange={(e) => setFootLine(e.target.value)} className={inp} /></div>
          <div><span className={lbl}>दुकान का नाम</span>
            <input value={shopName} onChange={(e) => setShopName(e.target.value)} className={inp} /></div>
          <div><span className={lbl}>जगह (नाम के नीचे 📍 के साथ)</span>
            <input value={shopPlace} onChange={(e) => setShopPlace(e.target.value)} className={inp}
              placeholder="परवलिया" /></div>
          <div><span className={lbl}>पूरा पता</span>
            <input value={shopAddr} onChange={(e) => setShopAddr(e.target.value)} className={inp}
              placeholder="नरसिंहगढ़ रोड, परवलिया सड़क, भोपाल - 462030" /></div>
          <div><span className={lbl}>फ़ोन — दो नंबर हों तो comma से अलग</span>
            <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp}
              placeholder="9713394738, 8962620890" /></div>
          <div><span className={lbl}>caption (post के साथ जाएगा)</span>
            <textarea value={caption} onChange={(e) => setCaption(e.target.value)} rows={2}
              placeholder="ख़ाली छोड़ेंगे तो poster की लिखाई ही caption बन जाएगी" className={inp + " resize-none"} /></div>
        </div>
      )}

      {/* ══ तालिका ══ */}
      {tab === "table" && (
        <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3 space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <div><span className={lbl}>बायाँ कॉलम</span>
              <input value={colA} onChange={(e) => setColA(e.target.value)} className={inp} /></div>
            <div><span className={lbl}>दायाँ कॉलम</span>
              <input value={colB} onChange={(e) => setColB(e.target.value)} className={inp} /></div>
          </div>

          <span className={lbl}>
            पंक्तियाँ — हर पंक्ति का अपना डिब्बा है। जिस पर ⭐ लगाएँगे वो poster पर उभरकर दिखेगी।
          </span>

          {/* ⚠️ पहले ये डिब्बे बहुत छोटे थे और एक ही लाइन में तीन चीज़ें ठुँसी
              थीं — फ़ोन पर टाइप करना ही मुश्किल था। अब हर पंक्ति अलग कार्ड में। */}
          {rows.map((r, i) => (
            <div key={i} className="rounded-xl bg-neutral-900 border p-2.5 space-y-2"
              style={{ borderColor: r.hi ? S.accent : "#262626" }}>
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-neutral-500">पंक्ति {i + 1}</span>
                <div className="flex gap-1.5">
                  <button type="button"
                    onClick={() => { vib(15); setRows(rows.map((x, j) => ({ ...x, hi: j === i ? !x.hi : false }))); }}
                    className="text-[11px] px-2.5 py-1 rounded-lg border"
                    style={{ borderColor: r.hi ? S.accent : "#333", color: r.hi ? S.accent : "#777" }}>
                    {r.hi ? "⭐ उभरी हुई" : "☆ उभारें"}
                  </button>
                  <button type="button" onClick={() => { vib(15); setRows(rows.filter((_, j) => j !== i)); }}
                    className="text-[11px] px-2.5 py-1 rounded-lg border border-red-900 text-red-400">हटाएँ</button>
                </div>
              </div>
              <div>
                <span className="text-[10px] text-neutral-500">बाएँ क्या लिखा जाए</span>
                <input value={r.a}
                  onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, a: e.target.value } : x))}
                  className={inp} placeholder="जैसे — हीरो" />
              </div>
              <div>
                <span className="text-[10px] text-neutral-500">दाएँ क्या लिखा जाए</span>
                <input value={r.b}
                  onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, b: e.target.value } : x))}
                  className={inp} placeholder="जैसे — 350" />
              </div>
            </div>
          ))}
          {rows.length < 6 && (
            <button type="button" onClick={() => { vib(15); setRows([...rows, { a: "", b: "", hi: false }]); }}
              className="w-full rounded-lg py-2 text-xs border border-neutral-700 text-neutral-400">+ पंक्ति जोड़ें</button>
          )}
        </div>
      )}

      {/* ══ ख़ूबियाँ ══ */}
      {tab === "feat" && (
        <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3 space-y-3">
          {feats.map((f, i) => (
            <div key={i} className="rounded-lg bg-neutral-900 border border-neutral-800 p-2.5 space-y-2">
              <div className="flex gap-1.5 flex-wrap">
                {Object.entries(ICONS).map(([id, d]) => (
                  <button key={id} type="button"
                    onClick={() => { vib(15); setFeats(feats.map((x, j) => j === i ? { ...x, icon: id } : x)); }}
                    className="text-[11px] px-2 py-1 rounded-full border"
                    style={{ borderColor: f.icon === id ? S.accent : "#333", color: f.icon === id ? S.accent : "#888" }}>
                    {d.label}
                  </button>
                ))}
              </div>
              <input value={f.l1} onChange={(e) => setFeats(feats.map((x, j) => j === i ? { ...x, l1: e.target.value } : x))}
                className={inp} placeholder="पहली लाइन" />
              <input value={f.l2} onChange={(e) => setFeats(feats.map((x, j) => j === i ? { ...x, l2: e.target.value } : x))}
                className={inp} placeholder="दूसरी लाइन" />
              {feats.length > 1 && (
                <button type="button" onClick={() => { vib(15); setFeats(feats.filter((_, j) => j !== i)); }}
                  className="text-[11px] text-red-400">हटाएँ</button>
              )}
            </div>
          ))}
          {feats.length < 4 && (
            <button type="button" onClick={() => { vib(15); setFeats([...feats, { icon: "star", l1: "", l2: "" }]); }}
              className="w-full rounded-lg py-2 text-xs border border-neutral-700 text-neutral-400">+ ख़ूबी जोड़ें</button>
          )}
        </div>
      )}

      {/* ══ गाड़ियाँ ══ */}
      {tab === "veh" && (
        <div className="space-y-3">
          {[[v1, setV1, "ऊपर वाली गाड़ी"], [v2, setV2, "नीचे वाली गाड़ी"]].map(([v, setV, title], i) => (
            <div key={i} className="rounded-xl bg-neutral-950 border border-neutral-800 p-3 space-y-2">
              <p className="text-xs font-bold text-white">{title}</p>
              <VehiclePicker apiBase={apiBase} token={token} brandId={brandId} compact
                onPick={(k) => setV({ img: k.photo || "", name: k.fullName || "", noPhoto: !k.photo })} />

              {/* ⚠️ गाड़ी चुन ली पर उसकी photo सेव नहीं — यही सबसे आम उलझन है।
                  पहले चुपचाप ख़ाली डिब्बा दिखता था और लगता था app ख़राब है। */}
              {v.noPhoto && (
                <div className="rounded-lg bg-amber-900/30 border border-amber-800 px-2.5 py-2">
                  <p className="text-[11px] text-amber-300 leading-relaxed">
                    इस गाड़ी की photo सेव नहीं है, इसलिए poster में नहीं आएगी।
                    <br />⚙️ सेटिंग → गाड़ियों की सूची → उस गाड़ी पर ✏️ → 📷 photo डालिए।
                    एक बार डालने पर हमेशा रहेगी।
                  </p>
                </div>
              )}

              <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })}
                className={inp} placeholder="नाम जो poster पर छपेगा" />

              <div>
                <span className={lbl}>या सीधे अपने phone से photo डालिए</span>
                <input type="file" accept="image/*" className="text-[11px] text-neutral-400"
                  onChange={(e) => {
                    const f = e.target.files?.[0]; e.target.value = "";
                    if (!f) return;
                    vib(20);
                    setV((p) => {
                      if (p?.img?.startsWith("blob:")) { try { URL.revokeObjectURL(p.img); } catch (_) {} }
                      return { ...p, img: URL.createObjectURL(f), noPhoto: false };
                    });
                  }} />
              </div>
            </div>
          ))}
          <p className="text-[11px] text-neutral-600">
            गाड़ी चुनते ही उसकी सेव की हुई photo अपने-आप लग जाएगी। photo न लगी हो तो
            ⚙️ सेटिंग → गाड़ियों की सूची में डाल दीजिए।
          </p>

          {/* ── नीचे की पट्टी — "हर ज़रूरत के लिए Honda" वाली ── */}
          <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3 space-y-2.5">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={showStrip} onChange={(e) => { vib(15); setShowStrip(e.target.checked); }}
                className="w-4 h-4" style={{ accentColor: S.accent }} />
              <span className="text-xs font-bold text-white">नीचे कई गाड़ियों की पट्टी</span>
            </label>
            <p className="text-[10px] text-neutral-600">
              आपके नमूने वाली — 2 से 5 गाड़ियाँ एक कतार में, नीचे रिबन।
              कम से कम 2 चुनने पर ही दिखेगी।
            </p>

            {showStrip && (
              <>
                {strip.map((it, i) => (
                  <div key={i} className="flex gap-2 items-center">
                    <div className="w-11 h-11 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {it.img ? <img src={it.img} alt="" className="w-full h-full object-contain" />
                              : <span className="text-[9px] text-neutral-600">—</span>}
                    </div>
                    <span className="flex-1 text-xs text-neutral-300 truncate">{it.name || "चुनी नहीं"}</span>
                    <button type="button" onClick={() => { vib(15); setStrip(strip.filter((_, j) => j !== i)); }}
                      className="text-[11px] px-2.5 py-1.5 rounded-lg border border-red-900 text-red-400">हटाएँ</button>
                  </div>
                ))}

                {strip.length < 5 && (
                  <div>
                    <span className={lbl}>गाड़ी जोड़ें ({strip.length}/5)</span>
                    <VehiclePicker apiBase={apiBase} token={token} brandId={brandId} compact
                      onPick={(k) => {
                        if (!k.photo) { setNote("⚠️ इस गाड़ी की photo सेव नहीं है"); setTimeout(() => setNote(""), 3000); return; }
                        setStrip((p) => [...p, { img: k.photo, name: k.fullName }]);
                      }} />
                  </div>
                )}

                <div>
                  <span className={lbl}>रिबन पर क्या लिखा जाए</span>
                  <input value={stripText} onChange={(e) => setStripText(e.target.value)}
                    className={inp} placeholder="हर ज़रूरत के लिए Honda" />
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
