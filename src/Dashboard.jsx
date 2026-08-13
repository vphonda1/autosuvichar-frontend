const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useEffect } from "react";

const BRAND_LABELS = { vp_honda: "VP Honda", yakuza: "Yakuza EV", minimetro: "Mini Metro" };
const TYPE_ICON = { suvichar: "💡", vigyapan: "📣", festival: "🎉", suchna: "📌", gift: "🎁" };

const SHORTCUTS = [
  { tab: "ai",         icon: "🎙️", label: "बोलकर बनाएं",   sub: "एक लाइन में बताएं",     big: true },
  { tab: "automkt",    icon: "🚀", label: "Auto Marketing", sub: "पूरे हफ्ते का content", big: true },
  { tab: "aidelivery", icon: "📸", label: "AI Delivery",    sub: "photos से post" },
  { tab: "aivideo",    icon: "🎬", label: "AI Video",       sub: "photos से video" },
  { tab: "mega",       icon: "🔥", label: "Mega Offer",     sub: "बड़ा ऑफर poster" },
  { tab: "booking",    icon: "📋", label: "बुकिंग",         sub: "फायदे वाला poster" },
  { tab: "multibike",  icon: "🏍️", label: "Multi Bike",     sub: "कई गाड़ियाँ" },
  { tab: "luckydraw",  icon: "🎉", label: "Lucky Draw",     sub: "त्यौहार ऑफर" },
  { tab: "hiring",     icon: "💼", label: "भर्ती",          sub: "job poster" },
  { tab: "aireport",   icon: "🧠", label: "AI Report",      sub: "कैसा चल रहा है" },
];

export default function Dashboard({ apiBase, token, brandId, setTab }) {
  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function load() {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${apiBase}/api/dashboard?brand=${brandId}`, { headers: { Authorization: "Bearer " + token } });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setD(j);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [brandId]);

  function go(tab) { vib(25); setTab(tab); }

  const hour = new Date().getHours();
  const greet = hour < 12 ? "सुप्रभात" : hour < 17 ? "नमस्ते" : "शुभ संध्या";

  return (
    <div className="space-y-3 pb-10">

      {/* ── GREETING ── */}
      <div className="rounded-2xl bg-gradient-to-br from-neutral-900 to-neutral-800 border border-neutral-700 p-4">
        <p className="text-lg font-bold text-white">{greet} 🙏</p>
        <p className="text-xs text-neutral-400 mt-0.5">{BRAND_LABELS[brandId] || brandId} · {d?.today || ""}</p>
        {d?.festival && (
          <div className="mt-2 rounded-xl bg-yellow-500/10 border border-yellow-700 px-3 py-2">
            <p className="text-xs text-yellow-400">
              🎉 {d.festival.daysAway === 0 ? `आज ${d.festival.name} है!` : `${d.festival.name} में ${d.festival.daysAway} दिन बाकी`}
              {d.festival.daysAway > 0 && d.festival.daysAway <= 7 && " — तैयारी शुरू करें"}
            </p>
          </div>
        )}
      </div>

      {err && <div className="rounded-xl px-4 py-3 text-sm bg-red-900/60 text-red-300">❌ {err}</div>}

      {/* ── STATUS CARDS ── */}
      {d && (
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => go("content")}
            className="rounded-2xl bg-neutral-900 border border-amber-800 p-3 text-left active:opacity-70">
            <p className="text-[10px] text-neutral-500">Review में pending</p>
            <p className="text-2xl font-bold text-amber-400">{d.pending}</p>
          </button>

          <div className="rounded-2xl bg-neutral-900 border border-emerald-800 p-3">
            <p className="text-[10px] text-neutral-500">आज भेजे</p>
            <p className="text-2xl font-bold text-emerald-400">{d.sentToday}</p>
          </div>

          <button type="button" onClick={() => go("ai")}
            className="rounded-2xl bg-neutral-900 border border-neutral-700 p-3 text-left active:opacity-70">
            <p className="text-[10px] text-neutral-500">Scheduled</p>
            <p className="text-2xl font-bold text-white">{d.schedCount}</p>
          </button>

          <button type="button" onClick={() => go("notif")}
            className="rounded-2xl bg-neutral-900 border border-neutral-700 p-3 text-left active:opacity-70">
            <p className="text-[10px] text-neutral-500">नए notifications</p>
            <p className={`text-2xl font-bold ${d.notifUnread > 0 ? "text-red-400" : "text-neutral-500"}`}>{d.notifUnread}</p>
          </button>
        </div>
      )}

      {/* ── ALERTS ── */}
      {d?.failedToday > 0 && (
        <button type="button" onClick={() => go("aireport")}
          className="w-full rounded-xl bg-red-900/40 border border-red-800 px-4 py-3 text-left active:opacity-70">
          <p className="text-sm text-red-300">❌ आज {d.failedToday} posts fail हुए — देखें क्यों</p>
        </button>
      )}

      {d?.videoProcessing > 0 && (
        <div className="rounded-xl bg-amber-900/40 border border-amber-800 px-4 py-3">
          <p className="text-sm text-amber-300">⏳ {d.videoProcessing} video बन रहे हैं…</p>
        </div>
      )}

      {d && d.vehCount === 0 && (
        <button type="button" onClick={() => go("vehicles")}
          className="w-full rounded-xl bg-blue-900/40 border border-blue-800 px-4 py-3 text-left active:opacity-70">
          <p className="text-sm text-blue-300">🏍️ अभी कोई गाड़ी नहीं जोड़ी — जोड़ें ताकि AI सही price लिखे</p>
        </button>
      )}

      {d && !d.profileReady && (
        <button type="button" onClick={() => go("memory")}
          className="w-full rounded-xl bg-blue-900/40 border border-blue-800 px-4 py-3 text-left active:opacity-70">
          <p className="text-sm text-blue-300">🧠 Brand Memory भरें — AI आपकी पसंद के हिसाब से लिखेगा</p>
        </button>
      )}

      {/* ── QUICK ACTIONS ── */}
      <div className="pt-1">
        <p className="text-sm font-bold text-neutral-400 mb-2 px-1">⚡ जल्दी बनाएं</p>

        {/* Big shortcuts */}
        <div className="space-y-2 mb-2">
          {SHORTCUTS.filter(s => s.big).map(s => (
            <button key={s.tab} type="button" onClick={() => go(s.tab)}
              className="w-full rounded-2xl border-2 border-yellow-600 bg-yellow-500/10 px-4 py-4 flex items-center gap-3 active:opacity-70">
              <span className="text-3xl">{s.icon}</span>
              <div className="text-left flex-1">
                <p className="text-base font-bold text-yellow-400">{s.label}</p>
                <p className="text-[11px] text-neutral-400">{s.sub}</p>
              </div>
              <span className="text-neutral-500">›</span>
            </button>
          ))}
        </div>

        {/* Grid shortcuts */}
        <div className="grid grid-cols-2 gap-2">
          {SHORTCUTS.filter(s => !s.big).map(s => (
            <button key={s.tab} type="button" onClick={() => go(s.tab)}
              className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 text-left active:opacity-70">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-sm font-semibold text-white mt-1">{s.label}</p>
              <p className="text-[10px] text-neutral-500">{s.sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* ── NEXT SCHEDULED ── */}
      {d?.nextScheduled?.length > 0 && (
        <div className="pt-1">
          <p className="text-sm font-bold text-neutral-400 mb-2 px-1">⏰ आने वाले</p>
          <div className="space-y-1.5">
            {d.nextScheduled.map(s => (
              <div key={s._id} className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5 flex items-start gap-2">
                <span className="text-lg">{TYPE_ICON[s.type] || "📄"}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-yellow-400">
                    {s.scheduleDate} · {s.scheduleTime} · {BRAND_LABELS[s.brand] || s.brand}
                  </p>
                  <p className="text-xs text-neutral-300 line-clamp-1">{s.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── PENDING PREVIEW ── */}
      {d?.recentPending?.length > 0 && (
        <div className="pt-1">
          <div className="flex items-center justify-between mb-2 px-1">
            <p className="text-sm font-bold text-neutral-400">📝 Review का इंतज़ार</p>
            <button type="button" onClick={() => go("content")} className="text-xs text-yellow-400 underline">सब देखें</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {d.recentPending.map(p => (
              <button key={p._id} type="button" onClick={() => go("content")}
                className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-900 active:opacity-70">
                {p.imgUrl
                  ? <img src={apiBase + p.imgUrl} alt="" className="w-full h-24 object-cover" />
                  : <div className="w-full h-24 flex items-center justify-center text-2xl">{TYPE_ICON[p.type] || "📄"}</div>}
                <p className="text-[9px] text-neutral-500 px-1.5 py-1 line-clamp-2">{String(p.text || "").slice(0, 40)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {loading && <p className="text-center text-xs text-neutral-500 py-4">लोड हो रहा है…</p>}

      <button type="button" onClick={() => { vib(20); load(); }}
        className="w-full py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-400">
        🔄 ताज़ा करें
      </button>
    </div>
  );
}
