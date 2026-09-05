// ============================================================================
//  GrowthTools.jsx — 🔗 link · ⏱️ समय · ♻️ दोबारा · #️⃣ hashtag
//  ---------------------------------------------------------------------------
//  ⚠️ ये चारों चीज़ें backend में महीनों से बनी पड़ी थीं, पर app से खुलती
//     ही नहीं थीं — यानी बना-बनाया काम बेकार पड़ा था।
//
//     /api/links          — tracking link, कौन-सी post से कितने आए
//     /api/best-times     — आपके अपने आँकड़ों से "कब भेजें"
//     /api/evergreen      — पुरानी hit post दोबारा
//     /api/hashtag-sets   — hashtag पहले comment में
//
//  Results.jsx में जोड़ें:
//      import GrowthTools from "./GrowthTools.jsx";
//      // VIEWS में: ["tools", "औज़ार"]
//      {view === "tools" && <GrowthTools {...} />}
// ============================================================================

import React, { useState, useEffect } from "react";
import { api, vib, Title, Empty, Err, Fold } from "./shared.jsx";

const DAY = ["रविवार", "सोमवार", "मंगलवार", "बुधवार", "गुरुवार", "शुक्रवार", "शनिवार"];

export default function GrowthTools({ brandId, accent = "#E4002B", onChange }) {
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");
  const flash = (m, bad) => { bad ? setErr(m) : setOk(m); setTimeout(() => { setErr(""); setOk(""); }, 4000); };

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-neutral-600 mb-1">
        ये चीज़ें कभी-कभार की हैं — जिसकी ज़रूरत हो वही डिब्बा खोलिए।
      </p>

      {err && <Err onClose={() => setErr("")}>{err}</Err>}
      {ok && <div className="rounded-lg bg-emerald-900/40 border border-emerald-800 text-emerald-300 text-xs px-3 py-2">{ok}</div>}

      <Fold icon="⏱️" title="कब भेजें" sub="आपके अपने आँकड़ों से — अंदाज़ा नहीं" defaultOpen>
        <BestTimes brandId={brandId} accent={accent} flash={flash} />
      </Fold>

      <Fold icon="🔗" title="tracking link" sub="कौन-सी post से कितने लोग आए">
        <Links brandId={brandId} accent={accent} flash={flash} />
      </Fold>

      <Fold icon="♻️" title="पुरानी hit post दोबारा" sub="जो पहले अच्छी चली, फिर से भेजिए">
        <Evergreen brandId={brandId} accent={accent} flash={flash} onChange={onChange} />
      </Fold>

      <Fold icon="#️⃣" title="hashtag सेट" sub="caption साफ़ रहे, tags पहले comment में">
        <Hashtags brandId={brandId} accent={accent} flash={flash} />
      </Fold>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  ⏱️ कब भेजें
// ══════════════════════════════════════════════════════════════════════════
function BestTimes({ brandId, accent, flash }) {
  const [d, setD] = useState(null);
  useEffect(() => {
    api(`/api/best-times?brand=${brandId}`).then(setD).catch((e) => flash(e.message, true));
    // eslint-disable-next-line
  }, [brandId]);

  if (!d) return <p className="text-xs text-neutral-600 pt-2">देख रहे हैं…</p>;

  return (
    <div className="pt-2 space-y-2">
      <p className="text-[11px] text-neutral-500">
        {d.basedOnRealData
          ? `आपकी पिछली ${d.sampleSize} posts के असली आँकड़ों से`
          : d.note}
      </p>
      <div className="grid grid-cols-2 gap-2">
        {(d.top || []).map((t, i) => (
          <div key={i} className="rounded-xl bg-neutral-900 border border-neutral-800 p-2.5">
            <div className="text-sm font-semibold" style={{ color: accent }}>{t.label}</div>
            <div className="text-[10px] text-neutral-500 leading-snug mt-0.5">{t.why}</div>
          </div>
        ))}
      </div>
      {d.worst?.length > 0 && (
        <p className="text-[10px] text-neutral-600">
          सबसे कम चलने वाला समय: {d.worst.join(", ")} — इनसे बचिए
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  🔗 tracking link
// ══════════════════════════════════════════════════════════════════════════
function Links({ brandId, accent, flash }) {
  const [rows, setRows] = useState([]);
  const [label, setLabel] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    api(`/api/links?brand=${brandId}`).then((d) => setRows(Array.isArray(d) ? d : []))
      .catch((e) => flash(e.message, true));
  }
  useEffect(load, [brandId]);   // eslint-disable-line

  async function banao() {
    vib(30); setBusy(true);
    try {
      const d = await api("/api/links", {
        method: "POST",
        body: JSON.stringify({ brand: brandId, label: label || "नया link" }),
      });
      setRows((p) => [d, ...p]);
      setLabel("");
      flash("✓ link बन गया — post में डाल दीजिए");
    } catch (e) { flash(e.message, true); }
    setBusy(false);
  }

  return (
    <div className="pt-2 space-y-2.5">
      <p className="text-[11px] text-neutral-500 leading-relaxed">
        post में छोटा link डालिए। जितने लोग दबाएँगे, गिनती यहाँ दिखेगी —
        तब पता चलेगा कि कौन-सी post सचमुच ग्राहक ला रही है।
      </p>

      <div className="flex gap-2">
        <input value={label} onChange={(e) => setLabel(e.target.value)}
          placeholder="किस post के लिए? जैसे — Shine ऑफर"
          className="flex-1 bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-2 text-sm text-white outline-none" />
        <button type="button" onClick={banao} disabled={busy}
          className="rounded-lg px-4 text-sm font-semibold text-white disabled:opacity-40"
          style={{ background: accent }}>
          {busy ? "…" : "बनाएँ"}
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="text-xs text-neutral-600">अभी कोई link नहीं</p>
      ) : rows.map((r) => (
        <div key={r.code} className="rounded-xl bg-neutral-900 border border-neutral-800 p-2.5">
          <div className="flex justify-between items-start gap-2">
            <div className="min-w-0 flex-1">
              <p className="text-xs text-neutral-200 truncate">{r.label || r.code}</p>
              <p className="text-[10px] text-neutral-500 truncate">{r.url}</p>
            </div>
            <button type="button" onClick={() => { vib(20); navigator.clipboard?.writeText(r.url); flash("copy हो गया"); }}
              className="text-[10px] px-2 py-1 rounded-lg border border-neutral-700 text-neutral-400 flex-shrink-0">
              📋
            </button>
          </div>
          <div className="flex gap-3 mt-1.5 text-[10px] text-neutral-500">
            <span>👆 {r.clicks} दबाए</span>
            <span>👤 {r.uniqueClicks} अलग लोग</span>
            {r.leadsFromThis > 0 && <span className="text-emerald-400">✅ {r.leadsFromThis} ग्राहक</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  ♻️ पुरानी hit post दोबारा
// ══════════════════════════════════════════════════════════════════════════
function Evergreen({ brandId, accent, flash, onChange }) {
  const [d, setD] = useState(null);
  const [busy, setBusy] = useState("");

  function load() {
    api(`/api/evergreen?brand=${brandId}`).then(setD).catch((e) => flash(e.message, true));
  }
  useEffect(load, [brandId]);   // eslint-disable-line

  async function dobara(id) {
    vib(30); setBusy(id);
    try {
      const kal = new Date(Date.now() + 864e5);
      kal.setHours(10, 0, 0, 0);
      await api(`/api/evergreen/${id}/reschedule`, {
        method: "POST", body: JSON.stringify({ runAt: kal.toISOString() }),
      });
      flash("✓ कल सुबह 10 बजे के लिए तय हो गई");
      onChange && onChange();
    } catch (e) { flash(e.message, true); }
    setBusy("");
  }

  if (!d) return <p className="text-xs text-neutral-600 pt-2">देख रहे हैं…</p>;

  return (
    <div className="pt-2 space-y-2">
      {!d.rows?.length ? (
        <p className="text-[11px] text-neutral-500">{d.note}</p>
      ) : (
        <>
          <p className="text-[11px] text-neutral-500">{d.note}</p>
          {d.rows.slice(0, 6).map((r) => (
            <div key={r.id} className="rounded-xl bg-neutral-900 border border-neutral-800 p-2.5">
              <div className="flex gap-2.5 items-start">
                {r.img
                  ? <img src={r.img.startsWith("http") ? r.img : ""} alt=""
                      className="w-12 h-12 rounded-lg object-cover flex-shrink-0 bg-neutral-800" />
                  : <div className="w-12 h-12 rounded-lg bg-neutral-800 flex-shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-neutral-300 line-clamp-2">{r.text}</p>
                  <p className="text-[10px] text-neutral-500 mt-0.5">
                    {r.ageDays} दिन पुरानी · अंक {r.score}
                  </p>
                </div>
              </div>
              <button type="button" onClick={() => dobara(r.id)} disabled={busy === r.id}
                className="w-full mt-2 rounded-lg py-2 text-xs font-semibold text-white disabled:opacity-40"
                style={{ background: accent }}>
                {busy === r.id ? "…" : "♻️ कल सुबह दोबारा भेजें"}
              </button>
            </div>
          ))}
        </>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  #️⃣ hashtag सेट
// ══════════════════════════════════════════════════════════════════════════
function Hashtags({ brandId, accent, flash }) {
  const [tags, setTags] = useState("");
  const [first, setFirst] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api(`/api/hashtag-sets?brand=${brandId}`).then((d) => {
      const s = (Array.isArray(d) ? d : []).find((x) => x.brand === brandId) || d?.[0];
      if (s) { setTags((s.tags || []).join(" ")); setFirst(s.useAsFirstComment !== false); }
    }).catch(() => {});
  }, [brandId]);

  async function save() {
    vib(30); setBusy(true);
    try {
      await api(`/api/hashtag-sets/${brandId}`, {
        method: "PUT",
        body: JSON.stringify({
          tags: tags.split(/[\s,]+/).filter(Boolean),
          useAsFirstComment: first,
        }),
      });
      flash("✓ सेव हो गया");
    } catch (e) { flash(e.message, true); }
    setBusy(false);
  }

  return (
    <div className="pt-2 space-y-2.5">
      <p className="text-[11px] text-neutral-500 leading-relaxed">
        बहुत सारे hashtag caption में डालने से post गन्दी दिखती है। इन्हें
        पहले comment में डाल दीजिए — फ़ायदा वही, दिखने में साफ़।
      </p>

      <textarea value={tags} onChange={(e) => setTags(e.target.value)} rows={3}
        placeholder="#VPHonda #Honda #Bhopal #HondaBhopal"
        className="w-full bg-neutral-800 border border-neutral-700 rounded-lg px-2.5 py-2 text-sm text-white outline-none resize-none" />

      <label className="flex items-center gap-2 text-xs text-neutral-300">
        <input type="checkbox" checked={first} onChange={(e) => setFirst(e.target.checked)}
          className="w-4 h-4" style={{ accentColor: accent }} />
        caption में नहीं, पहले comment में डालें
      </label>

      <button type="button" onClick={save} disabled={busy}
        className="w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-40"
        style={{ background: accent }}>
        {busy ? "…" : "सेव करें"}
      </button>
    </div>
  );
}
