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
// हर item अलग रंग के 3D चिप-बटन पर, एक row में (width में फिट करने को auto-scale)
function chipRow(labels, cy, h, maxW, W) {
  if (!labels || !labels.length) return "";
  const pal = ["#E4002B", "#1565c0", "#0ca678", "#e8590c", "#7048e8", "#d6336c", "#0a9396", "#f59f00"];
  const fs = Math.round(h * 0.5); let x = 0; const chips = [];
  labels.forEach((l, i) => { const cw = l.length * fs * 0.62 + h * 1.0; chips.push({ l, x, cw, col: pal[i % pal.length] }); x += cw + h * 0.3; });
  const total = x - h * 0.3, k = Math.min(1, maxW / total), startX = (W - total * k) / 2;
  let g = `<g transform="translate(${startX},${cy}) scale(${k})">`;
  for (const c of chips) { const rx = h / 2; g += `<rect x="${c.x}" y="4" width="${c.cw}" height="${h}" rx="${rx}" fill="#000" opacity="0.3"/><rect x="${c.x}" y="0" width="${c.cw}" height="${h}" rx="${rx}" fill="${c.col}"/><rect x="${c.x + 5}" y="3" width="${c.cw - 10}" height="${h * 0.32}" rx="${rx * 0.5}" fill="#fff" opacity="0.18"/><text x="${c.x + c.cw / 2}" y="${h * 0.68}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${fs}" font-weight="700" fill="#fff">${esc(c.l)}</text>`; }
  return g + `</g>`;
}
const DRAFT_KEY = "vphonda_promo_drafts";
// wrapping multi-line चिप-बटन (हर item अलग रंग) — group 0,0 से नीचे की ओर बढ़ता है
function chipBlock(labels, maxW, ch) {
  if (!labels || !labels.length) return "";
  const pal = ["#E4002B", "#1565c0", "#0ca678", "#e8590c", "#7048e8", "#d6336c", "#0a9396", "#f59f00"];
  const fs = Math.round(ch * 0.5), gap = ch * 0.3, lineGap = ch * 0.4;
  let x = 0, y = 0, out = "";
  labels.forEach((l, i) => {
    const cw = String(l).length * fs * 0.62 + ch * 1.0;
    if (x > 0 && x + cw > maxW) { x = 0; y += ch + lineGap; }
    const col = pal[i % pal.length], rx = ch / 2;
    out += `<rect x="${x}" y="${y + 4}" width="${cw}" height="${ch}" rx="${rx}" fill="#000" opacity="0.3"/><rect x="${x}" y="${y}" width="${cw}" height="${ch}" rx="${rx}" fill="${col}"/><rect x="${x + 5}" y="${y + 3}" width="${cw - 10}" height="${ch * 0.32}" rx="${rx * 0.5}" fill="#fff" opacity="0.18"/><text x="${x + cw / 2}" y="${y + ch * 0.68}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${fs}" font-weight="700" fill="#fff">${esc(l)}</text>`;
    x += cw + gap;
  });
  return out;
}
const FEATURE_OPTS = ["हाई माइलेज", "ट्यूबलेस टायर", "सेल्फ स्टार्ट", "डिजिटल मीटर", "अलॉय व्हील", "क्रोम प्लेटिंग", "वाइड फ्यूल टैंक", "LED हेडलाइट", "5-स्टेप सस्पेंशन", "डिस्क ब्रेक", "मोबाइल चार्जिंग", "कॉम्बी ब्रेक", "BS6 इंजन", "स्टाइलिश ग्राफिक्स", "कम्फर्ट सीट", "मज़बूत ग्रैब रेल", "साइड स्टैंड इंजन कट", "लो मेंटेनेंस", "इको मोड", "दमदार परफॉर्मेंस"];
const BANK_OPTS = ["HDB", "Jana Small Finance", "Muthoot", "IDFC First", "Shriram Finance", "HDFC", "Bajaj Finance", "TATA Capital", "L&T Finance", "Chola"];
// बिना-AI तैयार backgrounds (सीधे SVG — कोई network/quota नहीं)
const READY_BG = [
  ["none", "— कोई नहीं —", null],
  ["showroom", "🏬 शोरूम", (W, H) => `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3a3f47"/><stop offset="100%" stop-color="#14171a"/></linearGradient><radialGradient id="rs" cx="50%" cy="40%" r="62%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/><rect width="${W}" height="${H}" fill="url(#rs)"/><ellipse cx="${W / 2}" cy="${H * 0.76}" rx="${W * 0.52}" ry="${H * 0.09}" fill="#ffffff" opacity="0.06"/>`],
  ["studio", "📸 स्टूडियो", (W, H) => `<defs><radialGradient id="rb" cx="50%" cy="38%" r="72%"><stop offset="0%" stop-color="#6b7280"/><stop offset="100%" stop-color="#23272e"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`],
  ["diwali", "🪔 दिवाली", (W, H) => { let d = `<defs><radialGradient id="rb" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="#c2641a"/><stop offset="100%" stop-color="#4a1505"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 22; i++) { const x = (i * 137 % W), y = (i * 91 % (H * 0.8)), r = 4 + (i % 5) * 3; d += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffd86b" opacity="${0.18 + (i % 4) * 0.07}"/>`; } return d; }],
  ["holi", "🎨 होली", (W, H) => { const cols = ["#ff2d78", "#ffd400", "#16a34a", "#1565c0", "#9b51e0"]; let d = `<defs><linearGradient id="rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2a1a3a"/><stop offset="100%" stop-color="#3a1530"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 14; i++) { const x = (i * 173 % W), y = (i * 121 % H), r = 50 + (i % 4) * 40; d += `<circle cx="${x}" cy="${y}" r="${r}" fill="${cols[i % 5]}" opacity="0.16"/>`; } return d; }],
  ["navratri", "🌼 नवरात्रि", (W, H) => { let d = `<defs><radialGradient id="rb" cx="50%" cy="38%" r="75%"><stop offset="0%" stop-color="#9a1840"/><stop offset="100%" stop-color="#3a0818"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 18; i++) { const x = (i * 151 % W), y = (i * 97 % (H * 0.85)); d += `<circle cx="${x}" cy="${y}" r="${8 + i % 4 * 3}" fill="${i % 2 ? "#ff8a00" : "#ffd24a"}" opacity="0.3"/>`; } return d; }],
  ["city", "🌆 शहर", (W, H) => `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34506b"/><stop offset="100%" stop-color="#161e28"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/><rect x="0" y="${H * 0.7}" width="${W}" height="${H * 0.3}" fill="#0d141c" opacity="0.6"/>`],
  ["sport", "🔴 लाल स्पोर्टी", (W, H) => { let d = `<defs><linearGradient id="rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#E4002B"/><stop offset="100%" stop-color="#2a0006"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 6; i++) { const x = i * (W / 5); d += `<line x1="${x}" y1="0" x2="${x + W * 0.3}" y2="${H}" stroke="#fff" stroke-width="3" opacity="0.07"/>`; } return d; }],
  ["blue", "🔵 नीला", (W, H) => `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1565c0"/><stop offset="100%" stop-color="#0a2a5a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`],
  // ---- नए premium backgrounds (बाइक PNG इनके बीच में बैठेगी) ----
  ["showroom_pro", "🏬 शोरूम-प्रो (लाइट+फर्श)", (W, H) => { let d = `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2c313a"/><stop offset="62%" stop-color="#1a1d23"/><stop offset="100%" stop-color="#0d0f12"/></linearGradient><radialGradient id="spot" cx="50%" cy="34%" r="55%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.22"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 4; i++) { const x = W * (0.18 + i * 0.21); d += `<rect x="${x}" y="0" width="${W * 0.1}" height="${H * 0.04}" rx="6" fill="#fff" opacity="0.12"/>`; } d += `<rect width="${W}" height="${H}" fill="url(#spot)"/><rect x="0" y="${H * 0.72}" width="${W}" height="${H * 0.28}" fill="#000" opacity="0.35"/><ellipse cx="${W / 2}" cy="${H * 0.74}" rx="${W * 0.5}" ry="${H * 0.06}" fill="#fff" opacity="0.10"/>`; return d; }],
  ["studio_grad", "📸 स्टूडियो-ग्रेडिएंट", (W, H) => `<defs><radialGradient id="rb" cx="50%" cy="40%" r="78%"><stop offset="0%" stop-color="#8a9099"/><stop offset="55%" stop-color="#4a4f57"/><stop offset="100%" stop-color="#1c1f24"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/><ellipse cx="${W / 2}" cy="${H * 0.78}" rx="${W * 0.46}" ry="${H * 0.07}" fill="#000" opacity="0.22"/>`],
  ["diwali_pro", "🪔 दिवाली-प्रो (गेंदा+दीये)", (W, H) => { let d = `<defs><radialGradient id="rb" cx="50%" cy="42%" r="80%"><stop offset="0%" stop-color="#d2761f"/><stop offset="60%" stop-color="#7a2a08"/><stop offset="100%" stop-color="#3a1203"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 26; i++) { const x = (i * 137 % W), y = (i * 91 % (H * 0.85)), r = 4 + (i % 5) * 4; d += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffd86b" opacity="${0.16 + (i % 4) * 0.06}"/>`; } for (let i = 0; i <= 12; i++) { const x = W * (i / 12); const y = H * 0.05 + Math.sin(i) * H * 0.012; d += `<circle cx="${x}" cy="${y}" r="${W * 0.012}" fill="${i % 2 ? "#ff8a00" : "#ffb703"}"/>`; } for (let i = 0; i < 5; i++) { const x = W * (0.12 + i * 0.19), y = H * 0.9; d += `<ellipse cx="${x}" cy="${y}" rx="${W * 0.035}" ry="${W * 0.014}" fill="#7a3b12"/><path d="M ${x} ${y - W * 0.04} C ${x + W * 0.012} ${y - W * 0.02}, ${x + W * 0.006} ${y - W * 0.008}, ${x} ${y - W * 0.008} C ${x - W * 0.006} ${y - W * 0.008}, ${x - W * 0.012} ${y - W * 0.02}, ${x} ${y - W * 0.04} Z" fill="#ffcb2b"/>`; } return d; }],
  ["templearch_bg", "🛕 मंदिर-आर्क (त्यौहार)", (W, H) => { const ax = W * 0.5, top = H * 0.06, aw = W * 0.74, ah = H * 0.66; let d = `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#f3e0b5"/><stop offset="100%" stop-color="#d8b87a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; d += `<path d="M ${ax - aw / 2} ${top + ah} V ${top + ah * 0.3} Q ${ax - aw / 2} ${top} ${ax} ${top} Q ${ax + aw / 2} ${top} ${ax + aw / 2} ${top + ah * 0.3} V ${top + ah}" fill="none" stroke="#b8860b" stroke-width="8" opacity="0.9"/>`; d += `<path d="M ${ax - aw / 2 * 0.92} ${top + ah} V ${top + ah * 0.32} Q ${ax - aw / 2 * 0.92} ${top + ah * 0.05} ${ax} ${top + ah * 0.05} Q ${ax + aw / 2 * 0.92} ${top + ah * 0.05} ${ax + aw / 2 * 0.92} ${top + ah * 0.32} V ${top + ah}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="3 10" opacity="0.6"/>`; for (let i = 0; i <= 16; i++) { const t = i / 16; const x = ax - aw / 2 + aw * t; const y = top + ah * 0.3 - Math.sin(Math.PI * t) * ah * 0.26; d += `<circle cx="${x}" cy="${y}" r="${W * 0.012}" fill="${i % 2 ? "#ff8a00" : "#e8590c"}"/>`; } return d; }],
  ["speed_road", "🛣️ स्पीड-रोड (motion)", (W, H) => { let d = `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1a2740"/><stop offset="60%" stop-color="#0d1626"/><stop offset="100%" stop-color="#05080f"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 10; i++) { const y = H * (0.12 + i * 0.07); const len = W * (0.3 + (i % 3) * 0.2); d += `<rect x="0" y="${y}" width="${len}" height="${3 + i % 3}" fill="#4da6ff" opacity="${0.12 + (i % 4) * 0.04}"/>`; } d += `<polygon points="${W * 0.2},${H} ${W * 0.42},${H * 0.66} ${W * 0.58},${H * 0.66} ${W * 0.8},${H}" fill="#11151c"/>`; for (let i = 0; i < 5; i++) { const t = i / 5; const y = H * (0.66 + t * 0.34); const w = (2 + t * 14); d += `<rect x="${W / 2 - w / 2}" y="${y}" width="${w}" height="${H * 0.04}" fill="#ffd400" opacity="0.7"/>`; } return d; }],
  ["neon_city", "🌃 नीयन-शहर", (W, H) => { let d = `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2a1147"/><stop offset="60%" stop-color="#16082b"/><stop offset="100%" stop-color="#0a0416"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 12; i++) { const x = W * (i / 12), bw = W * 0.075, bh = H * (0.12 + (i * 37 % 5) * 0.05); d += `<rect x="${x}" y="${H * 0.62 - bh}" width="${bw}" height="${bh}" fill="#1d1140" opacity="0.9"/>`; for (let k = 0; k < 4; k++) d += `<rect x="${x + bw * 0.2}" y="${H * 0.62 - bh + k * bh * 0.22 + 6}" width="${bw * 0.18}" height="${bh * 0.1}" fill="#ffe066" opacity="0.5"/>`; } d += `<rect x="0" y="${H * 0.62}" width="${W}" height="4" fill="#ff2d78" opacity="0.6"/><rect x="0" y="${H * 0.66}" width="${W}" height="2" fill="#4da6ff" opacity="0.5"/><rect x="0" y="${H * 0.62}" width="${W}" height="${H * 0.38}" fill="#000" opacity="0.4"/>`; return d; }],
  ["gold_lux", "👑 गोल्ड-लग्ज़री", (W, H) => { let d = `<defs><radialGradient id="rb" cx="50%" cy="40%" r="80%"><stop offset="0%" stop-color="#2a2a2a"/><stop offset="100%" stop-color="#080808"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = -4; i < 12; i++) { const x = W * (i * 0.12); d += `<line x1="${x}" y1="0" x2="${x + W * 0.4}" y2="${H}" stroke="#caa24a" stroke-width="1.5" opacity="0.18"/>`; } const br = (x, y, sx, sy) => `<path d="M ${x} ${y + sy * H * 0.08} V ${y} H ${x + sx * W * 0.08}" stroke="#ffd86b" stroke-width="5" fill="none"/>`; d += br(W * 0.05, H * 0.05, 1, 1) + br(W * 0.95, H * 0.05, -1, 1) + br(W * 0.05, H * 0.95, 1, -1) + br(W * 0.95, H * 0.95, -1, -1); d += `<ellipse cx="${W / 2}" cy="${H * 0.78}" rx="${W * 0.42}" ry="${H * 0.05}" fill="#caa24a" opacity="0.08"/>`; return d; }],
  ["carbon_red", "🏁 कार्बन-रेड", (W, H) => { let d = `<defs><linearGradient id="rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#3a0008"/><stop offset="55%" stop-color="#1a0004"/><stop offset="100%" stop-color="#000"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let y = 0; y < H; y += 26) for (let x = 0; x < W; x += 26) { const o = ((x + y) / 26) % 2 === 0; d += `<rect x="${x}" y="${y}" width="13" height="13" fill="#fff" opacity="${o ? 0.025 : 0.01}"/>`; } d += `<polygon points="0,${H * 0.4} ${W},${H * 0.2} ${W},${H * 0.3} 0,${H * 0.5}" fill="#E4002B" opacity="0.25"/>`; return d; }],
];
function readyBgSvg(id, W, H) { const r = READY_BG.find((x) => x[0] === id); return (r && r[2]) ? r[2](W, H) : ""; }
// 3D दो-रंग बटन (label + value), उभरा हुआ
function btn3d(x, y, bw, bh, label, value, lFill, vFill, vText, lSize, vSize) {
  const rx = bh / 2, split = x + bw * 0.54, lift = 5;
  return `<rect x="${x}" y="${y + lift}" width="${bw}" height="${bh}" rx="${rx}" fill="#000" opacity="0.4"/>`
    + `<path d="M ${x + rx} ${y} H ${split} V ${y + bh} H ${x + rx} A ${rx} ${rx} 0 0 1 ${x + rx} ${y} Z" fill="${lFill}"/>`
    + `<path d="M ${split} ${y} H ${x + bw - rx} A ${rx} ${rx} 0 0 1 ${x + bw - rx} ${y + bh} H ${split} Z" fill="${vFill}"/>`
    + `<rect x="${x}" y="${y}" width="${bw}" height="${bh}" rx="${rx}" fill="none" stroke="#ffd400" stroke-width="2.5"/>`
    + `<rect x="${x + 8}" y="${y + 3}" width="${bw - 16}" height="${bh * 0.3}" rx="${rx * 0.6}" fill="#fff" opacity="0.14"/>`
    + `<text x="${x + (split - x) / 2}" y="${y + bh * 0.64}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${lSize || 24}" font-weight="700" fill="#fff">${esc(label)}</text>`
    + `<text x="${split + (x + bw - split) / 2}" y="${y + bh * 0.66}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${vSize || 38}" font-weight="800" fill="${vText || "#fff"}">${esc(value)}</text>`;
}
const AI_BG_PRESETS = [
  ["", "— तैयार background चुनें —"],
  ["modern Honda two-wheeler showroom interior, bright clean lighting, empty centre space", "🏬 शोरूम (अंदर)"],
  ["professional product photo studio, soft grey gradient, spotlight, empty centre", "📸 स्टूडियो (सादा)"],
  ["Diwali festive background, glowing diyas, golden bokeh lights, warm tones, empty centre", "🪔 दिवाली (दीये)"],
  ["colorful Holi celebration background, vibrant powder splashes, bright, empty centre", "🎨 होली (रंग)"],
  ["Navratri Garba festive background, marigold flowers, warm festive lights, empty centre", "🌼 नवरात्रि (गेंदा)"],
  ["Ganesh Chaturthi festive backdrop, soft lotus and marigold, warm glow, empty centre", "🕉️ गणेश उत्सव"],
  ["city street at golden hour, smooth bokeh, wet road reflection, empty centre", "🌆 शहर की सड़क"],
  ["scenic mountain highway with blue sky and clouds, empty centre for product", "🏔️ पहाड़ी सड़क"],
  ["premium dark garage, concrete floor, dramatic rim lighting, empty centre", "🏎️ प्रीमियम गैराज"],
  ["abstract dynamic red and black background with glowing light streaks, empty centre", "🔴 लाल स्पोर्टी"],
  ["clean blue gradient studio background, subtle glow, empty centre", "🔵 नीला ग्रेडिएंट"],
  ["independence day patriotic tricolor background, soft, empty centre", "🇮🇳 तिरंगा (देशभक्ति)"],
];
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
  { id: "split", label: "Split (हल्का)", bg: "light", pos: { model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 184 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 }, feat: { x: 30, y: 560 }, banks: { x: 30, y: 690 } } },
  { id: "bold", label: "लाल बोल्ड", bg: "red", pos: { model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 210 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 }, feat: { x: 30, y: 560 }, banks: { x: 30, y: 690 } } },
  { id: "dark", label: "गहरा प्रीमियम", bg: "dark", pos: { model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 210 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 }, feat: { x: 30, y: 560 }, banks: { x: 30, y: 690 } } },
  { id: "festive", label: "त्यौहार ऑफर", bg: "festive", pos: { model: { x: 54, y: 160 }, logo: { x: 900, y: 30 }, bike: { x: 280, y: 250 }, price: { x: 54, y: 700 }, offer: { x: 560, y: 685 }, feat: { x: 30, y: 560 }, banks: { x: 30, y: 690 } } },
];

export default function PromoEditor({ apiBase, token, brandId, onSent }) {
  const [f, setF] = useState({ model: "Shine 100", price: "71896", down: "4999", cashback: "10000", features: "High Mileage, Tubeless, Self Start, Digital Meter", phone: "9713394738", place: "VP Honda, परवलिया सड़क, भोपाल", brand: "VP Honda", tagline: "SOLID माइलेज़" });
  const [layout, setLayout] = useState("standard");
  const [bg, setBg] = useState("light");
  const [aiBg, setAiBg] = useState(null);
  const [readyBg, setReadyBg] = useState("none");
  const [cBanks, setCBanks] = useState(["HDB", "IDFC First", "Shriram Finance"]);
  const [bgPrompt, setBgPrompt] = useState("");
  const [template, setTemplate] = useState("split");
  const [bgColor, setBgColor] = useState("#1565c0");
  const [bikeImg, setBikeImg] = useState(null);
  const [rawBike, setRawBike] = useState(null);
  const [removeBg, setRemoveBg] = useState(true);
  const [bikeDim, setBikeDim] = useState({ w: 560, h: 380 });
  const [bikeScale, setBikeScale] = useState(1);
  // Crop modal state
  const [cropSrc, setCropSrc] = useState(null);
  const [cropBox, setCropBox] = useState({ x: 0.1, y: 0.1, w: 0.8, h: 0.8 });
  const [cropDrag, setCropDrag] = useState(null);
  const cropImgRef = useRef(null);
  const [pos, setPos] = useState({ model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 184 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 }, feat: { x: 30, y: 560 }, banks: { x: 30, y: 690 } });
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
  function onBike(e) {
    const file = e.target.files && e.target.files[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { setCropSrc(r.result); setCropBox({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 }); };
    r.readAsDataURL(file);
    e.target.value = "";
  }

  // Crop confirm — canvas पर crop करो फिर rawBike set करो
  function confirmCrop() {
    if (!cropSrc || !cropImgRef.current) return;
    const img = cropImgRef.current;
    const iw = img.naturalWidth, ih = img.naturalHeight;
    const cx = Math.round(cropBox.x * iw), cy = Math.round(cropBox.y * ih);
    const cw = Math.round(cropBox.w * iw), ch = Math.round(cropBox.h * ih);
    const canvas = document.createElement("canvas");
    canvas.width = cw; canvas.height = ch;
    canvas.getContext("2d").drawImage(img, cx, cy, cw, ch, 0, 0, cw, ch);
    setRawBike(canvas.toDataURL("image/png"));
    setCropSrc(null);
  }
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
      const res = await fetch(apiBase + "/api/ai-bg", { method: "POST", headers: { "Content-Type": "application/json", ...(token ? { Authorization: "Bearer " + token } : {}) }, body: JSON.stringify({ brand: brandId || "vp_honda", prompt: (bgPrompt || ((f.model || "") + " premium showroom backdrop")), w: 1080, h: 1080 }) });
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
  function resetPos() { setPos({ model: { x: 54, y: 120 }, logo: { x: 900, y: 24 }, bike: { x: 260, y: 184 }, price: { x: 54, y: 690 }, offer: { x: 560, y: 670 }, feat: { x: 30, y: 560 }, banks: { x: 30, y: 690 } }); setBikeScale(1); }

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
      fd.append("layout", layout);
      fd.append("tagline", f.tagline || "");
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
  const textMain = (readyBg !== "none" || aiBg || bg === "red" || bg === "dark" || bg === "festive" || (bg === "custom" && isDarkHex(bgColor))) ? "#fff" : DARK;
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

  // Honda Official layout SVG (client-side — server वाले जैसा)
  const hondaOfficialInner = layout === "honda_official" ? (() => {
    const diag = `<defs><pattern id="diag2" width="32" height="32" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="32" height="32" fill="#f7f7f7"/><line x1="0" y1="0" x2="0" y2="32" stroke="#e8e8e8" stroke-width="5"/></pattern></defs><rect width="${W}" height="${H}" fill="url(#diag2)"/>`;
    const rx = W * 0.545, bw = W * 0.425, bh = H * 0.112, gap = H * 0.022;
    const dp = f.down, cb = f.cashback, pr = f.price;
    const tagline = f.tagline || "SOLID माइलेज़";
    return `${diag}
      <rect x="0" y="0" width="${W}" height="${H * 0.006}" fill="${ACCENT}"/>
      <rect x="${W * 0.84}" y="${H * 0.022}" width="${W * 0.14}" height="${H * 0.058}" rx="8" fill="${ACCENT}"/>
      <text x="${W * 0.91}" y="${H * 0.061}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W * 0.028}" font-weight="900" fill="#fff">HONDA</text>
      <text x="${W * 0.04}" y="${H * 0.135}" font-family="Arial,sans-serif" font-size="${W * 0.072}" font-weight="900" font-style="italic" fill="#141414">${esc(f.model)}</text>
      <rect x="${W * 0.04}" y="${H * 0.148}" width="${W * 0.34}" height="${H * 0.007}" rx="3" fill="${ACCENT}"/>
      <text x="${W * 0.04}" y="${H * 0.208}"><tspan font-family="Arial Black,sans-serif" font-size="${W * 0.06}" font-weight="900" fill="${ACCENT}">SOLID </tspan><tspan font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W * 0.054}" font-weight="800" fill="#141414">माइलेज़</tspan></text>
      ${bikeG}
      <text x="${rx + bw * 0.5}" y="${H * 0.125}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W * 0.03}" font-weight="800" fill="#141414">लिमिटेड पीरियड ऑफर</text>
      ${dp ? `<rect x="${rx}" y="${H * 0.14}" width="${bw}" height="${bh}" rx="10" fill="#141414"/>
      <rect x="${rx + bw * 0.42}" y="${H * 0.14}" width="${bw * 0.58}" height="${bh}" rx="10" fill="${GOLD}"/>
      <text x="${rx + bw * 0.21}" y="${H * 0.14 + bh * 0.42}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W * 0.024}" font-weight="700" fill="#fff">डाउन</text>
      <text x="${rx + bw * 0.21}" y="${H * 0.14 + bh * 0.72}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W * 0.024}" font-weight="700" fill="#fff">पेमेंट</text>
      <text x="${rx + bw * 0.72}" y="${H * 0.14 + bh * 0.68}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W * 0.052}" font-weight="900" fill="${ACCENT}">₹${esc(dp)}*</text>` : ""}
      ${cb ? `<rect x="${rx}" y="${H * 0.14 + bh + gap}" width="${bw}" height="${bh}" rx="10" fill="#141414"/>
      <rect x="${rx + bw * 0.42}" y="${H * 0.14 + bh + gap}" width="${bw * 0.58}" height="${bh}" rx="10" fill="${ACCENT}"/>
      <text x="${rx + bw * 0.21}" y="${H * 0.14 + bh + gap + bh * 0.42}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W * 0.024}" font-weight="700" fill="#fff">इंस्टेंट</text>
      <text x="${rx + bw * 0.21}" y="${H * 0.14 + bh + gap + bh * 0.72}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W * 0.024}" font-weight="700" fill="#fff">कैशबैक</text>
      <text x="${rx + bw * 0.68}" y="${H * 0.14 + bh + gap + bh * 0.52}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W * 0.048}" font-weight="900" fill="#fff">₹${esc(cb)}*</text>
      <text x="${rx + bw * 0.88}" y="${H * 0.14 + bh + gap + bh * 0.78}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W * 0.022}" fill="#fff">तक</text>` : ""}
      ${pr ? `<text x="${rx + bw * 0.5}" y="${H * 0.55}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W * 0.028}" font-weight="700" fill="#141414">एक्स-शोरूम (मध्यप्रदेश)</text>
      <text x="${rx + bw * 0.5}" y="${H * 0.645}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W * 0.082}" font-weight="900" fill="${ACCENT}">₹${esc(pr)}</text>` : ""}
      <circle cx="${W * 0.115}" cy="${H * 0.74}" r="${W * 0.085}" fill="#141414" stroke="${ACCENT}" stroke-width="5"/>
      <text x="${W * 0.115}" y="${H * 0.728}" text-anchor="middle" font-family="monospace" font-size="${W * 0.03}" fill="#fff">0  10:10</text>
      <text x="${W * 0.115}" y="${H * 0.755}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${W * 0.018}" font-weight="700" fill="${GOLD}">DIGITAL</text>
      <circle cx="${W * 0.1}" cy="${H * 0.285}" r="${W * 0.062}" fill="#141414" stroke="${GOLD}" stroke-width="4"/>
      <text x="${W * 0.1}" y="${H * 0.273}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W * 0.03}" font-weight="900" fill="#fff">VP</text>
      <text x="${W * 0.1}" y="${H * 0.298}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W * 0.02}" font-weight="700" fill="${GOLD}">HONDA</text>
      <rect x="0" y="${H * 0.822}" width="${W}" height="${H * 0.082}" fill="${ACCENT}"/>
      ${f.features.split(",").map((ft, i, arr) => { const fw = W / arr.length; return `<text x="${fw * i + fw * 0.5}" y="${H * 0.873}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W * 0.023}" font-weight="700" fill="#fff">${esc(ft.trim())}</text>${i < arr.length - 1 ? `<line x1="${fw * (i + 1)}" y1="${H * 0.832}" x2="${fw * (i + 1)}" y2="${H * 0.895}" stroke="#fff" stroke-width="1.5" opacity="0.5"/>` : ""}`; }).join("")}
      <rect x="0" y="${H * 0.905}" width="${W * 0.58}" height="${H * 0.044}" fill="#f0f0f0"/>
      <text x="${W * 0.04}" y="${H * 0.921}" font-family="Arial,sans-serif" font-size="${W * 0.018}" font-weight="600" fill="#141414">फाइनेंस पार्टनर्स*</text>
      ${cBanks.slice(0, 4).map((bk, i) => `<rect x="${W * 0.04 + i * W * 0.135}" y="${H * 0.924}" width="${W * 0.12}" height="${H * 0.022}" rx="4" fill="#ddd"/><text x="${W * 0.04 + i * W * 0.135 + W * 0.06}" y="${H * 0.939}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${W * 0.016}" font-weight="700" fill="#141414">${esc(bk)}</text>`).join("")}
      <rect x="${W * 0.62}" y="${H * 0.905}" width="${W * 0.38}" height="${H * 0.044}" fill="#e8e8e8"/>
      <text x="${W * 0.645}" y="${H * 0.921}" font-family="Arial,sans-serif" font-size="${W * 0.018}" fill="#141414">कैशबैक पार्टनर*</text>
      <rect x="${W * 0.72}" y="${H * 0.923}" width="${W * 0.24}" height="${H * 0.024}" rx="4" fill="#0054a6"/>
      <text x="${W * 0.84}" y="${H * 0.939}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W * 0.018}" fill="#fff">HDFC BANK</text>
      <rect x="0" y="${H * 0.95}" width="${W}" height="${H * 0.05}" fill="#141414"/>
      <text x="${W * 0.5}" y="${H * 0.985}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W * 0.03}" font-weight="800" fill="#fff">${esc(f.brand)},  फ़ोन ${esc(f.phone)}  —  ${esc(f.place)}</text>
      ${stickers.map((s) => { const body = s.kind === "badge" ? `<g transform="scale(${(s.r / 60).toFixed(3)})">${buildBadge(s.style, s.text)}</g>` : shapeSVG(s.name, s.r); return `<g data-el="stk:${s.id}" transform="translate(${s.x},${s.y})" style="cursor:move">${body}</g>`; }).join("")}
    `;
  })() : null;

  const inner = hondaOfficialInner || `
    ${readyBg !== "none" ? readyBgSvg(readyBg, W, H) : (aiBg ? `<image href="${aiBg}" x="0" y="0" width="${W}" height="${H}" preserveAspectRatio="xMidYMid slice"/>` : bgRect)}
    ${bunting}
    <rect x="0" y="0" width="${W}" height="8" fill="${ACCENT}"/>
    ${bikeG}
    <g data-el="model" transform="translate(${pos.model.x},${pos.model.y})" style="cursor:move"><text x="0" y="0" font-family="Arial,sans-serif" font-size="86" font-weight="800" fill="${textMain}">${esc(f.model)}</text><rect x="2" y="18" width="240" height="9" fill="${ACCENT}"/></g>
    <g data-el="price" transform="translate(${pos.price.x},${pos.price.y})" style="cursor:move">${btn3d(0, 0, 470, 96, "एक्स-शोरूम कीमत", "₹" + f.price, DARK, ACCENT, "#fff", 26, 54)}</g>
    <g data-el="offer" transform="translate(${pos.offer.x},${pos.offer.y})" style="cursor:move"><text x="0" y="0" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="32" font-weight="800" fill="${textMain}">लिमिटेड पीरियड ऑफर</text>${btn3d(0, 14, 466, 70, "डाउन पेमेंट", "₹" + f.down, DARK, GOLD, "#b00018", 26, 42)}${btn3d(0, 96, 466, 70, "कैशबैक", "₹" + f.cashback, DARK, ACCENT, "#fff", 26, 42)}</g>
    <g data-el="feat" transform="translate(${pos.feat.x},${pos.feat.y})" style="cursor:move">${chipBlock(f.features.split(",").map((s) => s.trim()).filter(Boolean), 1020, 42)}</g>
    <g data-el="banks" transform="translate(${pos.banks.x},${pos.banks.y})" style="cursor:move"><text x="0" y="-8" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="24" font-weight="800" fill="${GOLD}">कम ब्याज पर फाइनेंस सुविधा उपलब्ध</text>${chipBlock(cBanks, 1020, 38)}</g>
    <rect x="0" y="913" width="${W}" height="167" fill="${DARK}"/>
    <defs><linearGradient id="abpl" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#ff2a44"/><stop offset="100%" stop-color="${ACCENT}"/></linearGradient><linearGradient id="abpr" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#2b2b2b"/><stop offset="100%" stop-color="${DARK}"/></linearGradient></defs>
    <rect x="32" y="944" width="1016" height="113" rx="56" fill="#000" opacity="0.55"/>
    <path d="M 88 936 H 642 V 1049 H 88 A 56 56 0 0 1 88 936 Z" fill="url(#abpl)"/>
    <path d="M 642 936 H 992 A 56 56 0 0 1 992 1049 H 642 Z" fill="url(#abpr)"/>
    <rect x="32" y="936" width="1016" height="113" rx="56" fill="none" stroke="${GOLD}" stroke-width="3"/>
    <rect x="42" y="940" width="996" height="34" rx="20" fill="#fff" opacity="0.12"/>
    <line x1="642" y1="944" x2="642" y2="1041" stroke="${GOLD}" stroke-width="2" opacity="0.7"/>
    <path d="M 94 1010 C 72 986, 72 976, 94 976 C 116 976, 116 986, 94 1010 Z" fill="${GOLD}"/><circle cx="94" cy="978" r="7" fill="#fff"/>
    <text x="124" y="987" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="36" font-weight="800" fill="#fff">${esc(f.brand)}</text>
    <text x="124" y="1026" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="23" fill="#ffe9ec">${esc(f.place)}</text>
    <text x="845" y="986" text-anchor="middle" font-family="Arial,sans-serif" font-size="27" fill="${GOLD}">फ़ोन</text>
    <text x="845" y="1027" text-anchor="middle" font-family="Arial,sans-serif" font-size="40" font-weight="800" fill="#fff">${esc(f.phone)}</text>
    <text x="1050" y="905" text-anchor="end" font-family="Arial" font-size="18" fill="#888">T&amp;C Apply</text>
    <g data-el="logo" transform="translate(${pos.logo.x},${pos.logo.y})" style="cursor:move"><image href="/logos/vp_honda.png" x="0" y="0" width="124" height="124"/></g>
    ${stickers.map((s) => { const body = s.kind === "badge" ? `<g transform="scale(${(s.r / 60).toFixed(3)})">${buildBadge(s.style, s.text)}</g>` : shapeSVG(s.name, s.r); return `<g data-el="stk:${s.id}" transform="translate(${s.x},${s.y})" style="cursor:move">${body}</g>`; }).join("")}
  `;

  const inp = "w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none text-white border border-neutral-700";
  const selItem = selStk ? stickers.find((s) => s.id === selStk) : null;
  const selR = selItem ? (selItem.r || 60) : 60;

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 mb-5 space-y-3">

      {/* ── Crop Modal ── */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 w-full max-w-sm space-y-3">
            <p className="text-sm font-semibold text-white text-center">📐 फोटो Crop करें</p>
            <p className="text-xs text-neutral-400 text-center">नीचे sliders से crop area adjust करें</p>
            <div className="relative overflow-hidden rounded-xl border border-neutral-700 bg-black" style={{ aspectRatio: "1/1" }}>
              <img ref={cropImgRef} src={cropSrc} alt="crop" crossOrigin="anonymous"
                style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
              {/* crop overlay */}
              <div style={{
                position: "absolute",
                left: `${cropBox.x * 100}%`, top: `${cropBox.y * 100}%`,
                width: `${cropBox.w * 100}%`, height: `${cropBox.h * 100}%`,
                border: "2px solid #ffd400", boxShadow: "0 0 0 1000px rgba(0,0,0,0.55)",
                pointerEvents: "none", boxSizing: "border-box"
              }} />
            </div>
            {/* Sliders */}
            <div className="space-y-1.5 text-xs text-neutral-300">
              <label>बायाँ किनारा (Left) {Math.round(cropBox.x*100)}%
                <input type="range" min="0" max="0.6" step="0.01" value={cropBox.x}
                  onChange={e => { const v=parseFloat(e.target.value); setCropBox(b=>({...b, x:v, w:Math.max(0.1, Math.min(b.w, 1-v-0.05))})); }} className="w-full accent-yellow-400" /></label>
              <label>ऊपरी किनारा (Top) {Math.round(cropBox.y*100)}%
                <input type="range" min="0" max="0.6" step="0.01" value={cropBox.y}
                  onChange={e => { const v=parseFloat(e.target.value); setCropBox(b=>({...b, y:v, h:Math.max(0.1, Math.min(b.h, 1-v-0.05))})); }} className="w-full accent-yellow-400" /></label>
              <label>चौड़ाई (Width) {Math.round(cropBox.w*100)}%
                <input type="range" min="0.1" max="1" step="0.01" value={cropBox.w}
                  onChange={e => { const v=parseFloat(e.target.value); setCropBox(b=>({...b, w:Math.min(v, 1-b.x)})); }} className="w-full accent-yellow-400" /></label>
              <label>ऊँचाई (Height) {Math.round(cropBox.h*100)}%
                <input type="range" min="0.1" max="1" step="0.01" value={cropBox.h}
                  onChange={e => { const v=parseFloat(e.target.value); setCropBox(b=>({...b, h:Math.min(v, 1-b.y)})); }} className="w-full accent-yellow-400" /></label>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCropSrc(null)}
                className="flex-1 py-2.5 rounded-xl border border-neutral-600 text-sm text-neutral-300">रद्द करें</button>
              <button type="button" onClick={confirmCrop}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black" style={{background:"#ffd400"}}>✅ Crop करें</button>
            </div>
            <button type="button" onClick={() => { setRawBike(cropSrc); setCropSrc(null); }}
              className="w-full py-2 rounded-xl border border-neutral-700 text-xs text-neutral-400">बिना crop के use करें</button>
          </div>
        </div>
      )}

      <p className="text-xs text-neutral-400">यही विज्ञापन poster — हर हिस्सा drag करके जमाएँ, text बदलें, sticker जोड़ें, फिर download या Review में भेजें।</p>
      <label className="text-xs text-neutral-400 block">Template style (और भी जुड़ते रहेंगे)
        <select value={template} onChange={(e) => applyTemplate(e.target.value)} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 mt-1 text-white">{TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>

      <svg ref={svgRef} viewBox="0 0 1080 1080" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
        style={{ width: "100%", maxWidth: 520, display: "block", margin: "0 auto", borderRadius: 14, touchAction: "none", background: "#000" }}
        dangerouslySetInnerHTML={{ __html: inner }} />
      <div className="text-xs" style={{ color: GOLD, minHeight: 16 }}>{note}</div>

      {/* Layout selector — Honda Official vs Standard */}
      <div className="mb-2">
        <p className="text-xs text-neutral-400 mb-1">🖼️ Poster Layout चुनें</p>
        <div className="flex gap-3">
          {[
            { id: "standard", label: "Standard", desc: "बाइक बीच में, offer ऊपर-नीचे", colors: ["#E4002B","#ffd400","#141414"] },
            { id: "honda_official", label: "Honda Official", desc: "बाइक बाएँ, offer boxes दाएँ, features bar नीचे", colors: ["#f7f7f7","#E4002B","#141414"] },
          ].map((l) => (
            <button key={l.id} type="button" onClick={() => setLayout(l.id)}
              className="flex-1 rounded-xl p-2 border-2 text-left transition-all"
              style={{ borderColor: layout === l.id ? GOLD : "#333", background: layout === l.id ? "#1a1a1a" : "#111" }}>
              {/* mini color preview */}
              <div className="flex gap-1 mb-1">
                {l.colors.map((c, i) => <div key={i} style={{ width: 18, height: 18, borderRadius: 4, background: c }} />)}
              </div>
              <div className="text-xs font-bold" style={{ color: layout === l.id ? GOLD : "#fff" }}>{l.label}</div>
              <div className="text-[10px] text-neutral-500 leading-tight mt-0.5">{l.desc}</div>
            </button>
          ))}
        </div>
      </div>
      {layout === "honda_official" && (
        <label className="text-xs text-neutral-400 block">Tagline (जैसे: SOLID माइलेज़)
          <input className={inp} value={f.tagline || ""} onChange={(e) => set("tagline", e.target.value)} placeholder="SOLID माइलेज़" />
        </label>
      )}

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-neutral-400">गाड़ी का नाम<input className={inp} value={f.model} onChange={(e) => set("model", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">कीमत (₹)<input className={inp} value={f.price} onChange={(e) => set("price", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">डाउन पेमेंट (₹)<input className={inp} value={f.down} onChange={(e) => set("down", e.target.value)} /></label>
        <label className="text-xs text-neutral-400">कैशबैक (₹)<input className={inp} value={f.cashback} onChange={(e) => set("cashback", e.target.value)} /></label>
      </div>
      <label className="text-xs text-neutral-400 block">फीचर (नीचे से चुनें — एक या कई — फिर text भी edit कर सकते हैं)<input className={inp} value={f.features} onChange={(e) => set("features", e.target.value)} /></label>
      <div className="flex flex-wrap gap-1">
        {FEATURE_OPTS.map((ft) => { const on = f.features.split(",").map((s) => s.trim()).includes(ft); return (
          <button key={ft} type="button" onClick={() => { const arr = f.features.split(",").map((s) => s.trim()).filter(Boolean); set("features", (on ? arr.filter((x) => x !== ft) : [...arr, ft]).join(", ")); }} className={"text-xs rounded-full px-2 py-1 border " + (on ? "text-black" : "border-neutral-600 text-neutral-300")} style={on ? { background: GOLD } : {}}>{ft}</button>
        ); })}
      </div>
      <label className="text-xs text-neutral-400 block mt-1">फाइनेंस — बैंक चुनें (एक या कई)</label>
      <div className="flex flex-wrap gap-1">
        {BANK_OPTS.map((bk) => { const on = cBanks.includes(bk); return (
          <button key={bk} type="button" onClick={() => setCBanks((a) => on ? a.filter((x) => x !== bk) : [...a, bk])} className={"text-xs rounded-full px-2 py-1 border " + (on ? "text-black" : "border-neutral-600 text-neutral-300")} style={on ? { background: "#16a34a", color: "#fff" } : {}}>{bk}</button>
        ); })}
      </div>
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

      <div className="rounded-xl bg-neutral-800/50 p-2 mt-1 space-y-2">
        <span className="text-xs text-neutral-300">🎨 तैयार background (तुरंत, बिना AI)</span>
        <select value={readyBg} onChange={(e) => { setReadyBg(e.target.value); if (e.target.value !== "none") setAiBg(null); }} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 text-white mb-1">
          {READY_BG.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
        </select>
        <span className="text-xs text-neutral-300">🖼️ AI background — तैयार चुनें या ख़ुद लिखें</span>
        <select value="" onChange={(e) => { if (e.target.value) setBgPrompt(e.target.value); }} className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 text-white">
          {AI_BG_PRESETS.map(([v, l]) => <option key={l} value={v}>{l}</option>)}
        </select>
        <input className={inp} placeholder="या ख़ुद लिखें (अंग्रेज़ी में बेहतर): जैसे diwali diyas background" value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} />
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={aiBackground} className="text-xs rounded-lg py-2 px-3 text-black font-semibold" style={{ background: GOLD }}>🖼️ AI background बनाएँ</button>
          {aiBg && <button type="button" onClick={() => setAiBg(null)} className="text-xs rounded-lg py-2 px-3 border border-neutral-600 text-white">हटाएँ</button>}
          <button type="button" onClick={aiText} className="text-xs rounded-lg py-2 px-3 border border-neutral-600 text-white">✨ AI से tagline</button>
        </div>
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
