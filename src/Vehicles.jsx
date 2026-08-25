// ============================================================================
//  Vehicles.jsx — गाड़ियों की जानकारी + हर गाड़ी की अपनी photo
//  ---------------------------------------------------------------------------
//  ⚠️ पहले क्या दिक़्क़त थी:
//
//     गाड़ी का record (नाम, क़ीमत, EMI) यहाँ बनता था — पर उसमें photo का कोई
//     ख़ाना ही नहीं था। photos एक अलग "library" में पड़ी रहती थीं जिनका किसी
//     गाड़ी से नाता नहीं था।
//
//     नतीजा: poster बनाते समय गाड़ी चुनने पर सिर्फ़ नाम मिलता था। photo हर
//     बार हाथ से ढूँढकर डालनी पड़ती थी — वही काम रोज़ दोबारा।
//
//  ✅ अब: photo गाड़ी के अपने record में बैठती है। एक बार डालिए, हमेशा के लिए।
//     बदलनी हो तभी बदलिए। कोई भी poster बनाते समय गाड़ी चुनते ही photo और
//     पूरा ब्यौरा दोनों अपने आप आ जाएँगे।
// ============================================================================

import React, { useState, useEffect, useRef } from "react";

const vib = (ms = 40) => { try { navigator.vibrate && navigator.vibrate(ms); } catch (_) {} };

const BRAND_LABELS = { vp_honda: "VP Honda", yakuza: "Yakuza EV", minimetro: "Mini Metro" };
const CATEGORIES = [
  { v: "motorcycle", label: "🏍️ मोटरसाइकिल" },
  { v: "scooter",    label: "🛵 स्कूटर" },
  { v: "ev",         label: "⚡ EV" },
  { v: "auto",       label: "🛺 ऑटो" },
];

const EMPTY = {
  brand: "vp_honda", name: "", variant: "", category: "motorcycle",
  exShowroom: "", onRoad: "", downPayment: "", emi: "", emiTenure: "", roi: "",
  cashback: "", exchangeBonus: "", offerNote: "",
  colors: "", features: "", mileage: "", engine: "", inStock: true,
};

const inp = "w-full bg-neutral-800 border border-neutral-700 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-yellow-500 mt-1";
const lbl = "text-[11px] text-neutral-400";

export default function Vehicles({ apiBase, token, brandId }) {
  const [scope, setScope] = useState(brandId || "vp_honda");
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ ...EMPTY, brand: brandId || "vp_honda" });
  const [editId, setEditId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  // photo से जुड़ी हालत
  const [photoUrl, setPhotoUrl] = useState("");     // सर्वर पर सेव हो चुकी photo
  const [pending, setPending] = useState(null);     // { file, preview } — नई गाड़ी में सेव के बाद जाएगी
  const [upBusy, setUpBusy] = useState(false);
  const fileRef = useRef(null);

  const auth = { Authorization: "Bearer " + token };
  const full = (u) => (u ? (u.startsWith("http") ? u : apiBase + u) : "");

  async function load() {
    setLoading(true);
    try {
      const r = await fetch(`${apiBase}/api/vehicles?brand=${scope}`, { headers: auth });
      const d = await r.json();
      setList(Array.isArray(d) ? d : []);
    } catch (e) { setNote("❌ " + e.message); }
    setLoading(false);
  }

  useEffect(() => { load(); /* eslint-disable-next-line */ }, [scope]);

  // preview के लिए बनाया URL छोड़ना ज़रूरी है, वरना memory में पड़ा रहता है
  useEffect(() => () => { if (pending?.preview) URL.revokeObjectURL(pending.preview); }, [pending]);

  function clearPhoto() {
    if (pending?.preview) URL.revokeObjectURL(pending.preview);
    setPending(null); setPhotoUrl("");
  }

  function startAdd() {
    vib(20);
    setForm({ ...EMPTY, brand: scope });
    setEditId(null); setShowForm(true); setNote(""); clearPhoto();
  }

  function startEdit(v) {
    vib(20);
    setForm({
      ...EMPTY, ...v,
      colors: Array.isArray(v.colors) ? v.colors.join(", ") : (v.colors || ""),
      features: Array.isArray(v.features) ? v.features.join(", ") : (v.features || ""),
    });
    setEditId(v._id); setShowForm(true); setNote("");
    if (pending?.preview) URL.revokeObjectURL(pending.preview);
    setPending(null);
    setPhotoUrl(v.imageUrl || "");
  }

  // ── photo चुनना ────────────────────────────────────────────────
  function pickPhoto(e) {
    const f = e.target.files?.[0];
    e.target.value = "";                     // वही file दोबारा चुन सकें
    if (!f) return;
    if (!/^image\//.test(f.type)) { setNote("⚠️ सिर्फ़ तस्वीर चुनें (jpg / png / webp)"); return; }
    if (f.size > 12 * 1024 * 1024) { setNote("⚠️ तस्वीर 12MB से बड़ी है — छोटी करके डालें"); return; }
    vib(20);
    if (pending?.preview) URL.revokeObjectURL(pending.preview);
    const preview = URL.createObjectURL(f);
    setPending({ file: f, preview });
    setNote("");
    // पहले से बनी गाड़ी है तो तुरन्त चढ़ा दो
    if (editId) uploadPhoto(editId, f);
  }

  async function uploadPhoto(id, file) {
    setUpBusy(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const r = await fetch(`${apiBase}/api/vehicles/${id}/photo`, { method: "POST", headers: auth, body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "photo नहीं चढ़ी");
      setPhotoUrl(d.imageUrl);
      if (pending?.preview) URL.revokeObjectURL(pending.preview);
      setPending(null);
      setNote("✅ photo सेव हो गई — अब हमेशा इसी गाड़ी के साथ रहेगी");
      load();
    } catch (e) { setNote("❌ " + e.message); }
    setUpBusy(false);
  }

  async function removePhoto() {
    if (!editId) { clearPhoto(); return; }
    if (!confirm("इस गाड़ी की photo हटा दें?")) return;
    vib([20, 30, 20]);
    try {
      await fetch(`${apiBase}/api/vehicles/${editId}/photo`, { method: "DELETE", headers: auth });
      clearPhoto(); setNote("🗑 photo हटा दी"); load();
    } catch (e) { setNote("❌ " + e.message); }
  }

  async function save() {
    if (!form.name.trim()) { setNote("⚠️ गाड़ी का नाम ज़रूरी है"); return; }
    vib(50); setBusy(true); setNote("");
    try {
      const body = {
        ...form,
        colors: form.colors ? form.colors.split(",").map(s => s.trim()).filter(Boolean) : [],
        features: form.features ? form.features.split(",").map(s => s.trim()).filter(Boolean) : [],
      };
      const url = editId ? `${apiBase}/api/vehicles/${editId}` : `${apiBase}/api/vehicles`;
      const r = await fetch(url, {
        method: editId ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify(body),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Error");

      // नई गाड़ी थी और photo चुनी हुई थी — अब id मिल गई, तो चढ़ा दो
      const newId = d.doc?._id || d._id;
      if (!editId && pending?.file && newId) {
        await uploadPhoto(newId, pending.file);
      }

      setNote(editId ? "✅ अपडेट हो गया" : "✅ गाड़ी जुड़ गई");
      vib([30, 30, 60]);
      setShowForm(false); setEditId(null); clearPhoto();
      load();
    } catch (e) { setNote("❌ " + e.message); }
    setBusy(false);
  }

  async function del(id) {
    vib([20, 30, 20]);
    try {
      await fetch(`${apiBase}/api/vehicles/${id}`, { method: "DELETE", headers: auth });
      load(); setNote("🗑 हटा दिया");
    } catch (e) { setNote("❌ " + e.message); }
  }

  async function toggleStock(v) {
    vib(20);
    try {
      await fetch(`${apiBase}/api/vehicles/${v._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...auth },
        body: JSON.stringify({ inStock: !v.inStock }),
      });
      load();
    } catch (_) {}
  }

  const F = (k) => ({ value: form[k] || "", onChange: (e) => setForm(f => ({ ...f, [k]: e.target.value })) });

  const shownPhoto = pending?.preview || full(photoUrl);
  const withPhoto = list.filter(v => v.imageUrl).length;

  return (
    <div className="space-y-3 pb-10">

      {/* Brand filter */}
      <div className="grid grid-cols-3 gap-1.5">
        {Object.entries(BRAND_LABELS).map(([id, label]) => (
          <button key={id} type="button" onClick={() => { vib(15); setScope(id); }}
            className={`py-2.5 rounded-xl text-xs font-semibold border-2 ${scope === id ? "border-yellow-500 bg-yellow-500/10 text-yellow-400" : "border-neutral-700 text-neutral-400"}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="rounded-xl bg-blue-900/30 border border-blue-800 px-3 py-2">
        <p className="text-[11px] text-blue-300">
          💡 यहाँ जो price/EMI डालेंगे, AI सिर्फ़ वही use करेगा। खाली छोड़ेंगे तो AI कोई number नहीं लिखेगा।
        </p>
      </div>

      {/* कितनी गाड़ियों की photo लगी है — poster की गुणवत्ता इसी पर टिकी है */}
      {list.length > 0 && withPhoto < list.length && (
        <div className="rounded-xl bg-amber-900/25 border border-amber-800 px-3 py-2">
          <p className="text-[11px] text-amber-300">
            📷 {list.length} में से {withPhoto} गाड़ियों की photo लगी है।
            बाक़ी {list.length - withPhoto} में photo डाल दें — फिर poster बनाते समय गाड़ी चुनते ही
            उसकी तस्वीर अपने आप आ जाएगी, हर बार ढूँढनी नहीं पड़ेगी।
          </p>
        </div>
      )}

      {note && (
        <div className={`rounded-xl px-4 py-3 text-sm font-semibold ${
          note.startsWith("✅") ? "bg-emerald-900/60 text-emerald-300"
          : note.startsWith("⚠️") ? "bg-amber-900/50 text-amber-300"
          : note.startsWith("🗑") ? "bg-neutral-800 text-neutral-300"
          : "bg-red-900/60 text-red-300"}`}>{note}</div>
      )}

      {/* ── FORM ── */}
      {showForm && (
        <div className="rounded-2xl bg-neutral-900 border-2 border-yellow-500 p-4 space-y-2">
          <div className="flex items-center justify-between mb-1">
            <p className="text-sm font-bold text-yellow-400">{editId ? "✏️ बदलें" : "➕ नई गाड़ी"}</p>
            <button type="button" onClick={() => { vib(15); setShowForm(false); setEditId(null); clearPhoto(); }}
              className="text-neutral-500 text-sm">✕</button>
          </div>

          {/* ── गाड़ी की photo ─────────────────────────────────── */}
          <div className="rounded-xl bg-neutral-950 border border-neutral-800 p-3">
            <p className="text-xs font-bold text-white mb-2">📷 गाड़ी की photo</p>

            {shownPhoto ? (
              <div className="space-y-2">
                <div className="relative rounded-xl overflow-hidden bg-neutral-800">
                  <img src={shownPhoto} alt="" className="w-full h-40 object-contain" />
                  {upBusy && (
                    <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                      <span className="text-xs text-yellow-400">चढ़ रही है…</span>
                    </div>
                  )}
                  {!upBusy && pending && !editId && (
                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-amber-600 text-white">
                      गाड़ी सेव करते ही चढ़ जाएगी
                    </span>
                  )}
                  {!upBusy && photoUrl && !pending && (
                    <span className="absolute top-2 left-2 text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white">
                      ✓ सेव है
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { vib(15); fileRef.current?.click(); }} disabled={upBusy}
                    className="rounded-lg py-2 text-xs border border-neutral-700 text-neutral-300 disabled:opacity-40">
                    🔄 दूसरी चुनें
                  </button>
                  <button type="button" onClick={removePhoto} disabled={upBusy}
                    className="rounded-lg py-2 text-xs border border-red-800 text-red-400 disabled:opacity-40">
                    🗑 हटाएँ
                  </button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => { vib(15); fileRef.current?.click(); }}
                className="w-full rounded-xl border-2 border-dashed border-neutral-700 py-6 text-center active:border-yellow-600">
                <div className="text-2xl mb-1 opacity-50">📷</div>
                <p className="text-xs text-neutral-400">इस गाड़ी की photo चुनें</p>
                <p className="text-[10px] text-neutral-600 mt-0.5">एक बार डालें — हमेशा के लिए इसी गाड़ी से जुड़ी रहेगी</p>
              </button>
            )}

            <input ref={fileRef} type="file" accept="image/*" onChange={pickPhoto} className="hidden" />

            <p className="text-[10px] text-neutral-600 mt-2 leading-relaxed">
              बिना background वाली (कटी हुई) photo सबसे अच्छी लगती है। बड़ी तस्वीर अपने आप छोटी कर दी जाती है।
            </p>
          </div>

          <div>
            <p className={lbl}>Brand</p>
            <select value={form.brand} onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} className={inp}>
              {Object.entries(BRAND_LABELS).map(([id, l]) => <option key={id} value={id}>{l}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div><p className={lbl}>गाड़ी का नाम *</p><input {...F("name")} className={inp} placeholder="Shine 100" /></div>
            <div><p className={lbl}>Variant</p><input {...F("variant")} className={inp} placeholder="DLX" /></div>
          </div>

          <div>
            <p className={lbl}>Category</p>
            <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className={inp}>
              {CATEGORIES.map(c => <option key={c.v} value={c.v}>{c.label}</option>)}
            </select>
          </div>

          <p className="text-xs font-bold text-white pt-2">💰 कीमत</p>
          <div className="grid grid-cols-2 gap-2">
            <div><p className={lbl}>Ex-showroom</p><input {...F("exShowroom")} className={inp} placeholder="₹56,900" /></div>
            <div><p className={lbl}>On-road</p><input {...F("onRoad")} className={inp} placeholder="₹68,500" /></div>
          </div>

          <p className="text-xs font-bold text-white pt-2">🏦 फाइनेंस</p>
          <div className="grid grid-cols-2 gap-2">
            <div><p className={lbl}>डाउन पेमेंट</p><input {...F("downPayment")} className={inp} placeholder="₹4,999" /></div>
            <div><p className={lbl}>EMI</p><input {...F("emi")} className={inp} placeholder="₹1,999/माह" /></div>
            <div><p className={lbl}>अवधि</p><input {...F("emiTenure")} className={inp} placeholder="36 महीने" /></div>
            <div><p className={lbl}>ROI</p><input {...F("roi")} className={inp} placeholder="7.99%" /></div>
          </div>

          <p className="text-xs font-bold text-white pt-2">🎁 ऑफर</p>
          <div className="grid grid-cols-2 gap-2">
            <div><p className={lbl}>कैशबैक</p><input {...F("cashback")} className={inp} placeholder="₹5,000" /></div>
            <div><p className={lbl}>एक्सचेंज बोनस</p><input {...F("exchangeBonus")} className={inp} placeholder="₹2,000" /></div>
          </div>
          <div><p className={lbl}>ऑफर नोट</p><input {...F("offerNote")} className={inp} placeholder="दिवाली तक मान्य" /></div>

          <p className="text-xs font-bold text-white pt-2">🔧 विवरण</p>
          <div className="grid grid-cols-2 gap-2">
            <div><p className={lbl}>Engine / Power</p><input {...F("engine")} className={inp} placeholder="100cc" /></div>
            <div><p className={lbl}>माइलेज / रेंज</p><input {...F("mileage")} className={inp} placeholder="65 kmpl" /></div>
          </div>
          <div><p className={lbl}>रंग (comma से अलग)</p><input {...F("colors")} className={inp} placeholder="लाल, काला, नीला" /></div>
          <div><p className={lbl}>खूबियाँ (comma से अलग)</p><input {...F("features")} className={inp} placeholder="Disc Brake, LED, Smart Key" /></div>

          <label className="flex items-center gap-2 pt-2">
            <input type="checkbox" checked={form.inStock} onChange={e => setForm(f => ({ ...f, inStock: e.target.checked }))} className="w-4 h-4 accent-yellow-500" />
            <span className="text-sm text-neutral-300">स्टॉक में है</span>
          </label>

          <button type="button" onClick={save} disabled={busy || upBusy}
            className="w-full rounded-xl py-3 text-sm font-bold text-black disabled:opacity-40 mt-2" style={{ background: "#FFD600" }}>
            {busy ? "सेव कर रहे…" : editId ? "✅ अपडेट करें" : "✅ जोड़ें"}
          </button>
        </div>
      )}

      {!showForm && (
        <button type="button" onClick={startAdd}
          className="w-full rounded-2xl py-3.5 text-sm font-bold text-black" style={{ background: "#FFD600" }}>
          ➕ नई गाड़ी जोड़ें
        </button>
      )}

      {/* ── LIST ── */}
      {loading && <p className="text-center text-xs text-neutral-500 py-4">लोड हो रहा है…</p>}

      {!loading && list.length === 0 && (
        <div className="rounded-2xl bg-neutral-900 border border-neutral-800 p-6 text-center">
          <p className="text-sm text-neutral-400">अभी कोई गाड़ी नहीं जोड़ी</p>
          <p className="text-[11px] text-neutral-600 mt-1">गाड़ियाँ जोड़ने पर AI सही price के साथ posts बनाएगा</p>
        </div>
      )}

      {list.map(v => (
        <div key={v._id} className="rounded-2xl bg-neutral-900 border border-neutral-800 p-3 space-y-2">
          <div className="flex items-start gap-3">

            {/* photo की झलक — एक नज़र में पता चले कि किसकी photo बाक़ी है */}
            <button type="button" onClick={() => startEdit(v)}
              className="w-16 h-16 rounded-xl flex-shrink-0 overflow-hidden bg-neutral-800 border border-neutral-700 flex items-center justify-center">
              {v.imageUrl
                ? <img src={full(v.imageUrl)} alt="" className="w-full h-full object-contain" />
                : <span className="text-[9px] text-neutral-600 text-center leading-tight px-1">photo<br />नहीं</span>}
            </button>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white">
                {v.name}{v.variant ? ` ${v.variant}` : ""}
                {!v.inStock && <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded-full bg-red-900/60 text-red-300">स्टॉक नहीं</span>}
              </p>
              <p className="text-[11px] text-neutral-500">
                {CATEGORIES.find(c => c.v === v.category)?.label || v.category}
                {v.engine ? ` · ${v.engine}` : ""}{v.mileage ? ` · ${v.mileage}` : ""}
              </p>
            </div>

            <div className="flex gap-1 flex-shrink-0">
              <button type="button" onClick={() => toggleStock(v)} className="text-xs px-2 py-1 rounded-lg border border-neutral-700 text-neutral-400">
                {v.inStock ? "📦" : "🚫"}
              </button>
              <button type="button" onClick={() => startEdit(v)} className="text-xs px-2 py-1 rounded-lg border border-neutral-700 text-neutral-300">✏️</button>
              <button type="button" onClick={() => del(v._id)} className="text-xs px-2 py-1 rounded-lg border border-red-800 text-red-400">🗑</button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {v.exShowroom && <span className="text-[10px] px-2 py-1 rounded-full bg-neutral-800 text-neutral-300">Ex: {v.exShowroom}</span>}
            {v.downPayment && <span className="text-[10px] px-2 py-1 rounded-full bg-neutral-800 text-neutral-300">डाउन: {v.downPayment}</span>}
            {v.emi && <span className="text-[10px] px-2 py-1 rounded-full bg-blue-900/40 text-blue-300">EMI: {v.emi}</span>}
            {v.roi && <span className="text-[10px] px-2 py-1 rounded-full bg-neutral-800 text-neutral-300">ROI: {v.roi}</span>}
            {v.cashback && <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-900/40 text-emerald-300">कैशबैक: {v.cashback}</span>}
            {v.exchangeBonus && <span className="text-[10px] px-2 py-1 rounded-full bg-emerald-900/40 text-emerald-300">एक्सचेंज: {v.exchangeBonus}</span>}
          </div>

          {v.offerNote && <p className="text-[10px] text-yellow-400">🎁 {v.offerNote}</p>}
        </div>
      ))}
    </div>
  );
}
