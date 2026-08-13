const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useEffect } from "react";

const BRAND_LABELS = { vp_honda: "VP Honda", yakuza: "Yakuza EV", minimetro: "Mini Metro" };
const TYPE_LABELS = { suvichar: "सुविचार", vigyapan: "विज्ञापन", festival: "त्यौहार", suchna: "सूचना", gift: "गिफ्ट" };
const TYPE_ICON = { suvichar: "💡", vigyapan: "📣", festival: "🎉", suchna: "📌", gift: "🎁" };
const CH_LABEL = { fb: "Facebook", ig: "Instagram", wa: "WhatsApp", yt: "YouTube" };

const RANGE = [
  { d: 7, label: "7 दिन" },
  { d: 15, label: "15 दिन" },
  { d: 30, label: "1 महीना" },
  { d: 90, label: "3 महीने" },
];

export default function AIReport({ apiBase, token, brandId }) {
  const [days, setDays] = useState(7);
  const [scope, setScope] = useState(brandId || "vp_honda");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState(null);
  const [reporting, setReporting] = useState(false);
  const [err, setErr] = useState("");

  async function loadStats() {
    setLoading(true); setErr("");
    try {
      const qb = scope === "all" ? "" : `brand=${scope}&`;
      const r = await fetch(`${apiBase}/api/analytics/detailed?${qb}days=${days}`, {
        headers: { Authorization: "Bearer " + token },
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setStats(d);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  useEffect(() => { loadStats(); /* eslint-disable-next-line */ }, [days, scope]);

  async function makeReport() {
    vib(50); setReporting(true); setErr(""); setReport(null);
    try {
      const r = await fetch(`${apiBase}/api/analytics/ai-report`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ brand: scope === "all" ? undefined : scope, days }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setReport(d);
      vib([30, 30, 60]);
    } catch (e) { setErr(e.message); }
    setReporting(false);
  }

  const maxTrend = Math.max(1, ...(stats?.dailyTrend || []).map(t => t.total));

  return (
    <div className="space-y-3 pb-10">

      {/* ── FILTERS ── */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <div>
          <p className="text-xs text-neutral-400 mb-1.5">Brand</p>
          <div className="grid grid-cols-4 gap-1.5">
            {[["all", "सभी"], ...Object.entries(BRAND_LABELS)].map(([id, label]) => (
              <button key={id} type="button" onClick={() => { vib(15); setScope(id); }}
                className={`py-2 rounded-xl text-[11px] font-semibold border-2 ${scope === id ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-neutral-700 text-neutral-400"}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-neutral-400 mb-1.5">कितने दिन</p>
          <div className="grid grid-cols-4 gap-1.5">
            {RANGE.map(r => (
              <button key={r.d} type="button" onClick={() => { vib(15); setDays(r.d); }}
                className={`py-2 rounded-xl text-[11px] font-semibold border-2 ${days === r.d ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-neutral-700 text-neutral-400"}`}>
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {err && <div className="rounded-xl px-4 py-3 text-sm bg-red-900/60 text-red-300">❌ {err}</div>}

      {/* ── KPI CARDS ── */}
      {stats && (
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
            <p className="text-[10px] text-neutral-500">कुल बने</p>
            <p className="text-2xl font-bold text-white">{stats.totalAll || 0}</p>
          </div>
          <div className="rounded-2xl bg-neutral-900 border border-emerald-800 p-3">
            <p className="text-[10px] text-neutral-500">भेजे गए</p>
            <p className="text-2xl font-bold text-emerald-400">{stats.totals?.sent || 0}</p>
          </div>
          <div className="rounded-2xl bg-neutral-900 border border-amber-800 p-3">
            <p className="text-[10px] text-neutral-500">Pending</p>
            <p className="text-2xl font-bold text-amber-400">{stats.totals?.pending || 0}</p>
          </div>
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
            <p className="text-[10px] text-neutral-500">Success Rate</p>
            <p className={`text-2xl font-bold ${stats.successRate >= 70 ? "text-emerald-400" : stats.successRate >= 40 ? "text-amber-400" : "text-red-400"}`}>
              {stats.successRate || 0}%
            </p>
          </div>
        </div>
      )}

      {/* ── AI REPORT BUTTON ── */}
      <button type="button" onClick={makeReport} disabled={reporting || loading}
        className="w-full rounded-2xl py-4 text-base font-bold text-black disabled:opacity-40"
        style={{ background: "#FFD600" }}>
        {reporting ? "🤖 Report बना रहे हैं…" : "📊 AI से Report बनवाएं"}
      </button>

      {/* ── AI REPORT ── */}
      {report && (
        <div className="space-y-2">
          {report.headline_hindi && (
            <div className="rounded-2xl bg-neutral-800 border border-yellow-700 px-4 py-3">
              <p className="text-sm text-yellow-300 font-semibold leading-relaxed">📌 {report.headline_hindi}</p>
            </div>
          )}

          {report.highlights?.length > 0 && (
            <div className="rounded-2xl bg-neutral-900 border border-emerald-800 p-3 space-y-1.5">
              <p className="text-xs font-bold text-emerald-400">✅ अच्छी बातें</p>
              {report.highlights.map((h, i) => <p key={i} className="text-xs text-neutral-300">• {h}</p>)}
            </div>
          )}

          {report.concerns?.length > 0 && (
            <div className="rounded-2xl bg-neutral-900 border border-amber-800 p-3 space-y-1.5">
              <p className="text-xs font-bold text-amber-400">⚠️ ध्यान देने की बातें</p>
              {report.concerns.map((c, i) => <p key={i} className="text-xs text-neutral-300">• {c}</p>)}
            </div>
          )}

          {report.topPerformer_hindi && (
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
              <p className="text-xs font-bold text-white mb-1">🏆 सबसे अच्छा चला</p>
              <p className="text-xs text-neutral-300">{report.topPerformer_hindi}</p>
            </div>
          )}

          {report.recommendations?.length > 0 && (
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 space-y-2">
              <p className="text-xs font-bold text-white">💡 AI की सलाह</p>
              {report.recommendations.map((r, i) => (
                <div key={i} className="bg-neutral-800 rounded-xl px-3 py-2">
                  <p className="text-xs text-yellow-400 font-semibold">→ {r.action_hindi}</p>
                  {r.why_hindi && <p className="text-[11px] text-neutral-400 mt-0.5">{r.why_hindi}</p>}
                </div>
              ))}
            </div>
          )}

          {report.nextWeekPlan_hindi && (
            <div className="rounded-2xl bg-neutral-800 border border-blue-800 px-4 py-3">
              <p className="text-xs font-bold text-blue-300 mb-1">📅 अगले हफ्ते का focus</p>
              <p className="text-xs text-neutral-300 leading-relaxed">{report.nextWeekPlan_hindi}</p>
            </div>
          )}
        </div>
      )}

      {/* ── DAILY TREND ── */}
      {stats?.dailyTrend?.length > 0 && (
        <details className="bg-neutral-900 rounded-2xl border border-neutral-800" open>
          <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">📈 रोज़ का हिसाब <span className="text-neutral-500">▼</span></summary>
          <div className="px-4 pb-4 space-y-1.5">
            {stats.dailyTrend.slice(-14).map(t => (
              <div key={t._id} className="flex items-center gap-2">
                <span className="text-[10px] text-neutral-500 w-16 flex-shrink-0">{t._id.slice(5)}</span>
                <div className="flex-1 h-5 bg-neutral-800 rounded-full overflow-hidden flex">
                  <div className="bg-emerald-600 h-full" style={{ width: `${(t.sent / maxTrend) * 100}%` }} />
                  <div className="bg-red-700 h-full" style={{ width: `${(t.failed / maxTrend) * 100}%` }} />
                </div>
                <span className="text-[10px] text-neutral-400 w-12 text-right flex-shrink-0">{t.sent}/{t.total}</span>
              </div>
            ))}
            <p className="text-[10px] text-neutral-600 pt-1">🟩 भेजे गए · 🟥 fail</p>
          </div>
        </details>
      )}

      {/* ── BY TYPE ── */}
      {stats?.byType?.length > 0 && (
        <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
          <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">📋 किस तरह का content <span className="text-neutral-500">▼</span></summary>
          <div className="px-4 pb-4 space-y-1.5">
            {stats.byType.map(t => (
              <div key={t._id} className="flex items-center justify-between bg-neutral-800 rounded-xl px-3 py-2">
                <span className="text-xs text-neutral-300">{TYPE_ICON[t._id] || "📄"} {TYPE_LABELS[t._id] || t._id}</span>
                <span className="text-xs text-neutral-400">कुल {t.n} · भेजे <b className="text-emerald-400">{t.sent}</b></span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── BY CHANNEL ── */}
      {stats?.byChannel?.length > 0 && (
        <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
          <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">📱 किस platform पर <span className="text-neutral-500">▼</span></summary>
          <div className="px-4 pb-4 space-y-1.5">
            {stats.byChannel.map(c => (
              <div key={c._id} className="flex items-center justify-between bg-neutral-800 rounded-xl px-3 py-2">
                <span className="text-xs text-neutral-300">{CH_LABEL[c._id] || c._id}</span>
                <span className="text-xs font-bold text-yellow-400">{c.n}</span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── BY BRAND ── */}
      {stats?.byBrand?.length > 0 && scope === "all" && (
        <details className="bg-neutral-900 rounded-2xl border border-neutral-800">
          <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">🏷️ Brand के हिसाब से <span className="text-neutral-500">▼</span></summary>
          <div className="px-4 pb-4 space-y-1.5">
            {stats.byBrand.map(b => (
              <div key={b._id} className="flex items-center justify-between bg-neutral-800 rounded-xl px-3 py-2">
                <span className="text-xs text-neutral-300">{BRAND_LABELS[b._id] || b._id}</span>
                <span className="text-xs text-neutral-400">कुल {b.n} · भेजे <b className="text-emerald-400">{b.sent}</b></span>
              </div>
            ))}
          </div>
        </details>
      )}

      {/* ── FAILED ── */}
      {stats?.failedList?.length > 0 && (
        <details className="bg-neutral-900 rounded-2xl border border-red-900">
          <summary className="px-4 py-3 text-sm font-bold text-red-400 cursor-pointer list-none flex justify-between">
            ❌ Fail हुए ({stats.failedList.length}) <span className="text-neutral-500">▼</span>
          </summary>
          <div className="px-4 pb-4 space-y-1.5">
            {stats.failedList.map((f, i) => {
              const reasons = Array.isArray(f.results) ? f.results.filter(r => !r.ok) : [];
              return (
                <div key={i} className="bg-neutral-800 rounded-xl px-3 py-2">
                  <p className="text-[11px] text-neutral-300 line-clamp-1">{TYPE_ICON[f.type]} {String(f.text || "").slice(0, 50)}</p>
                  {reasons.map((r, j) => (
                    <p key={j} className="text-[10px] text-red-400 mt-0.5">{CH_LABEL[r.platform] || r.platform}: {r.error}</p>
                  ))}
                </div>
              );
            })}
          </div>
        </details>
      )}

      {loading && <p className="text-center text-xs text-neutral-500 py-4">लोड हो रहा है…</p>}
    </div>
  );
}
