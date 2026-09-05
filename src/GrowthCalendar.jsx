// ============================================================================
//  GrowthCalendar.jsx — महीने भर का प्रचार, एक नज़र में
//  ---------------------------------------------------------------------------
//  अभी तक app बता रहा था "क्या भेजा जा चुका है"।
//  यह बताता है "किस दिन कुछ नहीं भेजा" — क्योंकि ग्राहक वहीं छूटता है।
//
//  App.jsx में जोड़ें:
//      import GrowthCalendar from "./GrowthCalendar.jsx";
//      ...
//      {tab === "calendar" && (
//        <GrowthCalendar apiBase={API_BASE} token={TOKEN} brandId={brandId}
//                        accent={brand.accent} onChange={load} />
//      )}
//  और TABS में जोड़ें:  ["calendar", "🗓️ कैलेंडर"]
// ============================================================================

import React, { useEffect, useMemo, useState } from "react";

const vib = (ms = 30) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

const DAY_SHORT = ["र", "सो", "मं", "बु", "गु", "शु", "श"];
const MONTH_HI = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून",
                  "जुलाई", "अगस्त", "सितम्बर", "अक्टूबर", "नवम्बर", "दिसम्बर"];

const KIND = {
  scheduled: { dot: "#F59E0B", label: "तय है", icon: "⏰" },
  sent:      { dot: "#10B981", label: "गई",    icon: "✓"  },
  failed:    { dot: "#EF4444", label: "नहीं गई", icon: "!" },
};

const ymd = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, "0")}-${String(x.getDate()).padStart(2, "0")}`;
};
const todayKey = () => ymd(new Date());

export default function GrowthCalendar({ apiBase, token, brandId, accent = "#E4002B", onChange }) {
  const [cursor, setCursor] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [openDay, setOpenDay] = useState(null);      // "YYYY-MM-DD"
  const [picking, setPicking] = useState(null);      // { dayKey, hour }
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  const hdr = { Authorization: "Bearer " + token, "Content-Type": "application/json" };

  const range = useMemo(() => {
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59);
    return { from, to };
  }, [cursor]);

  async function load() {
    setLoading(true); setErr("");
    try {
      const u = `${apiBase}/api/calendar?brand=${brandId}&from=${range.from.toISOString()}&to=${range.to.toISOString()}`;
      const r = await fetch(u, { headers: hdr });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "कैलेंडर नहीं खुला");
      setData(d);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [brandId, cursor]);

  function flash(m) { setToast(m); setTimeout(() => setToast(""), 3500); }

  // दिन → उस दिन की सारी posts
  const byDay = useMemo(() => {
    const m = {};
    for (const e of data?.events || []) {
      const k = ymd(e.at);
      (m[k] = m[k] || []).push(e);
    }
    return m;
  }, [data]);

  // महीने का grid — पहले हफ़्ते के खाली खाने समेत
  const cells = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();
    const pad = first.getDay();
    const out = Array.from({ length: pad }, () => null);
    for (let i = 1; i <= days; i++) out.push(new Date(cursor.getFullYear(), cursor.getMonth(), i));
    return out;
  }, [cursor]);

  const emptySet = useMemo(() => new Set(data?.emptyDays || []), [data]);
  const monthGaps = (data?.emptyDays || []).filter((d) => d.startsWith(ymd(range.from).slice(0, 7)));

  async function schedulePost(contentId, dayKey, hour) {
    setSaving(true);
    try {
      const runAt = new Date(`${dayKey}T${String(hour).padStart(2, "0")}:00:00`);
      const r = await fetch(`${apiBase}/api/schedule`, {
        method: "POST", headers: hdr,
        body: JSON.stringify({ brand: brandId, refId: contentId, kind: "content", runAt: runAt.toISOString() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "तय नहीं हो पाया");
      flash(`✓ ${new Date(runAt).toLocaleString("hi-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} पर जाएगी`);
      setPicking(null);
      await load(); onChange && onChange();
    } catch (e) { flash("✗ " + e.message); }
    setSaving(false);
  }

  async function cancelSchedule(id) {
    if (!confirm("यह तय की गई post रोक दें?")) return;
    try {
      await fetch(`${apiBase}/api/schedule/${id}`, {
        method: "PATCH", headers: hdr, body: JSON.stringify({ status: "cancelled" }),
      });
      flash("रोक दी गई"); await load(); onChange && onChange();
    } catch (e) { flash("✗ " + e.message); }
  }

  const bt = data?.bestTimes;

  return (
    <div className="space-y-3">

      {/* ── महीना बदलें ─────────────────────────────────────────── */}
      <div className="flex items-center justify-between rounded-2xl bg-neutral-900 border border-neutral-800 px-2 py-2">
        <button onClick={() => { vib(); setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)); }}
          className="px-3 py-2 text-neutral-400 text-lg">‹</button>
        <div className="text-center">
          <div className="text-sm font-semibold text-neutral-100">
            {MONTH_HI[cursor.getMonth()]} {cursor.getFullYear()}
          </div>
          <button onClick={() => { const d = new Date(); d.setDate(1); setCursor(d); }}
            className="text-[11px] text-neutral-500 underline">आज पर आएँ</button>
        </div>
        <button onClick={() => { vib(); setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1)); }}
          className="px-3 py-2 text-neutral-400 text-lg">›</button>
      </div>

      {err && <div className="text-sm bg-red-950/60 border border-red-800 text-red-200 rounded-lg px-3 py-2">{err}</div>}
      {toast && <div className="text-sm rounded-lg px-3 py-2 border" style={{ borderColor: accent, color: "#e5e5e5", background: accent + "18" }}>{toast}</div>}

      {/* ── सबसे ज़रूरी बात सबसे ऊपर: कितने दिन खाली गए ─────────── */}
      {monthGaps.length > 0 && (
        <div className="rounded-2xl border p-4" style={{ borderColor: accent + "55", background: accent + "12" }}>
          <div className="text-2xl font-bold" style={{ color: accent }}>{monthGaps.length} दिन खाली</div>
          <p className="text-sm text-neutral-300 mt-1 leading-relaxed">
            इन दिनों आपके शोरूम की कोई post नहीं जाएगी। जो दुकान रोज़ दिखती है,
            ग्राहक उसी को याद रखता है। नीचे नारंगी घेरे वाले दिन दबाकर post तय कर दें।
          </p>
        </div>
      )}

      {/* ── कैलेंडर grid ───────────────────────────────────────── */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
        <div className="grid grid-cols-7 gap-1 mb-1">
          {DAY_SHORT.map((d, i) => (
            <div key={i} className="text-center text-[10px] text-neutral-600 py-1">{d}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <div key={i} />;
            const k = ymd(d);
            const items = byDay[k] || [];
            const isToday = k === todayKey();
            const isPast = new Date(k) < new Date(todayKey());
            const isGap = emptySet.has(k) && !isPast;

            return (
              <button key={k}
                onClick={() => { vib(15); setOpenDay(openDay === k ? null : k); }}
                className="aspect-square rounded-lg flex flex-col items-center justify-center relative transition"
                style={{
                  background: openDay === k ? accent + "30" : isPast ? "#141414" : "#1c1c1c",
                  border: isToday ? `1.5px solid ${accent}`
                        : isGap ? "1.5px dashed #F59E0B66" : "1px solid #262626",
                  opacity: isPast && !items.length ? 0.4 : 1,
                }}>
                <span className="text-xs" style={{ color: isToday ? accent : "#a3a3a3", fontWeight: isToday ? 700 : 400 }}>
                  {d.getDate()}
                </span>
                {items.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {items.slice(0, 3).map((e, j) => (
                      <span key={j} className="w-1 h-1 rounded-full" style={{ background: KIND[e.kind]?.dot || "#666" }} />
                    ))}
                  </div>
                )}
                {items.length > 3 && <span className="text-[8px] text-neutral-600 leading-none">+{items.length - 3}</span>}
                {isGap && items.length === 0 && <span className="text-[9px] text-amber-500/70 leading-none mt-0.5">+</span>}
              </button>
            );
          })}
        </div>

        <div className="flex gap-3 mt-3 pt-2 border-t border-neutral-800 text-[10px] text-neutral-500 flex-wrap">
          {Object.entries(KIND).map(([k, v]) => (
            <span key={k} className="flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: v.dot }} />{v.label}
            </span>
          ))}
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded border border-dashed border-amber-500/60" />खाली — मौक़ा
          </span>
        </div>
      </div>

      {/* ── चुने हुए दिन का ब्यौरा ─────────────────────────────── */}
      {openDay && (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-neutral-200">
              {new Date(openDay).toLocaleDateString("hi-IN", { day: "numeric", month: "long", weekday: "long" })}
            </h3>
            <button onClick={() => setOpenDay(null)} className="text-neutral-600 text-lg leading-none px-1">×</button>
          </div>

          {(byDay[openDay] || []).length === 0 ? (
            <p className="text-sm text-neutral-500 mb-3">इस दिन कुछ तय नहीं है।</p>
          ) : (
            <div className="space-y-2 mb-3">
              {(byDay[openDay] || []).map((e) => (
                <div key={e.id} className="flex gap-2.5 items-start rounded-xl bg-neutral-950 border border-neutral-800 p-2">
                  {e.img
                    ? <img src={e.img.startsWith("/") ? apiBase + e.img : e.img} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    : <div className="w-12 h-12 rounded-lg bg-neutral-800 flex items-center justify-center text-lg flex-shrink-0">📝</div>}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full font-semibold"
                        style={{ background: (KIND[e.kind]?.dot || "#555") + "25", color: KIND[e.kind]?.dot }}>
                        {KIND[e.kind]?.icon} {KIND[e.kind]?.label}
                      </span>
                      <span className="text-[10px] text-neutral-600">
                        {new Date(e.at).toLocaleTimeString("hi-IN", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-300 line-clamp-2">{e.text}</p>
                    {e.kind === "sent" && (e.views > 0 || e.engagement > 0) && (
                      <div className="text-[10px] text-neutral-500 mt-0.5">
                        👁 {e.views} · ❤️ {e.engagement}
                        {e.channels?.length ? " · " + e.channels.join(", ") : ""}
                      </div>
                    )}
                  </div>
                  {e.kind === "scheduled" && (
                    <button onClick={() => cancelSchedule(e.id)} className="text-[10px] text-red-400 px-1.5 py-1">रोकें</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {new Date(openDay) >= new Date(todayKey()) && (
            <div>
              <p className="text-[11px] text-neutral-500 mb-2">इस दिन के लिए समय चुनें —</p>
              <div className="flex flex-wrap gap-1.5">
                {(bt?.top || []).map((t, i) => (
                  <button key={i} onClick={() => { vib(); setPicking({ dayKey: openDay, hour: t.hour }); }}
                    className="text-xs rounded-lg px-2.5 py-1.5 border border-neutral-700 text-neutral-300">
                    ⭐ {String(t.hour).padStart(2, "0")}:00
                  </button>
                ))}
                {[8, 11, 14, 18, 20].map((h) => (
                  <button key={h} onClick={() => { vib(); setPicking({ dayKey: openDay, hour: h }); }}
                    className="text-xs rounded-lg px-2.5 py-1.5 border border-neutral-800 text-neutral-500">
                    {String(h).padStart(2, "0")}:00
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── कौन-सी post भेजें — तैयार पड़ी posts में से चुनें ───── */}
      {picking && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-end justify-center p-3" onClick={() => setPicking(null)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-2xl bg-neutral-900 border border-neutral-800 p-4 max-h-[75vh] overflow-y-auto">
            <h3 className="text-sm font-semibold text-neutral-200 mb-1">कौन-सी post भेजें?</h3>
            <p className="text-[11px] text-neutral-500 mb-3">
              {new Date(picking.dayKey).toLocaleDateString("hi-IN", { day: "numeric", month: "long" })},
              {" "}{String(picking.hour).padStart(2, "0")}:00 बजे
            </p>

            {(data?.pending || []).length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-neutral-400 mb-1">कोई तैयार post नहीं है।</p>
                <p className="text-xs text-neutral-600">पहले "🤖 AI बनाओ" या "📣 विज्ञापन+" से post बना लें।</p>
              </div>
            ) : (
              <div className="space-y-2">
                {(data?.pending || []).map((p) => (
                  <button key={p.id} disabled={saving}
                    onClick={() => schedulePost(p.id, picking.dayKey, picking.hour)}
                    className="w-full flex gap-2.5 items-center text-left rounded-xl bg-neutral-950 border border-neutral-800 p-2 disabled:opacity-50">
                    {p.img
                      ? <img src={p.img.startsWith("/") ? apiBase + p.img : p.img} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                      : <div className="w-14 h-14 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">📝</div>}
                    <p className="text-xs text-neutral-300 line-clamp-3 flex-1">{p.text}</p>
                  </button>
                ))}
              </div>
            )}
            <button onClick={() => setPicking(null)} className="w-full mt-3 rounded-lg py-2 text-sm text-neutral-400 border border-neutral-800">बन्द करें</button>
          </div>
        </div>
      )}

      {/* ── कब भेजना सबसे अच्छा रहता है ───────────────────────── */}
      {bt && (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
          <h3 className="text-sm font-semibold text-neutral-300 mb-1">⏱️ आपके ग्राहक कब सबसे ज़्यादा देखते हैं</h3>
          <p className="text-[11px] text-neutral-600 mb-3">
            {bt.basedOnRealData
              ? `आपकी पिछली ${bt.sampleSize} posts के असली आँकड़ों से`
              : bt.note}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(bt.top || []).map((t, i) => (
              <div key={i} className="rounded-xl bg-neutral-950 border border-neutral-800 p-2.5">
                <div className="text-sm font-semibold" style={{ color: accent }}>{t.label}</div>
                <div className="text-[10px] text-neutral-500 leading-snug mt-0.5">{t.why}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading && <p className="text-xs text-neutral-600 text-center py-2">खुल रहा है…</p>}
    </div>
  );
}
