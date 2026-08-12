const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useRef } from "react";

const BRAND_LABELS = { vp_honda: "VP Honda", yakuza: "Yakuza EV", minimetro: "Mini Metro" };
const DEALER_SUB = {
  vp_honda: "VP Honda, परवलिया सड़क, भोपाल",
  yakuza: "MD Automobiles, भोपाल",
  minimetro: "MD Automobiles, भोपाल",
};

const W = 1080, H = 1080;
function uid() { return "d" + Date.now() + Math.random().toString(36).slice(2, 5); }

const BG_MAP = {
  showroom:   { c1: "#3a3f47", c2: "#14171a" },
  redshow:    { c1: "#b71c1c", c2: "#4a0000" },
  whiteclean: { c1: "#f8f8f8", c2: "#e0e0e0" },
  golden:     { c1: "#8B6914", c2: "#1a0f00" },
  blue:       { c1: "#1565c0", c2: "#0a2a5a" },
  diwali:     { c1: "#c2641a", c2: "#4a1505" },
  navratri:   { c1: "#9a1840", c2: "#3a0818" },
};

const QUALITY_BADGE = {
  good: { label: "बढ़िया", cls: "bg-emerald-900/60 text-emerald-300 border-emerald-700" },
  ok:   { label: "ठीक",   cls: "bg-amber-900/50 text-amber-300 border-amber-700" },
  poor: { label: "कमज़ोर", cls: "bg-red-900/50 text-red-300 border-red-700" },
};

const inp = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-500 mt-1";

export default function AIDelivery({ apiBase, token, brandId, onSent }) {
  const cvRef = useRef(null);

  const [photos, setPhotos] = useState([]);      // [{ id, dataUrl, quality, note, peopleCount }]
  const [selPhotoId, setSelPhotoId] = useState(null);
  const [customerName, setCustomerName] = useState("");
  const [bikeName, setBikeName] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [ai, setAi] = useState(null);            // AI का पूरा spec
  const [bg, setBg] = useState("showroom");
  const [headline, setHeadline] = useState("बधाई हो!");
  const [subLine, setSubLine] = useState("नई गाड़ी की शुभकामनाएं");
  const [caption, setCaption] = useState("");

  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const selPhoto = photos.find(p => p.id === selPhotoId);

  // ── Photos upload ────────────────────────────────────────────
  function onFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    vib(30);
    const remaining = 6 - photos.length;
    files.slice(0, remaining).forEach(f => {
      const r = new FileReader();
      r.onload = () => {
        setPhotos(prev => {
          const next = [...prev, { id: uid(), dataUrl: r.result }];
          if (!selPhotoId) setSelPhotoId(next[0].id);
          return next;
        });
      };
      r.readAsDataURL(f);
    });
    e.target.value = "";
  }

  function delPhoto(id) {
    vib(20);
    setPhotos(prev => prev.filter(p => p.id !== id));
    if (selPhotoId === id) setSelPhotoId(null);
  }

  // ── Step 1: AI सब photos check करे, best चुने ────────────────
  async function pickBest() {
    if (!photos.length) return;
    vib(50); setAnalyzing(true); setNote("");
    try {
      const res = await fetch(apiBase + "/api/delivery/ai-pick-best", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ brand: brandId, images: photos.map(p => ({ id: p.id, dataUrl: p.dataUrl })) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setPhotos(prev => prev.map(p => {
        const r = (data.results || []).find(x => x.id === p.id);
        return r ? { ...p, quality: r.quality, note: r.note, peopleCount: r.peopleCount } : p;
      }));
      if (data.bestId) { setSelPhotoId(data.bestId); setNote("✅ सबसे अच्छी photo चुन ली गई"); }
      vib([30, 30, 60]);
    } catch (e) { setNote("❌ " + e.message); }
    setAnalyzing(false);
  }

  // ── Step 2: चुनी हुई photo से पूरा post बनवाओ ───────────────
  async function generatePost() {
    if (!selPhoto) { setNote("⚠️ पहले photo चुनें"); return; }
    vib(50); setAnalyzing(true); setNote("");
    try {
      const res = await fetch(apiBase + "/api/delivery/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ brand: brandId, imageData: selPhoto.dataUrl, customerName, bikeName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setAi(data);
      if (data.suggestedBg && BG_MAP[data.suggestedBg]) setBg(data.suggestedBg);
      if (data.headline) setHeadline(data.headline);
      if (data.subLine) setSubLine(data.subLine);
      if (data.caption) setCaption(data.caption);
      if (data.detectedVehicle && !bikeName) setBikeName(data.detectedVehicle);
      setNote("✅ AI ने post तैयार कर दिया — नीचे preview देखें");
      vib([30, 30, 60]);
      setTimeout(() => renderCanvas(data), 100);
    } catch (e) { setNote("❌ " + e.message); }
    setAnalyzing(false);
  }

  // ── Canvas render ────────────────────────────────────────────
  function renderCanvas(spec) {
    const cv = cvRef.current; if (!cv || !selPhoto) return;
    const ctx = cv.getContext("2d");
    ctx.clearRect(0, 0, W, H);
    const bgo = BG_MAP[bg] || BG_MAP.showroom;

    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, bgo.c1); g.addColorStop(1, bgo.c2);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    // Confetti
    const cc = ["#ff2d78", "#ffd400", "#16a34a", "#1565c0", "#fff"];
    for (let i = 0; i < 28; i++) {
      ctx.save(); ctx.globalAlpha = .5; ctx.fillStyle = cc[i % 5];
      const ex = (i * 97) % W, ey = (i * 61) % (H * .22);
      ctx.translate(ex, ey); ctx.rotate(i * .6); ctx.fillRect(-6, -6, 14, 14); ctx.restore();
    }

    // Headline
    ctx.textAlign = "center";
    ctx.font = `900 84px "Arial Black", Arial`;
    ctx.strokeStyle = "#8B0000"; ctx.lineWidth = 8;
    ctx.strokeText(headline, W / 2, 125);
    ctx.fillStyle = "#FFD600"; ctx.fillText(headline, W / 2, 125);
    ctx.font = `700 34px "Noto Sans Devanagari", Arial`;
    ctx.fillStyle = "#fff"; ctx.fillText(subLine, W / 2, 175);

    // Photo card
    const px = W * .09, py = 205, pw = W * .82, ph = H * .55;
    ctx.fillStyle = "#fff";
    ctx.beginPath(); ctx.roundRect(px - 10, py - 10, pw + 20, ph + 20, 20); ctx.fill();
    const im = new Image();
    im.onload = () => {
      ctx.save();
      ctx.beginPath(); ctx.roundRect(px, py, pw, ph, 14); ctx.clip();
      // cover fit
      const ir = im.naturalWidth / im.naturalHeight, br = pw / ph;
      let dw, dh, dx, dy;
      if (ir > br) { dh = ph; dw = ph * ir; dx = px - (dw - pw) / 2; dy = py; }
      else { dw = pw; dh = pw / ir; dx = px; dy = py - (dh - ph) / 2; }
      ctx.drawImage(im, dx, dy, dw, dh);
      ctx.restore();
      drawBottom(ctx);
    };
    im.src = selPhoto.dataUrl;

    function drawBottom(c) {
      // Name card
      const ny = py + ph + 26, nh = 96;
      c.fillStyle = "#fff";
      c.beginPath(); c.roundRect(W * .07, ny, W * .86, nh, 18); c.fill();
      c.textAlign = "left";
      c.fillStyle = "#E4002B"; c.font = `900 40px "Arial Black", Arial`;
      c.fillText(customerName || "ग्राहक का नाम", W * .1, ny + 44);
      c.fillStyle = "#333"; c.font = `600 28px "Noto Sans Devanagari", Arial`;
      c.fillText(`${bikeName || "नई गाड़ी"} · नई गाड़ी मुबारक`, W * .1, ny + 80);

      // Address bar
      const ay = H * .92, ah = H * .08;
      c.fillStyle = "#E4002B"; c.fillRect(0, ay, W * .6, ah);
      c.fillStyle = "#141414"; c.fillRect(W * .6, ay, W * .4, ah);
      c.fillStyle = "#fff"; c.textAlign = "left";
      c.font = "24px Arial"; c.fillText("📍", 16, ay + ah * .5);
      c.font = `900 32px "Arial Black", Arial`; c.fillText(BRAND_LABELS[brandId] || "VP Honda", 56, ay + ah * .45);
      c.font = "20px Arial"; c.fillStyle = "rgba(255,255,255,.85)";
      c.fillText(DEALER_SUB[brandId] || "", 56, ay + ah * .78);
      c.fillStyle = "#fff"; c.font = "18px Arial"; c.fillText("फ़ोन", W * .63, ay + ah * .38);
      c.fillStyle = "#FFD600"; c.font = `900 36px "Arial Black", Arial`;
      c.fillText("9713394738", W * .63, ay + ah * .78);

      // Logo
      const lg = new Image();
      lg.src = apiBase + `/logos/${brandId === "yakuza" ? "yakuza" : brandId === "minimetro" ? "minimetro" : "vp_honda"}.png`;
      if (lg.complete && lg.naturalWidth > 0) c.drawImage(lg, W - 118, 14, 100, 100);
      else lg.onload = () => c.drawImage(lg, W - 118, 14, 100, 100);
    }
  }

  // re-render on edits
  React.useEffect(() => { if (ai && selPhoto) renderCanvas(ai); }, [bg, headline, subLine, customerName, bikeName, selPhotoId, ai]);

  function dlPNG() {
    vib(30);
    cvRef.current.toBlob(b => { const u = URL.createObjectURL(b); const a = document.createElement("a"); a.href = u; a.download = "delivery.jpg"; a.click(); URL.revokeObjectURL(u); }, "image/jpeg", .9);
  }

  async function submit() {
    if (!ai) { setNote("⚠️ पहले post बनाएं"); return; }
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

  return (
    <div className="space-y-3 pb-10">

      {/* ── PHOTOS ── */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <p className="text-sm font-bold text-white">📸 Delivery Photos (max 6)</p>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map(p => {
              const q = QUALITY_BADGE[p.quality];
              return (
                <div key={p.id} onClick={() => { vib(15); setSelPhotoId(p.id); }}
                  className={`relative rounded-xl overflow-hidden border-2 cursor-pointer ${p.id === selPhotoId ? "border-yellow-500" : "border-neutral-700"}`}>
                  <img src={p.dataUrl} alt="" className="w-full h-24 object-cover" />
                  {q && <span className={`absolute top-1 left-1 text-[9px] px-1.5 py-0.5 rounded-full border ${q.cls}`}>{q.label}</span>}
                  {p.id === selPhotoId && <span className="absolute bottom-1 left-1 text-[9px] bg-yellow-500 text-black px-1.5 py-0.5 rounded-full font-bold">चुनी गई</span>}
                  <button type="button" onClick={(e) => { e.stopPropagation(); delPhoto(p.id); }}
                    className="absolute top-1 right-1 bg-red-700 text-white text-[10px] w-5 h-5 rounded-full">✕</button>
                </div>
              );
            })}
          </div>
        )}

        {photos.length < 6 && (
          <label className="block border-2 border-dashed border-neutral-600 rounded-xl p-5 text-center cursor-pointer hover:border-yellow-400">
            <p className="text-sm text-neutral-400">📸 Photos चुनें (एक साथ कई)</p>
            <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
          </label>
        )}

        {photos.length > 1 && (
          <button type="button" onClick={pickBest} disabled={analyzing}
            className="w-full py-3 rounded-xl text-sm font-bold border-2 border-yellow-500 text-yellow-400 disabled:opacity-40">
            {analyzing ? "🔍 AI check कर रहा है…" : "🔍 AI से सबसे अच्छी photo चुनवाएं"}
          </button>
        )}

        {selPhoto?.note && (
          <p className="text-[11px] text-neutral-400 bg-neutral-800 rounded-xl px-3 py-2">🤖 {selPhoto.note}</p>
        )}
      </div>

      {/* ── DETAILS ── */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-2">
        <p className="text-sm font-bold text-white">👤 Customer Details</p>
        <input value={customerName} onChange={e => setCustomerName(e.target.value)} className={inp} placeholder="ग्राहक का नाम" />
        <input value={bikeName} onChange={e => setBikeName(e.target.value)} className={inp} placeholder="गाड़ी का नाम (जैसे Shine 100)" />

        <button type="button" onClick={generatePost} disabled={!selPhoto || analyzing}
          className="w-full py-3.5 rounded-xl text-base font-bold text-black disabled:opacity-40 mt-2" style={{ background: "#FFD600" }}>
          {analyzing ? "🤖 AI बना रहा है…" : "✨ AI से पूरा Post बनवाएं"}
        </button>
      </div>

      {note && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${note.startsWith("✅") ? "bg-emerald-900/60 text-emerald-300" : note.startsWith("⚠️") ? "bg-amber-900/50 text-amber-300" : "bg-red-900/60 text-red-300"}`}>
          {note}
        </div>
      )}

      {/* ── PREVIEW ── */}
      {ai && (
        <>
          {ai.reasoning_hindi && (
            <div className="rounded-xl bg-neutral-800 border border-neutral-700 px-3 py-2">
              <p className="text-[11px] text-neutral-400">🤖 {ai.reasoning_hindi}</p>
            </div>
          )}

          <div className="sticky top-0 z-30 bg-neutral-950 pb-2 pt-1">
            <div className="rounded-2xl overflow-hidden border border-neutral-700 bg-black">
              <canvas ref={cvRef} width={W} height={H} className="w-full" />
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-1.5">
              <button type="button" onClick={dlPNG} className="py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-300">⬇ PNG</button>
              <button type="button" onClick={submit} disabled={busy}
                className="py-2.5 rounded-xl text-xs font-bold text-black disabled:opacity-50" style={{ background: "#FFD600" }}>
                {busy ? "भेज रहे…" : "📤 Review में भेजें"}
              </button>
            </div>
          </div>

          <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
            <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🎨 Design बदलें <span className="text-neutral-500">▼</span></summary>
            <div className="px-4 pb-4 space-y-2">
              <select value={bg} onChange={e => setBg(e.target.value)} className={inp}>
                {Object.keys(BG_MAP).map(k => <option key={k} value={k}>{k}</option>)}
              </select>
              <input value={headline} onChange={e => setHeadline(e.target.value)} className={inp} placeholder="बधाई हो!" />
              <input value={subLine} onChange={e => setSubLine(e.target.value)} className={inp} placeholder="नई गाड़ी की शुभकामनाएं" />
            </div>
          </details>

          <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
            <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">✍️ Caption <span className="text-neutral-500">▼</span></summary>
            <div className="px-4 pb-4">
              <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={5} className={inp + " resize-none"} />
            </div>
          </details>
        </>
      )}
    </div>
  );
}
