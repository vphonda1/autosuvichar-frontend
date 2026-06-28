const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useRef, useCallback, useEffect } from "react";

// ═══════════════════════════════════════════════════════════════
// MegaOfferEditor v2 — Draggable + Editable 3D buttons
// ═══════════════════════════════════════════════════════════════

const W = 1080, H = 1080;

// Brand logos (base64 से load होंगे — /logos/ से)
const BRAND_LOGOS = {
  vp_honda: "/logos/vp_honda.png",
  yakuza:   "/logos/yakuza.png",
  minimetro:"/logos/minimetro.png",
};

const BG_OPTIONS = [
  { id: "yellow_red",  label: "🔥 पीला-लाल",     c1: "#FFD600", c2: "#E4002B" },
  { id: "red_dark",    label: "🔴 लाल-काला",      c1: "#E4002B", c2: "#141414" },
  { id: "blue_dark",   label: "🔵 नीला-काला",     c1: "#1565c0", c2: "#0a1628" },
  { id: "orange_red",  label: "🟠 नारंगी-लाल",    c1: "#FF6F00", c2: "#B71C1C" },
  { id: "gold_dark",   label: "🥇 गोल्ड-काला",    c1: "#8B6914", c2: "#1a0f00" },
  { id: "green_dark",  label: "🟢 हरा-काला",      c1: "#1B5E20", c2: "#0a2a0a" },
  { id: "purple_dark", label: "🟣 बैंगनी-काला",   c1: "#4A148C", c2: "#1a0033" },
  { id: "white_clean", label: "⬜ सफ़ेद",          c1: "#f8f8f8", c2: "#e0e0e0" },
];

const BTN_STYLES = [
  { id: "red3d",    label: "🔴 लाल 3D",   bg:"#E4002B", shadow:"#7a0016", text:"#fff",    border:"#ff6b6b" },
  { id: "gold3d",   label: "🥇 गोल्ड 3D", bg:"#FFD600", shadow:"#8B6914", text:"#141414", border:"#ffe066" },
  { id: "white3d",  label: "⬜ सफ़ेद 3D",  bg:"#fff",    shadow:"#999",    text:"#E4002B", border:"#eee" },
  { id: "blue3d",   label: "🔵 नीला 3D",  bg:"#1565c0", shadow:"#0a2a5a", text:"#fff",    border:"#4fc3f7" },
  { id: "green3d",  label: "🟢 हरा 3D",   bg:"#1B5E20", shadow:"#0a2a0a", text:"#FFD600", border:"#4caf50" },
  { id: "dark3d",   label: "⚫ काला 3D",  bg:"#141414", shadow:"#000",    text:"#FFD600", border:"#333" },
];

const ADDR_STYLES = [
  { id: "red_black",  label: "🔴 लाल+काला",  bg1:"#E4002B", bg2:"#141414" },
  { id: "gold_dark",  label: "🥇 गोल्ड+काला", bg1:"#8B6914", bg2:"#141414" },
  { id: "blue_white", label: "🔵 नीला+सफ़ेद", bg1:"#1565c0", bg2:"#fff" },
  { id: "dark_red",   label: "⚫ काला+लाल",  bg1:"#141414", bg2:"#E4002B" },
];

const EMOJIS = ["💰","🔄","👔","🎁","📱","⌚","🏆","✅","🔥","💳","🏦","🛡️","🎰","📊","⭐","🎉","💎","🚀"];

const sel = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none mt-1";
const inp = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2.5 text-sm text-white outline-none mt-1";

function uid() { return "e" + Date.now() + Math.random().toString(36).slice(2,6); }

export default function MegaOfferEditor({ apiBase, token, brandId, onSent }) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const dragRef = useRef(null);

  // Background
  const [bg, setBg] = useState("yellow_red");

  // Bike image
  const [bikeImg, setBikeImg] = useState(null);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropBox, setCropBox] = useState({ x:0.05, y:0.05, w:0.9, h:0.9 });
  const cropRef = useRef(null);

  // Headline (non-draggable, always top)
  const [headline, setHeadline] = useState("महाबचत\nमहीना");
  const [hlSize, setHlSize] = useState(110);

  // Address bar
  const [showAddr, setShowAddr] = useState(true);
  const [addrStyle, setAddrStyle] = useState("red_black");
  const [dealerName, setDealerName] = useState("VP Honda");
  const [dealerSub, setDealerSub] = useState("VP Honda, परवलिया सड़क, भोपाल");
  const [phone, setPhone] = useState("9713394738");

  // Draggable elements
  const [elems, setElems] = useState([
    { id:uid(), type:"subhl",  x:60,  y:310, w:960, h:70,  text:"Honda गाड़ी खरीदने का शानदार मौका", btnStyle:"red3d",   fontSize:32, locked:false },
    { id:uid(), type:"offer",  x:555, y:395, w:490, h:145, text:"₹10,000 तक की\nमहाबचत",             btnStyle:"white3d", fontSize:44, locked:false },
    { id:uid(), type:"offer",  x:555, y:550, w:490, h:80,  text:"💰 ₹5,000 कैशबैक",                  btnStyle:"red3d",   fontSize:30, locked:false },
    { id:uid(), type:"offer",  x:555, y:640, w:490, h:80,  text:"🔄 ₹3,000 एक्सचेंज बोनस",           btnStyle:"red3d",   fontSize:30, locked:false },
    { id:uid(), type:"offer",  x:555, y:730, w:490, h:80,  text:"👔 ₹2,000 कॉर्पोरेट डिस्काउंट",    btnStyle:"red3d",   fontSize:30, locked:false },
    { id:uid(), type:"circle", x:55,  y:600, w:170, h:170, text:"सिर्फ\n6.99%\nब्याज दर",            btnStyle:"red3d",   fontSize:26, locked:false },
    { id:uid(), type:"banner", x:0,   y:828, w:620, h:70,  text:"कम से कम डाउन पेमेंट में Honda घर लाएं", btnStyle:"gold3d", fontSize:24, locked:false },
    { id:uid(), type:"banner", x:620, y:828, w:460, h:70,  text:"📍 आज ही विज़िट करें",              btnStyle:"red3d",   fontSize:26, locked:false },
  ]);

  const [selId, setSelId] = useState(null);
  const [editId, setEditId] = useState(null);
  const [btnStyle, setBtnStyle] = useState("red3d");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [caption, setCaption] = useState("🔥 VP Honda में महाबचत! अभी visit करें। #VPHonda #Bhopal");

  const selEl = elems.find(e => e.id === selId);

  // ── Canvas render ──────────────────────────────────────────────
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, W, H);

    // Background
    const bgObj = BG_OPTIONS.find(b => b.id === bg) || BG_OPTIONS[0];
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, bgObj.c1);
    grad.addColorStop(1, bgObj.c2);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Confetti dots
    const cc = ["#fff","#FFD600","#E4002B","#1565c0","#16a34a"];
    for (let i=0; i<30; i++) {
      ctx.save();
      ctx.globalAlpha = 0.25 + (i%4)*0.08;
      ctx.fillStyle = cc[i%5];
      const ex = (i*137+20)%W, ey = (i*89+10)%(H*0.65);
      ctx.translate(ex, ey);
      ctx.rotate(i*0.7);
      ctx.fillRect(-5, -5, 10+i%8, 10+i%8);
      ctx.restore();
    }

    // Bike image (left half)
    if (bikeImg) {
      const img = new Image();
      img.src = bikeImg;
      if (img.complete) {
        ctx.drawImage(img, 0, H*0.28, W*0.52, H*0.56);
      } else {
        img.onload = () => render();
      }
    } else {
      ctx.save();
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#fff";
      ctx.roundRect(20, H*0.30, W*0.5, H*0.52, 16);
      ctx.fill();
      ctx.restore();
      ctx.fillStyle = "#fff";
      ctx.globalAlpha = 0.4;
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🏍️ Bike Photo", W*0.25, H*0.58);
      ctx.font = "28px Arial";
      ctx.fillText("Upload करें ↓", W*0.25, H*0.63);
      ctx.globalAlpha = 1;
    }

    // Headline (top, always)
    const hlLines = headline.split("\n").filter(Boolean);
    ctx.textAlign = "center";
    hlLines.forEach((line, i) => {
      const y = 90 + i * (hlSize + 15) + hlSize;
      ctx.font = `900 ${hlSize}px "Arial Black", Arial`;
      ctx.strokeStyle = "#E4002B";
      ctx.lineWidth = 10;
      ctx.strokeText(line, W/2, y);
      ctx.fillStyle = "#fff";
      ctx.fillText(line, W/2, y);
    });

    // Draggable elements
    elems.forEach(el => {
      ctx.save();
      const bs = BTN_STYLES.find(b => b.id === el.btnStyle) || BTN_STYLES[0];

      if (el.type === "circle") {
        // 3D Circle
        const cx = el.x + el.w/2, cy = el.y + el.h/2, r = el.w/2;
        // Shadow
        ctx.beginPath();
        ctx.arc(cx+5, cy+7, r, 0, Math.PI*2);
        ctx.fillStyle = bs.shadow;
        ctx.fill();
        // Main circle
        const cg = ctx.createRadialGradient(cx-r*0.3, cy-r*0.3, r*0.1, cx, cy, r);
        cg.addColorStop(0, lighten(bs.bg, 30));
        cg.addColorStop(1, bs.bg);
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI*2);
        ctx.fillStyle = cg;
        ctx.fill();
        // Border
        ctx.strokeStyle = bs.border;
        ctx.lineWidth = 4;
        ctx.stroke();
        // Text
        const lines = el.text.split("\n");
        ctx.textAlign = "center";
        ctx.fillStyle = bs.text;
        lines.forEach((l,i) => {
          ctx.font = `700 ${el.fontSize}px "Arial", sans-serif`;
          ctx.fillText(l, cx, cy - (lines.length-1)*el.fontSize*0.6 + i*el.fontSize*1.2);
        });
      } else {
        // 3D Rectangle button
        const {x,y,w,h} = el;
        const r = Math.min(16, h*0.3);
        // Shadow (3D effect)
        ctx.fillStyle = bs.shadow;
        ctx.beginPath();
        ctx.roundRect(x+5, y+7, w, h, r);
        ctx.fill();
        // Gradient fill
        const bg2 = ctx.createLinearGradient(x, y, x, y+h);
        bg2.addColorStop(0, lighten(bs.bg, 25));
        bg2.addColorStop(1, bs.bg);
        ctx.fillStyle = bg2;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.fill();
        // Shine
        ctx.fillStyle = "rgba(255,255,255,0.18)";
        ctx.beginPath();
        ctx.roundRect(x+3, y+3, w-6, h*0.45, [r,r,0,0]);
        ctx.fill();
        // Border
        ctx.strokeStyle = bs.border;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, r);
        ctx.stroke();
        // Text
        const lines = el.text.split("\n");
        ctx.textAlign = "center";
        ctx.fillStyle = bs.text;
        const cx2 = x + w/2;
        lines.forEach((l,i) => {
          const fs = Math.min(el.fontSize, h*0.5/lines.length);
          ctx.font = `700 ${fs}px "Arial Black", Arial`;
          const ty = y + h/2 - (lines.length-1)*fs*0.6 + i*fs*1.2;
          ctx.fillText(l, cx2, ty + fs*0.35);
        });
      }

      // Selection border
      if (el.id === selId) {
        ctx.strokeStyle = "#FFD600";
        ctx.lineWidth = 4;
        ctx.setLineDash([10,6]);
        ctx.strokeRect(el.x-4, el.y-4, el.w+8, el.h+8);
        ctx.setLineDash([]);
      }
      ctx.restore();
    });

    // Address bar
    if (showAddr) {
      const addrObj = ADDR_STYLES.find(a => a.id === addrStyle) || ADDR_STYLES[0];
      const ay = H * 0.91;
      const ah = H * 0.09;
      ctx.fillStyle = addrObj.bg1;
      ctx.fillRect(0, ay, W*0.6, ah);
      ctx.fillStyle = addrObj.bg2;
      ctx.fillRect(W*0.6, ay, W*0.4, ah);
      // Pin
      ctx.font = "28px Arial";
      ctx.textAlign = "left";
      ctx.fillText("📍", 20, ay + ah*0.52);
      // Name
      ctx.fillStyle = "#fff";
      ctx.font = `900 36px "Arial Black", Arial`;
      ctx.fillText(dealerName, 65, ay + ah*0.45);
      ctx.font = "22px Arial";
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.fillText(dealerSub, 65, ay + ah*0.78);
      // Phone
      ctx.fillStyle = "#fff";
      ctx.font = "20px Arial";
      ctx.fillText("फ़ोन", W*0.62, ay + ah*0.38);
      ctx.fillStyle = "#FFD600";
      ctx.font = `900 44px "Arial Black", Arial`;
      ctx.fillText(phone, W*0.62, ay + ah*0.78);
    }

    // Logo (top right)
    const logoUrl = BRAND_LOGOS[brandId] || BRAND_LOGOS.vp_honda;
    const logoImg = new Image();
    logoImg.src = apiBase + logoUrl;
    if (logoImg.complete && logoImg.naturalWidth > 0) {
      ctx.drawImage(logoImg, W-130, 20, 110, 110);
    } else {
      logoImg.onload = () => render();
    }

  }, [bg, bikeImg, headline, hlSize, elems, selId, showAddr, addrStyle, dealerName, dealerSub, phone, brandId, apiBase]);

  useEffect(() => { render(); }, [render]);

  // lighten color helper
  function lighten(hex, amt) {
    try {
      const n = parseInt(hex.replace("#",""), 16);
      const r = Math.min(255, (n>>16)+amt);
      const g = Math.min(255, ((n>>8)&0xff)+amt);
      const b = Math.min(255, (n&0xff)+amt);
      return `rgb(${r},${g},${b})`;
    } catch { return hex; }
  }

  // ── Drag handling ──────────────────────────────────────────────
  function getScale() {
    const cv = canvasRef.current;
    if (!cv) return 1;
    return W / cv.getBoundingClientRect().width;
  }

  function onPointerDown(e) {
    const cv = canvasRef.current;
    const rect = cv.getBoundingClientRect();
    const scale = getScale();
    const mx = (e.clientX - rect.left) * scale;
    const my = (e.clientY - rect.top) * scale;

    // Find topmost element
    for (let i = elems.length-1; i >= 0; i--) {
      const el = elems[i];
      const inBounds = el.type === "circle"
        ? Math.hypot(mx - (el.x+el.w/2), my - (el.y+el.h/2)) <= el.w/2
        : mx >= el.x && mx <= el.x+el.w && my >= el.y && my <= el.y+el.h;
      if (inBounds) {
        setSelId(el.id);
        dragRef.current = { id: el.id, startX: mx, startY: my, origX: el.x, origY: el.y };
        e.preventDefault();
        return;
      }
    }
    setSelId(null);
  }

  function onPointerMove(e) {
    if (!dragRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const scale = getScale();
    const mx = (e.clientX - rect.left) * scale;
    const my = (e.clientY - rect.top) * scale;
    const dx = mx - dragRef.current.startX;
    const dy = my - dragRef.current.startY;
    setElems(prev => prev.map(el => el.id === dragRef.current.id
      ? { ...el, x: Math.max(0, dragRef.current.origX + dx), y: Math.max(0, dragRef.current.origY + dy) }
      : el));
  }

  function onPointerUp() { dragRef.current = null; }

  // ── Crop ──────────────────────────────────────────────────────
  function onBikeFile(e) {
    const file = e.target.files?.[0]; if (!file) return;
    const r = new FileReader();
    r.onload = () => { setCropSrc(r.result); setCropBox({x:0.05,y:0.05,w:0.9,h:0.9}); };
    r.readAsDataURL(file);
    e.target.value = "";
  }

  function confirmCrop() {
    const tmp = new Image();
    tmp.onload = () => {
      const iw=tmp.naturalWidth, ih=tmp.naturalHeight;
      const cx=Math.round(cropBox.x*iw), cy=Math.round(cropBox.y*ih);
      const cw=Math.max(1,Math.round(cropBox.w*iw)), ch=Math.max(1,Math.round(cropBox.h*ih));
      const c=document.createElement("canvas"); c.width=cw; c.height=ch;
      c.getContext("2d").drawImage(tmp,cx,cy,cw,ch,0,0,cw,ch);
      setBikeImg(c.toDataURL("image/png"));
      setCropSrc(null);
    };
    tmp.src = cropSrc;
  }

  // ── Element controls ───────────────────────────────────────────
  function updateEl(id, changes) {
    setElems(prev => prev.map(el => el.id === id ? {...el,...changes} : el));
  }
  function deleteEl(id) { setElems(prev => prev.filter(el => el.id !== id)); setSelId(null); }
  function addEl(type) {
    const id = uid();
    const base = { id, type, x:200, y:300, w:400, h:80, text:"नया बटन", btnStyle, fontSize:32 };
    if (type==="circle") { base.w=170; base.h=170; base.text="ऑफर\n5000*"; }
    if (type==="banner") { base.w=960; base.h=70; base.y=820; base.x=60; }
    setElems(prev => [...prev, base]);
    setSelId(id);
  }

  // ── Download PNG ───────────────────────────────────────────────
  function downloadPNG() {
    vib(30);
    const cv = canvasRef.current;
    cv.toBlob(blob => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "mega-offer.png"; a.click();
      URL.revokeObjectURL(url);
    }, "image/jpeg", 0.88);
  }

  // ── Submit to Review ───────────────────────────────────────────
  async function sendToReview() {
    vib(60); setBusy(true); setNote("भेज रहे हैं…");
    try {
      const b64 = canvasRef.current.toDataURL("image/jpeg", 0.88);
      const res = await fetch(apiBase + "/api/mega-offer/submit", {
        method:"POST",
        headers:{"Content-Type":"application/json","Authorization":"Bearer "+token},
        body:JSON.stringify({ brand:brandId, text:caption, imageData:b64, type:"vigyapan" }),
      });
      if (!res.ok) throw new Error((await res.json()).error||"Error");
      setNote("✅ Review में भेज दिया!");
      vib([30,30,60]);
      setTimeout(() => { setNote(""); if(onSent) onSent(); }, 3000);
    } catch(e) { setNote("❌ "+e.message); }
    setBusy(false);
  }

  // ── UI ─────────────────────────────────────────────────────────
  return (
    <div className="space-y-3 pb-10">

      {/* Crop Modal */}
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 w-full max-w-sm space-y-3">
            <p className="text-sm font-bold text-white text-center">📐 Crop करें</p>
            <div className="relative rounded-xl overflow-hidden border border-neutral-700" style={{aspectRatio:"1/1"}}>
              <img ref={cropRef} src={cropSrc} alt="crop" style={{width:"100%",height:"100%",objectFit:"contain"}}/>
              <div style={{position:"absolute",left:`${cropBox.x*100}%`,top:`${cropBox.y*100}%`,width:`${cropBox.w*100}%`,height:`${cropBox.h*100}%`,border:"2px solid #FFD600",boxShadow:"0 0 0 2000px rgba(0,0,0,0.6)",pointerEvents:"none"}}/>
            </div>
            {[["Left","x",0,0.6,"w"],["Top","y",0,0.6,"h"],["Width","w",0.1,1,null],["Height","h",0.1,1,null]].map(([l,k,mn,mx,lim])=>(
              <label key={k} className="text-xs text-neutral-300 block">{l}: {Math.round(cropBox[k]*100)}%
                <input type="range" min={mn} max={mx} step="0.01" value={cropBox[k]} className="w-full accent-yellow-400"
                  onChange={e=>{const v=parseFloat(e.target.value);setCropBox(b=>{const nb={...b,[k]:v};if(lim)nb[lim]=Math.min(b[lim],1-v-0.02);return nb;});}}/>
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

      {/* ══ STICKY PREVIEW ══ */}
      <div className="sticky top-0 z-30 bg-neutral-950 pb-2 pt-1">
        <div className="rounded-2xl overflow-hidden border border-neutral-700 bg-black">
          <canvas ref={canvasRef} width={W} height={H} className="w-full touch-none"
            onPointerDown={onPointerDown} onPointerMove={onPointerMove}
            onPointerUp={onPointerUp} onPointerLeave={onPointerUp}/>
          <div className="grid grid-cols-3 border-t border-neutral-800 divide-x divide-neutral-800">
            <button type="button" onClick={downloadPNG} className="py-2.5 text-xs text-neutral-300 font-medium">⬇ PNG</button>
            <label className="py-2.5 text-xs text-center text-neutral-300 font-medium cursor-pointer">
              🏍️ Bike
              <input type="file" accept="image/*" className="hidden" onChange={onBikeFile}/>
            </label>
            <button type="button" onClick={sendToReview} disabled={busy}
              className="py-2.5 text-xs font-bold text-black disabled:opacity-50" style={{background:"#FFD600"}}>
              {busy?"भेज रहे हैं…":"📤 Review"}
            </button>
          </div>
        </div>
        {note && <div className={`mt-1.5 rounded-xl px-3 py-2 text-xs font-semibold ${note.startsWith("✅")?"bg-emerald-900/60 text-emerald-300":"bg-red-900/60 text-red-300"}`}>{note}</div>}
      </div>

      {/* ══ SELECTED ELEMENT CONTROLS ══ */}
      {selEl && (
        <div className="bg-neutral-900 rounded-2xl border-2 border-yellow-500 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-yellow-400">✏️ Selected: {selEl.type}</p>
            <button type="button" onClick={()=>deleteEl(selEl.id)} className="text-red-400 text-xs px-2 py-1 rounded-lg border border-red-800">🗑 Delete</button>
          </div>
          {/* Text edit */}
          <textarea value={selEl.text} onChange={e=>updateEl(selEl.id,{text:e.target.value})} rows={2}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none"/>
          {/* Controls row */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <p className="text-[10px] text-neutral-500">Font Size</p>
              <input type="number" value={selEl.fontSize} min={16} max={80}
                onChange={e=>updateEl(selEl.id,{fontSize:parseInt(e.target.value)||32})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-white"/>
            </div>
            <div>
              <p className="text-[10px] text-neutral-500">Width</p>
              <input type="number" value={selEl.w} min={80} max={1060}
                onChange={e=>updateEl(selEl.id,{w:parseInt(e.target.value)||200})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-white"/>
            </div>
            <div>
              <p className="text-[10px] text-neutral-500">Height</p>
              <input type="number" value={selEl.h} min={40} max={600}
                onChange={e=>updateEl(selEl.id,{h:parseInt(e.target.value)||80})}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-white"/>
            </div>
          </div>
          {/* Button style */}
          <p className="text-[10px] text-neutral-500">Button Style</p>
          <select value={selEl.btnStyle} onChange={e=>updateEl(selEl.id,{btnStyle:e.target.value})} className={sel}>
            {BTN_STYLES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          {/* Position */}
          <div className="grid grid-cols-2 gap-2">
            <div><p className="text-[10px] text-neutral-500">X Position</p>
              <input type="number" value={Math.round(selEl.x)} onChange={e=>updateEl(selEl.id,{x:parseInt(e.target.value)||0})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-white"/></div>
            <div><p className="text-[10px] text-neutral-500">Y Position</p>
              <input type="number" value={Math.round(selEl.y)} onChange={e=>updateEl(selEl.id,{y:parseInt(e.target.value)||0})} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-white"/></div>
          </div>
        </div>
      )}

      {/* ══ ADD NEW ELEMENT ══ */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer">➕ नया Element जोड़ें</summary>
        <div className="px-4 pb-4 space-y-2">
          <p className="text-xs text-neutral-400">Default Style</p>
          <select value={btnStyle} onChange={e=>setBtnStyle(e.target.value)} className={sel}>
            {BTN_STYLES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-2 mt-2">
            {[["offer","📦 Offer Box"],["subhl","📢 Sub Headline"],["banner","📋 Banner"],["circle","🔵 Circle"]].map(([t,l])=>(
              <button key={t} type="button" onClick={()=>{vib(20);addEl(t);}}
                className="py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-300 hover:border-yellow-400 hover:text-yellow-400">
                {l}
              </button>
            ))}
          </div>
        </div>
      </details>

      {/* ══ SETTINGS DROPDOWNS ══ */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer">🎨 Background & Headline</summary>
        <div className="px-4 pb-4 space-y-3">
          <div>
            <p className="text-xs text-neutral-400">Background</p>
            <select value={bg} onChange={e=>setBg(e.target.value)} className={sel}>
              {BG_OPTIONS.map(b=><option key={b.id} value={b.id}>{b.label}</option>)}
            </select>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Headline Text (Enter = नई line)</p>
            <textarea value={headline} onChange={e=>setHeadline(e.target.value)} rows={2} className={inp+" resize-none"}/>
          </div>
          <div>
            <p className="text-xs text-neutral-400">Headline Size: {hlSize}px</p>
            <input type="range" min={60} max={150} value={hlSize} onChange={e=>setHlSize(parseInt(e.target.value))} className="w-full accent-yellow-400"/>
          </div>
        </div>
      </details>

      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer">🏬 Address Bar</summary>
        <div className="px-4 pb-4 space-y-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-neutral-400">Show</span>
            <button type="button" onClick={()=>setShowAddr(!showAddr)}
              className={`px-3 py-1 rounded-full text-xs font-bold ${showAddr?"bg-emerald-700 text-white":"bg-neutral-700 text-neutral-400"}`}>
              {showAddr?"ON":"OFF"}
            </button>
          </div>
          {showAddr && <>
            <select value={addrStyle} onChange={e=>setAddrStyle(e.target.value)} className={sel}>
              {ADDR_STYLES.map(a=><option key={a.id} value={a.id}>{a.label}</option>)}
            </select>
            <input value={dealerName} onChange={e=>setDealerName(e.target.value)} className={inp} placeholder="VP Honda"/>
            <input value={dealerSub} onChange={e=>setDealerSub(e.target.value)} className={inp} placeholder="पता..."/>
            <input value={phone} onChange={e=>setPhone(e.target.value)} className={inp} placeholder="फ़ोन"/>
          </>}
        </div>
      </details>

      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer">✍️ Caption</summary>
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
