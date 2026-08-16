import React, { useState, useEffect, useRef } from "react";
import { getBrand } from "./brands.js";
const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// ═══════════════════════════════════════════════════════════════
//  AUTO ENGINE  (PRD #23, #29, #33)
//   • Batch    — "10 creatives एक साथ बना दो"
//   • Triggers — घटना होते ही अपने आप content बने
//   • Insights — FB/IG से असली views/likes
// ═══════════════════════════════════════════════════════════════

const inp = "w-full bg-neutral-800 rounded-lg p-2.5 text-sm outline-none border border-neutral-700 text-white";
const lbl = "text-xs text-neutral-400 mb-1";
const card = "rounded-2xl bg-neutral-900 border border-neutral-800 p-4";

export default function AutoEngine({ apiBase, token, brandId, onSent }) {
  const B = getBrand(brandId);
  const H = { "Content-Type": "application/json", Authorization: "Bearer " + token };

  const [view, setView] = useState("daily");
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");

  // ── Batch ──
  const [count, setCount] = useState(5);
  const [brief, setBrief] = useState("");
  const [job, setJob] = useState(null);
  const pollRef = useRef(null);

  // ── Triggers ──
  const [events, setEvents] = useState([]);
  const [rules, setRules] = useState([]);

  // ── Insights ──
  const [top, setTop] = useState(null);

  // ── रोज़ का Auto Engine ──
  const [daily, setDaily] = useState(null);

  async function api(url, opts) {
    const r = await fetch(apiBase + url, { headers: H, ...opts });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error || "Error");
    return j;
  }

  // ── batch polling ─────────────────────────────────────────
  function startPolling(jobId) {
    clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const j = await api(`/api/batch/${jobId}`);
        setJob(j);
        if (["done", "failed", "cancelled"].includes(j.status)) {
          clearInterval(pollRef.current);
          setBusy("");
          if (j.status === "done") {
            setNote(`✅ ${j.done} posts तैयार — Review में देखें${j.failed ? ` (${j.failed} नहीं बने)` : ""}`);
            vib([30, 30, 60]);
            if (onSent) onSent();
          }
          if (j.status === "failed") setErr(j.error || "batch fail हुआ");
        }
      } catch (_) {}
    }, 3000);
  }
  useEffect(() => () => clearInterval(pollRef.current), []);

  // पहले से कोई batch चल रहा हो तो उठा लो
  useEffect(() => {
    (async () => {
      try {
        const list = await api(`/api/batch?brand=${brandId}`);
        const live = (list || []).find((x) => ["queued", "running"].includes(x.status));
        if (live) { setJob(live); setBusy("posts बन रहे हैं…"); startPolling(live._id); }
        else setJob((list || [])[0] || null);
      } catch (_) {}
    })();
  }, [brandId, apiBase]);

  useEffect(() => {
    setErr("");
    if (view === "triggers") {
      api("/api/triggers/events").then((j) => setEvents(j.events || [])).catch(() => {});
      api(`/api/triggers?brand=${brandId}`).then(setRules).catch((e) => setErr(e.message));
    }
    if (view === "daily") api(`/api/daily-engine/status?brand=${brandId}`).then(setDaily).catch((e) => setErr(e.message));
    if (view === "insights") {
      api(`/api/insights/top?brand=${brandId}&days=30`).then(setTop).catch((e) => setErr(e.message));
    }
  }, [view, brandId, apiBase]);

  async function runDaily() {
    setErr(""); setNote(""); setBusy("आज का content बन रहा है…"); vib(60);
    try {
      const j = await api("/api/daily-engine/run", { method: "POST", body: JSON.stringify({ brand: brandId }) });
      setNote(j.message);
      setTimeout(async () => {
        try { setDaily(await api(`/api/daily-engine/status?brand=${brandId}`)); } catch (_) {}
        setBusy(""); if (onSent) onSent();
      }, 25000);
    } catch (e) { setErr(e.message); setBusy(""); }
  }

  async function runAutoVideo() {
    setErr(""); setNote(""); setBusy("video बन रहा है…"); vib(50);
    try {
      const j = await api("/api/auto-video", { method: "POST", body: JSON.stringify({ brand: brandId }) });
      setNote(j.message);
      setTimeout(() => { setBusy(""); if (onSent) onSent(); }, 25000);
    } catch (e) { setErr(e.message + (e.hint ? " — " + e.hint : "")); setBusy(""); }
  }

  async function saveDaily(patch) {
    vib(25);
    try {
      await api("/api/daily-engine/settings", { method: "PATCH", body: JSON.stringify({ brand: brandId, ...patch }) });
      setDaily(await api(`/api/daily-engine/status?brand=${brandId}`));
    } catch (e) { setErr(e.message); }
  }

  async function runBatch() {
    setErr(""); setNote(""); setBusy("plan बन रहा है…"); vib(50);
    try {
      const j = await api("/api/batch", { method: "POST", body: JSON.stringify({ brand: brandId, count, brief }) });
      setNote(j.message);
      setJob({ _id: j.jobId, status: "queued", requested: count, done: 0, failed: 0, items: [] });
      startPolling(j.jobId);
    } catch (e) { setErr(e.message); setBusy(""); }
  }

  async function cancelBatch() {
    if (!job?._id) return;
    try { await api(`/api/batch/${job._id}/cancel`, { method: "POST" }); setNote("रोक दिया"); }
    catch (e) { setErr(e.message); }
  }

  async function saveRule(event, patch) {
    setErr(""); vib(25);
    try {
      const existing = rules.find((r) => r.event === event);
      if (existing) await api(`/api/triggers/${existing._id}`, { method: "PATCH", body: JSON.stringify(patch) });
      else await api("/api/triggers", { method: "POST", body: JSON.stringify({ brand: brandId, event, ...patch }) });
      setRules(await api(`/api/triggers?brand=${brandId}`));
    } catch (e) { setErr(e.message); }
  }

  async function testRule(id) {
    setErr(""); setBusy("चला रहे हैं…"); vib(40);
    try {
      const j = await api(`/api/triggers/${id}/test`, { method: "POST" });
      setNote(j.message); if (onSent) onSent();
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  async function refreshInsights() {
    setErr(""); setNote(""); setBusy("FB/IG से आँकड़े ला रहे हैं…"); vib(40);
    try {
      const j = await api("/api/insights/refresh", { method: "POST", body: JSON.stringify({ brand: brandId, days: 30 }) });
      setNote(`✅ ${j.updated} posts के आँकड़े आए`);
      setTop(await api(`/api/insights/top?brand=${brandId}&days=30`));
    } catch (e) { setErr(e.message); }
    setBusy("");
  }

  const pct = job?.requested ? Math.round(((job.done + job.failed) / job.requested) * 100) : 0;
  const running = job && ["queued", "running"].includes(job.status);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {[["daily", "🌅 रोज़"], ["batch", "📦 एक साथ"], ["triggers", "⚡ अपने आप"], ["insights", "📈 आँकड़े"]].map(([id, label]) => (
          <button key={id} onClick={() => { vib(15); setView(id); }}
            style={{ borderColor: view === id ? B.accent : "#3a3a3a", background: view === id ? B.accent : "transparent", color: view === id ? "#fff" : "#9a9a9a" }}
            className="flex-1 px-1.5 py-2 rounded-xl text-xs font-medium border">{label}</button>
        ))}
      </div>

      {err && <div className="text-sm bg-red-950/60 border border-red-800 text-red-200 rounded-lg px-3 py-2">{err}</div>}
      {note && <div className="text-sm bg-green-950/50 border border-green-800 text-green-200 rounded-lg px-3 py-2">{note}</div>}
      {busy && <div className="text-sm bg-neutral-800 rounded-lg px-3 py-2 text-neutral-300">⏳ {busy}</div>}

      {/* ═══════ रोज़ का AUTO ENGINE ═══════ */}
      {view === "daily" && (<>
        <div className={card}>
          <p className="text-sm text-neutral-300 leading-relaxed">
            <b>रोज़ सुबह 7 बजे</b> यह अपने आप चलता है — poster भी बनते हैं और
            promotional video भी। आपको कुछ नहीं करना पड़ता, बस Review में देखकर approve करना है।
          </p>

          <div className="grid grid-cols-2 gap-3 mt-3">
            <div className="rounded-xl bg-neutral-800/60 p-3">
              <p className="text-xs text-neutral-400">आज बने</p>
              <p className="text-2xl font-bold" style={{ color: B.accent }}>{daily?.madeToday ?? "—"}</p>
              <p className="text-[11px] text-neutral-500">{daily?.videosToday ?? 0} video</p>
            </div>
            <div className="rounded-xl bg-neutral-800/60 p-3">
              <p className="text-xs text-neutral-400">गाड़ी photos</p>
              <p className="text-2xl font-bold text-amber-400">{daily?.vehiclePhotos ?? "—"}</p>
              <p className="text-[11px] text-neutral-500">video के लिए</p>
            </div>
          </div>

          {daily && daily.vehiclePhotos < 2 && (
            <p className="text-[11px] text-amber-300/80 mt-2 leading-relaxed">
              ⚠️ video बनाने के लिए कम से कम 2 गाड़ी photos चाहिए।
              विज्ञापन tab → गाड़ी library में upload कर दें, फिर हर रोज़ अपने आप video बनेगा।
            </p>
          )}

          <button onClick={runDaily} disabled={!!busy}
            className="w-full mt-3 rounded-xl py-3.5 font-bold text-white disabled:opacity-50 text-base"
            style={{ background: B.accent }}>
            🌅 आज का पूरा content अभी बनाएँ
          </button>

          <button onClick={runAutoVideo} disabled={!!busy || (daily?.vehiclePhotos ?? 0) < 2}
            className="w-full mt-2 rounded-xl py-2.5 text-sm font-semibold border border-neutral-700 text-neutral-300 disabled:opacity-40">
            🎬 सिर्फ़ promotional video बनाएँ
          </button>
        </div>

        <div className={card}>
          <h3 className="text-sm font-semibold text-neutral-300 mb-3">रोज़ की सेटिंग</h3>

          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-neutral-300">रोज़ अपने आप चले</span>
            <button onClick={() => saveDaily({ dailyEngineOn: !(daily?.dailyEngineOn) })}
              className="w-12 h-6 rounded-full relative transition-colors"
              style={{ background: daily?.dailyEngineOn ? B.accent : "#3a3a3a" }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                style={{ left: daily?.dailyEngineOn ? "26px" : "2px" }} />
            </button>
          </div>

          <p className={lbl}>रोज़ कितने poster — {daily?.dailyPosters ?? 3}</p>
          <input type="range" min={0} max={8} value={daily?.dailyPosters ?? 3} className="w-full"
            onChange={(e) => setDaily((d) => ({ ...d, dailyPosters: +e.target.value }))}
            onMouseUp={(e) => saveDaily({ dailyPosters: +e.target.value })}
            onTouchEnd={(e) => saveDaily({ dailyPosters: +e.target.value })} />

          <div className="flex items-center justify-between mt-3">
            <span className="text-sm text-neutral-300">रोज़ एक video भी बने</span>
            <button onClick={() => saveDaily({ dailyVideo: !(daily?.dailyVideo) })}
              className="w-12 h-6 rounded-full relative transition-colors"
              style={{ background: daily?.dailyVideo ? B.accent : "#3a3a3a" }}>
              <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                style={{ left: daily?.dailyVideo ? "26px" : "2px" }} />
            </button>
          </div>
        </div>

        <p className="text-[11px] text-neutral-600 leading-relaxed">
          ℹ️ हर photo और video के ऊपर अपने आप header लगता है — <b>बाएँ आपका logo,
          दाएँ कंपनी का logo</b>। कुछ भी अपने आप भेजा नहीं जाता, सब Review में आता है।
        </p>
      </>)}

      {/* ═══════ BATCH ═══════ */}
      {view === "batch" && (<>
        <div className={card}>
          <p className={lbl}>कितने posts एक साथ — {count}</p>
          <input type="range" min={2} max={15} value={count} disabled={running}
            onChange={(e) => setCount(+e.target.value)} className="w-full" />

          <p className={lbl + " mt-3"}>कुछ खास कहना हो तो (खाली छोड़ सकते हैं)</p>
          <textarea rows={2} value={brief} onChange={(e) => setBrief(e.target.value)} disabled={running}
            className={inp} placeholder={`जैसे: इस हफ़्ते ${B.products[0]} पर ज़ोर दें`} />

          <button onClick={runBatch} disabled={running || !!busy}
            className="w-full mt-3 rounded-xl py-3 font-semibold text-white disabled:opacity-50"
            style={{ background: B.accent }}>
            📦 {count} posts एक साथ बनाएँ
          </button>

          <p className="text-[11px] text-neutral-600 mt-2 leading-relaxed">
            सब Review में जाएँगे — <b className="text-neutral-500">अपने आप कहीं नहीं भेजे जाएँगे</b>।
            AI हर post अलग बनाता है, एक जैसे नहीं।
          </p>
        </div>

        {job && (
          <div className={card}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-neutral-200">
                {running ? "⏳ बन रहे हैं" : job.status === "done" ? "✅ पूरा हुआ" : job.status === "cancelled" ? "⏹️ रोका गया" : "❌ fail"}
              </span>
              <span className="text-xs text-neutral-500">{job.done + job.failed}/{job.requested}</span>
            </div>

            <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
              <div className="h-full transition-all duration-500" style={{ width: `${pct}%`, background: B.accent }} />
            </div>

            {job.failed > 0 && <p className="text-[11px] text-amber-300/70 mt-2">{job.failed} नहीं बन पाए</p>}

            {running && (
              <button onClick={cancelBatch} className="w-full mt-3 text-xs py-2 rounded-lg border border-neutral-700 text-neutral-400">
                ⏹️ रोकें (जो बन चुके वो रहेंगे)
              </button>
            )}

            {(job.items || []).filter((x) => x.contentId).length > 0 && (
              <div className="mt-3 space-y-1.5 border-t border-neutral-800 pt-3">
                {job.items.filter((x) => x.contentId).map((it, i) => (
                  <p key={i} className="text-xs text-neutral-400">
                    <span style={{ color: B.accent }}>{it.type}</span> — {it.text}…
                  </p>
                ))}
              </div>
            )}
          </div>
        )}
      </>)}

      {/* ═══════ TRIGGERS ═══════ */}
      {view === "triggers" && (<>
        <p className="text-xs text-neutral-500 leading-relaxed">
          अब तक सब कुछ सिर्फ़ समय पर चलता था। अब कोई घटना होते ही अपने आप content बन सकता है।
          <b className="text-neutral-400"> Default में सिर्फ़ Review में जाता है, भेजा नहीं जाता।</b>
        </p>

        {events.map((ev) => {
          const rule = rules.find((r) => r.event === ev.id);
          const on = rule?.enabled;
          return (
            <div key={ev.id} className="rounded-2xl border p-4"
              style={{ borderColor: on ? B.accent : "#2a2a2a", background: "#171717" }}>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-200">{ev.label}</span>
                <button onClick={() => saveRule(ev.id, { enabled: !on })}
                  className="w-12 h-6 rounded-full relative transition-colors"
                  style={{ background: on ? B.accent : "#3a3a3a" }}>
                  <span className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                    style={{ left: on ? "26px" : "2px" }} />
                </button>
              </div>

              {on && (
                <div className="mt-3 space-y-2 border-t border-neutral-800 pt-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <p className={lbl}>क्या बने</p>
                      <select value={rule?.contentType || "vigyapan"} className={inp}
                        onChange={(e) => saveRule(ev.id, { contentType: e.target.value })}>
                        <option value="vigyapan">विज्ञापन</option>
                        <option value="suvichar">सुविचार</option>
                        <option value="suchna">सूचना</option>
                        <option value="gift">गिफ्ट</option>
                      </select>
                    </div>
                    <div>
                      <p className={lbl}>दोबारा कितनी देर बाद</p>
                      <select value={rule?.cooldownMins || 30} className={inp}
                        onChange={(e) => saveRule(ev.id, { cooldownMins: +e.target.value })}>
                        <option value={15}>15 मिनट</option>
                        <option value={30}>30 मिनट</option>
                        <option value={120}>2 घंटे</option>
                        <option value={720}>12 घंटे</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-start gap-2 text-xs text-neutral-400 cursor-pointer">
                    <input type="checkbox" checked={!!rule?.autoApprove} className="mt-0.5"
                      onChange={(e) => saveRule(ev.id, { autoApprove: e.target.checked })} />
                    <span>
                      बिना पूछे भेज भी दे
                      <span className="block text-[11px] text-amber-300/70">
                        ⚠️ यह तभी काम करेगा जब Automation में "पूरा अपने आप" mode चालू हो
                      </span>
                    </span>
                  </label>

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-neutral-600">
                      {rule?.fireCount ? `${rule.fireCount} बार चला` : "अभी नहीं चला"}
                    </span>
                    {rule?._id && (
                      <button onClick={() => testRule(rule._id)} disabled={!!busy}
                        className="text-xs px-3 py-1.5 rounded-lg border border-neutral-700 text-neutral-300 disabled:opacity-50">
                        ▶ चलाकर देखें
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </>)}

      {/* ═══════ INSIGHTS ═══════ */}
      {view === "insights" && (<>
        <div className={card}>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl bg-neutral-800/60 p-3">
              <p className="text-xs text-neutral-400">कुल views</p>
              <p className="text-2xl font-bold" style={{ color: B.accent }}>{top?.totals?.views ?? "—"}</p>
            </div>
            <div className="rounded-xl bg-neutral-800/60 p-3">
              <p className="text-xs text-neutral-400">कुल engagement</p>
              <p className="text-2xl font-bold text-green-400">{top?.totals?.engagement ?? "—"}</p>
            </div>
          </div>

          <p className="text-[11px] text-neutral-500 mt-2">
            पिछले 30 दिन · {top?.withRealData ?? 0}/{top?.counted ?? 0} posts के असली आँकड़े मिले
          </p>

          <button onClick={refreshInsights} disabled={!!busy}
            className="w-full mt-3 rounded-xl py-2.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: B.accent }}>
            🔄 FB/IG से ताज़ा आँकड़े लाएँ
          </button>

          {top?.note && <p className="text-[11px] text-amber-300/70 mt-2">⚠️ {top.note}</p>}
        </div>

        {(top?.top || []).filter((x) => x.views || x.engagement).length > 0 && (
          <>
            <h3 className="text-sm font-semibold text-neutral-300 mt-4">🏆 सबसे अच्छे posts</h3>
            {top.top.filter((x) => x.views || x.engagement).slice(0, 5).map((x, i) => (
              <div key={x._id} className="rounded-xl bg-neutral-900 border border-neutral-800 p-3 flex gap-3">
                {x.img && <img src={apiBase + x.img} alt="" className="w-14 h-14 rounded-lg object-cover shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-neutral-500">#{i + 1} · {x.type}</p>
                  <p className="text-sm text-neutral-300 line-clamp-2">{x.text}</p>
                  <p className="text-xs mt-1" style={{ color: B.accent }}>
                    👁️ {x.views} · ❤️ {x.engagement}
                    {x.ig?.likes ? ` · IG ${x.ig.likes} likes` : ""}
                  </p>
                </div>
              </div>
            ))}
          </>
        )}

        <p className="text-[11px] text-neutral-600 leading-relaxed">
          ℹ️ ये आँकड़े <b>रोज़ रात 1 बजे अपने आप</b> भी आते हैं। अगर खाली दिख रहे हैं तो
          Settings में FB/IG token जाँचें — बिना token के Facebook आँकड़े नहीं देता।
        </p>
      </>)}
    </div>
  );
}
