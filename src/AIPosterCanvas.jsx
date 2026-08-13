import React, { useState, useRef, useEffect, useCallback } from "react";
import { getBrand, useBrandLogo, useOwnerLogo, drawBothLogos } from "./brands.js";
const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

const W = 1080, H = 1080;

function uid() { return "p" + Date.now() + Math.random().toString(36).slice(2, 5); }
function lighten(hex, a) {
  try { const n = parseInt(hex.replace("#", ""), 16); return `rgb(${Math.min(255, (n >> 16) + a)},${Math.min(255, ((n >> 8) & 0xff) + a)},${Math.min(255, (n & 0xff) + a)})`; } catch { return hex; }
}

const BG_MAP = {
  yellow_red:  { c1: "#FFD600", c2: "#E4002B" },
  red_dark:    { c1: "#E4002B", c2: "#141414" },
  blue_dark:   { c1: "#1565c0", c2: "#0a1628" },
  orange_red:  { c1: "#FF6F00", c2: "#B71C1C" },
  gold_dark:   { c1: "#8B6914", c2: "#1a0f00" },
  green_dark:  { c1: "#1B5E20", c2: "#0a2a0a" },
  purple_dark: { c1: "#4A148C", c2: "#1a0033" },
  white_clean: { c1: "#f8f8f8", c2: "#e0e0e0" },
};

const BTN3D = [
  { id: "red3d",   label: "🔴 लाल",   bg: "#E4002B", sh: "#7a0016", txt: "#fff",    br: "#ff6b6b" },
  { id: "gold3d",  label: "🥇 गोल्ड", bg: "#FFD600", sh: "#8B6914", txt: "#141414", br: "#ffe066" },
  { id: "white3d", label: "⬜ सफ़ेद",  bg: "#fff",    sh: "#bbb",    txt: "#E4002B", br: "#eee"   },
  { id: "blue3d",  label: "🔵 नीला",  bg: "#1565c0", sh: "#0a2a5a", txt: "#fff",    br: "#4fc3f7" },
  { id: "green3d", label: "🟢 हरा",   bg: "#1B5E20", sh: "#0a2a0a", txt: "#FFD600", br: "#4caf50" },
  { id: "dark3d",  label: "⚫ काला",  bg: "#141414", sh: "#000",    txt: "#FFD600", br: "#444"   },
];

const ADDR = { bg1: "#E4002B", bg2: "#141414" };

export default function AIPosterCanvas({ apiBase, token, brandId, spec, dealerName, dealerSub, phone, onSent, onBack }) {
  // ⚠️ crossOrigin-safe logo — वरना canvas tainted होकर Download/Submit fail
  const [logoRef, logoTick] = useBrandLogo(apiBase, brandId);
  // बाएँ मालिक का logo, दाएँ brand/कंपनी का logo — तीनों brands पर
  const [ownerRef, ownerTick] = useOwnerLogo(apiBase);
  const cvRef = useRef(null);
  const dragR = useRef(null);
  const resizeR = useRef(null);

  const [bg, setBg] = useState(spec?.bgStyle || "yellow_red");
  const [headline, setHeadline] = useState(spec?.headline || "ऑफर");
  const [hlSize, setHlSize] = useState(110);
  const [caption, setCaption] = useState(spec?.caption || "");
  const [bikeImg, setBikeImg] = useState(null);
  const [bikePos, setBikePos] = useState({ x: 0, y: H * 0.3, w: W * 0.52, h: H * 0.52 });
  const [cropSrc, setCropSrc] = useState(null);
  const [cropBox, setCropBox] = useState({ x: .05, y: .05, w: .9, h: .9 });
  const cropRef = useRef(null);

  const [selId, setSelId] = useState(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // Build elements from AI spec
  const [elems, setElems] = useState(() => {
    const out = [];
    if (spec?.subHeadline) out.push({ id: uid(), type: "subhl", x: 60, y: 300, w: 960, h: 68, text: spec.subHeadline, btnStyle: "red3d", fontSize: 32 });
    if (spec?.bigOffer) out.push({ id: uid(), type: "bigoffer", x: 555, y: 390, w: 490, h: 150, text: spec.bigOffer, btnStyle: "white3d", fontSize: 44 });
    (spec?.offerBoxes || []).forEach((ob, i) => {
      out.push({ id: uid(), type: "offer", x: 555, y: 555 + i * 92, w: 490, h: 80, text: `${ob.icon || "•"} ${ob.text}`, btnStyle: "red3d", fontSize: 28 });
    });
    if (spec?.roiText) out.push({ id: uid(), type: "circle", x: 60, y: 620, w: 175, h: 175, text: `${spec.roiText}\n${spec.roiSub || ""}`.trim(), btnStyle: "red3d", fontSize: 26 });
    if (spec?.bottomBanner) out.push({ id: uid(), type: "banner", x: 0, y: 830, w: 620, h: 70, text: spec.bottomBanner, btnStyle: "gold3d", fontSize: 24 });
    if (spec?.locationCTA) out.push({ id: uid(), type: "banner", x: 625, y: 830, w: 455, h: 70, text: spec.locationCTA, btnStyle: "red3d", fontSize: 24 });
    return out;
  });

  const selEl = elems.find(e => e.id === selId);

  const render = useCallback(() => {
    const cv = cvRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    const bgo = BG_MAP[bg] || BG_MAP.yellow_red;

    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, bgo.c1); g.addColorStop(1, bgo.c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    const cc = ["#fff", "#FFD600", "#E4002B", "#1565c0", "#16a34a"];
    for (let i = 0; i < 30; i++) {
      ctx.save(); ctx.globalAlpha = .22 + (i % 4) * .07; ctx.fillStyle = cc[i % 5];
      const ex = (i * 137 + 20) % W, ey = (i * 89 + 10) % (H * .62);
      ctx.translate(ex, ey); ctx.rotate(i * .7); ctx.fillRect(-5, -5, 9 + i % 8, 9 + i % 8); ctx.restore();
    }

    if (bikeImg) {
      const im = new Image(); im.src = bikeImg;
      if (im.complete) ctx.drawImage(im, bikePos.x, bikePos.y, bikePos.w, bikePos.h);
      else im.onload = () => render();
      if (selId === "__bike__") {
        ctx.strokeStyle = "#FFD600"; ctx.lineWidth = 3; ctx.setLineDash([10, 5]);
        ctx.strokeRect(bikePos.x, bikePos.y, bikePos.w, bikePos.h); ctx.setLineDash([]);
        ctx.fillStyle = "#FFD600"; ctx.fillRect(bikePos.x + bikePos.w - 8, bikePos.y + bikePos.h - 8, 16, 16);
      }
    } else {
      ctx.save(); ctx.globalAlpha = .12; ctx.fillStyle = "#fff";
      ctx.beginPath(); ctx.roundRect(20, H * .30, W * .5, H * .52, 16); ctx.fill(); ctx.restore();
      ctx.fillStyle = "#fff"; ctx.globalAlpha = .45; ctx.textAlign = "center";
      ctx.font = "46px Arial"; ctx.fillText("🏍️ Bike Photo", W * .25, H * .58);
      ctx.font = "26px Arial"; ctx.fillText("नीचे upload करें", W * .25, H * .63);
      ctx.globalAlpha = 1;
    }

    // Headline
    const hlLines = headline.split("\n").filter(Boolean);
    ctx.textAlign = "center";
    hlLines.forEach((line, i) => {
      const y = 85 + i * (hlSize + 12) + hlSize;
      ctx.font = `900 ${hlSize}px "Arial Black", Arial`;
      ctx.strokeStyle = "#E4002B"; ctx.lineWidth = 10; ctx.strokeText(line, W / 2, y);
      ctx.fillStyle = "#fff"; ctx.fillText(line, W / 2, y);
    });

    elems.forEach(el => {
      ctx.save();
      const bs = BTN3D.find(b => b.id === el.btnStyle) || BTN3D[0];
      if (el.type === "circle") {
        const cx = el.x + el.w / 2, cy = el.y + el.h / 2, r = el.w / 2;
        ctx.beginPath(); ctx.arc(cx + 5, cy + 7, r, 0, Math.PI * 2); ctx.fillStyle = bs.sh; ctx.fill();
        const cg = ctx.createRadialGradient(cx - r * .3, cy - r * .3, r * .1, cx, cy, r);
        cg.addColorStop(0, lighten(bs.bg, 32)); cg.addColorStop(1, bs.bg);
        ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fillStyle = cg; ctx.fill();
        ctx.strokeStyle = bs.br; ctx.lineWidth = 4; ctx.stroke();
        const lines = el.text.split("\n"); ctx.textAlign = "center"; ctx.fillStyle = bs.txt;
        lines.forEach((l, i) => {
          ctx.font = `700 ${el.fontSize}px Arial`;
          ctx.fillText(l, cx, cy - (lines.length - 1) * el.fontSize * .6 + i * el.fontSize * 1.2);
        });
      } else {
        const { x, y, w, h } = el, r = Math.min(16, h * .3);
        ctx.fillStyle = bs.sh; ctx.beginPath(); ctx.roundRect(x + 5, y + 7, w, h, r); ctx.fill();
        const g2 = ctx.createLinearGradient(x, y, x, y + h);
        g2.addColorStop(0, lighten(bs.bg, 25)); g2.addColorStop(1, bs.bg);
        ctx.fillStyle = g2; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.fill();
        ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.roundRect(x + 3, y + 3, w - 6, h * .45, [r, r, 0, 0]); ctx.fill();
        ctx.strokeStyle = bs.br; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.roundRect(x, y, w, h, r); ctx.stroke();
        const lines = el.text.split("\n"); ctx.textAlign = "center"; ctx.fillStyle = bs.txt;
        lines.forEach((l, i) => {
          const fs = Math.min(el.fontSize, h * .5 / lines.length);
          ctx.font = `700 ${fs}px "Arial Black", Arial`;
          ctx.fillText(l, x + w / 2, y + h / 2 - (lines.length - 1) * fs * .6 + i * fs * 1.2 + fs * .35);
        });
      }
      if (el.id === selId) {
        ctx.strokeStyle = "#FFD600"; ctx.lineWidth = 4; ctx.setLineDash([10, 6]);
        ctx.strokeRect(el.x - 4, el.y - 4, el.w + 8, el.h + 8); ctx.setLineDash([]);
        ctx.fillStyle = "#FFD600"; ctx.fillRect(el.x + el.w - 8, el.y + el.h - 8, 16, 16);
      }
      ctx.restore();
    });

    // Address bar
    const ay = H * .91, ah = H * .09;
    ctx.fillStyle = ADDR.bg1; ctx.fillRect(0, ay, W * .6, ah);
    ctx.fillStyle = ADDR.bg2; ctx.fillRect(W * .6, ay, W * .4, ah);
    ctx.textAlign = "left"; ctx.fillStyle = "#fff";
    ctx.font = "26px Arial"; ctx.fillText("📍", 18, ay + ah * .5);
    ctx.font = `900 34px "Arial Black", Arial`; ctx.fillText(dealerName || getBrand(brandId).name, 62, ay + ah * .45);
    ctx.font = "22px Arial"; ctx.fillStyle = "rgba(255,255,255,.85)";
    ctx.fillText(dealerSub || getBrand(brandId).address, 62, ay + ah * .78);
    ctx.fillStyle = "#fff"; ctx.font = "20px Arial"; ctx.fillText("फ़ोन", W * .62, ay + ah * .38);
    ctx.fillStyle = "#FFD600"; ctx.font = `900 42px "Arial Black", Arial`; ctx.fillText(phone || getBrand(brandId).phone, W * .62, ay + ah * .78);

    drawBothLogos(ctx, ownerRef, logoRef, brandId, W, 18, 110);
  }, [bg, headline, hlSize, elems, selId, bikeImg, bikePos, dealerName, dealerSub, phone, brandId, apiBase, logoTick, ownerTick]);

  useEffect(() => { render(); }, [render]);

  function getScale() { const r = cvRef.current?.getBoundingClientRect(); return r ? W / r.width : 1; }

  function onPtrDown(e) {
    const sc = getScale(); const r = cvRef.current.getBoundingClientRect();
    const mx = (e.clientX - r.left) * sc, my = (e.clientY - r.top) * sc;
    if (selEl) {
      const rx = selEl.x + selEl.w, ry = selEl.y + selEl.h;
      if (Math.abs(mx - rx) < 20 && Math.abs(my - ry) < 20) {
        resizeR.current = { id: selEl.id, type: "el", startX: mx, startY: my, origW: selEl.w, origH: selEl.h };
        e.preventDefault(); return;
      }
    }
    if (selId === "__bike__") {
      const rx = bikePos.x + bikePos.w, ry = bikePos.y + bikePos.h;
      if (Math.abs(mx - rx) < 20 && Math.abs(my - ry) < 20) {
        resizeR.current = { id: "__bike__", type: "bike", startX: mx, startY: my, origW: bikePos.w, origH: bikePos.h };
        e.preventDefault(); return;
      }
    }
    if (bikeImg && mx >= bikePos.x && mx <= bikePos.x + bikePos.w && my >= bikePos.y && my <= bikePos.y + bikePos.h) {
      setSelId("__bike__");
      dragR.current = { type: "bike", startX: mx, startY: my, origX: bikePos.x, origY: bikePos.y };
      e.preventDefault(); return;
    }
    for (let i = elems.length - 1; i >= 0; i--) {
      const el = elems[i];
      const inB = el.type === "circle"
        ? Math.hypot(mx - (el.x + el.w / 2), my - (el.y + el.h / 2)) <= el.w / 2
        : mx >= el.x && mx <= el.x + el.w && my >= el.y && my <= el.y + el.h;
      if (inB) {
        setSelId(el.id);
        dragR.current = { id: el.id, type: "el", startX: mx, startY: my, origX: el.x, origY: el.y };
        e.preventDefault(); return;
      }
    }
    setSelId(null);
  }

  function onPtrMove(e) {
    const sc = getScale(); const r = cvRef.current?.getBoundingClientRect(); if (!r) return;
    const mx = (e.clientX - r.left) * sc, my = (e.clientY - r.top) * sc;
    if (resizeR.current) {
      const { id, type, startX, startY, origW, origH } = resizeR.current;
      const dw = mx - startX, dh = my - startY;
      if (type === "bike") setBikePos(p => ({ ...p, w: Math.max(80, origW + dw), h: Math.max(60, origH + dh) }));
      else setElems(prev => prev.map(el => el.id === id ? { ...el, w: Math.max(60, origW + dw), h: Math.max(30, origH + dh) } : el));
      return;
    }
    if (!dragR.current) return;
    const { type, id, startX, startY, origX, origY } = dragR.current;
    const dx = mx - startX, dy = my - startY;
    if (type === "bike") setBikePos(p => ({ ...p, x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) }));
    else setElems(prev => prev.map(el => el.id === id ? { ...el, x: Math.max(0, origX + dx), y: Math.max(0, origY + dy) } : el));
  }

  function onPtrUp() { dragR.current = null; resizeR.current = null; }

  function upd(id, ch) { setElems(prev => prev.map(e => e.id === id ? { ...e, ...ch } : e)); }
  function delEl(id) { setElems(prev => prev.filter(e => e.id !== id)); setSelId(null); }
  function addEl(type) {
    const id = uid();
    const base = { id, type, x: 200, y: 400, w: 420, h: 80, text: "नया text", btnStyle: "red3d", fontSize: 28 };
    if (type === "circle") { base.w = 175; base.h = 175; base.text = "ऑफर\n5000*"; base.fontSize = 26; }
    setElems(prev => [...prev, base]); setSelId(id);
  }

  function onBikeFile(e) {
    const f = e.target.files?.[0]; if (!f) return;
    const r = new FileReader(); r.onload = () => { setCropSrc(r.result); setCropBox({ x: .05, y: .05, w: .9, h: .9 }); };
    r.readAsDataURL(f); e.target.value = "";
  }
  function confirmCrop() {
    const t = new Image(); t.onload = () => {
      const iw = t.naturalWidth, ih = t.naturalHeight;
      const cx = Math.round(cropBox.x * iw), cy = Math.round(cropBox.y * ih);
      const cw = Math.max(1, Math.round(cropBox.w * iw)), ch = Math.max(1, Math.round(cropBox.h * ih));
      const c = document.createElement("canvas"); c.width = cw; c.height = ch;
      c.getContext("2d").drawImage(t, cx, cy, cw, ch, 0, 0, cw, ch);
      setBikeImg(c.toDataURL("image/png")); setCropSrc(null);
    }; t.src = cropSrc;
  }

  function dlPNG() {
    vib(30);
    cvRef.current.toBlob(b => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "ai-poster.jpg"; a.click(); URL.revokeObjectURL(u); }, "image/jpeg", .9);
  }

  async function submit() {
    vib(60); setBusy(true); setNote("भेज रहे हैं…");
    try {
      const b64 = cvRef.current.toDataURL("image/jpeg", .88);
      const res = await fetch(apiBase + "/api/mega-offer/submit", {
        method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ brand: brandId, text: caption, imageData: b64, type: "vigyapan" }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "Error");
      setNote("✅ Review में भेज दिया!"); vib([30, 30, 60]);
      setTimeout(() => { setNote(""); if (onSent) onSent(); }, 2500);
    } catch (e) { setNote("❌ " + e.message); }
    setBusy(false);
  }

  const inp = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none mt-1";

  return (
    <div className="space-y-3 pb-10">
      {cropSrc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-2xl p-4 w-full max-w-sm space-y-3">
            <p className="text-sm font-bold text-white text-center">📐 Bike Crop</p>
            <div className="relative rounded-xl overflow-hidden border border-neutral-700" style={{ aspectRatio: "1/1" }}>
              <img ref={cropRef} src={cropSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
              <div style={{ position: "absolute", left: `${cropBox.x * 100}%`, top: `${cropBox.y * 100}%`, width: `${cropBox.w * 100}%`, height: `${cropBox.h * 100}%`, border: "2px solid #FFD600", boxShadow: "0 0 0 2000px rgba(0,0,0,.6)", pointerEvents: "none" }} />
            </div>
            {[["Left", "x"], ["Top", "y"], ["W", "w"], ["H", "h"]].map(([l, k]) => (
              <label key={k} className="text-xs text-neutral-300 block">{l}: {Math.round(cropBox[k] * 100)}%
                <input type="range" min=".02" max=".98" step=".01" value={cropBox[k]} className="w-full accent-yellow-400"
                  onChange={e => setCropBox(b => ({ ...b, [k]: parseFloat(e.target.value) }))} />
              </label>
            ))}
            <div className="flex gap-2">
              <button type="button" onClick={() => setCropSrc(null)} className="flex-1 py-2.5 rounded-xl border border-neutral-600 text-sm text-neutral-300">रद्द</button>
              <button type="button" onClick={() => { vib(30); confirmCrop(); }} className="flex-1 py-2.5 rounded-xl font-bold text-black text-sm" style={{ background: "#FFD600" }}>✅ Crop</button>
            </div>
            <button type="button" onClick={() => { setBikeImg(cropSrc); setCropSrc(null); }} className="w-full py-2 rounded-xl border border-neutral-700 text-xs text-neutral-400">बिना crop के</button>
          </div>
        </div>
      )}

      {spec?.reasoning_hindi && (
        <div className="rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2">
          <p className="text-[11px] text-neutral-400">🤖 {spec.reasoning_hindi}</p>
        </div>
      )}

      <div className="sticky top-0 z-30 bg-neutral-950 pb-2 pt-1">
        <div className="rounded-2xl overflow-hidden border border-neutral-700 bg-black">
          <canvas ref={cvRef} width={W} height={H} className="w-full touch-none cursor-pointer"
            onPointerDown={onPtrDown} onPointerMove={onPtrMove} onPointerUp={onPtrUp} onPointerLeave={onPtrUp} />
        </div>
        <p className="text-[10px] text-neutral-500 text-center mt-1">👆 drag करें • 🟡 corner से resize</p>
        <div className="grid grid-cols-3 gap-1.5 mt-1.5">
          <button type="button" onClick={dlPNG} className="py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-300">⬇ PNG</button>
          <label className="py-2.5 rounded-xl border border-neutral-700 text-xs text-center text-neutral-300 cursor-pointer">
            🏍️ Bike <input type="file" accept="image/*" className="hidden" onChange={onBikeFile} />
          </label>
          <button type="button" onClick={submit} disabled={busy} className="py-2.5 rounded-xl text-xs font-bold text-black disabled:opacity-50" style={{ background: "#FFD600" }}>
            {busy ? "भेज रहे…" : "📤 Review"}
          </button>
        </div>
        {note && <div className={`mt-1 rounded-xl px-3 py-2 text-xs font-semibold ${note.startsWith("✅") ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/60 text-red-300"}`}>{note}</div>}
      </div>

      {selEl && (
        <div className="bg-neutral-900 rounded-2xl border-2 border-yellow-500 p-3 space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-yellow-400">✏️ {selEl.type}</p>
            <button type="button" onClick={() => delEl(selEl.id)} className="text-red-400 text-xs px-2 py-1 rounded-lg border border-red-800">🗑</button>
          </div>
          <textarea value={selEl.text} onChange={e => upd(selEl.id, { text: e.target.value })} rows={2}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none resize-none" />
          <div className="grid grid-cols-2 gap-2">
            <div><p className="text-[10px] text-neutral-500">Font</p>
              <input type="number" value={selEl.fontSize} min={14} max={80} onChange={e => upd(selEl.id, { fontSize: +e.target.value || 28 })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-white" /></div>
            <div><p className="text-[10px] text-neutral-500">Style</p>
              <select value={selEl.btnStyle} onChange={e => upd(selEl.id, { btnStyle: e.target.value })}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2 py-1.5 text-sm text-white">
                {BTN3D.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select></div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {[["X", "x"], ["Y", "y"], ["W", "w"], ["H", "h"]].map(([l, k]) => (
              <div key={k}><p className="text-[10px] text-neutral-500">{l}</p>
                <input type="number" value={Math.round(selEl[k])} onChange={e => upd(selEl.id, { [k]: +e.target.value || 0 })}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-1.5 py-1.5 text-xs text-white" /></div>
            ))}
          </div>
        </div>
      )}

      {selId === "__bike__" && bikeImg && (
        <div className="bg-neutral-900 rounded-2xl border-2 border-yellow-500 p-3 space-y-2">
          <p className="text-xs font-bold text-yellow-400">🏍️ Bike Image</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[["X", "x"], ["Y", "y"], ["W", "w"], ["H", "h"]].map(([l, k]) => (
              <div key={k}><p className="text-[10px] text-neutral-500">{l}</p>
                <input type="number" value={Math.round(bikePos[k])} onChange={e => setBikePos(p => ({ ...p, [k]: +e.target.value || 0 }))}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-1.5 py-1.5 text-xs text-white" /></div>
            ))}
          </div>
          <button type="button" onClick={() => { setBikeImg(null); setSelId(null); }} className="w-full py-2 rounded-xl border border-red-800 text-red-400 text-xs">🗑 Remove</button>
        </div>
      )}

      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">➕ Element जोड़ें <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4 grid grid-cols-2 gap-2">
          {[["offer", "📦 Offer Box"], ["subhl", "📢 Sub Headline"], ["banner", "📋 Banner"], ["circle", "🔵 Circle"]].map(([t, l]) => (
            <button key={t} type="button" onClick={() => { vib(20); addEl(t); }}
              className="py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-300 hover:border-yellow-400 hover:text-yellow-400">{l}</button>
          ))}
        </div>
      </details>

      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🎨 Background & Headline <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4 space-y-2">
          <select value={bg} onChange={e => setBg(e.target.value)} className={inp}>
            {Object.keys(BG_MAP).map(k => <option key={k} value={k}>{k}</option>)}
          </select>
          <textarea value={headline} onChange={e => setHeadline(e.target.value)} rows={2} className={inp + " resize-none"} />
          <p className="text-xs text-neutral-400">Headline Size: {hlSize}px</p>
          <input type="range" min={60} max={150} value={hlSize} onChange={e => setHlSize(+e.target.value)} className="w-full accent-yellow-400" />
        </div>
      </details>

      <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">✍️ Caption <span className="text-neutral-500">▼</span></summary>
        <div className="px-4 pb-4"><textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4} className={inp + " resize-none"} /></div>
      </details>

      <div className="flex gap-2">
        <button type="button" onClick={() => { vib(20); onBack && onBack(); }} className="flex-1 rounded-2xl py-3.5 border border-neutral-700 text-sm text-neutral-300">← वापस</button>
        <button type="button" onClick={submit} disabled={busy} className="flex-1 rounded-2xl py-3.5 font-bold text-black text-sm disabled:opacity-50" style={{ background: "#FFD600" }}>
          {busy ? "भेज रहे…" : "📤 Review में भेजें"}
        </button>
      </div>
    </div>
  );
}
