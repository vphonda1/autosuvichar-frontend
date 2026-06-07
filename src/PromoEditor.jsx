import { useState, useRef } from "react";

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
    default: return "";
  }
}
const PALETTE = ["star", "heart", "flame", "gift", "sparkle", "check", "crown", "rupee", "sealOffer", "sealSale", "badgeNew"];

export default function PromoEditor() {
  const [f, setF] = useState({ model: "Shine 100", price: "71896", down: "4999", cashback: "10000", features: "High Mileage, Tubeless, Self Start, Digital Meter", phone: "9713394738", place: "VP Honda, परवलिया सड़क, भोपाल", brand: "VP Honda" });
  const [bg, setBg] = useState("light");
  const [bikeImg, setBikeImg] = useState(null);
  const [bikeDim, setBikeDim] = useState({ w: 560, h: 380 });
  const [bikeScale, setBikeScale] = useState(1);
  const [pos, setPos] = useState({ model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 184 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 } });
  const [stickers, setStickers] = useState([]);
  const [selStk, setSelStk] = useState(null);
  const [note, setNote] = useState("किसी भी चीज़ को उँगली से पकड़कर खिसकाएँ");
  const svgRef = useRef(null);
  const drag = useRef(null);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  function onBike(e) {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { const img = new Image(); img.onload = () => { const s = Math.min(560 / img.width, 400 / img.height, 1); setBikeDim({ w: Math.round(img.width * s), h: Math.round(img.height * s) }); setBikeImg(r.result); }; img.src = r.result; };
    r.readAsDataURL(file);
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

  function addSticker(name) { const id = "s" + Date.now(); setStickers((a) => [...a, { id, name, x: 540, y: 430, r: 60 }]); setSelStk(id); setNote("sticker जुड़ा — बीच से पकड़कर खिसकाएँ"); }
  function delStk() { setStickers((a) => a.filter((s) => s.id !== selStk)); setSelStk(null); }
  function resetPos() { setPos({ model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 184 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 } }); setBikeScale(1); }

  function download(story) {
    const svgStr = svgRef.current.outerHTML.replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"');
    const blob = new Blob([svgStr], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const c = document.createElement("canvas");
      const ctx = c.getContext("2d");
      if (story) { c.width = 1080; c.height = 1920; ctx.fillStyle = bg === "red" ? ACCENT : "#f4f4f4"; ctx.fillRect(0, 0, 1080, 1920); ctx.drawImage(img, 0, (1920 - 1080) / 2, 1080, 1080); }
      else { c.width = 1080; c.height = 1080; ctx.drawImage(img, 0, 0, 1080, 1080); }
      const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = "vphonda-" + (story ? "story" : "square") + ".png"; a.click();
      URL.revokeObjectURL(url);
    };
    img.onerror = () => { URL.revokeObjectURL(url); setNote("download में दिक्कत — दोबारा कोशिश करें"); };
    img.src = url;
  }

  const textMain = bg === "red" ? "#fff" : DARK;
  const feats = f.features.split(",").map((s) => s.trim()).filter(Boolean).join("   |   ");
  const bgRect = bg === "red"
    ? `<defs><linearGradient id="bgg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${ACCENT}"/><stop offset="100%" stop-color="#7a0016"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#bgg)"/>`
    : `<defs><pattern id="diag" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="40" height="40" fill="#f4f4f4"/><line x1="0" y1="0" x2="0" y2="40" stroke="#ececec" stroke-width="6"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#diag)"/>`;

  const bikeG = bikeImg
    ? `<g data-el="bike" transform="translate(${pos.bike.x},${pos.bike.y}) scale(${bikeScale})" style="cursor:move"><ellipse cx="${bikeDim.w / 2}" cy="${bikeDim.h * 0.98}" rx="${bikeDim.w * 0.42}" ry="${bikeDim.h * 0.07}" fill="#000" opacity="0.22"/><image href="${bikeImg}" width="${bikeDim.w}" height="${bikeDim.h}"/></g>`
    : `<g data-el="bike" transform="translate(${pos.bike.x},${pos.bike.y})" style="cursor:move"><rect width="560" height="360" rx="12" fill="#00000010" stroke="#999" stroke-width="2" stroke-dasharray="10 8"/><text x="280" y="190" text-anchor="middle" font-family="Arial" font-size="28" fill="#777">गाड़ी की फोटो upload करें</text></g>`;

  const inner = `
    ${bgRect}
    <rect x="0" y="0" width="${W}" height="8" fill="${ACCENT}"/>
    ${bikeG}
    <g data-el="model" transform="translate(${pos.model.x},${pos.model.y})" style="cursor:move"><text x="0" y="0" font-family="Arial,sans-serif" font-size="86" font-weight="800" fill="${textMain}">${esc(f.model)}</text><rect x="2" y="18" width="240" height="9" fill="${ACCENT}"/></g>
    <g data-el="price" transform="translate(${pos.price.x},${pos.price.y})" style="cursor:move"><g transform="rotate(-4)"><rect x="0" y="0" width="430" height="46" fill="${ACCENT}"/><text x="18" y="33" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#fff">एक्स-शोरूम कीमत</text><rect x="0" y="46" width="430" height="80" fill="${DARK}"/><text x="18" y="106" font-family="Arial,sans-serif" font-size="72" font-weight="800" fill="#fff">₹${esc(f.price)}</text></g></g>
    <g data-el="offer" transform="translate(${pos.offer.x},${pos.offer.y})" style="cursor:move"><text x="0" y="0" font-family="Arial,sans-serif" font-size="32" font-weight="800" fill="${textMain}">लिमिटेड पीरियड ऑफर</text><rect x="0" y="14" width="460" height="58" rx="8" fill="#ffd400"/><text x="18" y="52" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#111">डाउन पेमेंट</text><text x="442" y="55" text-anchor="end" font-family="Arial,sans-serif" font-size="42" font-weight="800" fill="${ACCENT}">₹${esc(f.down)}</text><rect x="0" y="82" width="460" height="58" rx="8" fill="${ACCENT}"/><text x="18" y="120" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#fff">कैशबैक</text><text x="442" y="123" text-anchor="end" font-family="Arial,sans-serif" font-size="42" font-weight="800" fill="#fff">₹${esc(f.cashback)}</text></g>
    <rect x="0" y="853" width="${W}" height="60" fill="${ACCENT}"/><text x="540" y="892" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="700" fill="#fff">${esc(feats)}</text>
    <rect x="0" y="929" width="${W}" height="151" fill="${DARK}"/><rect x="0" y="929" width="${W}" height="5" fill="${GOLD}"/>
    <text x="540" y="988" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" font-weight="800" fill="#fff">${esc(f.brand)}  •  फ़ोन ${esc(f.phone)}</text>
    <text x="540" y="1034" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" fill="#ddd">${esc(f.place)}</text>
    <text x="1050" y="918" text-anchor="end" font-family="Arial" font-size="18" fill="#888">T&amp;C Apply</text>
    <g data-el="logo" transform="translate(${pos.logo.x},${pos.logo.y})" style="cursor:move"><circle cx="62" cy="62" r="60" fill="${DARK}"/><circle cx="62" cy="62" r="60" fill="none" stroke="${ACCENT}" stroke-width="5"/><text x="62" y="80" text-anchor="middle" font-family="Arial,sans-serif" font-size="46" font-weight="800" fill="#fff">VP</text></g>
    ${stickers.map((s) => `<g data-el="stk:${s.id}" transform="translate(${s.x},${s.y})" style="cursor:move">${shapeSVG(s.name, s.r)}</g>`).join("")}
  `;

  const inp = "w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none text-white border border-neutral-700";
  const selR = selStk ? (stickers.find((s) => s.id === selStk) || {}).r || 60 : 60;

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 mb-5 space-y-3">
      <p className="text-xs text-neutral-400">यही विज्ञापन poster — हर हिस्सा drag करके जमाएँ, text बदलें, sticker जोड़ें, फिर download करें।</p>

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

      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-xs text-neutral-400">Background:</span>
        <button type="button" onClick={() => setBg("light")} className={"px-3 py-1 rounded-full text-sm border " + (bg === "light" ? "bg-white text-black" : "border-neutral-600 text-white")}>हल्का</button>
        <button type="button" onClick={() => setBg("red")} className={"px-3 py-1 rounded-full text-sm border " + (bg === "red" ? "text-white" : "border-neutral-600 text-white")} style={bg === "red" ? { background: ACCENT } : {}}>लाल</button>
      </div>

      <label className="text-xs text-neutral-400 block">गाड़ी की फोटो (background हटी PNG सबसे अच्छी)
        <input type="file" accept="image/*" onChange={onBike} className="block mt-1 text-xs text-neutral-300" /></label>
      <label className="text-xs text-neutral-400 block">गाड़ी का size<input type="range" min="0.5" max="1.8" step="0.05" value={bikeScale} onChange={(e) => setBikeScale(parseFloat(e.target.value))} className="w-full" /></label>

      <div>
        <span className="text-xs text-neutral-400">Sticker / Emoji जोड़ें (tap → फिर poster पर drag)</span>
        <div className="flex flex-wrap gap-2 mt-1">
          {PALETTE.map((n) => (
            <button key={n} type="button" onClick={() => addSticker(n)} className="bg-neutral-800 border border-neutral-700 rounded-xl" style={{ width: 48, height: 48 }}
              dangerouslySetInnerHTML={{ __html: `<svg viewBox="-60 -60 120 120" width="32" height="32" style="display:block;margin:auto">${shapeSVG(n, 48)}</svg>` }} />
          ))}
        </div>
        {selStk && (
          <div className="mt-2">
            <label className="text-xs text-neutral-400 block">चुने sticker का size<input type="range" min="20" max="160" step="2" value={selR} onChange={(e) => setStickers((a) => a.map((s) => (s.id === selStk ? { ...s, r: parseInt(e.target.value, 10) } : s)))} className="w-full" /></label>
            <button type="button" onClick={delStk} className="text-sm text-red-400 mt-1">🗑 यह sticker हटाएँ</button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-1">
        <button type="button" onClick={() => download(false)} style={{ background: ACCENT }} className="rounded-xl py-3 font-semibold text-white">⬇ Square</button>
        <button type="button" onClick={() => download(true)} style={{ background: ACCENT }} className="rounded-xl py-3 font-semibold text-white">⬇ Story</button>
        <button type="button" onClick={resetPos} className="rounded-xl py-3 font-semibold text-white border border-neutral-600">↺ Reset</button>
      </div>
    </div>
  );
}
