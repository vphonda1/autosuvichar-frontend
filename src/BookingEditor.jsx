import React, { useState, useRef, useEffect, useCallback } from "react";
import { getBrand, useBrandLogo, useOwnerLogo, drawBothLogos } from "./brands.js";
import { useImageCache, roundRect, drawFit } from "./canvasKit.js";
const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// ═══════════════════════════════════════════════════════
// BookingEditor — बुकिंग के फायदे + Festival Offer Poster
// ═══════════════════════════════════════════════════════

const W = 1080, H = 1350;

const BG_STYLES = [
  { id: "festival_gold", label: "🪔 फेस्टिवल (पीला-सोना)",   c1:"#FFD600", c2:"#FF8F00", c3:"#fff" },
  { id: "festival_red",  label: "🔴 फेस्टिवल (लाल-सफ़ेद)",   c1:"#fff5f5", c2:"#ffe0e0", c3:"#fff" },
  { id: "navratri",      label: "🌺 नवरात्रि (मैरून-सोना)",   c1:"#fff3e0", c2:"#fbe9e7", c3:"#fff" },
  { id: "blue_white",    label: "🔵 नीला-सफ़ेद (Modern)",     c1:"#e3f2fd", c2:"#fff",    c3:"#fff" },
  { id: "dark_gold",     label: "⚫ काला-गोल्ड (Premium)",    c1:"#1a0f00", c2:"#2a1800", c3:"#FFD600" },
  { id: "green_white",   label: "🟢 हरा-सफ़ेद (Fresh)",       c1:"#e8f5e9", c2:"#fff",    c3:"#fff" },
];

const HEADER_STYLES = [
  { id: "circle_red",  label: "🔴 Circle (लाल)",     bg:"#C62828", text:"#fff",    border:"#FFD600" },
  { id: "circle_gold", label: "🥇 Circle (गोल्ड)",   bg:"#8B6914", text:"#fff",    border:"#FFD600" },
  { id: "ribbon_red",  label: "🎀 Ribbon (लाल)",     bg:"#C62828", text:"#FFD600", border:"#8B6914" },
  { id: "ribbon_dark", label: "🎀 Ribbon (काला)",    bg:"#1a0a00", text:"#FFD600", border:"#8B6914" },
  { id: "box_red",     label: "📦 Box (लाल)",        bg:"#E4002B", text:"#fff",    border:"#fff" },
  { id: "box_white",   label: "📦 Box (सफ़ेद)",      bg:"#fff",    text:"#E4002B", border:"#E4002B" },
];

const BULLET_COLORS = [
  { id: "red",    label: "🔴 लाल",    dot:"#E4002B", text:"#1a1a1a", hl:"#E4002B" },
  { id: "gold",   label: "🥇 गोल्ड",  dot:"#8B6914", text:"#1a1a1a", hl:"#8B6914" },
  { id: "blue",   label: "🔵 नीला",   dot:"#1565c0", text:"#1a1a1a", hl:"#1565c0" },
  { id: "green",  label: "🟢 हरा",    dot:"#1B5E20", text:"#1a1a1a", hl:"#1B5E20" },
  { id: "white",  label: "⬜ सफ़ेद",  dot:"#fff",    text:"#fff",    hl:"#FFD600" },
];

const ADDR_STYLES = [
  { id: "red_black",  bg1:"#E4002B", bg2:"#141414" },
  { id: "gold_dark",  bg1:"#8B6914", bg2:"#141414" },
  { id: "blue_white", bg1:"#1565c0", bg2:"#fff" },
  { id: "dark_red",   bg1:"#141414", bg2:"#E4002B" },
];

const DEFAULT_BULLETS = [
  { id:1, text:"अपनी पसंद का कलर चुनने की पूरी आज़ादी",    bold:"" },
  { id:2, text:"15 मिनट में डिलीवरी – बिना इंतजार के",      bold:"15 मिनट" },
  { id:3, text:"एक्सेसरीज़ सहित पूरी गाड़ी तैयार",           bold:"एक्सेसरीज़" },
  { id:4, text:"डिलीवरी के पहले PDI पूरी",                  bold:"PDI" },
  { id:5, text:"हैंड टू हैंड डॉक्यूमेंट्स",                 bold:"डॉक्यूमेंट्स" },
  { id:6, text:"हर डिलीवरी पर गिफ्ट",                       bold:"गिफ्ट" },
  { id:7, text:"परेशनी से बचे – भीड़ से पहले ही बुक करो",   bold:"परेशनी से बचे" },
  { id:8, text:"आसान एक्सचेंज एवं पुरानी गाड़ी का सबसे बेहतरीन मूल्य", bold:"" },
  { id:9, text:"पेमेंट की लाइन से बच जाएंगे",               bold:"" },
];

const inp = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-red-500 mt-1";
const sel = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none mt-1";

export default function BookingEditor({ apiBase, token, brandId, onSent }) {
  const canvasRef = useRef(null);
  // ✅ तस्वीरों का cache — render का अंतहीन चक्कर यहीं रुकता है
  const imgCache = useImageCache();

  // Settings
  const [bgStyle, setBgStyle]         = useState("festival_gold");
  const [headerStyle, setHeaderStyle] = useState("circle_red");
  const [bulletColor, setBulletColor] = useState("red");
  const [addrStyle, setAddrStyle]     = useState("red_black");

  // Content
  const [mainTitle, setMainTitle]   = useState("फेस्टिवल\nबुकिंग\nमहोत्सव");
  const [subTitle, setSubTitle]     = useState("त्यौहार से पहले बुकिंग, खुशियो का डबल धमाका!");
  const [sectionTitle, setSectionTitle] = useState("बुकिंग के फायदे");
  const [bullets, setBullets]       = useState(DEFAULT_BULLETS);
  const [tcText, setTcText]         = useState("T&C APPLY/*");
  const [showTC, setShowTC]         = useState(true);

  // Bike image
  const [bikeImg, setBikeImg]   = useState(null);
  const [cropSrc, setCropSrc]   = useState(null);
  const [cropBox, setCropBox]   = useState({x:0.05,y:0.05,w:0.9,h:0.9});
  const cropRef = useRef(null);

  // Address
  const [showAddr, setShowAddr]   = useState(true);
  // ⚠️ पहले तीनों brands पर "VP Honda" hardcoded था — अब brand बदलते ही बदल जाता है
  const B0 = getBrand(brandId);
  const [dealerName, setDealerName] = useState(B0.name);
  const [dealerSub, setDealerSub]   = useState(B0.address);
  const [phone, setPhone]           = useState(B0.phone);
  const [touched, setTouched]       = useState(false);
  useEffect(() => {
    if (touched) return;
    const b = getBrand(brandId);
    setDealerName(b.name); setDealerSub(b.address); setPhone(b.phone);
  }, [brandId, touched]);
  // ⚠️ crossOrigin के बिना canvas tainted हो जाता था → Download/Submit fail
  const [logoRef, logoTick] = useBrandLogo(apiBase, brandId);
  // बाएँ मालिक का logo, दाएँ brand/कंपनी का logo — तीनों brands पर
  const [ownerRef, ownerTick] = useOwnerLogo(apiBase);

  // Caption
  const [caption, setCaption] = useState(`🪔 ${B0.name} में फेस्टिवल बुकिंग महोत्सव! अभी बुक करें और पाएं धमाकेदार फायदे।\n📍 ${B0.address}\n${B0.hashtags.join(" ")}`);

  const [note, setNote]   = useState("");
  const [busy, setBusy]   = useState(false);

  // ── Canvas render ─────────────────────────────────────────────
  const render = useCallback(() => {
    const cv = canvasRef.current;
    if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    const bg = BG_STYLES.find(b => b.id === bgStyle) || BG_STYLES[0];
    const hdr = HEADER_STYLES.find(h => h.id === headerStyle) || HEADER_STYLES[0];
    const bc = BULLET_COLORS.find(b => b.id === bulletColor) || BULLET_COLORS[0];
    const addr = ADDR_STYLES.find(a => a.id === addrStyle) || ADDR_STYLES[0];
    const isDark = bgStyle === "dark_gold";

    // ── Background ──
    const grad = ctx.createLinearGradient(0, 0, 0, H*0.45);
    grad.addColorStop(0, bg.c1);
    grad.addColorStop(1, bg.c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H*0.45);

    // White/light bottom area
    ctx.fillStyle = isDark ? "#1a0f00" : "#fff";
    ctx.fillRect(0, H*0.42, W, H*0.58);

    // Decorative border on header area
    if (!isDark) {
      ctx.strokeStyle = "rgba(139,105,20,0.3)";
      ctx.lineWidth = 8;
      ctx.strokeRect(15, 15, W-30, H*0.44);
    }

    // ── Festival decoration (top border dots) ──
    if (bgStyle === "festival_gold" || bgStyle === "navratri") {
      const dotColors = ["#E4002B","#FFD600","#E4002B","#FFD600","#E4002B"];
      for (let i=0; i<16; i++) {
        const x = 40 + i*(W-80)/15;
        ctx.beginPath();
        ctx.arc(x, 35, 14, 0, Math.PI*2);
        ctx.fillStyle = dotColors[i%5];
        ctx.fill();
        ctx.strokeStyle = "#8B6914";
        ctx.lineWidth = 2;
        ctx.stroke();
      }
    }

    // ── Main Title (circle/ribbon style) ──
    const titleLines = mainTitle.split("\n").filter(Boolean);
    const cxTitle = W * 0.5;
    const cyTitle = H * 0.22;

    if (headerStyle.startsWith("circle")) {
      // Gold ring
      ctx.beginPath();
      ctx.arc(cxTitle, cyTitle, W*0.28, 0, Math.PI*2);
      ctx.strokeStyle = hdr.border;
      ctx.lineWidth = 12;
      ctx.stroke();
      // Inner fill
      const cg = ctx.createRadialGradient(cxTitle-30, cyTitle-40, 20, cxTitle, cyTitle, W*0.27);
      cg.addColorStop(0, lighten(hdr.bg, 40));
      cg.addColorStop(1, hdr.bg);
      ctx.beginPath();
      ctx.arc(cxTitle, cyTitle, W*0.26, 0, Math.PI*2);
      ctx.fillStyle = cg;
      ctx.fill();
      // Text inside circle
      ctx.textAlign = "center";
      titleLines.forEach((l, i) => {
        const fs = Math.min(100, Math.floor(500/Math.max(...titleLines.map(t=>t.length))));
        const ty = cyTitle - (titleLines.length-1)*fs*0.55 + i*fs*1.1;
        ctx.font = `900 ${fs}px "Arial Black", Arial`;
        ctx.fillStyle = hdr.text;
        ctx.fillText(l, cxTitle, ty + fs*0.35);
      });
    } else if (headerStyle.startsWith("ribbon")) {
      // Ribbon style
      const rw = W*0.8, rh = titleLines.length*90+40;
      const rx = (W-rw)/2, ry = cyTitle-rh/2;
      ctx.fillStyle = hdr.bg;
      ctx.beginPath();
      roundRect(ctx, rx, ry, rw, rh, 12);
      ctx.fill();
      // Left/Right notch
      ctx.fillStyle = darken(hdr.bg, 30);
      ctx.beginPath();
      ctx.moveTo(rx, ry+20); ctx.lineTo(rx-30, ry+rh/2); ctx.lineTo(rx, ry+rh-20); ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(rx+rw, ry+20); ctx.lineTo(rx+rw+30, ry+rh/2); ctx.lineTo(rx+rw, ry+rh-20); ctx.closePath();
      ctx.fill();
      // Border
      ctx.strokeStyle = hdr.border;
      ctx.lineWidth = 5;
      ctx.beginPath(); roundRect(ctx, rx, ry, rw, rh, 12); ctx.stroke();
      // Text
      ctx.textAlign = "center";
      titleLines.forEach((l, i) => {
        ctx.font = `900 72px "Arial Black", Arial`;
        ctx.fillStyle = hdr.text;
        ctx.fillText(l, W/2, ry + 60 + i*85);
      });
    } else {
      // Box style
      const bw = W*0.8, bh = titleLines.length*80+40;
      const bx = (W-bw)/2, by = cyTitle-bh/2;
      ctx.fillStyle = hdr.bg;
      ctx.beginPath(); roundRect(ctx, bx, by, bw, bh, 16); ctx.fill();
      ctx.strokeStyle = hdr.border; ctx.lineWidth = 5;
      ctx.beginPath(); roundRect(ctx, bx, by, bw, bh, 16); ctx.stroke();
      ctx.textAlign = "center";
      titleLines.forEach((l, i) => {
        ctx.font = `900 72px "Arial Black", Arial`;
        ctx.fillStyle = hdr.text;
        ctx.fillText(l, W/2, by + 65 + i*80);
      });
    }

    // Sub title
    if (subTitle) {
      ctx.textAlign = "center";
      ctx.font = `600 34px Arial, sans-serif`;
      ctx.fillStyle = isDark ? "#FFD600" : "#555";
      ctx.fillText(subTitle, W/2, H*0.41);
    }

    // ── Section divider ──
    const secY = H * 0.46;
    // Section title badge
    const stw = Math.min(W*0.5, ctx.measureText(sectionTitle).width + 80);
    const stx = 50;
    ctx.fillStyle = "#E4002B";
    ctx.beginPath(); roundRect(ctx, stx, secY, stw, 60, 30); ctx.fill();
    ctx.textAlign = "left";
    ctx.font = `900 34px "Arial Black", Arial`;
    ctx.fillStyle = "#fff";
    ctx.fillText(sectionTitle, stx+30, secY+40);

    // ── Bike image (right side, middle area) ──
    if (bikeImg) {
      // ✅ cache से — तस्वीर एक बार load होती है, render का चक्कर नहीं बनता
      const img = imgCache.get(bikeImg);
      if (img) drawFit(ctx, img, W*0.52, H*0.44, W*0.46, H*0.36);
    } else {
      ctx.save();
      ctx.globalAlpha = 0.1;
      ctx.fillStyle = "#E4002B";
      ctx.beginPath(); roundRect(ctx, W*0.54, H*0.46, W*0.42, H*0.32, 20); ctx.fill();
      ctx.restore();
      ctx.textAlign = "center";
      ctx.fillStyle = isDark ? "#FFD600" : "#999";
      ctx.font = "52px Arial";
      ctx.fillText("🏍️", W*0.75, H*0.6);
      ctx.font = "26px Arial";
      ctx.fillText("Bike Photo", W*0.75, H*0.64);
    }

    // ── Bullet points (left side) ──
    const bulletX = 55, bulletStartY = H*0.535;
    const maxBulletW = W * 0.5;
    let byOff = 0;
    bullets.forEach((b, i) => {
      if (!b.text) return;
      // Dot
      ctx.beginPath();
      ctx.arc(bulletX+12, bulletStartY + byOff + 18, 9, 0, Math.PI*2);
      ctx.fillStyle = bc.dot;
      ctx.fill();
      // Text — wrap if needed
      const words = b.text.split(" ");
      let line = "", lines = [];
      ctx.font = `500 30px "Noto Sans Devanagari", Arial`;
      words.forEach(w => {
        const test = line + " " + w;
        if (ctx.measureText(test.trim()).width > maxBulletW-40 && line) {
          lines.push(line.trim()); line = w;
        } else line = test.trim();
      });
      if (line) lines.push(line.trim());
      lines.forEach((l, li) => {
        ctx.fillStyle = bc.text;
        ctx.font = `500 30px "Noto Sans Devanagari", Arial`;
        ctx.textAlign = "left";
        ctx.fillText(l, bulletX+35, bulletStartY + byOff + 30 + li*38);
      });
      byOff += lines.length * 38 + 14;
    });

    // ── T&C ──
    if (showTC) {
      ctx.textAlign = "center";
      ctx.font = "italic 26px Arial";
      ctx.fillStyle = isDark ? "#FFD600" : "#888";
      ctx.fillText(tcText, W/2, H*0.895);
    }

    // ── Address bar ──
    if (showAddr) {
      const ay = H * 0.91;
      const ah = H * 0.09;
      ctx.fillStyle = addr.bg1;
      ctx.fillRect(0, ay, W*0.6, ah);
      ctx.fillStyle = addr.bg2;
      ctx.fillRect(W*0.6, ay, W*0.4, ah);
      ctx.textAlign = "left";
      ctx.fillStyle = addr.bg2 === "#fff" ? "#141414" : "#fff";
      ctx.font = `24px Arial`; ctx.fillText("📍", 20, ay+ah*0.45);
      ctx.font = `900 36px "Arial Black", Arial`; ctx.fillStyle = "#fff";
      ctx.fillText(dealerName, 65, ay+ah*0.45);
      ctx.font = `22px Arial`; ctx.fillStyle = "rgba(255,255,255,0.88)";
      ctx.fillText(dealerSub, 65, ay+ah*0.8);
      ctx.fillStyle = addr.bg1 === "#fff" ? "#141414" : "#fff";
      ctx.font = "20px Arial"; ctx.fillText("फ़ोन", W*0.62, ay+ah*0.38);
      ctx.fillStyle = "#FFD600"; ctx.font = `900 44px "Arial Black", Arial`;
      ctx.fillText(phone, W*0.62, ay+ah*0.8);
    }

    // ── Brand Logo (crossOrigin-safe, aspect बना रहता है) ──
    drawBothLogos(ctx, ownerRef, logoRef, brandId, W, 15, 110);

  }, [bgStyle, headerStyle, bulletColor, addrStyle, mainTitle, subTitle, sectionTitle, bullets, tcText, showTC, bikeImg, showAddr, dealerName, dealerSub, phone, brandId, apiBase, logoTick, ownerTick, imgCache.tick]);

  useEffect(() => { render(); }, [render]);

  // helpers
  function lighten(hex, amt) {
    try { const n=parseInt(hex.replace("#",""),16); return `rgb(${Math.min(255,(n>>16)+amt)},${Math.min(255,((n>>8)&0xff)+amt)},${Math.min(255,(n&0xff)+amt)})`; } catch { return hex; }
  }
  function darken(hex, amt) { return lighten(hex, -amt); }

  // Crop
  function onBikeFile(e) {
    const f=e.target.files?.[0]; if(!f) return;
    const r=new FileReader(); r.onload=()=>{setCropSrc(r.result);setCropBox({x:0.05,y:0.05,w:0.9,h:0.9});}; r.readAsDataURL(f); e.target.value="";
  }
  function confirmCrop() {
    const tmp=new Image(); tmp.onload=()=>{
      const iw=tmp.naturalWidth,ih=tmp.naturalHeight;
      const cx=Math.round(cropBox.x*iw),cy=Math.round(cropBox.y*ih),cw=Math.max(1,Math.round(cropBox.w*iw)),ch=Math.max(1,Math.round(cropBox.h*ih));
      const c=document.createElement("canvas"); c.width=cw; c.height=ch;
      c.getContext("2d").drawImage(tmp,cx,cy,cw,ch,0,0,cw,ch);
      setBikeImg(c.toDataURL("image/png")); setCropSrc(null);
    }; tmp.src=cropSrc;
  }

  // Bullet controls
  function updateBullet(id, text) { setBullets(prev=>prev.map(b=>b.id===id?{...b,text}:b)); }
  function addBullet() { setBullets(prev=>[...prev,{id:Date.now(),text:"नया फायदा",bold:""}]); }
  function deleteBullet(id) { setBullets(prev=>prev.filter(b=>b.id!==id)); }
  function moveBullet(id, dir) {
    setBullets(prev=>{
      const idx=prev.findIndex(b=>b.id===id); if(idx<0) return prev;
      const next=[...prev]; const swap=idx+dir; if(swap<0||swap>=next.length) return prev;
      [next[idx],next[swap]]=[next[swap],next[idx]]; return next;
    });
  }

  // Download
  function downloadPNG() {
    vib(30);
    canvasRef.current.toBlob(blob=>{
      const url=URL.createObjectURL(blob);
      const a=document.createElement("a"); a.href=url; a.download="booking-poster.jpg"; a.click(); URL.revokeObjectURL(url);
    }, "image/jpeg", 0.9);
  }

  // Submit
  async function sendToReview() {
    vib(60); setBusy(true); setNote("भेज रहे हैं…");
    try {
      const b64=canvasRef.current.toDataURL("image/jpeg",0.88);
      const res=await fetch(apiBase+"/api/mega-offer/submit",{
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
        body:JSON.stringify({brand:brandId,text:caption,imageData:b64,type:"vigyapan"}),
      });
      if(!res.ok) throw new Error((await res.json()).error||"Error");
      setNote("✅ Review में भेज दिया!"); vib([30,30,60]);
      setTimeout(()=>{setNote("");if(onSent)onSent();},3000);
    } catch(e){setNote("❌ "+e.message);}
    setBusy(false);
  }

  return (
    <div className="space-y-3 pb-10">

      {/* Crop Modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 w-full max-w-sm space-y-3">
            <p className="text-sm font-bold text-white text-center">📐 Bike Photo Crop</p>
            <div className="relative rounded-xl overflow-hidden border border-neutral-700" style={{aspectRatio:"3/4"}}>
              <img ref={cropRef} src={cropSrc} alt="crop" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
              <div style={{position:"absolute",left:`${cropBox.x*100}%`,top:`${cropBox.y*100}%`,width:`${cropBox.w*100}%`,height:`${cropBox.h*100}%`,border:"2px solid #FFD600",boxShadow:"0 0 0 2000px rgba(0,0,0,0.6)",pointerEvents:"none"}}/>
            </div>
            {[["Left","x"],["Top","y"],["Width","w"],["Height","h"]].map(([l,k])=>(
              <label key={k} className="text-xs text-neutral-300 block">{l}: {Math.round(cropBox[k]*100)}%
                <input type="range" min="0.02" max="0.98" step="0.01" value={cropBox[k]} className="w-full accent-yellow-400"
                  onChange={e=>setCropBox(b=>({...b,[k]:parseFloat(e.target.value)}))}/>
              </label>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={()=>setCropSrc(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-600 text-sm text-neutral-300">रद्द</button>
              <button type="button" onClick={()=>{vib(30);confirmCrop();}} className="flex-1 py-2.5 rounded-xl font-bold text-black text-sm" style={{background:"#FFD600"}}>✅ Crop</button>
            </div>
            <button type="button" onClick={()=>{setBikeImg(cropSrc);setCropSrc(null);}} className="w-full py-2 rounded-xl border border-neutral-700 text-xs text-neutral-400">बिना crop के use करें</button>
          </div>
        </div>
      )}

      {/* ── STICKY PREVIEW ── */}
      <div className="sticky top-0 z-30 bg-neutral-950 pb-2 pt-1">
        <div className="rounded-2xl overflow-hidden border border-neutral-700">
          <canvas ref={canvasRef} width={W} height={H} className="w-full"/>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
          <button type="button" onClick={downloadPNG} className="py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-300 font-medium">⬇ PNG</button>
          <label className="py-2.5 rounded-xl border border-neutral-700 text-xs text-center text-neutral-300 font-medium cursor-pointer">
            🏍️ Bike <input type="file" accept="image/*" className="hidden" onChange={onBikeFile}/>
          </label>
          <button type="button" onClick={sendToReview} disabled={busy}
            className="py-2.5 rounded-xl text-xs font-bold text-black disabled:opacity-50" style={{background:"#FFD600"}}>
            {busy?"भेज रहे हैं…":"📤 Review"}
          </button>
        </div>
        {note && <div className={`mt-1 rounded-xl px-3 py-2 text-xs font-semibold ${note.startsWith("✅")?"bg-emerald-900/60 text-emerald-300":"bg-red-900/60 text-red-300"}`}>{note}</div>}
      </div>

      {/* ── DESIGN OPTIONS ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800" open>
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">
          🎨 Design Style <span className="text-neutral-500">▼</span>
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <div>
            <p className="text-xs text-neutral-400">Background</p>
            <select value={bgStyle} onChange={e=>setBgStyle(e.target.value)} className={sel}>
              {BG_STYLES.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Header Style (Circle/Ribbon/Box)</p>
            <select value={headerStyle} onChange={e=>setHeaderStyle(e.target.value)} className={sel}>
              {HEADER_STYLES.map(h=><option key={h.id} value={h.id}>{h.label}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Bullet Points Color</p>
            <select value={bulletColor} onChange={e=>setBulletColor(e.target.value)} className={sel}>
              {BULLET_COLORS.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
        </div>
      </details>

      {/* ── CONTENT ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">
          ✍️ Text Content <span className="text-neutral-500">▼</span>
        </summary>
        <div className="px-4 pb-4 space-y-3">
          <div>
            <p className="text-xs text-neutral-400">Main Title (Enter = नई line)</p>
            <textarea value={mainTitle} onChange={e=>setMainTitle(e.target.value)} rows={3} className={inp+" resize-none"}/>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Sub Title (header के नीचे)</p>
            <input value={subTitle} onChange={e=>setSubTitle(e.target.value)} className={inp}/>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Section Title ("बुकिंग के फायदे")</p>
            <input value={sectionTitle} onChange={e=>setSectionTitle(e.target.value)} className={inp}/>
          </div>
        </div>
      </details>

      {/* ── BULLET POINTS ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">
          📋 Bullet Points ({bullets.length}) <span className="text-neutral-500">▼</span>
        </summary>
        <div className="px-4 pb-4 space-y-2">
          {bullets.map((b, i) => (
            <div key={b.id} className="flex gap-1.5 items-center">
              <span className="text-neutral-500 text-xs w-5">{i+1}.</span>
              <input value={b.text} onChange={e=>updateBullet(b.id,e.target.value)}
                className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white"/>
              <button type="button" onClick={()=>moveBullet(b.id,-1)} className="text-neutral-400 text-xs px-1">↑</button>
              <button type="button" onClick={()=>moveBullet(b.id,1)} className="text-neutral-400 text-xs px-1">↓</button>
              <button type="button" onClick={()=>deleteBullet(b.id)} className="text-red-500 text-xs px-1">✕</button>
            </div>
          ))}
          <button type="button" onClick={addBullet}
            className="w-full py-2 rounded-xl border border-dashed border-neutral-600 text-xs text-neutral-400 mt-2">
            ➕ नया point जोड़ें
          </button>
        </div>
      </details>

      {/* ── T&C ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">
          📝 T&C Text <span className="text-neutral-500">▼</span>
        </summary>
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400">Show T&C</span>
            <button type="button" onClick={()=>setShowTC(!showTC)}
              className={`px-3 py-1 rounded-full text-xs font-bold ${showTC?"bg-emerald-700 text-white":"bg-neutral-700 text-neutral-400"}`}>
              {showTC?"ON":"OFF"}
            </button>
          </div>
          {showTC && <input value={tcText} onChange={e=>setTcText(e.target.value)} className={inp} placeholder="T&C APPLY/*"/>}
        </div>
      </details>

      {/* ── ADDRESS BAR ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">
          🏬 Address Bar <span className="text-neutral-500">▼</span>
        </summary>
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-neutral-400">Show</span>
            <button type="button" onClick={()=>setShowAddr(!showAddr)}
              className={`px-3 py-1 rounded-full text-xs font-bold ${showAddr?"bg-emerald-700 text-white":"bg-neutral-700 text-neutral-400"}`}>
              {showAddr?"ON":"OFF"}
            </button>
          </div>
          {showAddr && <>
            <select value={addrStyle} onChange={e=>setAddrStyle(e.target.value)} className={sel}>
              {ADDR_STYLES.map((a,i)=><option key={a.id} value={a.id}>{["🔴 लाल+काला","🥇 गोल्ड+काला","🔵 नीला+सफ़ेद","⚫ काला+लाल"][i]}</option>)}
            </select>
            <input value={dealerName} onChange={e=>{setTouched(true); setDealerName(e.target.value);}} className={inp} placeholder={B0.name}/>
            <input value={dealerSub} onChange={e=>setDealerSub(e.target.value)} className={inp} placeholder="पता..."/>
            <input value={phone} onChange={e=>setPhone(e.target.value)} className={inp} placeholder="फ़ोन"/>
          </>}
        </div>
      </details>

      {/* ── CAPTION ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">
          ✍️ Caption <span className="text-neutral-500">▼</span>
        </summary>
        <div className="px-4 pb-4">
          <textarea value={caption} onChange={e=>setCaption(e.target.value)} rows={3} className={inp+" resize-none"}/>
        </div>
      </details>

      <button type="button" onClick={sendToReview} disabled={busy}
        className="w-full rounded-2xl py-4 font-bold text-black text-base disabled:opacity-50" style={{background:"#FFD600"}}>
        {busy?"भेज रहे हैं…":"📤 Review में भेजें"}
      </button>
    </div>
  );
}
