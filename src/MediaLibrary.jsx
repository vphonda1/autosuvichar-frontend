// ============================================================================
//  MediaLibrary.jsx — 🎵 गाने और 🎨 त्यौहार की तस्वीरें
//  ---------------------------------------------------------------------------
//  दोनों चीज़ें एक जगह, क्योंकि दोनों का काम एक ही है — एक बार चढ़ाइए,
//  हमेशा के लिए सुरक्षित, और posts/video में अपने-आप लग जाएँ।
//
//  ⚠️ दोनों database में जाती हैं, disk पर नहीं। Render की free disk service
//     सोते ही मिट जाती है — गाड़ियों की photo के साथ यही हुआ था।
//
//  SettingsHub.jsx में जोड़ें:
//      import MediaLibrary from "./MediaLibrary.jsx";
//      <Fold icon="🎵" title="गाने और त्यौहार की तस्वीरें"
//            sub="एक बार चढ़ाइए — video और poster में अपने-आप लगेंगी">
//        <MediaLibrary apiBase={apiBase} token={token} brandId={brandId} accent={accent} />
//      </Fold>
// ============================================================================

import React, { useState, useEffect, useRef } from "react";

const vib = (ms = 30) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

export default function MediaLibrary({ apiBase, token, brandId, accent = "#E4002B" }) {
  const [tab, setTab] = useState("music");    // music | art
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  const auth = { Authorization: "Bearer " + token };
  const flash = (m, isErr) => { isErr ? setErr(m) : setOk(m); setTimeout(() => { setErr(""); setOk(""); }, 4000); };

  return (
    <div className="pt-2 space-y-3">
      <div className="flex gap-1.5">
        {[["music", "🎵 गाने"], ["art", "🎨 त्यौहार की तस्वीरें"]].map(([id, l]) => (
          <button key={id} type="button" onClick={() => { vib(15); setTab(id); setErr(""); setOk(""); }}
            className="flex-1 rounded-xl py-2 text-xs font-medium border"
            style={{
              borderColor: tab === id ? accent : "#262626",
              background: tab === id ? accent + "18" : "transparent",
              color: tab === id ? accent : "#737373",
            }}>{l}</button>
        ))}
      </div>

      {err && <div className="rounded-lg bg-red-900/50 border border-red-800 text-red-300 text-xs px-3 py-2">{err}</div>}
      {ok && <div className="rounded-lg bg-emerald-900/50 border border-emerald-800 text-emerald-300 text-xs px-3 py-2">{ok}</div>}

      {tab === "music" && <MusicTab apiBase={apiBase} auth={auth} brandId={brandId} accent={accent} flash={flash} />}
      {tab === "art" && <ArtTab apiBase={apiBase} auth={auth} brandId={brandId} accent={accent} flash={flash} />}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  🎵 गाने
// ══════════════════════════════════════════════════════════════════════════
function MusicTab({ apiBase, auth, brandId, accent, flash }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState(null);      // { file, name }
  const [mood, setMood] = useState("khushi");
  const [name, setName] = useState("");
  const [seconds, setSeconds] = useState(60);
  const [startAt, setStartAt] = useState(0);
  const [forAll, setForAll] = useState(true);
  const fileRef = useRef(null);
  const audioRef = useRef(null);

  function load() {
    fetch(`${apiBase}/api/music/tracks?brand=${brandId}`, { headers: auth })
      .then((r) => r.json()).then(setData).catch((e) => flash(e.message, true));
  }
  useEffect(load, [brandId]);   // eslint-disable-line

  function pick(e) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f) return;
    if (f.size > 25 * 1024 * 1024) { flash("गाना 25MB से बड़ा है", true); return; }
    vib(20);
    setPending({ file: f });
    setName(f.name.replace(/\.[^.]+$/, "").slice(0, 40));
  }

  async function upload() {
    if (!pending) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("music", pending.file);
      fd.append("name", name || "गाना");
      fd.append("mood", mood);
      fd.append("seconds", String(seconds));
      fd.append("startAt", String(startAt));
      if (!forAll) fd.append("brand", brandId);

      const r = await fetch(`${apiBase}/api/music/upload`, { method: "POST", headers: auth, body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "नहीं चढ़ा");
      flash(`✓ "${d.track.name}" जुड़ गया — ${d.note}`);
      setPending(null); setName(""); load();
    } catch (e) { flash(e.message, true); }
    setBusy(false);
  }

  function play(url) {
    vib(15);
    try { if (audioRef.current) audioRef.current.pause(); } catch (_) {}
    const a = new Audio(url); audioRef.current = a; a.play().catch(() => {});
  }

  async function del(id) {
    if (!confirm("यह गाना हटा दें?")) return;
    vib([20, 30, 20]);
    try {
      await fetch(`${apiBase}/api/music/tracks/${id}`, { method: "DELETE", headers: auth });
      load();
    } catch (e) { flash(e.message, true); }
  }

  async function changeMood(id, m) {
    try {
      await fetch(`${apiBase}/api/music/tracks/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ mood: m }),
      });
      load();
    } catch (e) { flash(e.message, true); }
  }

  const moods = data?.moods || [];
  const tracks = data?.tracks || [];

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-neutral-500 leading-relaxed">
        अपने पसंद के गाने चढ़ाइए। video बनाते समय ख़ुद चुन सकते हैं, या कुछ न चुनें
        तो post की तरह देखकर अपने-आप लग जाएगा।
      </p>

      {/* जगह का हिसाब */}
      {data && (
        <div className="rounded-xl bg-neutral-900 border border-neutral-800 px-3 py-2 flex justify-between">
          <span className="text-[11px] text-neutral-400">{tracks.length} गाने</span>
          <span className="text-[11px] text-neutral-500">{data.totalMB || 0} MB / 512 MB</span>
        </div>
      )}

      {/* नया गाना */}
      {!pending ? (
        <button type="button" onClick={() => { vib(15); fileRef.current?.click(); }}
          className="w-full rounded-xl border-2 border-dashed border-neutral-700 py-5 text-center active:border-neutral-500">
          <div className="text-xl mb-1 opacity-50">🎵</div>
          <p className="text-xs text-neutral-400">गाना चुनें (mp3 / m4a / wav)</p>
          <p className="text-[10px] text-neutral-600 mt-0.5">25MB तक — अपने-आप छोटा हो जाएगा</p>
        </button>
      ) : (
        <div className="rounded-xl bg-neutral-950 border p-3 space-y-2.5" style={{ borderColor: accent }}>
          <p className="text-xs font-bold text-white">नया गाना</p>

          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="गाने का नाम"
            className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-2 text-sm text-white outline-none" />

          <div>
            <span className="text-[11px] text-neutral-400 block mb-1.5">किस तरह की post के लिए?</span>
            <div className="flex flex-wrap gap-1.5">
              {moods.map((m) => (
                <button key={m.id} type="button" onClick={() => { vib(15); setMood(m.id); }}
                  className="text-[11px] px-2.5 py-1.5 rounded-full border text-left"
                  style={{ borderColor: mood === m.id ? accent : "#333", color: mood === m.id ? accent : "#888" }}>
                  {m.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-neutral-600 mt-1">
              {moods.find((m) => m.id === mood)?.desc || ""}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[11px] text-neutral-400">कहाँ से शुरू करें</span>
              <input type="number" min={0} max={300} value={startAt} onChange={(e) => setStartAt(+e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-2 text-sm text-white mt-1" />
              <span className="text-[10px] text-neutral-600">सेकंड — मुखड़े से पहले का हिस्सा छोड़ने के लिए</span>
            </div>
            <div>
              <span className="text-[11px] text-neutral-400">कितने सेकंड</span>
              <input type="number" min={15} max={90} value={seconds} onChange={(e) => setSeconds(+e.target.value)}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-2 text-sm text-white mt-1" />
              <span className="text-[10px] text-neutral-600">video में लूप होता है, 60 काफ़ी है</span>
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-300">
            <input type="checkbox" checked={forAll} onChange={(e) => setForAll(e.target.checked)} />
            तीनों brands के लिए
          </label>

          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={upload} disabled={busy}
              className="rounded-lg py-2.5 text-sm font-bold text-white disabled:opacity-40" style={{ background: accent }}>
              {busy ? "चढ़ रहा है…" : "चढ़ाएँ"}
            </button>
            <button type="button" onClick={() => { setPending(null); setName(""); }}
              className="rounded-lg py-2.5 text-sm text-neutral-400 border border-neutral-700">रहने दें</button>
          </div>
        </div>
      )}

      <input ref={fileRef} type="file" accept="audio/*,.mp3,.m4a,.wav" onChange={pick} className="hidden" />

      {/* सूची */}
      {tracks.length === 0 ? (
        <p className="text-xs text-neutral-600 text-center py-3">अभी कोई गाना नहीं</p>
      ) : (
        <div className="space-y-2">
          {tracks.map((t) => (
            <div key={t._id} className="rounded-xl bg-neutral-900 border border-neutral-800 p-2.5">
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => play(t.url)}
                  className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                  style={{ background: accent + "22", color: accent }}>▶</button>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-neutral-100 truncate">{t.name}</p>
                  <p className="text-[10px] text-neutral-500">
                    {t.durationSec}s · {t.sizeKB}KB
                    {t.usedCount ? ` · ${t.usedCount} बार लगा` : " · अभी तक नहीं लगा"}
                  </p>
                </div>
                <button type="button" onClick={() => del(t._id)}
                  className="text-[11px] px-2 py-1 rounded-lg border border-red-900 text-red-400 flex-shrink-0">🗑</button>
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {moods.map((m) => (
                  <button key={m.id} type="button" onClick={() => changeMood(t._id, m.id)}
                    className="text-[10px] px-2 py-0.5 rounded-full border"
                    style={{ borderColor: t.mood === m.id ? accent : "#2a2a2a", color: t.mood === m.id ? accent : "#555" }}>
                    {m.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  🎨 त्यौहार की तस्वीरें
// ══════════════════════════════════════════════════════════════════════════
function ArtTab({ apiBase, auth, brandId, accent, flash }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const fileRef = useRef(null);
  const [target, setTarget] = useState(null);

  function load() {
    fetch(`${apiBase}/api/festive/themes?brand=${brandId}`, { headers: auth })
      .then((r) => r.json()).then(setData).catch((e) => flash(e.message, true));
  }
  useEffect(load, [brandId]);   // eslint-disable-line

  async function pick(e) {
    const f = e.target.files?.[0]; e.target.value = "";
    if (!f || !target) return;
    setBusy(target);
    try {
      const fd = new FormData();
      fd.append("art", f);
      const r = await fetch(`${apiBase}/api/festive/art/${target}`, { method: "POST", headers: auth, body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "नहीं चढ़ी");
      flash(`✓ तस्वीर लग गई — ${d.sizeKB}KB`);
      load();
    } catch (e2) { flash(e2.message, true); }
    setBusy(""); setTarget(null);
  }

  async function del(id) {
    if (!confirm("यह तस्वीर हटा दें?")) return;
    vib([20, 30, 20]);
    try {
      await fetch(`${apiBase}/api/festive/art/${id}`, { method: "DELETE", headers: auth });
      load();
    } catch (e) { flash(e.message, true); }
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] text-neutral-500 leading-relaxed">
        भगवान की तस्वीर code नहीं बना सकता — वह कलाकारी है। एक बार चढ़ा दीजिए,
        फिर हर साल उसी त्यौहार पर अपने-आप लग जाएगी।
        <br />
        <span className="text-neutral-600">बिना background वाली (कटी हुई) PNG सबसे अच्छी लगती है।</span>
      </p>

      {/* गाड़ियों की photo की चेतावनी — poster इसी पर टिका है */}
      {data && data.vehiclesWithPhoto === 0 && (
        <div className="rounded-xl bg-amber-900/30 border border-amber-800 px-3 py-2">
          <p className="text-[11px] text-amber-300">
            ⚠️ किसी गाड़ी की photo नहीं लगी — त्यौहार वाले poster में गाड़ियाँ नहीं आएँगी।
            ऊपर "गाड़ियों की सूची" में डाल दीजिए।
          </p>
        </div>
      )}
      {data && data.vehiclesWithPhoto > 0 && (
        <p className="text-[11px] text-emerald-500">✓ {data.vehiclesWithPhoto} गाड़ियों की photo लगी है</p>
      )}

      <div className="space-y-2">
        {(data?.themes || []).map((t) => (
          <div key={t.id} className="rounded-xl bg-neutral-900 border border-neutral-800 p-2.5">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-lg bg-neutral-800 border border-neutral-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                {t.hasArt
                  ? <img src={`${apiBase}/festive-art/${t.id}`} alt="" className="w-full h-full object-contain" />
                  : <span className="text-[9px] text-neutral-600 text-center leading-tight px-1">तस्वीर<br />नहीं</span>}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-neutral-100">{t.label}</p>
                <p className="text-[10px]" style={{ color: t.hasArt ? "#10B981" : "#a3a3a3" }}>{t.note}</p>
              </div>
              <div className="flex gap-1 flex-shrink-0">
                <button type="button" disabled={busy === t.id}
                  onClick={() => { vib(15); setTarget(t.id); setTimeout(() => fileRef.current?.click(), 50); }}
                  className="text-[11px] px-2.5 py-1.5 rounded-lg border border-neutral-700 text-neutral-300 disabled:opacity-40">
                  {busy === t.id ? "…" : t.hasArt ? "बदलें" : "डालें"}
                </button>
                {t.hasArt && (
                  <button type="button" onClick={() => del(t.id)}
                    className="text-[11px] px-2 py-1.5 rounded-lg border border-red-900 text-red-400">🗑</button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <input ref={fileRef} type="file" accept="image/*" onChange={pick} className="hidden" />
    </div>
  );
}
