// ============================================================================
//  Studio.jsx — "बनाओ"
//  ---------------------------------------------------------------------------
//  पहले क्या था: खुलते ही 15 डिब्बों की जाली। हर डिब्बा एक अलग पन्ना। हर पन्ने
//  में अलग form. एक post बनाने के लिए — डिब्बा चुनो, form भरो, बनाओ, फिर "आज"
//  पन्ने पर जाओ, वहाँ ढूँढो, तब हाँ करो। पाँच जगह घूमना पड़ता था।
//
//  अब क्या है: एक डिब्बा। बोलिए या लिखिए —
//     "आज Honda Shine का कम डाउन पेमेंट वाला ऑफर बनाओ"
//  और बाक़ी सब अपने आप:
//     समझा → गाड़ी की असली क़ीमत उठाई → text लिखा → क़ीमत database से मिलाई
//     → poster बनाया → ग़लती जाँची → हर platform का caption → आवाज़ का script
//
//  हर क़दम आँखों के सामने बनता दिखता है। बन जाने पर poster, caption और
//  "हाँ, भेज दो" का बटन — सब यहीं। कहीं जाना नहीं पड़ता।
//
//  ⚠️ पुराने 15 साँचे हटाए नहीं गए। नीचे "हाथ से बनाना है?" में बन्द रखे हैं।
//     जिस दिन किसी ख़ास चीज़ की ज़रूरत पड़े, वहाँ से खुल जाएँगे। कुछ टूटा नहीं।
// ============================================================================

import React, { useEffect, useRef, useState } from "react";
import { api, media, vib, Err, Fold, nativeShare } from "./shared.jsx";
import { getBrand } from "./brands.js";

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
import AIPosterCanvas from "./AIPosterCanvas.jsx";

// ── हाथ वाले साँचे — अब बन्द तहख़ाने में, पर पूरे के पूरे मौजूद ─────────────
const TEMPLATES = [
  { id: "promo",     icon: "🏍️", name: "गाड़ी का विज्ञापन", desc: "क़ीमत, डाउन पेमेंट, फ़ीचर" },
  { id: "delivery",  icon: "🎥", name: "Delivery post",   desc: "ग्राहक की photo से बधाई" },
  { id: "aideliv",   icon: "📸", name: "कई photo → post", desc: "AI सबसे अच्छी चुनेगा" },
  { id: "mega",      icon: "🔥", name: "Mega Offer",      desc: "बड़ा धमाकेदार ऑफ़र" },
  { id: "booking",   icon: "📋", name: "बुकिंग के फ़ायदे",  desc: "अभी बुक करने पर क्या" },
  { id: "luckydraw", icon: "🎉", name: "Lucky Draw",      desc: "इनाम वाली स्कीम" },
  { id: "multibike", icon: "🏁", name: "कई गाड़ियाँ साथ",   desc: "एक poster में 3–5 model" },
  { id: "hiring",    icon: "💼", name: "भर्ती",           desc: "We Are Hiring" },
  { id: "video",     icon: "🎬", name: "Video बनाएँ",     desc: "photos से छोटा video" },
  { id: "voice",     icon: "🎙️", name: "आवाज़ जोड़ें",     desc: "AI बोलकर सुनाए" },
  { id: "automkt",   icon: "🚀", name: "हफ़्ते भर का plan", desc: "7 दिन की posts" },
  { id: "engine",    icon: "⚡", name: "एक साथ कई",       desc: "batch + अपने-आप" },
  { id: "platform",  icon: "📱", name: "हर platform अलग",  desc: "FB, IG, YT versions" },
  { id: "news",      icon: "📰", name: "ख़बर से post",     desc: "भरोसेमंद sources" },
];

// ── क़दम का निशान ───────────────────────────────────────────────────────────
const MARK = { wait: "○", run: "◍", ok: "✓", warn: "!", fail: "✕", skip: "–" };
const MARK_COLOR = {
  wait: "#525252", run: "#F59E0B", ok: "#10B981",
  warn: "#F59E0B", fail: "#EF4444", skip: "#404040",
};

function Step({ s }) {
  const c = MARK_COLOR[s.status] || "#525252";
  return (
    <div className="flex items-start gap-2.5 py-1">
      <span
        className="text-sm font-bold w-4 text-center flex-shrink-0 leading-5"
        style={{ color: c, animation: s.status === "run" ? "pulse 1.2s infinite" : "none" }}
      >
        {MARK[s.status] || "○"}
      </span>
      <span className="flex-1 min-w-0">
        <span
          className="block text-[13px] leading-5"
          style={{ color: s.status === "wait" ? "#525252" : "#e5e5e5" }}
        >
          {s.label}
        </span>
        {s.detail && <span className="block text-[11px] text-neutral-500 leading-snug">{s.detail}</span>}
      </span>
    </div>
  );
}

// ── बना हुआ caption दिखाने का ख़ाना ────────────────────────────────────────
const PLAT = [
  ["whatsapp", "WhatsApp", "💬"],
  ["instagram", "Instagram", "📷"],
  ["facebook", "Facebook", "👥"],
  ["youtube", "YouTube", "▶️"],
  ["status", "Status", "🟢"],
];

function Captions({ caps, accent }) {
  const [tab, setTab] = useState("whatsapp");
  const [copied, setCopied] = useState("");
  if (!caps) return null;

  const have = PLAT.filter(([k]) => caps[k] && (caps[k].text || typeof caps[k] === "string"));
  if (!have.length) return null;

  const cur = caps[tab];
  const body = typeof cur === "string" ? cur : cur?.text || "";
  const tags = (cur && cur.hashtags) || [];
  const full = body + (tags.length ? "\n\n" + tags.join(" ") : "");

  function copy() {
    vib(30);
    try {
      navigator.clipboard.writeText(full);
      setCopied(tab);
      setTimeout(() => setCopied(""), 1800);
    } catch (_) {}
  }

  return (
    <div className="rounded-2xl bg-neutral-900 border border-neutral-800 overflow-hidden">
      <div className="flex overflow-x-auto border-b border-neutral-800">
        {have.map(([k, label, ic]) => (
          <button
            key={k}
            onClick={() => { vib(15); setTab(k); }}
            className="px-3 py-2.5 text-[11px] whitespace-nowrap flex-shrink-0"
            style={{
              color: tab === k ? accent : "#737373",
              borderBottom: tab === k ? `2px solid ${accent}` : "2px solid transparent",
              fontWeight: tab === k ? 600 : 400,
            }}
          >
            {ic} {label}
          </button>
        ))}
      </div>
      <div className="p-3">
        <p className="text-[13px] text-neutral-200 whitespace-pre-wrap leading-relaxed">{body}</p>
        {tags.length > 0 && <p className="text-[11px] text-blue-400 mt-2 leading-relaxed">{tags.join(" ")}</p>}
        <button
          onClick={copy}
          className="mt-3 w-full rounded-lg py-2 text-xs font-semibold border border-neutral-700 text-neutral-300 active:bg-neutral-800"
        >
          {copied === tab ? "✓ कॉपी हो गया" : "📋 कॉपी करें"}
        </button>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
//  STUDIO
// ═══════════════════════════════════════════════════════════════════════════
export default function Studio({ apiBase, token, brandId, accent, onChange, setSec }) {
  const B = getBrand(brandId);

  const [command, setCommand] = useState("");
  const [listening, setListening] = useState(false);
  const [camp, setCamp] = useState(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(null);      // हाथ वाला साँचा
  const [spec, setSpec] = useState(null);      // AI का बनाया poster design
  const [sched, setSched] = useState([]);      // तय की हुई posts

  const recogRef = useRef(null);
  const pollRef = useRef(null);
  const triesRef = useRef(0);

  const P = { apiBase, token, brandId, onSent: onChange };

  const examples = [
    `आज ${B.products[0]} का कम डाउन पेमेंट वाला ऑफर बनाओ`,
    "कल के लिए सुविचार बना दो",
    `${B.products[1] || B.products[0]} पर कैशबैक वाला poster`,
    "इस हफ़्ते का त्यौहार पोस्ट बनाओ",
  ];

  // ── बोलकर बताना ──────────────────────────────────────────────────────
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const r = new SR();
    r.lang = "hi-IN";
    r.continuous = false;
    r.interimResults = true;
    r.onresult = (e) => {
      let t = "";
      for (let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript;
      setCommand(t);
    };
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); setNote("आवाज़ समझ नहीं आई — लिखकर बता दें"); };
    recogRef.current = r;
    return () => { try { r.abort(); } catch (_) {} };
  }, []);

  function mic() {
    if (listening) {
      vib(20);
      try { recogRef.current?.stop(); } catch (_) {}
      setListening(false);
      return;
    }
    if (!recogRef.current) { setNote("इस फ़ोन में बोलने वाली सुविधा नहीं है — लिखकर बता दें"); return; }
    vib(40);
    setCommand("");
    setListening(true);
    try { recogRef.current.start(); } catch (_) {}
  }

  // ── हालत पूछते रहो — पर समझदारी से ────────────────────────────────────
  //    tab पीछे गया तो पूछना बन्द, सामने आते ही एक बार तुरन्त।
  //    200 बार से ज़्यादा कभी नहीं — अटका हुआ काम रात भर server नहीं जगाएगा।
  function stopPoll() {
    clearInterval(pollRef.current);
    pollRef.current = null;
  }

  function startPoll(id) {
    stopPoll();
    triesRef.current = 0;

    const tick = async () => {
      if (document.hidden) return;
      triesRef.current++;
      if (triesRef.current > 200) {
        stopPoll();
        setBusy(false);
        setNote("बहुत समय लग रहा है — \"आज\" में जाकर देख लें");
        return;
      }
      try {
        const c = await api(`/api/campaign/${id}`);
        setCamp(c);
        if (["review", "published", "failed", "blocked", "scheduled"].includes(c.status)) {
          stopPoll();
          setBusy(false);
          if (c.status === "published") { vib([30, 30, 60]); setNote("भेज दी गई"); }
          else if (c.status === "review") vib([30, 30, 60]);
          onChange && onChange();
        }
      } catch (_) {}
    };

    tick();
    pollRef.current = setInterval(tick, 2500);
  }

  useEffect(() => {
    const onVis = () => {
      if (!document.hidden && pollRef.current && camp?._id) {
        api(`/api/campaign/${camp._id}`).then(setCamp).catch(() => {});
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [camp?._id]);

  useEffect(() => () => stopPoll(), []);

  // ── एक क्लिक ─────────────────────────────────────────────────────────
  async function go() {
    if (!command.trim() || busy) return;
    vib(60);
    setErr(""); setNote(""); setCamp(null); setBusy(true);
    try {
      const r = await api("/api/campaign/run", {
        method: "POST",
        body: JSON.stringify({ brand: brandId, command: command.trim(), source: "text" }),
      });
      startPoll(r.campaignId);
    } catch (e) {
      setErr(e.message);
      setBusy(false);
    }
  }

  async function approve() {
    if (!camp?.contentId) return;
    vib(50);
    setBusy(true);
    try {
      await api(`/api/content/${camp.contentId}/approve`, { method: "POST" });
      setNote("भेज दी गई");
      setCamp((c) => ({ ...c, status: "published" }));
      onChange && onChange();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  async function drop() {
    if (!camp?._id) return;
    vib([20, 30, 20]);
    setBusy(true);
    try {
      await api(`/api/campaign/${camp._id}/cancel`, { method: "POST" });
      reset();
      onChange && onChange();
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  // ── 🎨 AI ख़ुद poster का design बनाए — आप बदल भी सकें ─────────────────
  //    "बना दो" पूरा काम अपने आप करता है. यह वाला रास्ता तब है जब आप design
  //    अपनी आँख से देखकर ठीक करना चाहें — headline, रंग, offer के डिब्बे.
  async function design() {
    if (!command.trim() || busy) return;
    vib(50);
    setErr(""); setNote(""); setBusy(true);
    try {
      const s = await api("/api/command/poster-spec", {
        method: "POST",
        body: JSON.stringify({ brand: brandId, command: command.trim(), type: "vigyapan" }),
      });
      if (s.error) throw new Error(s.error);
      setSpec(s);
    } catch (e) { setErr(e.message); }
    setBusy(false);
  }

  // ── ⏰ तय की हुई posts ───────────────────────────────────────────────
  async function loadSched() {
    try { setSched(await api(`/api/command/scheduled?brand=${brandId}`)); } catch (_) {}
  }

  async function dropSched(id) {
    vib([20, 30, 20]);
    try {
      await api(`/api/command/scheduled/${id}`, { method: "DELETE" });
      loadSched();
    } catch (e) { setErr(e.message); }
  }

  // ── 🎬 poster से video, फिर उस पर आवाज़ ───────────────────────────────
  //    ⚠️ हर campaign पर अपने आप नहीं बनाते — video भारी काम है और Render का
  //       समय खाता है. जिस post के लिए सचमुच चाहिए, उसी पर एक tap.
  async function makeVideo() {
    if (!camp?.contentId || busy) return;
    vib(50);
    setErr(""); setNote("🎬 video बन रहा है… थोड़ा समय लगेगा"); setBusy(true);
    try {
      const d = await api(`/api/content/${camp.contentId}/video`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      setCamp((c) => ({ ...c, content: { ...(c.content || {}), video: d.video }, assets: { ...c.assets, video: d.video } }));
      setNote("✅ video तैयार");
      vib([30, 30, 60]);
      onChange && onChange();
    } catch (e) { setErr(e.message); setNote(""); }
    setBusy(false);
  }

  async function makeVoice() {
    const script = camp?.assets?.voiceScript;
    if (!camp?.contentId || !script || busy) return;
    vib(50);
    setErr(""); setNote("🎙️ आवाज़ बन रही है…"); setBusy(true);
    try {
      const v = await api("/api/voice/generate", {
        method: "POST",
        body: JSON.stringify({ brand: brandId, script, style: "friendly", contentId: camp.contentId }),
      });
      const voiceId = v.doc?._id || v.id;
      // video हो तो आवाज़ उसी में जोड़ दो
      if (camp.assets?.video && voiceId) {
        try {
          await api("/api/voice/attach", {
            method: "POST",
            body: JSON.stringify({ contentId: camp.contentId, voiceId }),
          });
          setNote("✅ आवाज़ video में जुड़ गई");
        } catch (_) { setNote("✅ आवाज़ बन गई (video में जोड़ना बाक़ी)"); }
      } else {
        setNote("✅ आवाज़ तैयार — पहले video बनाएँ तो उसी में जुड़ जाएगी");
      }
      setCamp((c) => ({ ...c, assets: { ...c.assets, voiceUrl: v.url } }));
      vib([30, 30, 60]);
      onChange && onChange();
    } catch (e) { setErr(e.message); setNote(""); }
    setBusy(false);
  }

  function reset() {
    stopPoll();
    setCamp(null); setCommand(""); setNote(""); setErr(""); setBusy(false); setSpec(null);
  }

  // ── 🎨 AI का design खुला हो → वही पूरा पर्दा ─────────────────────────
  if (spec) {
    return (
      <div className="space-y-3">
        <button onClick={() => { vib(); setSpec(null); }} className="flex items-center gap-2 text-sm text-neutral-400 py-1">
          <span className="text-lg leading-none">‹</span> वापस
        </button>
        {spec.reasoning_hindi && (
          <p className="text-[11px] text-neutral-500 leading-relaxed px-1">
            🎨 AI ने यह design क्यों चुना — {spec.reasoning_hindi}
          </p>
        )}
        <AIPosterCanvas
          apiBase={apiBase}
          token={token}
          brandId={brandId}
          spec={spec}
          dealerName={B.name}
          dealerSub={B.address || B.sub}
          phone={B.phone}
          onSent={() => { onChange && onChange(); setSpec(null); setCommand(""); }}
          onBack={() => setSpec(null)}
        />
      </div>
    );
  }

  // ── हाथ वाला साँचा खुला हो → वही पूरा पर्दा ──────────────────────────
  if (open) {
    const t = TEMPLATES.find((x) => x.id === open);
    const RENDER = {
      promo: <PromoEditor {...P} />,
      delivery: <DeliveryEditor {...P} />,
      aideliv: <AIDelivery {...P} />,
      mega: <MegaOfferEditor {...P} />,
      booking: <BookingEditor {...P} />,
      luckydraw: <LuckyDrawEditor {...P} />,
      multibike: <MultibikeEditor {...P} />,
      hiring: <HiringEditor {...P} />,
      video: <AIVideo {...P} />,
      voice: <AIVoice {...P} />,
      automkt: <AutoMarketing {...P} />,
      engine: <AutoEngine {...P} />,
      platform: <AIStudio {...P} />,
      news: <AINews {...P} />,
    };
    return (
      <div className="space-y-3">
        <button onClick={() => { vib(); setOpen(null); }} className="flex items-center gap-2 text-sm text-neutral-400 py-1">
          <span className="text-lg leading-none">‹</span> वापस
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

  const running = busy || camp?.status === "running";
  const doneOk = camp && (camp.status === "review" || camp.status === "published");
  const blocked = camp && (camp.status === "blocked" || camp.status === "failed");
  const poster = camp?.assets?.poster || camp?.content?.images?.square;

  // ═════════════════════════════════════════════════════════════════════
  return (
    <div className="space-y-4">
      <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.35}}`}</style>

      <Err onClose={() => setErr("")}>{err}</Err>

      {/* ── एक ही डिब्बा ─────────────────────────────────────────── */}
      {!camp && (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4 space-y-3">
          <div>
            <h2 className="text-base font-semibold text-neutral-100">क्या बनाना है?</h2>
            <p className="text-[11px] text-neutral-500 mt-0.5">
              बोल दीजिए या लिख दीजिए — poster, caption, आवाज़, सब एक साथ बन जाएगा
            </p>
          </div>

          <textarea
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            rows={3}
            placeholder={"जैसे — आज Shine का कम डाउन पेमेंट वाला ऑफर बनाओ"}
            className="w-full bg-neutral-800 rounded-xl p-3 text-sm outline-none resize-none text-white border border-neutral-700 placeholder:text-neutral-600"
          />

          <div className="flex gap-2">
            <button
              onClick={mic}
              className="rounded-xl px-4 py-3.5 text-lg border flex-shrink-0"
              style={{
                borderColor: listening ? "#EF4444" : "#404040",
                background: listening ? "#EF444422" : "transparent",
                animation: listening ? "pulse 1s infinite" : "none",
              }}
            >
              {listening ? "⏹" : "🎙️"}
            </button>
            <button
              onClick={go}
              disabled={!command.trim() || busy}
              style={{ background: accent }}
              className="flex-1 rounded-xl py-3.5 font-semibold text-white disabled:opacity-40"
            >
              ✨ बना दो
            </button>
          </div>

          {listening && <p className="text-xs text-red-400 text-center">सुन रहा हूँ… बोलिए</p>}
          {note && <p className="text-xs text-neutral-400 text-center">{note}</p>}

          {/* design अपनी आँख से देखना हो तो */}
          <button
            onClick={design}
            disabled={!command.trim() || busy}
            className="w-full rounded-xl py-2.5 text-xs font-semibold border border-neutral-700 text-neutral-300 disabled:opacity-40 active:bg-neutral-800"
          >
            🎨 design ख़ुद देखकर बनाऊँ
          </button>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {examples.map((x) => (
              <button
                key={x}
                onClick={() => { vib(15); setCommand(x); }}
                className="text-[11px] px-2.5 py-1.5 rounded-full border border-neutral-800 text-neutral-500 text-left active:border-neutral-600"
              >
                {x}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── क़दम बनते हुए ─────────────────────────────────────────── */}
      {camp && (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="text-[13px] text-neutral-300 flex-1 min-w-0">
              {camp.command || "बन रहा है"}
            </p>
            {!running && (
              <button onClick={reset} className="text-xs text-neutral-500 flex-shrink-0 underline">
                नया
              </button>
            )}
          </div>
          <div className="border-t border-neutral-800 pt-2">
            {(camp.steps || []).map((s) => <Step key={s.key} s={s} />)}
          </div>
        </div>
      )}

      {/* ── रुक गई — साफ़ बताओ क्यों ──────────────────────────────── */}
      {blocked && (
        <div className="rounded-2xl border border-red-800 bg-red-950/40 p-4 space-y-3">
          <div className="flex items-start gap-2.5">
            <span className="text-xl flex-shrink-0">🛑</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-200">यह post रोक दी गई</p>
              <p className="text-[13px] text-red-100/80 mt-1 leading-relaxed">{camp.stopReason}</p>
            </div>
          </div>

          {camp.truth?.unknown?.length > 0 && (
            <div className="rounded-xl bg-black/30 px-3 py-2.5">
              <p className="text-[11px] text-red-300/70 mb-1">database में ये अंक नहीं मिले:</p>
              <p className="text-sm font-semibold text-red-200">{camp.truth.unknown.join("  ·  ")}</p>
            </div>
          )}

          <p className="text-[11px] text-red-300/60 leading-relaxed">
            ग़लत क़ीमत वाली post ग्राहक तक जाने से बेहतर है कि यहीं रुक जाए।
          </p>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => { vib(); setSec && setSec("settings"); }}
              className="rounded-xl py-2.5 text-xs font-semibold border border-red-700 text-red-200 active:bg-red-900/40"
            >
              गाड़ियाँ ठीक करें
            </button>
            <button
              onClick={reset}
              className="rounded-xl py-2.5 text-xs font-semibold border border-neutral-700 text-neutral-300 active:bg-neutral-800"
            >
              दोबारा कहें
            </button>
          </div>
        </div>
      )}

      {/* ── ⏰ समय तय हो गया ─────────────────────────────────────── */}
      {camp && camp.status === "scheduled" && (
        <div className="rounded-2xl border p-4 text-center" style={{ borderColor: accent + "55", background: accent + "12" }}>
          <div className="text-3xl mb-1.5">⏰</div>
          <p className="text-sm font-semibold text-neutral-100">तय हो गया</p>
          <p className="text-[12px] text-neutral-400 mt-1 leading-relaxed">
            {camp.scheduledFor
              ? new Date(camp.scheduledFor).toLocaleString("hi-IN", { weekday: "long", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })
              : "तय समय"}{" "}
            को अपने आप बनकर "आज" में आ जाएगा
          </p>
          <p className="text-[11px] text-emerald-400/80 mt-2">✓ क़ीमत अभी जाँच ली गई है</p>
          <button onClick={reset} className="text-xs text-neutral-400 underline mt-3">एक और</button>
        </div>
      )}

      {/* ── बन गई — सब कुछ यहीं, कहीं जाना नहीं ──────────────────── */}
      {doneOk && (
        <div className="space-y-3">
          {poster && (
            <div className="rounded-2xl overflow-hidden border border-neutral-800 bg-neutral-900">
              <img src={media(poster)} alt="" className="w-full" />
            </div>
          )}

          {camp.assets?.text && (
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
              <p className="text-[13px] text-neutral-200 whitespace-pre-wrap leading-relaxed">
                {camp.assets.text}
              </p>
            </div>
          )}

          {/* जाँच का नतीजा — भरोसा यहीं बनता है */}
          <div className="flex flex-wrap gap-1.5">
            {camp.truth?.verdict === "pass" && (
              <span className="text-[11px] px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-300">
                ✓ क़ीमत database से मिली
              </span>
            )}
            {camp.quality?.score != null && (
              <span
                className="text-[11px] px-2.5 py-1 rounded-full border"
                style={{
                  borderColor: camp.quality.verdict === "pass" ? "#065f46" : "#78350f",
                  background: camp.quality.verdict === "pass" ? "#022c22" : "#1c1206",
                  color: camp.quality.verdict === "pass" ? "#6ee7b7" : "#fbbf24",
                }}
              >
                जाँच स्कोर {camp.quality.score}
              </span>
            )}
          </div>

          {camp.quality?.issues?.length > 0 && (
            <div className="rounded-2xl border border-amber-900 bg-amber-950/30 px-3 py-2.5 space-y-1">
              {camp.quality.issues.slice(0, 3).map((i, n) => (
                <p key={n} className="text-[12px] text-amber-200/90 leading-snug">
                  • {i.issue_hindi}
                </p>
              ))}
            </div>
          )}

          <Captions caps={camp.assets?.captions} accent={accent} />

          {/* ── 🎬 चाहें तो video और आवाज़ भी ────────────────────── */}
          {camp.status === "review" && (
            <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3">
              <p className="text-[11px] text-neutral-500 mb-2 leading-relaxed">
                Reel बनानी हो तो — poster से video, फिर उस पर आवाज़। हर post पर ज़रूरी नहीं।
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={makeVideo}
                  disabled={busy || !!camp.assets?.video}
                  className="rounded-xl py-2.5 text-xs font-semibold border border-neutral-700 text-neutral-300 disabled:opacity-40 active:bg-neutral-800"
                >
                  {camp.assets?.video ? "✓ video बन गया" : "🎬 Video बनाएँ"}
                </button>
                <button
                  onClick={makeVoice}
                  disabled={busy || !camp.assets?.voiceScript || !!camp.assets?.voiceUrl}
                  className="rounded-xl py-2.5 text-xs font-semibold border border-neutral-700 text-neutral-300 disabled:opacity-40 active:bg-neutral-800"
                >
                  {camp.assets?.voiceUrl ? "✓ आवाज़ बन गई" : "🎙️ आवाज़ जोड़ें"}
                </button>
              </div>
            </div>
          )}

          {camp.assets?.video && (
            <video src={media(camp.assets.video)} controls className="w-full rounded-2xl bg-black border border-neutral-800" />
          )}

          {camp.assets?.voiceUrl && !camp.assets?.video && (
            <audio src={media(camp.assets.voiceUrl)} controls className="w-full" />
          )}

          {camp.assets?.voiceScript && (
            <Fold icon="🎙️" title="आवाज़ का script" sub="video में डालने के लिए तैयार">
              <p className="text-[13px] text-neutral-300 whitespace-pre-wrap leading-relaxed pt-2">
                {camp.assets.voiceScript}
              </p>
            </Fold>
          )}

          {/* ⭐ हाँ यहीं से — "आज" पन्ने तक जाने की ज़रूरत नहीं */}
          {camp.status === "review" ? (
            <div className="space-y-2">
              <button
                onClick={approve}
                disabled={busy}
                style={{ background: accent }}
                className="w-full rounded-xl py-3.5 font-semibold text-white disabled:opacity-50"
              >
                {busy ? "भेज रहे हैं…" : "✅ हाँ, भेज दो"}
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => { vib(); nativeShare(camp.content || { images: { square: poster }, text: camp.assets?.text }, B.name); }}
                  className="rounded-xl py-2.5 text-xs font-semibold border border-neutral-700 text-neutral-300 active:bg-neutral-800"
                >
                  📤 ख़ुद भेजें
                </button>
                <button
                  onClick={drop}
                  disabled={busy}
                  className="rounded-xl py-2.5 text-xs font-semibold border border-neutral-800 text-red-400 active:bg-red-900/20 disabled:opacity-40"
                >
                  🗑 हटाएँ
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-emerald-800 bg-emerald-950/30 px-4 py-3 text-center">
              <p className="text-sm text-emerald-300 font-semibold">✓ भेज दी गई</p>
              <button onClick={reset} className="text-xs text-emerald-400/70 underline mt-1">
                एक और बनाएँ
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── ⏰ तय की हुई posts ────────────────────────────────────── */}
      {!camp && (
        <Fold icon="⏰" title="तय की हुई posts" sub="जो आगे अपने आप बनेंगी">
          <div className="pt-2 space-y-2">
            <button onClick={() => { vib(15); loadSched(); }}
              className="w-full rounded-lg py-2 text-xs border border-neutral-700 text-neutral-400">
              देखें / ताज़ा करें
            </button>
            {sched.length === 0 ? (
              <p className="text-[11px] text-neutral-600 text-center py-2">
                कुछ तय नहीं है। ऊपर "कल सुबह 9 बजे सुविचार बना दो" जैसा कहकर तय कर सकते हैं।
              </p>
            ) : sched.map((s) => (
              <div key={s._id} className="flex items-start gap-2 rounded-xl bg-neutral-800/60 border border-neutral-700 px-3 py-2.5">
                <span className="flex-1 min-w-0">
                  <span className="block text-[12px] text-neutral-200 line-clamp-2">{s.text}</span>
                  <span className="block text-[11px] text-neutral-500 mt-0.5">
                    {s.scheduleDate || s.scheduleWhen} · {s.scheduleTime}
                    {s.recurring ? ` · ${s.recurring === "daily" ? "हर दिन" : "हर हफ़्ते"}` : ""}
                  </span>
                </span>
                <button onClick={() => dropSched(s._id)}
                  className="text-[11px] text-red-400 flex-shrink-0 px-1">हटाएँ</button>
              </div>
            ))}
          </div>
        </Fold>
      )}

      {/* ── पुराने साँचे — बन्द, पर पूरे मौजूद ────────────────────── */}
      {!camp && (
        <Fold icon="🛠️" title="हाथ से बनाना है?" sub="Mega Offer, Delivery, Video, भर्ती — 14 साँचे">
          <div className="grid grid-cols-2 gap-2 pt-2">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => { vib(); setOpen(t.id); }}
                className="text-left rounded-xl bg-neutral-800/60 border border-neutral-700 p-3 active:border-neutral-500"
              >
                <div className="text-xl mb-1">{t.icon}</div>
                <div className="text-[13px] font-medium text-neutral-100 leading-tight">{t.name}</div>
                <div className="text-[10px] text-neutral-500 mt-0.5 leading-snug">{t.desc}</div>
              </button>
            ))}
          </div>
        </Fold>
      )}
    </div>
  );
}
