const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };
import React, { useState } from "react";

const SEV = {
  high:   { icon: "🔴", cls: "bg-red-900/50 text-red-300 border-red-800" },
  medium: { icon: "🟡", cls: "bg-amber-900/40 text-amber-300 border-amber-800" },
  low:    { icon: "🔵", cls: "bg-blue-900/40 text-blue-300 border-blue-800" },
};

const VERDICT = {
  pass: { label: "✅ ठीक है", cls: "bg-emerald-900/60 text-emerald-300 border-emerald-700" },
  warn: { label: "⚠️ ध्यान दें", cls: "bg-amber-900/50 text-amber-300 border-amber-700" },
  fail: { label: "❌ सुधार ज़रूरी", cls: "bg-red-900/60 text-red-300 border-red-700" },
};

export default function QualityCheck({ apiBase, token, contentId, brand, text, onFixed }) {
  const [checking, setChecking] = useState(false);
  const [applying, setApplying] = useState(false);
  const [res, setRes] = useState(null);
  const [err, setErr] = useState("");
  const [open, setOpen] = useState(false);

  async function check() {
    vib(40); setChecking(true); setErr(""); setRes(null); setOpen(true);
    try {
      const url = contentId
        ? `${apiBase}/api/quality/check/${contentId}`
        : `${apiBase}/api/quality/check`;
      const opts = {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      };
      if (!contentId) opts.body = JSON.stringify({ brand, text });
      else opts.body = JSON.stringify({});
      const r = await fetch(url, opts);
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setRes(d);
      vib(d.verdict === "pass" ? [30] : [30, 40, 30]);
    } catch (e) { setErr(e.message); }
    setChecking(false);
  }

  async function applyFix() {
    if (!res?.fixedText || !contentId) return;
    vib(50); setApplying(true); setErr("");
    try {
      const r = await fetch(`${apiBase}/api/quality/apply-fix/${contentId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ fixedText: res.fixedText }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");
      setRes(null); setOpen(false);
      vib([30, 30, 60]);
      if (onFixed) onFixed(d.doc);
    } catch (e) { setErr(e.message); }
    setApplying(false);
  }

  const v = res ? VERDICT[res.verdict] || VERDICT.warn : null;

  return (
    <div className="mt-2">
      <button type="button" onClick={check} disabled={checking}
        className="w-full py-2 rounded-xl border border-neutral-700 text-xs text-neutral-300 hover:border-yellow-500 hover:text-yellow-400 disabled:opacity-40">
        {checking ? "🔍 AI check कर रहा है…" : "🔍 AI Quality Check"}
      </button>

      {err && <p className="mt-1.5 text-[11px] text-red-400 px-1">❌ {err}</p>}

      {open && res && (
        <div className="mt-2 rounded-xl bg-neutral-900 border border-neutral-800 p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${v.cls}`}>{v.label}</span>
            {typeof res.score === "number" && (
              <span className="text-xs text-neutral-400">Score: <b className={res.score >= 80 ? "text-emerald-400" : res.score >= 50 ? "text-amber-400" : "text-red-400"}>{res.score}</b>/100</span>
            )}
            <button type="button" onClick={() => { vib(15); setOpen(false); }} className="text-neutral-500 text-xs ml-auto">✕</button>
          </div>

          {res.summary_hindi && <p className="text-xs text-neutral-300">{res.summary_hindi}</p>}

          {res.issues?.length > 0 && (
            <div className="space-y-1.5">
              {res.issues.map((it, i) => {
                const s = SEV[it.severity] || SEV.low;
                return (
                  <div key={i} className={`rounded-lg border px-2.5 py-2 ${s.cls}`}>
                    <p className="text-[11px] font-semibold">{s.icon} {it.issue_hindi}</p>
                    {it.fix_hindi && <p className="text-[10px] opacity-80 mt-0.5">→ {it.fix_hindi}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {res.issues?.length === 0 && (
            <p className="text-[11px] text-emerald-400">कोई गड़बड़ी नहीं मिली — भेज सकते हैं ✓</p>
          )}

          {res.fixedText && contentId && (
            <>
              <div className="rounded-lg bg-neutral-800 border border-neutral-700 px-2.5 py-2">
                <p className="text-[10px] text-neutral-500 mb-1">AI का सुधरा हुआ text:</p>
                <p className="text-[11px] text-neutral-200 whitespace-pre-wrap">{res.fixedText}</p>
              </div>
              <button type="button" onClick={applyFix} disabled={applying}
                className="w-full py-2.5 rounded-xl text-xs font-bold text-black disabled:opacity-40"
                style={{ background: "#FFD600" }}>
                {applying ? "लगा रहे हैं…" : "✅ यह सुधार लागू करें (poster दोबारा बनेगा)"}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
