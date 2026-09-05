// ============================================================================
//  capabilities.js — app जो कुछ कर सकता है, उसकी एक ही सूची
//  ---------------------------------------------------------------------------
//  ⚠️ असली दिक़्क़त यह थी:
//
//  app में 22 काम हैं और 17 अलग पन्ने। हर पन्ना अपने में तीन चीज़ें एक साथ
//  रखे था — क्या भरना है, तस्वीर कैसे बने, कहाँ भेजना है। इसलिए नया feature
//  जोड़ना मतलब तीनों दोबारा लिखना, यानी एक और नया पन्ना।
//
//  और बोलकर बताने वाले डिब्बे को इनका पता ही नहीं था — उसमें नाम अलग से
//  लिखे थे। एक जगह जोड़ो, दूसरी जगह छूट जाए।
//
//  ✅ अब: सब कुछ इस एक सूची में है। यही सूची तीनों काम करती है —
//        • खोज-पट्टी में क्या दिखे
//        • बोलकर कहने पर क्या समझा जाए
//        • कौन-सा पन्ना खुले
//
//     नया feature = यहाँ एक पंक्ति। और कहीं कुछ नहीं बदलना।
//
//  (यही तरीक़ा Notion, Linear, Figma इस्तेमाल करते हैं — इसे
//   "command palette + registry" कहते हैं।)
// ============================================================================

export const GROUPS = [
  { id: "roz",    label: "रोज़ का काम",   icon: "📅" },
  { id: "offer",  label: "ऑफ़र और स्कीम", icon: "🔥" },
  { id: "media",  label: "वीडियो और आवाज़", icon: "🎬" },
  { id: "bulk",   label: "थोक में / अपने आप", icon: "⚡" },
];

/**
 * हर काम की एक पंक्ति।
 *
 *  id       — पक्का नाम, कभी मत बदलिए (बाक़ी सब इसी से जुड़ा है)
 *  label    — जो पर्दे पर दिखे
 *  desc     — एक लाइन में क्या करता है
 *  words    — बोलकर/लिखकर कहने पर जिन शब्दों से पहचाना जाए
 *  ai       — AI अकेले बना सकता है? (true = बोलते ही बन जाएगा)
 *  manual   — हाथ से बनाने का पन्ना है?
 *  needs    — आपको क्या देना पड़ेगा
 *  autoType — AI वाला हो तो server को कौन-सा type भेजें
 */
export const CAPS = [
  // ── रोज़ का काम ────────────────────────────────────────────
  { id: "suvichar", group: "roz", icon: "✨", label: "सुविचार / शुभप्रभात",
    desc: "रोज़ की प्रेरणा वाली post", ai: true, manual: true, autoType: "suvichar",
    needs: [], words: ["सुविचार", "शुभप्रभात", "शुभ प्रभात", "गुड मॉर्निंग", "प्रेरणा", "मोटिवेशन", "suvichar", "good morning", "quote"] },

  { id: "vigyapan", group: "roz", icon: "🏍️", label: "गाड़ी का विज्ञापन",
    desc: "क़ीमत, EMI, फ़ीचर वाला poster", ai: true, manual: true, autoType: "vigyapan",
    needs: [], words: ["विज्ञापन", "ऑफर", "ऑफ़र", "offer", "क़ीमत", "कीमत", "दाम", "price", "emi", "डाउन पेमेंट", "ad"] },

  { id: "festival", group: "roz", icon: "🎉", label: "त्यौहार की बधाई",
    desc: "दिवाली, होली, गणेश — सजा हुआ poster", ai: true, manual: false, autoType: "festival",
    needs: [], words: ["त्यौहार", "त्योहार", "festival", "बधाई", "शुभकामना", "दिवाली", "होली", "गणेश", "जन्माष्टमी", "नवरात्रि", "दशहरा", "राखी", "ईद"] },

  { id: "suchna", group: "roz", icon: "📌", label: "सूचना",
    desc: "शोरूम बंद/खुलने जैसी ख़बर", ai: true, manual: false, autoType: "suchna",
    needs: [], words: ["सूचना", "जानकारी", "notice", "बंद", "खुला", "छुट्टी", "ऐलान"] },

  { id: "delivery", group: "roz", icon: "🎥", label: "Delivery post",
    desc: "ग्राहक की photo से बधाई वाली post", ai: false, manual: true,
    needs: ["ग्राहक की photo"],
    words: ["डिलीवरी", "डिलिवरी", "delivery", "चाबी", "गाड़ी दी", "गाड़ी सौंपी", "नई गाड़ी मुबारक", "ग्राहक की फोटो", "ग्राहक की photo"] },

  { id: "aideliv", group: "roz", icon: "📸", label: "कई photo → post",
    desc: "बहुत सी photo डालिए, AI सबसे अच्छी चुनेगा", ai: false, manual: true,
    needs: ["3-10 photo"],
    words: ["कई फोटो", "कई photo", "बहुत सी फोटो", "photo से post", "सबसे अच्छी फोटो"] },

  // ── ऑफ़र और स्कीम ─────────────────────────────────────────
  { id: "mega", group: "offer", icon: "🔥", label: "Mega Offer",
    desc: "बड़ा धमाकेदार ऑफ़र poster", ai: false, manual: true, needs: ["1 गाड़ी"],
    words: ["मेगा", "महाबचत", "महा ऑफर", "धमाका", "धमाकेदार", "बड़ा ऑफर", "mega", "बम्पर", "बंपर", "blockbuster"] },

  { id: "booking", group: "offer", icon: "📋", label: "बुकिंग के फ़ायदे",
    desc: "अभी बुक करने पर क्या मिलेगा", ai: false, manual: true, needs: ["1 गाड़ी"],
    words: ["बुकिंग", "बुक", "booking", "एडवांस", "advance", "प्री बुक", "pre book"] },

  { id: "compare", group: "offer", icon: "⚖️", label: "तुलना वाला poster",
    desc: "तालिका के साथ — हम बनाम बाक़ी कंपनियाँ", ai: false, manual: true, needs: ["1-2 गाड़ियाँ"],
    words: ["तुलना", "तुलनात्मक", "मुकाबला", "मुक़ाबला", "compare", "comparison", "बनाम", "vs", "कौन सस्ता", "किसका सस्ता", "दूसरी कंपनी", "सर्विस चार्ज"] },

  { id: "luckydraw", group: "offer", icon: "🎉", label: "Lucky Draw",
    desc: "इनाम वाली स्कीम का poster", ai: false, manual: true, needs: [],
    words: ["लकी", "लक्की", "ड्रॉ", "ड्रा", "lucky", "draw", "इनाम", "कूपन", "कुपन", "स्कीम", "scheme"] },

  { id: "multibike", group: "offer", icon: "🏁", label: "कई गाड़ियाँ साथ",
    desc: "एक ही poster में 3-5 model", ai: false, manual: true, needs: ["3+ गाड़ियाँ"],
    words: ["कई गाड़ी", "कई गाड़ियाँ", "सभी गाड़ी", "सारी गाड़ी", "पूरी रेंज", "range", "multibike", "multi bike", "तीन गाड़ी", "चार गाड़ी"] },

  { id: "gift", group: "offer", icon: "🎁", label: "गिफ़्ट / तोहफ़ा",
    desc: "मुफ़्त गिफ़्ट वाला ऑफ़र", ai: true, manual: false, autoType: "gift",
    needs: [], words: ["गिफ्ट", "गिफ़्ट", "तोहफा", "तोहफ़ा", "gift", "मुफ्त", "मुफ़्त", "free"] },

  { id: "hiring", group: "offer", icon: "💼", label: "भर्ती",
    desc: "स्टाफ़ चाहिए — We Are Hiring", ai: false, manual: true, needs: [],
    words: ["भर्ती", "भरती", "नौकरी", "hiring", "vacancy", "स्टाफ चाहिए", "स्टाफ़ चाहिए", "काम करने वाला", "job"] },

  // ── वीडियो और आवाज़ ────────────────────────────────────────
  { id: "video", group: "media", icon: "🎬", label: "Video बनाएँ",
    desc: "photos से अपने आप छोटा video", ai: false, manual: true, needs: ["3-5 photo"],
    words: ["वीडियो", "विडियो", "video", "रील", "reel", "फोटो से वीडियो", "photo से video", "slideshow"] },

  { id: "announce", group: "media", icon: "🔊", label: "अनाउंसमेंट",
    desc: "लिखिए → ढोल-music के साथ आवाज़ बने", ai: false, manual: true, needs: [],
    words: ["अनाउंस", "अनाउंसमेंट", "announce", "माइक", "भोंपू", "आवाज", "आवाज़", "ऑडियो", "audio", "बोलकर सुनाओ", "स्पीकर"] },

  { id: "voice", group: "media", icon: "🎙️", label: "आवाज़ जोड़ें",
    desc: "AI script लिखे, आवाज़ में बोले", ai: false, manual: true, needs: [],
    words: ["वॉइस", "voice", "script", "स्क्रिप्ट", "आवाज़ जोड़ो", "बोली"] },

  // ── थोक में / अपने आप ─────────────────────────────────────
  { id: "automkt", group: "bulk", icon: "🚀", label: "पूरे हफ़्ते का plan",
    desc: "एक button — 7 दिन की posts तैयार", ai: false, manual: true, needs: [],
    words: ["हफ्ते", "हफ़्ते", "सप्ताह", "week", "प्लान", "plan", "पूरे हफ्ते", "7 दिन"] },

  { id: "engine", group: "bulk", icon: "⚡", label: "एक साथ कई",
    desc: "batch, और घटना होते ही अपने आप post", ai: false, manual: true, needs: [],
    words: ["एक साथ", "batch", "बैच", "अपने आप", "ऑटोमेशन", "automation", "trigger"] },

  { id: "platform", group: "bulk", icon: "📱", label: "हर platform का version",
    desc: "एक caption → FB, IG, YT अलग-अलग", ai: false, manual: true, needs: [],
    words: ["platform", "प्लेटफॉर्म", "version", "वर्जन", "instagram", "facebook", "youtube", "अलग अलग"] },

  { id: "news", group: "bulk", icon: "📰", label: "ख़बर से post",
    desc: "भरोसेमंद sources से गाड़ी की ख़बर", ai: false, manual: true, needs: [],
    words: ["खबर", "ख़बर", "news", "समाचार", "लॉन्च", "launch"] },
];

// ══════════════════════════════════════════════════════════════════════════
//  खोजने और पहचानने का तरीक़ा
// ══════════════════════════════════════════════════════════════════════════

const norm = (s) => String(s || "").toLowerCase().replace(/[़्ािीुूेैोौंँ]/g, "").trim();

/**
 * लिखे/बोले हुए में से सबसे मिलता-जुलता काम ढूँढो।
 * एक से ज़्यादा मिलें तो जिसका मिलान सबसे पक्का हो, वही।
 */
export function matchCap(text) {
  const t = norm(text);
  if (!t) return null;

  // ⚠️ "ऑफर" जैसे आम शब्द कई जगह आते हैं — उन्हें कम भरोसा।
  //    "मेगा", "लकी ड्रॉ", "गिफ़्ट" जैसे ख़ास शब्दों को ज़्यादा।
  //    वरना "मेगा ऑफर" भी सादे विज्ञापन में चला जाता था।
  const AAM = new Set(["ऑफर", "ऑफ़र", "offer", "post", "पोस्ट", "बनाओ", "ad", "price", "दाम"]);

  let best = null, bestScore = 0;
  for (const c of CAPS) {
    let score = 0;
    for (const w of c.words) {
      const nw = norm(w);
      if (!nw || !t.includes(nw)) continue;
      // आम शब्द = आधा भरोसा, ख़ास शब्द = पूरा और ऊपर से बोनस
      score = Math.max(score, AAM.has(norm(w)) ? nw.length * 0.5 : nw.length + 3);
    }
    if (t.includes(norm(c.label))) score = Math.max(score, norm(c.label).length + 4);
    if (score > bestScore) { bestScore = score; best = c; }
  }
  // ⚠️ कुछ भी पक्का न मिले, पर "ऑफर/दाम/क़ीमत" जैसे आम शब्द हों — तो
  //    सादा विज्ञापन ही मान लो। यह सबसे आम आदेश है, इसे छोड़ना ठीक नहीं।
  if (bestScore < 4) {
    const AD = ["ऑफर", "ऑफ़र", "offer", "दाम", "कीमत", "क़ीमत", "price", "emi", "डाउन"];
    if (AD.some((w) => t.includes(norm(w)))) return CAPS.find((c) => c.id === "vigyapan");
    return null;
  }
  return best;
}

/** खोज-पट्टी के लिए — जो भी टाइप करें, उससे मिलते सब काम */
export function searchCaps(q) {
  const t = norm(q);
  if (!t) return CAPS;
  return CAPS
    .map((c) => {
      let s = 0;
      if (norm(c.label).includes(t)) s += 10;
      if (norm(c.desc).includes(t)) s += 4;
      for (const w of c.words) if (norm(w).includes(t)) { s += 6; break; }
      for (const w of c.words) if (t.includes(norm(w)) && norm(w).length >= 3) { s += 8; break; }
      return { c, s };
    })
    .filter((x) => x.s > 0)
    .sort((a, b) => b.s - a.s)
    .map((x) => x.c);
}

export const capById = (id) => CAPS.find((c) => c.id === id) || null;
export const capsByGroup = (g) => CAPS.filter((c) => c.group === g);
