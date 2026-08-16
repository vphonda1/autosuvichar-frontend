import React, { useState, useEffect, useRef } from "react";
import { getBrand, BRAND_IDS } from "./brands.js";
const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

// ═══════════════════════════════════════════════════════════════
//  LOGO सेटिंग
//  ⚠️ यहाँ सिर्फ़ वही logo दिखते हैं जो आपने public/logos/ में डाले हैं।
//     App अपनी तरफ़ से कोई logo नहीं बनाता।
//     बाएँ = आपका अपना logo   |   दाएँ = कंपनी का logo
// ═══════════════════════════════════════════════════════════════

const card = "rounded-2xl bg-neutral-900 border border-neutral-800 p-4";
const sel = "w-full bg-neutral-800 rounded-lg p-2.5 text-sm outline-none border border-neutral-700 text-white";

export default function LogoSettings({ apiBase, token }) {
  const H = { "Content-Type": "application/json", Authorization: "Bearer " + token };
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const fileRef = useRef(null);

  async function load() {
    try {
      const r = await fetch(apiBase + "/api/logos", { headers: H });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setData(j);
    } catch (e) { setErr(e.message); }
  }
  useEffect(() => { load(); }, [apiBase]);

  async function assign(brand, key, value) {
    setErr(""); setNote(""); vib(25);
    try {
      const r = await fetch(apiBase + "/api/logos", {
        method: "PATCH", headers: H,
        body: JSON.stringify({ brand, [key]: value }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setNote("✅ बदल गया — अब से हर नया photo/video इसी से बनेगा");
      await load();
    } catch (e) { setErr(e.message); }
  }

  async function upload(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setErr(""); setNote(""); setBusy("upload हो रहा है…"); vib(40);
    try {
      const fd = new FormData();
      fd.append("logo", f);
      const r = await fetch(apiBase + "/api/logos/upload", {
        method: "POST", headers: { Authorization: "Bearer " + token }, body: fd,
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error || "Error");
      setNote(`✅ "${j.file}" जुड़ गई — अब नीचे से चुन लीजिए कि कहाँ लगानी है`);
      await load();
    } catch (e) { setErr(e.message); }
    setBusy("");
    if (fileRef.current) fileRef.current.value = "";
  }

  const files = data?.files || [];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-blue-900/60 bg-blue-950/25 p-3">
        <p className="text-sm text-blue-100 font-semibold mb-1">यहाँ सिर्फ़ आपके अपने logo</p>
        <p className="text-xs text-blue-100/75 leading-relaxed">
          App अपनी तरफ़ से कोई logo नहीं बनाता। नीचे सिर्फ़ वही files दिखती हैं जो
          <code className="mx-1 text-blue-200">public/logos/</code> में पड़ी हैं।
          हर brand के लिए चुन लीजिए कि <b>बाएँ</b> कौन-सा लगे और <b>दाएँ</b> कौन-सा।
        </p>
      </div>

      {err && <div className="text-sm bg-red-950/60 border border-red-800 text-red-200 rounded-lg px-3 py-2">{err}</div>}
      {note && <div className="text-sm bg-green-950/50 border border-green-800 text-green-200 rounded-lg px-3 py-2">{note}</div>}
      {busy && <div className="text-sm bg-neutral-800 rounded-lg px-3 py-2 text-neutral-300">⏳ {busy}</div>}

      {/* ── जो files मौजूद हैं ── */}
      <div className={card}>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-neutral-300">📁 आपके logo ({files.length})</h3>
          <button onClick={load} className="text-xs text-neutral-500 underline">refresh</button>
        </div>

        {files.length === 0 ? (
          <p className="text-sm text-neutral-500">
            कोई logo नहीं मिला। नीचे से upload कीजिए या GitHub पर
            <code className="mx-1">public/logos/</code> में डाल दीजिए।
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {files.map((f) => (
              <div key={f} className="text-center">
                <div className="rounded-xl bg-neutral-800 p-2 h-20 flex items-center justify-center">
                  <img src={`${apiBase}/logos/${f}`} alt={f} className="max-h-full max-w-full object-contain" />
                </div>
                <p className="text-[10px] text-neutral-500 mt-1 break-all leading-tight">{f}</p>
              </div>
            ))}
          </div>
        )}

        <input ref={fileRef} type="file" accept="image/*" onChange={upload} className="hidden" />
        <button onClick={() => { vib(20); fileRef.current?.click(); }} disabled={!!busy}
          className="w-full mt-3 rounded-xl py-2.5 text-sm font-semibold border border-neutral-700 text-neutral-300 disabled:opacity-50">
          ➕ नया logo upload करें
        </button>
        <p className="text-[11px] text-neutral-600 mt-1.5">
          जो file नाम upload करेंगे वही रहेगा। पुरानी file उसी नाम से डालें तो बदल जाएगी।
        </p>
      </div>

      {/* ── हर brand की सेटिंग ── */}
      {BRAND_IDS.map((id) => {
        const B = getBrand(id);
        const cfg = data?.brands?.[id] || {};
        return (
          <div key={id} className={card} style={{ borderColor: B.accent + "55" }}>
            <h3 className="text-sm font-bold mb-3" style={{ color: B.accent }}>{B.name}</h3>

            {/* preview */}
            <div className="rounded-xl bg-neutral-800/60 p-3 mb-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-center flex-1">
                  <div className="h-14 flex items-center justify-center">
                    {cfg.ownerLogo
                      ? <img src={`${apiBase}/logos/${cfg.ownerLogo}`} alt="" className="max-h-full object-contain" />
                      : <span className="text-xs text-neutral-600">— खाली —</span>}
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">बाएँ (आपका)</p>
                </div>
                <div className="text-[10px] text-neutral-600">poster का header</div>
                <div className="text-center flex-1">
                  <div className="h-14 flex items-center justify-center">
                    {cfg.companyLogo
                      ? <img src={`${apiBase}/logos/${cfg.companyLogo}`} alt="" className="max-h-full object-contain" />
                      : <span className="text-xs text-neutral-600">— खाली —</span>}
                  </div>
                  <p className="text-[10px] text-neutral-500 mt-1">दाएँ (कंपनी का)</p>
                </div>
              </div>
            </div>

            <p className="text-xs text-neutral-400 mb-1">बाएँ — आपका अपना logo</p>
            <select className={sel} value={cfg.savedOwner || cfg.ownerLogo || ""}
              onChange={(e) => assign(id, "ownerLogo", e.target.value)}>
              <option value="">— कोई नहीं —</option>
              {files.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>

            <p className="text-xs text-neutral-400 mb-1 mt-3">दाएँ — कंपनी का logo</p>
            <select className={sel} value={cfg.savedCompany || cfg.companyLogo || ""}
              onChange={(e) => assign(id, "companyLogo", e.target.value)}>
              <option value="">— कोई नहीं —</option>
              {files.map((f) => <option key={f} value={f}>{f}</option>)}
            </select>

            {cfg.ownerLogo && cfg.companyLogo === null && cfg.savedCompany && (
              <p className="text-[11px] text-amber-300/80 mt-2">
                ⚠️ दोनों तरफ़ एक ही file चुनी है — इसलिए दायाँ छोड़ दिया गया
                (वरना एक ही logo दो बार छपता)।
              </p>
            )}
          </div>
        );
      })}

      <p className="text-[11px] text-neutral-600 leading-relaxed">
        ℹ️ बदलाव तुरंत लागू होता है — इसके बाद जो भी photo या video बनेगी, उसके header में
        यही logo आएँगे। पहले से बनी हुई posts वैसी ही रहेंगी।
      </p>
    </div>
  );
}
