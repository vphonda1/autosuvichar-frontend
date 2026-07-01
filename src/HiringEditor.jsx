const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useRef, useEffect, useCallback } from "react";

const W = 1080, H = 1350;

function uid() { return "h" + Date.now() + Math.random().toString(36).slice(2, 5); }
function lighten(hex, a) {
  try { const n = parseInt(hex.replace("#", ""), 16); return `rgb(${Math.min(255, (n >> 16) + a)},${Math.min(255, ((n >> 8) & 0xff) + a)},${Math.min(255, (n & 0xff) + a)})`; } catch { return hex; }
}

const BG_OPTIONS = [
  { id:"white",     label:"⬜ सफ़ेद (Clean)",      bg:"#f5f5f5", accent:"#C62828" },
  { id:"dark_navy", label:"🔵 नेवी (Professional)", bg:"#0a1628", accent:"#C62828" },
  { id:"red_dark",  label:"🔴 लाल-काला",            bg:"#1a0a00", accent:"#E4002B" },
  { id:"gold",      label:"🥇 गोल्ड-काला",          bg:"#1a1200", accent:"#FFD600" },
  { id:"green",     label:"🟢 हरा-सफ़ेद",            bg:"#e8f5e9", accent:"#1B5E20" },
];

const BTN3D = [
  { id:"red3d",   label:"🔴 लाल 3D",   bg:"#C62828", sh:"#7a0016", txt:"#fff",    br:"#ff6b6b" },
  { id:"gold3d",  label:"🥇 गोल्ड 3D", bg:"#FFD600", sh:"#8B6914", txt:"#141414", br:"#ffe066" },
  { id:"white3d", label:"⬜ सफ़ेद 3D",  bg:"#fff",    sh:"#bbb",    txt:"#C62828", br:"#eee"   },
  { id:"navy3d",  label:"🔵 नेवी 3D",  bg:"#0a1628", sh:"#000",    txt:"#fff",    br:"#1565c0" },
  { id:"green3d", label:"🟢 हरा 3D",   bg:"#1B5E20", sh:"#0a2a0a", txt:"#FFD600", br:"#4caf50" },
  { id:"black3d", label:"⚫ काला 3D",  bg:"#141414", sh:"#000",    txt:"#FFD600", br:"#444"   },
];

const inp  = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-500 mt-1";
const selt = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none mt-1";

export default function HiringEditor({ apiBase, token, brandId, onSent }) {
  const cvRef = useRef(null);
  const dragR = useRef(null);
  const resizeR = useRef(null);

  const [bg, setBg] = useState("white");
  const [companyName, setCompanyName] = useState("VP Honda");
  const [phone, setPhone]   = useState("9713394738");
  const [address, setAddress] = useState("परवलिया सड़क, भोपाल - 462030");

  const [qrImg, setQrImg]     = useState(null);
  const [qrPos, setQrPos]     = useState({ x: W*.21, y: 480, w: W*.58, h: W*.58 });

  const [caption, setCaption] = useState("🔥 We Are Hiring! VP Honda में कई पदों पर भर्ती। Walk-in Interview के लिए अभी संपर्क करें। #Hiring #VPHonda #Bhopal");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [selId, setSelId] = useState(null);
  const [btnStyle, setBtnStyle] = useState("red3d");

  const [elems, setElems] = useState([
    { id: uid(), type: "headline", x: 35, y: 60,  w: 500, h: 130, text: "WE ARE\nHIRING!", btnStyle: "none", fontSize: 70 },
    { id: uid(), type: "tagline",  x: 30, y: 220, w: 480, h: 50,  text: "JOIN OUR GROWING TEAM", btnStyle: "navy3d", fontSize: 26 },
    { id: uid(), type: "perk",     x: 30, y: 290, w: 480, h: 70,  text: "👥 GREAT CAREER\nOPPORTUNITIES", btnStyle: "none", fontSize: 24 },
    { id: uid(), type: "perk",     x: 30, y: 370, w: 480, h: 70,  text: "🛡️ PROFESSIONAL GROWTH\nAND DEVELOPMENT", btnStyle: "none", fontSize: 24 },
    { id: uid(), type: "salary",   x: 30, y: 460, w: 480, h: 145, text: "₹1,20,000 TO ₹4,00,000", btnStyle: "gold3d", fontSize: 30 },
    { id: uid(), type: "table_header", x: 540, y: 60, w: 510, h: 56, text: "REQUIREMENT", btnStyle: "red3d", fontSize: 32 },
    { id: uid(), type: "row", x: 540, y: 122, w: 510, h: 44, text: "Sales Executive | 10 (M/F)", btnStyle: "white3d", fontSize: 22 },
    { id: uid(), type: "row", x: 540, y: 168, w: 510, h: 44, text: "Service Advisor | 5 (M/F)",  btnStyle: "white3d", fontSize: 22 },
    { id: uid(), type: "row", x: 540, y: 214, w: 510, h: 44, text: "Mechanic | 10 (M)",           btnStyle: "white3d", fontSize: 22 },
    { id: uid(), type: "row", x: 540, y: 260, w: 510, h: 44, text: "CRM | 2 (F)",                 btnStyle: "white3d", fontSize: 22 },
    { id: uid(), type: "note",     x: 30, y: 1010, w: 1020, h: 50, text: "Education Minimum Graduate required. Bhopal resident only.", btnStyle: "none", fontSize: 20 },
    { id: uid(), type: "location", x: 30, y: 1080, w: 700, h: 60, text: "📍 Location: Berasia Road, Nehru Nagar, Kolar Road", btnStyle: "none", fontSize: 24 },
    { id: uid(), type: "walkin",   x: 740, y: 1075, w: 310, h: 70, text: "WALK-IN\nINTERVIEW", btnStyle: "red3d", fontSize: 26 },
  ]);

  const selEl = elems.find(e => e.id === selId);

  const render = useCallback(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    const bgObj = BG_OPTIONS.find(b => b.id === bg) || BG_OPTIONS[0];
    const isDark = bg !== "white" && bg !== "green";

    ctx.fillStyle = bgObj.bg;
    ctx.fillRect(0, 0, W, H);

    if (qrImg) {
      const im = new Image(); im.src = qrImg;
      if (im.complete) ctx.drawImage(im, qrPos.x, qrPos.y, qrPos.w, qrPos.h);
      else im.onload = () => render();
    } else {
      ctx.save(); ctx.globalAlpha = .08; ctx.fillStyle = bgObj.accent;
      ctx.fillRect(qrPos.x, qrPos.y, qrPos.w, qrPos.h); ctx.restore();
      ctx.fillStyle = isDark?"#888":"#999"; ctx.font = "44px Arial"; ctx.textAlign = "center";
      ctx.fillText("📱 QR Code (optional)", qrPos.x+qrPos.w/2, qrPos.y+qrPos.h/2-10);
      ctx.font="22px Arial"; ctx.fillText("Upload करें या hide करें", qrPos.x+qrPos.w/2, qrPos.y+qrPos.h/2+24);
    }
    if (selId === "__qr__") {
      ctx.strokeStyle="#FFD600"; ctx.lineWidth=3; ctx.setLineDash([10,5]);
      ctx.strokeRect(qrPos.x, qrPos.y, qrPos.w, qrPos.h); ctx.setLineDash([]);
      ctx.fillStyle="#FFD600"; ctx.fillRect(qrPos.x+qrPos.w-8, qrPos.y+qrPos.h-8, 16, 16);
    }

    elems.forEach(el => {
      ctx.save();
      const bs = BTN3D.find(b => b.id === el.btnStyle);

      if (el.type === "headline") {
        ctx.textAlign = "left"; ctx.fillStyle = isDark?"#fff":"#111";
        const lines = el.text.split("\n");
        ctx.font = `700 ${el.fontSize*.5}px Arial`;
        ctx.fillText(lines[0]||"", el.x, el.y+el.fontSize*.55);
        ctx.font = `900 ${el.fontSize}px "Arial Black",Arial`;
        ctx.fillStyle = bgObj.accent;
        ctx.fillText(lines[1]||"", el.x, el.y+el.h*.92);
        ctx.fillRect(el.x, el.y+el.h*.97, el.w*.5, 7);
      } else if (bs && el.btnStyle !== "none") {
        draw3DRect(ctx, el.x, el.y, el.w, el.h, bs, el.text, el.fontSize);
      } else {
        ctx.textAlign = "left"; ctx.fillStyle = isDark?"#eee":"#222";
        const lines = el.text.split("\n");
        lines.forEach((l, i) => {
          ctx.font = `600 ${el.fontSize}px "Noto Sans Devanagari",Arial`;
          const words = l.split(" "); let ln="", wls=[];
          words.forEach(w => { const t=(ln+" "+w).trim(); if(ctx.measureText(t).width>el.w-10 && ln){wls.push(ln);ln=w;} else ln=t; });
          if(ln) wls.push(ln);
          wls.forEach((wl,wi) => ctx.fillText(wl, el.x, el.y+el.fontSize*1.1+(i+wi)*(el.fontSize*1.15)));
        });
      }

      if (el.id === selId) {
        ctx.strokeStyle = "#FFD600"; ctx.lineWidth = 3; ctx.setLineDash([10, 5]);
        ctx.strokeRect(el.x-3, el.y-3, el.w+6, el.h+6); ctx.setLineDash([]);
        ctx.fillStyle = "#FFD600"; ctx.fillRect(el.x+el.w-8, el.y+el.h-8, 16, 16);
      }
      ctx.restore();
    });

    const fY = H - 110;
    ctx.fillStyle = isDark ? "#000" : bgObj.accent;
    ctx.fillRect(0, fY, W, 110);
    ctx.fillStyle = "#fff"; ctx.textAlign = "left";
    ctx.font = `900 ${W * .05}px "Arial Black",Arial`;
    ctx.fillText(companyName, 25, fY + 50);
    ctx.font = `${W * .022}px Arial`; ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillText(address, 25, fY + 80);
    ctx.fillStyle = "#FFD600"; ctx.font = "30px Arial"; ctx.textAlign = "right";
    ctx.fillText("📞", W * .65, fY + 56);
    ctx.fillStyle = "#fff"; ctx.font = `900 ${W * .05}px "Arial Black",Arial`;
    ctx.fillText(phone, W - 20, fY + 58);

    const logo = new Image();
    logo.src = apiBase + `/logos/${brandId==="yakuza"?"yakuza":brandId==="minimetro"?"minimetro":"vp_honda"}.png`;
    if (logo.complete && logo.naturalWidth>0) ctx.drawImage(logo, W-110, 15, 90, 90);
    else logo.onload = () => render();

  }, [bg, qrImg, qrPos, elems, selId, companyName, phone, address, brandId, apiBase]);

  function draw3DRect(ctx, x, y, w, h, bs, text, fs) {
    const r = Math.min(14, h * .25);
    ctx.fillStyle = bs.sh; ctx.beginPath(); ctx.roundRect(x+4, y+6, w, h, r); ctx.fill();
    const g = ctx.createLinearGradient(x, y, x, y+h);
    g.addColorStop(0, lighten(bs.bg, 28)); g.addColorStop(1, bs.bg);
    ctx.fillStyle = g; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,.18)"; ctx.beginPath(); ctx.roundRect(x+3, y+3, w-6, h*.42, [r,r,0,0]); ctx.fill();
    ctx.strokeStyle = bs.br; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke();
    const lines = text.split("\n");
    ctx.textAlign = "center"; ctx.fillStyle = bs.txt;
    lines.forEach((l, i) => {
      const fss = Math.min(fs, h*.5/lines.length);
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
      const rx = selEl.x+selEl.w, ry = selEl.y+selEl.h;
      if (Math.abs(mx-rx)<20 && Math.abs(my-ry)<20) {
        resizeR.current = { id: selEl.id, startX: mx, startY: my, origW: selEl.w, origH: selEl.h };
        e.preventDefault(); return;
      }
    }
    if (selId === "__qr__") {
      const rx = qrPos.x+qrPos.w, ry = qrPos.y+qrPos.h;
      if (Math.abs(mx-rx)<20 && Math.abs(my-ry)<20) {
        resizeR.current = { id: "__qr__", startX: mx, startY: my, origW: qrPos.w, origH: qrPos.h };
        e.preventDefault(); return;
      }
    }

    if (mx>=qrPos.x && mx<=qrPos.x+qrPos.w && my>=qrPos.y && my<=qrPos.y+qrPos.h) {
      setSelId("__qr__");
      dragR.current = { type: "qr", startX: mx, startY: my, origX: qrPos.x, origY: qrPos.y };
      e.preventDefault(); return;
    }

    for (let i = elems.length-1; i>=0; i--) {
      const el = elems[i];
      if (mx>=el.x && mx<=el.x+el.w && my>=el.y && my<=el.y+el.h) {
        setSelId(el.id);
        dragR.current = { id: el.id, startX: mx, startY: my, origX: el.x, origY: el.y };
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
      const { id, startX, startY, origW, origH } = resizeR.current;
      const dw = mx-startX, dh = my-startY;
      if (id === "__qr__") setQrPos(p => ({ ...p, w: Math.max(60, origW+dw), h: Math.max(60, origH+dh) }));
      else setElems(prev => prev.map(el => el.id===id ? { ...el, w: Math.max(60, origW+dw), h: Math.max(30, origH+dh) } : el));
      return;
    }
    if (!dragR.current) return;
    const { type, startX, startY, origX, origY } = dragR.current;
    const dx = mx-startX, dy = my-startY;
    if (type === "qr") setQrPos(p => ({ ...p, x: Math.max(0, origX+dx), y: Math.max(0, origY+dy) }));
    else setElems(prev => prev.map(el => el.id===dragR.current.id ? { ...el, x: Math.max(0, origX+dx), y: Math.max(0, origY+dy) } : el));
  }

  function onPtrUp() { dragR.current = null; resizeR.current = null; }

  function upd(id, ch) { setElems(prev => prev.map(e => e.id===id ? { ...e, ...ch } : e)); }
  function delEl(id) { setElems(prev => prev.filter(e => e.id!==id)); setSelId(null); }
  function addEl(type) {
    const id = uid();
    const base = { id, x:100, y:300, w:420, h:60, text:"नया text", btnStyle:btnStyle, fontSize:26, type };
    if (type==="row") { base.text="Position | 1 (M/F)"; base.h=44; }
    if (type==="salary") { base.h=145; base.text="₹0 TO ₹0"; }
    if (type==="walkin") { base.w=300; base.h=70; base.text="WALK-IN\nINTERVIEW"; }
    setElems(prev => [...prev, base]); setSelId(id);
  }

  function onQrFile(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => setQrImg(r.result); r.readAsDataURL(f); e.target.value = "";
  }

  function dlPNG() { vib(30); cvRef.current.toBlob(b => { const u=URL.createObjectURL(b); const a=document.createElement("a"); a.href=u; a.download="hiring.jpg"; a.click(); URL.revokeObjectURL(u); }, "image/jpeg", .9); }

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

      <div className="sticky top-0 z-30 bg-neutral-950 pb-2 pt-1">
        <div className="rounded-2xl overflow-hidden border border-neutral-700 bg-black">
          <canvas ref={cvRef} width={W} height={H} className="w-full touch-none cursor-pointer"
            onPointerDown={onPtrDown} onPointerMove={onPtrMove} onPointerUp={onPtrUp} onPointerLeave={onPtrUp} />
        </div>
        <p className="text-[10px] text-neutral-500 text-center mt-1">👆 Touch करके drag करें • 🟡 corner से resize करें</p>
        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
          <button type="button" onClick={dlPNG} className="py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-300">⬇ PNG</button>
          <label className="py-2.5 rounded-xl border border-neutral-700 text-xs text-center text-neutral-300 cursor-pointer">
            📱 QR <input type="file" accept="image/*" className="hidden" onChange={onQrFile} />
          </label>
          <button type="button" onClick={submit} disabled={busy} className="py-2.5 rounded-xl text-xs font-bold text-black disabled:opacity-50" style={{ background: "#FFD600" }}>
            {busy ? "भेज रहे हैं…" : "📤 Review"}
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
                <option value="none">— plain text —</option>
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

      {selId === "__qr__" && (
        <div className="bg-neutral-900 rounded-2xl border-2 border-yellow-500 p-3 space-y-2">
          <p className="text-xs font-bold text-yellow-400">📱 QR Code Image</p>
          <div className="grid grid-cols-2 gap-2">
            {[["X","x"],["Y","y"],["W","w"],["H","h"]].map(([l,k]) => (
              <div key={k}><p className="text-[10px] text-neutral-500">{l}</p>
                <input type="number" value={Math.round(qrPos[k])} onChange={e => setQrPos(p => ({ ...p, [k]: +e.target.value||0 }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-xs text-white" /></div>
            ))}
          </div>
          {qrImg && <button type="button" onClick={() => { setQrImg(null); setSelId(null); }} className="w-full py-2 rounded-xl border border-red-800 text-red-400 text-xs">🗑 Remove QR</button>}
        </div>
      )}

      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">➕ Element जोड़ें <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4 space-y-2">
          <select value={btnStyle} onChange={e => setBtnStyle(e.target.value)} className={selt}>{BTN3D.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {[["row","📋 Table Row"],["tagline","🏷️ Tagline"],["salary","💰 Salary Box"],["perk","⭐ Perk"],["note","📝 Note"],["location","📍 Location"],["walkin","🚪 Walk-in Badge"]].map(([t,l]) => (
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
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🏢 Company Info <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4 space-y-2">
          <input value={companyName} onChange={e => setCompanyName(e.target.value)} className={inp} placeholder="VP Honda" />
          <input value={phone} onChange={e => setPhone(e.target.value)} className={inp} placeholder="फ़ोन" />
          <input value={address} onChange={e => setAddress(e.target.value)} className={inp} placeholder="पता" />
        </div>
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
