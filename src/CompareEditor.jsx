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
import { useImageCache, roundRect, drawFit } from "./canvasKit.js";
import { useBrandLogo, useOwnerLogo, drawBrandLogo } from "./brands.js";
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

export default function CompareEditor({ apiBase, token, brandId, onSent }) {
  const cvRef = useRef(null);
  const imgCache = useImageCache();
  const { logo: brandLogo, tick: logoTick } = useBrandLogo(apiBase, brandId);
  const { logo: ownerLogo, tick: ownerTick } = useOwnerLogo(apiBase);

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
  const [phone, setPhone] = useState("9713394738");

  // ── दो गाड़ियाँ ──────────────────────────────────────────────
  const [v1, setV1] = useState({ img: "", name: "", noPhoto: false });
  const [v2, setV2] = useState({ img: "", name: "", noPhoto: false });

  const [caption, setCaption] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("text");   // text | table | feat | veh

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
    c.fillStyle = S.bg; c.fillRect(0, 0, W, H);

    const L = 62;                      // बायाँ हाशिया
    const COL_W = W * 0.50;            // बाईं तरफ़ लिखाई कितनी चौड़ी
    const RX = W * 0.585;              // दाईं तरफ़ गाड़ियों का हिस्सा शुरू
    const RW = W - RX - 46;
    const BAR = 112;                   // नीचे की काली पट्टी

    c.textAlign = "left"; c.textBaseline = "alphabetic";
    const D = '"Noto Sans Devanagari", "Mukta", system-ui, sans-serif';

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
    const p1 = fit(h1, COL_W, 74, 900);
    y += p1;
    c.font = `900 ${p1}px ${D}`; c.fillStyle = S.dark; c.fillText(h1, L, y);

    const p2 = fit(h2, COL_W, 84, 900);
    y += Math.round(p2 * LH);
    c.font = `900 ${p2}px ${D}`; c.fillStyle = S.accent; c.fillText(h2, L, y);

    // नीचे मोटी लकीर
    y += 24;
    c.fillStyle = S.accent; c.fillRect(L, y, Math.round(W * 0.185), 7);
    y += 52;

    // ── बीच का पैरा ─────────────────────────────────────────
    const lines = String(body || "").split("\n").map((x) => x.trim()).filter(Boolean).slice(0, 4);
    const bp = 33;
    c.font = `700 ${bp}px ${D}`;
    for (const ln of lines) {
      y += Math.round(bp * LH);
      const [pre, hi] = ln.split("|");
      c.fillStyle = S.dark; c.fillText(pre, L, y);
      if (hi) { c.fillStyle = S.accent; c.fillText(hi, L + c.measureText(pre).width, y); }
    }

    // ── बैज ─────────────────────────────────────────────────
    y += 40;
    const bp2 = fit(badge, COL_W - 48, 28, 700);
    c.font = `700 ${bp2}px ${D}`;
    const bw = Math.min(c.measureText(badge).width + 44, COL_W);
    c.strokeStyle = S.accent; c.lineWidth = 2.5;
    roundRect(c, L, y, bw, 54, 10); c.stroke();
    c.fillStyle = S.dark; c.fillText(badge, L + 22, y + 36);
    y += 54 + 28;

    // ── तालिका ──────────────────────────────────────────────
    const tRows = rows.slice(0, 6);
    const tw = COL_W, hh = 58, rh = 56;
    const tTop = y, splitX = L + tw * 0.55;

    c.fillStyle = S.dark; c.fillRect(L, y, tw * 0.55, hh);
    c.fillStyle = S.accent; c.fillRect(splitX, y, tw * 0.45, hh);
    c.fillStyle = "#fff"; c.textAlign = "center";
    c.font = `800 ${fit(colA, tw * 0.5, 25, 800)}px ${D}`;
    c.fillText(colA, L + tw * 0.275, y + 39);
    c.font = `800 ${fit(colB, tw * 0.4, 25, 800)}px ${D}`;
    c.fillText(colB, splitX + tw * 0.225, y + 39);
    y += hh;

    tRows.forEach((r, i) => {
      const hl = r.hi;
      c.fillStyle = hl ? S.soft : (i % 2 ? "#FAFAFA" : "#FFFFFF");
      c.fillRect(L, y, tw, rh);
      c.strokeStyle = "#E6E6E6"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(L + 8, y + rh); c.lineTo(L + tw - 8, y + rh); c.stroke();
      c.fillStyle = hl ? S.accent : "#333";
      c.font = `${hl ? 800 : 600} ${hl ? 30 : 27}px ${D}`;
      c.fillText(r.a, L + tw * 0.275, y + rh * 0.66);
      c.font = `${hl ? 900 : 700} ${hl ? 32 : 28}px system-ui`;
      c.fillText(r.b, splitX + tw * 0.225, y + rh * 0.66);
      y += rh;
    });
    c.strokeStyle = "#DCDCDC"; c.lineWidth = 1.5;
    c.strokeRect(L, tTop, tw, hh + rh * tRows.length);

    // ── तीन ख़ूबियाँ ────────────────────────────────────────
    //  ⚠️ ये सिर्फ़ बाईं चौड़ाई में रहें — पहले पूरी चौड़ाई ले रही थीं और
    //     तीसरी ख़ूबी गाड़ी के डिब्बे के नीचे दब जाती थी।
    y += 62;
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
      c.font = `700 ${fit(f.l1 || "", fw - 12, 21, 700)}px ${D}`;
      c.fillText(f.l1 || "", cx, y + 62);
      c.font = `700 ${fit(f.l2 || "", fw - 12, 21, 700)}px ${D}`;
      c.fillText(f.l2 || "", cx, y + 88);
      if (i < fList.length - 1) {
        c.strokeStyle = "#E4E4E4"; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(L + fw * (i + 1), y - 38); c.lineTo(L + fw * (i + 1), y + 96); c.stroke();
      }
    });
    y += 132;

    // ── आख़िरी लाइन ─────────────────────────────────────────
    c.textAlign = "left";
    const [fa, fb] = String(footLine).split("|");
    const fp = fit(String(footLine).replace("|", ""), W - L * 2, 29, 700);
    c.font = `700 ${fp}px ${D}`;
    c.fillStyle = S.dark; c.fillText(fa, L, y);
    if (fb) { c.fillStyle = S.accent; c.fillText(fb, L + c.measureText(fa).width, y); }

    // ── दाईं तरफ़ दो गाड़ियाँ ────────────────────────────────
    const slots = [
      { v: v1, top: 92, h: 400 },
      { v: v2, top: 600, h: 420 },
    ];
    for (const s of slots) {
      const im = s.v.img ? imgCache.get(s.v.img) : null;
      const failed = s.v.img && imgCache.failed(s.v.img);
      if (im) {
        drawFit(c, im, RX, s.top, RW, s.h, "contain");
      } else {
        c.fillStyle = "#F6F6F6";
        roundRect(c, RX + 10, s.top + 10, RW - 20, s.h - 20, 16); c.fill();
        c.fillStyle = "#B0B0B0"; c.textAlign = "center";
        c.font = `600 22px ${D}`;
        if (failed) {
          c.fillText("photo नहीं खुली", RX + RW / 2, s.top + s.h / 2);
        } else if (s.v.img) {
          c.fillText("आ रही है…", RX + RW / 2, s.top + s.h / 2);
        } else {
          c.fillText("गाड़ी चुनें", RX + RW / 2, s.top + s.h / 2 - 14);
          c.font = `600 17px ${D}`; c.fillStyle = "#C8C8C8";
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

    // ── नीचे काली पट्टी ─────────────────────────────────────
    const by = H - BAR;
    c.fillStyle = "#111"; c.fillRect(0, by, W, BAR);
    c.fillStyle = "#fff";
    c.font = `900 ${fit(shopName, W * 0.5, 38, 900)}px ${D}`;
    c.fillText(shopName, L, by + 52);
    c.fillStyle = "#9E9E9E";
    c.font = `600 ${fit(shopSub, W * 0.52, 19, 600)}px ${D}`;
    c.fillText(shopSub, L, by + 84);

    const phones = String(phone).split(/[\n,]/).map((x) => x.trim()).filter(Boolean).slice(0, 2);
    c.textAlign = "right";
    c.fillStyle = "#fff"; c.font = `700 24px system-ui`;
    c.fillText("Call", W - L - 250, by + (phones.length > 1 ? 60 : 62));
    c.font = `900 ${phones.length > 1 ? 32 : 40}px system-ui`;
    phones.forEach((p, i) => c.fillText(p, W - L, by + (phones.length > 1 ? 48 + i * 38 : 68)));
    c.textAlign = "left";

    // ── logo ──
    if (brandLogo) drawBrandLogo(c, brandLogo, W - 110, 40, 70);
    if (ownerLogo) drawBrandLogo(c, ownerLogo, W - 194, 40, 70);
  }, [h1, h2, body, badge, colA, colB, rows, feats, footLine, shopName, shopSub, phone,
      v1, v2, skin, brandLogo, ownerLogo, logoTick, ownerTick, imgCache.tick]);

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
          <div className="grid grid-cols-2 gap-2">
            <div><span className={lbl}>दुकान का नाम</span>
              <input value={shopName} onChange={(e) => setShopName(e.target.value)} className={inp} /></div>
            <div><span className={lbl}>फ़ोन</span>
              <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inp} /></div>
          </div>
          <div><span className={lbl}>दुकान की दूसरी लाइन</span>
            <input value={shopSub} onChange={(e) => setShopSub(e.target.value)} className={inp} /></div>
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

          <span className={lbl}>पंक्तियाँ — जिस पर ⭐ लगाएँगे वो उभरकर दिखेगी</span>
          {rows.map((r, i) => (
            <div key={i} className="flex gap-1.5 items-center">
              <input value={r.a} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, a: e.target.value } : x))}
                className={inp + " flex-1"} placeholder="नाम" />
              <input value={r.b} onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, b: e.target.value } : x))}
                className={inp + " w-24"} placeholder="मान" />
              <button type="button" onClick={() => { vib(15); setRows(rows.map((x, j) => ({ ...x, hi: j === i ? !x.hi : false }))); }}
                className="w-10 h-9 rounded-lg border text-sm flex-shrink-0"
                style={{ borderColor: r.hi ? S.accent : "#333", color: r.hi ? S.accent : "#666" }}>⭐</button>
              <button type="button" onClick={() => { vib(15); setRows(rows.filter((_, j) => j !== i)); }}
                className="w-9 h-9 rounded-lg border border-red-900 text-red-400 text-sm flex-shrink-0">✕</button>
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
        </div>
      )}
    </div>
  );
}
