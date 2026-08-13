const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useEffect } from "react";

const BRAND_LABELS = { vp_honda: "VP Honda", yakuza: "Yakuza EV", minimetro: "Mini Metro" };

const TONES = [
  { v: "friendly",    label: "😊 दोस्ताना" },
  { v: "professional",label: "👔 पेशेवर" },
  { v: "energetic",   label: "🔥 जोशीला" },
  { v: "devotional",  label: "🙏 भक्तिभाव" },
];
const LENGTHS = [
  { v: "short",  label: "छोटा (2-3 lines)" },
  { v: "medium", label: "मध्यम (4-6)" },
  { v: "long",   label: "विस्तृत (7-10)" },
];
const EMOJIS = [
  { v: "few",    label: "कम (1-2)" },
  { v: "normal", label: "सामान्य (3-4)" },
  { v: "many",   label: "भरपूर (6+)" },
];
const LANGS = [
  { v: "hindi",    label: "शुद्ध हिंदी" },
  { v: "hinglish", label: "Hinglish" },
];

const inp = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-500 mt-1";
const lbl = "text-[11px] text-neutral-400";

export default function BrandMemory({ apiBase, token, brandId }) {
  const [scope, setScope] = useState(brandId || "vp_honda");
  const [p, setP] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [fbText, setFbText] = useState("");

  async function load() {
    setLoading(true); setNote("");
    try {
      const r = await fetch(`${apiBase}/api/brand-profile/${scope}`, { headers: { Authorization: "Bearer " + token } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setP({ ...d, preferredBgStyles: d.preferredBgStyles || [], likedNotes: d.likedNotes || [], dislikedNotes: d.dislikedNotes || [] });
    } catch (e) { setNote("❌ " + e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [scope]);

  async function save() {
    vib(50); setBusy(true); setNote("");
    try {
      const r = await fetch(`${apiBase}/api/brand-profile/${scope}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(p),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setNote("✅ सेव हो गया — अब हर post में यही पसंद लगेगी");
      vib([30, 30, 60]);
    } catch (e) { setNote("❌ " + e.message); }
    setBusy(false);
  }

  async function addFeedback(liked) {
    if (!fbText.trim()) return;
    vib(40); setBusy(true);
    try {
      const r = await fetch(`${apiBase}/api/brand-profile/${scope}/feedback`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ liked, note: fbText.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setP(prev => ({ ...prev, likedNotes: d.doc.likedNotes || [], dislikedNotes: d.doc.dislikedNotes || [] }));
      setFbText("");
      setNote(liked ? "👍 याद रख लिया" : "👎 याद रख लिया — आगे ऐसा नहीं करेगा");
      vib([30, 30]);
    } catch (e) { setNote("❌ " + e.message); }
    setBusy(false);
  }

  async function removeNote(liked, idx) {
    vib(20);
    const field = liked ? "likedNotes" : "dislikedNotes";
    const next = (p[field] || []).filter((_, i) => i !== idx);
    setP(prev => ({ ...prev, [field]: next }));
    try {
      await fetch(`${apiBase}/api/brand-profile/${scope}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ ...p, [field]: next }),
      });
    } catch (_) {}
  }

  const F = (k) => ({ value: p?.[k] || "", onChange: (e) => setP(v => ({ ...v, [k]: e.target.value })) });
  const Pick = ({ field, options }) => (
    <div className="grid grid-cols-2 gap-1.5">
      {options.map(o => (
        <button key={o.v} type="button" onClick={() => { vib(15); setP(v => ({ ...v, [field]: o.v })); }}
          className={`py-2 rounded-xl text-[11px] font-semibold border-2 ${p?.[field] === o.v ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-neutral-700 text-neutral-400"}`}>
          {o.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-3 pb-10">

      {/* Brand picker */}
      <div className="grid grid-cols-3 gap-1.5">
        {Object.entries(BRAND_LABELS).map(([id, label]) => (
          <button key={id} type="button" onClick={() => { vib(15); setScope(id); }}
            className={`py-2.5 rounded-xl text-xs font-semibold border-2 ${scope === id ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-neutral-700 text-neutral-400"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-blue-900/30 border border-blue-800 px-3 py-2">
        <p className="text-[11px] text-blue-300">
          💡 एक बार भर दें — AI हर post में यही tone, लंबाई और पसंद इस्तेमाल करेगा। बार-बार बताना नहीं पड़ेगा।
        </p>
      </div>

      {note && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
          note.startsWith("✅") || note.startsWith("👍") || note.startsWith("👎")
            ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/60 text-red-300"}`}>{note}</div>
      )}

      {loading && <p className="text-center text-xs text-neutral-500 py-4">लोड हो रहा है…</p>}

      {p && !loading && (
        <>
          {/* ── BUSINESS INFO ── */}
          <details className="bg-neutral-900 rounded-2xl border border-neutral-800" open>
            <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🏢 Business जानकारी <span className="text-neutral-500">▼</span></summary>
            <div className="px-4 pb-4 space-y-2">
              <div><p className={lbl}>दिखने वाला नाम</p><input {...F("displayName")} className={inp} placeholder="VP Honda" /></div>
              <div><p className={lbl}>Tagline</p><input {...F("tagline")} className={inp} placeholder="हमारा साथ, आपका विश्वास" /></div>
              <div><p className={lbl}>पता</p><input {...F("address")} className={inp} placeholder="परवलिया सड़क, भोपाल" /></div>
              <div className="grid grid-cols-2 gap-2">
                <div><p className={lbl}>फ़ोन</p><input {...F("phone")} className={inp} placeholder="9713394738" /></div>
                <div><p className={lbl}>WhatsApp</p><input {...F("whatsapp")} className={inp} placeholder="9713394738" /></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><p className={lbl}>Instagram</p><input {...F("igHandle")} className={inp} placeholder="@vp_honda" /></div>
                <div><p className={lbl}>Facebook</p><input {...F("fbHandle")} className={inp} placeholder="VPHondaBhopal" /></div>
              </div>
            </div>
          </details>

          {/* ── AI TONE ── */}
          <details className="bg-neutral-900 rounded-2xl border border-neutral-800" open>
            <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🎭 AI कैसे लिखे <span className="text-neutral-500">▼</span></summary>
            <div className="px-4 pb-4 space-y-3">
              <div><p className={lbl + " mb-1.5"}>अंदाज़ (Tone)</p><Pick field="tone" options={TONES} /></div>
              <div><p className={lbl + " mb-1.5"}>लंबाई</p><Pick field="textLength" options={LENGTHS} /></div>
              <div><p className={lbl + " mb-1.5"}>Emojis</p><Pick field="emojiLevel" options={EMOJIS} /></div>
              <div><p className={lbl + " mb-1.5"}>भाषा</p><Pick field="language" options={LANGS} /></div>
            </div>
          </details>

          {/* ── RULES ── */}
          <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
            <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">📏 नियम <span className="text-neutral-500">▼</span></summary>
            <div className="px-4 pb-4 space-y-2">
              <div>
                <p className={lbl}>हर post में यह ज़रूर हो</p>
                <textarea {...F("alwaysInclude")} rows={2} className={inp + " resize-none"} placeholder="जैसे: showroom का नाम और फ़ोन नंबर" />
              </div>
              <div>
                <p className={lbl}>यह कभी मत लिखो</p>
                <textarea {...F("neverInclude")} rows={2} className={inp + " resize-none"} placeholder="जैसे: दूसरे dealers का नाम, guarantee के दावे" />
              </div>
              <div><p className={lbl}>Disclaimer</p><input {...F("disclaimer")} className={inp} placeholder="*नियम व शर्तें लागू" /></div>
            </div>
          </details>

          {/* ── LEARNING ── */}
          <details className="bg-neutral-900 rounded-2xl border border-neutral-800" open>
            <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">
              🧠 AI को सिखाएं ({(p.likedNotes?.length || 0) + (p.dislikedNotes?.length || 0)}) <span className="text-neutral-500">▼</span>
            </summary>
            <div className="px-4 pb-4 space-y-3">
              <p className="text-[11px] text-neutral-500">
                जो पसंद आए या न आए, यहाँ लिख दें — AI आगे से याद रखेगा
              </p>
              <textarea value={fbText} onChange={e => setFbText(e.target.value)} rows={2} className={inp + " resize-none"}
                placeholder="जैसे: 'Text कम रखो' या 'लाल रंग अच्छा लगता है'" />
              <div className="grid grid-cols-2 gap-2">
                <button type="button" onClick={() => addFeedback(true)} disabled={busy || !fbText.trim()}
                  className="py-2.5 rounded-xl text-xs font-bold border-2 border-emerald-700 text-emerald-400 disabled:opacity-40">
                  👍 यह पसंद है
                </button>
                <button type="button" onClick={() => addFeedback(false)} disabled={busy || !fbText.trim()}
                  className="py-2.5 rounded-xl text-xs font-bold border-2 border-red-800 text-red-400 disabled:opacity-40">
                  👎 यह पसंद नहीं
                </button>
              </div>

              {p.likedNotes?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-emerald-400">👍 पसंद</p>
                  {p.likedNotes.map((n, i) => (
                    <div key={i} className="flex items-start gap-2 bg-emerald-900/20 border border-emerald-900 rounded-lg px-2.5 py-1.5">
                      <p className="text-[11px] text-neutral-300 flex-1">{n}</p>
                      <button type="button" onClick={() => removeNote(true, i)} className="text-neutral-500 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}

              {p.dislikedNotes?.length > 0 && (
                <div className="space-y-1">
                  <p className="text-[11px] font-bold text-red-400">👎 पसंद नहीं</p>
                  {p.dislikedNotes.map((n, i) => (
                    <div key={i} className="flex items-start gap-2 bg-red-900/20 border border-red-900 rounded-lg px-2.5 py-1.5">
                      <p className="text-[11px] text-neutral-300 flex-1">{n}</p>
                      <button type="button" onClick={() => removeNote(false, i)} className="text-neutral-500 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </details>

          <button type="button" onClick={save} disabled={busy}
            className="w-full rounded-2xl py-4 text-base font-bold text-black disabled:opacity-40"
            style={{ background: "#FFD600" }}>
            {busy ? "सेव कर रहे…" : "💾 सेव करें"}
          </button>
        </>
      )}
    </div>
  );
}
