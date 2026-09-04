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
  const [v1, setV1] = useState({ img: "", name: "" });
  const [v2, setV2] = useState({ img: "", name: "" });

  const [caption, setCaption] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [tab, setTab] = useState("text");   // text | table | feat | veh

  const S = SKINS[skin];

  // ── canvas बनाना ─────────────────────────────────────────────
  const render = useCallback(() => {
    const cv = cvRef.current; if (!cv) return;
    cv.width = W; cv.height = H;
    const c = cv.getContext("2d");
    c.imageSmoothingQuality = "high";
    c.fillStyle = S.bg; c.fillRect(0, 0, W, H);

    const L = 62;                    // बायाँ हाशिया
    const RIGHT_X = W * 0.56;        // दाईं तरफ़ गाड़ियों का हिस्सा

    // ── बड़ा शीर्षक ──
    c.textAlign = "left"; c.textBaseline = "alphabetic";
    const fit = (t, max, start) => { let p = start; do { c.font = `900 ${p}px "Noto Sans Devanagari", system-ui`; p -= 2; } while (c.measureText(t).width > max && p > 22); return p + 2; };
    let y = 150;
    const p1 = fit(h1, W * 0.50, 78);
    c.font = `900 ${p1}px "Noto Sans Devanagari", system-ui`;
    c.fillStyle = S.dark; c.fillText(h1, L, y);
    y += p1 * 1.02;
    const p2 = fit(h2, W * 0.50, 88);
    c.font = `900 ${p2}px "Noto Sans Devanagari", system-ui`;
    c.fillStyle = S.accent; c.fillText(h2, L, y);

    // शीर्षक के नीचे लकीर
    y += 26;
    c.fillStyle = S.accent; c.fillRect(L, y, W * 0.20, 7);
    y += 52;

    // ── बीच का पैरा ──
    const lines = String(body || "").split("\n").filter(Boolean).slice(0, 4);
    c.font = `700 34px "Noto Sans Devanagari", system-ui`;
    for (const ln of lines) {
      // "|" से पहले काला, बाद में रंगीन — जैसे "बने |आसान और भरोसेमंद।"
      const [pre, hi] = ln.split("|");
      c.fillStyle = S.dark; c.fillText(pre, L, y);
      if (hi) { c.fillStyle = S.accent; c.fillText(hi, L + c.measureText(pre).width, y); }
      y += 46;
    }

    // ── बैज ──
    y += 16;
    c.font = `700 29px "Noto Sans Devanagari", system-ui`;
    const bw = c.measureText(badge).width + 44, bh = 56;
    c.strokeStyle = S.accent; c.lineWidth = 2.5;
    roundRect(c, L, y - 38, Math.min(bw, W * 0.50), bh, 10); c.stroke();
    c.fillStyle = S.dark; c.fillText(badge, L + 22, y);
    y += 46;

    // ── तालिका ──
    const tw = W * 0.50, rh = 62, hh = 66;
    const colX = L + tw * 0.55;
    // शीर्ष पंक्ति
    c.fillStyle = S.dark; c.fillRect(L, y, tw * 0.55, hh);
    c.fillStyle = S.accent; c.fillRect(L + tw * 0.55, y, tw * 0.45, hh);
    c.fillStyle = "#fff"; c.font = `800 27px "Noto Sans Devanagari", system-ui`; c.textAlign = "center";
    c.fillText(colA, L + tw * 0.275, y + hh * 0.63);
    c.fillText(colB, L + tw * 0.55 + tw * 0.225, y + hh * 0.63);
    y += hh;
    // पंक्तियाँ
    rows.slice(0, 6).forEach((r, i) => {
      const hl = r.hi;
      c.fillStyle = hl ? S.soft : (i % 2 ? "#FAFAFA" : "#FFFFFF");
      c.fillRect(L, y, tw, rh);
      c.strokeStyle = "#E4E4E4"; c.lineWidth = 1;
      c.beginPath(); c.moveTo(L, y + rh); c.lineTo(L + tw, y + rh); c.stroke();
      c.font = `${hl ? 800 : 600} ${hl ? 32 : 29}px "Noto Sans Devanagari", system-ui`;
      c.fillStyle = hl ? S.accent : "#333";
      c.fillText(r.a, L + tw * 0.275, y + rh * 0.66);
      c.font = `${hl ? 900 : 700} ${hl ? 34 : 30}px system-ui`;
      c.fillText(r.b, L + tw * 0.55 + tw * 0.225, y + rh * 0.66);
      y += rh;
    });
    c.strokeStyle = "#DDD"; c.lineWidth = 1.5; c.strokeRect(L, y - rh * rows.slice(0, 6).length - hh, tw, rh * rows.slice(0, 6).length + hh);

    // ── तीन ख़ूबियाँ ──
    y += 62;
    const fw = (W - L * 2) / Math.max(1, feats.length);
    c.textAlign = "center";
    feats.slice(0, 4).forEach((f, i) => {
      const cx = L + fw * i + fw / 2;
      const def = ICONS[f.icon] || ICONS.star;
      // गोल घेरा
      c.fillStyle = S.soft; c.beginPath(); c.arc(cx, y, 40, 0, 7); c.fill();
      c.strokeStyle = S.accent; c.lineWidth = 2.5; c.beginPath(); c.arc(cx, y, 40, 0, 7); c.stroke();
      def.draw(c, cx, y, 30, S.accent);
      c.fillStyle = "#333"; c.font = `700 24px "Noto Sans Devanagari", system-ui`;
      c.fillText(f.l1, cx, y + 76);
      c.fillText(f.l2, cx, y + 106);
      if (i < feats.length - 1) {
        c.strokeStyle = "#E0E0E0"; c.lineWidth = 1.5;
        c.beginPath(); c.moveTo(L + fw * (i + 1), y - 44); c.lineTo(L + fw * (i + 1), y + 112); c.stroke();
      }
    });
    y += 160;

    // ── आख़िरी लाइन ──
    c.textAlign = "left"; c.font = `700 31px "Noto Sans Devanagari", system-ui`;
    const [fa, fb] = String(footLine).split("|");
    c.fillStyle = S.dark; c.fillText(fa, L, y);
    if (fb) { c.fillStyle = S.accent; c.fillText(fb, L + c.measureText(fa).width, y); }

    // ── दाईं तरफ़ दो गाड़ियाँ ──
    const slots = [
      { v: v1, top: 130, h: 380 },
      { v: v2, top: 600, h: 400 },
    ];
    for (const s of slots) {
      const im = s.v.img ? imgCache.get(s.v.img) : null;
      const bx = RIGHT_X, bw2 = W - RIGHT_X - 40;
      if (im) {
        drawFit(c, im, bx, s.top, bw2, s.h, "contain");
      } else {
        c.fillStyle = "#F5F5F5"; roundRect(c, bx + 20, s.top + 20, bw2 - 40, s.h - 40, 16); c.fill();
        c.fillStyle = "#BBB"; c.font = `600 24px "Noto Sans Devanagari", system-ui`; c.textAlign = "center";
        c.fillText("गाड़ी चुनें", bx + bw2 / 2, s.top + s.h / 2);
        c.textAlign = "left";
      }
      if (s.v.name) {
        c.textAlign = "center";
        c.font = `900 42px system-ui`;
        c.fillStyle = S.dark;
        c.fillText(s.v.name, bx + bw2 / 2, s.top + s.h + 4);
        c.textAlign = "left";
      }
    }

    // ── नीचे काली पट्टी ──
    const barH = 108, byy = H - barH;
    c.fillStyle = "#111"; c.fillRect(0, byy, W, barH);
    c.fillStyle = "#fff"; c.font = `900 40px "Noto Sans Devanagari", system-ui`;
    c.fillText(shopName, L, byy + 52);
    c.fillStyle = "#BBB"; c.font = `600 20px "Noto Sans Devanagari", system-ui`;
    c.fillText(shopSub, L, byy + 84);
    c.textAlign = "right";
    c.fillStyle = "#fff"; c.font = `700 24px system-ui`;
    c.fillText("Call", W - L - 240, byy + 48);
    c.font = `900 42px system-ui`;
    c.fillText(phone, W - L, byy + 56);
    c.textAlign = "left";

    // ── logo ──
    if (brandLogo) drawBrandLogo(c, brandLogo, W - 118, 42, 76);
    if (ownerLogo) drawBrandLogo(c, ownerLogo, W - 210, 42, 76);
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
                onPick={(k) => setV({ img: k.photo || "", name: k.fullName || "" })} />
              <input value={v.name} onChange={(e) => setV({ ...v, name: e.target.value })}
                className={inp} placeholder="नाम जो poster पर छपेगा" />
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
