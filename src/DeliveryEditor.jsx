import { useState, useRef } from "react";

const ACCENT = "#E4002B", GOLD = "#ffd400", DARK = "#141414";
const W = 1080, H = 1080;

function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;"); }
function starPts(cx, cy, r, inner, pts) { let p = ""; for (let i = 0; i < pts * 2; i++) { const a = (Math.PI / pts) * i - Math.PI / 2; const rad = i % 2 === 0 ? r : r * inner; p += `${(cx + rad * Math.cos(a)).toFixed(1)},${(cy + rad * Math.sin(a)).toFixed(1)} `; } return p; }
function shapeSVG(name, r) {
  switch (name) {
    case "star": return `<polygon points="${starPts(0, 0, r, 0.42, 5)}" fill="#ffd400" stroke="#e0a800" stroke-width="2"/>`;
    case "heart": return `<path d="M 0 ${r * 0.7} C ${-r * 1.3} ${-r * 0.4}, ${-r * 0.5} ${-r * 1.1}, 0 ${-r * 0.3} C ${r * 0.5} ${-r * 1.1}, ${r * 1.3} ${-r * 0.4}, 0 ${r * 0.7} Z" fill="#e4002b"/>`;
    case "flame": return `<path d="M 0 ${-r} C ${r * 0.9} ${-r * 0.1}, ${r * 0.5} ${r}, 0 ${r} C ${-r * 0.5} ${r}, ${-r * 0.9} ${-r * 0.1}, 0 ${-r} Z" fill="#ff7a00"/>`;
    case "gift": return `<rect x="${-r}" y="${-r * 0.6}" width="${r * 2}" height="${r * 1.6}" rx="6" fill="#e4002b"/><rect x="${-r * 0.15}" y="${-r * 0.6}" width="${r * 0.3}" height="${r * 1.6}" fill="#ffd400"/><rect x="${-r}" y="${-r * 0.2}" width="${r * 2}" height="${r * 0.3}" fill="#ffd400"/>`;
    case "sparkle": return `<polygon points="${starPts(0, 0, r, 0.3, 4)}" fill="#fff"/><polygon points="${starPts(0, 0, r * 0.6, 0.3, 4)}" fill="#ffd400"/>`;
    case "check": return `<circle cx="0" cy="0" r="${r}" fill="#16a34a"/><path d="M ${-r * 0.45} 0 L ${-r * 0.1} ${r * 0.4} L ${r * 0.5} ${-r * 0.4}" stroke="#fff" stroke-width="${r * 0.18}" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`;
    case "crown": return `<polygon points="${-r},${r * 0.5} ${-r},${-r * 0.4} ${-r * 0.5},0 0,${-r * 0.7} ${r * 0.5},0 ${r},${-r * 0.4} ${r},${r * 0.5}" fill="#ffd400" stroke="#e0a800" stroke-width="2"/>`;
    case "party": return `<polygon points="${-r},${r} ${r * 0.3},${-r} ${r},${r * 0.3}" fill="#e4002b"/><polygon points="${starPts(r * 0.5, -r * 0.6, r * 0.3, 0.4, 5)}" fill="#ffd400"/>`;
    case "thumbsup": return `<circle cx="0" cy="0" r="${r}" fill="#1565c0"/><path d="M ${-r * 0.35} ${r * 0.45} v ${-r * 0.55} h ${r * 0.25} v ${r * 0.55} z M ${-r * 0.05} ${r * 0.45} v ${-r * 0.75} c 0,${-r * 0.5} ${r * 0.5},${-r * 0.55} ${r * 0.45},${-r * 0.05} l ${-r * 0.08} ${r * 0.3} h ${r * 0.35} c ${r * 0.12},0 ${r * 0.12},${r * 0.2} 0,${r * 0.5} h ${-r * 0.77} z" fill="#fff"/>`;
    default: return "";
  }
}
const PALETTE = ["star", "heart", "party", "gift", "sparkle", "check", "crown", "thumbsup"];
const READY_BG = [
  ["none", "— template रंग —", null],
  ["showroom", "🏬 शोरूम", (W, H) => `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3a3f47"/><stop offset="100%" stop-color="#14171a"/></linearGradient><radialGradient id="rs" cx="50%" cy="40%" r="62%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/><rect width="${W}" height="${H}" fill="url(#rs)"/>`],
  ["studio", "📸 स्टूडियो", (W, H) => `<defs><radialGradient id="rb" cx="50%" cy="38%" r="72%"><stop offset="0%" stop-color="#6b7280"/><stop offset="100%" stop-color="#23272e"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`],
  ["diwali", "🪔 दिवाली", (W, H) => { let d = `<defs><radialGradient id="rb" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="#c2641a"/><stop offset="100%" stop-color="#4a1505"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 22; i++) { const x = (i * 137 % W), y = (i * 91 % (H * 0.8)), r = 4 + (i % 5) * 3; d += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffd86b" opacity="${0.18 + (i % 4) * 0.07}"/>`; } return d; }],
  ["holi", "🎨 होली", (W, H) => { const c = ["#ff2d78", "#ffd400", "#16a34a", "#1565c0", "#9b51e0"]; let d = `<defs><linearGradient id="rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2a1a3a"/><stop offset="100%" stop-color="#3a1530"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 14; i++) { d += `<circle cx="${i * 173 % W}" cy="${i * 121 % H}" r="${50 + (i % 4) * 40}" fill="${c[i % 5]}" opacity="0.16"/>`; } return d; }],
  ["navratri", "🌼 नवरात्रि", (W, H) => { let d = `<defs><radialGradient id="rb" cx="50%" cy="38%" r="75%"><stop offset="0%" stop-color="#9a1840"/><stop offset="100%" stop-color="#3a0818"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 18; i++) { d += `<circle cx="${i * 151 % W}" cy="${i * 97 % (H * 0.85)}" r="${8 + i % 4 * 3}" fill="${i % 2 ? "#ff8a00" : "#ffd24a"}" opacity="0.3"/>`; } return d; }],
  ["city", "🌆 शहर", (W, H) => `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34506b"/><stop offset="100%" stop-color="#161e28"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/><rect x="0" y="${H * 0.7}" width="${W}" height="${H * 0.3}" fill="#0d141c" opacity="0.6"/>`],
  ["blue", "🔵 नीला", (W, H) => `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1565c0"/><stop offset="100%" stop-color="#0a2a5a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`],
];
function readyBgSvg(id, W, H) { const r = READY_BG.find((x) => x[0] === id); return (r && r[2]) ? r[2](W, H) : ""; }
// ===== delivery frame designs (headline क्षेत्र का पूरा लुक) =====
const FRAMES = [
  ["classic", "बधाई हो (क्लासिक)"],
  ["congrats", "CONGRATULATIONS (बड़ा)"],
  ["marigold", "गेंदा-झालर (त्यौहार)"],
  ["welcome", "WELCOME TO FAMILY (सफ़ेद)"],
  ["polaroid", "पोलेरॉइड कार्ड"],
];
// frame का ऊपरी डिज़ाइन. classic = पुराना (headline <g> से आता है, यहाँ खाली).
function frameDecor(style, f, W, H) {
  if (style === "classic") return "";
  const hl = esc(f.headline), sub = esc(f.sub);
  let s = "";
  if (style === "congrats") {
    for (let i = 0; i < 4; i++) { const y = H * 0.16 + i * H * 0.13, op = [1, 0.6, 0.35, 0.18][i]; s += `<text x="${W * 0.5}" y="${y}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="${W * 0.13}" font-weight="900" fill="${ACCENT}" opacity="${op}" letter-spacing="-3">CONGRATULATIONS</text>`; }
    s += `<text x="${W * 0.5}" y="${H * 0.8}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W * 0.05}" font-weight="800" fill="${ACCENT}">${hl}</text>`;
    s += `<text x="${W * 0.5}" y="${H * 0.84}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W * 0.03}" fill="#333">${sub}</text>`;
  } else if (style === "marigold") {
    for (let i = 0; i <= 14; i++) { const x = W * (i / 14); s += `<circle cx="${x}" cy="${H * 0.045}" r="${W * 0.02}" fill="${i % 2 ? "#ff8a00" : "#ffb703"}"/><path d="M ${x} ${H * 0.06} q ${W * 0.01} ${H * 0.03} 0 ${H * 0.05} q ${-W * 0.01} ${-H * 0.02} 0 ${-H * 0.05}" fill="#1f9d3a"/>`; }
    s += `<text x="${W * 0.5}" y="${H * 0.16}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W * 0.085}" font-weight="900" fill="${GOLD}" stroke="#7a0016" stroke-width="3">${hl}</text>`;
    s += `<text x="${W * 0.5}" y="${H * 0.205}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W * 0.03}" fill="#fff">${sub}</text>`;
  } else if (style === "welcome") {
    s += `<text x="${W * 0.5}" y="${H * 0.12}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W * 0.07}" font-weight="900" fill="${ACCENT}">${hl}</text>`;
    s += `<text x="${W * 0.5}" y="${H * 0.165}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W * 0.028}" fill="#444">${sub}</text>`;
  } else if (style === "polaroid") {
    s += `<text x="${W * 0.5}" y="${H * 0.13}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W * 0.075}" font-weight="900" fill="${GOLD}" stroke="#7a0016" stroke-width="2">${hl}</text>`;
  }
  return s;
}
// hashtag chips — हमेशा फ्रेम के अंदर, कभी कटे नहीं
function hashtagChips(tag, W, H, cy) {
  if (!tag || !tag.trim()) return "";
  const tags = tag.split(/\s+/).filter(Boolean).slice(0, 4);
  let s = ""; const gap = 12;
  const widths = tags.map((t) => { const label = (t[0] === "#" ? t : "#" + t); return Math.max(W * 0.1, label.length * W * 0.017); });
  const total = widths.reduce((a, b) => a + b, 0) + gap * (tags.length - 1);
  let x = W * 0.5 - total / 2;
  tags.forEach((t, i) => { const label = (t[0] === "#" ? t : "#" + t); const cw = widths[i]; s += `<rect x="${x}" y="${cy - W * 0.028}" width="${cw}" height="${W * 0.056}" rx="${W * 0.028}" fill="${DARK}" opacity="0.88"/><text x="${x + cw / 2}" y="${cy + W * 0.012}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${W * 0.026}" font-weight="700" fill="${GOLD}">${esc(label)}</text>`; x += cw + gap; });
  return s;
}
const TEMPLATES = [
  { id: "festive", label: "त्यौहार (केसरी)", bg: "festive" },
  { id: "red", label: "लाल बधाई", bg: "red" },
  { id: "blue", label: "नीला प्रीमियम", bg: "blue" },
  { id: "dark", label: "गहरा प्रीमियम", bg: "dark" },
];

export default function DeliveryEditor({ apiBase, token, brandId, onSent }) {
  const [f, setF] = useState({ name: "ग्राहक का नाम", vehicle: "Shine 100", headline: "बधाई हो!", sub: "नई गाड़ी की शुभकामनाएं", phone: "9713394738", place: "VP Honda, परवलिया सड़क, भोपाल", brand: "VP Honda", hashtag: "#VPHonda #NewBike #Bhopal" });
  const [bg, setBg] = useState("festive");
  const [frameStyle, setFrameStyle] = useState("classic");
  const [readyBg, setReadyBg] = useState("none");
  const [template, setTemplate] = useState("festive");
  const [photo, setPhoto] = useState(null);
  const [photoDim, setPhotoDim] = useState({ w: 720, h: 720 });
  const [photoScale, setPhotoScale] = useState(1);
  const [pos, setPos] = useState({ headline: { x: 540, y: 150 }, photo: { x: 180, y: 230 }, plate: { x: 130, y: 815 }, logo: { x: 900, y: 26 } });
  const [stickers, setStickers] = useState([]);
  const [selStk, setSelStk] = useState(null);
  const [note, setNote] = useState("फोटो डालें, फिर हर हिस्सा drag करके जमाएँ");
  const svgRef = useRef(null);
  const drag = useRef(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  function onPhoto(e) {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(720 / img.naturalWidth, 760 / img.naturalHeight, 1.6); setPhotoDim({ w: Math.round(img.naturalWidth * s), h: Math.round(img.naturalHeight * s) }); setPhoto(r.result); }; img.src = r.result; };
    r.readAsDataURL(file);
  }
  function pointerDown(e) {
    const g = e.target.closest("[data-el]"); if (!g) return;
    const el = g.getAttribute("data-el");
    const rect = svgRef.current.getBoundingClientRect(); const scale = W / rect.width;
    if (el.startsWith("stk:")) { const id = el.slice(4); const s = stickers.find((x) => x.id === id); if (!s) return; setSelStk(id); drag.current = { id, sx: e.clientX, sy: e.clientY, ox: s.x, oy: s.y, scale, stk: true }; }
    else { drag.current = { el, sx: e.clientX, sy: e.clientY, ox: pos[el].x, oy: pos[el].y, scale }; setNote("चुना: " + el + " — खिसकाएँ"); }
    svgRef.current.setPointerCapture(e.pointerId);
  }
  function pointerMove(e) {
    const d = drag.current; if (!d) return;
    const nx = Math.round(d.ox + (e.clientX - d.sx) * d.scale), ny = Math.round(d.oy + (e.clientY - d.sy) * d.scale);
    if (d.stk) setStickers((arr) => arr.map((s) => (s.id === d.id ? { ...s, x: nx, y: ny } : s)));
    else setPos((p) => ({ ...p, [d.el]: { x: nx, y: ny } }));
  }
  function pointerUp() { drag.current = null; }
  function addSticker(name) { const id = "s" + Date.now(); setStickers((a) => [...a, { id, name, x: 540, y: 460, r: 60 }]); setSelStk(id); }
  function delStk() { setStickers((a) => a.filter((s) => s.id !== selStk)); setSelStk(null); }
  function applyTemplate(id) { const t = TEMPLATES.find((x) => x.id === id); if (!t) return; setTemplate(id); setBg(t.bg); }

  function renderCanvas(story) {
    return new Promise((resolve, reject) => {
      const svgStr = svgRef.current.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
      const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => { const c = document.createElement("canvas"); const ctx = c.getContext("2d"); if (story) { c.width = 1080; c.height = 1920; ctx.fillStyle = padFill; ctx.fillRect(0, 0, 1080, 1920); ctx.drawImage(img, 0, (1920 - 1080) / 2, 1080, 1080); } else { c.width = 1080; c.height = 1080; ctx.drawImage(img, 0, 0, 1080, 1080); } URL.revokeObjectURL(url); resolve(c); };
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("render")); };
      img.src = url;
    });
  }
  function download(story) { renderCanvas(story).then((c) => { const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "vphonda-delivery-" + (story ? "story" : "square") + ".png"; a.click(); }).catch(() => setNote("download में दिक्कत")); }
  async function sendToQueue() {
    if (!apiBase || !token) { setNote("queue उपलब्ध नहीं — सीधे download करें"); return; }
    setNote("Review में भेज रहे हैं…");
    try {
      const [sq, st] = await Promise.all([renderCanvas(false), renderCanvas(true)]);
      const toBlob = (c) => new Promise((res) => c.toBlob((b) => res(b), "image/png"));
      const [bSq, bSt] = await Promise.all([toBlob(sq), toBlob(st)]);
      const fd = new FormData();
      fd.append("brand", brandId || "vp_honda");
      fd.append("model", f.vehicle);
      fd.append("caption", `${f.headline} ${f.name} 🎉\n${f.vehicle} की डिलीवरी — ${f.brand} परिवार की शुभकामनाएं!\nफ़ोन ${f.phone}${f.hashtag ? "\n" + f.hashtag : ""}`);
      fd.append("square", bSq, "square.png"); if (bSt) fd.append("story", bSt, "story.png");
      const res = await fetch(apiBase + "/api/promo-image", { method: "POST", headers: { Authorization: "Bearer " + token }, body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "fail");
      setNote("✔ Review में आ गया — वहाँ से post करें"); if (onSent) onSent();
    } catch (e) { setNote("भेजने में दिक्कत: " + e.message); }
  }

  const bgRect = bg === "festive" ? `<defs><radialGradient id="bgg" cx="50%" cy="32%" r="85%"><stop offset="0%" stop-color="#ff9d2e"/><stop offset="100%" stop-color="#c1121f"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#bgg)"/>`
    : bg === "red" ? `<defs><linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${ACCENT}"/><stop offset="100%" stop-color="#7a0016"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bgg)"/>`
      : bg === "blue" ? `<defs><linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1565c0"/><stop offset="100%" stop-color="#0b3d91"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bgg)"/>`
        : `<rect width="${W}" height="${H}" fill="#141414"/>`;
  const padFill = bg === "festive" ? "#c1121f" : bg === "red" ? ACCENT : bg === "blue" ? "#0b3d91" : "#141414";
  // confetti (top झालर) — drawn, हमेशा दिखे
  const confetti = Array.from({ length: 18 }).map((_, i) => { const x = (i * W / 18) + 18; const y = 12 + (i % 3) * 22; const col = ["#ffd400", "#ffffff", "#16a34a", "#3b5bdb", "#e64980"][i % 5]; return `<rect x="${x}" y="${y}" width="16" height="16" rx="3" transform="rotate(${i * 25} ${x + 8} ${y + 8})" fill="${col}"/>`; }).join("");

  const photoG = photo
    ? `<g data-el="photo" transform="translate(${pos.photo.x},${pos.photo.y}) scale(${photoScale})" style="cursor:move"><defs><clipPath id="pc"><rect width="${photoDim.w}" height="${photoDim.h}" rx="26"/></clipPath></defs><rect x="-12" y="-12" width="${photoDim.w + 24}" height="${photoDim.h + 24}" rx="32" fill="#fff"/><image href="${photo}" width="${photoDim.w}" height="${photoDim.h}" preserveAspectRatio="xMidYMid slice" clip-path="url(#pc)"/></g>`
    : `<g data-el="photo" transform="translate(${pos.photo.x},${pos.photo.y})" style="cursor:move"><rect width="720" height="620" rx="26" fill="#ffffff22" stroke="#fff" stroke-width="3" stroke-dasharray="12 9"/><text x="360" y="320" text-anchor="middle" font-family="Arial" font-size="30" fill="#fff">डिलीवरी फोटो upload करें</text></g>`;

  const inner = `
    ${readyBg !== "none" ? readyBgSvg(readyBg, W, H) : bgRect}
    ${(frameStyle === "welcome" || frameStyle === "congrats") ? `<rect width="${W}" height="${H}" fill="#f4f4f4"/>` : ""}
    ${frameStyle === "classic" ? confetti : ""}
    ${frameDecor(frameStyle, f, W, H)}
    ${frameStyle === "classic" ? `<g data-el="headline" transform="translate(${pos.headline.x},${pos.headline.y})" style="cursor:move">
      <text x="0" y="0" text-anchor="middle" font-family="Arial,sans-serif" font-size="96" font-weight="800" fill="${GOLD}" stroke="#7a0016" stroke-width="2">${esc(f.headline)}</text>
      <text x="0" y="48" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="34" font-weight="700" fill="#fff">${esc(f.sub)}</text>
    </g>` : ""}
    ${photoG}
    ${hashtagChips(f.hashtag, W, H, H * 0.7)}
    <g data-el="plate" transform="translate(${pos.plate.x},${pos.plate.y})" style="cursor:move">
      <rect x="0" y="0" width="820" height="92" rx="46" fill="#ffffff"/>
      <text x="36" y="40" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="34" font-weight="800" fill="${ACCENT}">${esc(f.name)}</text>
      <text x="36" y="76" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="28" font-weight="600" fill="#333">${esc(f.vehicle)} • नई गाड़ी मुबारक</text>
    </g>
    <rect x="0" y="${H * 0.86}" width="${W}" height="${H * 0.14}" fill="#141414"/>
    <defs><linearGradient id="dal" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff2a44"/><stop offset="100%" stop-color="${ACCENT}"/></linearGradient><linearGradient id="dar" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2b2b2b"/><stop offset="100%" stop-color="${DARK}"/></linearGradient></defs>
    <rect x="36" y="960" width="1008" height="100" rx="50" fill="#000" opacity="0.5"/>
    <path d="M 86 952 H 641 V 1052 H 86 A 50 50 0 0 1 86 952 Z" fill="url(#dal)"/>
    <path d="M 641 952 H 994 A 50 50 0 0 1 994 1052 H 641 Z" fill="url(#dar)"/>
    <rect x="36" y="952" width="1008" height="100" rx="50" fill="none" stroke="${GOLD}" stroke-width="3"/>
    <rect x="46" y="956" width="988" height="30" rx="18" fill="#fff" opacity="0.12"/>
    <line x1="641" y1="960" x2="641" y2="1044" stroke="${GOLD}" stroke-width="2" opacity="0.7"/>
    <path d="M 88 1018 C 68 994, 68 984, 88 984 C 108 984, 108 994, 88 1018 Z" fill="${GOLD}"/><circle cx="88" cy="986" r="7" fill="#fff"/>
    <text x="118" y="995" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="36" font-weight="800" fill="#fff">${esc(f.brand)}</text>
    <text x="118" y="1032" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="22" fill="#ffe9ec">${esc(f.place)}</text>
    <text x="843" y="995" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" fill="${GOLD}">फ़ोन</text>
    <text x="843" y="1035" text-anchor="middle" font-family="Arial,sans-serif" font-size="38" font-weight="800" fill="#fff">${esc(f.phone)}</text>
    <g data-el="logo" transform="translate(${pos.logo.x},${pos.logo.y})" style="cursor:move"><circle cx="60" cy="60" r="58" fill="${DARK}"/><circle cx="60" cy="60" r="58" fill="none" stroke="${ACCENT}" stroke-width="5"/><text x="60" y="78" text-anchor="middle" font-family="Arial" font-size="44" font-weight="800" fill="#fff">VP</text></g>
    ${stickers.map((s) => `<g data-el="stk:${s.id}" transform="translate(${s.x},${s.y})" style="cursor:move">${shapeSVG(s.name, s.r)}</g>`).join("")}
  `;

  const inp = "w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none text-white border border-neutral-700";
  const selR = selStk ? ((stickers.find((s) => s.id === selStk) || {}).r || 60) : 60;

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 mb-5 space-y-3">
      <p className="text-xs text-neutral-400">डिलीवरी "बधाई हो!" फोटो — drag करके जमाएँ, text बदलें, sticker जोड़ें, फिर download या Review में भेजें।</p>
      <label className="text-xs text-neutral-400 block">Template रंग
        <select value={template} onChange={(e) => applyTemplate(e.target.value)} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 mt-1 text-white">{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
      <div>
        <span className="text-xs text-neutral-400 block mb-1">🖼️ Frame design — चुनें (छोटा preview देखें)</span>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {FRAMES.map(([id, label]) => {
            const sel = frameStyle === id;
            const bgc = (id === "welcome" || id === "congrats") ? "#f4f4f4" : id === "marigold" ? "#e8830f" : "#c1121f";
            const thumb = `<svg viewBox="0 0 1080 1080" xmlns="http://www.w3.org/2000/svg"><rect width="1080" height="1080" fill="${bgc}"/>${frameDecor(id, f, W, H)}<rect x="302" y="324" width="475" height="324" rx="20" fill="#ffffff" opacity="0.55"/>${hashtagChips(f.hashtag, W, H, 760)}</svg>`;
            return (
              <button key={id} type="button" onClick={() => setFrameStyle(id)} className="flex-shrink-0 text-center" style={{ width: 78 }}>
                <div style={{ width: 78, height: 78, borderRadius: 10, overflow: "hidden", border: sel ? `3px solid ${GOLD}` : "2px solid #333", background: "#000" }}
                  dangerouslySetInnerHTML={{ __html: thumb }} />
                <div className="text-[9px] mt-1 leading-tight" style={{ color: sel ? GOLD : "#999" }}>{label}</div>
              </button>
            );
          })}
        </div>
      </div>

      <svg ref={svgRef} viewBox="0 0 1080 1080" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
        style={{ width: "100%", maxWidth: 520, display: "block", margin: "0 auto", borderRadius: 14, touchAction: "none", background: "#000" }}
        dangerouslySetInnerHTML={{ __html: inner }} />
      <div className="text-xs" style={{ color: GOLD, minHeight: 16 }}>{note}</div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-neutral-400">ग्राहक का नाम<input className={inp} value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">गाड़ी<input className={inp} value={f.vehicle} onChange={(e) => set("vehicle", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">हेडलाइन<input className={inp} value={f.headline} onChange={(e) => set("headline", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">छोटी लाइन<input className={inp} value={f.sub} onChange={(e) => set("sub", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">फ़ोन<input className={inp} value={f.phone} onChange={(e) => set("phone", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">पता<input className={inp} value={f.place} onChange={(e) => set("place", e.target.value)} /></label>
        <label className="text-xs text-neutral-400 col-span-2"># हैशटैग (space से अलग करें)<input className={inp} value={f.hashtag} onChange={(e) => set("hashtag", e.target.value)} placeholder="#VPHonda #NewBike #Bhopal" /></label>
      </div>

      <label className="text-xs text-neutral-400 block">डिलीवरी फोटो<input type="file" accept="image/*" onChange={onPhoto} className="block mt-1 text-xs text-neutral-300" /></label>
      <label className="text-xs text-neutral-400 block">फोटो का size<input type="range" min="0.6" max="1.6" step="0.05" value={photoScale} onChange={(e) => setPhotoScale(parseFloat(e.target.value))} className="w-full" /></label>

      <label className="text-xs text-neutral-400 block">🎨 तैयार background (तुरंत, बिना AI)
        <select value={readyBg} onChange={(e) => setReadyBg(e.target.value)} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 mt-1 text-white">{READY_BG.map(([id, label]) => <option key={id} value={id}>{label}</option>)}</select></label>

      <div>
        <span className="text-xs text-neutral-400">Emoji / sticker जोड़ें — चुनें → फिर drag करें</span>
        <select value="" onChange={(e) => { if (e.target.value) addSticker(e.target.value); e.target.value = ""; }} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 mt-1 text-white">
          <option value="">＋ जोड़ें…</option>
          {PALETTE.map((n) => <option key={n} value={n}>{({ star: "⭐ स्टार", heart: "❤️ दिल", party: "🎉 पार्टी", gift: "🎁 गिफ्ट", sparkle: "✨ चमक", check: "✅ टिक", crown: "👑 ताज", thumbsup: "👍 लाइक" })[n] || n}</option>)}
        </select>
        {selStk && (<div className="mt-2"><label className="text-xs text-neutral-400 block">sticker size<input type="range" min="20" max="170" step="2" value={selR} onChange={(e) => setStickers((a) => a.map((s) => (s.id === selStk ? { ...s, r: parseInt(e.target.value, 10) } : s)))} className="w-full" /></label><button type="button" onClick={delStk} className="text-sm text-red-400 mt-1">🗑 हटाएँ</button></div>)}
      </div>

      <div className="grid grid-cols-2 gap-2 pt-1">
        <button type="button" onClick={() => download(false)} style={{ background: ACCENT }} className="rounded-xl py-3 font-semibold text-white">⬇ Square</button>
        <button type="button" onClick={() => download(true)} style={{ background: ACCENT }} className="rounded-xl py-3 font-semibold text-white">⬇ Story</button>
      </div>
      <button type="button" onClick={sendToQueue} className="w-full rounded-xl py-3 font-semibold text-black" style={{ background: GOLD }}>📤 Review में भेजें</button>
    </div>
  );
}
