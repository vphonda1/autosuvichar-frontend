// ============================================================================
//  Results.jsx — "नतीजा"
//  ---------------------------------------------------------------------------
//  पहले: ऊपर तीन बटन — ग्राहक / पहुँच / सलाह। तीनों देखने के लिए तीन बार
//  बटन दबाना पड़ता था। "आज" वाला वही रायता यहाँ भी था।
//
//  अब: कोई बटन नहीं। एक सीधी सूची, ज़रूरत के क्रम में —
//
//     💰 इस महीने कितने ग्राहक आए, कितनों ने गाड़ी ली   ← असली सवाल
//     👥 ग्राहकों की सूची — 📞 कॉल और 💬 WhatsApp यहीं से
//     📊 कितने लोगों तक पहुँचा
//     🔗 किस post से ग्राहक आया — यही असली हिसाब है
//     🏆 सबसे ज़्यादा चलीं
//     🏍️ किस गाड़ी में सबसे ज़्यादा रुचि
//     🧠 AI की सलाह                (बन्द, खोलने पर दिखे)
//
//  ⚠️ कुछ हटाया नहीं गया — सब वही है, बस एक ही स्क्रॉल में।
// ============================================================================

import React, { useEffect, useState } from "react";
import { api, media, vib, Title, Empty, Err, Fold, Stat } from "./shared.jsx";
import AIReport from "./AIReport.jsx";

const STATUS = [
  ["new", "नया", "#F59E0B"],
  ["contacted", "बात हुई", "#3B82F6"],
  ["won", "गाड़ी ली", "#10B981"],
  ["lost", "नहीं लिया", "#525252"],
];

export default function Results({ apiBase, token, brandId, brand, accent, isAdmin, reloadKey, onChange }) {
  const [stats, setStats] = useState(null);
  const [leads, setLeads] = useState([]);
  const [attr, setAttr] = useState(null);
  const [top, setTop] = useState(null);
  const [filter, setFilter] = useState("new");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true); setErr("");
    try {
      const [s, l, a, t] = await Promise.all([
        api(`/api/analytics?brand=${brandId}`).catch(() => null),
        api(`/api/leads?brand=${brandId}`).catch(() => []),
        api(`/api/attribution?brand=${brandId}&days=30`).catch(() => null),
        api(`/api/insights/top?brand=${brandId}&days=30`).catch(() => null),
      ]);
      setStats(s); setLeads(Array.isArray(l) ? l : []); setAttr(a); setTop(t);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [brandId, reloadKey]);

  async function setStatus(id, status) {
    setLeads((ls) => ls.map((x) => (x._id === id ? { ...x, status } : x)));
    try { await api(`/api/leads/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }); }
    catch (e) { setErr(e.message); load(); }
  }

  async function refreshInsights() {
    setLoading(true);
    try { await api("/api/insights/refresh", { method: "POST", body: JSON.stringify({ brand: brandId }) }); await load(); }
    catch (e) { setErr(e.message); setLoading(false); }
  }

  const shown = leads.filter((l) => l.status === filter);
  const won = leads.filter((l) => l.status === "won").length;

  return (
    <div className="space-y-5">

      {/* ── असली सवाल, सबसे ऊपर ──────────────────────────────── */}
      <div className="rounded-2xl border p-4" style={{ borderColor: accent + "44", background: accent + "10" }}>
        <p className="text-xs text-neutral-400 mb-1">इस महीने प्रचार से</p>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold" style={{ color: accent }}>{leads.length}</span>
          <span className="text-sm text-neutral-300">लोगों ने पूछताछ की</span>
        </div>
        <p className="text-xs text-neutral-500 mt-1.5">
          इनमें से <b className="text-emerald-400">{won}</b> ने गाड़ी ली
          {leads.length > 0 && ` · ${Math.round((won / leads.length) * 100)}% बदले`}
        </p>
      </div>

      <Err onClose={() => setErr("")}>{err}</Err>

      {/* ── 👥 ग्राहक ─────────────────────────────────────────── */}
      <div className="space-y-3">
        <Title right={
          <button onClick={() => { vib(); load(); }} className="text-[11px] text-neutral-500 underline">
            {loading ? "…" : "ताज़ा"}
          </button>
        }>ग्राहक</Title>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {STATUS.map(([id, label, c]) => {
            const n = leads.filter((l) => l.status === id).length;
            return (
              <button key={id} onClick={() => { vib(15); setFilter(id); }}
                className="flex-shrink-0 rounded-xl px-3 py-2 border text-left"
                style={{ borderColor: filter === id ? c : "#262626", background: filter === id ? c + "18" : "transparent" }}>
                <div className="text-base font-bold" style={{ color: c }}>{n}</div>
                <div className="text-[10px] text-neutral-500">{label}</div>
              </button>
            );
          })}
        </div>

        {shown.length === 0 ? (
          <Empty icon="👥">
            {filter === "new" ? "कोई नया ग्राहक इंतज़ार में नहीं — सब से बात हो चुकी है।" : "इस हाल में कोई नहीं।"}
          </Empty>
        ) : (
          <div className="space-y-2">
            {shown.map((l) => (
              <div key={l._id} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
                <div className="flex justify-between items-start gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-neutral-100">{l.name || "नाम नहीं दिया"}</div>
                    <div className="text-[11px] text-neutral-500">
                      {l.vehicleInterest || "गाड़ी नहीं बताई"} · {new Date(l.createdAt).toLocaleDateString("hi-IN")}
                      {l.source ? ` · ${l.source}` : ""}
                    </div>
                  </div>
                  <select value={l.status} onChange={(e) => setStatus(l._id, e.target.value)}
                    className="text-xs bg-neutral-800 rounded-lg px-2 py-1.5 border border-neutral-700 flex-shrink-0">
                    {STATUS.map(([id, label]) => <option key={id} value={id}>{label}</option>)}
                  </select>
                </div>
                {l.mobile && (
                  <div className="grid grid-cols-2 gap-2">
                    <a href={`tel:${l.mobile}`} onClick={() => vib()}
                      className="rounded-lg py-2 text-center text-xs font-semibold text-white" style={{ background: accent }}>
                      📞 {l.mobile}
                    </a>
                    <a href={`https://wa.me/91${String(l.mobile).replace(/\D/g, "").slice(-10)}`}
                      target="_blank" rel="noreferrer" onClick={() => vib()}
                      className="rounded-lg py-2 text-center text-xs font-semibold text-emerald-400 border border-emerald-800">
                      💬 WhatsApp
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 📊 कितने लोगों तक पहुँचा ──────────────────────────── */}
      <div className="space-y-3">
        <Title>कितने लोगों तक पहुँचा</Title>
        <div className="grid grid-cols-2 gap-2">
          <Stat label="कुल posts भेजीं" v={stats?.contentSent} c={accent} />
          <Stat label="Delivery posts" v={stats?.deliveriesSent} c={accent} />
          <Stat label="कुल लोगों तक" v={top?.totals?.views} c="#3B82F6" hint="असली आँकड़ा" />
          <Stat label="like / comment" v={top?.totals?.engagement} c="#8B5CF6" />
        </div>

        <button onClick={() => { vib(); refreshInsights(); }} disabled={loading}
          className="w-full rounded-xl py-2.5 text-sm border border-neutral-700 text-neutral-300 disabled:opacity-50">
          {loading ? "ला रहे हैं…" : "🔄 Facebook / Instagram से ताज़ा आँकड़े लाएँ"}
        </button>
      </div>

      {/* ── 🔗 किस post से ग्राहक आया — यही असली हिसाब है ────── */}
      <div>
        <Title>किस post से ग्राहक आया</Title>
        {!attr?.rows?.length ? (
          <Empty icon="🔗">
            {attr?.note || "अभी tracking link नहीं जुड़े — post भेजते समय link लगाएँ, तभी यह हिसाब बनेगा।"}
          </Empty>
        ) : (
          <div className="space-y-2">
            {attr.rows.slice(0, 8).map((r) => (
              <div key={r.code} className="flex gap-2.5 items-center rounded-xl bg-neutral-900 border border-neutral-800 p-2.5">
                {r.img
                  ? <img src={media(r.img)} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-11 h-11 rounded-lg bg-neutral-800 flex items-center justify-center flex-shrink-0">🔗</div>}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-300 line-clamp-1">{r.post}</p>
                  <div className="text-[10px] text-neutral-500 mt-0.5">
                    👁 {r.views} · 👆 {r.clicks} क्लिक
                    {r.ctr != null && ` · ${r.ctr}%`}
                  </div>
                </div>
                <div className="text-center flex-shrink-0 px-1">
                  <div className="text-base font-bold text-emerald-400">{r.leads}</div>
                  <div className="text-[9px] text-neutral-600">ग्राहक</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── 🏆 सबसे ज़्यादा चलीं ──────────────────────────────── */}
      {top?.top?.length > 0 && (
        <div>
          <Title>सबसे ज़्यादा चलीं</Title>
          <div className="space-y-2">
            {top.top.slice(0, 5).map((p, i) => (
              <div key={p._id} className="flex gap-2.5 items-center rounded-xl bg-neutral-900 border border-neutral-800 p-2.5">
                <span className="text-sm font-bold text-neutral-600 w-4 flex-shrink-0">{i + 1}</span>
                {p.img
                  ? <img src={media(p.img)} alt="" className="w-11 h-11 rounded-lg object-cover flex-shrink-0" />
                  : <div className="w-11 h-11 rounded-lg bg-neutral-800 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-neutral-300 line-clamp-2">{p.text}</p>
                  <div className="text-[10px] text-neutral-500 mt-0.5">👁 {p.views} · ❤️ {p.engagement}</div>
                </div>
              </div>
            ))}
          </div>
          {top.note && <p className="text-[11px] text-neutral-600 mt-2">{top.note}</p>}
        </div>
      )}

      {/* ── 🏍️ किस गाड़ी में सबसे ज़्यादा रुचि ────────────────── */}
      {stats?.leadsByVehicle?.length > 0 && (
        <div>
          <Title>किस गाड़ी में सबसे ज़्यादा रुचि</Title>
          <div className="space-y-1">
            {stats.leadsByVehicle.map((v, i) => {
              const max = stats.leadsByVehicle[0].n || 1;
              return (
                <div key={i} className="relative rounded-lg bg-neutral-900 px-3 py-2 overflow-hidden">
                  <div className="absolute inset-y-0 left-0 opacity-20" style={{ background: accent, width: `${(v.n / max) * 100}%` }} />
                  <div className="relative flex justify-between text-sm">
                    <span className="text-neutral-200">{v._id || "नहीं बताया"}</span>
                    <span className="text-neutral-400">{v.n}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── 🧠 AI की सलाह — बन्द, ज़रूरत पर खुले ──────────────── */}
      {isAdmin && (
        <Fold icon="🧠" title="AI की सलाह" sub="आगे क्या करें — महीने भर का निचोड़">
          <div className="pt-2">
            <AIReport apiBase={apiBase} token={token} brandId={brandId} />
          </div>
        </Fold>
      )}

      {loading && !stats && <p className="text-xs text-neutral-600 text-center py-2">खुल रहा है…</p>}
    </div>
  );
}
