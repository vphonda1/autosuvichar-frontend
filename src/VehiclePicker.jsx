// ============================================================================
//  VehiclePicker.jsx — गाड़ी चुनो, photo + पूरा ब्यौरा अपने आप आ जाए
//  ---------------------------------------------------------------------------
//  यह एक ही डिब्बा हर editor में लगता है। गाड़ी पर उँगली रखते ही:
//
//      • उसकी सेव की हुई photo
//      • नाम, variant, engine, माइलेज
//      • एक्स-शोरूम, डाउन पेमेंट, EMI, ROI
//      • कैशबैक, एक्सचेंज बोनस, ऑफर नोट
//      • poster पर सीधे चिपकाने लायक़ बनी-बनाई लाइनें (headline, priceLine…)
//
//  …सब कुछ एक साथ मिल जाता है। हर बार हाथ से टाइप करने या photo ढूँढने की
//  ज़रूरत नहीं।
//
//  ⚠️ ज़रूरी बात — क़ीमत सिर्फ़ "गाड़ियाँ" वाले पन्ने से आती है, AI कभी अपनी
//     तरफ़ से कोई number नहीं बनाता। इसलिए poster पर ग़लत क़ीमत छपने का
//     ख़तरा नहीं रहता।
//
//  इस्तेमाल:
//      <VehiclePicker
//        apiBase={apiBase} token={token} brandId={brandId}
//        onPick={(v) => {
//          if (v.photo) setBikeImg(v.photo);
//          setHeadline(v.fullName);
//          setPrice(v.exShowroom);
//        }}
//      />
// ============================================================================

import React, { useState, useEffect } from "react";

const vib = (ms = 30) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

const CAT_ICON = { motorcycle: "🏍️", scooter: "🛵", ev: "⚡", auto: "🛺" };

export default function VehiclePicker({
  apiBase, token, brandId,
  onPick,                       // (kit) => void — चुनने पर पूरा ब्यौरा
  label = "🏍️ अपनी गाड़ी चुनें",
  hint = "चुनते ही photo और सारे दाम अपने आप भर जाएँगे",
  compact = false,              // true = सिर्फ़ dropdown, कोई कार्ड नहीं
}) {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [picking, setPicking] = useState(false);
  const [chosen, setChosen] = useState(null);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState("");

  const auth = { Authorization: "Bearer " + token };
  const full = (u) => (u ? (u.startsWith("http") ? u : apiBase + u) : "");

  useEffect(() => {
    let dead = false;
    setLoading(true); setErr(""); setChosen(null);
    fetch(`${apiBase}/api/vehicles?brand=${brandId}`, { headers: auth })
      .then((r) => r.json())
      .then((d) => { if (!dead) setList(Array.isArray(d) ? d : []); })
      .catch((e) => { if (!dead) setErr(e.message); })
      .finally(() => { if (!dead) setLoading(false); });
    return () => { dead = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiBase, brandId]);

  async function choose(v) {
    vib(30); setPicking(true); setErr(""); setOpen(false);
    try {
      // पूरा "kit" server से लो — बनी-बनाई लाइनें वहीं तैयार होती हैं,
      // ताकि हर editor में एक जैसी दिखें
      const r = await fetch(`${apiBase}/api/vehicles/${v._id}/kit`, { headers: auth });
      const kit = await r.json();
      if (!r.ok) throw new Error(kit.error || "जानकारी नहीं मिली");
      setChosen(kit);
      onPick && onPick(kit);
      if (!kit.photo) setErr("इस गाड़ी की photo नहीं लगी — 'गाड़ियाँ' पन्ने पर जाकर डाल दें, फिर हर बार अपने आप आएगी");
    } catch (e) { setErr(e.message); }
    setPicking(false);
  }

  const inStock = list.filter((v) => v.inStock !== false);
  const outStock = list.filter((v) => v.inStock === false);

  // ── कुछ जोड़ा ही नहीं ─────────────────────────────────────────
  if (!loading && list.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-neutral-700 px-3 py-4 text-center">
        <p className="text-xs text-neutral-400">इस brand की कोई गाड़ी नहीं जोड़ी</p>
        <p className="text-[10px] text-neutral-600 mt-1">
          पहले ⚙️ सेटिंग → गाड़ियों की सूची में गाड़ी और उसकी photo जोड़ें
        </p>
      </div>
    );
  }

  // ── सिर्फ़ dropdown ───────────────────────────────────────────
  if (compact) {
    return (
      <div>
        <select disabled={loading || picking}
          onChange={(e) => { const v = list.find((x) => x._id === e.target.value); if (v) choose(v); }}
          value={chosen?.id || ""}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none">
          <option value="">{loading ? "आ रही हैं…" : "— गाड़ी चुनें —"}</option>
          {list.map((v) => (
            <option key={v._id} value={v._id}>
              {v.imageUrl ? "📷 " : "○ "}{v.name}{v.variant ? ` ${v.variant}` : ""}
              {v.exShowroom ? ` — ${v.exShowroom}` : ""}
            </option>
          ))}
        </select>
        {err && <p className="text-[10px] text-amber-400 mt-1">{err}</p>}
      </div>
    );
  }

  // ── पूरा डिब्बा ──────────────────────────────────────────────
  return (
    <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-white">{label}</p>
        {chosen && (
          <button type="button" onClick={() => { vib(15); setChosen(null); setErr(""); }}
            className="text-[10px] text-neutral-500 underline">बदलें</button>
        )}
      </div>

      {/* चुनी हुई गाड़ी */}
      {chosen ? (
        <div className="flex gap-3 items-start rounded-xl bg-neutral-900 border border-emerald-800 p-2.5">
          <div className="w-16 h-16 rounded-lg flex-shrink-0 bg-neutral-800 flex items-center justify-center overflow-hidden">
            {chosen.photo
              ? <img src={chosen.photo} alt="" className="w-full h-full object-contain" />
              : <span className="text-[9px] text-neutral-600 text-center px-1">photo<br />नहीं</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white">{chosen.fullName}</p>
            {chosen.subline && <p className="text-[11px] text-neutral-500">{chosen.subline}</p>}
            <div className="flex flex-wrap gap-1 mt-1.5">
              {chosen.exShowroom && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300">{chosen.exShowroom}</span>}
              {chosen.downPayment && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-neutral-800 text-neutral-300">डाउन {chosen.downPayment}</span>}
              {chosen.emi && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-blue-900/50 text-blue-300">EMI {chosen.emi}</span>}
              {chosen.cashback && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-900/50 text-emerald-300">कैशबैक {chosen.cashback}</span>}
            </div>
          </div>
          <span className="text-emerald-400 text-sm flex-shrink-0">✓</span>
        </div>
      ) : (
        <button type="button" onClick={() => { vib(15); setOpen(!open); }} disabled={loading || picking}
          className="w-full rounded-xl border border-neutral-700 py-2.5 text-sm text-neutral-300 disabled:opacity-50">
          {loading ? "गाड़ियाँ आ रही हैं…" : picking ? "जानकारी ला रहे हैं…" : `गाड़ी चुनें (${list.length})`}
        </button>
      )}

      {!chosen && !open && <p className="text-[10px] text-neutral-600 mt-1.5">{hint}</p>}
      {err && <p className="text-[10px] text-amber-400 mt-1.5 leading-relaxed">{err}</p>}

      {/* सूची */}
      {open && !chosen && (
        <div className="mt-2 space-y-1.5 max-h-72 overflow-y-auto">
          {[["स्टॉक में", inStock], ["स्टॉक में नहीं", outStock]].map(([head, arr]) =>
            arr.length === 0 ? null : (
              <div key={head}>
                <p className="text-[10px] text-neutral-600 px-1 pt-1">{head}</p>
                {arr.map((v) => (
                  <button key={v._id} type="button" onClick={() => choose(v)}
                    className="w-full flex gap-2.5 items-center text-left rounded-lg bg-neutral-900 border border-neutral-800 p-2 mt-1 active:border-neutral-600">
                    <div className="w-11 h-11 rounded-lg flex-shrink-0 bg-neutral-800 flex items-center justify-center overflow-hidden">
                      {v.imageUrl
                        ? <img src={full(v.imageUrl)} alt="" className="w-full h-full object-contain" />
                        : <span className="text-base opacity-40">{CAT_ICON[v.category] || "🏍️"}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-neutral-100 truncate">
                        {v.name}{v.variant ? ` ${v.variant}` : ""}
                      </p>
                      <p className="text-[10px] text-neutral-500 truncate">
                        {v.exShowroom || "क़ीमत नहीं भरी"}
                        {v.emi ? ` · EMI ${v.emi}` : ""}
                      </p>
                    </div>
                    {!v.imageUrl && (
                      <span className="text-[9px] text-amber-500 flex-shrink-0">photo नहीं</span>
                    )}
                  </button>
                ))}
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
