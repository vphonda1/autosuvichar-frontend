// ============================================================================
//  brands.js — तीनों brands का SINGLE SOURCE OF TRUTH (frontend)
//  ⚠️ अब से हर editor/component यहीं से brand की जानकारी ले।
//     पहले हर file में अलग-अलग "VP Honda" hardcoded था — इसलिए Yakuza या
//     Mini Metro चुनने पर भी poster पर VP Honda ही छपता था।
//
//  रंग असली logo files से मिलाए गए हैं:
//    vp_honda  → लाल #E4002B + काला   (logo: VP HONDA गोल बैज)
//    yakuza    → हरा #0EA36A          🌱 green energy — इलेक्ट्रिक वाहन की पहचान
//    minimetro → नेवी #16256B + लाल   (logo: Mini Metro ORIGINAL) ← पहले हल्का नीला था
// ============================================================================

import { useEffect, useRef, useState } from "react";

// ── मालिक का अपना (personal) logo ──────────────────────────────────────
//  तीनों brands के हर poster पर **बाएँ** तरफ़ यही logo आता है।
//  **दाएँ** तरफ़ उस brand की कंपनी का logo (Honda / Yakuza / Mini Metro)।
//  file backend में: public/logos/owner_logo.png
export const OWNER_LOGO = "/logos/owner_logo.png";

export const BRAND_IDS = ["vp_honda", "yakuza", "minimetro"];

export const BRANDS = {
  vp_honda: {
    id: "vp_honda",
    name: "VP Honda",
    sub: "अधिकृत Honda डीलर · मोटरसाइकिल व स्कूटर",
    company: "VP Honda",
    kind: "ice2w",                 // पेट्रोल दोपहिया
    emoji: "🏍️",
    vehicleWord: "गाड़ी",
    oem: "HONDA",
    accent: "#E4002B",
    accent2: "#7A0016",
    gold: "#FFD400",
    phone: "9713394738",
    whatsapp: "9713394738",
    address: "VP Honda, नरसिंहगढ़ रोड, परवलिया सड़क, भोपाल (म.प्र.)",
    addressShort: "परवलिया सड़क, भोपाल",
    logo: "/logos/vp_honda.png",   // backend से serve होता है (apiBase + यह path)
    logoOnLight: false,            // logo खुद गहरा नहीं है — dark bg पर ठीक दिखता है
    products: ["Shine 100", "Shine 125", "SP 125", "Livo", "Activa 6G", "Dio 125", "Unicorn 160"],
    financePartners: ["HDB", "IDFC First", "Shriram", "Bajaj"],
    hashtags: ["#VPHonda", "#Honda", "#Bhopal", "#HondaBhopal"],
    features: ["हाई माइलेज", "ट्यूबलेस टायर", "सेल्फ स्टार्ट", "डिजिटल मीटर", "अलॉय व्हील",
               "LED हेडलाइट", "कॉम्बी ब्रेक", "मोबाइल चार्जिंग", "डिस्क ब्रेक", "BS6 इंजन"],
  },

  yakuza: {
    id: "yakuza",
    name: "Yakuza EV",
    sub: "MD Automobile · इलेक्ट्रिक स्कूटर",
    company: "MD Automobile",
    kind: "ev2w",                  // इलेक्ट्रिक दोपहिया
    emoji: "🛵",
    vehicleWord: "स्कूटर",
    oem: "YAKUZA",
    // 🌱 हरा — यह इलेक्ट्रिक वाहन है, green energy का रंग
    accent: "#0EA36A",
    accent2: "#064E36",
    gold: "#FFD400",
    phone: "9713394738",
    whatsapp: "9713394738",
    address: "MD Automobile, परवलिया सड़क, भोपाल (म.प्र.)",
    addressShort: "परवलिया सड़क, भोपाल",
    logo: "/logos/yakuza.png",
    logoOnLight: false,
    products: ["Yakuza Pro", "Yakuza Lite", "Yakuza Max"],
    financePartners: ["HDB", "IDFC First", "Shriram"],
    hashtags: ["#YakuzaEV", "#ElectricScooter", "#Bhopal", "#MDAutomobile"],
    // ⚠️ EV पर "माइलेज/BS6/पेट्रोल" वाली बातें मत लिखो
    features: ["लंबी रेंज", "फ़ास्ट चार्जिंग", "लिथियम बैटरी", "जीरो पेट्रोल खर्च",
               "डिजिटल मीटर", "LED हेडलाइट", "रिवर्स मोड", "कम मेंटेनेंस",
               "बैटरी वारंटी", "साइलेंट मोटर"],
  },

  minimetro: {
    id: "minimetro",
    name: "Mini Metro",
    sub: "MD Automobile · इलेक्ट्रिक लोडर व सवारी ऑटो",
    company: "MD Automobile",
    kind: "ev3w",                  // इलेक्ट्रिक तिपहिया
    emoji: "🛺",
    vehicleWord: "ऑटो",
    oem: "MINI METRO",
    accent: "#16256B",             // logo की नेवी
    accent2: "#0A1136",
    gold: "#E01F26",               // logo की लाल — trim/highlight के लिए
    phone: "9713394738",
    whatsapp: "9713394738",
    address: "MD Automobile, परवलिया सड़क, भोपाल (म.प्र.)",
    addressShort: "परवलिया सड़क, भोपाल",
    logo: "/logos/minimetro.png",
    logoOnLight: true,             // ⚠️ logo नेवी है — dark bg पर सफ़ेद chip चाहिए
    products: ["Mini Metro सवारी ऑटो", "Mini Metro लोडर"],
    financePartners: ["HDB", "IDFC First", "Shriram"],
    hashtags: ["#MiniMetro", "#EAuto", "#Bhopal", "#MDAutomobile"],
    features: ["ज़्यादा लोड क्षमता", "लंबी रेंज", "मज़बूत चेसिस", "कम चलने का खर्च",
               "फ़ास्ट चार्जिंग", "आरामदायक सीट", "कम मेंटेनेंस", "बैटरी वारंटी"],
  },
};

// पुराने code के साथ compatible रहने के लिए
export const BRAND_LABELS = Object.fromEntries(
  BRAND_IDS.map((id) => [id, BRANDS[id].name])
);
export const BRAND_ADDRESS = Object.fromEntries(
  BRAND_IDS.map((id) => [id, BRANDS[id].address])
);
export const BRAND_LOGOS = Object.fromEntries(
  BRAND_IDS.map((id) => [id, BRANDS[id].logo])
);

// कभी भी सुरक्षित brand object — गलत/खाली id पर भी crash नहीं
export function getBrand(id) {
  return BRANDS[id] || BRANDS.vp_honda;
}

// logo का पूरा URL (backend से आता है)
export function logoUrl(apiBase, id) {
  return (apiBase || "") + getBrand(id).logo;
}

// canvas में logo — crossOrigin ज़रूरी, वरना toDataURL() SecurityError देता है
export function loadLogoImage(apiBase, id) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = logoUrl(apiBase, id);
  });
}

// ============================================================================
//  Canvas helpers — सभी editors यही इस्तेमाल करें
// ============================================================================

// logo को crossOrigin के साथ pre-load करता है।
// ⚠️ बिना crossOrigin के canvas "tainted" हो जाता है और toDataURL()/toBlob()
//    SecurityError फेंकते हैं — इसी वजह से Download व "Review में भेजें" fail होते थे।
export function useBrandLogo(apiBase, brandId) {
  const ref = useRef(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const b = getBrand(brandId);
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { ref.current = img; setTick((k) => k + 1); };
    img.onerror = () => { ref.current = null; setTick((k) => k + 1); };
    img.src = (apiBase || "") + b.logo;
    return () => { img.onload = null; img.onerror = null; };
  }, [apiBase, brandId]);
  return [ref, tick];
}

// logo को canvas पर सही ढंग से बनाओ:
//  • aspect-ratio बनी रहे (Mini Metro logo 3:2 है — चौकोर खींचने पर बिगड़ता था)
//  • गहरे logo (Mini Metro नेवी) के पीछे सफ़ेद chip, वरना dark bg पर दिखता ही नहीं
export function drawBrandLogo(ctx, logoRef, brandId, x, y, box) {
  const img = logoRef && logoRef.current;
  if (!img || !img.naturalWidth) return;
  const b = getBrand(brandId);
  if (b.logoOnLight) {
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.94)";
    const pad = Math.round(box * 0.09), r = Math.round(box * 0.14);
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x - pad, y - pad, box + pad * 2, box + pad * 2, r);
    else ctx.rect(x - pad, y - pad, box + pad * 2, box + pad * 2);
    ctx.fill();
    ctx.restore();
  }
  const k = Math.min(box / img.naturalWidth, box / img.naturalHeight);
  const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
  ctx.drawImage(img, x + (box - dw) / 2, y + (box - dh) / 2, dw, dh);
}

// brand बदलने पर dealer नाम/पता/फ़ोन अपने-आप update — पर user ने खुद बदला हो तो नहीं
export function useBrandDefaults(brandId, apply) {
  const touched = useRef(false);
  useEffect(() => {
    if (touched.current) return;
    apply(getBrand(brandId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brandId]);
  return () => { touched.current = true; };
}

// मालिक का logo pre-load (crossOrigin-safe)
export function useOwnerLogo(apiBase) {
  const ref = useRef(null);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => { ref.current = img; setTick((k) => k + 1); };
    img.onerror = () => { ref.current = null; setTick((k) => k + 1); };  // file न हो तो चुपचाप skip
    img.src = (apiBase || "") + OWNER_LOGO;
    return () => { img.onload = null; img.onerror = null; };
  }, [apiBase]);
  return [ref, tick];
}

// मालिक का logo canvas पर (बाएँ) — गोल है, aspect 1:1
export function drawOwnerLogo(ctx, ownerRef, x, y, box) {
  const img = ownerRef && ownerRef.current;
  if (!img || !img.naturalWidth) return;
  const k = Math.min(box / img.naturalWidth, box / img.naturalHeight);
  const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
  ctx.drawImage(img, x + (box - dw) / 2, y + (box - dh) / 2, dw, dh);
}

// दोनों logo एक साथ — बाएँ मालिक का, दाएँ brand/कंपनी का
export function drawBothLogos(ctx, ownerRef, logoRef, brandId, canvasW, y, box, pad) {
  const m = pad == null ? Math.round(canvasW * 0.018) : pad;
  drawOwnerLogo(ctx, ownerRef, m, y, box);
  drawBrandLogo(ctx, logoRef, brandId, canvasW - m - box, y, box);
}
