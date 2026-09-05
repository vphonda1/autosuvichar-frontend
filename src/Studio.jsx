// ============================================================================
//  Studio.jsx — "बनाओ"
//  ---------------------------------------------------------------------------
//  पहले 15 अलग tabs थे: विज्ञापन+, Mega Offer, बुकिंग, Multi Bike, भर्ती,
//  Lucky Draw, Delivery, AI Delivery, AI Video, AI आवाज़, ख़बरें, कंटेंट,
//  Platform+Versions, Auto Marketing, एक-साथ/अपने-आप।
//
//  सब वही हैं — एक भी हटाया नहीं गया। बस अब एक ही पर्दे पर, तस्वीर के साथ
//  चुनने को मिलते हैं। कौन-सा किस काम का है, यह अब पढ़कर समझ आता है।
// ============================================================================

import React, { useEffect, useState, useRef } from "react";
import { api, vib, Title, Err, Fold } from "./shared.jsx";
import { CAPS, GROUPS, matchCap, searchCaps, capById, capsByGroup } from "./capabilities.js";
import { BRANDS as BRAND_CFG } from "./brands.js";

import AICommandCenter from "./AICommandCenter.jsx";
import PromoEditor from "./PromoEditor.jsx";
import MegaOfferEditor from "./MegaOfferEditor.jsx";
import BookingEditor from "./BookingEditor.jsx";
import MultibikeEditor from "./MultibikeEditor.jsx";
import HiringEditor from "./HiringEditor.jsx";
import LuckyDrawEditor from "./LuckyDrawEditor.jsx";
import DeliveryEditor from "./DeliveryEditor.jsx";
import AIDelivery from "./AIDelivery.jsx";
import AIVideo from "./AIVideo.jsx";
import AIVoice from "./AIVoice.jsx";
import AINews from "./AINews.jsx";
import AIStudio from "./AIStudio.jsx";
import AutoMarketing from "./AutoMarketing.jsx";
import AutoEngine from "./AutoEngine.jsx";
import Announcer from "./Announcer.jsx";
import CompareEditor from "./CompareEditor.jsx";

// ⚠️ पहले यहाँ साँचों की अपनी अलग सूची थी, और command-router में एक और।
//    एक जगह जोड़ो तो दूसरी छूट जाए। अब दोनों capabilities.js से आते हैं —
//    एक ही सूची, एक ही सच्चाई।

// ── रोज़ की post — 8 dropdown छिपे हुए, ज़रूरत पड़े तभी खुलें ─────────────
const TYPES = [
  { id: "suvichar", label: "सुविचार", icon: "✨" },
  { id: "vigyapan", label: "विज्ञापन", icon: "📣" },
  { id: "festival", label: "त्यौहार", icon: "🎉" },
  { id: "suchna",   label: "सूचना",   icon: "📌" },
  { id: "gift",     label: "गिफ़्ट",   icon: "🎁" },
];
const BG_OPTS = [
  ["showroom_pro", "🏬 शोरूम"], ["studio_grad", "📸 स्टूडियो"], ["diwali_pro", "🪔 दिवाली"],
  ["templearch_bg", "🛕 मंदिर"], ["speed_road", "🛣️ रोड"], ["neon_city", "🌃 नीयन"],
  ["gold_lux", "👑 गोल्ड"], ["carbon_red", "🏁 कार्बन"],
];
const OFFERS = [
  ["cashback", "कैशबैक"], ["lowdp", "कम डाउन पेमेंट"], ["exchange", "एक्सचेंज बोनस"],
  ["student", "स्टूडेंट स्पेशल"], ["festival", "फेस्टिव ऑफ़र"], ["freegift", "फ्री गिफ़्ट"],
];

function QuickPost({ brandId, accent, onDone }) {
  const [type, setType] = useState("suvichar");
  const [text, setText] = useState("");
  const [bg, setBg] = useState("auto");
  const [design, setDesign] = useState("auto");
  const [offers, setOffers] = useState([]);
  const [tags, setTags] = useState([]);
  const [festival, setFestival] = useState("");
  const [festList, setFestList] = useState([]);
  const [designs, setDesigns] = useState([]);
  const [autoDecor, setAutoDecor] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState(false);

  const tagOpts = [...(BRAND_CFG[brandId]?.hashtags || []), "#Bhopal", "#BestDeal", "#EMI", "#TestRide"];
  const toggle = (arr, set, v) => set(arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  useEffect(() => {
    api("/api/festivals").then((r) => { setFestList(r.festivals || []); setFestival((p) => p || r.upcoming || ""); }).catch(() => {});
    api("/api/designs").then((r) => setDesigns(r.designs || [])).catch(() => {});
  }, []);

  async function go() {
    setErr(""); setBusy(true); setDone(false);
    try {
      await api("/api/generate", {
        method: "POST",
        body: JSON.stringify({
          brand: brandId, type, customText: text.trim(),
          offer: offers.join(","), bg, design, autoDecor,
          tags: tags.join(" "),
          autoSeed: Date.now() + "-" + Math.random(),
          festival: type === "festival" ? festival : undefined,
        }),
      });
      setDone(true); setText("");
      onDone && onDone();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  return (
    <div className="space-y-3">
      <Err onClose={() => setErr("")}>{err}</Err>

      <div className="flex flex-wrap gap-2">
        {TYPES.map((t) => (
          <button key={t.id} onClick={() => { vib(15); setType(t.id); }}
            className="px-3 py-1.5 rounded-full text-sm font-medium border"
            style={{
              borderColor: type === t.id ? accent : "#3a3a3a",
              background: type === t.id ? accent : "transparent",
              color: type === t.id ? "#fff" : "#9a9a9a",
            }}>{t.icon} {t.label}</button>
        ))}
      </div>

      {type === "festival" && (
        <select value={festival} onChange={(e) => setFestival(e.target.value)}
          className="w-full bg-neutral-800 rounded-lg p-2.5 text-sm border border-neutral-700 text-white">
          {festList.map((f) => <option key={f.name} value={f.name}>{f.name} ({f.date.slice(5)})</option>)}
        </select>
      )}

      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4}
        placeholder={"ख़ाली छोड़ दें तो AI ख़ुद लिखेगा।\n\nया अपनी बात लिखें —\n🌅 शुभ प्रभात!\nमेहनत कभी बेकार नहीं जाती। 🙏"}
        className="w-full bg-neutral-800 rounded-xl p-3 text-sm outline-none resize-none text-white border border-neutral-700 placeholder:text-neutral-600" />

      {/* ⚠️ पहले ये सब खुले पड़े रहते थे — 8 dropdown एक साथ. अब ज़रूरत पर खुलें */}
      <Fold icon="🎨" title="दिखने का तरीक़ा बदलें" sub="background, design, ऑफ़र, हैशटैग">
        <div className="space-y-3 pt-2">
          <label className="block">
            <span className="text-xs text-neutral-400">Background</span>
            <select value={bg} onChange={(e) => setBg(e.target.value)}
              className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 mt-1 text-white">
              <option value="auto">अपने-आप चुने</option>
              {BG_OPTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>

          <label className="block">
            <span className="text-xs text-neutral-400">Design</span>
            <select value={design} onChange={(e) => setDesign(e.target.value)}
              className="w-full bg-neutral-800 rounded-lg p-2 text-sm border border-neutral-700 mt-1 text-white">
              <option value="auto">हर बार नया</option>
              {designs.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}
            </select>
          </label>

          <div>
            <span className="text-xs text-neutral-400 block mb-1.5">ऑफ़र</span>
            <div className="flex flex-wrap gap-1.5">
              {OFFERS.map(([v, l]) => (
                <button key={v} onClick={() => toggle(offers, setOffers, v)}
                  className="text-xs px-2.5 py-1 rounded-full border"
                  style={{
                    borderColor: offers.includes(v) ? accent : "#333",
                    background: offers.includes(v) ? accent + "22" : "transparent",
                    color: offers.includes(v) ? accent : "#888",
                  }}>{l}</button>
              ))}
            </div>
          </div>

          <div>
            <span className="text-xs text-neutral-400 block mb-1.5">हैशटैग</span>
            <div className="flex flex-wrap gap-1.5">
              {tagOpts.map((t) => (
                <button key={t} onClick={() => toggle(tags, setTags, t)}
                  className="text-xs px-2.5 py-1 rounded-full border"
                  style={{
                    borderColor: tags.includes(t) ? "#3B82F6" : "#333",
                    background: tags.includes(t) ? "#3B82F622" : "transparent",
                    color: tags.includes(t) ? "#60A5FA" : "#888",
                  }}>{t}</button>
              ))}
            </div>
          </div>

          <label className="flex items-center gap-2 text-xs text-neutral-300">
            <input type="checkbox" checked={autoDecor} onChange={(e) => setAutoDecor(e.target.checked)} />
            कोनों में अपने-आप सजावट लगाएँ
          </label>
        </div>
      </Fold>

      <button onClick={() => { vib(40); go(); }} disabled={busy}
        style={{ background: accent }}
        className="w-full rounded-xl py-3.5 font-semibold text-white disabled:opacity-50">
        {busy ? "बना रहे हैं…" : "✨ बनाएँ"}
      </button>

      {done && (
        <p className="text-sm text-emerald-400 text-center">
          ✓ बन गई — "आज" में जाकर देख लें और हाँ कह दें
        </p>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
//  बोलिए — सही साँचा ख़ुद खुले, भरा हुआ
// ══════════════════════════════════════════════════════════════════════════
//  ⚠️ पहले हर चीज़ के लिए हाथ से पन्ना ढूँढना पड़ता था, क्योंकि आदेश समझने
//     वाले को सिर्फ़ 5 तरह पता थीं (सुविचार, विज्ञापन, त्यौहार, सूचना, गिफ़्ट)।
//     बाक़ी 9 साँचों का उसे कुछ पता ही नहीं था।
function SmartBar({ apiBase, token, brandId, accent, onOpen, onDone }) {
  const [txt, setTxt] = useState("");
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");        // क्या हो रहा है
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [listening, setListening] = useState(false);
  const [made, setMade] = useState(null);      // जो post बनी
  const recRef = useRef(null);

  const auth = { "Content-Type": "application/json", Authorization: "Bearer " + token };

  function bolo() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setErr("इस phone में बोलकर लिखना नहीं चलता — टाइप कर दीजिए"); return; }
    try {
      const r = new SR();
      r.lang = "hi-IN"; r.interimResults = false; r.maxAlternatives = 1;
      r.onresult = (e) => { setTxt(e.results[0][0].transcript); setListening(false); };
      r.onerror = () => { setListening(false); setErr("सुनाई नहीं दिया, दोबारा बोलिए"); };
      r.onend = () => setListening(false);
      recRef.current = r; setErr(""); setListening(true); vib(20); r.start();
    } catch (e) { setListening(false); setErr(e.message); }
  }

  // ⚠️ पहले यह सिर्फ़ बता देता था "यह सीधे poster बनेगा" — पर बनाता कुछ नहीं
  //    था। इसलिए लगता था कि कुछ भी बोलो, कुछ होता ही नहीं।
  //    अब यही डिब्बा दोनों काम करता है:
  //       साँचा चाहिए  → सही editor खुलेगा, भरा हुआ
  //       सीधी post    → यहीं बनकर "आज" में चली जाएगी
  async function samjho() {
    if (!txt.trim()) return;
    vib(40); setBusy(true); setErr(""); setMsg(""); setMade(null);
    setStep("समझ रहे हैं…");
    try {
      const r = await fetch(`${apiBase}/api/command/route`, {
        method: "POST", headers: auth,
        body: JSON.stringify({ command: txt.trim(), brand: brandId }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "समझ नहीं आया");

      // ── साँचा चाहिए → editor खोलो ──
      if (d.route === "editor") {
        setStep(""); setMsg(d.message || "");
        onOpen(d.template, d.draft, d.warn);
        setTxt("");
        setBusy(false);
        return;
      }

      // ── सीधी post → यहीं बना दो ──
      setStep("post बना रहे हैं… 20–40 सेकंड");
      const u = await fetch(`${apiBase}/api/command/understand`, {
        method: "POST", headers: auth,
        body: JSON.stringify({ command: txt.trim(), brand: brandId }),
      });
      const intent = await u.json().catch(() => ({}));

      const e = await fetch(`${apiBase}/api/command/execute`, {
        method: "POST", headers: auth,
        body: JSON.stringify({
          brand: intent.brand && intent.brand !== "unknown" ? intent.brand : brandId,
          type: intent.type || "vigyapan",
          vehicle: intent.vehicle || "",
          offer_details: intent.offer_details || "",
          custom_text: intent.custom_text || "",
          schedule: intent.schedule || { when: "now" },
        }),
      });
      const ed = await e.json();
      if (!e.ok) throw new Error(ed.error || "post नहीं बनी");

      setStep("");
      setMade(ed);
      setMsg("✅ post बन गई — नीचे देख लीजिए, फिर 🏠 आज में जाकर भेज दीजिए");
      setTxt("");
      vib([30, 40, 60]);
      onDone && onDone();
    } catch (e2) { setStep(""); setErr(e2.message); }
    setBusy(false);
  }

  const img = made && (made.images?.square || made.imgUrl || made.doc?.images?.square);

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 space-y-2">
      <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={2}
        placeholder={"क्या बनाना है? जो भी कहिए —\n\"आज Shine का ऑफर\" · \"तुलना वाला poster\" · \"अनाउंसमेंट बनाओ\""}
        className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white outline-none resize-none placeholder:text-neutral-600" />

      <div className="grid grid-cols-2 gap-2">
        <button type="button" onClick={bolo} disabled={busy}
          className="rounded-xl py-2.5 text-sm font-medium border disabled:opacity-40"
          style={{ borderColor: listening ? accent : "#333", color: listening ? accent : "#a3a3a3" }}>
          {listening ? "🔴 सुन रहे हैं…" : "🎙️ बोलकर बताएँ"}
        </button>
        <button type="button" onClick={samjho} disabled={busy || !txt.trim()}
          className="rounded-xl py-2.5 text-sm font-bold text-white disabled:opacity-40"
          style={{ background: accent }}>
          {busy ? "…" : "✨ बनाओ"}
        </button>
      </div>

      {step && (
        <div className="rounded-lg border px-2.5 py-2" style={{ borderColor: accent, background: accent + "18" }}>
          <p className="text-[11px]" style={{ color: accent }}>⏳ {step}</p>
        </div>
      )}
      {msg && <p className="text-[11px] text-emerald-400">{msg}</p>}
      {err && <p className="text-[11px] text-red-400">{err}</p>}

      {/* बनी हुई post की झलक — यहीं, ताकि पता चले कुछ हुआ है */}
      {img && (
        <div className="rounded-xl overflow-hidden border" style={{ borderColor: accent }}>
          <img src={img.startsWith("http") ? img : apiBase + img} alt="" className="w-full" />
          <p className="text-[10px] text-center py-1.5" style={{ color: accent }}>
            ↑ बन गई — 🏠 आज में जाकर "हाँ, भेज दो" दबाइए
          </p>
        </div>
      )}

      <div className="flex gap-1.5 overflow-x-auto pb-0.5">
        {["आज Shine 100 का ऑफर बनाओ",
          "Shine का तुलना वाला poster",
          "Activa का मेगा ऑफर",
          "माइक के लिए अनाउंसमेंट",
          "सारी गाड़ियों का poster",
          "गणेश चतुर्थी की बधाई"].map((x, i) => (
          <button key={i} type="button" onClick={() => { vib(15); setTxt(x); }}
            className="flex-shrink-0 text-[10px] px-2.5 py-1.5 rounded-full border border-neutral-700 text-neutral-500">
            {x}
          </button>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------- STUDIO
export default function Studio({ apiBase, token, brandId, accent, isAdmin, onChange }) {
  const [open, setOpen] = useState(null);   // कौन-सा साँचा खुला है
  const [draft, setDraft] = useState(null); // बोलकर बनवाया हुआ भरा-भराया draft
  const [warn, setWarn] = useState("");

  const P = { apiBase, token, brandId, onSent: onChange, draft, warn };

  // बोलकर कहने पर सही साँचा खोलो, भरा हुआ
  function openWithDraft(tpl, d, w) {
    vib(30); setDraft(d || null); setWarn(w || ""); setOpen(tpl);
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (_) {}
  }

  const RENDER = {
    quick:     <QuickPost brandId={brandId} accent={accent} onDone={onChange} />,
    promo:     <PromoEditor {...P} />,
    delivery:  <DeliveryEditor {...P} />,
    aideliv:   <AIDelivery {...P} />,
    mega:      <MegaOfferEditor {...P} />,
    booking:   <BookingEditor {...P} />,
    luckydraw: <LuckyDrawEditor {...P} />,
    compare:   <CompareEditor {...P} />,
    multibike: <MultibikeEditor {...P} />,
    hiring:    <HiringEditor {...P} />,
    video:     <AIVideo {...P} />,
    voice:     <AIVoice {...P} />,
    announce:  <Announcer {...P} />,
    automkt:   <AutoMarketing {...P} />,
    engine:    <AutoEngine {...P} />,
    platform:  <AIStudio {...P} />,
    news:      <AINews {...P} />,
  };

  // ── कोई साँचा खुला हो → वही पूरा पर्दा ──────────────────────
  if (open) {
    const t = TEMPLATES.find((x) => x.id === open);
    return (
      <div className="space-y-3">
        <button onClick={() => { vib(); setOpen(null); setDraft(null); setWarn(""); }}
          className="flex items-center gap-2 text-sm text-neutral-400 py-1">
          <span className="text-lg leading-none">‹</span> सब साँचे
        </button>

        {/* बोलकर बनवाया तो क्या-क्या भरा गया, और क्या बाक़ी है */}
        {draft && (
          <div className="rounded-xl border px-3 py-2" style={{ borderColor: accent + "55", background: accent + "12" }}>
            <p className="text-[11px]" style={{ color: accent }}>
              ✨ आपके कहे मुताबिक़ भर दिया — देख लीजिए, फिर भेज दीजिए
            </p>
            {warn && <p className="text-[11px] text-amber-400 mt-1">⚠️ {warn}</p>}
          </div>
        )}
        <div className="flex items-center gap-2.5 pb-1">
          <span className="text-2xl">{t.icon}</span>
          <div>
            <h2 className="text-base font-semibold text-neutral-100">{t.name}</h2>
            <p className="text-[11px] text-neutral-500">{t.desc}</p>
          </div>
        </div>
        {RENDER[open]}
      </div>
    );
  }

  // ── साँचों की सूची ─────────────────────────────────────────
  return (
    <div className="space-y-5">

      {/* ⚠️ पहले यहाँ दो command डिब्बे थे — मेरा नया और पुराना पीला वाला।
          आप पुराने में लिखते थे, जो सिर्फ़ post बनाता है, इसलिए "कुछ भी
          बोलो, post ही बनती है" वाली शिकायत सही थी।
          अब एक ही डिब्बा — वही सब कुछ करता है। */}
      <div>
        <Title>यहीं से सब कुछ</Title>
        <SmartBar apiBase={apiBase} token={token} brandId={brandId} accent={accent}
          onOpen={openWithDraft} onDone={onChange} />
        <p className="text-[11px] text-neutral-600 mt-2 leading-relaxed">
          जो भी कहिए — सुविचार, त्यौहार, विज्ञापन सीधे post बन जाएँगे।
          तुलना, Mega Offer, बुकिंग, Lucky Draw, कई गाड़ियाँ, भर्ती, Delivery,
          अनाउंसमेंट, Video — इनका पन्ना भरा हुआ खुल जाएगा।
        </p>
      </div>

      {/* पुराना command डिब्बा — समय पर भेजने (schedule) के लिए, नीचे छिपा हुआ */}
      <Fold icon="⏰" title="समय तय करके भेजना है?" sub="जैसे — कल सुबह 9 बजे सुविचार भेजो">
        <div className="pt-2">
          <AICommandCenter apiBase={apiBase} token={token} brandId={brandId} onSent={onChange} />
        </div>
      </Fold>

      {GROUPS.map((g) => {
        const items = TEMPLATES.filter((t) => t.group === g);
        if (!items.length) return null;
        return (
          <div key={g}>
            <Title>{g}</Title>
            <div className="grid grid-cols-2 gap-2">
              {items.map((t) => (
                <button key={t.id} onClick={() => { vib(); setOpen(t.id); }}
                  className="text-left rounded-2xl bg-neutral-900 border border-neutral-800 p-3.5 active:border-neutral-600">
                  <div className="text-2xl mb-1.5">{t.icon}</div>
                  <div className="text-sm font-medium text-neutral-100 leading-tight">{t.name}</div>
                  <div className="text-[10px] text-neutral-500 mt-1 leading-snug">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        );
      })}

      <p className="text-[11px] text-neutral-600 text-center pt-2">
        बनाई हुई हर post पहले "आज" में आएगी — आपकी हाँ के बिना कहीं नहीं जाती।
      </p>
    </div>
  );
}
