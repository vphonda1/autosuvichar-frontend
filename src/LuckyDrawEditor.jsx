const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useRef, useEffect, useCallback } from "react";

const W = 1080, H = 1350;

function uid() { return "l" + Date.now() + Math.random().toString(36).slice(2, 5); }
function lighten(hex, a) {
  try { const n = parseInt(hex.replace("#", ""), 16); return `rgb(${Math.min(255, (n >> 16) + a)},${Math.min(255, ((n >> 8) & 0xff) + a)},${Math.min(255, (n & 0xff) + a)})`; } catch { return hex; }
}

const BG_OPTIONS = [
  { id: "navratri_peach", label: "🌺 नवरात्रि (आड़ू)",  c1: "#ffe0c2", c2: "#ffcba4", accent: "#C62828" },
  { id: "diwali_gold",    label: "🪔 दिवाली (सोना)",     c1: "#FFD600", c2: "#FF8F00", accent: "#8B0000" },
  { id: "ganesh_orange",  label: "🐘 गणेश (नारंगी)",     c1: "#FFB74D", c2: "#FF6F00", accent: "#C62828" },
  { id: "dark_festive",   label: "⚫ डार्क फेस्टिव",      c1: "#2a0a1a", c2: "#4a0a2a", accent: "#FFD600" },
  { id: "blue_royal",     label: "🔵 रॉयल नीला",         c1: "#1a2f5c", c2: "#0a1628", accent: "#FFD600" },
];

const BTN3D = [
  { id: "red3d",   label: "🔴 लाल 3D",   bg: "#C62828", sh: "#7a0016", txt: "#fff",    br: "#ff6b6b" },
  { id: "gold3d",  label: "🥇 गोल्ड 3D", bg: "#FFD600", sh: "#8B6914", txt: "#141414", br: "#ffe066" },
  { id: "white3d", label: "⬜ सफ़ेद 3D",  bg: "#fff",    sh: "#bbb",    txt: "#C62828", br: "#eee"   },
  { id: "dark3d",  label: "⚫ काला 3D",  bg: "#141414", sh: "#000",    txt: "#FFD600", br: "#444"   },
  { id: "maroon3d",label: "🟤 मैरून 3D", bg: "#880e4f", sh: "#4a0027", txt: "#FFD600", br: "#f48fb1" },
];

const inp  = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-500 mt-1";
const selt = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none mt-1";

export default function LuckyDrawEditor({ apiBase, token, brandId, onSent }) {
  const cvRef = useRef(null);
  const dragR = useRef(null);
  const resizeR = useRef(null);
  const cropRef = useRef(null);

  const [bg, setBg] = useState("navratri_peach");
  const [festivalIcon, setFestivalIcon] = useState("🕉️");

  // Bikes (2 max, side by side)
  const [bikes, setBikes] = useState([
    { id: uid(), name: "SP 125", img: null, x: 20, y: 660, w: 460, h: 340 },
    { id: uid(), name: "Activa 125", img: null, x: 600, y: 660, w: 460, h: 340 },
  ]);
  const [cropSrc, setCropSrc] = useState(null);
  const [cropFor, setCropFor] = useState(null);
  const [cropBox, setCropBox] = useState({ x: .05, y: .05, w: .9, h: .9 });

  // Gift images row
  const [gifts, setGifts] = useState([
    { id: uid(), emoji: "🧳", label: "Suitcase" },
    { id: uid(), emoji: "🎁", label: "Gifts" },
    { id: uid(), emoji: "📱", label: "Phone" },
  ]);

  const [caption, setCaption] = useState("🪔 VP Honda के साथ इस त्यौहार में जीतें Mega Lucky Draw! अभी visit करें। #VPHonda #Bhopal");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [selId, setSelId] = useState(null);
  const [btnStyle, setBtnStyle] = useState("red3d");

  const [elems, setElems] = useState([
    { id: uid(), type: "festheader", x: W/2, y: 130, w: 500, h: 260, text: "श्री श्री\nशारदीय\nदुर्गोत्सव", btnStyle: "gold3d", fontSize: 50 },
    { id: uid(), type: "ribbon",     x: W*.15, y: 420, w: W*.7, h: 60, text: "Mega Lucky Draw", btnStyle: "red3d", fontSize: 34 },
    { id: uid(), type: "banner",     x: 60, y: 1030, w: 960, h: 60, text: "🪔 Assured Gifts worth ₹10000 🪔", btnStyle: "red3d", fontSize: 30 },
    { id: uid(), type: "winners",    x: 60, y: 1100, w: 960, h: 90, text: "10 Lucky Winners will get Mobile Phone,\nGold Coins, Silver Coins", btnStyle: "red3d", fontSize: 26 },
    { id: uid(), type: "offer",      x: 30, y: 1210, w: 330, h: 100, text: "Instant Cashback\n₹5000*", btnStyle: "red3d", fontSize: 24 },
    { id: uid(), type: "offer",      x: 375, y: 1210, w: 330, h: 100, text: "Low EMI\n₹1999*", btnStyle: "red3d", fontSize: 24 },
    { id: uid(), type: "offer",      x: 720, y: 1210, w: 330, h: 100, text: "Low Down Payment\n₹4999*", btnStyle: "red3d", fontSize: 24 },
  ]);

  const selEl = elems.find(e => e.id === selId);
  const selBike = bikes.find(b => b.id === selId);

  const render = useCallback(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    const bgObj = BG_OPTIONS.find(b => b.id === bg) || BG_OPTIONS[0];
    const isDark = bg.includes("dark") || bg.includes("blue_royal");

    const g = ctx.createRadialGradient(W/2, H*.15, 50, W/2, H*.4, W*.8);
    g.addColorStop(0, bgObj.c1); g.addColorStop(1, bgObj.c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H*.65);
    ctx.fillStyle = isDark ? bgObj.c2 : "#fff";
    ctx.fillRect(0, H*.62, W, H*.38);

    // Decorative top border (mandala pattern dots)
    for (let i = 0; i < 20; i++) {
      const x = 20 + i*(W-40)/19;
      ctx.strokeStyle = bgObj.accent; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x-10, 25); ctx.lineTo(x+10, 25); ctx.closePath(); ctx.stroke();
    }

    // Side dhol-player silhouettes (simple)
    [60, W-60].forEach(sx => {
      ctx.save(); ctx.globalAlpha = .5;
      ctx.fillStyle = bgObj.accent;
      ctx.beginPath(); ctx.ellipse(sx, 380, 25, 60, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.arc(sx, 300, 20, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    });

    // Bikes
    bikes.forEach(bk => {
      if (bk.img) {
        const im = new Image(); im.src = bk.img;
        if (im.complete) ctx.drawImage(im, bk.x, bk.y, bk.w, bk.h);
        else im.onload = () => render();
      } else {
        ctx.save(); ctx.globalAlpha = .1; ctx.fillStyle = bgObj.accent;
        ctx.fillRect(bk.x, bk.y, bk.w, bk.h); ctx.restore();
        ctx.textAlign = "center"; ctx.fillStyle = isDark?"#FFD600":"#999";
        ctx.font = "44px Arial"; ctx.fillText("🏍️", bk.x+bk.w/2, bk.y+bk.h*.45);
        ctx.font = "22px Arial"; ctx.fillText(bk.name, bk.x+bk.w/2, bk.y+bk.h*.55);
      }
      // Name label below
      ctx.textAlign = "center"; ctx.fillStyle = isDark?"#FFD600":"#111";
      ctx.font = `900 32px "Arial Black",Arial`;
      ctx.fillText(bk.name.toUpperCase(), bk.x+bk.w/2, bk.y+bk.h+30);
      if (bk.id === selId) {
        ctx.strokeStyle = "#FFD600"; ctx.lineWidth = 3; ctx.setLineDash([10,5]);
        ctx.strokeRect(bk.x, bk.y, bk.w, bk.h); ctx.setLineDash([]);
        ctx.fillStyle = "#FFD600"; ctx.fillRect(bk.x+bk.w-8, bk.y+bk.h-8, 16, 16);
      }
    });

    // Gift row (between header and bikes)
    const giftY = 520, giftSize = 90;
    const totalW = gifts.length * (giftSize+30);
    let gx = W/2 - totalW/2;
    gifts.forEach(gift => {
      ctx.font = `${giftSize}px Arial`; ctx.textAlign = "center";
      ctx.fillText(gift.emoji, gx+giftSize/2, giftY+giftSize*.75);
      gx += giftSize+30;
    });

    // Elements
    elems.forEach(el => {
      ctx.save();
      const bs = BTN3D.find(b => b.id === el.btnStyle);

      if (el.type === "festheader") {
        // Arch shape
        const ax=el.x, ay=el.y, aw=el.w, ah=el.h;
        ctx.fillStyle = bgObj.accent === "#FFD600" ? "#FFD600" : "#FFD600";
        ctx.beginPath();
        ctx.moveTo(ax-aw/2, ay+ah);
        ctx.lineTo(ax-aw/2, ay+ah*.3);
        ctx.quadraticCurveTo(ax-aw/2, ay, ax, ay);
        ctx.quadraticCurveTo(ax+aw/2, ay, ax+aw/2, ay+ah*.3);
        ctx.lineTo(ax+aw/2, ay+ah);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "#8B0000"; ctx.lineWidth = 6; ctx.stroke();
        // Text
        ctx.fillStyle = "#8B0000"; ctx.textAlign = "center";
        const lines = el.text.split("\n");
        lines.forEach((l,i) => {
          ctx.font = `900 ${el.fontSize}px "Noto Sans Devanagari",Arial`;
          ctx.fillText(l, ax, ay+ah*.35+i*el.fontSize*1.15);
        });
      } else if (bs) {
        draw3DRect(ctx, el.x, el.y, el.w, el.h, bs, el.text, el.fontSize);
      }

      if (el.id === selId) {
        ctx.strokeStyle = "#FFD600"; ctx.lineWidth = 3; ctx.setLineDash([10, 5]);
        if (el.type === "festheader") ctx.strokeRect(el.x-el.w/2-8, el.y-8, el.w+16, el.h+16);
        else ctx.strokeRect(el.x-3, el.y-3, el.w+6, el.h+6);
        ctx.setLineDash([]);
        const rx = el.type==="festheader" ? el.x+el.w/2+8 : el.x+el.w;
        const ry = el.type==="festheader" ? el.y+el.h+8 : el.y+el.h;
        ctx.fillStyle = "#FFD600"; ctx.fillRect(rx-8, ry-8, 16, 16);
      }
      ctx.restore();
    });

    // Logo
    const logo = new Image();
    logo.src = apiBase + `/logos/${brandId==="yakuza"?"yakuza":brandId==="minimetro"?"minimetro":"vp_honda"}.png`;
    if (logo.complete && logo.naturalWidth>0) ctx.drawImage(logo, W-110, 15, 90, 90);
    else logo.onload = () => render();

  }, [bg, bikes, gifts, elems, selId, brandId, apiBase]);

  function draw3DRect(ctx, x, y, w, h, bs, text, fs) {
    const r = Math.min(16, h * .3);
    ctx.fillStyle = bs.sh; ctx.beginPath(); ctx.roundRect(x+4, y+6, w, h, r); ctx.fill();
    const g = ctx.createLinearGradient(x, y, x, y+h);
    g.addColorStop(0, lighten(bs.bg, 28)); g.addColorStop(1, bs.bg);
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.roundRect(x+3, y+3, w-6, h*.42, [r,r,0,0]); ctx.fill();
    ctx.strokeStyle = bs.br; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke();
    const lines = text.split("\n");
    ctx.textAlign = "center"; ctx.fillStyle = bs.txt;
    lines.forEach((l, i) => {
      const fss = Math.min(fs, h*.42/lines.length);
      ctx.font = `700 ${fss}px "Arial Black",Arial`;
      ctx.fillText(l, x+w/2, y+h/2-(lines.length-1)*fss*.55+i*fss*1.1+fss*.35);
    });
  }

  useEffect(() => { render(); }, [render]);

  function getScale() { const r = cvRef.current?.getBoundingClientRect(); return r ? W/r.width : 1; }

  function onPtrDown(e) {
    const sc = getScale();
    const r = cvRef.current.getBoundingClientRect();
    const mx = (e.clientX-r.left)*sc, my = (e.clientY-r.top)*sc;

    if (selEl) {
      const rx = selEl.type==="festheader" ? selEl.x+selEl.w/2+8 : selEl.x+selEl.w;
      const ry = selEl.type==="festheader" ? selEl.y+selEl.h+8 : selEl.y+selEl.h;
      if (Math.abs(mx-rx)<20 && Math.abs(my-ry)<20) {
        resizeR.current = { id: selEl.id, type:"el", startX: mx, startY: my, origW: selEl.w, origH: selEl.h };
        e.preventDefault(); return;
      }
    }
    if (selBike) {
      const rx = selBike.x+selBike.w, ry = selBike.y+selBike.h;
      if (Math.abs(mx-rx)<20 && Math.abs(my-ry)<20) {
        resizeR.current = { id: selBike.id, type:"bike", startX: mx, startY: my, origW: selBike.w, origH: selBike.h };
        e.preventDefault(); return;
      }
    }

    for (const bk of bikes) {
      if (mx>=bk.x && mx<=bk.x+bk.w && my>=bk.y && my<=bk.y+bk.h) {
        setSelId(bk.id);
        dragR.current = { type: "bike", id: bk.id, startX: mx, startY: my, origX: bk.x, origY: bk.y };
        e.preventDefault(); return;
      }
    }

    for (let i = elems.length-1; i>=0; i--) {
      const el = elems[i];
      const inB = el.type==="festheader"
        ? mx>=el.x-el.w/2 && mx<=el.x+el.w/2 && my>=el.y && my<=el.y+el.h
        : mx>=el.x && mx<=el.x+el.w && my>=el.y && my<=el.y+el.h;
      if (inB) {
        setSelId(el.id);
        dragR.current = { type: "el", id: el.id, startX: mx, startY: my, origX: el.x, origY: el.y };
        e.preventDefault(); return;
      }
    }
    setSelId(null);
  }

  function onPtrMove(e) {
    const sc = getScale();
    const r = cvRef.current?.getBoundingClientRect(); if (!r) return;
    const mx = (e.clientX-r.left)*sc, my = (e.clientY-r.top)*sc;

    if (resizeR.current) {
      const { id, type, startX, startY, origW, origH } = resizeR.current;
      const dw = mx-startX, dh = my-startY;
      if (type==="bike") setBikes(prev => prev.map(b => b.id===id ? { ...b, w: Math.max(80,origW+dw), h: Math.max(60,origH+dh) } : b));
      else setElems(prev => prev.map(el => el.id===id ? { ...el, w: Math.max(60,origW+dw), h: Math.max(30,origH+dh) } : el));
      return;
    }
    if (!dragR.current) return;
    const { type, id, startX, startY, origX, origY } = dragR.current;
    const dx = mx-startX, dy = my-startY;
    if (type==="bike") setBikes(prev => prev.map(b => b.id===id ? { ...b, x: Math.max(0,origX+dx), y: Math.max(0,origY+dy) } : b));
    else setElems(prev => prev.map(el => el.id===id ? { ...el, x: Math.max(0,origX+dx), y: Math.max(0,origY+dy) } : el));
  }

  function onPtrUp() { dragR.current = null; resizeR.current = null; }

  function upd(id, ch) { setElems(prev => prev.map(e => e.id===id ? { ...e, ...ch } : e)); }
  function delEl(id) { setElems(prev => prev.filter(e => e.id!==id)); setSelId(null); }
  function addEl(type) {
    const id = uid();
    const base = { id, x:100, y:900, w:400, h:70, text:"नया text", btnStyle:btnStyle, fontSize:26, type };
    if (type==="ribbon") { base.text = "Special Offer"; }
    if (type==="winners") { base.h=90; base.text="Winners announcement"; }
    setElems(prev => [...prev, base]); setSelId(id);
  }

  function updBikeName(id, name) { setBikes(prev => prev.map(b => b.id===id ? { ...b, name } : b)); }
  function addBike() { if (bikes.length>=3) return; setBikes(prev => [...prev, { id: uid(), name: "नई Bike", img: null, x: 100, y: 700, w: 400, h: 300 }]); }
  function delBike(id) { setBikes(prev => prev.filter(b => b.id!==id)); }

  function onBikeFile(id, e) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { setCropSrc(r.result); setCropFor(id); setCropBox({x:.05,y:.05,w:.9,h:.9}); }; r.readAsDataURL(f); e.target.value = "";
  }
  function confirmCrop() {
    const t = new Image(); t.onload = () => {
      const iw=t.naturalWidth, ih=t.naturalHeight;
      const cx=Math.round(cropBox.x*iw), cy=Math.round(cropBox.y*ih), cw=Math.max(1,Math.round(cropBox.w*iw)), ch=Math.max(1,Math.round(cropBox.h*ih));
      const c=document.createElement("canvas"); c.width=cw; c.height=ch;
      c.getContext("2d").drawImage(t,cx,cy,cw,ch,0,0,cw,ch);
      const data = c.toDataURL("image/png");
      setBikes(prev => prev.map(b => b.id===cropFor ? { ...b, img: data } : b));
      setCropSrc(null); setCropFor(null);
    }; t.src = cropSrc;
  }

  const GIFT_EMOJIS = ["🧳","🎁","📱","💍","⌚","🏆","💰","🚗","🛵","📺","🎧","👜"];
  function updGiftEmoji(id, emoji) { setGifts(prev => prev.map(g => g.id===id ? { ...g, emoji } : g)); }
  function addGift() { if (gifts.length>=5) return; setGifts(prev => [...prev, { id: uid(), emoji: "🎁", label: "Gift" }]); }
  function delGift(id) { setGifts(prev => prev.filter(g => g.id!==id)); }

  function dlPNG() { vib(30); cvRef.current.toBlob(b => { const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download="lucky-draw.jpg"; a.click(); URL.revokeObjectURL(u); }, "image/jpeg", .9); }

  async function submit() {
    vib(60); setBusy(true); setNote("भेज रहे हैं…");
    try {
      const b64 = cvRef.current.toDataURL("image/jpeg", .88);
      const res = await fetch(apiBase+"/api/mega-offer/submit", { method:"POST", headers:{"Content-Type":"application/json",Authorization:"Bearer "+token}, body:JSON.stringify({brand:brandId,text:caption,imageData:b64,type:"vigyapan"}) });
      if (!res.ok) throw new Error((await res.json()).error||"Error");
      setNote("✅ Review में भेज दिया!"); vib([30,30,60]);
      setTimeout(()=>{setNote("");if(onSent)onSent();},3000);
    } catch(e){ setNote("❌ "+e.message); }
    setBusy(false);
  }

  return (
    <div className="space-y-3 pb-10">

      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 w-full max-w-sm space-y-3">
            <p className="text-sm font-bold text-white text-center">📐 Bike Crop</p>
            <div className="relative rounded-xl overflow-hidden border border-neutral-700" style={{ aspectRatio: "4/3" }}>
              <img ref={cropRef} src={cropSrc} style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              <div style={{ position: "absolute", left: `${cropBox.x*100}%`, top: `${cropBox.y*100}%`, width: `${cropBox.w*100}%`, height: `${cropBox.h*100}%`, border: "2px solid #FFD600", boxShadow: "0 0 0 2000px rgba(0,0,0,.6)", pointerEvents: "none" }} />
            </div>
            {[["Left","x"],["Top","y"],["W","w"],["H","h"]].map(([l,k]) => (
              <label key={k} className="text-xs text-neutral-300 block">{l}: {Math.round(cropBox[k]*100)}%
                <input type="range" min=".02" max=".98" step=".01" value={cropBox[k]} className="w-full accent-yellow-400" onChange={e => setCropBox(b => ({ ...b, [k]: parseFloat(e.target.value) }))} />
              </label>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={() => { setCropSrc(null); setCropFor(null); }} className="flex-1 py-2.5 rounded-xl border border-neutral-600 text-sm text-neutral-300">रद्द</button>
              <button type="button" onClick={() => { vib(30); confirmCrop(); }} className="flex-1 py-2.5 rounded-xl font-bold text-black text-sm" style={{ background: "#FFD600" }}>✅ Crop</button>
            </div>
          </div>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-neutral-950 pb-2 pt-1">
        <div className="rounded-2xl overflow-hidden border border-neutral-700 bg-black">
          <canvas ref={cvRef} width={W} height={H} className="w-full touch-none cursor-pointer"
            onPointerDown={onPtrDown} onPointerMove={onPtrMove} onPointerUp={onPtrUp} onPointerLeave={onPtrUp} />
        </div>
        <p className="text-[10px] text-neutral-500 text-center mt-1">👆 Touch करके drag करें • 🟡 corner से resize करें</p>
        <div className="grid grid-cols-2 gap-1.5 mt-1.5">
          <button type="button" onClick={dlPNG} className="py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-300">⬇ PNG</button>
          <button type="button" onClick={submit} disabled={busy} className="py-2.5 rounded-xl text-xs font-bold text-black disabled:opacity-50" style={{ background: "#FFD600" }}>
            {busy ? "भेज रहे हैं…" : "📤 Review में भेजें"}
          </button>
        </div>
        {note && <div className={`mt-1 rounded-xl px-3 py-2 text-xs font-semibold ${note.startsWith("✅")?"bg-emerald-900/60 text-emerald-300":"bg-red-900/60 text-red-300"}`}>{note}</div>}
      </div>

      {selEl && (
        <div className="bg-neutral-900 rounded-2xl border-2 border-yellow-500 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-yellow-400">✏️ {selEl.type}</p>
            <button type="button" onClick={() => delEl(selEl.id)} className="text-red-400 text-xs px-2 py-1 rounded-lg border border-red-800">🗑 Delete</button>
          </div>
          <textarea value={selEl.text} onChange={e => upd(selEl.id, { text: e.target.value })} rows={2}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <div><p className="text-[10px] text-neutral-500">Font Size</p>
              <input type="number" value={selEl.fontSize} min={14} max={100} onChange={e => upd(selEl.id, { fontSize: +e.target.value||26 })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-white" /></div>
            <div><p className="text-[10px] text-neutral-500">Style</p>
              <select value={selEl.btnStyle} onChange={e => upd(selEl.id, { btnStyle: e.target.value })} className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-white">
                {BTN3D.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[["X","x"],["Y","y"],["W","w"],["H","h"]].map(([l,k]) => (
              <div key={k}><p className="text-[10px] text-neutral-500">{l}</p>
                <input type="number" value={Math.round(selEl[k])} onChange={e => upd(selEl.id, { [k]: +e.target.value||0 })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-1.5 py-1.5 text-xs text-white" /></div>
            ))}
          </div>
        </div>
      )}

      {selBike && (
        <div className="bg-neutral-900 rounded-2xl border-2 border-yellow-500 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-yellow-400">🏍️ Bike</p>
            {bikes.length>1 && <button type="button" onClick={() => delBike(selBike.id)} className="text-red-400 text-xs px-2 py-1 rounded-lg border border-red-800">🗑</button>}
          </div>
          <input value={selBike.name} onChange={e => updBikeName(selBike.id, e.target.value)} className={inp} placeholder="Bike name" />
          {selBike.img
            ? <div className="relative"><img src={selBike.img} alt="" className="w-full h-24 object-contain rounded-xl border border-neutral-700 bg-neutral-800" />
                <button type="button" onClick={() => setBikes(prev => prev.map(b => b.id===selBike.id ? { ...b, img: null } : b))} className="absolute top-1 right-1 bg-red-700 text-white text-xs px-2 py-0.5 rounded-full">✕</button></div>
            : <label className="block border-2 border-dashed border-neutral-600 rounded-xl p-3 text-center cursor-pointer">
                <span className="text-xs text-neutral-400">📸 Photo Upload करें</span>
                <input type="file" accept="image/*" className="hidden" onChange={e => onBikeFile(selBike.id, e)} /></label>}
        </div>
      )}

      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🏍️ Bikes ({bikes.length}) <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4">{bikes.length<3 && <button type="button" onClick={addBike} className="w-full py-2.5 rounded-xl border border-dashed border-neutral-600 text-xs text-neutral-400">➕ Bike जोड़ें (max 3)</button>}</div>
      </details>

      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🎁 Gift Items ({gifts.length}) <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4 space-y-2">
          {gifts.map(g => (
            <div key={g.id} className="flex gap-2 items-center">
              <select value={g.emoji} onChange={e => updGiftEmoji(g.id, e.target.value)} className="bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-2 text-xl w-16">
                {GIFT_EMOJIS.map(em => <option key={em} value={em}>{em}</option>)}
              </select>
              <span className="flex-1 text-xs text-neutral-400">{g.label}</span>
              {gifts.length>1 && <button type="button" onClick={() => delGift(g.id)} className="text-red-500 text-xs px-2">✕</button>}
            </div>
          ))}
          {gifts.length<5 && <button type="button" onClick={addGift} className="w-full py-2 rounded-xl border border-dashed border-neutral-600 text-xs text-neutral-400">➕ Gift जोड़ें</button>}
        </div>
      </details>

      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">➕ Element जोड़ें <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4 space-y-2">
          <select value={btnStyle} onChange={e => setBtnStyle(e.target.value)} className={selt}>{BTN3D.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[["offer","📦 Offer Box"],["ribbon","🎀 Ribbon Text"],["banner","📢 Banner"],["winners","🏆 Winners Text"]].map(([t,l]) => (
              <button key={t} type="button" onClick={() => { vib(20); addEl(t); }}
                className="py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-300 hover:border-yellow-400 hover:text-yellow-400">{l}</button>
            ))}
          </div>
        </div>
      </details>

      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🎨 Background <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4"><select value={bg} onChange={e => setBg(e.target.value)} className={selt}>{BG_OPTIONS.map(b => <option key={b.id} value={b.id}>{b.label}</option>)}</select></div>
      </details>

      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">✍️ Caption <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4"><textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} className={inp+" resize-none"} /></div>
      </details>

      <button type="button" onClick={submit} disabled={busy} className="w-full rounded-2xl py-4 font-bold text-black text-base disabled:opacity-50" style={{ background: "#FFD600" }}>
        {busy ? "भेज रहे हैं…" : "📤 Review में भेजें"}
      </button>
    </div>
  );
}
