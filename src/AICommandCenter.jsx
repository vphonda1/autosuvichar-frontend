const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState, useRef, useEffect } from "react";
import AIPosterCanvas from "./AIPosterCanvas.jsx";
import QualityCheck from "./QualityCheck.jsx";

// ⚠️ पहले हर file में अपनी copy थी — अब brands.js से (एक जगह बदलो, हर जगह बदले)
import { BRAND_LABELS, BRAND_ADDRESS, getBrand } from "./brands.js";
const DEALER_SUB = BRAND_ADDRESS;
const TYPE_LABELS = { suvichar: "सुविचार", vigyapan: "विज्ञापन", festival: "त्यौहार शुभकामना", suchna: "सूचना", gift: "गिफ्ट प्रचार" };

// ⚠️ उदाहरण अब चुने हुए brand के हिसाब से (पहले सब पर Honda के ही थे)
const examplesFor = (bid) => {
  const b = getBrand(bid);
  return [
    `आज ${b.name} के ${b.products[0]} का ऑफर बनाओ`,
    "कल सुबह 9 बजे सुविचार schedule करो",
    `हर दिन शाम 6 बजे ${b.products[1] || b.products[0]} का ऑफर भेजो`,
    `${b.name} का त्यौहार पोस्ट बनाओ अभी`,
  ];
};

export default function AICommandCenter({ apiBase, token, brandId, onSent }) {
  const [command, setCommand] = useState("");
  const [listening, setListening] = useState(false);
  const [understanding, setUnderstanding] = useState(false);
  const [intent, setIntent] = useState(null);
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState(null);
  const [note, setNote] = useState("");
  const [scheduled, setScheduled] = useState([]);
  const [showScheduled, setShowScheduled] = useState(false);
  const [posterSpec, setPosterSpec] = useState(null);
  const [makingPoster, setMakingPoster] = useState(false);
  const recogRef = useRef(null);

  // ── Voice recognition setup ──────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "hi-IN";
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e) => {
      let txt = "";
      for (let i = 0; i < e.results.length; i++) txt += e.results[i][0].transcript;
      setCommand(txt);
    };
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); setNote("❌ आवाज़ समझ नहीं आई — फिर कोशिश करें"); };
    recogRef.current = r;
  }, []);

  function startVoice() {
    if (!recogRef.current) { setNote("⚠️ इस browser में voice input support नहीं है — type करें"); return; }
    vib(40);
    setCommand("");
    setListening(true);
    try { recogRef.current.start(); } catch (_) {}
  }
  function stopVoice() {
    vib(20);
    try { recogRef.current?.stop(); } catch (_) {}
    setListening(false);
  }

  // ── Step 1: Understand command ───────────────────────────────
  async function understand() {
    if (!command.trim()) return;
    vib(30);
    setUnderstanding(true); setIntent(null); setResult(null); setNote("");
    try {
      const res = await fetch(apiBase + "/api/command/understand", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ command: command.trim(), defaultBrand: brandId }),
      });
      const data = await res.json();
      if (data.error && !data.type) throw new Error(data.error);
      setIntent(data);
    } catch (e) { setNote("❌ " + e.message); }
    setUnderstanding(false);
  }

  // ── Step 2: Confirm & execute ────────────────────────────────
  async function execute() {
    if (!intent) return;
    vib(60);
    setExecuting(true); setNote("");
    try {
      const res = await fetch(apiBase + "/api/command/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          brand: intent.brand, type: intent.type, vehicle: intent.vehicle,
          offer_details: intent.offer_details, custom_text: intent.custom_text, schedule: intent.schedule,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setResult(data);
      vib([30, 30, 60]);
      if (data.mode === "generated") {
        setNote("✅ Content बन गया! Review में देखें।");
        if (onSent) onSent();
      } else {
        setNote("✅ Schedule हो गया! तय समय पर तैयार होकर Review में आ जाएगा।");
      }
      setCommand(""); setIntent(null);
    } catch (e) { setNote("❌ " + e.message); }
    setExecuting(false);
  }

  function cancel() { vib(15); setIntent(null); setResult(null); }

  // ── Poster mode: AI से पूरा design spec लो ───────────────────
  async function makePoster() {
    if (!intent?.brand) return;
    vib(50);
    setMakingPoster(true); setNote("");
    try {
      const res = await fetch(apiBase + "/api/command/poster-spec", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({
          brand: intent.brand, command: command || intent.summary_hindi || "",
          vehicle: intent.vehicle, offer_details: intent.offer_details, type: intent.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error");
      setPosterSpec({ ...data, __brand: intent.brand });
      vib([30, 30, 60]);
    } catch (e) { setNote("❌ " + e.message); }
    setMakingPoster(false);
  }

  async function loadScheduled() {
    try {
      const res = await fetch(apiBase + "/api/command/scheduled?brand=" + brandId, {
        headers: { Authorization: "Bearer " + token },
      });
      setScheduled(await res.json());
    } catch (_) {}
  }
  function toggleScheduled() {
    vib(20);
    if (!showScheduled) loadScheduled();
    setShowScheduled(!showScheduled);
  }
  async function cancelScheduled(id) {
    vib(30);
    try {
      await fetch(apiBase + "/api/command/scheduled/" + id, { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      loadScheduled();
    } catch (_) {}
  }

  const scheduleLabel = (s) => {
    if (!s) return "अभी";
    if (s.when === "now") return "अभी";
    if (s.when === "today") return `आज ${s.time || ""}`.trim();
    if (s.when === "tomorrow") return `कल ${s.time || ""}`.trim();
    return `${s.date || ""} ${s.time || ""}`.trim();
  };

  return (
    <div className="space-y-3 pb-10">

      {/* ── POSTER MODE ── */}
      {posterSpec ? (
        <AIPosterCanvas
          apiBase={apiBase} token={token} brandId={posterSpec.__brand || brandId}
          spec={posterSpec}
          dealerName={BRAND_LABELS[posterSpec.__brand || brandId]}
          dealerSub={DEALER_SUB[posterSpec.__brand || brandId]}
          phone={getBrand(posterSpec.__brand || brandId).phone}
          onSent={() => { setPosterSpec(null); setIntent(null); setCommand(""); if (onSent) onSent(); }}
          onBack={() => { vib(15); setPosterSpec(null); }}
        />
      ) : (<>

      {/* ── COMMAND INPUT ── */}
      <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
        <textarea
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          rows={3}
          placeholder="यहाँ लिखें या माइक दबाकर बोलें... जैसे: 'आज Shine का ऑफर बनाओ'"
          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-3 text-base text-white outline-none focus:border-yellow-500 resize-none"
        />

        <div className="flex gap-2">
          <button type="button" onClick={listening ? stopVoice : startVoice}
            className={`flex-1 rounded-2xl py-4 text-base font-bold flex items-center justify-center gap-2 transition ${
              listening ? "bg-red-600 text-white animate-pulse" : "bg-neutral-800 border border-neutral-700 text-neutral-200"
            }`}>
            {listening ? "🔴 सुन रहा हूँ… (रोकने के लिए दबाएं)" : "🎙️ बोलकर बताएं"}
          </button>
        </div>

        <button type="button" onClick={understand} disabled={!command.trim() || understanding}
          className="w-full rounded-2xl py-3.5 text-base font-bold text-black disabled:opacity-40"
          style={{ background: "#FFD600" }}>
          {understanding ? "समझ रहा हूँ…" : "✨ समझें"}
        </button>

        {!intent && !understanding && (
          <div className="pt-1">
            <p className="text-[11px] text-neutral-500 mb-1.5">उदाहरण:</p>
            <div className="flex flex-wrap gap-1.5">
              {examplesFor(brandId).map((ex, i) => (
                <button key={i} type="button" onClick={() => { vib(15); setCommand(ex); }}
                  className="text-[11px] px-2.5 py-1.5 rounded-full border border-neutral-700 text-neutral-400 hover:border-yellow-500 hover:text-yellow-400">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {note && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${note.startsWith("✅") ? "bg-emerald-900/60 text-emerald-300" : "bg-red-900/60 text-red-300"}`}>
          {note}
        </div>
      )}

      {/* जो अभी बना है उसे तुरंत quality check करो */}
      {result?.mode === "generated" && result?.doc?._id && (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
          <p className="text-xs text-neutral-400 mb-1.5">जो अभी बना — publish से पहले जाँच लें:</p>
          <QualityCheck apiBase={apiBase} token={token} contentId={result.doc._id}
            brand={result.doc.brand} text={result.doc.text} onFixed={() => { if (onSent) onSent(); }} />
        </div>
      )}

      {/* ── INTENT PREVIEW / CONFIRM ── */}
      {intent && !result && (
        <div className="rounded-2xl bg-neutral-900 border-2 border-yellow-500 p-4 space-y-3">
          <p className="text-sm font-bold text-yellow-400">🤖 मैंने ऐसा समझा:</p>
          {intent.summary_hindi && <p className="text-sm text-neutral-200 bg-neutral-800 rounded-xl px-3 py-2">{intent.summary_hindi}</p>}

          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-neutral-800 rounded-xl px-3 py-2">
              <p className="text-[10px] text-neutral-500">Brand</p>
              <p className="text-white font-semibold">{BRAND_LABELS[intent.brand] || "❓ चुनें"}</p>
            </div>
            <div className="bg-neutral-800 rounded-xl px-3 py-2">
              <p className="text-[10px] text-neutral-500">Type</p>
              <p className="text-white font-semibold">{TYPE_LABELS[intent.type] || intent.type}</p>
            </div>
          </div>

          {intent.vehicle && (
            <div className="bg-neutral-800 rounded-xl px-3 py-2 text-sm">
              <p className="text-[10px] text-neutral-500">Vehicle</p>
              <p className="text-white">{intent.vehicle}</p>
            </div>
          )}
          {intent.offer_details && (
            <div className="bg-neutral-800 rounded-xl px-3 py-2 text-sm">
              <p className="text-[10px] text-neutral-500">Offer</p>
              <p className="text-white">{intent.offer_details}</p>
            </div>
          )}

          <div className="bg-neutral-800 rounded-xl px-3 py-2 text-sm">
            <p className="text-[10px] text-neutral-500">कब भेजें</p>
            <p className="text-yellow-400 font-semibold">⏰ {scheduleLabel(intent.schedule)}</p>
          </div>

          {/* Brand selector if missing */}
          {!intent.brand && (
            <div>
              <p className="text-xs text-neutral-400 mb-1.5">Brand चुनें:</p>
              <div className="grid grid-cols-3 gap-1.5">
                {Object.entries(BRAND_LABELS).map(([id, label]) => (
                  <button key={id} type="button" onClick={() => setIntent({ ...intent, brand: id })}
                    className="py-2 rounded-xl border border-neutral-700 text-xs text-neutral-300 hover:border-yellow-500 hover:text-yellow-400">
                    {label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {intent.missing_info?.length > 0 && (
            <div className="bg-amber-900/30 border border-amber-700 rounded-xl px-3 py-2">
              <p className="text-xs text-amber-300">⚠️ कमी: {intent.missing_info.join(", ")}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <button type="button" onClick={cancel} className="flex-1 py-3 rounded-xl border border-neutral-700 text-sm text-neutral-300">रद्द करें</button>
            <button type="button" onClick={execute} disabled={!intent.brand || executing}
              className="flex-1 py-3 rounded-xl text-sm font-bold text-black disabled:opacity-40" style={{ background: "#FFD600" }}>
              {executing ? "कर रहे हैं…" : intent.schedule?.when === "now" || intent.schedule?.when === "today" ? "✅ अभी बनाएं" : "⏰ Schedule करें"}
            </button>
          </div>

          <button type="button" onClick={makePoster} disabled={!intent.brand || makingPoster}
            className="w-full py-3.5 rounded-xl text-sm font-bold border-2 border-yellow-500 text-yellow-400 disabled:opacity-40">
            {makingPoster ? "🎨 Poster design बना रहे हैं…" : "🎨 AI से Poster बनवाएं"}
          </button>
        </div>
      )}

      {/* ── SCHEDULED COMMANDS LIST ── */}
      <details className="bg-neutral-900 rounded-2xl border border-neutral-800" onToggle={(e) => { if (e.target.open) loadScheduled(); }}>
        <summary className="px-4 py-3 text-sm font-bold text-white cursor-pointer list-none flex justify-between">
          ⏰ Scheduled Commands <span className="text-neutral-500">▼</span>
        </summary>
        <div className="px-4 pb-4 space-y-2">
          {scheduled.length === 0 && <p className="text-xs text-neutral-500">कोई scheduled command नहीं है</p>}
          {scheduled.map((s) => (
            <div key={s._id} className="bg-neutral-800 rounded-xl p-3 flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <p className="text-xs text-neutral-400">{BRAND_LABELS[s.brand]} · {TYPE_LABELS[s.type]}</p>
                <p className="text-sm text-white line-clamp-2">{s.text}</p>
                <p className="text-[11px] text-yellow-400 mt-1">
                  ⏰ {s.scheduleDate || s.scheduleWhen} {s.scheduleTime} {s.recurring ? `· रोज़ाना` : ""}
                  {" · "}<span className={s.status === "scheduled" ? "text-emerald-400" : s.status === "failed" ? "text-red-400" : "text-neutral-400"}>{s.status}</span>
                </p>
              </div>
              {s.status === "scheduled" && (
                <button type="button" onClick={() => cancelScheduled(s._id)} className="text-red-400 text-xs px-2 py-1 rounded-lg border border-red-800 flex-shrink-0">🗑</button>
              )}
            </div>
          ))}
        </div>
      </details>
      </>)}
    </div>
  );
}
