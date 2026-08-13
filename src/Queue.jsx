const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useEffect } from "react";

const BRAND_LABELS = { vp_honda: "VP Honda", yakuza: "Yakuza EV", minimetro: "Mini Metro" };
const TYPE_ICON = { suvichar: "💡", vigyapan: "📣", festival: "🎉", suchna: "📌", gift: "🎁" };
const CH_LABEL = { fb: "FB", ig: "IG", wa: "WA", yt: "YT" };

const ACT_ICON = {
  command: "🎙️", generate: "✨", poster: "🎨", video: "🎬",
  schedule: "⏰", publish: "📤", quality: "🔍", approve: "✅",
  reject: "❌", auto_marketing: "🚀",
};
const ACT_LABEL = {
  command: "Command", generate: "बनाया", poster: "Poster", video: "Video",
  schedule: "Schedule", publish: "भेजा", quality: "Quality", approve: "Approve",
  reject: "Reject", auto_marketing: "Auto Marketing",
};

function timeAgo(d) {
  const diff = (Date.now() - new Date(d)) / 1000;
  if (diff < 60) return "अभी";
  if (diff < 3600) return `${Math.floor(diff / 60)} मिनट पहले`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} घंटे पहले`;
  return `${Math.floor(diff / 86400)} दिन पहले`;
}

export default function Queue({ apiBase, token, brandId, setTab }) {
  const [view, setView] = useState("queue");   // queue | activity
  const [q, setQ] = useState(null);
  const [acts, setActs] = useState([]);
  const [actFilter, setActFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  async function loadQueue() {
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${apiBase}/api/queue?brand=${brandId}`, { headers: { Authorization: "Bearer " + token } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setQ(d);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  async function loadActs() {
    setLoading(true); setErr("");
    try {
      const f = actFilter ? `&action=${actFilter}` : "";
      const r = await fetch(`${apiBase}/api/activity?brand=${brandId}&limit=60${f}`, { headers: { Authorization: "Bearer " + token } });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setActs(d.items || []);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }

  useEffect(() => {
    if (view === "queue") loadQueue(); else loadActs();
    /* eslint-disable-next-line */
  }, [view, brandId, actFilter]);

  const Stage = ({ icon, title, count, color, children }) => (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 px-1">
        <span className="text-base">{icon}</span>
        <p className="text-sm font-bold text-white">{title}</p>
        <span className={`text-[10px] px-2 py-0.5 rounded-full ${color}`}>{count}</span>
      </div>
      {children}
    </div>
  );

  return (
    <div className="space-y-3 pb-10">

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5">
        {[["queue", "📋 Queue"], ["activity", "📜 Activity Log"]].map(([v, l]) => (
          <button key={v} type="button" onClick={() => { vib(15); setView(v); }}
            className={`py-2.5 rounded-xl text-xs font-semibold border-2 ${view === v ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-neutral-700 text-neutral-400"}`}>
            {l}
          </button>
        ))}
      </div>

      {err && <div className="rounded-xl px-4 py-3 text-sm bg-red-900/60 text-red-300">❌ {err}</div>}
      {loading && <p className="text-center text-xs text-neutral-500 py-4">लोड हो रहा है…</p>}

      {/* ══ QUEUE VIEW ══ */}
      {view === "queue" && q && !loading && (
        <>
          {/* Pipeline summary */}
          <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
            <div className="flex items-center justify-between text-center">
              {[
                { k: "scheduled", icon: "⏰", label: "Scheduled", cls: "text-blue-400" },
                { k: "pending", icon: "📝", label: "Review", cls: "text-amber-400" },
                { k: "sent", icon: "✅", label: "भेजे", cls: "text-emerald-400" },
                { k: "failed", icon: "❌", label: "Fail", cls: "text-red-400" },
              ].map((s, i) => (
                <React.Fragment key={s.k}>
                  <div className="flex-1">
                    <p className="text-lg">{s.icon}</p>
                    <p className={`text-xl font-bold ${s.cls}`}>{q.counts[s.k] || 0}</p>
                    <p className="text-[9px] text-neutral-500">{s.label}</p>
                  </div>
                  {i < 3 && <span className="text-neutral-700 text-xs">›</span>}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Scheduled */}
          {q.scheduled?.length > 0 && (
            <Stage icon="⏰" title="Schedule में" count={q.scheduled.length} color="bg-blue-900/50 text-blue-300">
              {q.scheduled.map(s => (
                <div key={s._id} className="rounded-xl bg-neutral-900 border border-blue-900/50 px-3 py-2.5 flex items-start gap-2">
                  <span className="text-base">{TYPE_ICON[s.type] || "📄"}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-blue-400">
                      {s.scheduleDate} · {s.scheduleTime}
                      {s.recurring ? " · रोज़ाना" : ""} · {BRAND_LABELS[s.brand] || s.brand}
                    </p>
                    <p className="text-xs text-neutral-300 line-clamp-2">{s.text}</p>
                  </div>
                </div>
              ))}
            </Stage>
          )}

          {/* Pending */}
          {q.pending?.length > 0 && (
            <Stage icon="📝" title="Review का इंतज़ार" count={q.pending.length} color="bg-amber-900/50 text-amber-300">
              {q.pending.slice(0, 8).map(p => (
                <button key={p._id} type="button" onClick={() => { vib(20); setTab("content"); }}
                  className="w-full rounded-xl bg-neutral-900 border border-amber-900/50 px-3 py-2.5 flex items-start gap-2 text-left active:opacity-70">
                  {p.imgUrl
                    ? <img src={apiBase + p.imgUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    : <span className="text-base">{TYPE_ICON[p.type] || "📄"}</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-amber-400">{BRAND_LABELS[p.brand] || p.brand} · {timeAgo(p.createdAt)}</p>
                    <p className="text-xs text-neutral-300 line-clamp-2">{p.text}</p>
                  </div>
                </button>
              ))}
              {q.pending.length > 8 && (
                <button type="button" onClick={() => { vib(20); setTab("content"); }}
                  className="w-full py-2 rounded-xl border border-neutral-700 text-xs text-neutral-400">
                  और {q.pending.length - 8} देखें →
                </button>
              )}
            </Stage>
          )}

          {/* Deliveries pending */}
          {q.deliveries?.length > 0 && (
            <Stage icon="🎥" title="Delivery pending" count={q.deliveries.length} color="bg-purple-900/50 text-purple-300">
              {q.deliveries.map(d => (
                <button key={d._id} type="button" onClick={() => { vib(20); setTab("delivery"); }}
                  className="w-full rounded-xl bg-neutral-900 border border-purple-900/50 px-3 py-2.5 flex items-start gap-2 text-left active:opacity-70">
                  {d.imgUrl
                    ? <img src={apiBase + d.imgUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    : <span className="text-base">🎥</span>}
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-purple-400">{d.customerName || "ग्राहक"} · {d.bikeName || ""}</p>
                    <p className="text-xs text-neutral-300 line-clamp-1">{d.text}</p>
                  </div>
                </button>
              ))}
            </Stage>
          )}

          {/* Recent sent/failed */}
          {q.recent?.length > 0 && (
            <Stage icon="📤" title="हाल में" count={q.recent.length} color="bg-neutral-800 text-neutral-400">
              {q.recent.slice(0, 10).map(r => (
                <div key={r._id} className={`rounded-xl bg-neutral-900 border px-3 py-2.5 flex items-start gap-2 ${r.status === "sent" ? "border-emerald-900/50" : "border-red-900/50"}`}>
                  {r.imgUrl
                    ? <img src={apiBase + r.imgUrl} alt="" className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
                    : <span className="text-base">{TYPE_ICON[r.type] || "📄"}</span>}
                  <div className="flex-1 min-w-0">
                    <p className={`text-[11px] ${r.status === "sent" ? "text-emerald-400" : "text-red-400"}`}>
                      {r.status === "sent" ? "✅ भेजा" : "❌ fail"}
                      {r.channels?.length ? ` · ${r.channels.map(c => CH_LABEL[c] || c).join(", ")}` : ""}
                      {" · "}{timeAgo(r.sentAt || r.createdAt)}
                    </p>
                    <p className="text-xs text-neutral-400 line-clamp-1">{r.text}</p>
                  </div>
                </div>
              ))}
            </Stage>
          )}

          {q.counts.scheduled === 0 && q.counts.pending === 0 && q.counts.sent === 0 && (
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
              <p className="text-sm text-neutral-400">अभी queue खाली है</p>
              <button type="button" onClick={() => { vib(20); setTab("ai"); }}
                className="mt-3 px-4 py-2 rounded-xl text-xs font-bold text-black" style={{ background: "#FFD600" }}>
                🎙️ कुछ बनाएं
              </button>
            </div>
          )}
        </>
      )}

      {/* ══ ACTIVITY VIEW ══ */}
      {view === "activity" && !loading && (
        <>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {[["", "सब"], ["command", "🎙️"], ["generate", "✨"], ["publish", "📤"], ["video", "🎬"], ["schedule", "⏰"], ["quality", "🔍"]].map(([v, l]) => (
              <button key={v} type="button" onClick={() => { vib(15); setActFilter(v); }}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold border whitespace-nowrap flex-shrink-0 ${actFilter === v ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-neutral-700 text-neutral-400"}`}>
                {l}
              </button>
            ))}
          </div>

          {acts.length === 0 && (
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
              <p className="text-sm text-neutral-400">अभी कोई activity नहीं</p>
            </div>
          )}

          <div className="space-y-1.5">
            {acts.map(a => (
              <div key={a._id} className={`rounded-xl bg-neutral-900 border px-3 py-2.5 flex items-start gap-2.5 ${
                a.status === "failed" ? "border-red-900/50" : a.status === "success" ? "border-neutral-800" : "border-neutral-800"}`}>
                <span className="text-base flex-shrink-0">{ACT_ICON[a.action] || "•"}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-400">
                      {ACT_LABEL[a.action] || a.action}
                    </span>
                    {a.brand && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-500">
                        {BRAND_LABELS[a.brand] || a.brand}
                      </span>
                    )}
                    <span className="text-[10px] text-neutral-600">{timeAgo(a.createdAt)}</span>
                    {a.by && a.by !== "AI" && <span className="text-[10px] text-neutral-600">· {a.by}</span>}
                  </div>
                  <p className={`text-xs mt-0.5 ${a.status === "failed" ? "text-red-300" : "text-neutral-300"}`}>
                    {a.message}
                  </p>
                  {a.detail && <p className="text-[10px] text-neutral-600 mt-0.5 line-clamp-2">{a.detail}</p>}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      <button type="button" onClick={() => { vib(20); view === "queue" ? loadQueue() : loadActs(); }}
        className="w-full py-2.5 rounded-xl border border-neutral-700 text-xs text-neutral-400">
        🔄 ताज़ा करें
      </button>
    </div>
  );
}
