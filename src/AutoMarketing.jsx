const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState } from "react";

const BRAND_LABELS = { vp_honda: "VP Honda", yakuza: "Yakuza EV", minimetro: "Mini Metro" };
const TYPE_LABELS = { suvichar: "सुविचार", vigyapan: "विज्ञापन", festival: "त्यौहार", suchna: "सूचना", gift: "गिफ्ट" };
const TYPE_ICON = { suvichar: "💡", vigyapan: "📣", festival: "🎉", suchna: "📌", gift: "🎁" };

const DAY_OPTIONS = [
  { d: 1, label: "आज" },
  { d: 3, label: "3 दिन" },
  { d: 7, label: "7 दिन" },
  { d: 14, label: "14 दिन" },
];

const inp = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-500 mt-1";

export default function AutoMarketing({ apiBase, token, brandId, onSent }) {
  const [selBrands, setSelBrands] = useState([brandId || "vp_honda"]);
  const [days, setDays] = useState(1);
  const [notes, setNotes] = useState("");

  const [planning, setPlanning] = useState(false);
  const [plan, setPlan] = useState(null);
  const [summary, setSummary] = useState("");
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [note, setNote] = useState("");

  function toggleBrand(id) {
    vib(15);
    setSelBrands(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  }

  async function makePlan() {
    if (!selBrands.length) { setNote("⚠️ कम से कम एक brand चुनें"); return; }
    vib(50); setPlanning(true); setNote(""); setPlan(null); setResult(null);
    try {
      const res = await fetch(apiBase + "/api/auto-marketing/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ brands: selBrands, days, notes: notes.trim() || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setPlan(data.plan || []);
      setSummary(data.summary_hindi || "");
      vib([30, 30, 60]);
    } catch (e) { setNote("❌ " + e.message); }
    setPlanning(false);
  }

  function removeItem(idx) {
    vib(15);
    setPlan(prev => prev.filter((_, i) => i !== idx));
  }

  async function execute() {
    if (!plan?.length) return;
    vib(60); setExecuting(true); setNote("");
    try {
      const res = await fetch(apiBase + "/api/auto-marketing/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setResult(data);
      setPlan(null);
      setNote(`✅ ${data.created?.length || 0} posts schedule हो गए${data.failed?.length ? ` · ${data.failed.length} fail` : ""}`);
      vib([30, 30, 60]);
      if (onSent) onSent();
    } catch (e) { setNote("❌ " + e.message); }
    setExecuting(false);
  }

  // दिन के हिसाब से group करो
  const grouped = {};
  (plan || []).forEach((p, idx) => {
    const k = p.date || "अन्य";
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push({ ...p, __idx: idx });
  });
  const dayKeys = Object.keys(grouped).sort();

  return (
    <div className="space-y-3 pb-10">

      {/* ── SETUP ── */}
      {!plan && (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-4">
          <div>
            <p className="text-sm font-bold text-white mb-2">🏷️ कौन से brands?</p>
            <div className="grid grid-cols-3 gap-2">
              {Object.entries(BRAND_LABELS).map(([id, label]) => (
                <button key={id} type="button" onClick={() => toggleBrand(id)}
                  className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition ${
                    selBrands.includes(id)
                      ? "border-yellow-500 bg-yellow-500/10 text-yellow-400"
                      : "border-neutral-700 text-neutral-400"
                  }`}>
                  {selBrands.includes(id) ? "✓ " : ""}{label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-white mb-2">📅 कितने दिन का?</p>
            <div className="grid grid-cols-4 gap-2">
              {DAY_OPTIONS.map(o => (
                <button key={o.d} type="button" onClick={() => { vib(15); setDays(o.d); }}
                  className={`py-2.5 rounded-xl text-xs font-semibold border-2 transition ${
                    days === o.d ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-neutral-700 text-neutral-400"
                  }`}>
                  {o.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-bold text-white">📝 कोई खास बात? (optional)</p>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} className={inp + " resize-none"}
              placeholder="जैसे: इस हफ्ते Activa पर ज़ोर दो, या दिवाली की तैयारी शुरू करो" />
          </div>

          <button type="button" onClick={makePlan} disabled={planning || !selBrands.length}
            className="w-full rounded-2xl py-4 text-base font-bold text-black disabled:opacity-40"
            style={{ background: "#FFD600" }}>
            {planning ? "🤖 Plan बना रहे हैं…" : "🚀 Auto Marketing शुरू करें"}
          </button>

          <p className="text-[11px] text-neutral-500 text-center">
            AI पूरा content plan बनाएगा — आप देखकर approve करें, फिर सब अपने-आप तैयार होकर Review में आ जाएगा
          </p>
        </div>
      )}

      {note && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
          note.startsWith("✅") ? "bg-emerald-900/60 text-emerald-300"
          : note.startsWith("⚠️") ? "bg-amber-900/50 text-amber-300"
          : "bg-red-900/60 text-red-300"}`}>
          {note}
        </div>
      )}

      {/* ── PLAN PREVIEW ── */}
      {plan && plan.length > 0 && (
        <>
          {summary && (
            <div className="rounded-2xl bg-neutral-800 border border-neutral-700 px-4 py-3">
              <p className="text-xs text-neutral-300 leading-relaxed">🤖 {summary}</p>
            </div>
          )}

          <div className="flex items-center justify-between px-1">
            <p className="text-sm font-bold text-yellow-400">📋 Plan ({plan.length} posts)</p>
            <button type="button" onClick={() => { vib(15); setPlan(null); }} className="text-xs text-neutral-400 underline">बदलें</button>
          </div>

          {dayKeys.map(dk => (
            <div key={dk} className="space-y-1.5">
              <p className="text-[11px] font-semibold text-neutral-500 px-1">
                📅 {dk} · {grouped[dk].length} posts
              </p>
              {grouped[dk].map(item => (
                <div key={item.__idx} className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 flex items-start gap-2">
                  <span className="text-lg flex-shrink-0">{TYPE_ICON[item.type] || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                        {BRAND_LABELS[item.brand] || item.brand}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                        {TYPE_LABELS[item.type] || item.type}
                      </span>
                      <span className="text-[10px] text-yellow-400">⏰ {item.time}</span>
                    </div>
                    <p className="text-sm text-white mt-1">{item.topic_hindi}</p>
                    {item.reason_hindi && <p className="text-[10px] text-neutral-500 mt-0.5">{item.reason_hindi}</p>}
                  </div>
                  <button type="button" onClick={() => removeItem(item.__idx)}
                    className="text-red-400 text-xs px-1.5 py-1 flex-shrink-0">✕</button>
                </div>
              ))}
            </div>
          ))}

          <div className="sticky bottom-2 pt-2">
            <button type="button" onClick={execute} disabled={executing}
              className="w-full rounded-2xl py-4 text-base font-bold text-black disabled:opacity-40 shadow-lg"
              style={{ background: "#FFD600" }}>
              {executing ? "⏳ Schedule कर रहे हैं…" : `✅ सब Schedule करें (${plan.length})`}
            </button>
          </div>
        </>
      )}

      {/* ── RESULT ── */}
      {result && (
        <div className="rounded-2xl bg-neutral-900 border border-emerald-700 p-4 space-y-2">
          <p className="text-sm font-bold text-emerald-400">✅ हो गया!</p>
          <p className="text-xs text-neutral-300">
            {result.created?.length || 0} posts schedule हो गए। तय समय पर अपने-आप तैयार होकर Review में आ जाएंगे।
          </p>
          {result.failed?.length > 0 && (
            <details className="mt-2">
              <summary className="text-xs text-red-400 cursor-pointer">{result.failed.length} fail हुए — देखें</summary>
              <div className="mt-1.5 space-y-1">
                {result.failed.map((f, i) => (
                  <p key={i} className="text-[10px] text-neutral-500">{f.item?.topic_hindi || "?"} — {f.reason}</p>
                ))}
              </div>
            </details>
          )}
          <button type="button" onClick={() => { vib(20); setResult(null); setNote(""); }}
            className="w-full mt-2 py-2.5 rounded-xl border border-neutral-700 text-sm text-neutral-300">
            नया plan बनाएं
          </button>
        </div>
      )}
    </div>
  );
}
