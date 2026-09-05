// ============================================================================
//  Today.jsx — "अभी क्या करना है"
//  ---------------------------------------------------------------------------
//  पहले तीन अलग tabs थे: 🏠 होम, 📋 Queue, 🔔 notification. तीनों में एक ही
//  सवाल का आधा-आधा जवाब मिलता था — "कुछ छूट तो नहीं रहा?"
//
//  अब एक ही पर्दा। ऊपर सिर्फ़ वही काम दिखते हैं जो सचमुच करने हैं। कुछ न बचे
//  तो साफ़ लिखा आता है कि सब संभला हुआ है — यही भरोसा असली काम है।
// ============================================================================

import React, { useEffect, useState } from "react";
import { api, media, vib, Title, Empty, Err, CAN_APPROVE, nativeShare } from "./shared.jsx";
import Queue from "./Queue.jsx";

const timeAgo = (d) => {
  const s = (Date.now() - new Date(d)) / 1000;
  if (s < 60) return "अभी";
  if (s < 3600) return `${Math.floor(s / 60)} मिनट पहले`;
  if (s < 86400) return `${Math.floor(s / 3600)} घंटे पहले`;
  return `${Math.floor(s / 86400)} दिन पहले`;
};

// एक करने लायक़ काम
function Task({ tone = "warn", icon, title, sub, cta, onClick }) {
  const C = {
    warn:   { bg: "#F59E0B", tint: "#F59E0B14", ring: "#F59E0B44" },
    danger: { bg: "#EF4444", tint: "#EF444414", ring: "#EF444444" },
    info:   { bg: "#3B82F6", tint: "#3B82F614", ring: "#3B82F644" },
  }[tone];
  return (
    <button onClick={() => { vib(); onClick(); }}
      className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left"
      style={{ background: C.tint, borderColor: C.ring }}>
      <span className="text-xl flex-shrink-0">{icon}</span>
      <span className="flex-1 min-w-0">
        <span className="block text-sm font-semibold text-neutral-100">{title}</span>
        <span className="block text-[11px] text-neutral-400 mt-0.5">{sub}</span>
      </span>
      <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-white flex-shrink-0" style={{ background: C.bg }}>
        {cta}
      </span>
    </button>
  );
}

export default function Today({ apiBase, token, brandId, brand, user, accent, onChange, reloadKey, setSec }) {
  const [d, setD] = useState(null);
  const [pending, setPending] = useState([]);
  const [leads, setLeads] = useState([]);
  const [gaps, setGaps] = useState([]);
  const [photoWait, setPhotoWait] = useState([]);   // delivery जिनमें बस photo बाक़ी है
  const [blocked, setBlocked] = useState(0);       // पुराने नियम से ग़लत रुकी posts
  const [clearing, setClearing] = useState(false);
  const [notifs, setNotifs] = useState([]);
  const [view, setView] = useState("tasks");   // tasks | queue | notif
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  const canApprove = CAN_APPROVE.includes(user.role);

  async function load() {
    setLoading(true); setErr("");
    try {
      const [dash, pend, lds, cal, nts, np, blk] = await Promise.all([
        api(`/api/dashboard?brand=${brandId}`).catch(() => ({})),
        api(`/api/content?brand=${brandId}&status=pending`).catch(() => []),
        api(`/api/leads?brand=${brandId}`).catch(() => []),
        api(`/api/calendar?brand=${brandId}`).catch(() => ({ emptyDays: [] })),
        api("/api/notifications").catch(() => ({ items: [] })),
        api(`/api/campaign/needs-photo?brand=${brandId}`).catch(() => ({ rows: [] })),
        api(`/api/campaign?brand=${brandId}&status=blocked&limit=50`).catch(() => []),
      ]);
      setD(dash);
      setPending(Array.isArray(pend) ? pend : []);
      setLeads((Array.isArray(lds) ? lds : []).filter((l) => l.status === "new"));
      setGaps((cal.emptyDays || []).slice(0, 7));
      setNotifs(nts.items || []);
      setPhotoWait(np.rows || []);
      // यह route सीधे array लौटाता है (50 तक)। 50 से ज़्यादा हों तो 50+ दिखेगा,
      // पर साफ़ करने वाला रास्ता एक बार में 500 तक निपटा देता है।
      setBlocked(Array.isArray(blk) ? blk.length : 0);
    } catch (e) { setErr(e.message); }
    setLoading(false);
  }
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [brandId, reloadKey]);

  async function act(kind, id, what) {
    setBusy(true); setErr("");
    try {
      await api(`/api/${kind}/${id}/${what}`, { method: "POST" });
      await load(); onChange && onChange();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  // ⚠️ पुराने नियम की वजह से बधाई/सूचना वाली posts भी "रोक दी गई" में फँस
  //    गई थीं। यह सिर्फ़ उन्हीं को हटाता है जो अब नए नियम से रुकती ही नहीं।
  //    सचमुच ग़लत क़ीमत वाली posts जहाँ हैं वहीं रहेंगी।
  async function clearBlocked() {
    if (!confirm("पुराने नियम की वजह से ग़लत रुकी posts हटा दें?\n\nजिनमें सचमुच क़ीमत की गड़बड़ी है, वे नहीं हटेंगी।")) return;
    vib(40); setClearing(true); setErr("");
    try {
      const r = await api("/api/campaign/clear-blocked", {
        method: "POST", body: JSON.stringify({ brand: brandId }),
      });
      setErr("");
      alert(r.message || "हो गया");
      await load(); onChange && onChange();
    } catch (e) { setErr(e.message); }
    setClearing(false);
  }

  async function markRead() {
    try { await api("/api/notifications/read", { method: "POST" }); onChange && onChange(); } catch (_) {}
  }

  // ── करने लायक़ काम इकट्ठे करो ──────────────────────────────────
  const tasks = [];
  if (pending.length && canApprove) {
    tasks.push({ tone: "warn", icon: "👀", cta: "देखें",
      title: `${pending.length} post आपकी हाँ का इंतज़ार कर रही ${pending.length > 1 ? "हैं" : "है"}`,
      sub: "जब तक approve नहीं करेंगे, कहीं नहीं जाएँगी",
      onClick: () => setView("tasks") });
  }
  if (d?.failedToday > 0) {
    tasks.push({ tone: "danger", icon: "⚠️", cta: "ठीक करें",
      title: `${d.failedToday} post आज नहीं जा पाई`,
      sub: "Settings में token देखें, फिर दोबारा भेजें",
      onClick: () => setView("queue") });
  }
  if (leads.length) {
    tasks.push({ tone: "danger", icon: "📞", cta: "खोलें",
      title: `${leads.length} नए ग्राहक — अभी बात नहीं हुई`,
      sub: leads.slice(0, 2).map((l) => l.name || l.mobile).join(", ") + (leads.length > 2 ? ` +${leads.length - 2}` : ""),
      onClick: () => setSec("results") });
  }
  if (blocked > 2) {
    tasks.push({ tone: "info", icon: "🧹", cta: "साफ़ करें",
      title: `${blocked} posts "रोक दी गई" में अटकी हैं`,
      sub: "ज़्यादातर पुराने नियम की वजह से — एक बार में साफ़ हो जाएँगी",
      onClick: clearBlocked });
  }
  if (photoWait.length) {
    tasks.push({ tone: "warn", icon: "📷", cta: "photo डालें",
      title: `${photoWait.length} delivery post अटकी है — बस ग्राहक की photo बाक़ी`,
      sub: photoWait.slice(0, 2).map((p) => p.customerName || p.bikeName || "ग्राहक").join(", ")
           + (photoWait.length > 2 ? ` +${photoWait.length - 2}` : "") + " — नाम और गाड़ी पहले से भरी है",
      onClick: () => setSec("studio") });
  }
  if (d?.delivPending > 0) {
    tasks.push({ tone: "warn", icon: "🎥", cta: "देखें",
      title: `${d.delivPending} delivery post तैयार है`,
      sub: "ग्राहक की photo — उसे भेजने से दुकान का नाम फैलता है",
      onClick: () => setView("queue") });
  }
  if (gaps.length >= 3) {
    tasks.push({ tone: "info", icon: "🗓️", cta: "भरें",
      title: `अगले ${gaps.length} दिन खाली हैं`,
      sub: "जो दुकान रोज़ दिखती है, ग्राहक उसी को याद रखता है",
      onClick: () => setSec("calendar") });
  }
  if (d?.festival && d.festival.daysAway <= 7) {
    tasks.push({ tone: "info", icon: "🎉", cta: "बनाएँ",
      title: `${d.festival.name} ${d.festival.daysAway === 0 ? "आज है" : `${d.festival.daysAway} दिन में`}`,
      sub: "त्यौहार वाली post सबसे ज़्यादा share होती है",
      onClick: () => setSec("studio") });
  }

  const VIEWS = [["tasks", "काम"], ["queue", "कहाँ पहुँचा"], ["notif", `सूचना${notifs.length ? " " + notifs.length : ""}`]];

  return (
    <div className="space-y-4">

      {/* ── दिन का सार ────────────────────────────────────────── */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-neutral-100">
            {new Date().toLocaleDateString("hi-IN", { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          <button onClick={() => { vib(); load(); }} className="text-[11px] text-neutral-500 underline">ताज़ा करें</button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["आज भेजी", d?.sentToday ?? 0, accent],
            ["इंतज़ार में", d?.pending ?? 0, "#F59E0B"],
            ["नए ग्राहक", leads.length, "#10B981"],
          ].map(([l, v, c]) => (
            <div key={l} className="rounded-xl bg-neutral-950 border border-neutral-800 py-2.5 text-center">
              <div className="text-xl font-bold" style={{ color: c }}>{v}</div>
              <div className="text-[10px] text-neutral-500">{l}</div>
            </div>
          ))}
        </div>
      </div>

      <Err onClose={() => setErr("")}>{err}</Err>

      {/* ── तीन नज़रिये ───────────────────────────────────────── */}
      <div className="flex gap-1.5">
        {VIEWS.map(([id, label]) => (
          <button key={id} onClick={() => { vib(15); setView(id); if (id === "notif") markRead(); }}
            className="flex-1 rounded-xl py-2 text-xs font-medium border"
            style={{
              borderColor: view === id ? accent : "#262626",
              background: view === id ? accent + "18" : "transparent",
              color: view === id ? accent : "#737373",
            }}>{label}</button>
        ))}
      </div>

      {/* ── काम की सूची ───────────────────────────────────────── */}
      {view === "tasks" && (
        <div className="space-y-4">
          {tasks.length === 0 && !loading ? (
            <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "#10B98144", background: "#10B98110" }}>
              <div className="text-3xl mb-2">✓</div>
              <p className="text-sm font-semibold text-emerald-400">सब संभला हुआ है</p>
              <p className="text-xs text-neutral-500 mt-1">कुछ बाक़ी नहीं। नई post बनानी हो तो नीचे "बनाओ" दबाएँ।</p>
            </div>
          ) : (
            <div className="space-y-2">
              {tasks.map((t, i) => <Task key={i} {...t} />)}
            </div>
          )}

          {/* photo का इंतज़ार — बोलकर बनाई delivery posts */}
          {photoWait.length > 0 && (
            <div>
              <Title>photo का इंतज़ार ({photoWait.length})</Title>
              <div className="space-y-2">
                {photoWait.map((p) => (
                  <div key={p.deliveryId} className="rounded-2xl bg-neutral-900 border border-amber-900/60 p-3">
                    <div className="flex items-start gap-3">
                      <div className="w-14 h-14 rounded-xl bg-neutral-800 border border-dashed border-amber-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-xl opacity-60">📷</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-100">
                          {p.customerName || "नाम नहीं बताया"}
                        </p>
                        <p className="text-[11px] text-neutral-500">
                          {p.bikeName || "गाड़ी नहीं बताई"}{p.offer ? ` · ${p.offer}` : ""}
                        </p>
                        {p.text && <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1">{p.text}</p>}
                      </div>
                    </div>
                    <button onClick={() => { vib(); setSec("studio"); }}
                      className="w-full mt-2.5 rounded-lg py-2.5 text-sm font-semibold text-black"
                      style={{ background: "#F59E0B" }}>
                      📷 ग्राहक की photo डालें
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-neutral-600 mt-2">
                बनाओ → 🎥 Delivery post में जाइए। नाम और गाड़ी पहले से भरी मिलेगी।
              </p>
            </div>
          )}

          {/* इंतज़ार में पड़ी posts — यहीं से हाँ/ना */}
          {pending.length > 0 && (
            <div>
              <Title>आपकी हाँ का इंतज़ार ({pending.length})</Title>
              <div className="space-y-3">
                {pending.map((p) => (
                  <div key={p._id} className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
                    {p.video
                      ? <video src={media(p.video)} controls className="w-full max-h-80 bg-black" />
                      : <img src={media(p.imgUrl || p.images?.square)} alt="" className="w-full" />}
                    <div className="p-3">
                      <p className="text-sm text-neutral-300 whitespace-pre-line line-clamp-4 mb-3">{p.text}</p>

                      <button onClick={() => { vib(); nativeShare(p, brand.name); }}
                        className="w-full rounded-lg py-2.5 text-sm font-bold mb-2 active:opacity-70"
                        style={{ background: accent, color: "#fff" }}>
                        📤 अभी ख़ुद भेजें
                      </button>

                      {canApprove ? (
                        <div className="flex gap-2">
                          <button onClick={() => act("content", p._id, "approve")} disabled={busy}
                            className="flex-1 rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                            style={{ background: accent }}>✓ हाँ, भेज दो</button>
                          <button onClick={() => act("content", p._id, "reject")} disabled={busy}
                            className="rounded-lg py-2.5 px-4 text-sm text-neutral-400 border border-neutral-700">रहने दो</button>
                        </div>
                      ) : (
                        <p className="text-xs text-neutral-500 text-center">हाँ/ना सिर्फ़ manager या admin कह सकते हैं</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── पुराना Queue — जस का तस, बस अन्दर आ गया ───────────── */}
      {view === "queue" && <Queue apiBase={apiBase} token={token} brandId={brandId} setTab={() => {}} />}

      {/* ── सूचनाएँ ───────────────────────────────────────────── */}
      {view === "notif" && (
        <div className="space-y-2">
          {notifs.length === 0
            ? <Empty icon="🔔">कोई नई सूचना नहीं।</Empty>
            : notifs.map((n) => (
              <div key={n._id} className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5">
                <div className="text-sm text-neutral-200">{n.message}</div>
                <div className="text-[11px] text-neutral-500 mt-0.5">{timeAgo(n.createdAt)}</div>
              </div>
            ))}
        </div>
      )}

      {loading && <p className="text-xs text-neutral-600 text-center py-2">खुल रहा है…</p>}
    </div>
  );
}
