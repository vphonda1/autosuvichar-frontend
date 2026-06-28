const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useRef, useEffect } from "react";

// ══════════════════════════════════════════════════════════════════
// MegaOfferEditor — Power Honda style complete poster maker
// Features: Headline, Offer boxes, Background, Bike image, Address bar
// ══════════════════════════════════════════════════════════════════

const BACKGROUNDS = [
  // Gradient styles
  { id: "yellow_red", label: "🔥 पीला-लाल (Power Honda)", c1: "#FFD600", c2: "#E4002B", type: "grad" },
  { id: "red_dark", label: "🔴 लाल-काला (Classic)", c1: "#E4002B", c2: "#141414", type: "grad" },
  { id: "blue_dark", label: "🔵 नीला-काला (Premium)", c1: "#1565c0", c2: "#0a1628", type: "grad" },
  { id: "orange_red", label: "🟠 नारंगी-लाल (Festival)", c1: "#FF6F00", c2: "#B71C1C", type: "grad" },
  { id: "gold_dark", label: "🥇 गोल्ड-काला (Luxury)", c1: "#8B6914", c2: "#1a0f00", type: "grad" },
  { id: "green_dark", label: "🟢 हरा-काला (Fresh)", c1: "#1B5E20", c2: "#0a2a0a", type: "grad" },
  { id: "purple_dark", label: "🟣 बैंगनी-काला (Modern)", c1: "#4A148C", c2: "#1a0033", type: "grad" },
  { id: "white_clean", label: "⬜ सफ़ेद (Clean)", c1: "#f8f8f8", c2: "#e0e0e0", type: "grad" },
  // Festive styles
  { id: "diwali", label: "🪔 दिवाली", type: "fest" },
  { id: "navratri", label: "🌺 नवरात्रि", type: "fest" },
  { id: "holi", label: "🎨 होली", type: "fest" },
  { id: "independence", label: "🇮🇳 स्वतंत्रता दिवस", type: "fest" },
];

const HEADLINE_STYLES = [
  { id: "mega", label: "🔥 महाबचत (Power Honda)", color: "#fff", stroke: "#E4002B", size: "big" },
  { id: "bold_red", label: "🔴 Bold लाल", color: "#E4002B", stroke: "#fff", size: "big" },
  { id: "gold", label: "🥇 गोल्ड चमक", color: "#FFD600", stroke: "#141414", size: "big" },
  { id: "white_clean", label: "⬜ सफ़ेद (clean)", color: "#fff", stroke: "none", size: "normal" },
  { id: "dark", label: "⚫ काला (Dark bg)", color: "#141414", stroke: "#FFD600", size: "normal" },
];

const OFFER_COLORS = [
  { id: "red_white", label: "🔴 लाल-सफ़ेद", bg: "#E4002B", text: "#fff", icon_bg: "#fff" },
  { id: "white_red", label: "⬜ सफ़ेद-लाल", bg: "#fff", text: "#E4002B", icon_bg: "#E4002B" },
  { id: "gold_dark", label: "🥇 गोल्ड-काला", bg: "#FFD600", text: "#141414", icon_bg: "#141414" },
  { id: "blue_white", label: "🔵 नीला-सफ़ेद", bg: "#1565c0", text: "#fff", icon_bg: "#fff" },
  { id: "green_white", label: "🟢 हरा-सफ़ेद", bg: "#1B5E20", text: "#fff", icon_bg: "#fff" },
  { id: "dark_gold", label: "⚫ काला-गोल्ड", bg: "#141414", text: "#FFD600", icon_bg: "#FFD600" },
];

const OFFER_ICONS = ["💰", "🔄", "👔", "🎁", "📱", "⌚", "🏆", "✅", "🔥", "💳", "🏦", "🛡️", "🎰", "📊", "⭐", "🎉"];

const ADDRESS_STYLES = [
  { id: "red_black", label: "🔴 लाल+काला (VP Honda)", bg1: "#E4002B", bg2: "#141414" },
  { id: "gold_dark", label: "🥇 गोल्ड+काला", bg1: "#8B6914", bg2: "#141414" },
  { id: "blue_white", label: "🔵 नीला+सफ़ेद", bg1: "#1565c0", bg2: "#fff" },
  { id: "dark_red", label: "⚫ काला+लाल", bg1: "#141414", bg2: "#E4002B" },
  { id: "white_red", label: "⬜ सफ़ेद+लाल", bg1: "#fff", bg2: "#E4002B" },
];

const LAYOUT_STYLES = [
  { id: "bike_left", label: "🏍️ Bike बाईं + Offers दाईं (Power Honda)" },
  { id: "bike_right", label: "🏍️ Bike दाईं + Offers बाईं" },
  { id: "bike_center", label: "🏍️ Bike Center + Offers नीचे" },
  { id: "text_only", label: "📝 Text Only (बिना bike)" },
  { id: "full_bg", label: "🖼️ Full Background poster" },
];

const inp = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-red-500 mt-1 mb-1";
const sel = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none focus:border-red-500 mt-1";

export default function MegaOfferEditor({ apiBase, token, brandId, onSent }) {
  // ── State ──────────────────────────────────────────────────────
  const [headline, setHeadline] = useState("महाबचत\nमहीना");
  const [subHeadline, setSubHeadline] = useState("Honda गाड़ी खरीदने का शानदार मौका");
  const [headlineStyle, setHeadlineStyle] = useState("mega");
  const [bg, setBg] = useState("yellow_red");
  const [layout, setLayout] = useState("bike_left");
  const [addrStyle, setAddrStyle] = useState("red_black");
  const [offerColor, setOfferColor] = useState("white_red");

  // Offer boxes — max 4
  const [offers, setOffers] = useState([
    { icon: "💰", text: "₹5,000 कैशबैक", enabled: true },
    { icon: "🔄", text: "₹3,000 एक्सचेंज बोनस", enabled: true },
    { icon: "👔", text: "₹2,000 कॉर्पोरेट डिस्काउंट", enabled: true },
    { icon: "🎁", text: "Free SmartWatch", enabled: false },
  ]);

  // Big offer (top right)
  const [bigOffer, setBigOffer] = useState("₹10,000 तक की\nमहाबचत");
  const [bigOfferEnabled, setBigOfferEnabled] = useState(true);

  // ROI circle (bottom left)
  const [roiText, setRoiText] = useState("सिर्फ 6.99%");
  const [roiSub, setRoiSub] = useState("की ब्याज दर");
  const [roiEnabled, setRoiEnabled] = useState(true);

  // Bottom banner
  const [bottomBanner, setBottomBanner] = useState("कम से कम डाउन पेमेंट में अपनी पसंदीदा Honda घर लाएं");
  const [bottomBannerEnabled, setBottomBannerEnabled] = useState(true);

  // Location CTA (bottom right)
  const [locationCTA, setLocationCTA] = useState("आज ही विज़िट करें\nऑफर का लाभ उठाएं!");
  const [locationEnabled, setLocationEnabled] = useState(true);

  // Address bar
  const [dealerName, setDealerName] = useState("VP Honda");
  const [dealerTag, setDealerTag] = useState("VP Honda, परवलिया सड़क, भोपाल");
  const [phone, setPhone] = useState("9713394738");
  const [showAddr, setShowAddr] = useState(true);

  // Bike image
  const [bikeImg, setBikeImg] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropBox, setCropBox] = useState({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 });
  const cropImgRef = useRef(null);

  // Caption
  const [caption, setCaption] = useState("🔥 VP Honda में महाबचत महीना! अभी visit करें और धमाकेदार offers पाएं। #VPHonda #Bhopal");

  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // ── Crop ──────────────────────────────────────────────────────
  function onBike(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { setCropSrc(r.result); setCropBox({ x: 0.05, y: 0.05, w: 0.9, h: 0.9 }); };
    r.readAsDataURL(file);
    e.target.value = "";
  }

  function confirmCrop() {
    if (!cropSrc) return;
    const tmpImg = new Image();
    tmpImg.onload = () => {
      const iw = tmpImg.naturalWidth, ih = tmpImg.naturalHeight;
      if (!iw || !ih) { setCropSrc(null); return; }
      const cx = Math.round(cropBox.x * iw), cy = Math.round(cropBox.y * ih);
      const cw = Math.max(1, Math.round(cropBox.w * iw)), ch = Math.max(1, Math.round(cropBox.h * ih));
      const canvas = document.createElement("canvas");
      canvas.width = cw; canvas.height = ch;
      canvas.getContext("2d").drawImage(tmpImg, cx, cy, cw, ch, 0, 0, cw, ch);
      setBikeImg(canvas.toDataURL("image/png"));
      setCropSrc(null);
    };
    tmpImg.src = cropSrc;
  }

  // ── SVG Preview ────────────────────────────────────────────────
  function buildPreviewSVG() {
    const W = 1080, H = 1080;
    const bgObj = BACKGROUNDS.find(b => b.id === bg) || BACKGROUNDS[0];
    const hlObj = HEADLINE_STYLES.find(h => h.id === headlineStyle) || HEADLINE_STYLES[0];
    const addrObj = ADDRESS_STYLES.find(a => a.id === addrStyle) || ADDRESS_STYLES[0];
    const offerObj = OFFER_COLORS.find(o => o.id === offerColor) || OFFER_COLORS[0];
    const isLight = bg === "white_clean";

    // Background
    let bgSVG = "";
    if (bgObj.type === "grad") {
      bgSVG = `<defs>
        <linearGradient id="mg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="${bgObj.c1}"/>
          <stop offset="100%" stop-color="${bgObj.c2}"/>
        </linearGradient>
      </defs>
      <rect width="${W}" height="${H}" fill="url(#mg)"/>`;
      // Confetti dots
      const cc = ["#fff", "#FFD600", "#E4002B", "#1565c0", "#16a34a"];
      let conf = "";
      for (let i = 0; i < 35; i++) {
        conf += `<rect x="${(i*137+20)%W}" y="${(i*89+10)%(H*0.6)}" width="${6+i%8}" height="${6+i%8}" rx="2" fill="${cc[i%5]}" opacity="${0.3+i%4*0.1}" transform="rotate(${i*40} ${(i*137+20)%W} ${(i*89+10)%(H*0.6)})"/>`;
      }
      bgSVG += conf;
    } else {
      // Festival backgrounds
      const festBGs = {
        diwali: `<defs><radialGradient id="mg" cx="50%" cy="40%" r="75%"><stop offset="0%" stop-color="#c2641a"/><stop offset="100%" stop-color="#4a1505"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#mg)"/>`,
        navratri: `<defs><radialGradient id="mg" cx="50%" cy="38%" r="75%"><stop offset="0%" stop-color="#9a1840"/><stop offset="100%" stop-color="#3a0818"/></radialGradient></defs><rect width="${W}" height="${H}" fill="url(#mg)"/>`,
        holi: `<defs><linearGradient id="mg" x1="0" y1="0" x2="1" y2="1"><stop offset="0%" stop-color="#2a1a3a"/><stop offset="100%" stop-color="#3a1530"/></linearGradient></defs><rect width="${W}" height="${H}" fill="url(#mg)"/>`,
        independence: `<rect width="${W}" height="${H}" fill="#000c24"/><rect x="0" y="0" width="${W}" height="${H*0.08}" fill="#ff9933" opacity="0.85"/><rect x="0" y="${H*0.08}" width="${W}" height="${H*0.08}" fill="#fff" opacity="0.85"/><rect x="0" y="${H*0.16}" width="${W}" height="${H*0.08}" fill="#138808" opacity="0.85"/>`,
      };
      bgSVG = festBGs[bg] || bgSVG;
    }

    // Headline
    const hlLines = headline.split("\n").filter(Boolean);
    const hlColor = hlObj.color;
    const hlStroke = hlObj.stroke !== "none" ? `stroke="${hlObj.stroke}" stroke-width="8"` : "";
    const hlSize = hlObj.size === "big" ? 130 : 90;
    const hlY = layout === "bike_center" ? H * 0.12 : H * 0.08;
    let hlSVG = hlLines.map((l, i) => `
      <text x="${W * 0.5}" y="${hlY + i * (hlSize + 10) + hlSize}" 
        text-anchor="middle" font-family="Arial Black, sans-serif" 
        font-size="${hlSize}" font-weight="900" 
        fill="${hlColor}" ${hlStroke}
        textLength="${W * 0.85}" lengthAdjust="spacingAndGlyphs">${l}</text>`).join("");

    // Sub headline
    let subSVG = subHeadline ? `
      <rect x="${W*0.08}" y="${hlY + hlLines.length*(hlSize+10) + hlSize + 10}" 
        width="${W*0.84}" height="70" rx="8" fill="#E4002B" opacity="0.9"/>
      <text x="${W*0.5}" y="${hlY + hlLines.length*(hlSize+10) + hlSize + 55}" 
        text-anchor="middle" font-family="Arial, sans-serif" 
        font-size="38" font-weight="700" fill="#fff">${subHeadline}</text>` : "";

    // Bike image area
    let bikeSVG = "";
    if (bikeImg && layout !== "text_only") {
      const bx = layout === "bike_right" ? W * 0.5 : 0;
      const bw = layout === "bike_center" ? W : W * 0.52;
      const by = H * 0.3;
      const bh = H * 0.55;
      bikeSVG = `<image href="${bikeImg}" x="${bx}" y="${by}" width="${bw}" height="${bh}" preserveAspectRatio="xMidYMid meet"/>`;
    } else if (layout !== "text_only") {
      // Placeholder
      const bx = layout === "bike_right" ? W * 0.5 : 0;
      bikeSVG = `<rect x="${bx+20}" y="${H*0.32}" width="${W*0.48}" height="${H*0.5}" rx="20" fill="#fff" fill-opacity="0.08" stroke="#fff" stroke-width="3" stroke-dasharray="15 10"/>
        <text x="${bx + W*0.24}" y="${H*0.58}" text-anchor="middle" font-family="Arial" font-size="36" fill="#fff" opacity="0.5">🏍️ Bike Photo</text>
        <text x="${bx + W*0.24}" y="${H*0.62}" text-anchor="middle" font-family="Arial" font-size="24" fill="#fff" opacity="0.4">Upload करें</text>`;
    }

    // Offer boxes
    const activeOffers = offers.filter(o => o.enabled);
    const ofX = layout === "bike_right" ? W * 0.04 : W * 0.52;
    const ofW = W * 0.44;
    let offerSVG = "";
    let ofY = H * 0.38;
    if (bigOfferEnabled) {
      const bigLines = bigOffer.split("\n");
      offerSVG += `<rect x="${ofX}" y="${ofY}" width="${ofW}" height="${bigLines.length > 1 ? 160 : 110}" rx="15" fill="#fff"/>`;
      bigLines.forEach((l, i) => {
        const isFirst = i === 0;
        offerSVG += `<text x="${ofX + ofW*0.5}" y="${ofY + (isFirst ? 65 : 130)}" 
          text-anchor="middle" font-family="Arial Black, sans-serif" 
          font-size="${isFirst ? 52 : 42}" font-weight="900" fill="#E4002B">${l}</text>`;
      });
      ofY += bigLines.length > 1 ? 175 : 125;
    }

    activeOffers.slice(0, 3).forEach((offer, i) => {
      const h = 90;
      offerSVG += `
        <rect x="${ofX}" y="${ofY}" width="${ofW}" height="${h}" rx="12" fill="${offerObj.bg}"/>
        <text x="${ofX + 55}" y="${ofY + 57}" text-anchor="middle" font-family="Arial" font-size="36">${offer.icon}</text>
        <text x="${ofX + 100}" y="${ofY + 55}" font-family="Arial Black, sans-serif" font-size="32" font-weight="700" fill="${offerObj.text}">${offer.text}</text>`;
      ofY += h + 12;
    });

    // ROI circle
    let roiSVG = "";
    if (roiEnabled) {
      const rx = layout === "bike_right" ? W * 0.55 : W * 0.12;
      roiSVG = `
        <circle cx="${rx}" cy="${H * 0.72}" r="100" fill="#E4002B" stroke="#FFD600" stroke-width="6"/>
        <text x="${rx}" y="${H * 0.7}" text-anchor="middle" font-family="Arial Black, sans-serif" font-size="30" font-weight="900" fill="#fff">${roiText}</text>
        <text x="${rx}" y="${H * 0.73}" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" fill="#FFD600">${roiSub}</text>`;
    }

    // Bottom banner
    let bannerSVG = "";
    if (bottomBannerEnabled) {
      bannerSVG = `
        <rect x="0" y="${H * 0.83}" width="${W * 0.58}" height="70" fill="#FFD600"/>
        <text x="${W * 0.04}" y="${H * 0.83 + 45}" font-family="Arial, sans-serif" font-size="26" font-weight="700" fill="#141414">${bottomBanner.slice(0, 35)}</text>`;
    }

    // Location CTA
    let locSVG = "";
    if (locationEnabled) {
      const locLines = locationCTA.split("\n");
      locSVG = `
        <rect x="${W * 0.6}" y="${H * 0.83}" width="${W * 0.4}" height="70" rx="0" fill="#E4002B"/>
        <text x="${W * 0.62}" y="${H * 0.83 + 35}" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#fff">📍 ${locLines[0] || ""}</text>
        ${locLines[1] ? `<text x="${W * 0.62}" y="${H * 0.83 + 60}" font-family="Arial, sans-serif" font-size="22" fill="#FFD600">${locLines[1]}</text>` : ""}`;
    }

    // Address bar
    let addrSVG = "";
    if (showAddr) {
      addrSVG = `
        <rect x="0" y="${H * 0.91}" width="${W * 0.6}" height="${H * 0.09}" fill="${addrObj.bg1}"/>
        <rect x="${W * 0.6}" y="${H * 0.91}" width="${W * 0.4}" height="${H * 0.09}" fill="${addrObj.bg2}"/>
        <circle cx="${W*0.05}" cy="${H*0.955}" r="20" fill="#FFD600"/>
        <text x="${W*0.05}" y="${H*0.962}" text-anchor="middle" font-family="Arial" font-size="22" fill="#E4002B">📍</text>
        <text x="${W*0.11}" y="${H*0.948}" font-family="Arial Black, sans-serif" font-size="34" font-weight="900" fill="#fff">${dealerName}</text>
        <text x="${W*0.11}" y="${H*0.975}" font-family="Arial, sans-serif" font-size="22" fill="#fff" opacity="0.85">${dealerTag}</text>
        <text x="${W*0.65}" y="${H*0.942}" font-family="Arial, sans-serif" font-size="22" fill="#fff" opacity="0.7">फ़ोन</text>
        <text x="${W*0.65}" y="${H*0.975}" font-family="Arial Black, sans-serif" font-size="40" font-weight="900" fill="#FFD600">${phone}</text>`;
    }

    return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
      ${bgSVG}
      ${bikeSVG}
      ${hlSVG}
      ${subSVG}
      ${offerSVG}
      ${roiSVG}
      ${bannerSVG}
      ${locSVG}
      ${addrSVG}
    </svg>`;
  }

  const svgPreview = buildPreviewSVG();
  const svgBlob = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgPreview)))}`;

  // ── Submit ─────────────────────────────────────────────────────
  async function sendToReview() {
    vib(60);
    setBusy(true); setNote("भेज रहे हैं…");
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080; canvas.height = 1080;
      const ctx = canvas.getContext("2d");
      const img = new Image();
      img.onload = async () => {
        ctx.drawImage(img, 0, 0);
        const b64 = canvas.toDataURL("image/jpeg", 0.92);
        const res = await fetch(apiBase + "/api/mega-offer/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
          body: JSON.stringify({
            brand: brandId, text: caption,
            imageData: b64, type: "vigyapan",
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error || "Error");
        setNote("✅ Review में भेज दिया! Content → Review करें में दिखेगा।");
        vib([30, 30, 60]);
        setTimeout(() => { setNote(""); if (onSent) onSent(); }, 3000);
      };
      img.onerror = () => { setNote("❌ Image error"); setBusy(false); };
      img.src = svgBlob;
    } catch (e) { setNote("❌ " + e.message); }
    setBusy(false);
  }

  // ── UI ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-4 pb-10">

      {/* Crop Modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 w-full max-w-sm space-y-3">
            <p className="text-sm font-bold text-white text-center">📐 Bike Photo Crop करें</p>
            <div className="relative rounded-xl overflow-hidden border border-neutral-700 bg-black" style={{ aspectRatio: "1/1" }}>
              <img ref={cropImgRef} src={cropSrc} alt="crop" style={{ width: "100%", height: "100%", objectFit: "contain", display: "block" }} />
              <div style={{ position: "absolute", left: `${cropBox.x*100}%`, top: `${cropBox.y*100}%`, width: `${cropBox.w*100}%`, height: `${cropBox.h*100}%`, border: "2px solid #FFD600", boxShadow: "0 0 0 2000px rgba(0,0,0,0.6)", pointerEvents: "none" }} />
            </div>
            {[["Left", "x", 0, 0.6, "w"], ["Top", "y", 0, 0.6, "h"], ["Width", "w", 0.1, 1, null], ["Height", "h", 0.1, 1, null]].map(([label, key, mn, mx, limit]) => (
              <label key={key} className="text-xs text-neutral-300 block">
                {label}: {Math.round(cropBox[key]*100)}%
                <input type="range" min={mn} max={mx} step="0.01" value={cropBox[key]} className="w-full accent-yellow-400"
                  onChange={e => { const v=parseFloat(e.target.value); setCropBox(b => { const nb={...b,[key]:v}; if(limit) nb[limit]=Math.min(b[limit],1-v-0.02); return nb; }); }} />
              </label>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={() => setCropSrc(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-600 text-sm text-neutral-300">रद्द</button>
              <button type="button" onClick={() => { vib(30); confirmCrop(); }} className="flex-1 py-2.5 rounded-xl text-sm font-bold text-black" style={{background:"#FFD600"}}>✅ Crop करें</button>
            </div>
            <button type="button" onClick={() => { setBikeImg(cropSrc); setCropSrc(null); }} className="w-full py-2 rounded-xl border border-neutral-700 text-xs text-neutral-400">बिना crop के use करें</button>
          </div>
        </div>
      )}

      {/* Live Preview */}
      <div className="rounded-2xl overflow-hidden border border-neutral-700 bg-black">
        <img src={svgBlob} alt="preview" className="w-full" />
        <div className="flex border-t border-neutral-800 divide-x divide-neutral-800">
          <a href={svgBlob} download="mega-offer.svg" className="flex-1 py-2 text-center text-xs text-neutral-300">⬇ Download SVG</a>
          <button type="button" onClick={() => { vib(50); sendToReview(); }} disabled={busy} className="flex-1 py-2 text-xs font-bold text-black" style={{background:"#FFD600"}}>
            {busy ? "भेज रहे हैं…" : "📤 Review में भेजें"}
          </button>
        </div>
      </div>

      {note && <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${note.startsWith("✅") ? "bg-emerald-900/60 text-emerald-300" : note.startsWith("❌") ? "bg-red-900/60 text-red-300" : "bg-neutral-800 text-neutral-300"}`}>{note}</div>}

      {/* ── SECTION 1: Layout ── */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
        <p className="text-sm font-bold text-white">📐 Layout Style</p>
        <div className="space-y-1.5">
          {LAYOUT_STYLES.map(l => (
            <button key={l.id} type="button" onClick={() => { vib(15); setLayout(l.id); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm border"
              style={{ borderColor: layout === l.id ? "#FFD600" : "#3a3a3a", background: layout === l.id ? "#1a1500" : "transparent", color: layout === l.id ? "#FFD600" : "#ccc" }}>
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION 2: Headline ── */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
        <p className="text-sm font-bold text-white">✍️ Headline Text</p>
        <label className="text-xs text-neutral-400 block">
          मुख्य Headline (हर line के लिए Enter दबाएं)
          <textarea value={headline} onChange={e => setHeadline(e.target.value)} rows={3}
            className={inp} placeholder="महाबचत&#10;महीना" />
        </label>
        <label className="text-xs text-neutral-400 block">
          Sub Headline (Red strip में)
          <input value={subHeadline} onChange={e => setSubHeadline(e.target.value)} className={inp} placeholder="Honda गाड़ी का शानदार मौका" />
        </label>
        <p className="text-xs text-neutral-400">Headline Style</p>
        <div className="grid grid-cols-2 gap-2">
          {HEADLINE_STYLES.map(h => (
            <button key={h.id} type="button" onClick={() => { vib(15); setHeadlineStyle(h.id); }}
              className="px-2 py-2 rounded-xl text-xs border"
              style={{ borderColor: headlineStyle === h.id ? "#FFD600" : "#3a3a3a", background: headlineStyle === h.id ? "#1a1500" : "transparent", color: headlineStyle === h.id ? "#FFD600" : "#aaa" }}>
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION 3: Background ── */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
        <p className="text-sm font-bold text-white">🎨 Background</p>
        <div className="space-y-1.5">
          {BACKGROUNDS.map(b => (
            <button key={b.id} type="button" onClick={() => { vib(15); setBg(b.id); }}
              className="w-full text-left px-3 py-2.5 rounded-xl text-sm border flex items-center gap-3"
              style={{ borderColor: bg === b.id ? "#FFD600" : "#3a3a3a", background: bg === b.id ? "#1a1500" : "transparent", color: bg === b.id ? "#FFD600" : "#ccc" }}>
              {b.type === "grad" && <div className="w-8 h-8 rounded-lg flex-shrink-0" style={{ background: `linear-gradient(135deg, ${b.c1}, ${b.c2})` }} />}
              {b.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── SECTION 4: Bike Image ── */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
        <p className="text-sm font-bold text-white">🏍️ Bike / Product Photo</p>
        <label className="block">
          <div className="border-2 border-dashed border-neutral-700 rounded-xl p-6 text-center cursor-pointer hover:border-yellow-400 transition">
            {bikeImg ? <img src={bikeImg} alt="bike" className="w-full max-h-40 object-contain rounded-lg" /> :
              <><p className="text-neutral-400 text-sm">📸 Bike photo upload करें</p><p className="text-neutral-600 text-xs mt-1">Tap to select</p></>}
          </div>
          <input type="file" accept="image/*" className="hidden" onChange={onBike} />
        </label>
        {bikeImg && <button type="button" onClick={() => setBikeImg(null)} className="w-full py-2 rounded-xl border border-red-800 text-red-400 text-xs">🗑 Remove</button>}
      </div>

      {/* ── SECTION 5: Big Offer Box ── */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">💥 Big Offer (ऊपर दाईं)</p>
          <button type="button" onClick={() => setBigOfferEnabled(!bigOfferEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${bigOfferEnabled ? "bg-emerald-700 text-white" : "bg-neutral-700 text-neutral-400"}`}>
            {bigOfferEnabled ? "ON" : "OFF"}
          </button>
        </div>
        {bigOfferEnabled && (
          <textarea value={bigOffer} onChange={e => setBigOffer(e.target.value)} rows={2}
            className={inp} placeholder="₹10,000 तक की&#10;महाबचत" />
        )}
      </div>

      {/* ── SECTION 6: Offer Boxes ── */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
        <p className="text-sm font-bold text-white">📦 Offer Boxes (Max 3)</p>
        <p className="text-xs text-neutral-400">Offer Box Color Style</p>
        <div className="grid grid-cols-2 gap-2 mb-2">
          {OFFER_COLORS.map(o => (
            <button key={o.id} type="button" onClick={() => { vib(15); setOfferColor(o.id); }}
              className="px-2 py-2 rounded-xl text-xs border"
              style={{ borderColor: offerColor === o.id ? "#FFD600" : "#3a3a3a", background: offerColor === o.id ? "#1a1500" : "transparent", color: offerColor === o.id ? "#FFD600" : "#aaa" }}>
              {o.label}
            </button>
          ))}
        </div>
        {offers.map((offer, idx) => (
          <div key={idx} className="border border-neutral-700 rounded-xl p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-neutral-400 font-semibold">Offer {idx + 1}</span>
              <button type="button" onClick={() => { const n=[...offers]; n[idx]={...n[idx],enabled:!n[idx].enabled}; setOffers(n); }}
                className={`px-2 py-0.5 rounded-full text-xs ${offer.enabled ? "bg-emerald-700 text-white" : "bg-neutral-700 text-neutral-500"}`}>
                {offer.enabled ? "ON" : "OFF"}
              </button>
            </div>
            {offer.enabled && (
              <div className="flex gap-2">
                <select value={offer.icon} onChange={e => { const n=[...offers]; n[idx]={...n[idx],icon:e.target.value}; setOffers(n); }}
                  className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-lg w-16">
                  {OFFER_ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                </select>
                <input value={offer.text} onChange={e => { const n=[...offers]; n[idx]={...n[idx],text:e.target.value}; setOffers(n); }}
                  className="flex-1 bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white"
                  placeholder={`Offer ${idx+1} text`} />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── SECTION 7: ROI Circle ── */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">🔵 ROI/Interest Circle</p>
          <button type="button" onClick={() => setRoiEnabled(!roiEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${roiEnabled ? "bg-emerald-700 text-white" : "bg-neutral-700 text-neutral-400"}`}>
            {roiEnabled ? "ON" : "OFF"}
          </button>
        </div>
        {roiEnabled && <>
          <input value={roiText} onChange={e => setRoiText(e.target.value)} className={inp} placeholder="सिर्फ 6.99%" />
          <input value={roiSub} onChange={e => setRoiSub(e.target.value)} className={inp} placeholder="की ब्याज दर" />
        </>}
      </div>

      {/* ── SECTION 8: Bottom Banner ── */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">📢 Bottom Banner</p>
          <button type="button" onClick={() => setBottomBannerEnabled(!bottomBannerEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${bottomBannerEnabled ? "bg-emerald-700 text-white" : "bg-neutral-700 text-neutral-400"}`}>
            {bottomBannerEnabled ? "ON" : "OFF"}
          </button>
        </div>
        {bottomBannerEnabled && <input value={bottomBanner} onChange={e => setBottomBanner(e.target.value)} className={inp} placeholder="कम से कम डाउन पेमेंट में Honda घर लाएं" />}

        <div className="flex items-center justify-between mt-2">
          <p className="text-xs font-bold text-neutral-300">📍 Location CTA</p>
          <button type="button" onClick={() => setLocationEnabled(!locationEnabled)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${locationEnabled ? "bg-emerald-700 text-white" : "bg-neutral-700 text-neutral-400"}`}>
            {locationEnabled ? "ON" : "OFF"}
          </button>
        </div>
        {locationEnabled && <textarea value={locationCTA} onChange={e => setLocationCTA(e.target.value)} rows={2} className={inp} placeholder="आज ही विज़िट करें&#10;ऑफर का लाभ उठाएं!" />}
      </div>

      {/* ── SECTION 9: Address Bar ── */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-white">🏬 Address Bar (नीचे)</p>
          <button type="button" onClick={() => setShowAddr(!showAddr)}
            className={`px-3 py-1 rounded-full text-xs font-bold ${showAddr ? "bg-emerald-700 text-white" : "bg-neutral-700 text-neutral-400"}`}>
            {showAddr ? "ON" : "OFF"}
          </button>
        </div>
        {showAddr && <>
          <p className="text-xs text-neutral-400">Style</p>
          <div className="grid grid-cols-2 gap-1.5 mb-2">
            {ADDRESS_STYLES.map(a => (
              <button key={a.id} type="button" onClick={() => { vib(15); setAddrStyle(a.id); }}
                className="px-2 py-2 rounded-xl text-xs border"
                style={{ borderColor: addrStyle === a.id ? "#FFD600" : "#3a3a3a", background: addrStyle === a.id ? "#1a1500" : "transparent", color: addrStyle === a.id ? "#FFD600" : "#aaa" }}>
                {a.label}
              </button>
            ))}
          </div>
          <input value={dealerName} onChange={e => setDealerName(e.target.value)} className={inp} placeholder="VP Honda" />
          <input value={dealerTag} onChange={e => setDealerTag(e.target.value)} className={inp} placeholder="VP Honda, परवलिया सड़क, भोपाल" />
          <input value={phone} onChange={e => setPhone(e.target.value)} className={inp} placeholder="9713394738" />
        </>}
      </div>

      {/* ── SECTION 10: Caption ── */}
      <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 space-y-2">
        <p className="text-sm font-bold text-white">✍️ Social Media Caption</p>
        <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} className={inp} />
      </div>

      {/* Submit Button */}
      <button type="button" onClick={sendToReview} disabled={busy}
        className="w-full rounded-2xl py-4 text-base font-bold text-black disabled:opacity-50"
        style={{ background: "#FFD600" }}>
        {busy ? "भेज रहे हैं…" : "📤 Review में भेजें"}
      </button>
    </div>
  );
}
