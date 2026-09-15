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
import CommandCenter from "./CommandCenter.jsx";
import ThreeChoice from "./ThreeChoice.jsx";

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
// हर काम का एक कार्ड — क्या चाहिए और AI कर सकता है या नहीं, दोनों दिखे
function CapCard({ t, onOpen }) {
  return (
    <button type="button" onClick={() => { vib(); onOpen(); }}
      className="text-left rounded-2xl bg-neutral-900 border border-neutral-800 p-3.5 active:border-neutral-600">
      <div className="flex items-start justify-between">
        <span className="text-2xl">{t.icon}</span>
        <span className="text-[9px] px-1.5 py-0.5 rounded-full"
          style={t.ai
            ? { background: "#10B98122", color: "#34D399" }
            : { background: "#3B82F622", color: "#60A5FA" }}>
          {t.ai ? "AI" : "हाथ से"}
        </span>
      </div>
      <div className="text-sm font-medium text-neutral-100 leading-tight mt-1.5">{t.label}</div>
      <div className="text-[10px] text-neutral-500 mt-1 leading-snug">{t.desc}</div>
      {t.needs?.length > 0 && (
        <div className="text-[9px] text-amber-500/80 mt-1.5">चाहिए: {t.needs.join(", ")}</div>
      )}
    </button>
  );
}

// ============================================================================
//  CreatePanel — एक ही जगह से सब कुछ
//  ---------------------------------------------------------------------------
//  ⚠️ पहले यहाँ तीन अलग-अलग बड़े डिब्बे थे — "एक बात कहिए" (CommandCenter),
//     "तीन में चुनें" (ThreeChoice), और "एक चीज़ बनानी है" (SmartBar +
//     साँचों की पूरी सूची नीचे अलग से)। पन्ना बहुत लंबा हो गया था, और तीन
//     जगह टाइप करना पड़ता — हर एक का अपना डिब्बा, अपना बटन।
//
//     अब एक ही जगह: क्या बनाना है (dropdown — सारे 20 साँचे + "AI ख़ुद तय
//     करे"), कैसे बनाना है (dropdown — सब बनाओ / तीन में चुनें / सिर्फ़ एक
//     — सिर्फ़ तभी दिखे जब ऊपर वाला auto-type हो या "AI ख़ुद तय करे" हो),
//     एक टेक्स्ट-बॉक्स, एक मिक, एक "बनाओ" बटन।
//
//     भर्ती/बुकिंग/मेगा-ऑफर/तुलना जैसे साँचे चुनने पर मोड dropdown अपने आप
//     छिप जाता है — वहाँ "सब बनाओ" जैसी कोई बात नहीं, सीधे वो पन्ना
//     भरा-भराया खुल जाता है।
// ============================================================================
// हर साँचे के लिए तैयार content-सुझाव — कुछ static, कुछ असली data से (गाड़ी/त्यौहार)
const STATIC_SUG = {
  suvichar: ["आज का प्रेरणादायक सुविचार", "मेहनत पर सुविचार", "सफलता पर सुविचार", "गुड मॉर्निंग शुभप्रभात पोस्ट", "ज़िंदगी पर सुविचार", "सकारात्मक सोच पर सुविचार", "भगवान पर भरोसे का सुविचार", "आने वाले त्यौहार पर सुविचार"],
  suchna: [],   // ⚠️ अब नीचे SUCHNA_FORMS से बनती हैं — पूरी जानकारी के साथ
  gift: ["हेलमेट फ्री गिफ्ट के साथ", "टेस्ट राइड पर गिफ्ट", "फेस्टिव गिफ्ट ऑफर"],
  hiring: ["मैकेनिक की भर्ती है", "सेल्स एक्ज़ीक्यूटिव चाहिए", "स्टाफ चाहिए, अभी अप्लाई करें", "अनुभवी टेक्नीशियन चाहिए"],
  booking: ["नई गाड़ी की एडवांस बुकिंग शुरू", "बुकिंग पर स्पेशल फ़ायदे", "प्री-बुकिंग खुल गई है"],
  luckydraw: ["लकी ड्रॉ स्कीम शुरू", "आज ख़रीदें, कल जीतें", "कूपन स्कीम शुरू हुई"],
  announce: ["आज का स्पेशल ऑफर अनाउंसमेंट", "नई गाड़ी लॉन्च अनाउंसमेंट", "माइक के लिए अनाउंसमेंट"],
  video: ["डिलीवरी की रील बनाओ", "नई गाड़ी की रील", "फ़ोटो से वीडियो बनाओ"],
};

// ⚠️ सूचना के साँचे — पहले सिर्फ़ आधे-अधूरे वाक्य थे ("समय बदल गया है" —
//    पर कितने बजे से? "सर्विस कैंप" — पर कहाँ?)। अब हर साँचे के अपने
//    ख़ाने हैं, भरते ही पूरी, साफ़ सूचना बन जाती है।
const SUCHNA_FORMS = [
  { id: "samay", label: "🕒 समय बदल गया",
    fields: [{ k: "from", ph: "सुबह 9:30" }, { k: "to", ph: "शाम 7:30" }, { k: "date", ph: "20 सितंबर से (वैकल्पिक)" }],
    make: (f) => `आवश्यक सूचना: ${f.date ? f.date + " से " : ""}शोरूम का समय बदल गया है। अब ${f.from || "सुबह"} से ${f.to || "शाम"} तक खुला रहेगा। आपकी सेवा में हमेशा तत्पर।` },
  { id: "camp", label: "🔧 फ्री सर्विस कैंप",
    fields: [{ k: "place", ph: "गाँव/जगह का नाम" }, { k: "date", ph: "तारीख़ — 22 सितंबर" }, { k: "time", ph: "सुबह 10 से शाम 5" }],
    make: (f) => `आवश्यक सूचना: फ्री सर्विस कैंप — ${f.place || "आपके क्षेत्र"} में${f.date ? ", " + f.date + " को" : ""}${f.time ? ", " + f.time + " तक" : ""}। अपनी गाड़ी की फ्री जाँच करवाइए। सभी ग्राहक सादर आमंत्रित हैं।` },
  { id: "sthan", label: "📍 शोरूम का स्थान बदला",
    fields: [{ k: "old", ph: "पुराना पता" }, { k: "newp", ph: "नया पता" }, { k: "date", ph: "कब से — 1 अक्टूबर" }],
    make: (f) => `आवश्यक सूचना: हमारा शोरूम ${f.old ? f.old + " से " : ""}${f.newp || "नए पते"} पर स्थानांतरित हो गया है${f.date ? ", " + f.date + " से" : ""}। नए पते पर आपका हार्दिक स्वागत है।` },
  { id: "chutti", label: "🏠 छुट्टी की सूचना",
    fields: [{ k: "date", ph: "तारीख़ — 25 सितंबर" }, { k: "reason", ph: "कारण (वैकल्पिक)" }, { k: "open", ph: "दोबारा कब खुलेगा" }],
    make: (f) => `आवश्यक सूचना: ${f.date || "कल"} को शोरूम बंद रहेगा${f.reason ? " (" + f.reason + ")" : ""}। ${f.open ? f.open + " से सामान्य रूप से खुलेगा।" : ""} असुविधा के लिए खेद है।` },
  { id: "stock", label: "🏍️ नया स्टॉक आया",
    fields: [{ k: "what", ph: "कौन-सी गाड़ी/मॉडल" }, { k: "when", ph: "कब से उपलब्ध" }],
    make: (f) => `आवश्यक सूचना: ${f.what || "नया स्टॉक"} अब शोरूम में उपलब्ध है${f.when ? ", " + f.when + " से" : ""}। आइए, देखिए और टेस्ट राइड लीजिए।` },
  { id: "staff", label: "👨‍🔧 नया स्टाफ आया",
    fields: [{ k: "who", ph: "पद — जैसे अनुभवी मैकेनिक" }, { k: "when", ph: "कब से" }],
    make: (f) => `आवश्यक सूचना: हमारे शोरूम में ${f.who || "नया स्टाफ"} आ गया है${f.when ? ", " + f.when + " से" : ""}। अब आपको और बेहतर सेवा मिलेगी।` },
  { id: "khud", label: "✏️ ख़ुद लिखें",
    fields: [{ k: "text", ph: "अपनी पूरी सूचना यहाँ लिखिए", big: true }],
    make: (f) => (f.text ? `आवश्यक सूचना: ${f.text}` : "") },
];

function CreatePanel({ apiBase, token, brandId, accent, onOpen, onDone }) {
  const [suchnaForm, setSuchnaForm] = useState("");   // कौन-सा सूचना-साँचा चुना
  const [suchnaVals, setSuchnaVals] = useState({});   // उसके ख़ानों में भरी जानकारी

  const [capId, setCapId] = useState("");     // "" = AI ख़ुद तय करे
  const [adFestival, setAdFestival] = useState("");   // विज्ञापन के साथ जोड़ने वाला त्यौहार
  const [festList, setFestList] = useState([]);       // असली त्यौहारों की सूची
  const [tryAIBg, setTryAIBg] = useState(false);  // त्यौहार के लिए "AI पृष्ठभूमि (प्रयोगात्मक)"
  const [mode, setMode] = useState("all");     // "all" | "three" | "single"
  const [txt, setTxt] = useState("");
  const [listening, setListening] = useState(false);
  const [trigger, setTrigger] = useState(0);
  const [busy, setBusy] = useState(false);
  const [step, setStep] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [made, setMade] = useState(null);
  const [sugg, setSugg] = useState([]);        // इसी साँचे के लिए तैयार content-बटन

  const auth = { "Content-Type": "application/json", Authorization: "Bearer " + token };
  const cap = capId ? capById(capId) : null;
  // "AI ख़ुद तय करे" चुना हो, या ऐसा साँचा चुना हो जो AI ख़ुद बना सकता है —
  // तभी "कैसे बनाना है" (मोड) dropdown दिखे। भर्ती/बुकिंग/मेगा जैसे हाथ
  // वाले साँचों में सीधे उनका अपना पन्ना खुल जाता है, कोई मोड नहीं चुनना।
  const showModeDropdown = !cap || cap.ai;

  // ⚠️ सिर्फ़ dropdown दिखाना काफ़ी नहीं था — "सुविचार" चुनने के बाद भी
  //    टेक्स्ट-बॉक्स ख़ाली ही रहता, कुछ लिखे बिना "बनाओ" दबता ही नहीं।
  //    अब जो भी साँचा चुनें, उसी से जुड़े असली, तैयार content-बटन नीचे आ
  //    जाते हैं — विज्ञापन के लिए असली गाड़ियों के नाम (database से),
  //    त्यौहार के लिए असली आने वाले त्यौहार — दबाते ही टेक्स्ट-बॉक्स भर
  //    जाता है, बस "बनाओ" दबाना बाक़ी रहता है।
  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!capId) { setSugg([]); return; }

      if (STATIC_SUG[capId]) { setSugg(STATIC_SUG[capId]); return; }

      // विज्ञापन/मेगा/बुकिंग/तुलना/कई-गाड़ियाँ — असली गाड़ियों के नाम चाहिए
      if (["vigyapan", "mega", "booking", "compare", "multibike"].includes(capId)) {
        // ⚠️ नया — विज्ञापन के साथ त्यौहार जोड़ने के लिए असली त्यौहारों की
        //    सूची भी ले आते हैं (नीचे अलग dropdown में दिखेगी)
        if (capId === "vigyapan") {
          try {
            const fr = await fetch(`${apiBase.replace(/\/+$/, "")}/api/festivals`);
            const fd = await fr.json();
            if (!cancelled) {
              const today = new Date().toISOString().slice(0, 10);
              const up = (fd.festivals || []).filter((f) => f.date >= today);
              const names = (up.length ? up : (fd.festivals || [])).slice(0, 12).map((f) => f.name);
              //  ⚠️ गणेश चतुर्थी अभी चल रही है — अगर तारीख़ निकल भी चुकी हो
              //     तो भी सूची में सबसे ऊपर रहे। साथ ही कुछ आम स्पेशल दिन
              //     भी जोड़े, ताकि सूची कभी ख़ाली न लगे।
              const extra = ["गणेश चतुर्थी", "नवरात्रि", "दशहरा", "दिवाली", "नया साल", "स्वतंत्रता दिवस"];
              setFestList([...new Set([...extra.filter((e) => !names.includes(e)), ...names])]);
            }
          } catch (_) { setFestList([]); }
        } else setFestList([]);
        try {
          const r = await fetch(`${apiBase.replace(/\/+$/, "")}/api/vehicles?brand=${brandId}&inStock=1`, {
            headers: { Authorization: "Bearer " + token },
          });
          const list = await r.json();
          if (cancelled) return;
          const names = (Array.isArray(list) ? list : []).map((v) => [v.name, v.variant].filter(Boolean).join(" "));
          if (capId === "compare" && names.length >= 2) {
            setSugg([`${names[0]} vs ${names[1]} तुलना`, ...names.slice(2, 5).map((n) => `${names[0]} vs ${n} तुलना`)]);
          } else if (capId === "multibike") {
            setSugg(["सारी गाड़ियों का poster", `${names.slice(0, 3).join(", ")} — तीनों का ऑफर`]);
          } else {
            // ⚠️ पहले सिर्फ़ 6 गाड़ियों तक सीमित था — "सभी के" कहा गया था,
            //    तो अब जितनी भी stock में हों, सबका सुझाव-बटन बनेगा
            setSugg(names.map((n) => `${n} का ऑफर बनाओ`));
          }
        } catch (_) { setSugg([]); }
        return;
      }

      // त्यौहार — असली आने वाले त्यौहार चाहिए
      if (capId === "festival") {
        try {
          const r = await fetch(`${apiBase.replace(/\/+$/, "")}/api/festivals`);
          const d = await r.json();
          if (cancelled) return;
          const today = new Date().toISOString().slice(0, 10);
          const upcoming = (d.festivals || []).filter((f) => f.date >= today).slice(0, 5);
          setSugg((upcoming.length ? upcoming : (d.festivals || []).slice(0, 5)).map((f) => `${f.name} की बधाई`));
        } catch (_) { setSugg([]); }
        return;
      }

      setSugg([]);
    }
    load();
    return () => { cancelled = true; };
  }, [capId, brandId]);


  function bolo() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { setErr("इस phone में बोलकर लिखना नहीं चलता — टाइप कर दीजिए"); return; }
    try {
      const r = new SR();
      r.lang = "hi-IN"; r.interimResults = false;
      r.onresult = (e) => { setTxt(e.results[0][0].transcript); setListening(false); };
      r.onerror = () => { setListening(false); setErr("सुनाई नहीं दिया, दोबारा बोलिए"); };
      r.onend = () => setListening(false);
      setErr(""); setListening(true); vib(20); r.start();
    } catch (e) { setListening(false); setErr(e.message); }
  }

  // "सिर्फ़ एक post" — पुराने SmartBar जैसा तरीक़ा, बस अब dropdown से चुना
  // हुआ प्रकार पक्का भेजा जाता है (AI का अंदाज़ा नहीं)
  async function runSinglePost(forcedAutoType) {
    setStep("post बना रहे हैं… 20–40 सेकंड");
    try {
      const u = await fetch(`${apiBase.replace(/\/+$/, "")}/api/command/understand`, {
        method: "POST", headers: auth,
        body: JSON.stringify({ command: txt.trim(), brand: brandId }),
      });
      const intent = await u.json().catch(() => ({}));

      const e = await fetch(`${apiBase.replace(/\/+$/, "")}/api/command/execute`, {
        method: "POST", headers: auth,
        body: JSON.stringify({
          brand: intent.brand && intent.brand !== "unknown" ? intent.brand : brandId,
          type: forcedAutoType || intent.type || "vigyapan",
          vehicle: intent.vehicle || "",
          offer_details: intent.offer_details || "",
          custom_text: intent.custom_text || "",
          schedule: intent.schedule || { when: "now" },
          festival: (adFestival && adFestival.trim()) ? adFestival.trim() : undefined,   // विज्ञापन के साथ जोड़ा हुआ त्यौहार/इवेंट
        }),
      });
      const ed = await e.json();
      if (!e.ok) throw new Error(ed.error || "post नहीं बनी");

      setStep(""); setMade(ed);
      setMsg("✅ post बन गई — नीचे देख लीजिए, फिर 🏠 आज में जाकर भेज दीजिए");
      setTxt(""); vib([30, 40, 60]);
      onDone && onDone();
    } catch (e2) { setStep(""); setErr(e2.message); }
    setBusy(false);
  }

  async function banaoPress() {
    if (!txt.trim()) return;
    vib(40); setBusy(true); setErr(""); setMsg(""); setMade(null); setStep("");

    // ── साँचा ख़ुद चुना हो ────────────────────────────────────
    if (cap) {
      if (!cap.ai) {
        // हाथ वाला साँचा (भर्ती/बुकिंग/मेगा/तुलना/...) — सीधे वो पन्ना
        // भरा-भराया खोलो, "मोड" की कोई बात नहीं
        setStep(`${cap.label} खोल रहे हैं…`);
        let draft = null, warn = "";
        try {
          const rr = await fetch(`${apiBase.replace(/\/+$/, "")}/api/command/route`, {
            method: "POST", headers: auth,
            body: JSON.stringify({ command: txt.trim(), brand: brandId }),
          });
          const dd = await rr.json();
          if (rr.ok && dd.route === "editor") { draft = dd.draft; warn = dd.warn || ""; }
        } catch (_) { /* भरा हुआ न मिले तो भी पन्ना खुल जाए */ }
        setStep("");
        onOpen(cap.id, draft, warn);
        setTxt(""); setBusy(false);
        return;
      }
      // AI वाला साँचा ख़ुद चुना — मोड के हिसाब से चलाओ, प्रकार पक्का
      if (mode === "single") { await runSinglePost(cap.autoType); return; }
      setTrigger((t) => t + 1);
      setBusy(false);
      return;
    }

    // ── "AI ख़ुद तय करे" ──────────────────────────────────────
    const local = matchCap(txt);
    if (local && !local.ai) {
      setStep(`${local.label} खोल रहे हैं…`);
      let draft = null, warn = "";
      try {
        const rr = await fetch(`${apiBase.replace(/\/+$/, "")}/api/command/route`, {
          method: "POST", headers: auth,
          body: JSON.stringify({ command: txt.trim(), brand: brandId }),
        });
        const dd = await rr.json();
        if (rr.ok && dd.route === "editor") { draft = dd.draft; warn = dd.warn || ""; }
      } catch (_) {}
      setStep("");
      onOpen(local.id, draft, warn);
      setTxt(""); setBusy(false);
      return;
    }
    if (mode === "single") { await runSinglePost(null); return; }
    setTrigger((t) => t + 1);
    setBusy(false);
  }

  const img = made && (made.images?.square || made.imgUrl || made.doc?.images?.square);
  const NAMUNE = ["आज Shine 100 का ऑफर बनाओ", "गणेश चतुर्थी की बधाई",
    "Activa का मेगा ऑफर", "माइक के लिए अनाउंसमेंट", "सारी गाड़ियों का poster"];

  return (
    <div className="space-y-3">
      <div className="rounded-2xl bg-neutral-900 border-2 p-3 space-y-2.5" style={{ borderColor: accent + "66" }}>

        {/* क्या बनाना है — सारे साँचे एक जगह */}
        <div>
          <label className="text-[11px] text-neutral-500 block mb-1">क्या बनाना है?</label>
          <select value={capId} onChange={(e) => { setCapId(e.target.value); setTxt(""); vib(15); }}
            className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white outline-none">
            <option value="">✨ AI ख़ुद तय करे</option>
            {GROUPS.map((g) => (
              <optgroup key={g.id} label={`${g.icon} ${g.label}`}>
                {capsByGroup(g.id).map((c) => (
                  <option key={c.id} value={c.id}>{c.icon} {c.label}</option>
                ))}
              </optgroup>
            ))}
          </select>
        </div>

        {/* कैसे बनाना है — सिर्फ़ auto-type / "AI ख़ुद तय करे" पर दिखे */}
        {showModeDropdown && (
          <div>
            <label className="text-[11px] text-neutral-500 block mb-1">कैसे बनाना है?</label>
            <select value={mode} onChange={(e) => { setMode(e.target.value); vib(15); }}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white outline-none">
              <option value="all">✨ सब बनाओ (poster + caption + सब कुछ)</option>
              <option value="three">🎲 तीन में से चुनें</option>
              <option value="single">🎯 सिर्फ़ एक post</option>
            </select>
          </div>
        )}

        {/* ⚠️ नया — त्यौहार के लिए "AI पृष्ठभूमि"। ज़्यादा भरोसेमंद तरीक़ा
            ⚙️ सेटिंग → "गाने और त्यौहार की तस्वीरें" में असली तस्वीर ख़ुद
            चढ़ाना है — यह सिर्फ़ आज़माने के लिए, जाँचकर भेजें। */}
        {capId === "festival" && (
          <label className="flex items-center gap-2 text-[11px] text-neutral-400 px-0.5">
            <input type="checkbox" checked={tryAIBg} onChange={(e) => { setTryAIBg(e.target.checked); vib(15); }}
              className="w-3.5 h-3.5" />
            🧪 AI पृष्ठभूमि आज़माएँ (प्रयोगात्मक — भेजने से पहले ख़ुद देख लीजिए)
          </label>
        )}

        <textarea value={txt} onChange={(e) => setTxt(e.target.value)} rows={2}
          placeholder={'लिखिए या बोलिए —\n"आज Shine 100 DX पर ₹5,000 की छूट"'}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white outline-none resize-none placeholder:text-neutral-600" />

        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={bolo} disabled={busy}
            className="rounded-xl py-2.5 text-sm font-medium border disabled:opacity-40"
            style={{ borderColor: listening ? accent : "#333", color: listening ? accent : "#a3a3a3" }}>
            {listening ? "🔴 सुन रहे हैं…" : "🎙️ बोलकर बताएँ"}
          </button>
          <button type="button" onClick={banaoPress} disabled={busy || !txt.trim()}
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

        {img && (
          <div className="rounded-xl overflow-hidden border" style={{ borderColor: accent }}>
            <img src={img.startsWith("http") ? img : apiBase.replace(/\/+$/, "") + img} alt="" className="w-full" />
            <p className="text-[10px] text-center py-1.5" style={{ color: accent }}>
              ↑ बन गई — 🏠 आज में जाकर "हाँ, भेज दो" दबाइए
            </p>
          </div>
        )}

        {/* ⚠️ नया — विज्ञापन के साथ त्यौहार भी जोड़िए। चुनने पर poster के
            सबसे ऊपर उस त्यौहार की आकर्षक पंक्ति आ जाएगी, और बाक़ी पूरा
            विज्ञापन (गाड़ी, दाम, features) वैसा ही रहेगा — दोनों एक साथ। */}
        {capId === "vigyapan" && festList.length > 0 && (
          <div>
            <label className="text-[11px] text-neutral-500 block mb-1">त्यौहार / स्पेशल दिन भी जोड़ें? (वैकल्पिक)</label>
            <select value={festList.includes(adFestival) || !adFestival ? adFestival : "__custom__"}
              onChange={(e) => { setAdFestival(e.target.value === "__custom__" ? " " : e.target.value); vib(15); }}
              className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white outline-none">
              <option value="">— कोई नहीं (सादा विज्ञापन) —</option>
              {festList.map((f) => <option key={f} value={f}>🎉 {f}</option>)}
              <option value="__custom__">✏️ ख़ुद लिखें (कोई इवेंट/ऑफ़र)</option>
            </select>
            {/* ⚠️ नया — अपनी मर्ज़ी से कोई छोटा इवेंट/ऑफ़र भी लिख सकें */}
            {adFestival && !festList.includes(adFestival) && (
              <input value={adFestival.trim() === "" ? "" : adFestival}
                onChange={(e) => setAdFestival(e.target.value || " ")}
                placeholder="जैसे — दुकान की सालगिरह, संडे स्पेशल"
                className="w-full mt-1.5 bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white outline-none placeholder:text-neutral-600" />
            )}
          </div>
        )}

        {/* ⚠️ नया — सूचना का पूरा फ़ॉर्म। पहले सिर्फ़ आधे-अधूरे वाक्य थे
            ("समय बदल गया है" — पर कितने बजे से?)। अब साँचा चुनिए, ख़ाने
            भरिए — पूरी, साफ़ सूचना अपने-आप बन जाएगी। */}
        {capId === "suchna" && (
          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-neutral-500 block mb-1">कौन-सी सूचना देनी है?</label>
              <select value={suchnaForm}
                onChange={(e) => { setSuchnaForm(e.target.value); setSuchnaVals({}); setTxt(""); vib(15); }}
                className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white outline-none">
                <option value="">— चुनिए —</option>
                {SUCHNA_FORMS.map((f) => <option key={f.id} value={f.id}>{f.label}</option>)}
              </select>
            </div>
            {(() => {
              const form = SUCHNA_FORMS.find((f) => f.id === suchnaForm);
              if (!form) return null;
              const upd = (k, v) => {
                const nv = { ...suchnaVals, [k]: v };
                setSuchnaVals(nv);
                setTxt(form.make(nv));   // भरते ही ऊपर का टेक्स्ट-बॉक्स अपने-आप बनता जाए
              };
              return (
                <div className="space-y-1.5">
                  {form.fields.map((fl) => fl.big ? (
                    <textarea key={fl.k} rows={3} value={suchnaVals[fl.k] || ""} onChange={(e) => upd(fl.k, e.target.value)}
                      placeholder={fl.ph}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white outline-none resize-none placeholder:text-neutral-600" />
                  ) : (
                    <input key={fl.k} value={suchnaVals[fl.k] || ""} onChange={(e) => upd(fl.k, e.target.value)}
                      placeholder={fl.ph}
                      className="w-full bg-neutral-800 border border-neutral-700 rounded-xl p-2.5 text-sm text-white outline-none placeholder:text-neutral-600" />
                  ))}
                  <p className="text-[10px] text-neutral-600">भरते ही नीचे पूरी सूचना बन जाएगी — ज़रूरत हो तो वहीं बदल भी सकते हैं</p>
                </div>
              );
            })()}
          </div>
        )}

        {/* ⚠️ यही असली माँग थी — साँचा चुनते ही उसी से जुड़े तैयार content
            के बटन यहाँ आ जाएँ, दबाते ही टेक्स्ट-बॉक्स भर जाए। */}
        {capId && sugg.length > 0 && (
          <div>
            <p className="text-[10px] text-neutral-500 mb-1">👇 इनमें से चुनिए, या ख़ुद लिखिए</p>
            <div className="flex flex-wrap gap-1.5">
              {sugg.map((x, i) => (
                <button key={i} type="button" onClick={() => { vib(15); setTxt(x); }}
                  className="text-[10px] px-2.5 py-1.5 rounded-full border text-left"
                  style={{ borderColor: accent + "55", color: accent }}>
                  {x}
                </button>
              ))}
            </div>
          </div>
        )}
        {capId && sugg.length === 0 && ["vigyapan", "mega", "booking", "compare", "multibike"].includes(capId) && (
          <p className="text-[10px] text-amber-500">
            ⚠️ कोई गाड़ी नहीं मिली — पहले सेटिंग → गाड़ियाँ में जोड़िए, या ख़ुद टाइप कीजिए
          </p>
        )}

        {!capId && (
          <div className="flex gap-1.5 overflow-x-auto pb-0.5">
            {NAMUNE.map((x, i) => (
              <button key={i} type="button" onClick={() => { vib(15); setTxt(x); }}
                className="flex-shrink-0 text-[10px] px-2.5 py-1.5 rounded-full border border-neutral-700 text-neutral-500">
                {x}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* नीचे — मोड के हिसाब से असली इंजन, बस अपना इनपुट-बॉक्स छिपाए हुए */}
      {showModeDropdown && mode === "all" && (
        <CommandCenter apiBase={apiBase} token={token} brandId={brandId} accent={accent}
          onDone={onDone} hideOwnInput sharedText={txt} forcedType={cap?.autoType} autoTrigger={trigger}
          tryAIBg={capId === "festival" && tryAIBg} />
      )}
      {showModeDropdown && mode === "three" && (
        <ThreeChoice apiBase={apiBase} token={token} brandId={brandId} accent={accent}
          onDone={onDone} hideOwnInput sharedText={txt} forcedType={cap?.autoType} autoTrigger={trigger} />
      )}
    </div>
  );
}

export default function Studio({ apiBase, token, brandId, accent, isAdmin, onChange }) {
  const [open, setOpen] = useState(null);   // कौन-सा साँचा खुला है
  const [draft, setDraft] = useState(null); // बोलकर बनवाया हुआ भरा-भराया draft
  const [warn, setWarn] = useState("");
  const [q, setQ] = useState("");           // खोज-पट्टी
  const found = q ? searchCaps(q) : CAPS;

  const P = { apiBase, token, brandId, onSent: onChange, draft, warn };

  // बोलकर कहने पर सही साँचा खोलो, भरा हुआ
  function openWithDraft(tpl, d, w) {
    vib(30); setDraft(d || null); setWarn(w || ""); setOpen(tpl);
    try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch (_) {}
  }

  //  ⚠️ नाम registry वाले ही रखें — पहले यहाँ "quick"/"promo" थे और सूची में
  //     "suvichar"/"vigyapan"। दबाने पर ख़ाली पन्ना आता था।
  const RENDER = {
    suvichar:  <QuickPost brandId={brandId} accent={accent} onDone={onChange} />,
    vigyapan:  <PromoEditor {...P} />,
    // ये तीनों AI ख़ुद बनाता है — पर हाथ से भी बनाना हो तो सुविचार वाला पन्ना
    festival:  <QuickPost brandId={brandId} accent={accent} onDone={onChange} />,
    suchna:    <QuickPost brandId={brandId} accent={accent} onDone={onChange} />,
    gift:      <QuickPost brandId={brandId} accent={accent} onDone={onChange} />,
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
    const t = capById(open) || { icon: "✨", label: open, desc: "" };
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

      {/* ⚠️ पहले यहाँ तीन अलग-अलग बड़े डिब्बे थे — "एक बात कहिए" (सब
          बनाओ), "तीन में चुनें", और "एक चीज़ बनानी है" (साँचों की पूरी
          सूची नीचे अलग से भी दिखती थी)। पन्ना बहुत लंबा हो गया था — हर
          डिब्बे में अलग टाइप करना, अलग बटन।
          अब एक ही जगह — dropdown से चुनिए क्या बनाना है और कैसे बनाना
          है, फिर एक ही "बनाओ" बटन। */}
      <div>
        <Title>क्या बनाना है? बोलकर बताइए</Title>
        <CreatePanel apiBase={apiBase} token={token} brandId={brandId} accent={accent}
          onOpen={openWithDraft} onDone={onChange} />
      </div>

      {/* पुराना command डिब्बा — समय पर भेजने (schedule) के लिए, नीचे छिपा हुआ */}
      <Fold icon="⏰" title="समय तय करके भेजना है?" sub="जैसे — कल सुबह 9 बजे सुविचार भेजो">
        <div className="pt-2">
          <AICommandCenter apiBase={apiBase} token={token} brandId={brandId} onSent={onChange} />
        </div>
      </Fold>

      {/* ── खोज-पट्टी — Google जैसी। सब कुछ यहीं से मिलेगा ── */}
      <div>
        <input value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="🔍 क्या करना है? — तुलना, वीडियो, अनाउंसमेंट, भर्ती…"
          className="w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3.5 py-3 text-sm text-white outline-none focus:border-neutral-500 placeholder:text-neutral-600" />
        {q && (
          <p className="text-[11px] text-neutral-600 mt-1.5">
            {found.length ? `${found.length} काम मिले` : "कुछ नहीं मिला — दूसरे शब्द से खोजिए"}
          </p>
        )}
      </div>

      {/* ── खोजा हुआ, या सब समूहों में ── */}
      {q ? (
        <div className="grid grid-cols-2 gap-2">
          {found.map((t) => <CapCard key={t.id} t={t} onOpen={() => setOpen(t.id)} />)}
        </div>
      ) : (
        GROUPS.map((g) => {
          const items = capsByGroup(g.id);
          if (!items.length) return null;
          return (
            <div key={g.id}>
              <Title>{g.icon} {g.label}</Title>
              <div className="grid grid-cols-2 gap-2">
                {items.map((t) => <CapCard key={t.id} t={t} onOpen={() => setOpen(t.id)} />)}
              </div>
            </div>
          );
        })
      )}

      <p className="text-[11px] text-neutral-600 text-center pt-2">
        बनाई हुई हर post पहले "आज" में आएगी — आपकी हाँ के बिना कहीं नहीं जाती।
      </p>
    </div>
  );
}
