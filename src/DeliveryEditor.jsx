import { useState, useRef, useEffect } from "react";
import { getBrand } from "./brands.js";
const vib = (ms=40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch(_){} };

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
  // ── शोरूम / स्टूडियो ──
  ["showroom", "🏬 शोरूम (अंदर)", (W, H) => `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3a3f47"/><stop offset="100%" stop-color="#14171a"/></linearGradient><radialGradient id="rs" cx="50%" cy="40%" r="62%"><stop offset="0%" stop-color="#ffffff" stop-opacity="0.18"/><stop offset="100%" stop-color="#ffffff" stop-opacity="0"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/><rect width="${W}" height="${H}" fill="url(#rs)"/>`],
  ["studio", "📸 स्टूडियो (सादा)", (W, H) => `<defs><radialGradient id="rb" cx="50%" cy="38%" r="72%"><stop offset="0%" stop-color="#6b7280"/><stop offset="100%" stop-color="#23272e"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`],
  ["redshow", "🔴 रेड शोरूम", (W, H) => `<defs><radialGradient id="rb" cx="50%" cy="35%" r="70%"><stop offset="0%" stop-color="#b71c1c"/><stop offset="100%" stop-color="#4a0000"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/><rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#ffd400" stroke-width="18" opacity="0.5"/>`],
  ["whiteclean", "⬜ सफ़ेद (clean)", (W, H) => `<rect width="${W}" height="${H}" fill="#f8f8f8"/><rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#E4002B" stroke-width="20" opacity="0.8"/><rect x="16" y="16" width="${W-32}" height="${H-32}" fill="none" stroke="#ffd400" stroke-width="6" opacity="0.6"/>`],
  // ── त्यौहार ──
  ["diwali", "🪔 दिवाली", (W, H) => { let d = `<defs><radialGradient id="rb" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="#c2641a"/><stop offset="100%" stop-color="#4a1505"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 22; i++) { const x = (i * 137 % W), y = (i * 91 % (H * 0.8)), r = 4 + (i % 5) * 3; d += `<circle cx="${x}" cy="${y}" r="${r}" fill="#ffd86b" opacity="${0.18 + (i % 4) * 0.07}"/>`; } return d; }],
  ["holi", "🎨 होली (रंग)", (W, H) => { const c = ["#ff2d78", "#ffd400", "#16a34a", "#1565c0", "#9b51e0"]; let d = `<defs><linearGradient id="rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2a1a3a"/><stop offset="100%" stop-color="#3a1530"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 14; i++) { d += `<circle cx="${i * 173 % W}" cy="${i * 121 % H}" r="${50 + (i % 4) * 40}" fill="${c[i % 5]}" opacity="0.16"/>`; } return d; }],
  ["navratri", "🌼 नवरात्रि (गेंदा)", (W, H) => { let d = `<defs><radialGradient id="rb" cx="50%" cy="38%" r="75%"><stop offset="0%" stop-color="#9a1840"/><stop offset="100%" stop-color="#3a0818"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i = 0; i < 18; i++) { d += `<circle cx="${i * 151 % W}" cy="${i * 97 % (H * 0.85)}" r="${8 + i % 4 * 3}" fill="${i % 2 ? "#ff8a00" : "#ffd24a"}" opacity="0.3"/>`; } return d; }],
  ["ganesh", "🕉️ गणेश उत्सव", (W, H) => `<defs><radialGradient id="rb" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#ff8f00"/><stop offset="100%" stop-color="#e65100"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/><rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#ffd400" stroke-width="20" opacity="0.7"/><rect x="18" y="18" width="${W-36}" height="${H-36}" fill="none" stroke="#fff" stroke-width="5" opacity="0.3"/>`],
  ["raksha", "💝 रक्षाबंधन", (W, H) => { let d = `<defs><radialGradient id="rb" cx="50%" cy="30%" r="70%"><stop offset="0%" stop-color="#fff0f3"/><stop offset="100%" stop-color="#fce4ec"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`; for (let i=0;i<8;i++){const x=W*0.08+i*(W*0.84/7),y=i%2?H*0.08:H*0.05,r=W*0.022; d+=`<path d="M ${x} ${y+r} C ${x-r*1.3} ${y-r*0.4}, ${x-r*0.5} ${y-r*1.1}, ${x} ${y-r*0.3} C ${x+r*0.5} ${y-r*1.1}, ${x+r*1.3} ${y-r*0.4}, ${x} ${y+r} Z" fill="#e91e63" opacity="0.5"/>`;} return d; }],
  ["independence", "🇮🇳 स्वतंत्रता दिवस", (W, H) => `<rect width="${W}" height="${H}" fill="#000c24"/><rect x="0" y="0" width="${W}" height="${H*0.085}" fill="#ff9933" opacity="0.85"/><rect x="0" y="${H*0.085}" width="${W}" height="${H*0.085}" fill="#ffffff" opacity="0.85"/><rect x="0" y="${H*0.17}" width="${W}" height="${H*0.085}" fill="#138808" opacity="0.85"/><rect x="0" y="${H*0.915}" width="${W}" height="${H*0.085}" fill="#ff9933" opacity="0.85"/>`],
  // ── रंग / एब्स्ट्रैक्ट ──
  ["city", "🌆 शहर की सड़क", (W, H) => `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34506b"/><stop offset="100%" stop-color="#161e28"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/><rect x="0" y="${H * 0.7}" width="${W}" height="${H * 0.3}" fill="#0d141c" opacity="0.6"/>`],
  ["blue", "🔵 नीला प्रीमियम", (W, H) => `<defs><linearGradient id="rb" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#1565c0"/><stop offset="100%" stop-color="#0a2a5a"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`],
  ["golden", "🟡 गोल्डन (luxury)", (W, H) => `<defs><radialGradient id="rb" cx="50%" cy="40%" r="70%"><stop offset="0%" stop-color="#8B6914"/><stop offset="100%" stop-color="#2a1a00"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/><rect x="0" y="0" width="${W}" height="${H}" fill="none" stroke="#ffd400" stroke-width="20" opacity="0.8"/>`],
  ["purple", "🟣 बैंगनी (modern)", (W, H) => `<defs><linearGradient id="rb" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#4a148c"/><stop offset="100%" stop-color="#1a0033"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`],
  ["green", "🟢 हरा (ताज़गी)", (W, H) => `<defs><radialGradient id="rb" cx="50%" cy="35%" r="70%"><stop offset="0%" stop-color="#1b5e20"/><stop offset="100%" stop-color="#003300"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#rb)"/>`],
];
function readyBgSvg(id, W, H) { const r = READY_BG.find((x) => x[0] === id); return (r && r[2]) ? r[2](W, H) : ""; }
// ===== delivery frame designs (headline क्षेत्र का पूरा लुक) =====
const FRAMES = [
  ["classic",       "🎊 बधाई हो (क्लासिक)"],
  ["surana",        "⭐ Surana Style (card+नाम बड़ा)"],
  ["welcome_family","👨‍👩‍👧 WELCOME TO FAMILY"],
  ["congrats",      "🔴 CONGRATULATIONS (बड़ा stack)"],
  ["marigold",      "🌼 गेंदा-झालर (त्यौहार)"],
  ["welcome",       "⬜ सफ़ेद + बधाई"],
  ["polaroid",      "📸 पोलेरॉइड कार्ड"],
  ["powerhonda",    "🔥 Power Honda Style (महाबधाई)"],
  ["raghuveer",     "🏆 Raghuveer Style (नाम सबसे बड़ा)"],
  ["minimal",       "✨ Minimal (सादा, साफ़)"],
  ["gold_ceremony", "🥇 Gold Ceremony (लक्ज़री)"],
];
function frameDecor(style, f, W, H) {
  if (style === "classic") return "";
  const hl = esc(f.headline), sub = esc(f.sub), nm = esc((f.name||"").toUpperCase()), veh = esc(f.vehicle||"");
  let s = "";
  if (style === "surana") {
    // पीछे fading CONGRATULATIONS rows (Surana Instagram जैसा)
    for (let i = 0; i < 6; i++) { const y = H*0.105 + i*H*0.115, op=[0.92,0.6,0.38,0.22,0.12,0.06][i]; s += `<text x="${W*0.5}" y="${y}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="${W*0.115}" font-weight="900" fill="${ACCENT}" opacity="${op}" textLength="${W*0.98}" lengthAdjust="spacingAndGlyphs">CONGRATULATIONS</text>`; }
    // सफ़ेद card (photo इसके ऊपरी हिस्से में जाएगी)
    const cx=W*0.17, cy=H*0.155, cw=W*0.66, ch=H*0.54;
    s += `<rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" fill="#fff" rx="10" filter="drop-shadow(0 8px 24px rgba(0,0,0,0.28))"/>`;
    // photo zone hint
    s += `<rect x="${cx+10}" y="${cy+10}" width="${cw-20}" height="${ch*0.5}" fill="#f5f5f5" rx="7"/>`;
    s += `<text x="${W*0.5}" y="${cy+ch*0.28}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${W*0.028}" fill="#ccc">📷 photo drag करें यहाँ</text>`;
    // Customer name — बड़ा, bold red
    s += `<text x="${W*0.5}" y="${cy+ch*0.71}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="${W*0.07}" font-weight="900" fill="${ACCENT}" textLength="${cw*0.88}" lengthAdjust="spacingAndGlyphs">${nm}</text>`;
    s += `<text x="${W*0.5}" y="${cy+ch*0.875}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W*0.033}" font-weight="800" fill="#222" letter-spacing="1">${veh.toUpperCase()}</text>`;
    // नीचे wishes + welcome
    s += `<text x="${W*0.5}" y="${H*0.756}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${W*0.032}" font-weight="700" font-style="italic" fill="${ACCENT}">Wishing you countless safe</text>`;
    s += `<text x="${W*0.5}" y="${H*0.797}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${W*0.032}" font-weight="700" font-style="italic" fill="${ACCENT}">and joyful rides.</text>`;
    s += `<text x="${W*0.5}" y="${H*0.845}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W*0.03}" font-weight="900" fill="#222">WELCOME TO THE VP HONDA FAMILY</text>`;
  } else if (style === "welcome_family") {
    // लाल header bar + CONGRATULATIONS
    s += `<rect width="${W}" height="${H*0.16}" fill="${ACCENT}"/>`;
    s += `<text x="${W*0.5}" y="${H*0.1}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W*0.068}" font-weight="900" fill="#fff" textLength="${W*0.92}" lengthAdjust="spacingAndGlyphs">CONGRATULATIONS</text>`;
    // customer name — बड़ा नीचे
    s += `<text x="${W*0.5}" y="${H*0.735}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="${W*0.085}" font-weight="900" fill="${ACCENT}" textLength="${W*0.92}" lengthAdjust="spacingAndGlyphs">${nm}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.778}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W*0.033}" font-weight="800" fill="#222">${veh}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.828}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${W*0.031}" font-weight="700" font-style="italic" fill="${ACCENT}">Wishing you safe &amp; joyful rides.</text>`;
    s += `<text x="${W*0.5}" y="${H*0.87}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W*0.027}" font-weight="900" fill="#222">WELCOME TO THE VP HONDA FAMILY</text>`;
  } else if (style === "congrats") {
    for (let i = 0; i < 5; i++) { const y = H*0.12 + i*H*0.115, op=[1,0.65,0.4,0.22,0.1][i]; s += `<text x="${W*0.5}" y="${y}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="${W*0.115}" font-weight="900" fill="${ACCENT}" opacity="${op}" textLength="${W*0.97}" lengthAdjust="spacingAndGlyphs">CONGRATULATIONS</text>`; }
    s += `<text x="${W*0.5}" y="${H*0.8}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial,sans-serif" font-size="${W*0.05}" font-weight="800" fill="${ACCENT}">${hl}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.84}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W*0.03}" fill="#333">${sub}</text>`;
  } else if (style === "marigold") {
    for (let i = 0; i <= 14; i++) { const x = W*(i/14); s += `<circle cx="${x}" cy="${H*0.045}" r="${W*0.02}" fill="${i%2?"#ff8a00":"#ffb703"}"/><path d="M ${x} ${H*0.06} q ${W*0.01} ${H*0.03} 0 ${H*0.05} q ${-W*0.01} ${-H*0.02} 0 ${-H*0.05}" fill="#1f9d3a"/>`; }
    s += `<text x="${W*0.5}" y="${H*0.16}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W*0.085}" font-weight="900" fill="${GOLD}" stroke="#7a0016" stroke-width="3">${hl}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.205}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W*0.03}" fill="#fff">${sub}</text>`;
  } else if (style === "welcome") {
    s += `<text x="${W*0.5}" y="${H*0.12}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W*0.07}" font-weight="900" fill="${ACCENT}">${hl}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.165}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W*0.028}" fill="#444">${sub}</text>`;
  } else if (style === "polaroid") {
    s += `<text x="${W*0.5}" y="${H*0.13}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W*0.075}" font-weight="900" fill="${GOLD}" stroke="#7a0016" stroke-width="2">${hl}</text>`;
  } else if (style === "powerhonda") {
    // Power Honda महाबचत style — बड़ी red slash
    s += `<polygon points="0,${H*0.13} ${W*0.55},${H*0.10} ${W*0.65},${H*0.23} ${W*0.1},${H*0.26}" fill="${ACCENT}" opacity="0.95"/>`;
    s += `<text x="${W*0.32}" y="${H*0.19}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W*0.068}" font-weight="900" fill="#fff" textLength="${W*0.58}" lengthAdjust="spacingAndGlyphs">${hl}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.78}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="${W*0.09}" font-weight="900" fill="${ACCENT}" textLength="${W*0.92}" lengthAdjust="spacingAndGlyphs">${nm}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.83}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W*0.038}" font-weight="800" fill="${GOLD}">${veh.toUpperCase()}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.875}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${W*0.03}" fill="#fff" font-style="italic">नई गाड़ी की हार्दिक बधाई एवं शुभकामनाएं!</text>`;
  } else if (style === "raghuveer") {
    // Raghuveer style — customer name सबसे बड़ा, center में
    let conf=""; const cc=["#ff2d78","#ffd400","#16a34a","#1565c0","#9b51e0","#fff","#E4002B"];
    for(let i=0;i<28;i++){conf+=`<rect x="${(i*89)%W}" y="${(i*53)%(H*0.28)}" width="${W*0.016}" height="${W*0.016}" rx="2" fill="${cc[i%7]}" transform="rotate(${i*38} ${(i*89)%W} ${(i*53)%(H*0.28)})"/>`;}
    s += conf;
    s += `<rect x="${W*0.08}" y="${H*0.76}" width="${W*0.84}" height="${H*0.14}" rx="10" fill="#fff" filter="drop-shadow(0 4px 12px rgba(0,0,0,0.3))"/>`;
    s += `<text x="${W*0.5}" y="${H*0.81}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="${W*0.046}" font-weight="900" fill="${ACCENT}">${hl}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.855}" text-anchor="middle" font-family="Arial Black,sans-serif" font-size="${W*0.038}" font-weight="800" fill="#222">${veh}</text>`;
    // बड़ा नाम — poster के center में
    s += `<text x="${W*0.5}" y="${H*0.55}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="${W*0.13}" font-weight="900" fill="#fff" stroke="#E4002B" stroke-width="4" textLength="${W*0.92}" lengthAdjust="spacingAndGlyphs">${nm}</text>`;
  } else if (style === "minimal") {
    // Minimal — सिर्फ एक clean line
    s += `<line x1="${W*0.1}" y1="${H*0.19}" x2="${W*0.9}" y2="${H*0.19}" stroke="${GOLD}" stroke-width="4"/>`;
    s += `<text x="${W*0.5}" y="${H*0.14}" text-anchor="middle" font-family="Noto Sans Devanagari,Arial" font-size="${W*0.065}" font-weight="900" fill="#fff">${hl}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.18}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${W*0.026}" fill="${GOLD}">${sub}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.82}" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-size="${W*0.07}" font-weight="900" fill="${GOLD}">${nm}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.86}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${W*0.032}" fill="#fff">${veh}</text>`;
  } else if (style === "gold_ceremony") {
    // Gold Ceremony — luxury gold frame + big name
    s += `<rect x="${W*0.04}" y="${H*0.04}" width="${W*0.92}" height="${H*0.92}" fill="none" stroke="${GOLD}" stroke-width="8" rx="20"/>`;
    s += `<rect x="${W*0.065}" y="${H*0.065}" width="${W*0.87}" height="${H*0.87}" fill="none" stroke="${GOLD}" stroke-width="3" rx="16" stroke-dasharray="12 8" opacity="0.6"/>`;
    for(let i=0;i<4;i++){const x=i<2?W*0.04:W*0.96,y=i%2?H*0.04:H*0.96; s+=`<circle cx="${x}" cy="${y}" r="${W*0.022}" fill="${GOLD}"/>`;}
    s += `<text x="${W*0.5}" y="${H*0.12}" text-anchor="middle" font-family="Georgia,Arial,sans-serif" font-size="${W*0.06}" font-weight="900" fill="${GOLD}">${hl}</text>`;
    s += `<line x1="${W*0.15}" y1="${H*0.145}" x2="${W*0.85}" y2="${H*0.145}" stroke="${GOLD}" stroke-width="2.5" opacity="0.8"/>`;
    s += `<text x="${W*0.5}" y="${H*0.82}" text-anchor="middle" font-family="Georgia,Arial Black,sans-serif" font-size="${W*0.075}" font-weight="900" fill="${GOLD}" textLength="${W*0.88}" lengthAdjust="spacingAndGlyphs">${nm}</text>`;
    s += `<text x="${W*0.5}" y="${H*0.87}" text-anchor="middle" font-family="Arial,sans-serif" font-size="${W*0.034}" fill="#fff" letter-spacing="2">${veh.toUpperCase()}</text>`;
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
  { id: "festive",   label: "🎊 त्यौहार (केसरी)", bg: "festive" },
  { id: "red",       label: "🔴 लाल बधाई", bg: "red" },
  { id: "blue",      label: "🔵 नीला प्रीमियम", bg: "blue" },
  { id: "dark",      label: "⚫ गहरा प्रीमियम", bg: "dark" },
  { id: "white",     label: "⬜ सफ़ेद (clean)", bg: "white" },
  { id: "golden",    label: "🥇 गोल्डन (luxury)", bg: "golden" },
  { id: "navratri",  label: "🌺 नवरात्रि", bg: "navratri" },
  { id: "diwali",    label: "🪔 दिवाली", bg: "diwali" },
];

export default function DeliveryEditor({ apiBase, token, brandId, onSent }) {

  // ⚠️ पहले यहाँ VP Honda का logo base64 में हार्डकोड था — तीनों brands पर वही छपता था।
  //    (वजह: backend में /logos serve ही नहीं होता था, अब होता है।)
  //    SVG में external URL डालने से canvas tainted हो जाता है, इसलिए dataURL में बदलते हैं।
  const [logoData, setLogoData] = useState("");
  useEffect(() => {
    let dead = false;
    (async () => {
      try {
        const r = await fetch(apiBase + getBrand(brandId).logo, { mode: "cors" });
        if (!r.ok) throw new Error("logo " + r.status);
        const blob = await r.blob();
        const fr = new FileReader();
        fr.onload = () => { if (!dead) setLogoData(String(fr.result)); };
        fr.readAsDataURL(blob);
      } catch (_) { if (!dead) setLogoData(""); }
    })();
    return () => { dead = true; };
  }, [apiBase, brandId]);
  // ⚠️ brand-aware defaults — Yakuza/Mini Metro की delivery post पर भी VP Honda/Shine छप रहा था
  const B0 = getBrand(brandId);
  const [f, setF] = useState({
    name: "ग्राहक का नाम", vehicle: B0.products[0], headline: "बधाई हो!",
    sub: `नई ${B0.vehicleWord} की शुभकामनाएं`,
    phone: B0.phone, place: B0.address, brand: B0.name,
    hashtag: B0.hashtags.join(" "),
    mobile: "",                 // ग्राहक का WhatsApp — भरा हो तो उसे भी भेजी जा सकेगी
  });
  const [touched, setTouched] = useState(false);
  useEffect(() => {
    if (touched) return;
    const b = getBrand(brandId);
    setF((x) => ({ ...x, vehicle: b.products[0], sub: `नई ${b.vehicleWord} की शुभकामनाएं`,
      phone: b.phone, place: b.address, brand: b.name, hashtag: b.hashtags.join(" ") }));
  }, [brandId, touched]);
  const [bg, setBg] = useState("festive");
  const [frameStyle, setFrameStyle] = useState("classic");
  const [barStyle, setBarStyle] = useState("surana");
  const [readyBg, setReadyBg] = useState("none");
  const [template, setTemplate] = useState("festive");
  const [photo, setPhoto] = useState(null);
  const [photoDim, setPhotoDim] = useState({ w: 720, h: 720 });
  const [photoScale, setPhotoScale] = useState(1);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropBox, setCropBox] = useState({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const cropImgRef = useRef(null);
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
    r.onload = () => { setCropSrc(r.result); setCropBox({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 }); };
    r.readAsDataURL(file);
    e.target.value = "";
  }

  function confirmCrop() {
    if (!cropSrc || !cropImgRef.current) return;
    // एक fresh Image object से crop करो — crossOrigin issue से बचो
    const tmpImg = new Image();
    tmpImg.onload = () => {
      const iw = tmpImg.naturalWidth, ih = tmpImg.naturalHeight;
      if (!iw || !ih) { setCropSrc(null); return; }
      const cx = Math.round(cropBox.x * iw), cy = Math.round(cropBox.y * ih);
      const cw = Math.max(1, Math.round(cropBox.w * iw)), ch = Math.max(1, Math.round(cropBox.h * ih));
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      canvas.getContext("2d").drawImage(tmpImg, cx, cy, cw, ch, 0, 0, cw, ch);
      const cropped = canvas.toDataURL("image/png");
      const s = Math.min(720 / cw, 760 / ch, 1.6);
      setPhotoDim({ w: Math.round(cw * s), h: Math.round(ch * s) });
      setPhoto(cropped);
      setCropSrc(null);
    };
    tmpImg.onerror = () => { alert("Crop error — बिना crop के use करें"); setCropSrc(null); };
    tmpImg.src = cropSrc; // blob/dataURL — no CORS issue
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
  function download(story) { renderCanvas(story).then((c) => { const a = document.createElement("a"); a.href = c.toDataURL("image/png"); a.download = brandId + "-delivery-" + (story ? "story" : "square") + ".png"; a.click(); }).catch(() => setNote("download में दिक्कत")); }
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
      // ग्राहक की जानकारी — इसी से बाद में उसे उसकी photo भेजी जाती है
      if (f.name) fd.append("customerName", f.name);
      if (f.mobile) fd.append("customerMobile", f.mobile);
      const res = await fetch(apiBase + "/api/promo-image", { method: "POST", headers: { Authorization: "Bearer " + token }, body: fd });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "fail");
      setNote("✅ Review में भेज दिया! अब Content → Review करें में दिखेगा।"); vib(60); setTimeout(() => { if (onSent) onSent(); }, 1500);
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

  // 3D address bar — 4 color themes
  function addr3D() {
    const W = 1080, H = 1080, barH = H * 0.115, barY = H - barH, r = barH * 0.18;
    const d = esc(f.brand || getBrand(brandId).name), pl = esc(f.place), ph = esc(f.phone);
    if (barStyle === "surana") return `
      <rect x="0" y="${barY + 5}" width="${W}" height="${barH}" rx="${r}" fill="#7a0016" opacity="0.55"/>
      <rect x="0" y="${barY}" width="${W * 0.56}" height="${barH}" rx="${r}" fill="#E4002B"/>
      <rect x="${W * 0.52}" y="${barY}" width="${W * 0.06}" height="${barH}" fill="#E4002B"/>
      <rect x="0" y="${barY}" width="${W * 0.56}" height="${barH * 0.18}" rx="${r}" fill="#fff" opacity="0.12"/>
      <rect x="${W * 0.54}" y="${barY}" width="${W * 0.46}" height="${barH}" rx="${r}" fill="#141414"/>
      <rect x="${W * 0.54}" y="${barY}" width="${W * 0.04}" height="${barH}" fill="#141414"/>
      <rect x="${W * 0.54}" y="${barY}" width="${W * 0.46}" height="${barH * 0.18}" rx="${r}" fill="#fff" opacity="0.07"/>
      <circle cx="${W * 0.055}" cy="${barY + barH * 0.45}" r="${barH * 0.2}" fill="#ffd400"/>
      <text x="${W * 0.055}" y="${barY + barH * 0.52}" text-anchor="middle" font-size="${barH * 0.24}" fill="#E4002B" font-family="Arial">📍</text>
      <text x="${W * 0.115}" y="${barY + barH * 0.46}" font-family="Arial Black,sans-serif" font-size="${barH * 0.3}" font-weight="900" fill="#fff">${d}</text>
      <text x="${W * 0.115}" y="${barY + barH * 0.78}" font-family="Arial,sans-serif" font-size="${barH * 0.21}" fill="#ffcdd2">${pl}</text>
      <text x="${W * 0.58}" y="${barY + barH * 0.42}" font-family="sans-serif" font-size="${barH * 0.21}" fill="#aaa">फ़ोन</text>
      <text x="${W * 0.58}" y="${barY + barH * 0.78}" font-family="Arial Black,sans-serif" font-size="${barH * 0.36}" font-weight="900" fill="#ffd400">${ph}</text>`;
    if (barStyle === "gold_dark") return `
      <rect x="0" y="${barY + 5}" width="${W}" height="${barH}" rx="${r}" fill="#a07a00" opacity="0.5"/>
      <rect x="0" y="${barY}" width="${W * 0.56}" height="${barH}" rx="${r}" fill="#c8960c"/>
      <rect x="${W * 0.52}" y="${barY}" width="${W * 0.06}" height="${barH}" fill="#c8960c"/>
      <rect x="0" y="${barY}" width="${W * 0.56}" height="${barH * 0.18}" rx="${r}" fill="#fff" opacity="0.2"/>
      <rect x="${W * 0.54}" y="${barY}" width="${W * 0.46}" height="${barH}" rx="${r}" fill="#1a1a1a"/>
      <rect x="${W * 0.54}" y="${barY}" width="${W * 0.04}" height="${barH}" fill="#1a1a1a"/>
      <rect x="${W * 0.54}" y="${barY}" width="${W * 0.46}" height="${barH * 0.18}" rx="${r}" fill="#fff" opacity="0.07"/>
      <circle cx="${W * 0.055}" cy="${barY + barH * 0.45}" r="${barH * 0.2}" fill="#fff" opacity="0.3"/>
      <text x="${W * 0.055}" y="${barY + barH * 0.52}" text-anchor="middle" font-size="${barH * 0.28}" fill="#fff" font-family="Arial">📍</text>
      <text x="${W * 0.115}" y="${barY + barH * 0.46}" font-family="Arial Black,sans-serif" font-size="${barH * 0.3}" font-weight="900" fill="#fff">${d}</text>
      <text x="${W * 0.115}" y="${barY + barH * 0.78}" font-family="Arial,sans-serif" font-size="${barH * 0.21}" fill="#fff9c4">${pl}</text>
      <text x="${W * 0.58}" y="${barY + barH * 0.42}" font-family="sans-serif" font-size="${barH * 0.21}" fill="#aaa">फ़ोन</text>
      <text x="${W * 0.58}" y="${barY + barH * 0.78}" font-family="Arial Black,sans-serif" font-size="${barH * 0.36}" font-weight="900" fill="#ffd400">${ph}</text>`;
    if (barStyle === "blue_white") return `
      <rect x="0" y="${barY + 5}" width="${W}" height="${barH}" rx="${r}" fill="#0a2a5a" opacity="0.5"/>
      <rect x="0" y="${barY}" width="${W * 0.56}" height="${barH}" rx="${r}" fill="#1565c0"/>
      <rect x="${W * 0.52}" y="${barY}" width="${W * 0.06}" height="${barH}" fill="#1565c0"/>
      <rect x="0" y="${barY}" width="${W * 0.56}" height="${barH * 0.18}" rx="${r}" fill="#fff" opacity="0.2"/>
      <rect x="${W * 0.54}" y="${barY}" width="${W * 0.46}" height="${barH}" rx="${r}" fill="#fff"/>
      <rect x="${W * 0.54}" y="${barY}" width="${W * 0.04}" height="${barH}" fill="#fff"/>
      <text x="${W * 0.055}" y="${barY + barH * 0.52}" text-anchor="middle" font-size="${barH * 0.3}" font-family="Arial">📍</text>
      <text x="${W * 0.115}" y="${barY + barH * 0.46}" font-family="Arial Black,sans-serif" font-size="${barH * 0.3}" font-weight="900" fill="#fff">${d}</text>
      <text x="${W * 0.115}" y="${barY + barH * 0.78}" font-family="Arial,sans-serif" font-size="${barH * 0.21}" fill="#bbdefb">${pl}</text>
      <text x="${W * 0.58}" y="${barY + barH * 0.42}" font-family="sans-serif" font-size="${barH * 0.21}" fill="#999">फ़ोन</text>
      <text x="${W * 0.58}" y="${barY + barH * 0.78}" font-family="Arial Black,sans-serif" font-size="${barH * 0.36}" font-weight="900" fill="#1565c0">${ph}</text>`;
    // dark_neon
    return `
      <rect x="0" y="${barY + 5}" width="${W}" height="${barH}" rx="${r}" fill="#001a00" opacity="0.6"/>
      <rect x="0" y="${barY}" width="${W}" height="${barH}" rx="${r}" fill="#0d0d0d"/>
      <rect x="0" y="${barY}" width="${W}" height="${barH * 0.16}" rx="${r}" fill="#00e676" opacity="0.12"/>
      <rect x="0" y="${barY}" width="${W * 0.008}" height="${barH}" fill="#00e676"/>
      <rect x="${W * 0.54}" y="${barY + barH * 0.12}" width="2" height="${barH * 0.76}" fill="#333"/>
      <text x="${W * 0.055}" y="${barY + barH * 0.52}" text-anchor="middle" font-size="${barH * 0.28}" font-family="Arial" fill="#00e676">📍</text>
      <text x="${W * 0.115}" y="${barY + barH * 0.46}" font-family="Arial Black,sans-serif" font-size="${barH * 0.3}" font-weight="900" fill="#fff">${d}</text>
      <text x="${W * 0.115}" y="${barY + barH * 0.78}" font-family="Arial,sans-serif" font-size="${barH * 0.21}" fill="#666">${pl}</text>
      <text x="${W * 0.58}" y="${barY + barH * 0.42}" font-family="sans-serif" font-size="${barH * 0.21}" fill="#555">फ़ोन</text>
      <text x="${W * 0.58}" y="${barY + barH * 0.78}" font-family="Arial Black,sans-serif" font-size="${barH * 0.36}" font-weight="900" fill="#00e676">${ph}</text>`;
  }

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
    ${addr3D()}
    ${logoData ? `<g data-el="logo" transform="translate(${pos.logo.x},${pos.logo.y})" style="cursor:move"><image href="${logoData}" x="0" y="0" width="124" height="124"/></g>` : ""}
    ${stickers.map((s) => `<g data-el="stk:${s.id}" transform="translate(${s.x},${s.y})" style="cursor:move">${shapeSVG(s.name, s.r)}</g>`).join("")}
  `;

  const inp = "w-full bg-neutral-800 rounded-lg p-2 text-sm outline-none text-white border border-neutral-700";
  const selR = selStk ? ((stickers.find((s) => s.id === selStk) || {}).r || 60) : 60;

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
              <div style={{
                position: "absolute",
                left: `${cropBox.x * 100}%`, top: `${cropBox.y * 100}%`,
                width: `${cropBox.w * 100}%`, height: `${cropBox.h * 100}%`,
                border: "2px solid #ffd400", boxShadow: "0 0 0 1000px rgba(0,0,0,0.55)",
                pointerEvents: "none", boxSizing: "border-box"
              }} />
            </div>
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
              <button type="button" onClick={() => { vib(15); setCropSrc(null); }}
                className="flex-1 py-2.5 rounded-xl border border-neutral-600 text-sm text-neutral-300">रद्द करें</button>
              <button type="button" onClick={() => { vib(30); confirmCrop(); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black" style={{background:"#ffd400"}}>✅ Crop करें</button>
            </div>
            <button type="button" onClick={() => {
              const img = cropImgRef.current;
              if (!img) return;
              const s = Math.min(720 / img.naturalWidth, 760 / img.naturalHeight, 1.6);
              setPhotoDim({ w: Math.round(img.naturalWidth * s), h: Math.round(img.naturalHeight * s) });
              setPhoto(cropSrc); setCropSrc(null);
            }} className="w-full py-2 rounded-xl border border-neutral-700 text-xs text-neutral-400">बिना crop के use करें</button>
          </div>
        </div>
      )}

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

      <div>
        <span className="text-xs text-neutral-400 block mb-1">🏷️ Address Bar Style — चुनें</span>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "surana", label: "🔴 लाल+काला", colors: ["#E4002B", "#141414", "#ffd400"] },
            { id: "gold_dark", label: "🟡 गोल्ड+काला", colors: ["#c8960c", "#1a1a1a", "#ffd400"] },
            { id: "blue_white", label: "🔵 नीला+सफ़ेद", colors: ["#1565c0", "#fff", "#1565c0"] },
            { id: "dark_neon", label: "🟢 डार्क+नीयन", colors: ["#0d0d0d", "#0d0d0d", "#00e676"] },
          ].map((bs) => (
            <button key={bs.id} type="button" onClick={() => setBarStyle(bs.id)}
              className="flex-1 min-w-[120px] rounded-xl p-2 border-2 text-left"
              style={{ borderColor: barStyle === bs.id ? "#ffd400" : "#333", background: barStyle === bs.id ? "#1a1a1a" : "#111" }}>
              <div className="flex gap-1 mb-1">
                {bs.colors.map((c, i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: c, border: "1px solid #444" }} />)}
              </div>
              <div className="text-[11px] font-semibold" style={{ color: barStyle === bs.id ? "#ffd400" : "#ccc" }}>{bs.label}</div>
            </button>
          ))}
        </div>
      </div>

      <svg ref={svgRef} viewBox="0 0 1080 1080" onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp}
        style={{ width: "100%", maxWidth: 520, display: "block", margin: "0 auto", borderRadius: 14, touchAction: "none", background: "#000" }}
        dangerouslySetInnerHTML={{ __html: inner }} />
      <div className="text-xs" style={{ color: GOLD, minHeight: 16 }}>{note}</div>

      <div>
        <span className="text-xs text-neutral-400 block mb-1">🏷️ Address Bar Style — चुनें</span>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "surana", label: "🔴 लाल+काला", colors: ["#E4002B", "#141414", "#ffd400"] },
            { id: "gold_dark", label: "🟡 गोल्ड+काला", colors: ["#c8960c", "#1a1a1a", "#ffd400"] },
            { id: "blue_white", label: "🔵 नीला+सफ़ेद", colors: ["#1565c0", "#fff", "#1565c0"] },
            { id: "dark_neon", label: "🟢 डार्क+नीयन", colors: ["#0d0d0d", "#0d0d0d", "#00e676"] },
          ].map((bs) => (
            <button key={bs.id} type="button" onClick={() => setBarStyle(bs.id)}
              className="flex-1 min-w-[120px] rounded-xl p-2 border-2 text-left"
              style={{ borderColor: barStyle === bs.id ? "#ffd400" : "#333", background: barStyle === bs.id ? "#1a1a1a" : "#111" }}>
              <div className="flex gap-1 mb-1">
                {bs.colors.map((c, i) => <div key={i} style={{ width: 16, height: 16, borderRadius: 4, background: c, border: "1px solid #444" }} />)}
              </div>
              <div className="text-[11px] font-semibold" style={{ color: barStyle === bs.id ? "#ffd400" : "#ccc" }}>{bs.label}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        <label className="text-xs text-neutral-400 col-span-2">ग्राहक का नाम<input className={inp} value={f.name} onChange={(e) => set("name", e.target.value)} /></label>
        <label className="text-xs text-neutral-400 col-span-2">ग्राहक का WhatsApp नंबर <span className="text-neutral-600">(भरेंगे तो उन्हें भी भेज सकेंगे)</span><input className={inp} inputMode="numeric" placeholder="9713394738" value={f.mobile} onChange={(e) => set("mobile", e.target.value)} /></label>
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
      <button type="button" onClick={() => { vib(60); sendToQueue(); }} className="w-full rounded-xl py-3 font-semibold text-black" style={{ background: GOLD }}>📤 Review में भेजें</button>
    </div>
  );
}
