import React, { useState, useEffect } from "react";
import { getBrand } from "./brands.js";
const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// ═══════════════════════════════════════════════════════════════
//  NEWS / CURRENT INFORMATION  (PRD #25)
//  ⚠️ AI कोई खबर खुद नहीं बनाता। हर खबर भरोसेमंद source से आती है,
//     हर एक के साथ link होता है, और post बनाने से पहले
//     आपको खुद source खोलकर पुष्टि करनी पड़ती है।
// ═══════════════════════════════════════════════════════════════

const card = "rounded-2xl bg-neutral-900 border border-neutral-800 p-4";

export default function AINews({ apiBase, token, brandId, onSent }) {
  const B = getBrand(brandId);
  const H = { "Content-Type": "application/json", Authorization: "Bearer " + token };

  const [items, setItems] = useState([]);
  const [sources, setSources] = useState([]);
  const [onlyVerified, setOnlyVerified] = useState(false);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  async function load() {
    try {
      const r = await fetch(`${apiBase}/api/news?brand=${brandId}${onlyVerified ? "&verified=1" : ""}`, { headers: H });
      setItems((await r.json()) || []);
    } catch (e) { setErr(e.message); }
  }

  useEffect(() => { load(); }, [brandId, onlyVerified, apiBase]);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(apiBase + "/api/news/sources", { headers: H });
        setSources(((await r.json()).sources) || []);
      } catch (_) {}
    })();
  }, [apiBase]);

  async function fetchNews() {
    setErr(""); setNote(""); setBusy("भरोसेमंद sources से खबरें ला रहे हैं…"); vib(40);
    try {
      const r = await fetch(apiBase + "/api/news/fetch", {
        method: "POST", headers: H, body: JSON.stringify({ brand: brandId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setNote(j.added ? `✅ ${j.added} नई खबरें आईं` : (j.message || "कोई नई खबर नहीं"));
      await load(); vib([30, 30, 60]);
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  async function verify(id, val) {
    setErr(""); vib(25);
    try {
      const r = await fetch(`${apiBase}/api/news/${id}/verify`, {
        method: "PATCH", headers: H, body: JSON.stringify({ verified: val }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      setNote(val ? "✅ पुष्टि हो गई — अब इससे post बन सकती है" : "पुष्टि हटा दी");
      await load();
    } catch (e) { setErr(e.message); }
  }

  async function toPost(id) {
    setErr(""); setBusy("खबर से post बना रहे हैं…"); vib(50);
    try {
      const r = await fetch(`${apiBase}/api/news/${id}/to-post`, {
        method: "POST", headers: H, body: JSON.stringify({ brand: brandId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setNote("✅ Post बन गया — Review में देखें (source link caption में जुड़ गया है)");
      await load(); if (onSent) onSent();
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  async function del(id) {
    vib(20);
    try {
      await fetch(`${apiBase}/api/news/${id}`, { method: "DELETE", headers: H });
      await load();
    } catch (_) {}
  }

  return (
    <div className="space-y-3">
      {/* नियम — साफ़ दिखे */}
      <div className="rounded-2xl border border-amber-800/60 bg-amber-950/30 p-3">
        <p className="text-sm text-amber-200 font-semibold mb-1">⚠️ खबरों का नियम</p>
        <p className="text-xs text-amber-100/80 leading-relaxed">
          AI कोई खबर खुद नहीं बनाता। हर खबर नीचे दिए भरोसेमंद sources से ही आती है और
          उसके साथ link भी रहता है। AI सिर्फ़ उसका हिंदी सार बनाता है — कोई नई बात,
          तारीख़ या कीमत नहीं जोड़ता। <b>Post बनाने से पहले source खोलकर खुद पुष्टि करें।</b>
        </p>
        {sources.length > 0 && (
          <p className="text-[11px] text-amber-100/50 mt-2">
            Sources: {sources.map((s) => s.name).join(" · ")}
          </p>
        )}
      </div>

      {err && <div className="text-sm bg-red-950/60 border border-red-800 text-red-200 rounded-lg px-3 py-2">{err}</div>}
      {note && <div className="text-sm bg-green-950/50 border border-green-800 text-green-200 rounded-lg px-3 py-2">{note}</div>}
      {busy && <div className="text-sm bg-neutral-800 rounded-lg px-3 py-2 text-neutral-300">⏳ {busy}</div>}

      <div className="flex gap-2">
        <button onClick={fetchNews} disabled={!!busy}
          className="flex-1 rounded-xl py-3 font-semibold text-white disabled:opacity-50"
          style={{ background: B.accent }}>
          📰 नई खबरें लाएँ
        </button>
        <button onClick={() => { vib(15); setOnlyVerified((v) => !v); }}
          style={{ borderColor: onlyVerified ? B.accent : "#3a3a3a", color: onlyVerified ? "#fff" : "#9a9a9a" }}
          className="px-4 rounded-xl border text-sm">
          {onlyVerified ? "✅ सिर्फ़ verified" : "सब"}
        </button>
      </div>

      {items.length === 0 && (
        <p className="text-sm text-neutral-600">
          अभी कोई खबर नहीं। ऊपर "नई खबरें लाएँ" दबाएँ।
        </p>
      )}

      {items.map((n) => (
        <div key={n._id} className={card}>
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-neutral-100 leading-snug">{n.headline}</h3>
            <span className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
              style={{
                background: n.verified ? "#14532d" : "#422006",
                color: n.verified ? "#bbf7d0" : "#fed7aa",
              }}>
              {n.verified ? "✅ verified" : "⏳ जाँच बाकी"}
            </span>
          </div>

          <p className="text-sm text-neutral-400 leading-relaxed">{n.summary}</p>

          <div className="text-[11px] text-neutral-500 mt-2">
            📰 {n.sourceName}{n.publishedAt ? ` · ${n.publishedAt}` : ""}
          </div>

          <a href={n.sourceUrl} target="_blank" rel="noreferrer"
            className="block text-xs mt-1 underline break-all" style={{ color: B.accent }}>
            🔗 असली खबर खोलकर देखें
          </a>

          {!n.verified && n.verifyNote && (
            <p className="text-[11px] text-amber-300/70 mt-2">⚠️ {n.verifyNote}</p>
          )}

          <div className="flex gap-2 mt-3">
            {!n.verified ? (
              <button onClick={() => verify(n._id, true)}
                className="flex-1 text-xs py-2 rounded-lg border border-green-800 text-green-300">
                ✅ मैंने source देख लिया — सही है
              </button>
            ) : (
              <button onClick={() => toPost(n._id)} disabled={!!busy}
                className="flex-1 text-xs py-2 rounded-lg text-white disabled:opacity-50"
                style={{ background: B.accent }}>
                ✍️ इससे post बनाएँ
              </button>
            )}
            <button onClick={() => del(n._id)}
              className="px-3 text-xs py-2 rounded-lg border border-neutral-700 text-neutral-500">
              हटाएँ
            </button>
          </div>

          {n.usedForContent && (
            <p className="text-[11px] text-neutral-600 mt-2">इससे पहले ही post बन चुका है</p>
          )}
        </div>
      ))}
    </div>
  );
}
