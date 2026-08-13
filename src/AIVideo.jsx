const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useRef, useEffect } from "react";

const BRAND_LABELS = { vp_honda: "VP Honda", yakuza: "Yakuza EV", minimetro: "Mini Metro" };

function uid() { return "v" + Date.now() + Math.random().toString(36).slice(2, 5); }

const DUR_OPTIONS = [
  { v: 2,   label: "तेज़ (2 सेक)" },
  { v: 3,   label: "सामान्य (3 सेक)" },
  { v: 4.5, label: "धीमा (4.5 सेक)" },
];

const inp = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-500 mt-1";

export default function AIVideo({ apiBase, token, brandId, onSent }) {
  const [photos, setPhotos] = useState([]);
  const [headline, setHeadline] = useState("बधाई हो!");
  const [subLine, setSubLine] = useState("नई गाड़ी की शुभकामनाएं");
  const [perDur, setPerDur] = useState(3);
  const [caption, setCaption] = useState("");
  const [aiCapBusy, setAiCapBusy] = useState(false);

  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const pollRef = useRef(null);

  const totalSec = (photos.length * perDur).toFixed(1);

  // ── Photos ───────────────────────────────────────────────────
  function onFiles(e) {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    vib(30);
    const remaining = 8 - photos.length;
    files.slice(0, remaining).forEach(f => {
      const r = new FileReader();
      r.onload = () => setPhotos(prev => [...prev, { id: uid(), dataUrl: r.result }]);
      r.readAsDataURL(f);
    });
    e.target.value = "";
  }

  function delPhoto(id) { vib(20); setPhotos(prev => prev.filter(p => p.id !== id)); }

  function movePhoto(id, dir) {
    vib(15);
    setPhotos(prev => {
      const i = prev.findIndex(p => p.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  // ── AI Caption ───────────────────────────────────────────────
  async function makeCaption() {
    if (!photos.length) return;
    vib(40); setAiCapBusy(true); setNote("");
    try {
      const r = await fetch(apiBase + "/api/delivery/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ brand: brandId, imageData: photos[0].dataUrl, customerName: "", bikeName: "" }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      if (d.caption) setCaption(d.caption);
      if (d.headline) setHeadline(d.headline);
      if (d.subLine) setSubLine(d.subLine);
      vib([30, 30, 60]);
      setNote("✅ AI ने caption बना दिया");
    } catch (e) { setNote("❌ " + e.message); }
    setAiCapBusy(false);
  }

  // ── Video बनाओ ───────────────────────────────────────────────
  async function makeVideo() {
    if (photos.length < 2) { setNote("⚠️ कम से कम 2 photos चाहिए"); return; }
    vib(60); setBusy(true); setNote(""); setStatus(null);
    try {
      const r = await fetch(apiBase + "/api/video/slideshow", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          brand: brandId,
          images: photos.map(p => p.dataUrl),
          headline, subLine, perPhotoDur: perDur,
          caption: caption || `🎉 ${headline}`,
        }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setJobId(d.jobId);
      setStatus({ status: "processing" });
      setNote("⏳ Video बन रहा है… कुछ सेकंड लगेंगे");
    } catch (e) { setNote("❌ " + e.message); setBusy(false); }
  }

  // ── Poll status ──────────────────────────────────────────────
  useEffect(() => {
    if (!jobId) return;
    let tries = 0;
    pollRef.current = setInterval(async () => {
      tries++;
      try {
        const r = await fetch(`${apiBase}/api/video/status/${jobId}`, { headers: { Authorization: "Bearer " + token } });
        const d = await r.json();
        setStatus(d);
        if (d.status === "done") {
          clearInterval(pollRef.current); setBusy(false);
          setNote("✅ Video तैयार! Review में भी चला गया है।");
          vib([30, 30, 60]);
          if (onSent) onSent();
        } else if (d.status === "failed") {
          clearInterval(pollRef.current); setBusy(false);
          setNote("❌ " + (d.error || "Video नहीं बना"));
        }
      } catch (_) {}
      if (tries > 90) { clearInterval(pollRef.current); setBusy(false); setNote("⚠️ बहुत समय लग रहा है — बाद में Review में देखें"); }
    }, 2000);
    return () => clearInterval(pollRef.current);
  }, [jobId, apiBase, token]);

  function reset() {
    vib(20);
    setJobId(null); setStatus(null); setNote(""); setBusy(false);
  }

  return (
    <div className="space-y-3 pb-10">

      {/* ── VIDEO RESULT ── */}
      {status?.status === "done" && status.url && (
        <div className="rounded-2xl bg-neutral-900 border border-emerald-700 p-3 space-y-2">
          <p className="text-sm font-bold text-emerald-400">🎬 Video तैयार है!</p>
          <video src={apiBase + status.url} controls playsInline className="w-full rounded-xl bg-black" />
          <div className="grid grid-cols-2 gap-2">
            <a href={apiBase + status.url} download="delivery-video.mp4"
              className="py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-300 text-center">⬇ Download</a>
            <button type="button" onClick={reset}
              className="py-2.5 rounded-xl text-xs font-bold text-black" style={{ background: "#FFD600" }}>नया Video</button>
          </div>
          <p className="text-[11px] text-neutral-500">Review tab में जाकर approve करके social media पर भेजें</p>
        </div>
      )}

      {/* ── PROCESSING ── */}
      {status?.status === "processing" && (
        <div className="rounded-2xl bg-neutral-900 border border-amber-700 p-4 text-center space-y-2">
          <p className="text-2xl">⏳</p>
          <p className="text-sm font-bold text-amber-400">Video बन रहा है…</p>
          <p className="text-xs text-neutral-400">{photos.length} photos · लगभग {totalSec} सेकंड का video</p>
          <div className="h-1.5 bg-neutral-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 animate-pulse" style={{ width: "60%" }} />
          </div>
          <p className="text-[11px] text-neutral-500">बंद मत करें — तैयार होते ही यहीं दिख जाएगा</p>
        </div>
      )}

      {note && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
          note.startsWith("✅") ? "bg-emerald-900/60 text-emerald-300"
          : note.startsWith("⚠️") || note.startsWith("⏳") ? "bg-amber-900/50 text-amber-300"
          : "bg-red-900/60 text-red-300"}`}>{note}</div>
      )}

      {/* ── SETUP (video बनने से पहले) ── */}
      {status?.status !== "done" && (
        <>
          {/* Photos */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-white">📸 Photos ({photos.length}/8)</p>
              {photos.length >= 2 && <span className="text-[11px] text-yellow-400">~{totalSec} सेकंड</span>}
            </div>

            {photos.length > 0 && (
              <div className="space-y-1.5">
                {photos.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-2 bg-neutral-800 rounded-xl p-2">
                    <span className="text-[10px] text-neutral-500 w-4">{i + 1}</span>
                    <img src={p.dataUrl} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    <div className="flex-1" />
                    <button type="button" onClick={() => movePhoto(p.id, -1)} disabled={i === 0}
                      className="text-neutral-400 text-sm px-1.5 disabled:opacity-20">↑</button>
                    <button type="button" onClick={() => movePhoto(p.id, 1)} disabled={i === photos.length - 1}
                      className="text-neutral-400 text-sm px-1.5 disabled:opacity-20">↓</button>
                    <button type="button" onClick={() => delPhoto(p.id)} className="text-red-400 text-sm px-1.5">✕</button>
                  </div>
                ))}
              </div>
            )}

            {photos.length < 8 && (
              <label className="block border-2 border-dashed border-neutral-600 rounded-xl p-5 text-center cursor-pointer hover:border-yellow-400">
                <p className="text-sm text-neutral-400">📸 Photos चुनें (एक साथ कई)</p>
                <p className="text-[11px] text-neutral-600 mt-0.5">2 से 8 photos · ऊपर-नीचे करके क्रम बदलें</p>
                <input type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />
              </label>
            )}
          </div>

          {/* Settings */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
            <p className="text-sm font-bold text-white">✍️ Video का text</p>
            <input value={headline} onChange={e => setHeadline(e.target.value)} className={inp} placeholder="बधाई हो!" />
            <input value={subLine} onChange={e => setSubLine(e.target.value)} className={inp} placeholder="नई गाड़ी की शुभकामनाएं" />

            <p className="text-xs text-neutral-400 mt-2">हर photo कितनी देर दिखे</p>
            <div className="grid grid-cols-3 gap-1.5">
              {DUR_OPTIONS.map(o => (
                <button key={o.v} type="button" onClick={() => { vib(15); setPerDur(o.v); }}
                  className={`py-2 rounded-xl text-[11px] font-semibold border-2 ${perDur === o.v ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-neutral-700 text-neutral-400"}`}>
                  {o.label}
                </button>
              ))}
            </div>

            {photos.length > 0 && (
              <button type="button" onClick={makeCaption} disabled={aiCapBusy}
                className="w-full py-2.5 rounded-xl text-xs font-bold border-2 border-yellow-500 text-yellow-400 disabled:opacity-40 mt-2">
                {aiCapBusy ? "🤖 सोच रहे हैं…" : "🤖 AI से caption + text बनवाएं"}
              </button>
            )}
          </div>

          {/* Caption */}
          <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
            <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">✍️ Caption <span className="text-neutral-500">▼</span></summary>
            <div className="px-4 pb-4">
              <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={4} className={inp + " resize-none"}
                placeholder="Social media caption…" />
            </div>
          </details>

          <button type="button" onClick={makeVideo} disabled={busy || photos.length < 2}
            className="w-full rounded-2xl py-4 text-base font-bold text-black disabled:opacity-40"
            style={{ background: "#FFD600" }}>
            {busy ? "⏳ बन रहा है…" : "🎬 Video बनाएं"}
          </button>

          <p className="text-[11px] text-neutral-500 text-center">
            Photos क्रम से दिखेंगे, हल्का zoom effect और fade transition के साथ · पहली photo पर headline आएगा
          </p>
        </>
      )}
    </div>
  );
}
