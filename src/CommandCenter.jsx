// ============================================================================
//  CommandCenter.jsx — एक बात कहिए, सब कुछ यहीं बन जाए
//  ---------------------------------------------------------------------------
//  ⚠️ अब तक हर काम के लिए अलग पन्ना खोलना पड़ता था। यह वही "एक जगह से सब"
//     वाला पर्दा है जिसकी तीनों सलाहों में बात थी।
//
//     ऊपर एक डिब्बा → बोलिए या लिखिए
//     नीचे 8 कार्ड   → हर एक अपने आप बनता जाता है, आँखों के सामने
//     आख़िर में       → जहाँ-जहाँ भेजना है, चुनकर एक साथ भेज दीजिए
//
//  ⚠️ जो नहीं बन सकता वह भी साफ़ दिखता है (Reel, ग्राहक को जवाब) — झूठा
//     वादा करने से अच्छा है सच बता देना।
//
//  Studio.jsx में सबसे ऊपर लगाइए:
//      import CommandCenter from "./CommandCenter.jsx";
//      <CommandCenter apiBase={apiBase} token={token} brandId={brandId}
//                     accent={accent} onDone={onChange} />
// ============================================================================

import React, { useState, useEffect, useRef } from "react";

const vib = (ms = 30) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// कौन-सा output कहाँ भेजा जा सकता है
const SEND = {
  caption_ig: { platform: "ig", label: "Instagram" },
  caption_fb: { platform: "fb", label: "Facebook" },
  caption_wa: { platform: "wa", label: "WhatsApp" },
  gbp:        { platform: "gbp", label: "Google Business" },
};

const NAMUNE = [
  "आज Shine 100 DX पर ₹5,000 की छूट",
  "गणेश चतुर्थी की बधाई",
  "Activa 125 का मेगा ऑफर — फ्री हेलमेट",
  "कल शोरूम बंद रहेगा",
];

export default function CommandCenter({ apiBase, token, brandId, accent = "#E4002B", onDone }) {
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const [listening, setListening] = useState(false);
  const [camp, setCamp] = useState(null);
  const [err, setErr] = useState("");
  const [pick, setPick] = useState({ ig: true, fb: true, wa: false, gbp: false });
  const [sending, setSending] = useState(false);
  const [open, setOpen] = useState(null);      // कौन-सा कार्ड खुला है
  const pollRef = useRef(null);

  const auth = { "Content-Type": "application/json", Authorization: "Bearer " + token };
  const full = (u) => (u ? (u.startsWith("http") ? u : apiBase + u) : "");

  // बनते ही पीछा करो — हर 2 सेकंड
  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  function bolo() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setErr("इस phone में बोलकर लिखना नहीं चलता — टाइप कर दीजिए"); return; }
    try {
      const r = new SR();
      r.lang = "hi-IN"; r.interimResults = false;
      r.onresult = (e) => { setTxt(e.results[0][0].transcript); setListening(false); };
      r.onerror = () => { setListening(false); setErr("सुनाई नहीं दिया, दोबारा बोलिए"); };
      r.onend = () => setListening(false);
      setErr(""); setListening(true); vib(20); r.start();
    } catch (e) { setListening(false); setErr(e.message); }
  }

  async function banao() {
    if (!txt.trim()) return;
    vib(50); setBusy(true); setErr(""); setCamp(null); setOpen(null);
    if (pollRef.current) clearInterval(pollRef.current);

    try {
      const r = await fetch(`${apiBase}/api/campaign/one-in`, {
        method: "POST", headers: auth,
        body: JSON.stringify({ command: txt.trim(), brand: brandId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "नहीं बना");
      setCamp(d);
      setBusy(false);

      // ⚠️ server पीछे-पीछे बनाता रहता है, इसलिए हर 2 सेकंड हाल पूछते हैं।
      //    पूरा हो जाए या 90 सेकंड बीत जाएँ, तो रुक जाते हैं।
      let n = 0;
      pollRef.current = setInterval(async () => {
        n++;
        try {
          const rr = await fetch(`${apiBase}/api/campaign/one-in/${d.id}`, { headers: auth });
          const dd = await rr.json();
          if (rr.ok) setCamp((p) => ({ ...p, ...dd }));
          if ((dd.status && dd.status !== "building") || n > 45) {
            clearInterval(pollRef.current); pollRef.current = null;
            onDone && onDone();
          }
        } catch (_) {}
      }, 2000);
    } catch (e) { setErr(e.message); setBusy(false); }
  }

  async function bhejo() {
    if (!camp?.id) return;
    const chosen = Object.entries(pick).filter(([, v]) => v).map(([k]) => k);
    if (!chosen.length) { setErr("पहले चुनिए कि कहाँ भेजना है"); return; }
    vib(50); setSending(true); setErr("");
    try {
      const r = await fetch(`${apiBase}/api/campaign/one-in/${camp.id}/publish`, {
        method: "POST", headers: auth,
        body: JSON.stringify({ platforms: pick }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "नहीं गया");
      const gaye = (d.results || []).filter((x) => x.ok).map((x) => x.platform);
      const ruke = (d.results || []).filter((x) => !x.ok);
      setErr("");
      alert(gaye.length
        ? `✅ भेज दिया — ${gaye.join(", ")}` + (ruke.length ? `\n\n⚠️ नहीं गया: ${ruke.map((x) => x.platform + " (" + x.error + ")").join(", ")}` : "")
        : `❌ कहीं नहीं गया\n${ruke.map((x) => x.platform + ": " + x.error).join("\n")}`);
      onDone && onDone();
    } catch (e) { setErr(e.message); }
    setSending(false);
  }

  const outs = camp?.outputs || [];
  const banRahe = outs.filter((o) => o.status === "pending").length;
  const taiyar = outs.filter((o) => o.status === "ready").length;

  const isImg = (k) => ["poster", "story", "landscape"].includes(k);

  return (
    <div className="space-y-3">

      {/* ── ऊपर: एक ही डिब्बा ────────────────────────────── */}
      <div className="rounded-2xl bg-neutral-900 border-2 p-3 space-y-2" style={{ borderColor: accent + "66" }}>
        <p className="text-xs font-bold" style={{ color: accent }}>आज क्या प्रचार करना है?</p>

        <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={2}
          placeholder={'लिखिए या बोलिए —\n"आज Shine 100 DX पर ₹5,000 की छूट"'}
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
            {busy ? "…" : "✨ सब बनाओ"}
          </button>
        </div>

        {!camp && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {NAMUNE.map((x, i) => (
              <button key={i} type="button" onClick={() => { vib(15); setTxt(x); }}
                className="flex-shrink-0 text-[10px] px-2.5 py-1.5 rounded-full border border-neutral-700 text-neutral-500">
                {x}
              </button>
            ))}
          </div>
        )}
      </div>

      {err && <div className="rounded-lg bg-red-900/50 border border-red-800 text-red-300 text-xs px-3 py-2">{err}</div>}

      {/* ── बीच: सब कुछ बनता हुआ ──────────────────────────── */}
      {camp && (
        <>
          <div className="rounded-xl px-3 py-2" style={{ background: accent + "14", border: `1px solid ${accent}44` }}>
            <p className="text-[11px]" style={{ color: accent }}>
              {banRahe > 0
                ? `⏳ ${taiyar}/${outs.length} तैयार — बाक़ी बन रहे हैं…`
                : `✅ सब तैयार (${taiyar})`}
            </p>
            {camp.vehicle && (
              <p className="text-[10px] text-neutral-500 mt-0.5">
                गाड़ी: {camp.vehicle} · क़ीमत आपकी सूची से ली गई है
              </p>
            )}
          </div>

          {/* तस्वीरें */}
          <div className="grid grid-cols-3 gap-2">
            {outs.filter((o) => isImg(o.kind)).map((o) => (
              <div key={o.kind} className="rounded-xl bg-neutral-900 border border-neutral-800 overflow-hidden">
                {o.status === "ready" && o.url ? (
                  <img src={full(o.url)} alt="" className="w-full h-24 object-cover" />
                ) : (
                  <div className="w-full h-24 flex items-center justify-center bg-neutral-950">
                    <span className="text-[10px] text-neutral-600">
                      {o.status === "failed" ? "❌ नहीं बना" : "⏳"}
                    </span>
                  </div>
                )}
                <p className="text-[9px] text-neutral-400 text-center py-1 px-1 truncate">{o.label}</p>
              </div>
            ))}
          </div>

          {/* लिखाई वाले */}
          <div className="space-y-2">
            {outs.filter((o) => !isImg(o.kind)).map((o) => (
              <div key={o.kind} className="rounded-xl bg-neutral-900 border border-neutral-800 p-2.5">
                <button type="button" onClick={() => { vib(15); setOpen(open === o.kind ? null : o.kind); }}
                  className="w-full flex items-center gap-2 text-left">
                  <span className="text-sm flex-1 text-neutral-200">{o.label}</span>
                  {SEND[o.kind] && (
                    <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                      style={pick[SEND[o.kind].platform]
                        ? { background: accent + "22", color: accent }
                        : { background: "#26262622", color: "#666" }}>
                      {pick[SEND[o.kind].platform] ? "भेजेंगे" : "नहीं"}
                    </span>
                  )}
                  <span className="text-[10px]" style={{
                    color: o.status === "ready" ? "#34D399" : o.status === "failed" ? "#F87171" : "#737373",
                  }}>
                    {o.status === "ready" ? "✓" : o.status === "failed" ? "✕" : "⏳"}
                  </span>
                  <span className="text-neutral-600 text-xs">{open === o.kind ? "−" : "+"}</span>
                </button>

                {open === o.kind && (
                  <div className="mt-2 pt-2 border-t border-neutral-800 space-y-2">
                    {o.text ? (
                      <p className="text-[11px] text-neutral-300 whitespace-pre-line">{o.text}</p>
                    ) : (
                      <p className="text-[11px] text-neutral-600">{o.note || "अभी बन रहा है…"}</p>
                    )}
                    {o.text && (
                      <button type="button" onClick={() => {
                        vib(20); navigator.clipboard?.writeText(o.text);
                        alert("copy हो गया");
                      }} className="text-[10px] px-2.5 py-1 rounded-lg border border-neutral-700 text-neutral-400">
                        📋 copy
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── जो नहीं बन सकता — साफ़ बता दो ── */}
          {camp.notPossible?.length > 0 && (
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-2.5">
              <p className="text-[10px] text-neutral-500 mb-1.5">यह अपने आप नहीं बन सकता:</p>
              {camp.notPossible.map((n) => (
                <p key={n.id} className="text-[10px] text-neutral-600 leading-relaxed">
                  <span className="text-neutral-400">{n.label}</span> — {n.why}
                </p>
              ))}
            </div>
          )}

          {/* ── नीचे: कहाँ-कहाँ भेजना है ── */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 space-y-2.5">
            <p className="text-xs font-bold text-white">कहाँ भेजना है?</p>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(SEND).map(([kind, s]) => (
                <button key={kind} type="button"
                  onClick={() => { vib(15); setPick((p) => ({ ...p, [s.platform]: !p[s.platform] })); }}
                  className="rounded-lg py-2 text-xs border"
                  style={{
                    borderColor: pick[s.platform] ? accent : "#333",
                    background: pick[s.platform] ? accent + "18" : "transparent",
                    color: pick[s.platform] ? accent : "#777",
                  }}>
                  {pick[s.platform] ? "✓ " : ""}{s.label}
                </button>
              ))}
            </div>

            <button type="button" onClick={bhejo} disabled={sending || banRahe > 0}
              className="w-full rounded-xl py-3 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: accent }}>
              {sending ? "भेज रहे हैं…" : banRahe > 0 ? "बनने का इंतज़ार…" : "📤 चुनी हुई जगह भेज दो"}
            </button>

            <p className="text-[10px] text-neutral-600 leading-relaxed">
              भेजने से पहले 🏠 आज में जाकर एक नज़र डाल लीजिए — वहाँ से भी भेज सकते हैं।
            </p>
          </div>
        </>
      )}
    </div>
  );
}
