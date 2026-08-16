import React, { useState, useEffect } from "react";
import { getBrand, BRAND_LABELS } from "./brands.js";
const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// ═══════════════════════════════════════════════════════════════
//  MAINTENANCE  (PRD #18, #38, #39, #44)
//   • Storage    — disk कितनी भरी है, पुरानी files साफ़ करें
//   • Retry Queue — जो posts fail हुए, कब दोबारा जाएँगे
//   • Audit Log  — किसने क्या किया, स्थायी record
// ═══════════════════════════════════════════════════════════════

const card = "rounded-2xl bg-neutral-900 border border-neutral-800 p-4";

const ACTION_LABEL = {
  publish: "📤 भेजा", send: "🔁 दोबारा भेजा", approve: "✅ approve",
  reject: "❌ reject", offer: "🏷️ offer", price: "💰 price",
  delete: "🗑️ हटाया", "login-fail": "🚫 गलत login",
};

export default function Maintenance({ apiBase, token, brandId }) {
  const B = getBrand(brandId);
  const H = { "Content-Type": "application/json", Authorization: "Bearer " + token };

  const [view, setView] = useState("storage");
  const [storage, setStorage] = useState(null);
  const [queue, setQueue] = useState(null);
  const [audit, setAudit] = useState([]);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  async function get(url, setter) {
    try {
      const r = await fetch(apiBase + url, { headers: H });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setter(j);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => {
    setErr("");
    if (view === "storage") get("/api/storage", setStorage);
    if (view === "retry") get(`/api/retry-queue?brand=${brandId}`, setQueue);
    if (view === "audit") get(`/api/audit?brand=${brandId}&limit=60`, setAudit);
  }, [view, brandId, apiBase]);

  async function runTrim() {
    setErr(""); setNote(""); setBusy("DB से पुरानी images हटा रहे हैं…"); vib(40);
    try {
      const r = await fetch(apiBase + "/api/storage/trim", { method: "POST", headers: H });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setNote(`✅ ${j.message}${j.after ? ` — memory अब ${j.after.rssMB} MB` : ""}`);
      vib([30, 30, 60]);
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  async function runCleanup() {
    if (!confirm("पुरानी और किसी post से न जुड़ी files हट जाएँगी। जारी रखें?")) return;
    setErr(""); setNote(""); setBusy("साफ़ कर रहे हैं…"); vib(40);
    try {
      const r = await fetch(apiBase + "/api/storage/cleanup", { method: "POST", headers: H });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setNote(`✅ ${j.deleted} files हटाईं — ${j.freedMB} MB जगह खाली हुई`);
      await get("/api/storage", setStorage);
      vib([30, 30, 60]);
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  async function runRetry() {
    setErr(""); setNote(""); setBusy("दोबारा भेज रहे हैं…"); vib(40);
    try {
      const r = await fetch(apiBase + "/api/retry-queue/run", { method: "POST", headers: H });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setNote("✅ retry चला दिया — Queue में देखें");
      await get(`/api/retry-queue?brand=${brandId}`, setQueue);
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  const when = (d) => {
    if (!d) return "—";
    const t = new Date(d), now = Date.now();
    const m = Math.round((t - now) / 60000);
    if (m > 0) return `${m} मिनट में`;
    return t.toLocaleString("hi-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
  };

  const pending = (queue?.content?.length || 0) + (queue?.deliveries?.length || 0);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[["storage", "💾 जगह"], ["retry", `🔁 दोबारा${pending ? ` (${pending})` : ""}`], ["audit", "📜 रिकॉर्ड"]].map(([id, label]) => (
          <button key={id} onClick={() => { vib(15); setView(id); }}
            style={{ borderColor: view === id ? B.accent : "#3a3a3a", background: view === id ? B.accent : "transparent", color: view === id ? "#fff" : "#9a9a9a" }}
            className="flex-1 px-3 py-2 rounded-xl text-sm font-medium border">{label}</button>
        ))}
      </div>

      {err && <div className="text-sm bg-red-950/60 border border-red-800 text-red-200 rounded-lg px-3 py-2">{err}</div>}
      {note && <div className="text-sm bg-green-950/50 border border-green-800 text-green-200 rounded-lg px-3 py-2">{note}</div>}
      {busy && <div className="text-sm bg-neutral-800 rounded-lg px-3 py-2 text-neutral-300">⏳ {busy}</div>}

      {/* ══════ STORAGE ══════ */}
      {view === "storage" && (
        <>
          <div className={card}>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl bg-neutral-800/60 p-3">
                <p className="text-xs text-neutral-400">अभी इस्तेमाल</p>
                <p className="text-2xl font-bold" style={{ color: B.accent }}>{storage?.mb ?? "—"} <span className="text-sm">MB</span></p>
                <p className="text-[11px] text-neutral-500">{storage?.files ?? 0} files</p>
              </div>
              <div className="rounded-xl bg-neutral-800/60 p-3">
                <p className="text-xs text-neutral-400">साफ़ हो सकती है</p>
                <p className="text-2xl font-bold text-amber-400">{storage?.wouldFreeMB ?? "—"} <span className="text-sm">MB</span></p>
                <p className="text-[11px] text-neutral-500">{storage?.wouldDelete ?? 0} पुरानी files</p>
              </div>
            </div>

            <p className="text-xs text-neutral-500 mt-3 leading-relaxed">
              {storage?.note || "…"}<br />
              अभी {storage?.inUse ?? 0} files किसी post से जुड़ी हैं — <b className="text-neutral-400">वो कभी नहीं हटतीं</b>।
            </p>

            <button onClick={runCleanup} disabled={!!busy || !storage?.wouldDelete}
              className="w-full mt-3 rounded-xl py-3 font-semibold text-white disabled:opacity-40"
              style={{ background: B.accent }}>
              🧹 अभी साफ़ करें
            </button>

            {/* ⚠️ Render की memory भरने पर सबसे पहले यही दबाएँ */}
            <button onClick={runTrim} disabled={!!busy}
              className="w-full mt-2 rounded-xl py-2.5 text-sm font-semibold border border-amber-800/70 text-amber-300 disabled:opacity-50">
              ⚡ Memory हल्की करें (DB से पुरानी images हटाएँ)
            </button>
            <p className="text-[11px] text-neutral-600 mt-1.5 leading-relaxed">
              Render से "memory limit exceeded" का mail आए तो यही दबाएँ। जो पोस्ट अभी
              Review में हैं और नई हैं, उन्हें हाथ नहीं लगाता।
            </p>
          </div>

          <p className="text-[11px] text-neutral-600 leading-relaxed">
            ℹ️ यह काम <b>रोज़ रात 3 बजे अपने आप</b> भी होता है। Render की disk छोटी होती है —
            अगर यह न हो तो कुछ महीनों में जगह भरकर सब कुछ fail होने लगेगा।
            कितने दिन की files रखनी हैं, यह Render env में
            <code className="mx-1 text-neutral-500">KEEP_FILE_DAYS</code> से बदल सकते हैं।
          </p>
        </>
      )}

      {/* ══════ RETRY QUEUE ══════ */}
      {view === "retry" && (
        <>
          {pending === 0 ? (
            <div className={card}>
              <p className="text-sm text-neutral-400">✅ कुछ भी अटका नहीं है — सब भेजा जा चुका है।</p>
            </div>
          ) : (
            <>
              <div className={card}>
                <p className="text-sm text-neutral-300">
                  {pending} post अटके हैं। ये <b>अपने आप</b> दोबारा भेजे जाएँगे
                  (ज़्यादा से ज़्यादा {queue?.maxAttempts || 3} कोशिशें — 2, फिर 10, फिर 30 मिनट बाद)।
                </p>
                <button onClick={runRetry} disabled={!!busy}
                  className="w-full mt-3 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
                  style={{ background: B.accent }}>
                  🔁 इंतज़ार न करें — अभी कोशिश करें
                </button>
              </div>

              {(queue?.content || []).map((c) => (
                <div key={c._id} className="rounded-xl bg-neutral-900 border border-neutral-800 p-3">
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>{c.type} · कोशिश {c.attempts}/{queue.maxAttempts}</span>
                    <span className="text-amber-400">{when(c.nextRetryAt)}</span>
                  </div>
                  <p className="text-sm text-neutral-300 line-clamp-2">{c.text}</p>
                  {c.error && <p className="text-[11px] text-red-300/70 mt-1">⚠️ {String(c.error).slice(0, 120)}</p>}
                </div>
              ))}

              {(queue?.deliveries || []).map((d) => (
                <div key={d._id} className="rounded-xl bg-neutral-900 border border-neutral-800 p-3">
                  <div className="flex justify-between text-xs text-neutral-500 mb-1">
                    <span>Delivery · कोशिश {d.attempts}/{queue.maxAttempts}</span>
                    <span className="text-amber-400">{when(d.nextRetryAt)}</span>
                  </div>
                  <p className="text-sm text-neutral-300">{d.customerName || "—"}</p>
                </div>
              ))}
            </>
          )}
        </>
      )}

      {/* ══════ AUDIT LOG ══════ */}
      {view === "audit" && (
        <>
          <p className="text-xs text-neutral-500 leading-relaxed">
            यह स्थायी रिकॉर्ड है — भेजना, approve, reject, offer/price बदलना सब यहाँ लिखा जाता है
            और <b className="text-neutral-400">कभी अपने आप नहीं मिटता</b>।
          </p>

          {audit.length === 0 && <p className="text-sm text-neutral-600">अभी कोई रिकॉर्ड नहीं।</p>}

          {audit.map((a) => (
            <div key={a._id} className="rounded-xl bg-neutral-900 border border-neutral-800 p-3">
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-neutral-200">
                  {ACTION_LABEL[a.action] || a.action}
                </span>
                <span className="text-[11px] text-neutral-500 shrink-0">
                  {new Date(a.createdAt).toLocaleString("hi-IN", { timeZone: "Asia/Kolkata", day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
              <p className="text-sm text-neutral-400 mt-1">{a.summary}</p>
              <p className="text-[11px] text-neutral-600 mt-1">
                {a.actor}{a.actorRole ? ` (${a.actorRole})` : ""}
                {a.brand && BRAND_LABELS[a.brand] ? ` · ${BRAND_LABELS[a.brand]}` : ""}
                {a.ip ? ` · ${a.ip}` : ""}
              </p>
            </div>
          ))}
        </>
      )}
    </div>
  );
}
