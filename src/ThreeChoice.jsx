// ============================================================================
//  ThreeChoice.jsx — एक बात, तीन poster, आप चुनिए
//  ---------------------------------------------------------------------------
//  ⚠️ पहले एक ही poster बनता था। पसंद न आए तो दोबारा बनवाइए, फिर इंतज़ार,
//     फिर शायद वही बात।
//
//     अब तीनों एक साथ बनते हैं — तीन अलग लहजों में। आप एक चुनिए, बाक़ी दो
//     अपने आप हट जाते हैं (disk और database दोनों से — जगह नहीं घेरते)।
//
//  Studio.jsx में CommandCenter के नीचे लगाइए।
// ============================================================================

import React, { useState, useEffect, useRef } from "react";

const vib = (ms = 30) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

export default function ThreeChoice({ apiBase, token, brandId, accent = "#E4002B", onDone }) {
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [job, setJob] = useState(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [picking, setPicking] = useState("");
  const [big, setBig] = useState("");           // कौन-सा बड़ा करके देख रहे हैं
  const pollRef = useRef(null);

  const auth = { "Content-Type": "application/json", Authorization: "Bearer " + token };
  const full = (u) => (u ? (u.startsWith("http") ? u : apiBase + u) : "");

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function bolo() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setErr("इस phone में बोलकर लिखना नहीं चलता"); return; }
    try {
      const r = new SR();
      r.lang = "hi-IN"; r.interimResults = false;
      r.onresult = (e) => { setTxt(e.results[0][0].transcript); setListening(false); };
      r.onerror = () => { setListening(false); };
      r.onend = () => setListening(false);
      setErr(""); setListening(true); vib(20); r.start();
    } catch (e) { setListening(false); }
  }

  async function banao() {
    if (!txt.trim()) return;
    vib(50); setBusy(true); setErr(""); setMsg(""); setJob(null); setBig("");
    if (pollRef.current) clearInterval(pollRef.current);
    try {
      const r = await fetch(`${apiBase}/api/three/make`, {
        method: "POST", headers: auth,
        body: JSON.stringify({ command: txt.trim(), brand: brandId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "नहीं बना");
      setJob(d); setMsg(d.message || ""); setBusy(false);

      // तीनों एक-एक करके बनते हैं — हर 3 सेकंड देखते हैं
      let n = 0;
      pollRef.current = setInterval(async () => {
        n++;
        try {
          const rr = await fetch(`${apiBase}/api/three/${d.id}`, { headers: auth });
          const dd = await rr.json();
          if (rr.ok) setJob((p) => ({ ...p, ...dd }));
          if ((dd.status && dd.status !== "building") || n > 30) {
            clearInterval(pollRef.current); pollRef.current = null;
          }
        } catch (_) {}
      }, 3000);
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  async function chuno(tone) {
    vib(50); setPicking(tone); setErr("");
    try {
      const r = await fetch(`${apiBase}/api/three/${job.id}/pick`, {
        method: "POST", headers: auth, body: JSON.stringify({ tone }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "नहीं चुना गया");
      setMsg(d.message || "चुन लिया");
      setJob((p) => ({ ...p, chosen: tone, options: (p.options || []).filter((o) => o.tone === tone) }));
      vib([30, 40, 60]);
      onDone && onDone();
    } catch (e) { setErr(e.message); }
    setPicking("");
  }

  async function sabHatao() {
    if (!confirm("तीनों हटा दें?")) return;
    vib([20, 30, 20]);
    try {
      await fetch(`${apiBase}/api/three/${job.id}`, { method: "DELETE", headers: auth });
      setJob(null); setTxt(""); setMsg("");
    } catch (e) { setErr(e.message); }
  }

  const opts = job?.options || [];
  const taiyar = opts.filter((o) => o.status === "ready").length;
  const banRahe = opts.filter((o) => o.status === "building").length;

  return (
    <div className="space-y-3">

      {/* ── लिखिए ── */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 space-y-2">
        <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={2}
          placeholder={'क्या बनाना है?\n"Shine 100 DX पर ₹5,000 की छूट"'}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white outline-none resize-none placeholder:text-neutral-600" />

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={bolo} disabled={busy}
            className="rounded-xl py-2.5 text-sm font-medium border disabled:opacity-40"
            style={{ borderColor: listening ? accent : "#333", color: listening ? accent : "#a3a3a3" }}>
            {listening ? "🔴 सुन रहे हैं…" : "🎙️ बोलकर बताएँ"}
          </button>
          <button type="button" onClick={banao} disabled={busy || !txt.trim()}
            className="rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-40"
            style={{ background: accent }}>
            {busy ? "…" : "✨ तीन बनाओ"}
          </button>
        </div>

        <p className="text-[10px] text-neutral-600 leading-relaxed">
          तीन अलग-अलग लहजों में बनेंगे — 🔥 धमाकेदार · 🛡️ भरोसे वाला · ❤️ अपनापन।
          जो पसंद आए वो चुनिए, बाक़ी दो अपने आप हट जाएँगे।
        </p>
      </div>

      {err && <div className="rounded-lg bg-red-900/50 border border-red-800 text-red-300 text-xs px-3 py-2">{err}</div>}
      {msg && <div className="rounded-lg bg-emerald-900/40 border border-emerald-800 text-emerald-300 text-xs px-3 py-2">{msg}</div>}

      {/* ── तीनों ── */}
      {job && opts.length > 0 && (
        <>
          {!job.chosen && (
            <p className="text-[11px] text-neutral-500">
              {banRahe > 0 ? `⏳ ${taiyar}/3 तैयार — बाक़ी बन रहे हैं…` : "तीनों तैयार — एक चुन लीजिए"}
            </p>
          )}

          <div className="space-y-2.5">
            {opts.map((o) => (
              <div key={o.tone} className="rounded-2xl bg-neutral-900 border-2 overflow-hidden"
                style={{ borderColor: job.chosen === o.tone ? accent : "#262626" }}>

                <div className="flex items-center justify-between px-3 py-2">
                  <div>
                    <span className="text-sm font-semibold text-neutral-100">{o.label}</span>
                    {o.desc && <span className="text-[10px] text-neutral-500 ml-2">{o.desc}</span>}
                  </div>
                  {job.chosen === o.tone && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: accent }}>
                      ✓ चुना हुआ
                    </span>
                  )}
                </div>

                {o.status === "ready" && o.images?.square ? (
                  <button type="button" onClick={() => { vib(15); setBig(big === o.tone ? "" : o.tone); }}
                    className="w-full block">
                    <img src={full(o.images.square)} alt=""
                      className={big === o.tone ? "w-full" : "w-full max-h-56 object-cover"} />
                  </button>
                ) : (
                  <div className="w-full h-40 flex items-center justify-center bg-neutral-950">
                    <span className="text-xs text-neutral-600">
                      {o.status === "failed" ? "❌ नहीं बना — " + (o.note || "") : "⏳ बन रहा है…"}
                    </span>
                  </div>
                )}

                {o.text && (
                  <p className="text-[11px] text-neutral-300 px-3 py-2 whitespace-pre-line line-clamp-4">
                    {o.text}
                  </p>
                )}

                {!job.chosen && o.status === "ready" && (
                  <button type="button" onClick={() => chuno(o.tone)} disabled={!!picking}
                    className="w-full py-2.5 text-sm font-bold text-white disabled:opacity-40"
                    style={{ background: accent }}>
                    {picking === o.tone ? "चुन रहे हैं…" : "✅ यही चुनें"}
                  </button>
                )}
              </div>
            ))}
          </div>

          {!job.chosen && banRahe === 0 && (
            <button type="button" onClick={sabHatao}
              className="w-full rounded-xl py-2.5 text-xs text-neutral-500 border border-neutral-800">
              कोई पसंद नहीं आया — तीनों हटा दें
            </button>
          )}

          {job.chosen && (
            <p className="text-[11px] text-neutral-600 text-center">
              🏠 आज में जाकर देख लीजिए, फिर "हाँ, भेज दो" दबाइए
            </p>
          )}
        </>
      )}
    </div>
  );
}
