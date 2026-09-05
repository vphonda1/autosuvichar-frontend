// ============================================================================
//  Announcer.jsx — 🔊 अनाउंसमेंट स्टूडियो
//  ---------------------------------------------------------------------------
//  लिखिए → सुनिए → download कीजिए। माइक पर बजाइए या WhatsApp पर भेजिए।
//
//  Studio.jsx के TEMPLATES में यह जोड़ें (समूह "वीडियो" में):
//     { id: "announce", group: "वीडियो", icon: "🔊", name: "अनाउंसमेंट बनाएँ",
//       desc: "लिखिए, आवाज़ बनेगी — ढोल-music के साथ, माइक पर बजाने लायक़" },
//
//  और RENDER में:
//     announce: <Announcer {...P} />
// ============================================================================

import React, { useState, useEffect, useRef } from "react";

const vib = (ms = 30) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// तैयार नमूने — ज़्यादातर बार बस इन्हें दबाकर लिखना ही काफ़ी है
const NAMUNE = [
  "आज शाम 5 बजे तक शोरूम पर मेगा ऑफ़र। पहले आइए, पहले पाइए।",
  "प्रिय ग्राहकों, नई गाड़ी की बुकिंग पर विशेष छूट। आज ही आइए।",
  "गणेश चतुर्थी की हार्दिक शुभकामनाएँ। आपके परिवार पर बप्पा की कृपा बनी रहे।",
  "कल शोरूम बन्द रहेगा। असुविधा के लिए खेद है।",
];

export default function Announcer({ apiBase, token, brandId, onSent }) {
  // दो तरीक़े:
  //  सादा   — एक बात, music के साथ। माइक पर बजाने के लिए।
  //  script — समय के हिसाब से बँटा voice-over। video बनाने के लिए।
  const [mode, setMode] = useState("sada");
  const [script, setScript] = useState("");
  const [segs, setSegs] = useState(null);
  const [scriptOut, setScriptOut] = useState(null);
  const [text, setText] = useState("");
  const [opt, setOpt] = useState(null);
  const [preset, setPreset] = useState("market");

  // सारी सेटिंग एक जगह
  const [v, setV] = useState({
    gender: "male", style: "excited", speed: 0.95, repeat: 2,
    intro: "dhol", outro: "horn", music: "", musicVol: 0.5, voiceVol: 1.6,
    leadIn: 1.2, tailOut: 2.5,
  });

  const [khul, setKhul] = useState(false);      // बारीक़ सेटिंग खुली है?
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [made, setMade] = useState(null);
  const [list, setList] = useState([]);
  const sfxRef = useRef(null);

  const auth = { Authorization: "Bearer " + token };
  const full = (u) => (u?.startsWith("http") ? u : apiBase + u);
  const set = (k, val) => setV((p) => ({ ...p, [k]: val }));

  useEffect(() => {
    fetch(`${apiBase}/api/announce/options`, { headers: auth })
      .then((r) => r.json()).then(setOpt).catch((e) => setErr(e.message));
    load();
    // eslint-disable-next-line
  }, [brandId]);

  function load() {
    fetch(`${apiBase}/api/announce?brand=${brandId}`, { headers: auth })
      .then((r) => r.json()).then((d) => setList(Array.isArray(d) ? d : [])).catch(() => {});
  }

  function lagao(p) {
    vib(20); setPreset(p.id);
    setV((prev) => ({ ...prev, ...p.v }));
  }

  // असर की आवाज़ सुनकर देखिए — बनाने से पहले ही
  function sunao(id) {
    if (!id) return;
    vib(15);
    try {
      if (sfxRef.current) { sfxRef.current.pause(); }
      const a = new Audio(`${apiBase}/api/announce/sfx/${id}`);
      sfxRef.current = a;
      a.play().catch(() => {});
    } catch (_) {}
  }

  async function banao() {
    if (!text.trim()) { setErr("पहले कुछ लिखिए"); return; }
    vib(50); setBusy(true); setErr(""); setMade(null);
    try {
      const r = await fetch(`${apiBase}/api/announce/build`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ brand: brandId, text: text.trim(), ...v }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "नहीं बना");
      setMade(d); vib([30, 40, 60]); load(); onSent && onSent();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function jaancho() {
    if (!script.trim()) { setErr("पहले script लिखिए"); return; }
    vib(30); setBusy(true); setErr(""); setSegs(null); setScriptOut(null);
    try {
      const r = await fetch(`${apiBase}/api/announce/script/parse`, {
        method: "POST", headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ script }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "समझ नहीं आया");
      setSegs(d);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function scriptBanao() {
    vib(50); setBusy(true); setErr(""); setScriptOut(null);
    try {
      const r = await fetch(`${apiBase}/api/announce/script/build`, {
        method: "POST", headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ brand: brandId, script, ...v }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "नहीं बना");
      setScriptOut(d); vib([30, 40, 60]); load(); onSent && onSent();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  const mmss = (n) => `${Math.floor(n / 60)}:${String(Math.round(n % 60)).padStart(2, "0")}`;

  const S = ({ label, k, min, max, step, fmt }) => (
    <div>
      <div className="flex justify-between text-[11px] mb-1">
        <span className="text-neutral-400">{label}</span>
        <span className="text-neutral-200 font-medium">{fmt(v[k])}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={v[k]}
        onChange={(e) => set(k, parseFloat(e.target.value))}
        className="w-full accent-orange-500" />
    </div>
  );

  return (
    <div className="space-y-3 pb-10">

      {/* ── कौन-सा तरीक़ा ──────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-1.5">
        {[["sada", "🔊 सादा", "एक बात, music के साथ"],
          ["script", "🎬 script", "video के लिए, समय के साथ"]].map(([id, lbl, d]) => (
          <button key={id} type="button" onClick={() => { vib(15); setMode(id); setErr(""); }}
            className="rounded-xl border p-2.5 text-left"
            style={{ borderColor: mode === id ? "#F97316" : "#333", background: mode === id ? "#F9731618" : "transparent" }}>
            <div className="text-sm font-medium" style={{ color: mode === id ? "#FB923C" : "#d4d4d4" }}>{lbl}</div>
            <div className="text-[9px] text-neutral-500 mt-0.5">{d}</div>
          </button>
        ))}
      </div>

      {/* ══════════════ SCRIPT वाला तरीक़ा ══════════════ */}
      {mode === "script" && (
        <>
          <div>
            <textarea value={script} onChange={(e) => { setScript(e.target.value); setSegs(null); }} rows={9}
              placeholder={"हर हिस्सा इस तरह लिखिए —\n\n0:00 – 0:04 · हुक\nVO\nक्या आप सिर्फ़ ₹1 में स्कूटर पाना चाहते हैं?\nON-SCREEN\n11 स्कूटर · सिर्फ़ ₹1\n\n0:04 – 0:10 · बड़ी घोषणा\nVO\n11 लकी लोगों को सिर्फ़ ₹1 में स्कूटर।"}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-xs text-white outline-none resize-none focus:border-orange-500 placeholder:text-neutral-600 font-mono" />
            <p className="text-[10px] text-neutral-600 mt-1">
              PDF/Word से सीधे copy करके यहाँ चिपका दीजिए — समय, VO और ON-SCREEN अपने आप पहचान लिए जाएँगे
            </p>
          </div>

          <button type="button" onClick={jaancho} disabled={busy || !script.trim()}
            className="w-full rounded-xl py-2.5 text-sm font-semibold border border-orange-700 text-orange-400 disabled:opacity-40">
            {busy ? "देख रहे हैं…" : "🔍 पहले हिस्से देखिए"}
          </button>

          {/* ── हिस्सों की सूची ── */}
          {segs && (
            <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3">
              <p className="text-xs font-bold text-white mb-2">
                {segs.segments.length} हिस्से · कुल {mmss(segs.totalSec)}
              </p>
              <div className="space-y-2">
                {segs.segments.map((g, i) => (
                  <div key={i} className="rounded-lg bg-neutral-900 border border-neutral-800 p-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-[11px] font-semibold text-orange-400">{g.title}</span>
                      <span className="text-[10px] text-neutral-500">{mmss(g.start)}–{mmss(g.end)} · {g.slot}s</span>
                    </div>
                    {g.vo && (
                      <>
                        <p className="text-[11px] text-neutral-300">{g.vo}</p>
                        {g.spoken !== g.vo && (
                          <p className="text-[10px] text-emerald-500 mt-1">🔊 बोलेगा: {g.spoken}</p>
                        )}
                      </>
                    )}
                    {g.screen && <p className="text-[10px] text-blue-400 mt-1">📺 {g.screen}</p>}
                  </div>
                ))}
              </div>
              <p className="text-[10px] text-neutral-600 mt-2">
                हरे रंग में दिख रहा है कि आँकड़े कैसे बोले जाएँगे — ₹5,000 को "पाँच हज़ार रुपये"
              </p>
            </div>
          )}

          {segs && (
            <button type="button" onClick={scriptBanao} disabled={busy}
              className="w-full rounded-xl py-3.5 text-sm font-bold text-white disabled:opacity-40"
              style={{ background: "#F97316" }}>
              {busy ? "बन रहा है… (हर हिस्सा अलग बनता है, 30–60 सेकंड)" : "🎬 voice-over बनाएँ"}
            </button>
          )}

          {/* ── बना हुआ script ── */}
          {scriptOut && (
            <div className="rounded-2xl border-2 p-3 space-y-2.5" style={{ borderColor: "#F97316", background: "#F9731610" }}>
              <p className="text-sm font-bold text-orange-400">
                ✅ तैयार — {Math.round(scriptOut.durationSec)} सेकंड
              </p>
              <audio src={full(scriptOut.url)} controls className="w-full" style={{ height: 40 }} />

              {scriptOut.warning && (
                <div className="rounded-lg bg-amber-900/40 border border-amber-800 px-2.5 py-2">
                  <p className="text-[11px] text-amber-300">⚠️ {scriptOut.warning}</p>
                </div>
              )}

              {/* हर हिस्से का हिसाब — shoot करते समय यही काम आएगा */}
              <div className="space-y-1.5">
                {(scriptOut.segments || []).map((g, i) => (
                  <div key={i} className="rounded-lg bg-neutral-900 border p-2"
                    style={{ borderColor: g.fits ? "#262626" : "#92400E" }}>
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] font-semibold text-neutral-200">{g.title}</span>
                      <span className="text-[10px]" style={{ color: g.fits ? "#737373" : "#FBBF24" }}>
                        {mmss(g.start)} · चाहिए {g.slot}s, बना {g.actualSec}s
                      </span>
                    </div>
                    <p className="text-[10px] mt-0.5" style={{ color: g.fits ? "#525252" : "#FBBF24" }}>{g.note}</p>
                    {g.screen && <p className="text-[10px] text-blue-400 mt-1">📺 {g.screen}</p>}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <a href={`${apiBase}/announce-download/${scriptOut.id}`} onClick={() => vib(30)}
                  className="rounded-lg py-2.5 text-center text-xs font-bold text-white" style={{ background: "#F97316" }}>
                  ⬇️ Download
                </a>
                <button type="button" onClick={() => {
                  vib(30);
                  const t = (scriptOut.segments || []).map((g) =>
                    `${mmss(g.start)}–${mmss(g.end)}  ${g.title}${g.screen ? `\n   📺 ${g.screen}` : ""}${g.shot ? `\n   🎥 ${g.shot}` : ""}`
                  ).join("\n\n");
                  navigator.clipboard?.writeText(t);
                  alert("shoot की सूची copy हो गई — WhatsApp में चिपका लीजिए");
                }} className="rounded-lg py-2.5 text-center text-xs font-bold text-blue-400 border border-blue-800">
                  📋 shoot सूची
                </button>
              </div>
              <p className="text-[10px] text-neutral-500 leading-relaxed">
                यह आवाज़ अपनी shoot की गई video पर चढ़ा दीजिए। हर हिस्सा ठीक अपने समय पर बोलेगा।
              </p>
            </div>
          )}
        </>
      )}

      {/* ══════════════ सादा तरीक़ा ══════════════ */}
      {mode === "sada" && (
      <>
      {/* ── लिखिए ─────────────────────────────────────────── */}
      <div>
        <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} maxLength={1500}
          placeholder={"क्या अनाउंस करना है?\n\nजैसे — आज शाम 5 बजे तक शोरूम पर मेगा ऑफ़र। पहले आइए, पहले पाइए।"}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-3 text-sm text-white outline-none resize-none focus:border-orange-500 placeholder:text-neutral-600" />
        <div className="flex justify-between text-[10px] text-neutral-600 mt-1">
          <span>बोलचाल की भाषा में लिखिए — वैसी ही आवाज़ बनेगी</span>
          <span>{text.length}/1500</span>
        </div>
      </div>

      <div className="flex gap-1.5 overflow-x-auto pb-1">
        {NAMUNE.map((n, i) => (
          <button key={i} type="button" onClick={() => { vib(15); setText(n); }}
            className="flex-shrink-0 text-[10px] px-2.5 py-1.5 rounded-full border border-neutral-700 text-neutral-400 max-w-[13rem] truncate">
            {n}
          </button>
        ))}
      </div>

      {/* ── तैयार अंदाज़ ────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-white mb-2">कैसा अनाउंसमेंट चाहिए?</p>
        <div className="grid grid-cols-1 gap-1.5">
          {(opt?.presets || []).map((p) => (
            <button key={p.id} type="button" onClick={() => lagao(p)}
              className="text-left rounded-xl border p-2.5"
              style={{
                borderColor: preset === p.id ? "#F97316" : "#333",
                background: preset === p.id ? "#F9731618" : "transparent",
              }}>
              <div className="text-sm font-medium" style={{ color: preset === p.id ? "#FB923C" : "#e5e5e5" }}>{p.label}</div>
              <div className="text-[10px] text-neutral-500 mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* ── किसकी आवाज़ ────────────────────────────────────── */}
      <div>
        <p className="text-xs font-bold text-white mb-2">आवाज़</p>
        <div className="grid grid-cols-2 gap-1.5">
          {(opt?.voices || []).map((x) => {
            const on = v.gender === x.gender && v.style === x.style;
            return (
              <button key={x.label} type="button"
                onClick={() => { vib(15); setV((p) => ({ ...p, gender: x.gender, style: x.style })); }}
                className="text-left rounded-xl border p-2"
                style={{ borderColor: on ? "#F97316" : "#333", background: on ? "#F9731618" : "transparent" }}>
                <div className="text-[11px] font-medium" style={{ color: on ? "#FB923C" : "#d4d4d4" }}>{x.label}</div>
                <div className="text-[9px] text-neutral-500 leading-tight mt-0.5">{x.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── आवाज़ें — दबाकर सुन लीजिए ───────────────────────── */}
      <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3">
        <p className="text-xs font-bold text-white mb-1">शुरू में कौन-सी आवाज़?</p>
        <p className="text-[10px] text-neutral-600 mb-2">दबाकर सुन सकते हैं</p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => { vib(15); set("intro", ""); }}
            className="text-[11px] px-2.5 py-1.5 rounded-full border"
            style={{ borderColor: !v.intro ? "#F97316" : "#333", color: !v.intro ? "#FB923C" : "#888" }}>
            कुछ नहीं
          </button>
          {(opt?.effects || []).map((e) => (
            <button key={e.id} type="button"
              onClick={() => { set("intro", e.id); sunao(e.id); }}
              className="text-[11px] px-2.5 py-1.5 rounded-full border"
              style={{ borderColor: v.intro === e.id ? "#F97316" : "#333", color: v.intro === e.id ? "#FB923C" : "#888" }}>
              {e.label}
            </button>
          ))}
        </div>

        <p className="text-xs font-bold text-white mt-3 mb-2">अंत में?</p>
        <div className="flex flex-wrap gap-1.5">
          <button type="button" onClick={() => { vib(15); set("outro", ""); }}
            className="text-[11px] px-2.5 py-1.5 rounded-full border"
            style={{ borderColor: !v.outro ? "#F97316" : "#333", color: !v.outro ? "#FB923C" : "#888" }}>
            कुछ नहीं
          </button>
          {(opt?.effects || []).map((e) => (
            <button key={e.id} type="button"
              onClick={() => { set("outro", e.id); sunao(e.id); }}
              className="text-[11px] px-2.5 py-1.5 rounded-full border"
              style={{ borderColor: v.outro === e.id ? "#F97316" : "#333", color: v.outro === e.id ? "#FB923C" : "#888" }}>
              {e.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── आवाज़ और music कितने तेज़ ────────────────────────── */}
      <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3 space-y-3">
        <p className="text-xs font-bold text-white">आवाज़ कितनी तेज़?</p>
        <S label="🎙️ बोली" k="voiceVol" min={0.4} max={2.5} step={0.05}
          fmt={(x) => (x < 1 ? "धीमी" : x < 1.5 ? "ठीक" : x < 2 ? "तेज़" : "बहुत तेज़") + ` (${x.toFixed(2)})`} />
        <S label="🎵 music" k="musicVol" min={0} max={1.2} step={0.05}
          fmt={(x) => (x === 0 ? "बिल्कुल नहीं" : x < 0.4 ? "हल्का" : x < 0.8 ? "ठीक" : "तेज़") + ` (${x.toFixed(2)})`} />

        <div className="rounded-lg bg-neutral-900 px-2.5 py-2">
          <p className="text-[10px] text-neutral-500 leading-relaxed">
            💡 music को बहुत तेज़ मत रखिए। बोलते समय यह अपने आप धीमा हो जाता है
            और बात ख़त्म होते ही वापस तेज़ — इसलिए बात हमेशा साफ़ सुनाई देगी।
          </p>
        </div>
      </div>

      {/* ── बारीक़ सेटिंग ──────────────────────────────────── */}
      <button type="button" onClick={() => { vib(15); setKhul(!khul); }}
        className="w-full text-left rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2.5">
        <span className="text-xs text-neutral-300">⚙️ और बारीक़ सेटिंग</span>
        <span className="float-right text-neutral-600 text-xs">{khul ? "−" : "+"}</span>
      </button>

      {khul && (
        <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3 space-y-3">
          <S label="बोलने की रफ़्तार" k="speed" min={0.7} max={1.4} step={0.05}
            fmt={(x) => (x < 0.9 ? "धीमे — साफ़" : x > 1.15 ? "तेज़" : "सामान्य") + ` (${x.toFixed(2)}×)`} />
          <S label="कितनी बार बोले" k="repeat" min={1} max={3} step={1}
            fmt={(x) => `${x} बार` + (x > 1 ? " — बाज़ार में दोहराया जाता है" : "")} />
          <S label="बोलने से पहले music" k="leadIn" min={0} max={6} step={0.2} fmt={(x) => `${x.toFixed(1)} सेकंड`} />
          <S label="बोलने के बाद music" k="tailOut" min={0} max={8} step={0.2} fmt={(x) => `${x.toFixed(1)} सेकंड`} />

          {opt?.music?.length > 0 && (
            <div>
              <p className="text-[11px] text-neutral-400 mb-1">background music</p>
              <select value={v.music} onChange={(e) => set("music", e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-2 text-xs text-white">
                <option value="">अपने आप बनी हल्की धुन</option>
                <option value="none">कोई music नहीं</option>
                {opt.music.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          )}
        </div>
      )}

      {err && <div className="rounded-xl bg-red-900/50 border border-red-800 text-red-300 text-sm px-3 py-2.5">{err}</div>}

      <button type="button" onClick={banao} disabled={busy || !text.trim()}
        className="w-full rounded-xl py-3.5 text-sm font-bold text-white disabled:opacity-40"
        style={{ background: "#F97316" }}>
        {busy ? "बन रहा है… (15–30 सेकंड)" : "🔊 अनाउंसमेंट बनाएँ"}
      </button>

      {/* ── बन गया ────────────────────────────────────────── */}
      {made && (
        <div className="rounded-2xl border-2 p-3 space-y-2.5" style={{ borderColor: "#F97316", background: "#F9731610" }}>
          <p className="text-sm font-bold text-orange-400">
            ✅ तैयार — {Math.round(made.durationSec)} सेकंड
          </p>
          <audio src={full(made.url)} controls className="w-full" style={{ height: 40 }} />
          <div className="grid grid-cols-2 gap-2">
            <a href={`${apiBase}/announce-download/${made.id}`}
              onClick={() => vib(30)}
              className="rounded-lg py-2.5 text-center text-xs font-bold text-white" style={{ background: "#F97316" }}>
              ⬇️ Download
            </a>
            <button type="button" onClick={() => {
              vib(30);
              const u = full(made.url);
              if (navigator.share) navigator.share({ text: "🔊 " + text.slice(0, 80) + "\n" + u }).catch(() => {});
              else window.open("https://wa.me/?text=" + encodeURIComponent(u), "_blank");
            }} className="rounded-lg py-2.5 text-center text-xs font-bold text-emerald-400 border border-emerald-800">
              💬 भेजें
            </button>
          </div>
          <p className="text-[10px] text-neutral-500 leading-relaxed">
            Download करके phone में रख लीजिए — माइक/speaker से जोड़कर सीधे बजा सकते हैं।
            इंटरनेट की ज़रूरत नहीं पड़ेगी।
          </p>
        </div>
      )}

      </>
      )}

      {/* ── पहले बनाए हुए ─────────────────────────────────── */}
      {list.length > 0 && (
        <div>
          <p className="text-xs font-bold text-white mb-2 mt-2">पहले बनाए हुए</p>
          <div className="space-y-2">
            {list.slice(0, 8).map((a) => (
              <div key={a._id} className="rounded-xl bg-neutral-900 border border-neutral-800 p-2.5">
                <p className="text-xs text-neutral-300 line-clamp-2 mb-1.5">{a.text}</p>
                <audio src={full(a.file)} controls className="w-full" style={{ height: 34 }} />
                <div className="flex gap-2 mt-1.5">
                  <a href={`${apiBase}/announce-download/${a._id}`}
                    className="flex-1 text-center text-[10px] py-1.5 rounded-lg border border-neutral-700 text-neutral-300">
                    ⬇️ Download
                  </a>
                  <button type="button" onClick={async () => {
                    if (!confirm("हटा दें?")) return;
                    await fetch(`${apiBase}/api/announce/${a._id}`, { method: "DELETE", headers: auth });
                    load();
                  }} className="text-[10px] px-3 py-1.5 rounded-lg border border-red-800 text-red-400">🗑</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
