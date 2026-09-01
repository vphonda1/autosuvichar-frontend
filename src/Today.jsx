// ============================================================================
//  Today.jsx — "आज"
//  ---------------------------------------------------------------------------
//  पहले: तीन बटन ऊपर — काम / कहाँ पहुँचा / सूचना। हर बटन एक अलग दुनिया।
//  यह देखने के लिए कि कुछ छूट तो नहीं रहा, तीनों में जाना पड़ता था। और पन्ना
//  खुलते ही 5 request जाती थीं, जिनमें 2 App.jsx वाली से दोहरी थीं।
//
//  अब: कोई बटन नहीं। एक सीधी सूची, ज़रूरत के क्रम में —
//
//     🛑 रुकी हुई post (ग़लत क़ीमत पकड़ी गई)   ← सबसे ऊपर, सबसे ज़रूरी
//     ⚡ अभी बन रही है
//     📋 करने लायक़ काम
//     👀 आपकी हाँ का इंतज़ार — poster के साथ, यहीं से हाँ/ना
//     📞 नए ग्राहक
//     🔔 सूचनाएँ            (बन्द, खोलने पर दिखे)
//     📊 कहाँ पहुँचा         (बन्द, खोलने पर दिखे)
//
//  नीचे स्क्रॉल कीजिए — पूरा दिन एक नज़र में। कोई request अपनी तरफ़ से नहीं
//  जाती; डेटा App.jsx की एक ही request से आता है।
//
//  ⚠️ कोई feature हटाया नहीं गया। Queue और सूचना नीचे मौजूद हैं।
// ============================================================================

import React, { useState } from "react";
import { api, media, vib, Title, Empty, Err, Fold, CAN_APPROVE, nativeShare } from "./shared.jsx";
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

export default function Today({
  apiBase, token, brandId, brand, user, accent,
  onChange, setSec, today, loading, onReload,
}) {
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const canApprove = CAN_APPROVE.includes(user.role);

  const C = (today && today.counts) || {};
  const pending = (today && today.pending) || [];
  const leads = (today && today.leads) || [];
  const deliveries = (today && today.deliveries) || [];
  const notifs = (today && today.notifications) || [];
  const blocked = (today && today.blocked) || [];
  const running = (today && today.running) || [];
  const gaps = (today && today.emptyDays) || [];
  const festival = today && today.festival;

  async function act(kind, id, what) {
    setBusy(true); setErr("");
    try {
      await api(`/api/${kind}/${id}/${what}`, { method: "POST" });
      onReload ? await onReload() : onChange && onChange();
      onChange && onChange();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function markRead() {
    try { await api("/api/notifications/read", { method: "POST" }); onChange && onChange(); } catch (_) {}
  }

  // ── करने लायक़ काम इकट्ठे करो ──────────────────────────────────
  const tasks = [];
  if (C.failedToday > 0) {
    tasks.push({ tone: "danger", icon: "⚠️", cta: "ठीक करें",
      title: `${C.failedToday} post आज नहीं जा पाई`,
      sub: "सेटिंग में token देखें, फिर दोबारा भेजें",
      onClick: () => setSec("settings") });
  }
  if (leads.length) {
    tasks.push({ tone: "danger", icon: "📞", cta: "खोलें",
      title: `${leads.length} नए ग्राहक — अभी बात नहीं हुई`,
      sub: leads.slice(0, 2).map((l) => l.name || l.mobile).join(", ") + (leads.length > 2 ? ` +${leads.length - 2}` : ""),
      onClick: () => setSec("results") });
  }
  if (deliveries.length > 0) {
    tasks.push({ tone: "warn", icon: "🎥", cta: "देखें",
      title: `${deliveries.length} delivery post तैयार है`,
      sub: "ग्राहक की photo — उसे भेजने से दुकान का नाम फैलता है",
      onClick: () => setSec("studio") });
  }
  if (gaps.length >= 3) {
    tasks.push({ tone: "info", icon: "🗓️", cta: "भरें",
      title: `अगले ${gaps.length} दिन खाली हैं`,
      sub: "जो दुकान रोज़ दिखती है, ग्राहक उसी को याद रखता है",
      onClick: () => setSec("calendar") });
  }
  if (festival && festival.daysAway <= 7) {
    tasks.push({ tone: "info", icon: "🎉", cta: "बनाएँ",
      title: `${festival.name} ${festival.daysAway === 0 ? "आज है" : `${festival.daysAway} दिन में`}`,
      sub: "त्यौहार वाली post सबसे ज़्यादा share होती है",
      onClick: () => setSec("studio") });
  }

  const allClear = !loading && !blocked.length && !running.length && !tasks.length && !pending.length;

  return (
    <div className="space-y-4">

      {/* ── दिन का सार ────────────────────────────────────────── */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
        <div className="flex items-baseline justify-between mb-3">
          <h2 className="text-base font-semibold text-neutral-100">
            {new Date().toLocaleDateString("hi-IN", { weekday: "long", day: "numeric", month: "long" })}
          </h2>
          <button onClick={() => { vib(); onReload && onReload(); }} className="text-[11px] text-neutral-500 underline">
            {loading ? "…" : "ताज़ा करें"}
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            ["आज भेजी", C.sentToday ?? 0, accent],
            ["इंतज़ार में", C.pending ?? 0, "#F59E0B"],
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

      {/* ── 🛑 रुकी हुई post — सबसे ऊपर, क्योंकि यह पैसे का मामला है ── */}
      {blocked.length > 0 && (
        <div className="space-y-2">
          {blocked.map((b) => (
            <div key={b._id} className="rounded-2xl border border-red-800 bg-red-950/40 p-4">
              <div className="flex items-start gap-2.5">
                <span className="text-xl flex-shrink-0">🛑</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-red-200">एक post रोक दी गई</p>
                  {b.command && <p className="text-[11px] text-red-300/60 mt-0.5 truncate">"{b.command}"</p>}
                  <p className="text-[13px] text-red-100/80 mt-1.5 leading-relaxed">{b.reason}</p>
                  {b.unknown?.length > 0 && (
                    <p className="text-sm font-semibold text-red-200 mt-2">{b.unknown.join("  ·  ")}</p>
                  )}
                </div>
              </div>
              <button onClick={() => { vib(); setSec("settings"); }}
                className="mt-3 w-full rounded-xl py-2.5 text-xs font-semibold border border-red-700 text-red-200 active:bg-red-900/40">
                गाड़ियों की क़ीमत ठीक करें
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── ⚡ अभी बन रही है ──────────────────────────────────── */}
      {running.length > 0 && (
        <button onClick={() => { vib(); setSec("studio"); }}
          className="w-full flex items-center gap-3 rounded-2xl border px-4 py-3.5 text-left"
          style={{ background: accent + "14", borderColor: accent + "44" }}>
          <span className="text-xl flex-shrink-0">⚡</span>
          <span className="flex-1 min-w-0">
            <span className="block text-sm font-semibold text-neutral-100">
              {running.length} post अभी बन रही {running.length > 1 ? "हैं" : "है"}
            </span>
            <span className="block text-[11px] text-neutral-400 mt-0.5 truncate">
              {running[0].command || "थोड़ी देर में तैयार"}
            </span>
          </span>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full text-white flex-shrink-0" style={{ background: accent }}>
            देखें
          </span>
        </button>
      )}

      {/* ── 📋 करने लायक़ काम ─────────────────────────────────── */}
      {tasks.length > 0 && (
        <div className="space-y-2">
          {tasks.map((t, i) => <Task key={i} {...t} />)}
        </div>
      )}

      {/* ── सब संभला हुआ है ──────────────────────────────────── */}
      {allClear && (
        <div className="rounded-2xl border p-6 text-center" style={{ borderColor: "#10B98144", background: "#10B98110" }}>
          <div className="text-3xl mb-2">✓</div>
          <p className="text-sm font-semibold text-emerald-400">सब संभला हुआ है</p>
          <p className="text-xs text-neutral-500 mt-1">कुछ बाक़ी नहीं। नई post बनानी हो तो नीचे "बनाओ" दबाएँ।</p>
        </div>
      )}

      {/* ── 👀 आपकी हाँ का इंतज़ार — poster के साथ, यहीं से हाँ/ना ── */}
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

      {/* ── 📞 नए ग्राहक ─────────────────────────────────────── */}
      {leads.length > 0 && (
        <div>
          <Title>नए ग्राहक ({leads.length})</Title>
          <div className="space-y-2">
            {leads.slice(0, 8).map((l) => (
              <div key={l._id} className="flex items-center gap-3 rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5">
                <span className="flex-1 min-w-0">
                  <span className="block text-sm text-neutral-200 truncate">{l.name || "नाम नहीं बताया"}</span>
                  <span className="block text-[11px] text-neutral-500">{l.mobile} · {timeAgo(l.createdAt)}</span>
                </span>
                {l.mobile && (
                  <a href={`tel:${l.mobile}`} onClick={() => vib()}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full text-white flex-shrink-0"
                    style={{ background: "#10B981" }}>📞 कॉल</a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 🔔 सूचनाएँ — बन्द, ज़रूरत पर खुलें ────────────────── */}
      <Fold icon="🔔" title={`सूचनाएँ${C.unread ? ` (${C.unread} नई)` : ""}`} sub="क्या-क्या हुआ">
        <div className="space-y-2 pt-2">
          {notifs.length === 0
            ? <Empty icon="🔔">कोई सूचना नहीं।</Empty>
            : <>
                {notifs.map((n) => (
                  <div key={n._id} className="rounded-xl bg-neutral-800/50 border border-neutral-700 px-3 py-2.5">
                    <div className="text-sm text-neutral-200">{n.message}</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">{timeAgo(n.createdAt)}</div>
                  </div>
                ))}
                {C.unread > 0 && (
                  <button onClick={() => { vib(); markRead(); }}
                    className="w-full rounded-lg py-2 text-xs text-neutral-400 border border-neutral-700">
                    सब पढ़ी हुई मान लें
                  </button>
                )}
              </>}
        </div>
      </Fold>

      {/* ── 📊 कहाँ पहुँचा — पुराना Queue, जस का तस ──────────── */}
      <Fold icon="📊" title="कहाँ पहुँचा" sub="भेजी हुई posts और उनका हाल">
        <div className="pt-2">
          <Queue apiBase={apiBase} token={token} brandId={brandId} setTab={() => {}} />
        </div>
      </Fold>

      {loading && !today && <p className="text-xs text-neutral-600 text-center py-2">खुल रहा है…</p>}
    </div>
  );
}
