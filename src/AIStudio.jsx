import React, { useState, useEffect } from "react";
import { getBrand } from "./brands.js";
const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// ═══════════════════════════════════════════════════════════════
//  AI STUDIO
//   • Platform Adapter (PRD #15, #16) — एक content → हर platform का version
//   • Content Variations (PRD #28)    — एक विषय के कई versions + AI की सिफ़ारिश
// ═══════════════════════════════════════════════════════════════

const inp = "w-full bg-neutral-800 rounded-lg p-2.5 text-sm outline-none border border-neutral-700 text-white";
const lbl = "text-xs text-neutral-400 mb-1";
const card = "rounded-2xl bg-neutral-900 border border-neutral-800 p-4";

const PLAT_ICON = { whatsapp: "💬", instagram: "📸", facebook: "👥", youtube: "▶️", status: "⚡" };
const PLAT_NAME = { whatsapp: "WhatsApp", instagram: "Instagram", facebook: "Facebook", youtube: "YouTube Shorts", status: "Status" };

function CopyBox({ title, icon, text, tags, accent }) {
  const [done, setDone] = useState(false);
  const full = (text || "") + (tags && tags.length ? "\n\n" + tags.join(" ") : "");
  async function copy() {
    vib(30);
    try { await navigator.clipboard.writeText(full); }
    catch (_) {
      const ta = document.createElement("textarea");
      ta.value = full; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove();
    }
    setDone(true); setTimeout(() => setDone(false), 1600);
  }
  async function share() {
    vib(30);
    try { await navigator.share({ text: full }); } catch (_) {}
  }
  return (
    <div className="rounded-xl bg-neutral-800/60 border border-neutral-700 p-3">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-neutral-200">{icon} {title}</span>
        <span className="text-[11px] text-neutral-500">{full.length} अक्षर</span>
      </div>
      <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">{text}</p>
      {tags && tags.length > 0 && (
        <p className="text-xs mt-2 leading-relaxed" style={{ color: accent }}>{tags.join(" ")}</p>
      )}
      <div className="flex gap-2 mt-3">
        <button onClick={copy} className="flex-1 text-xs py-2 rounded-lg border border-neutral-700 text-neutral-300">
          {done ? "✅ कॉपी हो गया" : "📋 Copy"}
        </button>
        {navigator.share && (
          <button onClick={share} className="flex-1 text-xs py-2 rounded-lg border border-neutral-700 text-neutral-300">↗ Share</button>
        )}
      </div>
    </div>
  );
}

export default function AIStudio({ apiBase, token, brandId, onSent }) {
  const B = getBrand(brandId);
  const H = { "Content-Type": "application/json", Authorization: "Bearer " + token };

  const [mode, setMode] = useState("adapt");   // adapt | variants
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  // ── Adapter ──
  const [src, setSrc] = useState("");
  const [picked, setPicked] = useState(["whatsapp", "instagram", "facebook", "status"]);
  const [adapted, setAdapted] = useState(null);
  const [posts, setPosts] = useState([]);

  // ── Variants ──
  const [topic, setTopic] = useState("");
  const [vCount, setVCount] = useState(3);
  const [vSet, setVSet] = useState(null);
  const [chosen, setChosen] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(`${apiBase}/api/content?brand=${brandId}&status=pending`, { headers: H });
        setPosts((await r.json()) || []);
      } catch (_) {}
    })();
  }, [brandId, apiBase]);

  const toggle = (p) => setPicked((a) => a.includes(p) ? a.filter((x) => x !== p) : [...a, p]);

  async function runAdapt() {
    if (!src.trim()) { setErr("पहले content लिखें या कोई pending post चुनें"); return; }
    if (!picked.length) { setErr("कम से कम एक platform चुनें"); return; }
    setErr(""); setNote(""); setAdapted(null); setBusy("हर platform का version बन रहा है…"); vib(40);
    try {
      const r = await fetch(apiBase + "/api/adapt", {
        method: "POST", headers: H,
        body: JSON.stringify({ brand: brandId, text: src, platforms: picked }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setAdapted(j); setNote("✅ तैयार — नीचे से copy करके भेजें");
      vib([30, 30, 60]);
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  async function runVariants() {
    if (!topic.trim()) { setErr("विषय लिखें"); return; }
    setErr(""); setNote(""); setVSet(null); setChosen(null);
    setBusy(`${vCount} versions बन रहे हैं…`); vib(40);
    try {
      const r = await fetch(apiBase + "/api/variants/caption", {
        method: "POST", headers: H,
        body: JSON.stringify({ brand: brandId, topic, count: vCount }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setVSet(j); setChosen(j.recommendedIndex ?? 0);
      setNote("✅ तैयार — AI की सिफ़ारिश पर ⭐ लगा है");
      vib([30, 30, 60]);
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  async function chooseVariant(i) {
    setChosen(i); vib(25);
    if (!vSet?.setId) return;
    try {
      await fetch(`${apiBase}/api/variants/${vSet.setId}/choose`, {
        method: "POST", headers: H, body: JSON.stringify({ index: i }),
      });
      if (i !== vSet.recommendedIndex) setNote("👍 याद रख लिया — आगे ऐसा ही अंदाज़ बनाएँगे");
    } catch (_) {}
  }

  // चुना हुआ version सीधे Adapter में भेजो
  function sendToAdapter(text, tags) {
    setSrc((text || "") + (tags?.length ? "\n" + tags.join(" ") : ""));
    setMode("adapt"); vib(30);
    setNote("Adapter में भेज दिया — अब platform चुनें");
  }

  return (
    <div className="space-y-3">
      {/* mode switch */}
      <div className="flex gap-2">
        {[["adapt", "📱 हर Platform का version"], ["variants", "🎲 कई Versions"]].map(([id, label]) => (
          <button key={id} onClick={() => { vib(15); setMode(id); }}
            style={{ borderColor: mode === id ? B.accent : "#3a3a3a", background: mode === id ? B.accent : "transparent", color: mode === id ? "#fff" : "#9a9a9a" }}
            className="flex-1 px-3 py-2 rounded-xl text-sm font-medium border">{label}</button>
        ))}
      </div>

      {err && <div className="text-sm bg-red-950/60 border border-red-800 text-red-200 rounded-lg px-3 py-2">{err}</div>}
      {note && <div className="text-sm bg-green-950/50 border border-green-800 text-green-200 rounded-lg px-3 py-2">{note}</div>}
      {busy && <div className="text-sm bg-neutral-800 rounded-lg px-3 py-2 text-neutral-300">⏳ {busy}</div>}

      {/* ═══════════ ADAPTER ═══════════ */}
      {mode === "adapt" && (<>
        <div className={card}>
          <p className={lbl}>Content — एक बार लिखें, हर platform का version अपने आप बनेगा</p>
          <textarea rows={4} value={src} onChange={(e) => setSrc(e.target.value)} className={inp}
            placeholder={`जैसे: ${B.products[0]} पर इस हफ़्ते खास ऑफर, आसान EMI उपलब्ध`} />

          {posts.length > 0 && (
            <>
              <p className={lbl + " mt-3"}>या कोई pending post उठाएँ</p>
              <select onChange={(e) => e.target.value && setSrc(e.target.value)} className={inp} defaultValue="">
                <option value="">— चुनें —</option>
                {posts.map((p) => (
                  <option key={p._id} value={p.text}>{String(p.text || "").slice(0, 55).replace(/\n/g, " ")}…</option>
                ))}
              </select>
            </>
          )}

          <p className={lbl + " mt-3"}>किन platforms के लिए?</p>
          <div className="flex flex-wrap gap-2">
            {Object.keys(PLAT_NAME).map((p) => (
              <button key={p} onClick={() => { vib(15); toggle(p); }}
                style={{ borderColor: picked.includes(p) ? B.accent : "#3a3a3a", background: picked.includes(p) ? B.accent : "transparent", color: picked.includes(p) ? "#fff" : "#9a9a9a" }}
                className="px-3 py-1.5 rounded-full text-sm border">{PLAT_ICON[p]} {PLAT_NAME[p]}</button>
            ))}
          </div>

          <button onClick={runAdapt} disabled={!!busy}
            className="w-full mt-4 rounded-xl py-3 font-semibold text-white disabled:opacity-50"
            style={{ background: B.accent }}>
            ✨ सब versions बनाएँ
          </button>
        </div>

        {adapted && (
          <div className="space-y-3">
            {picked.filter((p) => adapted[p]).map((p) => (
              <CopyBox key={p} title={PLAT_NAME[p]} icon={PLAT_ICON[p]}
                text={adapted[p].text} tags={adapted[p].hashtags} accent={B.accent} />
            ))}
            {adapted.whatsappMessage && (
              <CopyBox title="WhatsApp — forward करने लायक" icon="📨" text={adapted.whatsappMessage} accent={B.accent} />
            )}
            {adapted.shortCaption && (
              <CopyBox title="छोटा caption" icon="✂️" text={adapted.shortCaption} accent={B.accent} />
            )}
            {adapted.longCaption && (
              <CopyBox title="विस्तृत caption" icon="📄" text={adapted.longCaption} accent={B.accent} />
            )}
            {adapted.cta && (
              <div className="rounded-xl bg-neutral-800/60 border border-neutral-700 p-3">
                <p className="text-xs text-neutral-400 mb-1">Call to Action</p>
                <p className="text-sm font-semibold" style={{ color: B.accent }}>{adapted.cta}</p>
              </div>
            )}
          </div>
        )}
      </>)}

      {/* ═══════════ VARIATIONS ═══════════ */}
      {mode === "variants" && (<>
        <div className={card}>
          <p className={lbl}>किस चीज़ के कई versions चाहिए?</p>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} className={inp}
            placeholder={`जैसे: ${B.products[0]} का दिवाली ऑफर`} />

          <p className={lbl + " mt-3"}>कितने versions — {vCount}</p>
          <input type="range" min={2} max={5} value={vCount} onChange={(e) => setVCount(+e.target.value)} className="w-full" />

          <button onClick={runVariants} disabled={!!busy}
            className="w-full mt-3 rounded-xl py-3 font-semibold text-white disabled:opacity-50"
            style={{ background: B.accent }}>
            🎲 {vCount} अलग-अलग versions बनाएँ
          </button>
        </div>

        {vSet?.recommendReason_hindi && (
          <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-3">
            <p className="text-xs text-neutral-400">🧠 AI की सिफ़ारिश</p>
            <p className="text-sm text-neutral-300 mt-1">{vSet.recommendReason_hindi}</p>
          </div>
        )}

        {(vSet?.variants || []).map((v, i) => (
          <div key={i} className="rounded-2xl border p-4"
            style={{
              borderColor: chosen === i ? B.accent : "#2a2a2a",
              background: chosen === i ? "rgba(255,255,255,0.04)" : "#171717",
            }}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-neutral-200">
                {i === vSet.recommendedIndex && "⭐ "}{v.style_hindi || `Version ${i + 1}`}
              </span>
              {chosen === i && <span className="text-[11px] px-2 py-0.5 rounded-full text-white" style={{ background: B.accent }}>चुना हुआ</span>}
            </div>

            <p className="text-sm text-neutral-300 whitespace-pre-wrap leading-relaxed">{v.text}</p>
            {v.hashtags?.length > 0 && (
              <p className="text-xs mt-2" style={{ color: B.accent }}>{v.hashtags.join(" ")}</p>
            )}

            <div className="flex gap-2 mt-3">
              <button onClick={() => chooseVariant(i)}
                className="flex-1 text-xs py-2 rounded-lg border border-neutral-700 text-neutral-300">
                {chosen === i ? "✅ चुना" : "यह चुनें"}
              </button>
              <button onClick={() => sendToAdapter(v.text, v.hashtags)}
                className="flex-1 text-xs py-2 rounded-lg border border-neutral-700 text-neutral-300">
                📱 हर platform के लिए
              </button>
            </div>
          </div>
        ))}
      </>)}

      <p className="text-[11px] text-neutral-600 leading-relaxed">
        ℹ️ AI कोई नया price/EMI/offer खुद नहीं बनाता — सिर्फ़ वही लिखता है जो आपने बताया
        या जो गाड़ियों के database में है।
      </p>
    </div>
  );
}
