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
const TEMPLATES = [
  { id: "festive", label: "त्यौहार (केसरी)", bg: "festive" },
  { id: "red", label: "लाल बधाई", bg: "red" },
  { id: "blue", label: "नीला प्रीमियम", bg: "blue" },
  { id: "dark", label: "गहरा प्रीमियम", bg: "dark" },
];

export default function DeliveryEditor({ apiBase, token, brandId, onSent }) {
  const [f, setF] = useState({ name: "ग्राहक का नाम", vehicle: "Shine 100", headline: "बधाई हो!", sub: "नई गाड़ी की शुभकामनाएं", phone: "9713394738", place: "VP Honda, परवलिया सड़क, भोपाल", brand: "VP Honda" });
  const [bg, setBg] = useState("festive");
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
      fd.append("caption", `${f.headline} ${f.name} 🎉\n${f.vehicle} की डिलीवरी — ${f.brand} परिवार की शुभकामनाएं!\nफ़ोन ${f.phone}`);
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
    ${bgRect}
    ${confetti}
    <g data-el="headline" transform="translate(${pos.headline.x},${pos.headline.y})" style="cursor:move">
      <text x="0" y="0" text-anchor="middle" font-family="Arial,sans-serif" font-size="96" font-weight="800" fill="${GOLD}" stroke="#7a0016" stroke-width="2">${esc(f.headline)}</text>
      <text x="0" y="48" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="34" font-weight="700" fill="#fff">${esc(f.sub)}</text>
    </g>
    ${photoG}
    <g data-el="plate" transform="translate(${pos.plate.x},${pos.plate.y})" style="cursor:move">
      <rect x="0" y="0" width="820" height="92" rx="46" fill="#ffffff"/>
      <text x="36" y="40" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="34" font-weight="800" fill="${ACCENT}">${esc(f.name)}</text>
      <text x="36" y="76" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="28" font-weight="600" fill="#333">${esc(f.vehicle)} • नई गाड़ी मुबारक</text>
    </g>
    <rect x="0" y="${H * 0.86}" width="${W}" height="${H * 0.14}" fill="#141414"/>
    <rect x="36" y="${H * 0.885}" width="1008" height="98" rx="49" fill="#1f1f1f" stroke="${GOLD}" stroke-width="3"/>
    <path d="M 86 ${H * 0.952} C 66 ${H * 0.927}, 66 ${H * 0.917}, 86 ${H * 0.917} C 106 ${H * 0.917}, 106 ${H * 0.927}, 86 ${H * 0.952} Z" fill="${GOLD}"/><circle cx="86" cy="${H * 0.929}" r="7" fill="#141414"/>
    <text x="130" y="${H * 0.936}" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="38" font-weight="800" fill="${GOLD}">${esc(f.brand)}</text>
    <text x="1010" y="${H * 0.936}" text-anchor="end" font-family="Arial,sans-serif" font-size="34" font-weight="800" fill="#fff">फ़ोन ${esc(f.phone)}</text>
    <text x="130" y="${H * 0.978}" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="25" fill="#e8e8e8">${esc(f.place)}</text>
    <g data-el="logo" transform="translate(${pos.logo.x},${pos.logo.y})" style="cursor:move"><circle cx="60" cy="60" r="58" fill="${DARK}"/><circle cx="60" cy="60" r="58" fill="none" stroke="${ACCENT}" stroke-width="5"/><text x="60" y="78" text-anchor="middle" font-family="Arial" font-size="44" font-weight="800" fill="#fff">VP</text></g>
    ${stickers.map((s) => `<g data-el="stk:${s.id}" transform="translate(${s.x},${s.y})" style="cursor:move">${shapeSVG(s.name, s.r)}</g>`).join("")}
  `;

  const inp = "w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none text-white border border-neutral-700";
  const selR = selStk ? ((stickers.find((s) => s.id === selStk) || {}).r || 60) : 60;

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 mb-5 space-y-3">
      <p className="text-xs text-neutral-400">डिलीवरी "बधाई हो!" फोटो — drag करके जमाएँ, text बदलें, sticker जोड़ें, फिर download या Review में भेजें।</p>
      <label className="text-xs text-neutral-400 block">Template style
        <select value={template} onChange={(e) => applyTemplate(e.target.value)} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 mt-1 text-white">{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>

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
      </div>

      <label className="text-xs text-neutral-400 block">डिलीवरी फोटो<input type="file" accept="image/*" onChange={onPhoto} className="block mt-1 text-xs text-neutral-300" /></label>
      <label className="text-xs text-neutral-400 block">फोटो का size<input type="range" min="0.6" max="1.6" step="0.05" value={photoScale} onChange={(e) => setPhotoScale(parseFloat(e.target.value))} className="w-full" /></label>

      <div>
        <span className="text-xs text-neutral-400">Sticker / Emoji जोड़ें (tap → drag)</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {PALETTE.map((n) => (<button key={n} type="button" onClick={() => addSticker(n)} className="bg-neutral-800 border border-neutral-700 rounded-xl" style={{ width: 48, height: 48 }} dangerouslySetInnerHTML={{ __html: `<svg viewBox="-60 -60 120 120" width="32" height="32" style="display:block;margin:auto">${shapeSVG(n, 48)}</svg>` }} />))}
        </div>
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
