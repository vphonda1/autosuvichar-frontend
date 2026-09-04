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

import React, { useEffect, useState } from "react";
import { api, vib, Title, Err, Fold } from "./shared.jsx";
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

// ── कौन-सा साँचा किस काम का ───────────────────────────────────────────────
const TEMPLATES = [
  // रोज़ का काम
  { id: "quick",     group: "रोज़",   icon: "✨", name: "रोज़ की post",   desc: "सुविचार, शुभप्रभात, त्यौहार की बधाई" },
  { id: "promo",     group: "रोज़",   icon: "🏍️", name: "गाड़ी का विज्ञापन", desc: "क़ीमत, डाउन पेमेंट, फ़ीचर वाला poster" },
  { id: "delivery",  group: "रोज़",   icon: "🎥", name: "Delivery post",  desc: "ग्राहक की photo से बधाई वाली post" },
  { id: "aideliv",   group: "रोज़",   icon: "📸", name: "कई photo → post", desc: "बहुत सी photo डालें, AI सबसे अच्छी चुनेगा" },

  // ऑफ़र और मौक़े
  { id: "mega",      group: "ऑफ़र",   icon: "🔥", name: "Mega Offer",     desc: "बड़ा धमाकेदार ऑफ़र poster" },
  { id: "booking",   group: "ऑफ़र",   icon: "📋", name: "बुकिंग के फ़ायदे", desc: "अभी बुक करने पर क्या मिलेगा" },
  { id: "luckydraw", group: "ऑफ़र",   icon: "🎉", name: "Lucky Draw",     desc: "इनाम वाली स्कीम का poster" },
  { id: "compare",   group: "ऑफ़र",   icon: "⚖️", name: "तुलना वाला",     desc: "तालिका के साथ — हम बनाम बाक़ी कंपनियाँ" },
  { id: "multibike", group: "ऑफ़र",   icon: "🏁", name: "कई गाड़ियाँ साथ",  desc: "एक ही poster में 3–5 model" },
  { id: "hiring",    group: "ऑफ़र",   icon: "💼", name: "भर्ती",          desc: "स्टाफ़ चाहिए — We Are Hiring" },

  // वीडियो और आवाज़
  { id: "video",     group: "वीडियो", icon: "🎬", name: "Video बनाएँ",    desc: "photos से अपने आप छोटा video" },
  { id: "voice",     group: "वीडियो", icon: "🎙️", name: "आवाज़ जोड़ें",    desc: "AI script लिखे, आवाज़ में बोले" },
  { id: "announce",  group: "वीडियो", icon: "🔊", name: "अनाउंसमेंट",     desc: "लिखिए → ढोल-music के साथ आवाज़ बने, माइक पर बजाइए" },

  // थोक में / अपने आप
  { id: "automkt",   group: "थोक",   icon: "🚀", name: "पूरे हफ़्ते का plan", desc: "एक button — 7 दिन की posts तैयार" },
  { id: "engine",    group: "थोक",   icon: "⚡", name: "एक साथ कई",      desc: "batch, और घटना होते ही अपने आप post" },
  { id: "platform",  group: "थोक",   icon: "📱", name: "हर platform का version", desc: "एक caption → FB, IG, YT अलग-अलग" },
  { id: "news",      group: "थोक",   icon: "📰", name: "ख़बर से post",    desc: "भरोसेमंद sources से गाड़ी की ख़बर" },
];

const GROUPS = ["रोज़", "ऑफ़र", "वीडियो", "थोक"];

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

// ---------------------------------------------------------------- STUDIO
export default function Studio({ apiBase, token, brandId, accent, isAdmin, onChange }) {
  const [open, setOpen] = useState(null);   // कौन-सा साँचा खुला है

  const P = { apiBase, token, brandId, onSent: onChange };

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
        <button onClick={() => { vib(); setOpen(null); }}
          className="flex items-center gap-2 text-sm text-neutral-400 py-1">
          <span className="text-lg leading-none">‹</span> सब साँचे
        </button>
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

      {/* सबसे तेज़ रास्ता — बोलकर या लिखकर बता दें */}
      <div>
        <Title>सबसे तेज़ — बस बता दें</Title>
        <AICommandCenter apiBase={apiBase} token={token} brandId={brandId} onSent={onChange} />
      </div>

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
