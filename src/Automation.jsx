const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useEffect } from "react";

// ⚠️ पहले हर file में अपनी copy थी — अब brands.js से (एक जगह बदलो, हर जगह बदले)
import { BRAND_LABELS } from "./brands.js";

const MODES = [
  {
    v: "safe", icon: "🛡️", label: "Safe Mode",
    desc: "AI बनाएगा, आप देखकर approve करेंगे, तभी जाएगा",
    color: "border-emerald-600 bg-emerald-500/10 text-emerald-400",
  },
  {
    v: "semi", icon: "⚡", label: "Semi Auto",
    desc: "चुने हुए types अपने-आप जाएंगे, बाकी approve करने होंगे",
    color: "border-amber-600 bg-amber-500/10 text-amber-400",
  },
  {
    v: "full", icon: "🚀", label: "Full Auto",
    desc: "सब कुछ अपने-आप बनेगा और भेजा जाएगा",
    color: "border-red-600 bg-red-500/10 text-red-400",
  },
];

const TYPES = [
  { v: "suvichar", label: "💡 सुविचार" },
  { v: "festival", label: "🎉 त्यौहार" },
  { v: "vigyapan", label: "📣 विज्ञापन" },
  { v: "suchna",   label: "📌 सूचना" },
  { v: "gift",     label: "🎁 गिफ्ट" },
];

const CHANNELS = [
  { v: "fb", label: "Facebook" },
  { v: "ig", label: "Instagram" },
  { v: "wa", label: "WhatsApp" },
];

const inp = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-500 mt-1";

export default function Automation({ apiBase, token, brandId }) {
  const [scope, setScope] = useState(brandId || "vp_honda");
  const [s, setS] = useState(null);
  const [usage, setUsage] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  async function load() {
    setLoading(true); setNote("");
    try {
      const r = await fetch(`${apiBase}/api/automation/${scope}`, { headers: { Authorization: "Bearer " + token } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setS({ ...d.settings, autoTypes: d.settings.autoTypes || [], autoChannels: d.settings.autoChannels || ["fb", "ig"] });
      setUsage(d.usage);
      const hr = await fetch(`${apiBase}/api/automation/${scope}/usage-history`, { headers: { Authorization: "Bearer " + token } });
      const hd = await hr.json();
      setHistory(hd.items || []);
    } catch (e) { setNote("❌ " + e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [scope]);

  async function save() {
    vib(50); setBusy(true); setNote("");
    try {
      const r = await fetch(`${apiBase}/api/automation/${scope}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(s),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setNote("✅ सेव हो गया");
      vib([30, 30, 60]);
    } catch (e) { setNote("❌ " + e.message); }
    setBusy(false);
  }

  function toggleArr(field, val) {
    vib(15);
    setS(p => {
      const arr = p[field] || [];
      return { ...p, [field]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val] };
    });
  }

  const Bar = ({ used, limit, label, color }) => {
    const pct = limit ? Math.min(100, Math.round((used / limit) * 100)) : 0;
    return (
      <div>
        <div className="flex justify-between text-[11px] mb-1">
          <span className="text-neutral-400">{label}</span>
          <span className={pct >= 90 ? "text-red-400" : pct >= 70 ? "text-amber-400" : "text-neutral-400"}>
            {used} / {limit}
          </span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div className={`h-full ${pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-amber-500" : color}`} style={{ width: `${pct}%` }} />
        </div>
      </div>
    );
  };

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

      {note && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${note.startsWith("✅") ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/60 text-red-300"}`}>{note}</div>
      )}

      {loading && <p className="text-center text-xs text-neutral-500 py-4">लोड हो रहा है…</p>}

      {s && !loading && (
        <>
          {/* ── TODAY USAGE ── */}
          {usage && (
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
              <p className="text-sm font-bold text-white">📊 आज का इस्तेमाल</p>
              <Bar used={usage.aiCalls} limit={s.dailyAiLimit} label="🤖 AI calls" color="bg-blue-500" />
              <Bar used={usage.images} limit={s.dailyImageLimit} label="🖼️ Images" color="bg-purple-500" />
              <Bar used={usage.videos} limit={s.dailyVideoLimit} label="🎬 Videos" color="bg-emerald-500" />
              <p className="text-[10px] text-neutral-600">रोज़ आधी रात (IST) को reset होता है</p>
            </div>
          )}

          {/* ── MODE ── */}
          <div className="space-y-2">
            <p className="text-sm font-bold text-white px-1">🎛️ Automation Mode</p>
            {MODES.map(m => (
              <button key={m.v} type="button" onClick={() => { vib(20); setS(p => ({ ...p, mode: m.v })); }}
                className={`w-full rounded-2xl border-2 px-4 py-3 text-left active:opacity-70 ${s.mode === m.v ? m.color : "border-neutral-700 text-neutral-400"}`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{m.icon}</span>
                  <span className="font-bold text-sm">{m.label}</span>
                  {s.mode === m.v && <span className="ml-auto text-xs">✓</span>}
                </div>
                <p className="text-[11px] mt-1 opacity-80">{m.desc}</p>
              </button>
            ))}
          </div>

          {/* ── SEMI AUTO SETTINGS ── */}
          {s.mode === "semi" && (
            <div className="rounded-2xl bg-neutral-900 border border-amber-800 p-4 space-y-3">
              <p className="text-sm font-bold text-amber-400">⚡ कौन से अपने-आप जाएं</p>
              <div className="grid grid-cols-2 gap-1.5">
                {TYPES.map(t => (
                  <button key={t.v} type="button" onClick={() => toggleArr("autoTypes", t.v)}
                    className={`py-2 rounded-xl text-[11px] font-semibold border-2 ${(s.autoTypes || []).includes(t.v) ? "border-amber-500 bg-amber-500/10 text-amber-400" : "border-neutral-700 text-neutral-500"}`}>
                    {(s.autoTypes || []).includes(t.v) ? "✓ " : ""}{t.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-neutral-500">बाकी सब Review में आएंगे</p>
            </div>
          )}

          {/* ── CHANNELS (semi/full) ── */}
          {(s.mode === "semi" || s.mode === "full") && (
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-2">
              <p className="text-sm font-bold text-white">📱 कहाँ भेजें</p>
              <div className="grid grid-cols-3 gap-1.5">
                {CHANNELS.map(c => (
                  <button key={c.v} type="button" onClick={() => toggleArr("autoChannels", c.v)}
                    className={`py-2 rounded-xl text-[11px] font-semibold border-2 ${(s.autoChannels || []).includes(c.v) ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-neutral-700 text-neutral-500"}`}>
                    {(s.autoChannels || []).includes(c.v) ? "✓ " : ""}{c.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── LIMITS ── */}
          <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
            <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">💰 रोज़ की limits <span className="text-neutral-500">▼</span></summary>
            <div className="px-4 pb-4 space-y-2">
              <div>
                <p className="text-[11px] text-neutral-400">🤖 AI calls प्रति दिन</p>
                <input type="number" value={s.dailyAiLimit || 50} min={1} max={500}
                  onChange={e => setS(p => ({ ...p, dailyAiLimit: +e.target.value || 50 }))} className={inp} />
              </div>
              <div>
                <p className="text-[11px] text-neutral-400">🖼️ Images प्रति दिन</p>
                <input type="number" value={s.dailyImageLimit || 30} min={1} max={300}
                  onChange={e => setS(p => ({ ...p, dailyImageLimit: +e.target.value || 30 }))} className={inp} />
              </div>
              <div>
                <p className="text-[11px] text-neutral-400">🎬 Videos प्रति दिन</p>
                <input type="number" value={s.dailyVideoLimit || 5} min={1} max={50}
                  onChange={e => setS(p => ({ ...p, dailyVideoLimit: +e.target.value || 5 }))} className={inp} />
              </div>
              <p className="text-[10px] text-neutral-600">limit पूरी होने पर उस दिन और नहीं बनेगा — पैसे बचेंगे</p>
            </div>
          </details>

          {/* ── USAGE HISTORY ── */}
          {history.length > 0 && (
            <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
              <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">📈 पिछले दिन <span className="text-neutral-500">▼</span></summary>
              <div className="px-4 pb-4 space-y-1.5">
                {history.map(h => (
                  <div key={h._id} className="flex items-center justify-between bg-neutral-800 rounded-xl px-3 py-2">
                    <span className="text-[11px] text-neutral-400">{h.date}</span>
                    <span className="text-[11px] text-neutral-300">
                      🤖 {h.aiCalls || 0} · 🖼️ {h.images || 0} · 🎬 {h.videos || 0}
                    </span>
                  </div>
                ))}
              </div>
            </details>
          )}

          {/* Warning for full auto */}
          {s.mode === "full" && (
            <div className="rounded-xl bg-red-900/40 border border-red-800 px-4 py-3">
              <p className="text-xs text-red-300">
                ⚠️ Full Auto में सब कुछ बिना पूछे भेजा जाएगा। पहले कुछ दिन Safe या Semi mode में चलाकर देख लें कि content सही आ रहा है।
              </p>
            </div>
          )}

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
