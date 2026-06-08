import { useState, useRef, useEffect } from "react";

// रंग — server वाले विज्ञापन जैसे ही
const ACCENT = "#E4002B", GOLD = "#ffd400", DARK = "#141414";
const W = 1080, H = 1080;

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function starPts(cx, cy, r, inner, pts) { let p = ""; for (let i = 0; i < pts * 2; i++) { const a = (Math.PI / pts) * i - Math.PI / 2; const rad = i % 2 === 0 ? r : r * inner; p += `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)} `; } return p; }

// sticker/emoji library (drawn — कभी डिब्बा नहीं)
function shapeSVG(name, r) {
  switch (name) {
    case "star": return `<polygon points="${starPts(0, 0, r, 0.42, 5)}" fill="#ffd400" stroke="#e0a800" stroke-width="2"/>`;
    case "heart": return `<path d="M 0 ${r * 0.7} C ${-r * 1.3} ${-r * 0.4}, ${-r * 0.5} ${-r * 1.1}, 0 ${-r * 0.3} C ${r * 0.5} ${-r * 1.1}, ${r * 1.3} ${-r * 0.4}, 0 ${r * 0.7} Z" fill="#e4002b"/>`;
    case "flame": return `<path d="M 0 ${-r} C ${r * 0.9} ${-r * 0.1}, ${r * 0.5} ${r}, 0 ${r} C ${-r * 0.5} ${r}, ${-r * 0.9} ${-r * 0.1}, 0 ${-r} Z" fill="#ff7a00"/><path d="M 0 ${-r * 0.3} C ${r * 0.4} ${r * 0.1}, ${r * 0.2} ${r * 0.7}, 0 ${r * 0.7} C ${-r * 0.2} ${r * 0.7}, ${-r * 0.4} ${r * 0.1}, 0 ${-r * 0.3} Z" fill="#ffd400"/>`;
    case "gift": return `<rect x="${-r}" y="${-r * 0.6}" width="${r * 2}" height="${r * 1.6}" rx="6" fill="#e4002b"/><rect x="${-r * 0.15}" y="${-r * 0.6}" width="${r * 0.3}" height="${r * 1.6}" fill="#ffd400"/><rect x="${-r}" y="${-r * 0.2}" width="${r * 2}" height="${r * 0.3}" fill="#ffd400"/>`;
    case "sparkle": return `<polygon points="${starPts(0, 0, r, 0.3, 4)}" fill="#fff"/><polygon points="${starPts(0, 0, r * 0.6, 0.3, 4)}" fill="#ffd400"/>`;
    case "check": return `<circle cx="0" cy="0" r="${r}" fill="#16a34a"/><path d="M ${-r * 0.45} 0 L ${-r * 0.1} ${r * 0.4} L ${r * 0.5} ${-r * 0.4}" stroke="#fff" stroke-width="${r * 0.18}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "crown": return `<polygon points="${-r},${r * 0.5} ${-r},${-r * 0.4} ${-r * 0.5},0 0,${-r * 0.7} ${r * 0.5},0 ${r},${-r * 0.4} ${r},${r * 0.5}" fill="#ffd400" stroke="#e0a800" stroke-width="2"/>`;
    case "rupee": return `<circle cx="0" cy="0" r="${r}" fill="#1565c0"/><text x="0" y="${r * 0.45}" text-anchor="middle" font-family="Arial" font-size="${r * 1.3}" font-weight="800" fill="#fff">₹</text>`;
    case "sealOffer": return `<polygon points="${starPts(0, 0, r, 0.8, 24)}" fill="#E4002B" stroke="#ffd400" stroke-width="${r * 0.05}"/><text x="0" y="${r * 0.18}" text-anchor="middle" font-family="Arial" font-size="${r * 0.34}" font-weight="800" fill="#fff">ऑफर</text>`;
    case "sealSale": return `<polygon points="${starPts(0, 0, r, 0.85, 32)}" fill="#ffd400"/><circle cx="0" cy="0" r="${r * 0.7}" fill="#E4002B"/><text x="0" y="${r * 0.18}" text-anchor="middle" font-family="Arial" font-size="${r * 0.34}" font-weight="800" fill="#fff">सेल</text>`;
    case "badgeNew": return `<polygon points="${starPts(0, 0, r, 0.7, 16)}" fill="#1565C0"/><text x="0" y="${r * 0.2}" text-anchor="middle" font-family="Arial" font-size="${r * 0.4}" font-weight="800" fill="#ffd400">NEW</text>`;
    case "party": return `<polygon points="${-r},${r} ${r * 0.3},${-r} ${r},${r * 0.3}" fill="#e4002b"/><polygon points="${starPts(r * 0.5, -r * 0.55, r * 0.3, 0.4, 5)}" fill="#ffd400"/><circle cx="${-r * 0.3}" cy="${-r * 0.1}" r="${r * 0.1}" fill="#0ea36a"/>`;
    case "thumbsup": return `<circle cx="0" cy="0" r="${r}" fill="#1565c0"/><path d="M ${-r * 0.4} ${r * 0.5} v ${-r * 0.55} h ${r * 0.22} v ${r * 0.55} z M ${-r * 0.1} ${r * 0.5} v ${-r * 0.7} c 0,${-r * 0.45} ${r * 0.45},${-r * 0.5} ${r * 0.4},${-r * 0.05} l ${-r * 0.07} ${r * 0.28} h ${r * 0.32} c ${r * 0.11},0 ${r * 0.11},${r * 0.18} 0,${r * 0.45} h ${-r * 0.7} z" fill="#fff"/>`;
    case "loc": return `<path d="M 0 ${r} C ${-r} ${-r * 0.2}, ${-r} ${-r * 1.1}, 0 ${-r * 1.1} C ${r} ${-r * 1.1}, ${r} ${-r * 0.2}, 0 ${r} Z" fill="#E4002B"/><circle cx="0" cy="${-r * 0.45}" r="${r * 0.36}" fill="#fff"/>`;
    case "phone": return `<circle cx="0" cy="0" r="${r}" fill="#16a34a"/><path d="M ${-r * 0.32} ${-r * 0.38} q ${-r * 0.14} ${r * 0.04} ${-r * 0.06} ${r * 0.32} q ${r * 0.2} ${r * 0.56} ${r * 0.6} ${r * 0.44} l ${r * 0.06} ${-r * 0.2} l ${-r * 0.22} ${-r * 0.14} l ${-r * 0.12} ${r * 0.09} q ${-r * 0.16} ${-r * 0.11} ${-r * 0.22} ${-r * 0.32} l ${r * 0.1} ${-r * 0.11} l ${-r * 0.12} ${-r * 0.22} z" fill="#fff"/>`;
    case "whatsapp": return `<circle cx="0" cy="0" r="${r}" fill="#25D366"/><path d="M ${-r * 0.3} ${-r * 0.36} q ${-r * 0.14} ${r * 0.04} ${-r * 0.06} ${r * 0.32} q ${r * 0.2} ${r * 0.54} ${r * 0.58} ${r * 0.42} l ${r * 0.06} ${-r * 0.2} l ${-r * 0.22} ${-r * 0.14} l ${-r * 0.12} ${r * 0.09} q ${-r * 0.16} ${-r * 0.11} ${-r * 0.22} ${-r * 0.32} l ${r * 0.1} ${-r * 0.11} l ${-r * 0.12} ${-r * 0.2} z" fill="#fff"/>`;
    case "tick": return `<circle cx="0" cy="0" r="${r}" fill="#16a34a"/><path d="M ${-r * 0.45} 0 L ${-r * 0.1} ${r * 0.4} L ${r * 0.5} ${-r * 0.42}" stroke="#fff" stroke-width="${r * 0.2}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "arrowR": return `<polygon points="${-r * 0.6},${-r * 0.32} ${r * 0.1},${-r * 0.32} ${r * 0.1},${-r * 0.62} ${r * 0.75},0 ${r * 0.1},${r * 0.62} ${r * 0.1},${r * 0.32} ${-r * 0.6},${r * 0.32}" fill="#E4002B"/>`;
    case "arrowD": return `<polygon points="${-r * 0.32},${-r * 0.6} ${-r * 0.32},${r * 0.1} ${-r * 0.62},${r * 0.1} 0,${r * 0.75} ${r * 0.62},${r * 0.1} ${r * 0.32},${r * 0.1} ${r * 0.32},${-r * 0.6}" fill="#E4002B"/>`;
    default: return "";
  }
}
const PALETTE = ["star", "heart", "flame", "gift", "sparkle", "check", "crown", "rupee", "party", "thumbsup", "sealOffer", "sealSale", "badgeNew"];
// आकर्षक बटन/बैज library (editable text — "|" से दो लाइन)
function buildBadge(style, text) {
  const [l1, l2] = String(text || "").split("|").map((s) => s.trim());
  const F = "Arial,sans-serif";
  const two = (c1, c2, f1, f2, y1, y2) => `<text x="0" y="${y1}" text-anchor="middle" font-family="${F}" font-size="${f1}" font-weight="700" fill="${c1}">${esc(l1 || "")}</text>` + (l2 ? `<text x="0" y="${y2}" text-anchor="middle" font-family="${F}" font-size="${f2}" font-weight="800" fill="${c2}">${esc(l2)}</text>` : "");
  switch (style) {
    case "ribbonRed": return `<polygon points="-170,-46 160,-52 170,46 -160,52" fill="#E4002B"/><polygon points="-170,-46 -150,0 -170,46" fill="#7a0016"/>` + two("#fff", "#ffd400", 26, 40, -6, 34);
    case "tagYellow": return `<path d="M -150,-50 H 168 V 50 H -150 L -178,0 Z" fill="#ffd400"/>` + two("#111", "#E4002B", 24, 42, -4, 36);
    case "slantDual": return `<g transform="skewX(-8)"><rect x="-170" y="-46" width="180" height="92" fill="#141414"/><rect x="10" y="-46" width="170" height="92" fill="#E4002B"/></g><text x="-80" y="6" text-anchor="middle" font-family="${F}" font-size="24" font-weight="700" fill="#fff">${esc(l1 || "")}</text><text x="95" y="14" text-anchor="middle" font-family="${F}" font-size="44" font-weight="800" fill="#ffd400">${esc(l2 || "")}</text>`;
    case "pillBlack": return `<rect x="-170" y="-44" width="340" height="88" rx="44" fill="#141414"/>` + two("#ffd400", "#fff", 24, 40, -4, 34);
    case "burstPrice": { let p = ""; for (let i = 0; i < 48; i++) { const a = Math.PI / 24 * i; const rad = i % 2 === 0 ? 92 : 78; p += `${(rad * Math.cos(a)).toFixed(1)},${(rad * Math.sin(a)).toFixed(1)} `; } return `<polygon points="${p}" fill="#E4002B" stroke="#ffd400" stroke-width="4"/>` + two("#fff", "#fff", 22, 38, -6, 30); }
    case "flagGreen": return `<polygon points="-160,-46 160,-46 160,46 -160,46 -140,0" fill="#0ca678"/>` + two("#fff", "#ffd400", 24, 40, -4, 34);
    case "cornerOffer": return `<polygon points="-150,-48 170,-48 170,48 -150,48" fill="#ffd400"/><polygon points="-150,-48 -150,48 -90,0" fill="#E4002B"/>` + two("#E4002B", "#111", 22, 42, -4, 36);
    case "bookingOpen": return `<rect x="-175" y="-42" width="350" height="84" rx="10" fill="#141414"/><rect x="-175" y="-42" width="14" height="84" fill="#E4002B"/><rect x="161" y="-42" width="14" height="84" fill="#E4002B"/>` + two("#fff", "#ffd400", 30, 40, 4, 0);
    default: return "";
  }
}
const BADGES = [
  { style: "ribbonRed", label: "रिबन (लाल)", def: "डाउन पेमेंट|₹4999" },
  { style: "tagYellow", label: "टैग (पीला)", def: "एक्स-शोरूम|₹71896" },
  { style: "slantDual", label: "दो-भाग", def: "डाउन|₹4999" },
  { style: "pillBlack", label: "पिल (काला)", def: "कैशबैक ₹5000" },
  { style: "burstPrice", label: "स्टार बर्स्ट", def: "ऑफर|₹10000" },
  { style: "flagGreen", label: "फ्लैग (हरा)", def: "फ्री गिफ्ट" },
  { style: "cornerOffer", label: "कॉर्नर ऑफर", def: "स्पेशल|ऑफर" },
  { style: "bookingOpen", label: "बुकिंग", def: "BOOKING OPEN" },
];
const DRAFT_KEY = "vphonda_promo_drafts";
const PICK = [
  { group: "इमोजी", items: [["emoji:star", "⭐ स्टार"], ["emoji:heart", "❤️ दिल"], ["emoji:flame", "🔥 आग"], ["emoji:gift", "🎁 गिफ्ट"], ["emoji:sparkle", "✨ चमक"], ["emoji:party", "🎉 पार्टी"], ["emoji:thumbsup", "👍 लाइक"], ["emoji:crown", "👑 ताज"]] },
  { group: "सिंबल / आइकॉन", items: [["emoji:loc", "📍 लोकेशन"], ["emoji:phone", "📞 फ़ोन"], ["emoji:whatsapp", "💬 WhatsApp"], ["emoji:tick", "✔️ टिक"], ["emoji:check", "✅ चेक"], ["emoji:rupee", "₹ रुपया"]] },
  { group: "तीर / Arrow", items: [["emoji:arrowR", "➡️ दायाँ तीर"], ["emoji:arrowD", "⬇️ नीचे तीर"]] },
  { group: "बटन / बैज (text बदलें)", items: BADGES.map((b) => ["badge:" + b.style, b.label]) },
  { group: "CTA (एक्शन बटन)", items: [["cta:आज ही बुक करें", "👉 आज ही बुक करें"], ["cta:अभी कॉल करें", "📞 अभी कॉल करें"], ["cta:शोरूम विज़िट करें", "🏬 शोरूम विज़िट करें"], ["cta:लिमिटेड ऑफर", "🔥 लिमिटेड ऑफर"], ["cta:बेस्ट डील", "🏆 बेस्ट डील"]] },
];
function readDrafts() { try { return JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]"); } catch (_) { return []; } }
function writeDrafts(list) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(list)); return true; } catch (_) { return false; } }
function downscale(dataUrl, max) { return new Promise((res) => { const im = new Image(); im.onload = () => { const s = Math.min(max / im.naturalWidth, max / im.naturalHeight, 1); const c = document.createElement("canvas"); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s); c.getContext("2d").drawImage(im, 0, 0, c.width, c.height); try { res(c.toDataURL("image/png")); } catch (_) { res(null); } }; im.onerror = () => res(null); im.src = dataUrl; }); }
const TEMPLATES = [
  { id: "split", label: "Split (हल्का)", bg: "light", pos: { model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 184 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 } } },
  { id: "bold", label: "लाल बोल्ड", bg: "red", pos: { model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 210 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 } } },
  { id: "dark", label: "गहरा प्रीमियम", bg: "dark", pos: { model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 210 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 } } },
  { id: "festive", label: "त्यौहार ऑफर", bg: "festive", pos: { model: { x: 54, y: 160 }, logo: { x: 900, y: 30 }, bike: { x: 280, y: 250 }, price: { x: 54, y: 700 }, offer: { x: 560, y: 685 } } },
];

export default function PromoEditor({ apiBase, token, brandId, onSent }) {
  const [f, setF] = useState({ model: "Shine 100", price: "71896", down: "4999", cashback: "10000", features: "High Mileage, Tubeless, Self Start, Digital Meter", phone: "9713394738", place: "VP Honda, परवलिया सड़क, भोपाल", brand: "VP Honda" });
  const [bg, setBg] = useState("light");
  const [aiBg, setAiBg] = useState(null);
  const [template, setTemplate] = useState("split");
  const [bgColor, setBgColor] = useState("#1565c0");
  const [bikeImg, setBikeImg] = useState(null);
  const [rawBike, setRawBike] = useState(null);
  const [removeBg, setRemoveBg] = useState(true);
  const [bikeDim, setBikeDim] = useState({ w: 560, h: 380 });
  const [bikeScale, setBikeScale] = useState(1);
  const [pos, setPos] = useState({ model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 184 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 } });
  const [stickers, setStickers] = useState([]);
  const [selStk, setSelStk] = useState(null);
  const [drafts, setDrafts] = useState([]);
  useEffect(() => { setDrafts(readDrafts()); }, []);
  const [note, setNote] = useState("किसी भी चीज़ को उँगली से पकड़कर खिसकाएँ");
  const svgRef = useRef(null);
  const drag = useRef(null);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  // flood-fill background remover (किनारों से) — सादा/एक-रंग bg हटाता है, गाड़ी के अंदर का सफ़ेद बचाता है
  function floodRemove(img) {
    const c = document.createElement("canvas"); c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext("2d"); ctx.drawImage(img, 0, 0);
    let d; try { d = ctx.getImageData(0, 0, c.width, c.height); } catch (e) { return img.src; }
    const a = d.data, w = c.width, h = c.height;
    const sr = [], sg = [], sb = [];
    for (let x = 0; x < w; x += 5) { for (const y of [0, h - 1]) { const i = (y * w + x) * 4; sr.push(a[i]); sg.push(a[i + 1]); sb.push(a[i + 2]); } }
    for (let y = 0; y < h; y += 5) { for (const x of [0, w - 1]) { const i = (y * w + x) * 4; sr.push(a[i]); sg.push(a[i + 1]); sb.push(a[i + 2]); } }
    const med = (arr) => { arr.sort((p, q) => p - q); return arr[Math.floor(arr.length / 2)]; };
    const br = med(sr), bgc = med(sg), bb = med(sb), T = 55;
    const close = (i) => Math.abs(a[i] - br) < T && Math.abs(a[i + 1] - bgc) < T && Math.abs(a[i + 2] - bb) < T;
    const vis = new Uint8Array(w * h), st = [];
    for (let x = 0; x < w; x++) { st.push(x, x + (h - 1) * w); }
    for (let y = 0; y < h; y++) { st.push(y * w, y * w + w - 1); }
    while (st.length) { const p = st.pop(); if (p < 0 || p >= w * h || vis[p]) continue; const i = p * 4; if (!close(i)) continue; vis[p] = 1; a[i + 3] = 0; const x = p % w, y = (p / w) | 0; if (x + 1 < w) st.push(p + 1); if (x > 0) st.push(p - 1); if (y + 1 < h) st.push(p + w); if (y > 0) st.push(p - w); }
    ctx.putImageData(d, 0, 0); return c.toDataURL("image/png");
  }
  function onBike(e) { const file = e.target.files && e.target.files[0]; if (!file) return; const r = new FileReader(); r.onload = () => setRawBike(r.result); r.readAsDataURL(file); }
  useEffect(() => {
    if (!rawBike) { setBikeImg(null); return; }
    const img = new Image();
    img.onload = () => {
      const s = Math.min(560 / img.naturalWidth, 400 / img.naturalHeight, 1);
      setBikeDim({ w: Math.round(img.naturalWidth * s), h: Math.round(img.naturalHeight * s) });
      setBikeImg(removeBg ? floodRemove(img) : rawBike);
    };
    img.src = rawBike;
  }, [rawBike, removeBg]);
  // असली AI remover (free, browser ML) — ज़रूरत पर ही load; पहली बार model download होगा
  async function aiRemove() {
    if (!rawBike) { setNote("पहले गाड़ी की फोटो डालें"); return; }
    setNote("AI model load हो रहा है… पहली बार थोड़ा समय व internet लगेगा");
    try {
      const mod = await import(/* @vite-ignore */ "https://cdn.jsdelivr.net/npm/@imgly/background-removal@1.5.5/dist/index.mjs");
      const fn = mod.removeBackground || (mod.default && mod.default.removeBackground);
      if (!fn) throw new Error("lib");
      const blob = await fn(rawBike);
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { const s = Math.min(560 / img.naturalWidth, 400 / img.naturalHeight, 1); setBikeDim({ w: Math.round(img.naturalWidth * s), h: Math.round(img.naturalHeight * s) }); setBikeImg(url); setNote("AI से background हट गया ✔"); };
      img.src = url;
    } catch (e) { setNote("AI remover अभी लोड नहीं हुआ — internet जाँचें, या तेज़ remover (checkbox) इस्तेमाल करें"); }
  }

  function pointerDown(e) {
    const g = e.target.closest("[data-el]"); if (!g) return;
    const el = g.getAttribute("data-el");
    const rect = svgRef.current.getBoundingClientRect();
    const scale = W / rect.width;
    if (el.startsWith("stk:")) {
      const id = el.slice(4); const s = stickers.find((x) => x.id === id); if (!s) return;
      setSelStk(id); drag.current = { id, sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y, scale, stk: true };
      setNote("sticker चुना — खिसकाएँ, नीचे size बदलें/हटाएँ");
    } else {
      drag.current = { el, sx: e.clientX, sy: e.clientY, ox: pos[el].x, oy: pos[el].y, scale };
      setNote("चुना: " + el + " — अब खिसकाएँ");
    }
    svgRef.current.setPointerCapture(e.pointerId);
  }
  function pointerMove(e) {
    const d = drag.current; if (!d) return;
    const nx = Math.round(d.ox + (e.clientX - d.sx) * d.scale);
    const ny = Math.round(d.oy + (e.clientY - d.sy) * d.scale);
    if (d.stk) setStickers((arr) => arr.map((s) => (s.id === d.id ? { ...s, x: nx, y: ny } : s)));
    else setPos((p) => ({ ...p, [d.el]: { x: nx, y: ny } }));
  }
  function pointerUp() { drag.current = null; }

  function addSticker(name) { const id = "s" + Date.now(); setStickers((a) => [...a, { id, kind: "shape", name, x: 540, y: 430, r: 60 }]); setSelStk(id); setNote("sticker जुड़ा — drag करें"); }
  function addBadge(style, def) { const id = "b" + Date.now(); setStickers((a) => [...a, { id, kind: "badge", style, text: def, x: 540, y: 440, r: 60 }]); setSelStk(id); setNote("बैज जुड़ा — drag करें, नीचे text बदलें"); }
  function addItem(v) { if (!v) return; const i = v.indexOf(":"); const k = v.slice(0, i), rest = v.slice(i + 1); if (k === "emoji") addSticker(rest); else if (k === "badge") { const b = BADGES.find((x) => x.style === rest); addBadge(rest, b ? b.def : ""); } else if (k === "cta") addBadge("bookingOpen", rest); }
  async function saveDraft() {
    let img = null; if (bikeImg) img = await downscale(bikeImg, 760);
    const draft = { id: Date.now(), name: (f.model || "poster") + " · " + new Date().toLocaleString("hi-IN"), state: { f, bg, bgColor, template, pos, bikeScale, stickers, img } };
    let list = readDrafts(); list.unshift(draft); list = list.slice(0, 8);
    if (!writeDrafts(list)) { draft.state.img = null; list[0] = draft; list = list.slice(0, 5); writeDrafts(list); }
    setDrafts(list); setNote("✔ Draft save हो गया — नीचे 'खोलें' से दोबारा खोल सकते हैं");
  }
  function openDraft(id) {
    const d = readDrafts().find((x) => String(x.id) === String(id)); if (!d) return; const s = d.state;
    setF(s.f); setBg(s.bg); setBgColor(s.bgColor || "#1565c0"); setTemplate(s.template || "split"); setPos(s.pos); setBikeScale(s.bikeScale || 1); setStickers(s.stickers || []); setSelStk(null);
    if (s.img) { setRemoveBg(false); setRawBike(s.img); } else { setRawBike(null); }
    setNote("Draft खुल गया — edit करें");
  }
  function delDraft(id) { const list = readDrafts().filter((x) => String(x.id) !== String(id)); writeDrafts(list); setDrafts(list); }
  async function aiBackground() {
    if (!apiBase) { setNote("AI background के लिए app deploy ज़रूरी"); return; }
    setNote("🖼️ AI background बना रहे हैं… (free service, थोड़ा समय लग सकता है)");
    try {
      const res = await fetch(apiBase + "/api/ai-bg", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ brand: brandId || "vp_honda", prompt: (f.model || "") + " premium showroom backdrop", w: 1080, h: 1080 }) });
      const j = await res.json();
      if (!res.ok || !j.dataUrl) throw new Error(j.error || "fail");
      setAiBg(j.dataUrl); setNote("✔ AI background लग गया");
    } catch (e) { setNote("AI background नहीं बना: " + e.message); }
  }
  async function aiText() {
    if (!apiBase) { setNote("AI text के लिए app deploy ज़रूरी"); return; }
    setNote("✨ AI से लिख रहे हैं…");
    try {
      const res = await fetch(apiBase + "/api/ai-text", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ brand: brandId || "vp_honda", type: "vigyapan" }) });
      const j = await res.json();
      if (!res.ok || !j.text) throw new Error(j.error || "fail");
      set("features", j.text.split("\n")[0].replace(/[📞🎁🪔🚀✅🙏]/g, "").slice(0, 60).trim());
      setNote("✔ AI ने tagline लिखी (key हो तो असली AI; वरना template) — feature strip में डाली");
    } catch (e) { setNote("AI text नहीं बना: " + e.message); }
  }
  function delStk() { setStickers((a) => a.filter((s) => s.id !== selStk)); setSelStk(null); }
  function resetPos() { setPos({ model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 184 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 } }); setBikeScale(1); }

  function renderCanvas(story) {
    return new Promise((resolve, reject) => {
      const svgStr = svgRef.current.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        const c = document.createElement("canvas");
        const ctx = c.getContext("2d");
        if (story) { c.width = 1080; c.height = 1920; ctx.fillStyle = padFill; ctx.fillRect(0, 0, 1080, 1920); ctx.drawImage(img, 0, (1920 - 1080) / 2, 1080, 1080); }
        else { c.width = 1080; c.height = 1080; ctx.drawImage(img, 0, 0, 1080, 1080); }
        URL.revokeObjectURL(url); resolve(c);
      };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("render")); };
      img.src = url;
    });
  }
  function download(story) {
    renderCanvas(story).then((c) => { const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "vphonda-" + (story ? "story" : "square") + ".png"; a.click(); })
      .catch(() => setNote("download में दिक्कत — दोबारा कोशिश करें"));
  }
  // edited poster → Review queue (फिर FB/IG/WA post हो सकता है)
  async function sendToQueue() {
    if (!apiBase || !token) { setNote("queue उपलब्ध नहीं — सीधे download कर लें"); return; }
    setNote("Review में भेज रहे हैं…");
    try {
      const [sq, st] = await Promise.all([renderCanvas(false), renderCanvas(true)]);
      const toBlob = (c) => new Promise((res) => c.toBlob((b) => res(b), "image/png"));
      const [bSq, bSt] = await Promise.all([toBlob(sq), toBlob(st)]);
      const fd = new FormData();
      fd.append("brand", brandId || "vp_honda");
      fd.append("model", f.model);
      fd.append("caption", `${f.model} अब ${f.place} पर!\nएक्स-शोरूम ₹${f.price} • डाउन ₹${f.down} • कैशबैक ₹${f.cashback}\nफ़ोन ${f.phone}`);
      fd.append("square", bSq, "square.png");
      if (bSt) fd.append("story", bSt, "story.png");
      const res = await fetch(apiBase + "/api/promo-image", { method: "POST", headers: { Authorization: "Bearer " + token }, body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "fail");
      setNote("✔ Review में आ गया — कंटेंट/Review में जाकर approve व post करें");
      if (onSent) onSent();
    } catch (e) { setNote("भेजने में दिक्कत: " + e.message); }
  }

  function isDarkHex(h) { const c = h.replace("#", ""); const r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16); return (0.299 * r + 0.587 * g + 0.114 * b) < 140; }
  const textMain = (bg === "red" || bg === "dark" || bg === "festive" || (bg === "custom" && isDarkHex(bgColor))) ? "#fff" : DARK;
  const feats = f.features.split(",").map((s) => s.trim()).filter(Boolean).join("   |   ");
  const bgRect = bg === "red"
    ? `<defs><linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${ACCENT}"/><stop offset="100%" stop-color="#7a0016"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bgg)"/>`
    : bg === "dark"
      ? `<rect width="${W}" height="${H}" fill="#141414"/>`
      : bg === "festive"
        ? `<defs><radialGradient id="fg" cx="50%" cy="35%" r="80%"><stop offset="0%" stop-color="#ff9d2e"/><stop offset="100%" stop-color="#c1121f"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#fg)"/>`
        : bg === "custom"
          ? `<rect width="${W}" height="${H}" fill="${bgColor}"/>`
          : `<defs><pattern id="diag" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="40" height="40" fill="#f4f4f4"/><line x1="0" y1="0" x2="0" y2="40" stroke="#ececec" stroke-width="6"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#diag)"/>`;
  const padFill = bg === "red" ? ACCENT : bg === "dark" ? "#141414" : bg === "festive" ? "#c1121f" : bg === "custom" ? bgColor : "#f4f4f4";
  // त्यौहार वाली bunting (top झालर)
  const bunting = template === "festive"
    ? Array.from({ length: 16 }).map((_, i) => { const x = i * (W / 16); const col = ["#e4002b", "#ffd400", "#0ea36a", "#1565c0", "#ff8a00"][i % 5]; return `<polygon points="${x},0 ${x + W / 16},0 ${x + W / 32},38" fill="${col}"/>`; }).join("")
    : "";
  function applyTemplate(id) { const t = TEMPLATES.find((x) => x.id === id); if (!t) return; setTemplate(id); setBg(t.bg); setPos(JSON.parse(JSON.stringify(t.pos))); }

  const bikeG = bikeImg
    ? `<g data-el="bike" transform="translate(${pos.bike.x},${pos.bike.y}) scale(${bikeScale})" style="cursor:move"><ellipse cx="${bikeDim.w / 2}" cy="${bikeDim.h * 0.98}" rx="${bikeDim.w * 0.42}" ry="${bikeDim.h * 0.07}" fill="#000" opacity="0.22"/><image href="${bikeImg}" width="${bikeDim.w}" height="${bikeDim.h}"/></g>`
    : `<g data-el="bike" transform="translate(${pos.bike.x},${pos.bike.y})" style="cursor:move"><rect width="560" height="360" rx="12" fill="#00000010" stroke="#999" stroke-width="2" stroke-dasharray="10 8"/><text x="280" y="190" text-anchor="middle" font-family="Arial" font-size="28" fill="#777">गाड़ी की फोटो upload करें</text></g>`;

  const inner = `
    ${aiBg ? `<image href="${aiBg}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>` : bgRect}
    ${bunting}
    <rect x="0" y="0" width="${W}" height="8" fill="${ACCENT}"/>
    ${bikeG}
    <g data-el="model" transform="translate(${pos.model.x},${pos.model.y})" style="cursor:move"><text x="0" y="0" font-family="Arial,sans-serif" font-size="86" font-weight="800" fill="${textMain}">${esc(f.model)}</text><rect x="2" y="18" width="240" height="9" fill="${ACCENT}"/></g>
    <g data-el="price" transform="translate(${pos.price.x},${pos.price.y})" style="cursor:move"><g transform="rotate(-4)"><rect x="0" y="0" width="430" height="46" fill="${ACCENT}"/><text x="18" y="33" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#fff">एक्स-शोरूम कीमत</text><rect x="0" y="46" width="430" height="80" fill="${DARK}"/><text x="18" y="106" font-family="Arial,sans-serif" font-size="72" font-weight="800" fill="#fff">₹${esc(f.price)}</text></g></g>
    <g data-el="offer" transform="translate(${pos.offer.x},${pos.offer.y})" style="cursor:move"><text x="0" y="0" font-family="Arial,sans-serif" font-size="32" font-weight="800" fill="${textMain}">लिमिटेड पीरियड ऑफर</text><rect x="0" y="14" width="460" height="58" rx="8" fill="#ffd400"/><text x="18" y="52" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#111">डाउन पेमेंट</text><text x="442" y="55" text-anchor="end" font-family="Arial,sans-serif" font-size="42" font-weight="800" fill="${ACCENT}">₹${esc(f.down)}</text><rect x="0" y="82" width="460" height="58" rx="8" fill="${ACCENT}"/><text x="18" y="120" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#fff">कैशबैक</text><text x="442" y="123" text-anchor="end" font-family="Arial,sans-serif" font-size="42" font-weight="800" fill="#fff">₹${esc(f.cashback)}</text></g>
    <rect x="0" y="853" width="${W}" height="60" fill="${ACCENT}"/><text x="540" y="892" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#fff">${esc(feats)}</text>
    <rect x="0" y="929" width="${W}" height="151" fill="${DARK}"/>
    <rect x="36" y="951" width="1008" height="106" rx="30" fill="#1f1f1f" stroke="${GOLD}" stroke-width="3"/>
    <path d="M 86 1012 C 66 985, 66 974, 86 974 C 106 974, 106 985, 86 1012 Z" fill="${GOLD}"/><circle cx="86" cy="987" r="7" fill="${DARK}"/>
    <text x="130" y="993" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="40" font-weight="800" fill="${GOLD}">${esc(f.brand)}</text>
    <text x="1010" y="993" text-anchor="end" font-family="Arial,sans-serif" font-size="36" font-weight="800" fill="#fff">फ़ोन ${esc(f.phone)}</text>
    <text x="130" y="1039" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="27" fill="#e8e8e8">${esc(f.place)}</text>
    <text x="1050" y="918" text-anchor="end" font-family="Arial" font-size="18" fill="#888">T&amp;C Apply</text>
    <g data-el="logo" transform="translate(${pos.logo.x},${pos.logo.y})" style="cursor:move"><circle cx="62" cy="62" r="60" fill="${DARK}"/><circle cx="62" cy="62" r="60" fill="none" stroke="${ACCENT}" stroke-width="5"/><text x="62" y="80" text-anchor="middle" font-family="Arial,sans-serif" font-size="46" font-weight="800" fill="#fff">VP</text></g>
    ${stickers.map((s) => { const body = s.kind === "badge" ? `<g transform="scale(${(s.r / 60).toFixed(3)})">${buildBadge(s.style, s.text)}</g>` : shapeSVG(s.name, s.r); return `<g data-el="stk:${s.id}" transform="translate(${s.x},${s.y})" style="cursor:move">${body}</g>`; }).join("")}
  `;

  const inp = "w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none text-white border border-neutral-700";
  const selItem = selStk ? stickers.find((s) => s.id === selStk) : null;
  const selR = selItem ? (selItem.r || 60) : 60;

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 mb-5 space-y-3">
      <p className="text-xs text-neutral-400">यही विज्ञापन poster — हर हिस्सा drag करके जमाएँ, text बदलें, sticker जोड़ें, फिर download या Review में भेजें।</p>
      <label className="text-xs text-neutral-400 block">Template style (और भी जुड़ते रहेंगे)
        <select value={template} onChange={(e) => applyTemplate(e.target.value)} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 mt-1 text-white">{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>

      <svg ref={svgRef} viewBox="0 0 1080 1080" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
        style={{ width: "100%", maxWidth: 520, display: "block", margin: "0 auto", borderRadius: 14, touchAction: "none", background: "#000" }}
        dangerouslySetInnerHTML={{ __html: inner }} />
      <div className="text-xs" style={{ color: GOLD, minHeight: 16 }}>{note}</div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-neutral-400">गाड़ी का नाम<input className={inp} value={f.model} onChange={(e) => set("model", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">कीमत (₹)<input className={inp} value={f.price} onChange={(e) => set("price", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">डाउन पेमेंट (₹)<input className={inp} value={f.down} onChange={(e) => set("down", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">कैशबैक (₹)<input className={inp} value={f.cashback} onChange={(e) => set("cashback", e.target.value)} /></label>
      </div>
      <label className="text-xs text-neutral-400 block">फीचर (comma से)<input className={inp} value={f.features} onChange={(e) => set("features", e.target.value)} /></label>
      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-neutral-400">फ़ोन<input className={inp} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">पता<input className={inp} value={f.place} onChange={(e) => set("place", e.target.value)} /></label>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-neutral-400">Background:</span>
        <button type="button" onClick={() => setBg("light")} className={"px-3 py-1 rounded-full text-sm border " + (bg === "light" ? "bg-white text-black" : "border-neutral-600 text-white")}>हल्का</button>
        <button type="button" onClick={() => setBg("red")} className={"px-3 py-1 rounded-full text-sm border " + (bg === "red" ? "text-white" : "border-neutral-600 text-white")} style={bg === "red" ? { background: ACCENT } : {}}>लाल</button>
        <button type="button" onClick={() => setBg("dark")} className={"px-3 py-1 rounded-full text-sm border " + (bg === "dark" ? "bg-black text-white" : "border-neutral-600 text-white")}>गहरा</button>
        <label className={"px-2 py-1 rounded-full text-sm border flex items-center gap-1 " + (bg === "custom" ? "text-white" : "border-neutral-600 text-white")} style={bg === "custom" ? { background: bgColor } : {}}>
          रंग<input type="color" value={bgColor} onChange={(e) => { setBgColor(e.target.value); setBg("custom"); }} style={{ width: 22, height: 22, border: "none", background: "none", padding: 0 }} />
        </label>
      </div>

      <label className="text-xs text-neutral-400 block">गाड़ी की फोटो
        <input type="file" accept="image/*" onChange={onBike} className="block mt-1 text-xs text-neutral-300" /></label>
      <label className="text-xs text-neutral-300 flex items-center gap-2">
        <input type="checkbox" checked={removeBg} onChange={(e) => setRemoveBg(e.target.checked)} />
        सफ़ेद/सादा background अपने-आप हटाएँ (तेज़)
      </label>
      <button type="button" onClick={aiRemove} className="text-xs rounded-lg py-2 px-3 border border-neutral-600 text-white">🪄 असली AI से background हटाएँ (किसी भी फोटो से — पहली बार model download)</button>
      <label className="text-xs text-neutral-400 block">गाड़ी का size<input type="range" min="0.5" max="1.8" step="0.05" value={bikeScale} onChange={(e) => setBikeScale(parseFloat(e.target.value))} className="w-full" /></label>

      <div>
        <span className="text-xs text-neutral-400">Emoji / सिंबल / बटन / CTA जोड़ें — चुनें → फिर poster पर drag करें</span>
        <select value="" onChange={(e) => { addItem(e.target.value); e.target.value = ""; }} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 mt-1 text-white">
          <option value="">＋ जोड़ें…</option>
          {PICK.map((g) => <optgroup key={g.group} label={g.group}>{g.items.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</optgroup>)}
        </select>
        {selItem && (
          <div className="mt-2 rounded-lg bg-neutral-800/60 p-2">
            {selItem.kind === "badge" && (
              <label className="text-xs text-neutral-400 block">बैज का text ("|" से दो लाइन)
                <input className={inp} value={selItem.text || ""} onChange={(e) => setStickers((a) => a.map((s) => (s.id === selStk ? { ...s, text: e.target.value } : s)))} /></label>
            )}
            <label className="text-xs text-neutral-400 block mt-1">size<input type="range" min="20" max="220" step="2" value={selR} onChange={(e) => setStickers((a) => a.map((s) => (s.id === selStk ? { ...s, r: parseInt(e.target.value, 10) } : s)))} className="w-full" /></label>
            <button type="button" onClick={delStk} className="text-sm text-red-400 mt-1">🗑 यह हटाएँ</button>
          </div>
        )}
      </div>

      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={aiBackground} className="text-xs rounded-lg py-2 px-3 border border-neutral-600 text-white">🖼️ AI background बनाएँ</button>
        {aiBg && <button type="button" onClick={() => setAiBg(null)} className="text-xs rounded-lg py-2 px-3 border border-neutral-600 text-white">AI bg हटाएँ</button>}
        <button type="button" onClick={aiText} className="text-xs rounded-lg py-2 px-3 border border-neutral-600 text-white">✨ AI से tagline लिखवाएँ</button>
      </div>
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button type="button" onClick={() => download(false)} style={{ background: ACCENT }} className="rounded-xl py-3 font-semibold text-white">⬇ Square</button>
        <button type="button" onClick={() => download(true)} style={{ background: ACCENT }} className="rounded-xl py-3 font-semibold text-white">⬇ Story</button>
        <button type="button" onClick={resetPos} className="rounded-xl py-3 font-semibold text-white border border-neutral-600">↺ Reset</button>
      </div>
      <button type="button" onClick={sendToQueue} className="w-full rounded-xl py-3 font-semibold text-black" style={{ background: GOLD }}>📤 Review में भेजें (फिर FB/IG/WhatsApp post करें)</button>
      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={saveDraft} className="rounded-xl py-2 text-sm font-semibold text-white border border-neutral-600">💾 Draft save करें</button>
        <select value="" onChange={(e) => e.target.value && openDraft(e.target.value)} className="bg-neutral-800 rounded-xl p-2 text-sm border border-neutral-700 text-white">
          <option value="">📂 बनाया हुआ खोलें ({drafts.length})</option>
          {drafts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
        </select>
      </div>
      {drafts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {drafts.map((d) => <button key={d.id} type="button" onClick={() => delDraft(d.id)} className="text-[11px] text-neutral-400 border border-neutral-700 rounded-full px-2 py-1">✕ {d.name.slice(0, 16)}</button>)}
        </div>
      )}
    </div>
  );
}
