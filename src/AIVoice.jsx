import React, { useState, useEffect, useRef } from "react";
import { getBrand } from "./brands.js";
const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// ═══════════════════════════════════════════════════════════════
//  AI VOICE STUDIO  (PRD #14)
//  बोलकर या लिखकर → AI script बनाए → आवाज़ बने → video पर चढ़े
// ═══════════════════════════════════════════════════════════════

const inp = "w-full bg-neutral-800 rounded-lg p-2.5 text-sm outline-none border border-neutral-700 text-white";
const lbl = "text-xs text-neutral-400 mb-1";
const card = "rounded-2xl bg-neutral-900 border border-neutral-800 p-4";

export default function AIVoice({ apiBase, token, brandId, onSent }) {
  const B = getBrand(brandId);

  const [source, setSource] = useState("");
  const [style, setStyle] = useState("friendly");
  const [gender, setGender] = useState("female");
  const [seconds, setSeconds] = useState(20);

  const [styles, setStyles] = useState([]);
  const [genders, setGenders] = useState([]);
  const [script, setScript] = useState("");
  const [subs, setSubs] = useState([]);
  const [clips, setClips] = useState([]);
  const [pending, setPending] = useState([]);   // video वाले pending posts

  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");
  const [err, setErr] = useState("");

  const H = { "Content-Type": "application/json", Authorization: "Bearer " + token };

  useEffect(() => {
    (async () => {
      try {
        const r = await fetch(apiBase + "/api/voice/styles", { headers: H });
        const j = await r.json();
        setStyles(j.styles || []); setGenders(j.genders || []);
      } catch (_) {}
    })();
  }, [apiBase]);

  async function loadClips() {
    try {
      const r = await fetch(`${apiBase}/api/voice?brand=${brandId}`, { headers: H });
      setClips(await r.json());
    } catch (_) {}
  }
  async function loadPending() {
    try {
      const r = await fetch(`${apiBase}/api/content?brand=${brandId}&status=pending`, { headers: H });
      const all = await r.json();
      setPending((all || []).filter((x) => x.video));
    } catch (_) {}
  }
  useEffect(() => { loadClips(); loadPending(); }, [brandId, apiBase]);

  // ── बोलकर source text भरें (Speech-to-Text) ──────────────────
  const recRef = useRef(null);
  const [listening, setListening] = useState(false);

  async function startRecording() {
    setErr("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      mr.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        setListening(false); setBusy("सुन रहे हैं…");
        try {
          const fd = new FormData();
          fd.append("audio", new Blob(chunks, { type: "audio/webm" }), "a.webm");
          const r = await fetch(apiBase + "/api/voice/transcribe", {
            method: "POST", headers: { Authorization: "Bearer " + token }, body: fd,
          });
          const j = await r.json();
          if (!r.ok) throw new Error(j.error || "समझ नहीं आया");
          setSource((s) => (s ? s + " " : "") + j.text);
          setNote("✅ जो बोला वो लिख दिया");
        } catch (e) { setErr(e.message); }
        setBusy("");
      };
      recRef.current = mr; mr.start(); setListening(true); vib(40);
    } catch (e) { setErr("माइक नहीं खुला — browser में permission दें"); }
  }
  function stopRecording() { try { recRef.current?.stop(); } catch (_) {} }

  // ── Step 1: script ──────────────────────────────────────────
  async function makeScript() {
    if (!source.trim()) { setErr("पहले content लिखें या बोलें"); return; }
    setErr(""); setNote(""); setBusy("script बना रहे हैं…"); vib(40);
    try {
      const r = await fetch(apiBase + "/api/voice/script", {
        method: "POST", headers: H,
        body: JSON.stringify({ brand: brandId, text: source, style, seconds }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setScript(j.script || ""); setSubs(j.subtitles || []);
      setNote(j.note_hindi || "script तैयार — पढ़कर ठीक कर लें, फिर आवाज़ बनाएँ");
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  // ── Step 2: आवाज़ ───────────────────────────────────────────
  async function makeVoice() {
    if (!script.trim()) { setErr("पहले script बनाएँ"); return; }
    setErr(""); setBusy("आवाज़ बन रही है…"); vib(60);
    try {
      const r = await fetch(apiBase + "/api/voice/generate", {
        method: "POST", headers: H,
        body: JSON.stringify({ brand: brandId, script, gender, style }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setNote(`✅ आवाज़ तैयार (${j.provider}${j.durationSec ? `, ${j.durationSec} सेकंड` : ""})`);
      await loadClips(); vib([30, 30, 60]);
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  // ── 2 अलग आवाज़ें एक साथ (PRD #28) ──────────────────────────
  async function makeTwoVoices() {
    if (!script.trim()) { setErr("पहले script बनाएँ"); return; }
    setErr(""); setBusy("2 आवाज़ें बन रही हैं…"); vib(60);
    try {
      const r = await fetch(apiBase + "/api/variants/voice", {
        method: "POST", headers: H,
        body: JSON.stringify({ brand: brandId, script }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      const ok = (j.variants || []).filter((v) => !v.error).length;
      setNote(ok ? `✅ ${ok} आवाज़ें तैयार — नीचे सुनकर चुनें` : "कोई आवाज़ नहीं बनी");
      await loadClips();
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  // ── Step 3: video पर चढ़ाओ ──────────────────────────────────
  async function attach(voiceId, contentId) {
    setErr(""); setBusy("video पर लगा रहे हैं…"); vib(50);
    try {
      const r = await fetch(apiBase + "/api/voice/attach", {
        method: "POST", headers: H, body: JSON.stringify({ contentId, voiceId }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setNote("✅ Video पर आवाज़ लग गई — Review में देखें");
      await loadPending(); if (onSent) onSent();
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  async function dlSubs() {
    if (!subs.length) { setErr("पहले script बनाएँ"); return; }
    try {
      const r = await fetch(apiBase + "/api/voice/subtitles", {
        method: "POST", headers: H, body: JSON.stringify({ subtitles: subs }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      window.open(apiBase + j.url, "_blank");
    } catch (e) { setErr(e.message); }
  }

  const [attachFor, setAttachFor] = useState(null);

  return (
    <div className="space-y-3">
      {err && <div className="text-sm bg-red-950/60 border border-red-800 text-red-200 rounded-lg px-3 py-2">{err}</div>}
      {note && <div className="text-sm bg-green-950/50 border border-green-800 text-green-200 rounded-lg px-3 py-2">{note}</div>}
      {busy && <div className="text-sm bg-neutral-800 rounded-lg px-3 py-2 text-neutral-300">⏳ {busy}</div>}

      {/* ── content ── */}
      <div className={card}>
        <p className={lbl}>किस content का voice-over बनाना है?</p>
        <textarea rows={4} value={source} onChange={(e) => setSource(e.target.value)} className={inp}
          placeholder={`जैसे: ${B.products[0]} पर इस महीने खास ऑफर, आसान EMI उपलब्ध`} />

        <button onClick={() => { vib(30); listening ? stopRecording() : startRecording(); }}
          className="w-full mt-2 rounded-xl py-3 font-semibold text-white"
          style={{ background: listening ? "#dc2626" : "#334155" }}>
          {listening ? "⏹️ रोकें (बोलना पूरा हुआ)" : "🎙️ बोलकर भरें"}
        </button>

        <div className="grid grid-cols-2 gap-2 mt-3">
          <div>
            <p className={lbl}>अंदाज़</p>
            <select value={style} onChange={(e) => setStyle(e.target.value)} className={inp}>
              {(styles.length ? styles : [{ id: "friendly", label: "दोस्ताना" }]).map((s) =>
                <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <p className={lbl}>आवाज़</p>
            <select value={gender} onChange={(e) => setGender(e.target.value)} className={inp}>
              {(genders.length ? genders : [{ id: "female", label: "महिला" }, { id: "male", label: "पुरुष" }]).map((g) =>
                <option key={g.id} value={g.id}>{g.label}</option>)}
            </select>
          </div>
        </div>

        <div className="mt-3">
          <p className={lbl}>कितने सेकंड का — {seconds}s</p>
          <input type="range" min={10} max={45} step={5} value={seconds}
            onChange={(e) => setSeconds(+e.target.value)} className="w-full" />
        </div>

        <button onClick={makeScript} disabled={!!busy}
          className="w-full mt-3 rounded-xl py-3 font-semibold text-white disabled:opacity-50"
          style={{ background: B.accent }}>
          ✍️ AI से script बनवाएँ
        </button>
      </div>

      {/* ── script ── */}
      {script && (
        <div className={card}>
          <p className={lbl}>Script — बोलने से पहले पढ़कर ठीक कर लें</p>
          <textarea rows={5} value={script} onChange={(e) => setScript(e.target.value)} className={inp} />
          <p className="text-[11px] text-neutral-500 mt-1">
            {script.trim().split(/\s+/).length} शब्द · लगभग {Math.round(script.trim().split(/\s+/).length / 2.6)} सेकंड
          </p>

          <div className="grid grid-cols-2 gap-2 mt-3">
            <button onClick={makeVoice} disabled={!!busy}
              className="rounded-xl py-3 font-semibold text-white disabled:opacity-50" style={{ background: B.accent }}>
              🔊 आवाज़ बनाएँ
            </button>
            <button onClick={makeTwoVoices} disabled={!!busy}
              className="rounded-xl py-3 font-semibold text-white bg-neutral-700 disabled:opacity-50">
              🎭 2 आवाज़ें
            </button>
          </div>

          {subs.length > 0 && (
            <button onClick={dlSubs} className="w-full mt-2 rounded-xl py-2.5 text-sm text-neutral-300 border border-neutral-700">
              💬 Subtitles (.srt) download — {subs.length} lines
            </button>
          )}
        </div>
      )}

      {/* ── बनी हुई आवाज़ें ── */}
      <div className={card}>
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-neutral-300">🎧 बनी हुई आवाज़ें</h3>
          <button onClick={loadClips} className="text-xs text-neutral-500 underline">refresh</button>
        </div>

        {clips.length === 0 && <p className="text-sm text-neutral-600">अभी कोई आवाज़ नहीं बनी।</p>}

        <div className="space-y-3">
          {clips.map((c) => (
            <div key={c._id} className="rounded-xl bg-neutral-800/60 border border-neutral-700 p-3">
              <div className="flex items-center justify-between text-xs text-neutral-400 mb-1">
                <span>{c.gender === "male" ? "पुरुष" : "महिला"} · {c.style} · {c.durationSec ? c.durationSec + "s" : "—"}</span>
                <span className="text-neutral-600">{c.provider}</span>
              </div>
              <p className="text-sm text-neutral-300 mb-2 line-clamp-2">{c.script}</p>
              <audio controls preload="none" src={apiBase + c.file} className="w-full h-9" />

              <div className="flex gap-2 mt-2">
                <a href={apiBase + c.file} download className="flex-1 text-center text-xs py-2 rounded-lg border border-neutral-700 text-neutral-300">⬇ Download</a>
                <button onClick={() => { vib(20); setAttachFor(attachFor === c._id ? null : c._id); }}
                  className="flex-1 text-xs py-2 rounded-lg border border-neutral-700 text-neutral-300">🎬 Video पर लगाएँ</button>
              </div>

              {attachFor === c._id && (
                <div className="mt-2 border-t border-neutral-700 pt-2">
                  {pending.length === 0
                    ? <p className="text-xs text-neutral-500">कोई video वाली pending post नहीं है — पहले AI Video से video बनाएँ।</p>
                    : pending.map((p) => (
                      <button key={p._id} onClick={() => attach(c._id, p._id)} disabled={!!busy}
                        className="w-full text-left text-xs py-2 px-2 rounded-lg hover:bg-neutral-700 text-neutral-300 disabled:opacity-50">
                        ▶ {String(p.text || "").slice(0, 60)}…
                      </button>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <p className="text-[11px] text-neutral-600 leading-relaxed">
        ℹ️ आवाज़ कई providers से बन सकती है। सबसे अच्छी आवाज़ के लिए Render env में
        <code className="mx-1 text-neutral-500">ELEVENLABS_API_KEY</code>
        या <code className="mx-1 text-neutral-500">GOOGLE_TTS_API_KEY</code> डालें।
        बिना key के भी एक साधारण आवाज़ बन जाती है।
      </p>
    </div>
  );
}
